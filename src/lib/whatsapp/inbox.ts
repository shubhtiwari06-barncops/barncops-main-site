/**
 * /admin/wa-inbox — the team replies to WhatsApp inquiries from the number each one came in on.
 *
 * Env: ADMIN_INBOX_PASSWORD (login; unset = inbox off), WA_REPLY_TEMPLATE (approved utility template,
 * no variables, for replies outside Meta's 24 h window), WA_REPLY_TEMPLATE_LANG (default "en").
 * Session: HttpOnly SameSite=Strict cookie signed with a key derived from the password, so changing
 * the password ends every session. Every form carries a CSRF token bound to the session.
 */

import { createHmac } from "node:crypto";
import { safeEqualStr } from "./meta-sig.ts";
import { SERVICE_WINDOW_MS, timingSummary, type Entry, type Inquiry, type Store } from "./route.ts";

export const BASE = "/admin/wa-inbox";
const COOKIE = "wa_inbox";
const SESSION_MS = 12 * 3600 * 1000;
const LIST_DAYS = 30;

type Sent = { ok: boolean; error?: string };

export type InboxDeps = {
  store: Store;
  now: () => number;
  env: Record<string, string | undefined>;
  sendText: (phoneNumberId: string, to: string, body: string) => Promise<Sent>;
  sendTemplate: (phoneNumberId: string, to: string, name: string, lang: string) => Promise<Sent>;
  /** False when this client has used up its login attempts. */
  allowLogin: (request: Request) => boolean;
};

/* ─── session + csrf ─────────────────────────────────────────────── */

const key = (password: string) => createHmac("sha256", "wa-inbox-session-v1").update(password).digest();
const mac = (password: string, s: string) => createHmac("sha256", key(password)).update(s).digest("hex");

export function sessionCookieValue(password: string, now: number): string {
  const exp = String(now + SESSION_MS);
  return `${exp}.${mac(password, `session:${exp}`)}`;
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

function validSession(request: Request, password: string, now: number): string | null {
  const v = readCookie(request, COOKIE);
  if (!v) return null;
  const [exp, sig] = v.split(".");
  if (!exp || !sig || !(Number(exp) > now)) return null;
  return safeEqualStr(sig, mac(password, `session:${exp}`)) ? v : null;
}

const csrfFor = (password: string, session: string) => mac(password, `csrf:${session}`);

/* ─── html ───────────────────────────────────────────────────────── */

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "cache-control": "no-store",
  "x-frame-options": "DENY",
  "x-robots-tag": "noindex, nofollow",
  "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
};

function page(title: string, body: string, status = 200, extra: Record<string, string> = {}): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title>
<style>body{font:15px/1.45 system-ui,sans-serif;max-width:860px;margin:24px auto;padding:0 16px;color:#111}table{border-collapse:collapse;width:100%}td,th{padding:6px 8px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}
.in{background:#f3f6ff}.out{background:#f2fbf2}.msg{padding:8px 10px;margin:6px 0;border-radius:6px;white-space:pre-wrap}.muted{color:#666;font-size:13px}.err{color:#b00020}
.open{color:#0a7d32;font-weight:600}.closed{color:#b00020;font-weight:600}textarea{width:100%;min-height:90px;font:inherit}button{font:inherit;padding:6px 14px}nav{margin-bottom:16px}</style></head><body>${body}</body></html>`;
  return new Response(html, { status, headers: { ...HEADERS, ...extra } });
}

const redirect = (to: string, extra: Record<string, string> = {}) => new Response(null, { status: 303, headers: { location: to, "cache-control": "no-store", ...extra } });

const fmt = (ms: number) => new Date(ms).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

/** Time left in Meta's customer-service window (from the customer's last message). */
export function windowLeftMs(inq: Inquiry, now: number): number {
  return Math.max(0, inq.lastAt + SERVICE_WINDOW_MS - now);
}

function left(ms: number): string {
  if (ms <= 0) return `<span class="closed">closed — template only</span>`;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `<span class="open">${h} h ${m} min</span>`;
}

function loginPage(error = "", status = 200): Response {
  return page(
    "WhatsApp inbox — sign in",
    `<h1>WhatsApp inbox</h1>${error ? `<p class="err">${esc(error)}</p>` : ""}
<form method="post" action="${BASE}"><input type="hidden" name="action" value="login">
<label>Password <input type="password" name="password" autocomplete="current-password" required autofocus></label> <button>Sign in</button></form>`,
    status,
  );
}

function listPage(rows: Inquiry[], now: number, csrf: string, timing: ReturnType<typeof timingSummary>): Response {
  const tr = rows
    .map(
      (i) => `<tr><td><a href="${BASE}/${i.id}">+${esc(i.phone)}</a>${i.profileName ? `<div class="muted">${esc(i.profileName)}</div>` : ""}</td>
<td>${esc(i.source)}</td><td>${esc(fmt(i.lastAt))}</td><td>${left(windowLeftMs(i, now))}</td><td>${i.closedAt || windowLeftMs(i, now) <= 0 ? "bot on" : "bot silent"}</td></tr>`,
    )
    .join("");
  const t = timing;
  const ms = (v: number | null) => (v == null ? "—" : `${v} ms`);
  return page(
    "WhatsApp inbox",
    `<nav><strong>WhatsApp inbox</strong> · <form method="post" action="${BASE}" style="display:inline"><input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="${esc(csrf)}"><button>Sign out</button></form></nav>
<table><thead><tr><th>Number</th><th>Source</th><th>Last customer message</th><th>24 h window left</th><th>Bot</th></tr></thead><tbody>${tr || `<tr><td colspan="5" class="muted">No inquiries in the last ${LIST_DAYS} days.</td></tr>`}</tbody></table>
<h2>Ask Atlas speed (last ${t.n} answers)</h2>
<table><tr><th></th><th>p50</th><th>p95</th></tr>
<tr><td>First reply (Checking… or answer) after webhook</td><td>${ms(t.first_reply.p50)}</td><td>${ms(t.first_reply.p95)}</td></tr>
<tr><td>Answer sent after webhook</td><td>${ms(t.answer.p50)}</td><td>${ms(t.answer.p95)}</td></tr>
<tr><td>Atlas engine call</td><td>${ms(t.engine.p50)}</td><td>${ms(t.engine.p95)}</td></tr></table>
<p class="muted">Checking… sent on ${t.acked} of ${t.n}. Model calls per answer: ${t.model_calls_avg ?? "—"}. Background (after 200): ${t.background} of ${t.n}.</p>`,
  );
}

function threadPage(inq: Inquiry, entries: Entry[], now: number, csrf: string, env: InboxDeps["env"], error = "", status = 200): Response {
  const leftMs = windowLeftMs(inq, now);
  const template = (env.WA_REPLY_TEMPLATE || "").trim();
  const msgs = entries
    .map((e) => `<div class="msg ${e.direction}"><div class="muted">${e.direction === "in" ? "Customer" : "Barnstorm"} · ${esc(fmt(e.at))}${e.kind !== "text" ? ` · ${esc(e.kind)}` : ""}</div>${esc(e.body ?? `[${e.kind}]`)}</div>`)
    .join("");
  const hidden = `<input type="hidden" name="csrf" value="${esc(csrf)}">`;
  const reply =
    leftMs > 0
      ? `<form method="post" action="${BASE}/${inq.id}"><input type="hidden" name="action" value="reply">${hidden}
<textarea name="body" maxlength="4096" required placeholder="Reply sent from the number this inquiry came in on"></textarea><p><button>Send reply</button></p></form>`
      : `<form><textarea disabled placeholder="Free text is closed: the customer's last message is more than 24 h old."></textarea></form>
${
  template
    ? `<form method="post" action="${BASE}/${inq.id}"><input type="hidden" name="action" value="template">${hidden}<p><button>Send template “${esc(template)}”</button></p></form>`
    : `<p class="err">Outside the 24 h window. Set WA_REPLY_TEMPLATE to an approved utility template to reopen the conversation.</p>`
}`;
  const silence = inq.closedAt
    ? `<p class="muted">Closed ${esc(fmt(inq.closedAt))} — the bot answers this number again.</p>`
    : `<form method="post" action="${BASE}/${inq.id}"><input type="hidden" name="action" value="close">${hidden}<p><button>Close &amp; resume bot</button> <span class="muted">The bot is silent for this number while this inquiry is open.</span></p></form>`;
  return page(
    `+${inq.phone} — WhatsApp inbox`,
    `<nav><a href="${BASE}">← All inquiries</a></nav>
<h1>+${esc(inq.phone)}${inq.profileName ? ` · ${esc(inq.profileName)}` : ""}</h1>
<p class="muted">Source ${esc(inq.source)} · line ${esc(inq.phoneNumberId)} · opened ${esc(fmt(inq.openedAt))} · window ${left(leftMs)}</p>${silence}
${error ? `<p class="err">${esc(error)}</p>` : ""}${msgs}${reply}`,
    status,
  );
}

/* ─── handler ────────────────────────────────────────────────────── */

export async function handleInbox(request: Request, deps: InboxDeps, id: number | null): Promise<Response> {
  const password = (deps.env.ADMIN_INBOX_PASSWORD || "").trim();
  if (!password) {
    console.error("[wa-inbox] ADMIN_INBOX_PASSWORD not set — inbox disabled");
    return page("WhatsApp inbox", "<p>The inbox is off: ADMIN_INBOX_PASSWORD is not set.</p>", 503);
  }
  const now = deps.now();
  const session = validSession(request, password, now);
  const form = request.method === "POST" ? await request.formData().catch(() => null) : null;
  const action = String(form?.get("action") || "");

  if (request.method === "POST" && action === "login") {
    if (!deps.allowLogin(request)) return loginPage("Too many attempts. Wait 10 minutes.", 429);
    if (!safeEqualStr(String(form?.get("password") || ""), password)) return loginPage("Wrong password.", 401);
    const v = sessionCookieValue(password, now);
    return redirect(BASE, { "set-cookie": `${COOKIE}=${v}; Path=${BASE}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS / 1000}` });
  }
  if (!session) return request.method === "POST" ? loginPage("Session expired — sign in again.", 401) : loginPage();

  const csrf = csrfFor(password, session);
  if (request.method === "POST" && !safeEqualStr(String(form?.get("csrf") || ""), csrf)) {
    return page("WhatsApp inbox", `<p class="err">Form expired. <a href="${esc(id ? `${BASE}/${id}` : BASE)}">Reload</a> and try again.</p>`, 403);
  }
  if (request.method === "POST" && action === "logout") {
    return redirect(BASE, { "set-cookie": `${COOKIE}=; Path=${BASE}; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
  }

  if (id == null) {
    const rows = await deps.store.listInquiries(now - LIST_DAYS * 24 * 3600 * 1000);
    return listPage(rows, now, csrf, timingSummary(await deps.store.timings(200)));
  }

  const inq = await deps.store.getInquiry(id);
  if (!inq) return page("WhatsApp inbox", `<p>No inquiry ${esc(id)}. <a href="${BASE}">All inquiries</a></p>`, 404);

  if (request.method === "POST") {
    if (action === "reply") {
      const body = String(form?.get("body") || "").trim().slice(0, 4096);
      if (!body) return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, "Write a reply first.", 400);
      if (windowLeftMs(inq, now) <= 0) {
        return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, "The 24 h window is closed — only the template can be sent.", 409);
      }
      const r = await deps.sendText(inq.phoneNumberId, inq.phone, body);
      if (!r.ok) return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, `Not sent: ${r.error || "WhatsApp refused the message"}`, 502);
      await deps.store.addEntry(inq, null, "out", "text", body, now);
      return redirect(`${BASE}/${id}`);
    }
    if (action === "template") {
      const name = (deps.env.WA_REPLY_TEMPLATE || "").trim();
      if (!name) return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, "WA_REPLY_TEMPLATE is not set.", 400);
      const lang = (deps.env.WA_REPLY_TEMPLATE_LANG || "en").trim();
      const r = await deps.sendTemplate(inq.phoneNumberId, inq.phone, name, lang);
      if (!r.ok) return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, `Template not sent: ${r.error || "WhatsApp refused it"}`, 502);
      await deps.store.addEntry(inq, null, "out", "template", `[template ${name} · ${lang}]`, now);
      return redirect(`${BASE}/${id}`);
    }
    if (action === "close") {
      await deps.store.closeInquiry(id, now);
      await deps.store.addEntry(inq, null, "out", "system", "[closed — bot resumed]", now);
      try {
        await deps.store.logEvent({ verdict: "inquiry_closed", line: "inbox", detail: null }, now);
      } catch {
        /* the close itself already happened */
      }
      return redirect(`${BASE}/${id}`);
    }
    return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env, "Unknown action.", 400);
  }
  return threadPage(inq, await deps.store.thread(id), now, csrf, deps.env);
}

export async function liveInboxDeps(): Promise<InboxDeps> {
  const R = await import("./route.ts");
  const E = await import("../intake-engine.ts");
  const S = await import("../intake/server.ts");
  return {
    store: await R.defaultStore(),
    now: () => Date.now(),
    env: process.env,
    sendText: (line, to, body) => E.sendWhatsAppText(to, body, false, line),
    sendTemplate: (line, to, name, lang) => E.sendWhatsAppTemplate(to, name, lang, line),
    allowLogin: (request) => S.rateLimit("wa-inbox-login", S.clientIp(request), 10),
  };
}
