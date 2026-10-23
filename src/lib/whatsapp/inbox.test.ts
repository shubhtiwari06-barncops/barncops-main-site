import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { BASE, handleInbox, type InboxDeps } from "./inbox.ts";
import { memoryStore, routeConfig, routeEvent, sqlStore, type Email, type RouteDeps, type Store } from "./route.ts";

const PASSWORD = "test-inbox-password-not-live";
const MIGRATIONS = ["0004_wa_routing.sql", "0005_wa_inbox_timing.sql"].map((f) => readFileSync(new URL(`../../../migrations/${f}`, import.meta.url), "utf8"));
const HOUR = 3600 * 1000;
const CFG = routeConfig({ WA_ASK_ATLAS_PHONE_ID: "111", WA_BUSINESS_PHONE_ID: "222", WA_BUSINESS_TAG: "#BCteam" });

async function makeStore(kind: "memory" | "sql"): Promise<Store> {
  if (kind === "memory") return memoryStore();
  const db = new PGlite();
  for (const m of MIGRATIONS) await db.exec(m);
  return sqlStore((sql, params) => db.query(sql, params as unknown[]) as Promise<{ rows: Array<Record<string, unknown>> }>);
}

async function rig(kind: "memory" | "sql", env: Record<string, string | undefined> = {}) {
  const store = await makeStore(kind);
  let clock = Date.parse("2026-10-23T08:00:00Z");
  const texts: Array<{ line: string; to: string; body: string }> = [];
  const templates: Array<{ line: string; to: string; name: string; lang: string }> = [];
  const emails: Email[] = [];
  let sendOk = true;
  let logins = 0;
  const deps: InboxDeps = {
    store,
    now: () => clock,
    env: { ADMIN_INBOX_PASSWORD: PASSWORD, WA_REPLY_TEMPLATE: "barnstorm_follow_up", WA_REPLY_TEMPLATE_LANG: "en", ...env },
    sendText: async (line, to, body) => {
      if (!sendOk) return { ok: false, error: "Meta 400: test" };
      texts.push({ line, to, body });
      return { ok: true };
    },
    sendTemplate: async (line, to, name, lang) => {
      templates.push({ line, to, name, lang });
      return { ok: true };
    },
    allowLogin: () => ++logins <= 5,
  };
  const routeDeps: RouteDeps = {
    store,
    now: () => clock,
    atlas: async () => ({ text: "Atlas answer.", handler: "engine", modelCalls: 0, engineMs: 1 }),
    sendText: async () => ({ ok: true }),
    sendButton: async () => ({ ok: true }),
    email: async (e) => void emails.push(e),
  };
  let wamid = 0;
  const inbound = (from: string, text: string) =>
    routeEvent({ phoneNumberId: "222", from, wamid: `wamid.i${++wamid}`, type: "text", text, buttonId: null, profileName: "Test Person", timestamp: null }, routeDeps, CFG);

  let cookie = "";
  const req = (path: string, method = "GET", form?: Record<string, string>) =>
    new Request(`https://www.barncops.in${path}`, {
      method,
      headers: { ...(cookie ? { cookie } : {}), ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}) },
      body: form ? new URLSearchParams(form).toString() : undefined,
    });
  const call = (id: number | null, method = "GET", form?: Record<string, string>) => handleInbox(req(id == null ? BASE : `${BASE}/${id}`, method, form), deps, id);
  const login = async () => {
    const res = await call(null, "POST", { action: "login", password: PASSWORD });
    assert.equal(res.status, 303);
    cookie = (res.headers.get("set-cookie") || "").split(";")[0];
    return res;
  };
  const csrfOf = async (id: number | null) => /name="csrf" value="([^"]+)"/.exec(await (await call(id)).text())?.[1] || "";
  return {
    deps,
    store,
    texts,
    templates,
    emails,
    inbound,
    call,
    login,
    csrfOf,
    setCookie: (c: string) => void (cookie = c),
    failSends: () => void (sendOk = false),
    advance: (ms: number) => void (clock += ms),
  };
}

for (const kind of ["memory", "sql"] as const) {
  describe(`WhatsApp inbox (${kind} store)`, () => {
    it("is off without ADMIN_INBOX_PASSWORD", async () => {
      const r = await rig(kind, { ADMIN_INBOX_PASSWORD: undefined });
      assert.equal((await r.call(null)).status, 503);
    });

    it("shows only the sign-in form without a session; wrong password → 401; attempts are rate-limited", async () => {
      const r = await rig(kind);
      await r.inbound("919800000101", "Hello team");
      const anon = await (await r.call(null)).text();
      assert.match(anon, /type="password"/);
      assert.ok(!anon.includes("919800000101"));
      assert.equal((await r.call(1)).status, 200);
      assert.ok(!(await (await r.call(1)).text()).includes("Hello team"));
      for (let i = 0; i < 5; i++) assert.equal((await r.call(null, "POST", { action: "login", password: "nope" })).status, 401);
      assert.equal((await r.call(null, "POST", { action: "login", password: PASSWORD })).status, 429);
    });

    it("login sets an HttpOnly, Secure, SameSite=Strict cookie; a tampered cookie is refused", async () => {
      const r = await rig(kind);
      const res = await r.login();
      const sc = res.headers.get("set-cookie") || "";
      assert.match(sc, /HttpOnly/);
      assert.match(sc, /Secure/);
      assert.match(sc, /SameSite=Strict/);
      assert.match(sc, /Path=\/admin\/wa-inbox/);
      assert.ok(!sc.includes(PASSWORD));
      r.setCookie(sc.split(";")[0].replace(/.$/, (c) => (c === "0" ? "1" : "0")));
      assert.match(await (await r.call(null)).text(), /type="password"/);
    });

    it("list: number, source, last message time and 24 h window left", async () => {
      const r = await rig(kind);
      await r.inbound("919800000102", "Hello #BCteam-web");
      r.advance(2 * HOUR);
      await r.login();
      const html = await (await r.call(null)).text();
      assert.match(html, /\+919800000102/);
      assert.match(html, /<td>web<\/td>/);
      assert.match(html, /22 h 0 min/);
    });

    it("inquiry email links to /admin/wa-inbox/<id>, and that thread shows the customer's messages", async () => {
      const r = await rig(kind);
      await r.inbound("919800000103", "We need a survey for our constituency");
      await r.inbound("919800000103", "Please call after 5");
      const link = r.emails[0].rows.find(([k]) => k === "Reply in the inbox")?.[1] || "";
      const id = Number(/\/admin\/wa-inbox\/(\d+)$/.exec(link)?.[1]);
      assert.ok(id > 0);
      await r.login();
      const html = await (await r.call(id)).text();
      assert.match(html, /We need a survey for our constituency/);
      assert.match(html, /Please call after 5/);
      assert.match(html, /Thanks — the Barnstorm team will reply here shortly/);
      assert.match(html, /name="body"/);
    });

    it("reply inside the window → sent from the inquiry's line to the customer, logged in the thread", async () => {
      const r = await rig(kind);
      await r.inbound("919800000104", "Hello");
      await r.login();
      const csrf = await r.csrfOf(1);
      const res = await r.call(1, "POST", { action: "reply", csrf, body: "Hi, this is Barnstorm. <b>Calling</b> you at 6." });
      assert.equal(res.status, 303);
      assert.deepEqual(r.texts, [{ line: "222", to: "919800000104", body: "Hi, this is Barnstorm. <b>Calling</b> you at 6." }]);
      const thread = await r.store.thread(1);
      assert.equal(thread.at(-1)?.direction, "out");
      assert.equal(thread.at(-1)?.body, "Hi, this is Barnstorm. <b>Calling</b> you at 6.");
      const html = await (await r.call(1)).text();
      assert.ok(html.includes("&lt;b&gt;Calling&lt;/b&gt;"), "thread text is escaped");
    });

    it("a reply does not move the 24 h window (only customer messages do)", async () => {
      const r = await rig(kind);
      await r.inbound("919800000105", "Hello");
      r.advance(23 * HOUR);
      await r.login();
      await r.call(1, "POST", { action: "reply", csrf: await r.csrfOf(1), body: "Hello again" });
      r.advance(2 * HOUR);
      const html = await (await r.call(1)).text();
      assert.match(html, /closed — template only/);
    });

    it("POST without the CSRF token → 403 and nothing sent", async () => {
      const r = await rig(kind);
      await r.inbound("919800000106", "Hello");
      await r.login();
      assert.equal((await r.call(1, "POST", { action: "reply", body: "x" })).status, 403);
      assert.equal((await r.call(1, "POST", { action: "reply", csrf: "forged", body: "x" })).status, 403);
      assert.equal(r.texts.length, 0);
    });

    it("outside 24 h: free text disabled and refused; the WA_REPLY_TEMPLATE button sends the template and logs it", async () => {
      const r = await rig(kind);
      await r.inbound("919800000107", "Hello");
      r.advance(25 * HOUR);
      await r.login();
      const html = await (await r.call(1)).text();
      assert.match(html, /<textarea disabled/);
      assert.ok(!html.includes('name="body"'));
      assert.match(html, /Send template “barnstorm_follow_up”/);
      const csrf = await r.csrfOf(1);
      assert.equal((await r.call(1, "POST", { action: "reply", csrf, body: "late free text" })).status, 409);
      assert.equal(r.texts.length, 0);
      assert.equal((await r.call(1, "POST", { action: "template", csrf })).status, 303);
      assert.deepEqual(r.templates, [{ line: "222", to: "919800000107", name: "barnstorm_follow_up", lang: "en" }]);
      const last = (await r.store.thread(1)).at(-1);
      assert.equal(last?.direction, "out");
      assert.equal(last?.kind, "template");
    });

    it("outside 24 h with no WA_REPLY_TEMPLATE → says so, sends nothing", async () => {
      const r = await rig(kind, { WA_REPLY_TEMPLATE: undefined });
      await r.inbound("919800000108", "Hello");
      r.advance(25 * HOUR);
      await r.login();
      assert.match(await (await r.call(1)).text(), /Set WA_REPLY_TEMPLATE/);
      assert.equal((await r.call(1, "POST", { action: "template", csrf: await r.csrfOf(null) })).status, 400);
      assert.equal(r.templates.length, 0);
    });

    it("a refused send is shown and not logged as sent", async () => {
      const r = await rig(kind);
      await r.inbound("919800000109", "Hello");
      await r.login();
      const csrf = await r.csrfOf(1);
      r.failSends();
      const res = await r.call(1, "POST", { action: "reply", csrf, body: "will fail" });
      assert.equal(res.status, 502);
      assert.match(await res.text(), /Not sent/);
      assert.ok((await r.store.thread(1)).every((e) => e.body !== "will fail"));
    });

    it("unknown inquiry → 404", async () => {
      const r = await rig(kind);
      await r.login();
      assert.equal((await r.call(999)).status, 404);
    });
  });
}
