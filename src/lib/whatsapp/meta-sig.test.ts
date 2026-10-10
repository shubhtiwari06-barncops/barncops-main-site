import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleWhatsAppWebhookGet, handleWhatsAppWebhookPost } from "./webhook-handlers.ts";
import { signMetaBody, verifyMetaSignature } from "./meta-sig.ts";

const SECRET = "test-meta-app-secret-do-not-use-live";
const BODY = Buffer.from('{"object":"whatsapp_business_account","entry":[]}', "utf8");

function post(headers: Record<string, string>, body: Buffer) {
  return new Request("https://www.barncops.in/api/whatsapp/webhook", {
    method: "POST",
    headers,
    body,
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

  it("accepts a correctly signed POST", async () => {
    process.env.META_APP_SECRET = SECRET;
    const sig = signMetaBody(BODY, SECRET);
    const res = await handleWhatsAppWebhookPost(
      post({ "content-type": "application/json", "x-hub-signature-256": sig }, BODY),
      async () => {},
    );
    assert.equal(res.status, 200);
    assert.equal(await res.text(), "ok");
  });

  it("fails closed when META_APP_SECRET is missing", async () => {
    delete process.env.META_APP_SECRET;
    const sig = "sha256=" + createHmac("sha256", SECRET).update(BODY).digest("hex");
    const res = await handleWhatsAppWebhookPost(
      post({ "content-type": "application/json", "x-hub-signature-256": sig }, BODY),
    );
    assert.equal(res.status, 401);
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
