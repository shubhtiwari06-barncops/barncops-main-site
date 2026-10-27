/**
 * WhatsApp routing — which conversations go to Ask Atlas and which to the Barnstorm team.
 *
 * Env (names only; values live in Vercel):
 *   WA_ASK_ATLAS_PHONE_ID   phone_number_id that answers with the Atlas engine
 *   WA_BUSINESS_PHONE_ID    phone_number_id for the team. Equal to the Atlas id = shared mode.
 *   WA_BUSINESS_TAG         text the wa.me prefill links carry ("<tag>-<source>" names the source)
 *   WA_INQUIRY_WINDOW_HOURS inactivity window of one inquiry (default 24)
 *   WA_ACK_AFTER_MS         "Checking…" goes out only if the Atlas answer is not back by then (default 1200)
 *   INBOX_BASE_URL          base of the /admin/wa-inbox link in inquiry emails
 *   WA_TEST_NUMBERS         comma list of numbers that are never silenced (owner/test phones)
 *
 * Shared mode (one number): every message goes to Atlas, except a message that carries the tag
 * or a tap on the "Talk to the team" button — that opens one inquiry for the number, emails the
 * team once and keeps the bot silent until the window closes.
 * Two-number mode: the Atlas number is engine-only; every message on the business number is business.
 * Any other phone_number_id (an old number still subscribed) is ignored: 200, no row, no email.
 */

import { createHash } from "node:crypto";
import { isAtlasQuestion, looksDataQuestion } from "../intake-engine.ts";

export const TEAM_BUTTON_ID = "talk_team";
/** Meta's customer-service window: free text is allowed until 24 h after the customer's last message. */
export const SERVICE_WINDOW_MS = 24 * 3600 * 1000;

export type WaEvent = {
  phoneNumberId: string | null;
  from: string;
  wamid: string | null;
  type: string;
  text: string | null;
  buttonId: string | null;
  profileName: string | null;
  timestamp: string | null;
};

export type RouteConfig = {
  atlasId: string | null;
  businessId: string | null;
  /** WHATSAPP_PHONE_NUMBER_ID — the line the site sends from by default. */
  defaultId: string | null;
  /** WA_TEST_NUMBERS hashed — these numbers are never silenced by an open inquiry. */
  testHashes: Set<string>;
  tag: string | null;
  windowMs: number;
  ackAfterMs: number;
  inboxBase: string;
};

/** Meta phone_number_ids are digits; quotes, spaces or a pasted label around one never change it. */
export const phoneId = (v: string | undefined) => (v || "").replace(/\D/g, "") || null;

export function routeConfig(env: Record<string, string | undefined> = process.env): RouteConfig {
  const defaultId = phoneId(env.WHATSAPP_PHONE_NUMBER_ID);
  const atlasId = phoneId(env.WA_ASK_ATLAS_PHONE_ID) || defaultId;
  const businessId = phoneId(env.WA_BUSINESS_PHONE_ID) || atlasId;
  const tag = (env.WA_BUSINESS_TAG || "").trim() || null;
  const hours = Number(env.WA_INQUIRY_WINDOW_HOURS || 24);
  const ack = Number(env.WA_ACK_AFTER_MS || 1200);
  const base = (env.INBOX_BASE_URL || "https://www.barncops.in").trim().replace(/\/+$/, "");
  return { atlasId, businessId, defaultId, testHashes: testNumberHashes(env), tag, windowMs: (hours > 0 ? hours : 24) * 3600 * 1000, ackAfterMs: ack >= 0 ? ack : 1200, inboxBase: base };
}

/** Which configured id an incoming phone_number_id equals (names only — for logs and health). */
export function lineMatch(id: string | null, cfg: RouteConfig): string {
  if (!id) return "none";
  const m = [id === cfg.atlasId && "atlas", id === cfg.businessId && "business", id === cfg.defaultId && "default"].filter(Boolean);
  return m.length ? m.join("+") : "none";
}

/**
 * The default sending line is never silenced by a routing id that does not match it: a message on
 * WHATSAPP_PHONE_NUMBER_ID that equals neither routing id is handled as one shared number.
 */
export function effectiveConfig(ev: { phoneNumberId: string | null }, cfg: RouteConfig): RouteConfig {
  const id = ev.phoneNumberId;
  if (!id || !cfg.defaultId || id !== cfg.defaultId || id === cfg.atlasId || id === cfg.businessId) return cfg;
  console.error("[wa-route] CONFIG MISMATCH — message on WHATSAPP_PHONE_NUMBER_ID, which equals neither WA_ASK_ATLAS_PHONE_ID nor WA_BUSINESS_PHONE_ID; answered as a shared number");
  return { ...cfg, atlasId: id, businessId: id };
}

export type WebhookEvent = { verdict: string; line: string; detail: string | null; test?: boolean };
export type NumberStatus = {
  silenced: boolean;
  inquiry_id: number | null;
  source: string | null;
  silence_left_min: number | null;
  messages_queued_1h: number;
  inquiries_1h: number;
};

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
/** Last 10 digits: 9522236699, 919522236699 and +91 95222 36699 are one number. */
export const last10 = (phone: string) => String(phone || "").replace(/\D/g, "").slice(-10);

/** WA_TEST_NUMBERS (comma list) as hashes of their last 10 digits; the list itself is never kept. */
export function testNumberHashes(env: Record<string, string | undefined>): Set<string> {
  return new Set(
    String(env.WA_TEST_NUMBERS || "")
      .split(",")
      .map(last10)
      .filter((d) => d.length === 10)
      .map(sha),
  );
}

export const isTestNumber = (phone: string, cfg: RouteConfig) => cfg.testHashes.size > 0 && cfg.testHashes.has(sha(last10(phone)));
export type WaHealth = {
  last_webhook_at: string | null;
  last_signature_fail_at: string | null;
  last_ignored_number_at: string | null;
  last_config_mismatch_at: string | null;
  last_seen_message_at: string | null;
  last_handled_at: string | null;
  last_30min: Record<string, number>;
  timing_30min: Record<string, number>;
  /** Routing verdicts of WA_TEST_NUMBERS messages in the last hour. */
  test_numbers_1h: Record<string, number>;
  last_send_fail: string | null;
  last_atlas_status: string | null;
};

export type Inquiry = {
  id: number;
  phone: string;
  phoneNumberId: string;
  source: string;
  lastAt: number;
  openedAt: number;
  profileName: string | null;
  /** Set by "Close & resume bot"; a closed inquiry never silences the bot. */
  closedAt?: number | null;
};
export type Entry = { direction: "in" | "out"; kind: string; body: string | null; at: number };
export type Timing = {
  wamid: string | null;
  phoneNumberId: string | null;
  outcome: string;
  receivedAt: number;
  ackedAt: number | null;
  engineStart: number | null;
  engineEnd: number | null;
  sentAt: number | null;
  modelCalls: number | null;
  engineMs: number | null;
  handler: string | null;
  background: boolean;
};

export type Store = {
  /** False when this Meta message id was handled before. */
  claim(wamid: string, phoneNumberId: string | null): Promise<boolean>;
  /** The newest inquiry for this number + line that is not closed and had a customer message since activeSince. */
  openInquiry(phone: string, phoneNumberId: string, activeSince: number): Promise<Inquiry | null>;
  /** Ends the bot's silence for this inquiry now. */
  closeInquiry(id: number, now: number): Promise<void>;
  /** Silence state for one number (last 10 digits) — for health; returns no number or text. */
  numberStatus(last10: string, windowMs: number, now: number): Promise<NumberStatus>;
  createInquiry(phone: string, phoneNumberId: string, source: string, now: number, profileName?: string | null): Promise<Inquiry>;
  addEntry(inquiry: Inquiry, wamid: string | null, direction: "in" | "out", kind: string, body: string | null, now: number): Promise<void>;
  markEmailed(inquiry: Inquiry, now: number): Promise<void>;
  markAcked(inquiry: Inquiry, now: number): Promise<void>;
  listInquiries(since: number): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | null>;
  thread(id: number): Promise<Entry[]>;
  addTiming(t: Timing): Promise<void>;
  timings(limit: number): Promise<Timing[]>;
  /** Webhook verdicts — names and codes only, never text, numbers or secrets. */
  logEvent(e: WebhookEvent, now: number): Promise<void>;
  health(now: number): Promise<WaHealth>;
};

export type Email = { subject: string; displayName: string; rows: Array<[string, string]>; note?: string };
/** atlasStatus: what the Atlas call returned ("200", "401", "html", "timeout", "no_secret", …). */
export type AtlasReply = { text: string; handler: string; modelCalls: number | null; engineMs: number | null; atlasStatus?: string };
/** What a send returned; anything else (void) counts as sent. */
type Sent = { ok?: boolean; error?: string; status?: number; code?: number | null } | void | unknown;

/** "graph <http> <error code>" for a refused send, null when it went out. */
export function sendFailure(r: Sent): string | null {
  const s = r as { ok?: boolean; status?: number; code?: number | null; error?: string } | undefined;
  if (!s || s.ok !== false) return null;
  return s.status ? `graph ${s.status}${s.code != null ? ` code ${s.code}` : ""}` : (s.error || "send failed").slice(0, 40);
}

export type RouteDeps = {
  store: Store;
  now: () => number;
  atlas: (phoneNumberId: string, to: string, text: string, hi: boolean) => Promise<AtlasReply>;
  sendText: (phoneNumberId: string, to: string, body: string, previewUrl?: boolean) => Promise<unknown>;
  sendButton: (phoneNumberId: string, to: string, body: string, buttonId: string, title: string) => Promise<unknown>;
  email: (e: Email) => Promise<void>;
};

export type Outcome = "ignored_number" | "ignored_type" | "duplicate" | "atlas" | "inquiry_opened" | "inquiry_thread";

export const counters: Record<Outcome, number> = {
  ignored_number: 0,
  ignored_type: 0,
  duplicate: 0,
  atlas: 0,
  inquiry_opened: 0,
  inquiry_thread: 0,
};

/** Message types a person sends; reactions, system notices and unsupported payloads are not conversation. */
const CONVERSATION_TYPES = new Set(["text", "interactive", "button", "image", "audio", "video", "document", "sticker", "location", "contacts"]);

export const isHindi = (s: string) => (s.match(/[\u0900-\u097F]/g) || []).length >= 3;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The source a tagged message names ("<tag>-web" → "web"); "wa.me" for the bare tag; null without the tag. */
export function tagSource(text: string | null, tag: string | null): string | null {
  if (!text || !tag) return null;
  const m = new RegExp(escapeRe(tag) + "(?:[-_:]([A-Za-z0-9]+))?", "i").exec(text);
  if (!m) return null;
  return m[1] ? m[1].toLowerCase() : "wa.me";
}

export const COPY = {
  ack: {
    en: "Thanks — the Barnstorm team will reply here shortly. Please share your name, constituency/organisation and requirement in one message.",
    hi: "धन्यवाद — Barnstorm टीम जल्द ही यहीं जवाब देगी। कृपया अपना नाम, निर्वाचन क्षेत्र/संस्था और ज़रूरत एक ही संदेश में लिखें।",
  },
  offer: {
    en: "To speak with the Barnstorm team instead, tap below.",
    hi: "Barnstorm टीम से बात करने के लिए नीचे टैप करें।",
  },
  button: { en: "Talk to the team", hi: "टीम से बात करें" },
  textOnly: {
    en: "Ask Atlas reads text questions — type a seat, a state and a year, or a leader's name.",
    hi: "Ask Atlas लिखे हुए सवाल पढ़ता है — सीट, राज्य और साल, या नेता का नाम लिखें।",
  },
  checking: { en: "Checking…", hi: "देख रहा हूँ…", roman: "Dekh raha hoon…" },
  answerFail: {
    en: "The answer could not be sent just now. Send the same message again in a minute.",
    hi: "जवाब अभी नहीं जा सका। एक मिनट बाद वही संदेश फिर भेजें।",
  },
};

function checkingLine(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return COPY.checking.hi;
  if (/\b(mujhe|batao|kya|kaun|kitna|kitni|chunav|neta|saal|jeeta|jeeti)\b/i.test(text)) return COPY.checking.roman;
  return COPY.checking.en;
}

function answerFailLine(text: string): string {
  return /[\u0900-\u097F]/.test(text) ? COPY.answerFail.hi : COPY.answerFail.en;
}

/** An ack with no later terminal message. Job id and state only — no message text. */
export async function noteDanglingAck(deps: Pick<RouteDeps, "email" | "store" | "now">, wamid: string, state: string, lineKind: string): Promise<void> {
  const detail = JSON.stringify({ event: "dangling_ack", wamid, state });
  console.error(detail);
  try {
    await deps.store.logEvent({ verdict: "dangling_ack", line: lineKind, detail: state, test: false }, deps.now());
  } catch { /* the console line is the record if the store rejects it */ }
  try {
    await deps.email({
      subject: "[Atlas] dangling ack",
      displayName: "operator",
      rows: [["Job", wamid || ""], ["State", state]],
      note: "An acknowledgement was sent and no terminal message followed.",
    });
  } catch { /* operator mail is best-effort */ }
}

type Route = { kind: "ignored_number" } | { kind: "atlas" } | { kind: "business"; source: string };

export function decide(ev: WaEvent, cfg: RouteConfig): Route {
  const id = ev.phoneNumberId;
  if (cfg.atlasId && id && id !== cfg.atlasId && id !== cfg.businessId) return { kind: "ignored_number" };
  const shared = !cfg.businessId || cfg.businessId === cfg.atlasId;
  const tagged = tagSource(ev.text, cfg.tag);
  if (!shared) {
    if (id && id === cfg.businessId) return { kind: "business", source: tagged || "business-number" };
    return { kind: "atlas" };
  }
  if (ev.buttonId === TEAM_BUTTON_ID) return { kind: "business", source: "menu" };
  if (tagged) return { kind: "business", source: tagged };
  return { kind: "atlas" };
}

function fmtTs(unix: string | null): string {
  const n = Number(unix || 0) * 1000;
  return n ? new Date(n).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
}

export function inboxUrl(cfg: RouteConfig, id: number): string {
  return `${cfg.inboxBase}/admin/wa-inbox/${id}`;
}

/** Before the 200 to Meta: the route, the message type and the Meta message id (claimed once). */
export async function admit(ev: WaEvent, deps: RouteDeps, base: RouteConfig = routeConfig()): Promise<Outcome | null> {
  const cfg = effectiveConfig(ev, base);
  const line = lineMatch(ev.phoneNumberId, base);
  if (cfg !== base) await note(deps, "config_mismatch", line, null);
  if (decide(ev, cfg).kind === "ignored_number") {
    counters.ignored_number += 1;
    console.log("[wa-route] ignored_number", { phoneNumberId: ev.phoneNumberId, line });
    await note(deps, "ignored_number", line, null);
    return "ignored_number";
  }
  if (!CONVERSATION_TYPES.has(ev.type)) {
    counters.ignored_type += 1;
    await note(deps, "ignored_type", line, ev.type.slice(0, 20));
    return "ignored_type";
  }
  if (ev.wamid) {
    let fresh: boolean;
    try {
      fresh = await deps.store.claim(ev.wamid, ev.phoneNumberId);
    } catch (err) {
      console.error("[wa-route] store unavailable — per-instance dedupe", (err as Error)?.message);
      fresh = !fallbackSeen.has(ev.wamid);
      fallbackSeen.add(ev.wamid);
      if (fallbackSeen.size > 5000) fallbackSeen.clear();
    }
    if (!fresh) {
      counters.duplicate += 1;
      await note(deps, "duplicate", line, null);
      return "duplicate";
    }
  }
  await note(deps, "admitted", line, null);
  return null;
}

const fallbackSeen = new Set<string>();

/** Records one webhook verdict; never fails the request. */
export async function note(deps: Pick<RouteDeps, "store" | "now">, verdict: string, line: string, detail: string | null, test = false): Promise<void> {
  try {
    await deps.store.logEvent({ verdict, line, detail, test }, deps.now());
  } catch (err) {
    console.error("[wa-route] event not stored", verdict, (err as Error)?.message);
  }
}

/** The work for one admitted message; records one timing row (no text, no number). */
export async function handle(ev: WaEvent, rawDeps: RouteDeps, base: RouteConfig = routeConfig(), receivedAt?: number, background = false): Promise<Outcome> {
  const cfg = effectiveConfig(ev, base);
  const lineKind = lineMatch(ev.phoneNumberId, base);
  /* Every refused send is recorded as "graph <http> code <n>". */
  const checked = (r: unknown) => {
    const f = sendFailure(r);
    if (f) {
      console.error("[wa-route] send failed", f);
      return note(rawDeps, "send_fail", lineKind, f).then(() => r);
    }
    return r;
  };
  const deps: RouteDeps = {
    ...rawDeps,
    sendText: (l, to, body, preview) => rawDeps.sendText(l, to, body, preview).then(checked),
    sendButton: (l, to, body, id, title) => rawDeps.sendButton(l, to, body, id, title).then(checked),
  };
  const route = decide(ev, cfg);
  const t: Timing = {
    wamid: ev.wamid,
    phoneNumberId: ev.phoneNumberId,
    outcome: "",
    receivedAt: receivedAt ?? deps.now(),
    ackedAt: null,
    engineStart: null,
    engineEnd: null,
    sentAt: null,
    modelCalls: null,
    engineMs: null,
    handler: null,
    background,
  };
  const done = async (o: Outcome) => {
    t.outcome = o;
    try {
      await deps.store.addTiming(t);
    } catch (err) {
      console.error("[wa-route] timing not stored", (err as Error)?.message);
    }
    return o;
  };
  const now = deps.now();
  const line = ev.phoneNumberId || cfg.businessId || cfg.atlasId || "";
  const hi = isHindi(ev.text || "");
  const kind = ev.type === "text" || ev.type === "interactive" || ev.type === "button" ? "text" : ev.type;

  const test = isTestNumber(ev.from, cfg);
  const mark = (verdict: string) => note(deps, verdict, lineKind, null, test);

  /*
   * An open inquiry on this line keeps the bot silent: every message joins its thread for the team.
   * A WA_TEST_NUMBERS number is queued the same way but still gets the bot's answer.
   */
  const open =
    route.kind === "business" || line === cfg.businessId
      ? await deps.store.openInquiry(ev.from, line, now - cfg.windowMs).catch((err) => {
          console.error("[wa-route] inquiry lookup failed", (err as Error)?.message);
          return null;
        })
      : null;
  if (open) {
    await deps.store.addEntry(open, ev.wamid, "in", kind, ev.text, now);
    counters.inquiry_thread += 1;
    if (!test || route.kind === "business") {
      await mark("business_silenced");
      return done("inquiry_thread");
    }
    await mark("test_not_silenced");
  }

  if (route.kind === "business" && !open) {
    await mark("business");
    const inq = await deps.store.createInquiry(ev.from, line, route.source, now, ev.profileName);
    await deps.store.addEntry(inq, ev.wamid, "in", kind, ev.text, now);
    const ack = hi ? COPY.ack.hi : COPY.ack.en;
    await deps.sendText(line, ev.from, ack);
    t.ackedAt = t.sentAt = deps.now();
    await deps.store.addEntry(inq, null, "out", "text", ack, deps.now());
    await deps.store.markAcked(inq, now);
    const shared = cfg.businessId === cfg.atlasId;
    await deps.email({
      subject: `[Business • WhatsApp • ${route.source}] +${ev.from}${ev.profileName ? ` · ${ev.profileName}` : ""}`,
      displayName: ev.profileName || `+${ev.from}`,
      rows: [
        ["Customer number", `+${ev.from}`],
        ["Reply in the inbox", inboxUrl(cfg, inq.id)],
        ["Profile", ev.profileName || "—"],
        ["Source", route.source],
        ["Line", shared ? "Shared number (Ask Atlas + team)" : "Business number"],
        ["First message", (ev.text || `[${ev.type}]`).slice(0, 500)],
        ["Received", fmtTs(ev.timestamp)],
      ],
      note: `Bot is silent for this number for ${Math.round(cfg.windowMs / 3600000)} h. Later messages join this inquiry without a new email. Reply from the inbox link, not from a personal WhatsApp.`,
    });
    await deps.store.markEmailed(inq, now);
    counters.inquiry_opened += 1;
    return done("inquiry_opened");
  }

  counters.atlas += 1;
  await mark("atlas");
  if (ev.type !== "text" || !ev.text) {
    await deps.sendText(line, ev.from, hi ? COPY.textOnly.hi : COPY.textOnly.en);
    t.sentAt = deps.now();
    return done("atlas");
  }
  /* "Checking…" only when the answer is not back within ackAfterMs. Fast answers send nothing first. */
  const text = ev.text;
  let answered = false;
  let ackSending: Promise<unknown> | null = null;
  const timer = setTimeout(() => {
    if (answered) return;
    ackSending = deps.sendText(line, ev.from, checkingLine(text)).then(() => {
      t.ackedAt = deps.now();
    });
  }, cfg.ackAfterMs);
  t.engineStart = deps.now();
  let reply: AtlasReply;
  try {
    reply = await deps.atlas(line, ev.from, text, hi);
  } catch {
    reply = { text: answerFailLine(text), handler: "atlas_error", modelCalls: null, engineMs: null, atlasStatus: "atlas_error" };
  } finally {
    answered = true;
    clearTimeout(timer);
  }
  t.engineEnd = deps.now();
  if (reply.atlasStatus) await note(deps, "atlas", lineKind, reply.atlasStatus);
  t.handler = reply.handler;
  t.modelCalls = reply.modelCalls;
  t.engineMs = reply.engineMs;
  if (ackSending) {
    try { await ackSending; } catch { /* the ack itself never left, so there is nothing to pair */ }
  }
  const terminal = reply.text || answerFailLine(text);
  let notedDangle = false;
  try {
    await deps.sendText(line, ev.from, terminal, true);
    t.sentAt = deps.now();
  } catch {
    if (t.ackedAt != null) {
      try {
        await deps.sendText(line, ev.from, answerFailLine(text), true);
        t.sentAt = deps.now();
      } catch {
        notedDangle = true;
        await noteDanglingAck(deps, ev.wamid, "terminal_failed", lineKind);
      }
    }
  }
  if (!notedDangle && t.ackedAt != null && t.sentAt == null) await noteDanglingAck(deps, ev.wamid, "unpaired", lineKind);
  const shared = cfg.businessId === cfg.atlasId;
  if (shared && !looksDataQuestion(text) && !isAtlasQuestion(text)) {
    await deps.sendButton(line, ev.from, hi ? COPY.offer.hi : COPY.offer.en, TEAM_BUTTON_ID, hi ? COPY.button.hi : COPY.button.en);
  }
  return done("atlas");
}

/** admit + handle, in line (tests, and runtimes without background work). */
export async function routeEvent(ev: WaEvent, deps: RouteDeps, cfg: RouteConfig = routeConfig()): Promise<Outcome> {
  const receivedAt = deps.now();
  return (await admit(ev, deps, cfg)) || handle(ev, deps, cfg, receivedAt, false);
}

/* ─── timing summary ─────────────────────────────────────────────── */

const pct = (xs: number[], p: number) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

/** First reply (ack or answer) and full answer, ms from webhook receipt, over Atlas messages. */
export function timingSummary(rows: Timing[]) {
  const atlas = rows.filter((r) => r.outcome === "atlas" && r.sentAt != null);
  const first = atlas.map((r) => Math.min(r.ackedAt ?? Infinity, r.sentAt as number) - r.receivedAt);
  const answer = atlas.map((r) => (r.sentAt as number) - r.receivedAt);
  const engine = atlas.filter((r) => r.engineEnd != null && r.engineStart != null).map((r) => (r.engineEnd as number) - (r.engineStart as number));
  const calls = atlas.map((r) => r.modelCalls).filter((x): x is number => x != null);
  return {
    n: atlas.length,
    first_reply: { p50: pct(first, 50), p95: pct(first, 95) },
    answer: { p50: pct(answer, 50), p95: pct(answer, 95) },
    engine: { p50: pct(engine, 50), p95: pct(engine, 95) },
    acked: atlas.filter((r) => r.ackedAt != null).length,
    model_calls_avg: calls.length ? Math.round((calls.reduce((a, b) => a + b, 0) / calls.length) * 100) / 100 : null,
    background: atlas.filter((r) => r.background).length,
  };
}

/* ─── stores ─────────────────────────────────────────────────────── */

type Query = (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;

const ms = (v: unknown) => (v == null ? null : new Date(v as string).getTime());
const iso = (n: number | null) => (n == null ? null : new Date(n).toISOString());

const toInquiry = (r: Record<string, unknown>): Inquiry => ({
  id: Number(r.id),
  phone: String(r.phone),
  phoneNumberId: String(r.phone_number_id),
  source: String(r.source),
  lastAt: ms(r.last_at) as number,
  openedAt: ms(r.opened_at) as number,
  profileName: (r.profile_name as string) ?? null,
  closedAt: ms(r.closed_at),
});
const INQ_COLS = "id, phone, phone_number_id, source, last_at, opened_at, profile_name, closed_at";

/** Postgres (pg Pool or PGlite — anything with query(sql, params) → { rows }). */
export function sqlStore(query: Query): Store {
  return {
    async claim(wamid, phoneNumberId) {
      const r = await query(`insert into wa_seen_messages (wamid, phone_number_id) values ($1, $2) on conflict (wamid) do nothing returning wamid`, [wamid, phoneNumberId]);
      return r.rows.length > 0;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const r = await query(
        `select ${INQ_COLS} from wa_inquiries where phone = $1 and phone_number_id = $2 and last_at > $3 and closed_at is null order by last_at desc limit 1`,
        [phone, phoneNumberId, iso(activeSince)],
      );
      return r.rows[0] ? toInquiry(r.rows[0]) : null;
    },
    async closeInquiry(id, now) {
      await query(`update wa_inquiries set closed_at = $2 where id = $1 and closed_at is null`, [id, iso(now)]);
    },
    async numberStatus(d10, windowMs, now) {
      const hour = iso(now - 3600 * 1000);
      const open = (
        await query(
          `select id, source, last_at from wa_inquiries where right(phone, 10) = $1 and closed_at is null and last_at > $2 order by last_at desc limit 1`,
          [d10, iso(now - windowMs)],
        )
      ).rows[0];
      const queued = open
        ? Number((await query(`select count(*)::int as n from wa_inquiry_messages where inquiry_id = $1 and direction = 'in' and created_at > $2`, [open.id, hour])).rows[0].n)
        : 0;
      const made = Number((await query(`select count(*)::int as n from wa_inquiries where right(phone, 10) = $1 and opened_at > $2`, [d10, hour])).rows[0].n);
      return {
        silenced: !!open,
        inquiry_id: open ? Number(open.id) : null,
        source: open ? String(open.source) : null,
        silence_left_min: open ? Math.max(0, Math.round(((ms(open.last_at) as number) + windowMs - now) / 60000)) : null,
        messages_queued_1h: queued,
        inquiries_1h: made,
      };
    },
    async createInquiry(phone, phoneNumberId, source, now, profileName) {
      const r = await query(
        `insert into wa_inquiries (phone, phone_number_id, source, opened_at, last_at, profile_name) values ($1, $2, $3, $4, $4, $5) returning ${INQ_COLS}`,
        [phone, phoneNumberId, source, iso(now), profileName ?? null],
      );
      return toInquiry(r.rows[0]);
    },
    async addEntry(inquiry, wamid, direction, kind, body, now) {
      await query(
        `insert into wa_inquiry_messages (inquiry_id, wamid, direction, kind, body, created_at) values ($1, $2, $3, $4, $5, $6) on conflict (wamid) do nothing`,
        [inquiry.id, wamid, direction, kind, body, iso(now)],
      );
      if (direction === "in") await query(`update wa_inquiries set last_at = $2 where id = $1`, [inquiry.id, iso(now)]);
    },
    async markEmailed(inquiry, now) {
      await query(`update wa_inquiries set emailed_at = $2 where id = $1`, [inquiry.id, iso(now)]);
    },
    async markAcked(inquiry, now) {
      await query(`update wa_inquiries set acked_at = $2 where id = $1`, [inquiry.id, iso(now)]);
    },
    async listInquiries(since) {
      const r = await query(`select ${INQ_COLS} from wa_inquiries where last_at > $1 order by last_at desc limit 200`, [iso(since)]);
      return r.rows.map(toInquiry);
    },
    async getInquiry(id) {
      const r = await query(`select ${INQ_COLS} from wa_inquiries where id = $1`, [id]);
      return r.rows[0] ? toInquiry(r.rows[0]) : null;
    },
    async thread(id) {
      const r = await query(`select direction, kind, body, created_at from wa_inquiry_messages where inquiry_id = $1 order by created_at asc, id asc`, [id]);
      return r.rows.map((x) => ({ direction: x.direction as "in" | "out", kind: String(x.kind), body: (x.body as string) ?? null, at: ms(x.created_at) as number }));
    },
    async addTiming(t) {
      await query(
        `insert into wa_timing (wamid, phone_number_id, outcome, received_at, acked_at, engine_start, engine_end, sent_at, model_calls, engine_ms, handler, background)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [t.wamid, t.phoneNumberId, t.outcome, iso(t.receivedAt), iso(t.ackedAt), iso(t.engineStart), iso(t.engineEnd), iso(t.sentAt), t.modelCalls, t.engineMs, t.handler, t.background],
      );
    },
    async logEvent(e, now) {
      await query(`insert into wa_webhook_events (at, verdict, line, detail, test) values ($1, $2, $3, $4, $5)`, [iso(now), e.verdict, e.line, e.detail, !!e.test]);
    },
    async health(now) {
      const since = iso(now - 30 * 60 * 1000);
      const last = async (sql: string, params: unknown[] = []) => {
        const v = (await query(sql, params)).rows[0]?.t;
        return v == null ? null : new Date(v as string).toISOString();
      };
      const lastOf = (verdict: string) => last(`select max(at) as t from wa_webhook_events where verdict = $1`, [verdict]);
      const counts = async (sql: string) =>
        Object.fromEntries((await query(sql, [since])).rows.map((r) => [String(r.k), Number(r.n)]));
      const lastDetail = async (verdict: string) =>
        ((await query(`select detail from wa_webhook_events where verdict = $1 order by at desc, id desc limit 1`, [verdict])).rows[0]?.detail as string) ?? null;
      return {
        last_webhook_at: await last(`select max(at) as t from wa_webhook_events`),
        last_signature_fail_at: await lastOf("signature_fail"),
        last_ignored_number_at: await lastOf("ignored_number"),
        last_config_mismatch_at: await lastOf("config_mismatch"),
        last_seen_message_at: await last(`select max(received_at) as t from wa_seen_messages`),
        last_handled_at: await last(`select max(received_at) as t from wa_timing`),
        last_30min: await counts(`select verdict || ':' || line as k, count(*)::int as n from wa_webhook_events where at > $1 group by 1`),
        timing_30min: await counts(`select outcome as k, count(*)::int as n from wa_timing where received_at > $1 group by 1`),
        test_numbers_1h: Object.fromEntries(
          (await query(`select verdict as k, count(*)::int as n from wa_webhook_events where test and at > $1 group by 1`, [iso(now - 3600 * 1000)])).rows.map((r) => [
            String(r.k),
            Number(r.n),
          ]),
        ),
        last_send_fail: await lastDetail("send_fail"),
        last_atlas_status: await lastDetail("atlas"),
      };
    },
    async timings(limit) {
      const r = await query(`select * from wa_timing order by received_at desc limit $1`, [limit]);
      return r.rows.map((x) => ({
        wamid: (x.wamid as string) ?? null,
        phoneNumberId: (x.phone_number_id as string) ?? null,
        outcome: String(x.outcome),
        receivedAt: ms(x.received_at) as number,
        ackedAt: ms(x.acked_at),
        engineStart: ms(x.engine_start),
        engineEnd: ms(x.engine_end),
        sentAt: ms(x.sent_at),
        modelCalls: x.model_calls == null ? null : Number(x.model_calls),
        engineMs: x.engine_ms == null ? null : Number(x.engine_ms),
        handler: (x.handler as string) ?? null,
        background: !!x.background,
      }));
    },
  };
}

export type MemoryStore = Store & {
  seen: Set<string>;
  inquiries: Inquiry[];
  entries: Array<Entry & { inquiryId: number }>;
  timingRows: Timing[];
  events: Array<WebhookEvent & { at: number }>;
};

/** Per-instance fallback when DATABASE_URL is unset (preview / local). */
export function memoryStore(): MemoryStore {
  const seen = new Set<string>();
  const inquiries: Inquiry[] = [];
  const entries: Array<Entry & { inquiryId: number }> = [];
  const timingRows: Timing[] = [];
  const events: Array<WebhookEvent & { at: number }> = [];
  return {
    seen,
    inquiries,
    entries,
    timingRows,
    events,
    async claim(wamid) {
      if (seen.has(wamid)) return false;
      seen.add(wamid);
      return true;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const hits = inquiries.filter((i) => i.phone === phone && i.phoneNumberId === phoneNumberId && i.lastAt > activeSince && i.closedAt == null);
      return hits.length ? hits[hits.length - 1] : null;
    },
    async closeInquiry(id, now) {
      const i = inquiries.find((x) => x.id === id);
      if (i && i.closedAt == null) i.closedAt = now;
    },
    async numberStatus(d10, windowMs, now) {
      const mine = inquiries.filter((i) => last10(i.phone) === d10);
      const open = mine.filter((i) => i.closedAt == null && i.lastAt > now - windowMs).at(-1);
      const hour = now - 3600 * 1000;
      return {
        silenced: !!open,
        inquiry_id: open ? open.id : null,
        source: open ? open.source : null,
        silence_left_min: open ? Math.max(0, Math.round((open.lastAt + windowMs - now) / 60000)) : null,
        messages_queued_1h: open ? entries.filter((e) => e.inquiryId === open.id && e.direction === "in" && e.at > hour).length : 0,
        inquiries_1h: mine.filter((i) => i.openedAt > hour).length,
      };
    },
    async createInquiry(phone, phoneNumberId, source, now, profileName) {
      const inq: Inquiry = { id: inquiries.length + 1, phone, phoneNumberId, source, lastAt: now, openedAt: now, profileName: profileName ?? null, closedAt: null };
      inquiries.push(inq);
      return inq;
    },
    async addEntry(inquiry, _wamid, direction, kind, body, now) {
      entries.push({ inquiryId: inquiry.id, direction, kind, body, at: now });
      if (direction === "in") inquiry.lastAt = now;
    },
    async markEmailed() {},
    async markAcked() {},
    async listInquiries(since) {
      return inquiries.filter((i) => i.lastAt > since).sort((a, b) => b.lastAt - a.lastAt);
    },
    async getInquiry(id) {
      return inquiries.find((i) => i.id === id) || null;
    },
    async thread(id) {
      return entries.filter((e) => e.inquiryId === id).map(({ direction, kind, body, at }) => ({ direction, kind, body, at }));
    },
    async addTiming(t) {
      timingRows.push({ ...t });
    },
    async timings(limit) {
      return timingRows.slice(-limit).reverse();
    },
    async logEvent(e, now) {
      events.push({ ...e, at: now });
    },
    async health(now) {
      const since = now - 30 * 60 * 1000;
      const isoOf = (n: number | undefined) => (n == null ? null : new Date(n).toISOString());
      const lastOf = (v?: string) => isoOf(events.filter((e) => !v || e.verdict === v).at(-1)?.at);
      const tally = (keys: string[]) => keys.reduce<Record<string, number>>((a, k) => ((a[k] = (a[k] || 0) + 1), a), {});
      return {
        last_webhook_at: lastOf(),
        last_signature_fail_at: lastOf("signature_fail"),
        last_ignored_number_at: lastOf("ignored_number"),
        last_config_mismatch_at: lastOf("config_mismatch"),
        last_seen_message_at: null,
        last_handled_at: isoOf(timingRows.at(-1)?.receivedAt),
        last_30min: tally(events.filter((e) => e.at > since).map((e) => `${e.verdict}:${e.line}`)),
        timing_30min: tally(timingRows.filter((t) => t.receivedAt > since).map((t) => t.outcome)),
        test_numbers_1h: tally(events.filter((e) => e.test && e.at > now - 3600 * 1000).map((e) => e.verdict)),
        last_send_fail: events.filter((e) => e.verdict === "send_fail").at(-1)?.detail ?? null,
        last_atlas_status: events.filter((e) => e.verdict === "atlas").at(-1)?.detail ?? null,
      };
    },
  };
}

let _store: Store | undefined;

export async function defaultStore(): Promise<Store> {
  if (_store) return _store;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[wa-route] DATABASE_URL not set — per-instance memory store");
    _store = memoryStore();
    return _store;
  }
  const pg = await import("pg");
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  _store = sqlStore((sql, params) => pool.query(sql, params));
  return _store;
}
