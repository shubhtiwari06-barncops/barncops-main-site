import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleWhatsAppWebhookGet, handleWhatsAppWebhookPost } from "./webhook-handlers.ts";
import { metaAppSecret, signMetaBody, verifyMetaSignature } from "./meta-sig.ts";

const SECRET = "test-meta-app-secret-do-not-use-live";
const BODY = Buffer.from('{"object":"whatsapp_business_account","entry":[]}', "utf8");

function post(headers: Record<string, string>, body: Buffer) {
  return new Request("https://www.barncops.in/api/whatsapp/webhook", {
    method: "POST",
    headers,
    body: new Uint8Array(body),
  });
}

describe("WhatsApp webhook signature", () => {
  it("rejects POST with no signature header (was 200)", async () => {
    process.env.META_APP_SECRET = SECRET;
    const res = await handleWhatsAppWebhookPost(post({ "content-type": "application/json" }, BODY));
    assert.equal(res.status, 401);
    assert.equal(await res.text(), "Unauthorized");
  });

  it("rejects POST with a wrong signature (was 200)", async () => {
    process.env.META_APP_SECRET = SECRET;
    const res = await handleWhatsAppWebhookPost(
      post({ "content-type": "application/json", "x-hub-signature-256": "sha256=deadbeef" }, BODY),
    );
    assert.equal(res.status, 401);
  });

  it("accepts a correctly signed POST (META_APP_SECRET)", async () => {
    process.env.META_APP_SECRET = SECRET;
    delete process.env.WHATSAPP_APP_SECRET;
    const sig = signMetaBody(BODY, SECRET);
    const res = await handleWhatsAppWebhookPost(post({ "content-type": "application/json", "x-hub-signature-256": sig }, BODY));
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "ok");
  });

  it("accepts a correctly signed POST when only WHATSAPP_APP_SECRET is set", async () => {
    delete process.env.META_APP_SECRET;
    process.env.WHATSAPP_APP_SECRET = SECRET;
    const sig = signMetaBody(BODY, SECRET);
    const res = await handleWhatsAppWebhookPost(post({ "content-type": "application/json", "x-hub-signature-256": sig }, BODY));
    assert.equal(res.status, 200);
    const bad = await handleWhatsAppWebhookPost(post({ "content-type": "application/json", "x-hub-signature-256": signMetaBody(BODY, "other") }, BODY));
    assert.equal(bad.status, 401);
    delete process.env.WHATSAPP_APP_SECRET;
  });

  it("META_APP_SECRET wins when both are set", () => {
    assert.equal(metaAppSecret({ META_APP_SECRET: "a", WHATSAPP_APP_SECRET: "b" }), "a");
    assert.equal(metaAppSecret({ META_APP_SECRET: "  ", WHATSAPP_APP_SECRET: "b" }), "b");
  });

  it("neither secret set → 401 for every POST and a loud error log (never accepts unsigned)", async () => {
    delete process.env.META_APP_SECRET;
    delete process.env.WHATSAPP_APP_SECRET;
    const logged: string[] = [];
    const orig = console.error;
    console.error = (...a: unknown[]) => void logged.push(a.map(String).join(" "));
    try {
      const sig = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
      const signed = await handleWhatsAppWebhookPost(post({ "content-type": "application/json", "x-hub-signature-256": sig }, BODY));
      const unsigned = await handleWhatsAppWebhookPost(post({ "content-type": "application/json" }, BODY));
      assert.equal(signed.status, 401);
      assert.equal(unsigned.status, 401);
    } finally {
      console.error = orig;
    }
    assert.ok(logged.some((l) => /SIGNATURE SECRET MISSING/.test(l) && /META_APP_SECRET/.test(l) && /WHATSAPP_APP_SECRET/.test(l)));
    assert.ok(logged.every((l) => !l.includes(SECRET)));
  });

  it("does not treat a hex of the wrong length as a match", () => {
    assert.equal(verifyMetaSignature(BODY, "sha256=aa", SECRET), false);
  });

  it("GET handshake still returns the challenge when the token matches", async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-token-test";
    const url = new URL("https://www.barncops.in/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verify-token-test&hub.challenge=abc123");
    const res = await handleWhatsAppWebhookGet(url);
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "abc123");
  });

  it("GET handshake rejects a wrong token", async () => {
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = "verify-token-test";
    const url = new URL("https://www.barncops.in/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=abc123");
    const res = await handleWhatsAppWebhookGet(url);
    assert.equal(res.status, 403);
  });
});
