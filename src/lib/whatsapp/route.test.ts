import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { handleWhatsAppWebhookPost } from "./webhook-handlers.ts";
import { signMetaBody } from "./meta-sig.ts";
import { atlasSecretCheck, atlasUrlKind, dbHealth, missingEnv, phoneIdCheck } from "./health.ts";
import { COPY, TEAM_BUTTON_ID, counters, memoryStore, routeConfig, sqlStore, tagSource, timingSummary, type AtlasReply, type RouteConfig, type RouteDeps, type Store } from "./route.ts";

const SECRET = "test-meta-app-secret-do-not-use-live";
const TAG = "#BCteam";
export const MIGRATIONS = ["0004_wa_routing.sql", "0005_wa_inbox_timing.sql", "0006_wa_webhook_events.sql"].map((f) => readFileSync(new URL(`../../../migrations/${f}`, import.meta.url), "utf8"));
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

type Sent = { line: string; to: string; body: string; button?: string };

/** A test rig: fake senders and email, a clock, a store, and counts read back from the store. */
type RigOpts = { atlasMs?: number; waitUntil?: (p: Promise<unknown>) => void };

async function rig(kind: "memory" | "sql", env: Record<string, string>, opts: RigOpts = {}) {
  let store: Store;
  let rows: () => Promise<{ seen: number; inquiries: number; entriesIn: number; entriesOut: number }>;
  if (kind === "memory") {
    const m = memoryStore();
    store = m;
    rows = async () => ({
      seen: m.seen.size,
      inquiries: m.inquiries.length,
      entriesIn: m.entries.filter((e) => e.direction === "in").length,
      entriesOut: m.entries.filter((e) => e.direction === "out").length,
    });
  } else {
    const db = new PGlite();
    for (const m of MIGRATIONS) await db.exec(m);
    store = sqlStore((sql, params) => db.query(sql, params as unknown[]) as Promise<{ rows: Array<Record<string, unknown>> }>);
    const n = async (sql: string) => Number(((await db.query(sql)).rows[0] as { n: number }).n);
    rows = async () => ({
      seen: await n("select count(*)::int as n from wa_seen_messages"),
      inquiries: await n("select count(*)::int as n from wa_inquiries"),
      entriesIn: await n("select count(*)::int as n from wa_inquiry_messages where direction = 'in'"),
      entriesOut: await n("select count(*)::int as n from wa_inquiry_messages where direction = 'out'"),
    });
  }
  const cfg: RouteConfig = routeConfig(env);
  const sent: Sent[] = [];
  const emails: Array<{ subject: string; rows: Array<[string, string]> }> = [];
  let clock = Date.parse("2026-10-23T08:00:00Z");
  const deps: RouteDeps = {
    store,
    now: () => clock,
    atlas: async (): Promise<AtlasReply> => {
      if (opts.atlasMs) await new Promise((r) => setTimeout(r, opts.atlasMs));
      return { text: "Atlas answer.", handler: "engine", modelCalls: 1, engineMs: 5 };
    },
    sendText: async (line, to, body) => {
      sent.push({ line, to, body });
    },
    sendButton: async (line, to, body, button) => {
      sent.push({ line, to, body, button });
    },
    email: async (e) => {
      emails.push(e);
    },
  };
  let seq = 0;
  const post = async (payload: unknown) => {
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    const req = new Request("https://www.barncops.in/api/whatsapp/webhook", {
      method: "POST",
      headers: { "content-type": "application/json", "x-hub-signature-256": signMetaBody(body, SECRET) },
      body,
    });
    const res = await handleWhatsAppWebhookPost(req, { deps, cfg, waitUntil: opts.waitUntil || null });
    assert.equal(res.status, 200);
    return res;
  };
  const message = (line: string, from: string, msg: Record<string, unknown>) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "waba", changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: { phone_number_id: line }, contacts: [{ profile: { name: "Test Person" }, wa_id: from }], messages: [{ from, id: `wamid.${++seq}`, timestamp: String(Math.floor(clock / 1000)), ...msg }] } }] }],
  });
  const text = (line: string, from: string, body: string) => message(line, from, { type: "text", text: { body } });
  const tap = (line: string, from: string) =>
    message(line, from, { type: "interactive", interactive: { type: "button_reply", button_reply: { id: TEAM_BUTTON_ID, title: "Talk to the team" } } });
  return {
    store,
    sent,
    emails,
    rows,
    post,
    text,
    tap,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

before(() => {
  process.env.META_APP_SECRET = SECRET;
});

const SHARED = { WA_ASK_ATLAS_PHONE_ID: "111", WA_BUSINESS_PHONE_ID: "111", WA_BUSINESS_TAG: TAG };
const TWO = { WA_ASK_ATLAS_PHONE_ID: "111", WA_BUSINESS_PHONE_ID: "222", WA_BUSINESS_TAG: TAG };
const OLD = "999";

for (const kind of ["memory", "sql"] as const) {
  describe(`WhatsApp routing, shared number (${kind} store)`, () => {
    it("10 Ask Atlas messages → 0 emails, 0 inquiries, 10 answers", async () => {
      const r = await rig(kind, SHARED);
      for (let i = 0; i < 10; i++) {
        await r.post(r.text("111", "919800000001", `bihar ${2000 + i} result`));
        r.advance(30 * 1000);
      }
      const n = await r.rows();
      assert.equal(r.emails.length, 0);
      assert.equal(n.inquiries, 0);
      assert.equal(r.sent.filter((s) => s.body === "Atlas answer.").length, 10);
    });

    it("tagged message + 9 more in 5 min → 1 email, 1 ack, bot silent, 10 thread entries", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000002", `Hello Barnstorm Co-operations, I would like to discuss a confidential mandate. ${TAG}-web`));
      for (let i = 0; i < 9; i++) {
        r.advance(30 * 1000);
        await r.post(r.text("111", "919800000002", i % 2 ? "bihar 2020 result" : "please call me"));
      }
      const n = await r.rows();
      assert.equal(r.emails.length, 1);
      assert.match(r.emails[0].subject, /^\[Business • WhatsApp • web\] \+919800000002/);
      assert.ok(r.emails[0].rows.some(([k, v]) => k === "Reply in the inbox" && v === "https://www.barncops.in/admin/wa-inbox/1"));
      assert.ok(r.emails[0].rows.every(([, v]) => !v.includes("wa.me/")), "no wa.me link to the customer");
      assert.equal(r.sent[0].body, COPY.ack.en);
      assert.ok(r.emails[0].rows.some(([k, v]) => k === "Customer number" && v === "+919800000002"));
      assert.equal(r.sent.length, 1, "only the ack is sent");
      assert.equal(n.inquiries, 1);
      assert.equal(n.entriesIn, 10);
    });

    it("menu tap → 1 email (source menu), then silent", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000003", "hello"));
      assert.ok(r.sent.some((s) => s.button === TEAM_BUTTON_ID), "a non-question gets the Talk to the team button");
      await r.post(r.tap("111", "919800000003"));
      await r.post(r.text("111", "919800000003", "I need help with a campaign"));
      assert.equal(r.emails.length, 1);
      assert.match(r.emails[0].subject, /• menu\]/);
      assert.equal((await r.rows()).inquiries, 1);
    });

    it("a data question gets no team button", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000004", "bihar 2020 result"));
      assert.equal(r.sent.filter((s) => s.button).length, 0);
    });

    it("old-number webhook → 0 rows, 0 sends, 0 emails, counted as ignored_number", async () => {
      const r = await rig(kind, SHARED);
      const before = counters.ignored_number;
      await r.post(r.text(OLD, "919800000005", `hi ${TAG}`));
      const n = await r.rows();
      assert.deepEqual(n, { seen: 0, inquiries: 0, entriesIn: 0, entriesOut: 0 });
      assert.equal(r.sent.length + r.emails.length, 0);
      assert.equal(counters.ignored_number, before + 1);
    });

    it("replayed webhook → 0 new rows, 0 new sends, 0 new emails", async () => {
      const r = await rig(kind, SHARED);
      const tagged = r.text("111", "919800000006", `hi ${TAG}-fb`);
      const atlas = r.text("111", "919800000007", "bihar 2020 result");
      await r.post(tagged);
      await r.post(atlas);
      const n1 = await r.rows();
      const s1 = r.sent.length;
      await r.post(tagged);
      await r.post(atlas);
      assert.deepEqual(await r.rows(), n1);
      assert.equal(r.sent.length, s1);
      assert.equal(r.emails.length, 1);
    });

    it("statuses, echoes, history and account updates → nothing", async () => {
      const r = await rig(kind, SHARED);
      const base = { messaging_product: "whatsapp", metadata: { phone_number_id: "111" } };
      await r.post({ entry: [{ changes: [{ field: "messages", value: { ...base, statuses: [{ id: "wamid.s", status: "read" }] } }] }] });
      for (const field of ["smb_message_echoes", "history", "account_update"]) {
        await r.post({ entry: [{ changes: [{ field, value: { ...base, messages: [{ from: "919800000008", id: `wamid.${field}`, type: "text", text: { body: `hi ${TAG}` } }] } }] }] });
      }
      assert.deepEqual(await r.rows(), { seen: 0, inquiries: 0, entriesIn: 0, entriesOut: 0 });
      assert.equal(r.sent.length + r.emails.length, 0);
    });

    it("after 24 h of inactivity the number is back on Atlas; a new tag opens a new inquiry", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000009", `hi ${TAG}`));
      r.advance(23 * HOUR);
      await r.post(r.text("111", "919800000009", "still there?"));
      r.advance(24 * HOUR + MIN);
      await r.post(r.text("111", "919800000009", "bihar 2020 result"));
      assert.equal(r.sent.at(-1)?.body, "Atlas answer.");
      await r.post(r.text("111", "919800000009", `again ${TAG}-ig`));
      assert.equal(r.emails.length, 2);
      assert.match(r.emails[1].subject, /• ig\]/);
    });

    it("business ack follows the customer's language (Hindi message → Hindi ack)", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000020", `नमस्ते, मुझे टीम से बात करनी है ${TAG}-web`));
      assert.equal(r.sent[0].body, COPY.ack.hi);
      await r.post(r.text("111", "919800000021", `Hello ${TAG}-web`));
      assert.equal(r.sent[1].body, COPY.ack.en);
      assert.match(COPY.ack.en, /name, constituency\/organisation and requirement in one message/);
    });

    it("slow Atlas answer → Checking… first, then the answer; fast answer → no Checking…", async () => {
      const slow = await rig(kind, { ...SHARED, WA_ACK_AFTER_MS: "20" }, { atlasMs: 120 });
      await slow.post(slow.text("111", "919800000022", "bihar 2020 result"));
      assert.deepEqual(slow.sent.map((s) => s.body), [COPY.checking.en, "Atlas answer."]);
      const fast = await rig(kind, { ...SHARED, WA_ACK_AFTER_MS: "500" });
      await fast.post(fast.text("111", "919800000023", "bihar 2020 result"));
      assert.deepEqual(fast.sent.map((s) => s.body), ["Atlas answer."]);
    });

    it("200 is returned before the work; the work runs in waitUntil", async () => {
      const pending: Array<Promise<unknown>> = [];
      const r = await rig(kind, SHARED, { atlasMs: 80, waitUntil: (p) => void pending.push(p) });
      await r.post(r.text("111", "919800000024", "bihar 2020 result"));
      assert.equal(pending.length, 1);
      assert.equal(r.sent.length, 0, "nothing sent before the 200");
      await Promise.all(pending);
      assert.equal(r.sent.at(-1)?.body, "Atlas answer.");
      const replay = r.text("111", "919800000024", "bihar 2020 result");
      await r.post(replay);
      await r.post(replay);
      assert.equal(pending.length, 2, "a replay is dropped before the 200, nothing queued");
    });

    it("one timing row per handled message, no text or number in it", async () => {
      const r = await rig(kind, SHARED);
      await r.post(r.text("111", "919800000025", "bihar 2020 result"));
      await r.post(r.text("111", "919800000026", `hi ${TAG}-web`));
      const rows = await r.store.timings(10);
      assert.equal(rows.length, 2);
      const atlas = rows.find((t) => t.outcome === "atlas")!;
      assert.equal(atlas.modelCalls, 1);
      assert.equal(atlas.engineMs, 5);
      assert.ok(atlas.engineStart != null && atlas.engineEnd != null && atlas.sentAt != null);
      assert.ok(rows.find((t) => t.outcome === "inquiry_opened")!.ackedAt != null);
      const flat = JSON.stringify(rows);
      assert.ok(!flat.includes("bihar") && !flat.includes("919800000025"));
      assert.equal(timingSummary(rows).n, 1);
    });
  });

  describe(`WhatsApp routing, two numbers (${kind} store)`, () => {
    it("Atlas number: 10 messages (one tagged) → engine only, 0 emails", async () => {
      const r = await rig(kind, TWO);
      for (let i = 0; i < 10; i++) await r.post(r.text("111", "919800000010", i === 0 ? `hi ${TAG}-web` : `bihar ${2000 + i}`));
      assert.equal(r.emails.length, 0);
      assert.equal((await r.rows()).inquiries, 0);
      assert.equal(r.sent.filter((s) => s.button).length, 0, "no team button on the Atlas-only number");
      assert.ok(r.sent.every((s) => s.line === "111"));
    });

    it("business number: first message + 9 more in 5 min → 1 email, bot silent", async () => {
      const r = await rig(kind, TWO);
      for (let i = 0; i < 10; i++) {
        await r.post(r.text("222", "919800000011", i === 0 ? "Hello, I want to talk" : `more ${i}`));
        r.advance(30 * 1000);
      }
      assert.equal(r.emails.length, 1);
      assert.match(r.emails[0].subject, /• business-number\]/);
      assert.equal(r.sent.length, 1);
      assert.equal(r.sent[0].line, "222", "the ack goes out from the business number");
      assert.equal((await r.rows()).entriesIn, 10);
    });

    it("business number with a tag keeps its source", async () => {
      const r = await rig(kind, TWO);
      await r.post(r.text("222", "919800000012", `hi ${TAG}-linkedin`));
      assert.match(r.emails[0].subject, /• linkedin\]/);
    });

    it("old number → 0 rows; replay → 0 new rows", async () => {
      const r = await rig(kind, TWO);
      await r.post(r.text(OLD, "919800000013", "hello"));
      assert.deepEqual(await r.rows(), { seen: 0, inquiries: 0, entriesIn: 0, entriesOut: 0 });
      const m = r.text("222", "919800000014", "hello team");
      await r.post(m);
      const n1 = await r.rows();
      await r.post(m);
      assert.deepEqual(await r.rows(), n1);
      assert.equal(r.emails.length, 1);
    });
  });
}

describe("store failure", () => {
  it("a broken database never drops an Atlas answer; replays are still caught in-instance", async () => {
    const db = new PGlite();
    const broken = sqlStore((sql, params) => db.query(sql, params as unknown[]) as Promise<{ rows: Array<Record<string, unknown>> }>);
    const sent: string[] = [];
    const deps: RouteDeps = {
      store: broken,
      now: () => Date.now(),
      atlas: async () => ({ text: "Atlas answer.", handler: "engine", modelCalls: 0, engineMs: 1 }),
      sendText: async (_l, _t, body) => void sent.push(body),
      sendButton: async () => {},
      email: async () => {},
    };
    const cfg = routeConfig(SHARED);
    const payload = {
      entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "111" }, messages: [{ from: "919800000301", id: "wamid.broken1", type: "text", text: { body: "bihar 2020 result" } }] } }] }],
    };
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    const req = () =>
      new Request("https://www.barncops.in/api/whatsapp/webhook", { method: "POST", headers: { "x-hub-signature-256": signMetaBody(body, SECRET) }, body: new Uint8Array(body) });
    assert.equal((await handleWhatsAppWebhookPost(req(), { deps, cfg, waitUntil: null })).status, 200);
    assert.equal((await handleWhatsAppWebhookPost(req(), { deps, cfg, waitUntil: null })).status, 200);
    assert.deepEqual(sent, ["Atlas answer."]);
  });
});

describe("silent-line diagnosis (hotfix)", () => {
  const signed = (payload: unknown) => {
    const body = Buffer.from(JSON.stringify(payload), "utf8");
    return new Request("https://www.barncops.in/api/whatsapp/webhook", {
      method: "POST",
      headers: { "x-hub-signature-256": signMetaBody(body, SECRET) },
      body: new Uint8Array(body),
    });
  };
  const msg = (line: string, id: string, body = "bihar 2020 result") => ({
    entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: line }, messages: [{ from: "919800000401", id, type: "text", text: { body } }] } }] }],
  });
  const make = async (kind: "memory" | "sql", sendResult: unknown = { ok: true }) => {
    let store: Store;
    if (kind === "memory") store = memoryStore();
    else {
      const db = new PGlite();
      for (const m of MIGRATIONS) await db.exec(m);
      store = sqlStore((sql, params) => db.query(sql, params as unknown[]) as Promise<{ rows: Array<Record<string, unknown>> }>);
    }
    const sent: string[] = [];
    const deps: RouteDeps = {
      store,
      now: () => Date.now(),
      atlas: async () => ({ text: "Atlas answer.", handler: "engine", modelCalls: 1, engineMs: 3, atlasStatus: "401>200" }),
      sendText: async (_l, _t, body) => {
        sent.push(body);
        return sendResult;
      },
      sendButton: async () => sendResult,
      email: async () => {},
    };
    return { store, sent, deps };
  };

  for (const kind of ["memory", "sql"] as const) {
    it(`${kind}: a mistyped WA_ASK_ATLAS_PHONE_ID no longer silences the default line; the mismatch is recorded`, async () => {
      const { store, sent, deps } = await make(kind);
      const cfg = routeConfig({ WHATSAPP_PHONE_NUMBER_ID: "111", WA_ASK_ATLAS_PHONE_ID: "919522236699", WA_BUSINESS_PHONE_ID: "919522236699", WA_BUSINESS_TAG: TAG });
      await handleWhatsAppWebhookPost(signed(msg("111", `wamid.mm-${kind}`)), { deps, cfg, waitUntil: null });
      assert.deepEqual(sent, ["Atlas answer."]);
      const h = await store.health(Date.now());
      assert.ok(h.last_config_mismatch_at);
      assert.equal(h.last_ignored_number_at, null);
      assert.equal(h.last_atlas_status, "401>200");
      assert.equal(h.timing_30min.atlas, 1);
      assert.equal(h.last_30min["admitted:default"], 1);
    });

    it(`${kind}: a truly unknown line stays ignored and is recorded with its match kind`, async () => {
      const { store, sent, deps } = await make(kind);
      const cfg = routeConfig({ WHATSAPP_PHONE_NUMBER_ID: "111", WA_ASK_ATLAS_PHONE_ID: "111", WA_BUSINESS_PHONE_ID: "111" });
      await handleWhatsAppWebhookPost(signed(msg("999", `wamid.old-${kind}`)), { deps, cfg, waitUntil: null });
      assert.equal(sent.length, 0);
      const h = await store.health(Date.now());
      assert.ok(h.last_ignored_number_at);
      assert.equal(h.last_30min["ignored_number:none"], 1);
      assert.ok(h.last_webhook_at);
    });

    it(`${kind}: a refused Graph send is recorded as "graph <http> code <n>", without text`, async () => {
      const { store, deps } = await make(kind, { ok: false, status: 401, code: 190, error: "Meta 401: token" });
      const cfg = routeConfig({ WHATSAPP_PHONE_NUMBER_ID: "111" });
      await handleWhatsAppWebhookPost(signed(msg("111", `wamid.sf-${kind}`)), { deps, cfg, waitUntil: null });
      const h = await store.health(Date.now());
      assert.equal(h.last_send_fail, "graph 401 code 190");
      assert.ok(!JSON.stringify(h).includes("bihar"));
      assert.ok(!JSON.stringify(h).includes("919800000401"));
    });
  }

  it("a refused signature is recorded (verdict only)", async () => {
    const { store, deps } = await make("memory");
    const body = new Uint8Array(Buffer.from("{}"));
    const res = await handleWhatsAppWebhookPost(
      new Request("https://www.barncops.in/api/whatsapp/webhook", { method: "POST", headers: { "x-hub-signature-256": "sha256=00" }, body }),
      { deps, waitUntil: null },
    );
    assert.equal(res.status, 401);
    const h = await store.health(Date.now());
    assert.ok(h.last_signature_fail_at);
  });

  it("phone ids are normalised to digits", () => {
    const c = routeConfig({ WHATSAPP_PHONE_NUMBER_ID: " '111' ", WA_ASK_ATLAS_PHONE_ID: "111\n" });
    assert.equal(c.atlasId, "111");
    assert.equal(c.defaultId, "111");
  });

  it("phone id check and Atlas secret check report booleans only", async () => {
    const good = phoneIdCheck({ WHATSAPP_PHONE_NUMBER_ID: "1234567890123", WA_ASK_ATLAS_PHONE_ID: "1234567890123", WA_BUSINESS_PHONE_ID: "1234567890123" });
    assert.equal(good.consistent, true);
    const bad = phoneIdCheck({ WHATSAPP_PHONE_NUMBER_ID: "1234567890123", WA_ASK_ATLAS_PHONE_ID: "+91 95222 36699" });
    assert.equal(bad.consistent, false);
    assert.equal(bad.detail.atlas_digits_only, false);
    assert.ok(!JSON.stringify(bad).includes("95222"));
    const env = { ATLAS_WA_ASK_URL: "https://atlas.barncops.in/api/wa-ask/", ATLAS_WA_SECRET: "x".repeat(32) };
    const as = (status: number) => (async () => new Response("{}", { status })) as unknown as typeof fetch;
    assert.deepEqual(await atlasSecretCheck(env, as(400)), { ok: true, status: "400" });
    assert.deepEqual(await atlasSecretCheck(env, as(401)), { ok: false, status: "401" });
    assert.deepEqual(await atlasSecretCheck({ ...env, ATLAS_WA_SECRET: "" }, as(400)), { ok: false, status: "no_secret" });
  });
});

describe("deploy health (names only)", () => {
  it("missing env names, Atlas host kind, never a value", () => {
    const env = { META_APP_SECRET: "s3cret-value", ATLAS_WA_ASK_URL: "https://atlas.barncops.in/api/wa-ask/" };
    const miss = missingEnv(env);
    assert.ok(!miss.includes("META_APP_SECRET|WHATSAPP_APP_SECRET"));
    assert.ok(miss.includes("ADMIN_INBOX_PASSWORD"));
    assert.ok(!JSON.stringify(miss).includes("s3cret-value"));
    assert.equal(atlasUrlKind(env.ATLAS_WA_ASK_URL), "production");
    assert.equal(atlasUrlKind("https://barncops-atlas-git-main-x.vercel.app/api/wa-ask/"), "not_production");
    assert.equal(atlasUrlKind(""), "unset");
  });

  it("db health lists applied migrations and missing WhatsApp tables", async () => {
    const db = new PGlite();
    const q = (sql: string, params: unknown[]) => db.query(sql, params) as Promise<{ rows: Array<Record<string, unknown>> }>;
    assert.deepEqual((await dbHealth(q)).missing_tables, ["wa_seen_messages", "wa_inquiries", "wa_inquiry_messages", "wa_timing", "wa_webhook_events"]);
    for (const m of MIGRATIONS) await db.exec(m);
    await db.exec(
      "create table _migrations (name text primary key); insert into _migrations values ('0004_wa_routing.sql'), ('0005_wa_inbox_timing.sql'), ('0006_wa_webhook_events.sql')",
    );
    const h = await dbHealth(q);
    assert.deepEqual(h.missing_tables, []);
    assert.deepEqual(h.migrations, ["0004_wa_routing.sql", "0005_wa_inbox_timing.sql", "0006_wa_webhook_events.sql"]);
  });
});

describe("timing summary", () => {
  it("p50/p95 of first reply and full answer from webhook receipt", () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      wamid: `w${i}`,
      phoneNumberId: "111",
      outcome: "atlas",
      receivedAt: 0,
      ackedAt: i >= 18 ? 1200 : null,
      engineStart: 10,
      engineEnd: 100 * (i + 1),
      sentAt: 100 * (i + 1) + 50,
      modelCalls: i % 2,
      engineMs: null,
      handler: "engine",
      background: true,
    }));
    const s = timingSummary(rows);
    assert.equal(s.n, 20);
    assert.equal(s.answer.p50, 1050);
    assert.equal(s.answer.p95, 1950);
    assert.equal(s.first_reply.p95, 1750);
    assert.equal(s.first_reply.p50, 1050);
    assert.equal(s.acked, 2);
    assert.equal(s.model_calls_avg, 0.5);
  });
});

describe("tag source", () => {
  it("reads the source after the tag, any case", () => {
    assert.equal(tagSource(`Hello ${TAG}-web`, TAG), "web");
    assert.equal(tagSource("hello #bcteam-FB", TAG), "fb");
    assert.equal(tagSource(`Hello ${TAG}`, TAG), "wa.me");
    assert.equal(tagSource("hello", TAG), null);
    assert.equal(tagSource(`Hello ${TAG}`, null), null);
  });
});
