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
 *
 * Shared mode (one number): every message goes to Atlas, except a message that carries the tag
 * or a tap on the "Talk to the team" button — that opens one inquiry for the number, emails the
 * team once and keeps the bot silent until the window closes.
 * Two-number mode: the Atlas number is engine-only; every message on the business number is business.
 * Any other phone_number_id (an old number still subscribed) is ignored: 200, no row, no email.
 */

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
  tag: string | null;
  windowMs: number;
  ackAfterMs: number;
  inboxBase: string;
};

export function routeConfig(env: Record<string, string | undefined> = process.env): RouteConfig {
  const atlasId = (env.WA_ASK_ATLAS_PHONE_ID || env.WHATSAPP_PHONE_NUMBER_ID || "").trim() || null;
  const businessId = (env.WA_BUSINESS_PHONE_ID || "").trim() || atlasId;
  const tag = (env.WA_BUSINESS_TAG || "").trim() || null;
  const hours = Number(env.WA_INQUIRY_WINDOW_HOURS || 24);
  const ack = Number(env.WA_ACK_AFTER_MS || 1200);
  const base = (env.INBOX_BASE_URL || "https://www.barncops.in").trim().replace(/\/+$/, "");
  return { atlasId, businessId, tag, windowMs: (hours > 0 ? hours : 24) * 3600 * 1000, ackAfterMs: ack >= 0 ? ack : 1200, inboxBase: base };
}

export type Inquiry = { id: number; phone: string; phoneNumberId: string; source: string; lastAt: number; openedAt: number; profileName: string | null };
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
  openInquiry(phone: string, phoneNumberId: string, activeSince: number): Promise<Inquiry | null>;
  createInquiry(phone: string, phoneNumberId: string, source: string, now: number, profileName?: string | null): Promise<Inquiry>;
  addEntry(inquiry: Inquiry, wamid: string | null, direction: "in" | "out", kind: string, body: string | null, now: number): Promise<void>;
  markEmailed(inquiry: Inquiry, now: number): Promise<void>;
  markAcked(inquiry: Inquiry, now: number): Promise<void>;
  listInquiries(since: number): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | null>;
  thread(id: number): Promise<Entry[]>;
  addTiming(t: Timing): Promise<void>;
  timings(limit: number): Promise<Timing[]>;
};

export type Email = { subject: string; displayName: string; rows: Array<[string, string]>; note?: string };
export type AtlasReply = { text: string; handler: string; modelCalls: number | null; engineMs: number | null };

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
};

function checkingLine(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return COPY.checking.hi;
  if (/\b(mujhe|batao|kya|kaun|kitna|kitni|chunav|neta|saal|jeeta|jeeti)\b/i.test(text)) return COPY.checking.roman;
  return COPY.checking.en;
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
export async function admit(ev: WaEvent, deps: RouteDeps, cfg: RouteConfig = routeConfig()): Promise<Outcome | null> {
  if (decide(ev, cfg).kind === "ignored_number") {
    counters.ignored_number += 1;
    console.log("[wa-route] ignored_number", { phoneNumberId: ev.phoneNumberId });
    return "ignored_number";
  }
  if (!CONVERSATION_TYPES.has(ev.type)) {
    counters.ignored_type += 1;
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
      return "duplicate";
    }
  }
  return null;
}

const fallbackSeen = new Set<string>();

/** The work for one admitted message; records one timing row (no text, no number). */
export async function handle(ev: WaEvent, deps: RouteDeps, cfg: RouteConfig = routeConfig(), receivedAt?: number, background = false): Promise<Outcome> {
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

  /* An open inquiry on this line keeps the bot silent: every message joins its thread. */
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
    return done("inquiry_thread");
  }

  if (route.kind === "business") {
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
  if (ev.type !== "text" || !ev.text) {
    await deps.sendText(line, ev.from, hi ? COPY.textOnly.hi : COPY.textOnly.en);
    t.sentAt = deps.now();
    return done("atlas");
  }
  /* "Checking…" only when the answer is not back within ackAfterMs. */
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
  } finally {
    answered = true;
    clearTimeout(timer);
  }
  t.engineEnd = deps.now();
  t.handler = reply.handler;
  t.modelCalls = reply.modelCalls;
  t.engineMs = reply.engineMs;
  if (ackSending) await ackSending;
  await deps.sendText(line, ev.from, reply.text, true);
  t.sentAt = deps.now();
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
});
const INQ_COLS = "id, phone, phone_number_id, source, last_at, opened_at, profile_name";

/** Postgres (pg Pool or PGlite — anything with query(sql, params) → { rows }). */
export function sqlStore(query: Query): Store {
  return {
    async claim(wamid, phoneNumberId) {
      const r = await query(`insert into wa_seen_messages (wamid, phone_number_id) values ($1, $2) on conflict (wamid) do nothing returning wamid`, [wamid, phoneNumberId]);
      return r.rows.length > 0;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const r = await query(
        `select ${INQ_COLS} from wa_inquiries where phone = $1 and phone_number_id = $2 and last_at > $3 order by last_at desc limit 1`,
        [phone, phoneNumberId, iso(activeSince)],
      );
      return r.rows[0] ? toInquiry(r.rows[0]) : null;
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

export type MemoryStore = Store & { seen: Set<string>; inquiries: Inquiry[]; entries: Array<Entry & { inquiryId: number }>; timingRows: Timing[] };

/** Per-instance fallback when DATABASE_URL is unset (preview / local). */
export function memoryStore(): MemoryStore {
  const seen = new Set<string>();
  const inquiries: Inquiry[] = [];
  const entries: Array<Entry & { inquiryId: number }> = [];
  const timingRows: Timing[] = [];
  return {
    seen,
    inquiries,
    entries,
    timingRows,
    async claim(wamid) {
      if (seen.has(wamid)) return false;
      seen.add(wamid);
      return true;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const hits = inquiries.filter((i) => i.phone === phone && i.phoneNumberId === phoneNumberId && i.lastAt > activeSince);
      return hits.length ? hits[hits.length - 1] : null;
    },
    async createInquiry(phone, phoneNumberId, source, now, profileName) {
      const inq = { id: inquiries.length + 1, phone, phoneNumberId, source, lastAt: now, openedAt: now, profileName: profileName ?? null };
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
