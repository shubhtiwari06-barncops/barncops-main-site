import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { handleWhatsAppWebhookPost } from "./webhook-handlers.ts";
import { signMetaBody } from "./meta-sig.ts";
import { TEAM_BUTTON_ID, counters, memoryStore, routeConfig, routeEvent, sqlStore, tagSource, type RouteConfig, type Store } from "./route.ts";

const SECRET = "test-meta-app-secret-do-not-use-live";
const TAG = "#BCteam";
const MIGRATION = readFileSync(new URL("../../../migrations/0004_wa_routing.sql", import.meta.url), "utf8");
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

type Sent = { line: string; to: string; body: string; button?: string };

/** A test rig: fake senders and email, a clock, a store, and counts read back from the store. */
async function rig(kind: "memory" | "sql", env: Record<string, string>) {
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
    await db.exec(MIGRATION);
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
  const deps = {
    store,
    now: () => clock,
    atlas: async () => "Atlas answer.",
    sendText: async (line: string, to: string, body: string) => {
      sent.push({ line, to, body });
    },
    sendButton: async (line: string, to: string, body: string, button: string) => {
      sent.push({ line, to, body, button });
    },
    email: async (e: { subject: string; rows: Array<[string, string]> }) => {
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
    const res = await handleWhatsAppWebhookPost(req, (ev) => routeEvent(ev, deps, cfg));
    assert.equal(res.status, 200);
  };
  const message = (line: string, from: string, msg: Record<string, unknown>) => ({
    object: "whatsapp_business_account",
    entry: [{ id: "waba", changes: [{ field: "messages", value: { messaging_product: "whatsapp", metadata: { phone_number_id: line }, contacts: [{ profile: { name: "Test Person" }, wa_id: from }], messages: [{ from, id: `wamid.${++seq}`, timestamp: String(Math.floor(clock / 1000)), ...msg }] } }] }],
  });
  const text = (line: string, from: string, body: string) => message(line, from, { type: "text", text: { body } });
  const tap = (line: string, from: string) =>
    message(line, from, { type: "interactive", interactive: { type: "button_reply", button_reply: { id: TEAM_BUTTON_ID, title: "Talk to the team" } } });
  return {
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
      assert.ok(r.emails[0].rows.some(([k, v]) => k === "Chat" && v === "https://wa.me/919800000002"));
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

describe("tag source", () => {
  it("reads the source after the tag, any case", () => {
    assert.equal(tagSource(`Hello ${TAG}-web`, TAG), "web");
    assert.equal(tagSource("hello #bcteam-FB", TAG), "fb");
    assert.equal(tagSource(`Hello ${TAG}`, TAG), "wa.me");
    assert.equal(tagSource("hello", TAG), null);
    assert.equal(tagSource(`Hello ${TAG}`, null), null);
  });
});
