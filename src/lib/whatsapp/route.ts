/**
 * WhatsApp routing — which conversations go to Ask Atlas and which to the Barnstorm team.
 *
 * Env (names only; values live in Vercel):
 *   WA_ASK_ATLAS_PHONE_ID   phone_number_id that answers with the Atlas engine
 *   WA_BUSINESS_PHONE_ID    phone_number_id for the team. Equal to the Atlas id = shared mode.
 *   WA_BUSINESS_TAG         text the wa.me prefill links carry ("<tag>-<source>" names the source)
 *   WA_INQUIRY_WINDOW_HOURS inactivity window of one inquiry (default 24)
 *
 * Shared mode (one number): every message goes to Atlas, except a message that carries the tag
 * or a tap on the "Talk to the team" button — that opens one inquiry for the number, emails the
 * team once and keeps the bot silent until the window closes.
 * Two-number mode: the Atlas number is engine-only; every message on the business number is business.
 * Any other phone_number_id (an old number still subscribed) is ignored: 200, no row, no email.
 */

import { isAtlasQuestion, looksDataQuestion } from "../intake-engine.ts";

export const TEAM_BUTTON_ID = "talk_team";

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
};

export function routeConfig(env: Record<string, string | undefined> = process.env): RouteConfig {
  const atlasId = (env.WA_ASK_ATLAS_PHONE_ID || env.WHATSAPP_PHONE_NUMBER_ID || "").trim() || null;
  const businessId = (env.WA_BUSINESS_PHONE_ID || "").trim() || atlasId;
  const tag = (env.WA_BUSINESS_TAG || "").trim() || null;
  const hours = Number(env.WA_INQUIRY_WINDOW_HOURS || 24);
  return { atlasId, businessId, tag, windowMs: (hours > 0 ? hours : 24) * 3600 * 1000 };
}

export type Inquiry = { id: number; phone: string; phoneNumberId: string; source: string; lastAt: number };

export type Store = {
  /** False when this Meta message id was handled before. */
  claim(wamid: string, phoneNumberId: string | null): Promise<boolean>;
  openInquiry(phone: string, phoneNumberId: string, activeSince: number): Promise<Inquiry | null>;
  createInquiry(phone: string, phoneNumberId: string, source: string, now: number): Promise<Inquiry>;
  addEntry(inquiry: Inquiry, wamid: string | null, direction: "in" | "out", kind: string, body: string | null, now: number): Promise<void>;
  markEmailed(inquiry: Inquiry, now: number): Promise<void>;
  markAcked(inquiry: Inquiry, now: number): Promise<void>;
};

export type Email = { subject: string; displayName: string; rows: Array<[string, string]>; note?: string };

export type RouteDeps = {
  store: Store;
  now: () => number;
  atlas: (phoneNumberId: string, to: string, text: string, hi: boolean) => Promise<string>;
  sendText: (phoneNumberId: string, to: string, body: string, previewUrl?: boolean) => Promise<void>;
  sendButton: (phoneNumberId: string, to: string, body: string, buttonId: string, title: string) => Promise<void>;
  email: (e: Email) => Promise<void>;
};

export type Outcome =
  | "ignored_number"
  | "ignored_type"
  | "duplicate"
  | "atlas"
  | "inquiry_opened"
  | "inquiry_thread";

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

const isHindi = (s: string) => (s.match(/[\u0900-\u097F]/g) || []).length >= 3;

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

const COPY = {
  ack: {
    en: "Thank you — a member of the Barnstorm team will reply to you here soon.",
    hi: "धन्यवाद — Barnstorm टीम का सदस्य जल्द ही आपको यहीं जवाब देगा।",
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
};

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

export async function routeEvent(ev: WaEvent, deps: RouteDeps, cfg: RouteConfig = routeConfig()): Promise<Outcome> {
  const route = decide(ev, cfg);
  if (route.kind === "ignored_number") {
    counters.ignored_number += 1;
    console.log("[wa-route] ignored_number", { phoneNumberId: ev.phoneNumberId });
    return "ignored_number";
  }
  if (!CONVERSATION_TYPES.has(ev.type)) {
    counters.ignored_type += 1;
    return "ignored_type";
  }
  if (ev.wamid && !(await deps.store.claim(ev.wamid, ev.phoneNumberId))) {
    counters.duplicate += 1;
    return "duplicate";
  }
  const now = deps.now();
  const line = ev.phoneNumberId || cfg.businessId || cfg.atlasId || "";
  const hi = isHindi(ev.text || "");
  const kind = ev.type === "text" || ev.type === "interactive" || ev.type === "button" ? "text" : ev.type;

  /* An open inquiry on this line keeps the bot silent: every message joins its thread. */
  const open = route.kind === "business" || line === cfg.businessId ? await deps.store.openInquiry(ev.from, line, now - cfg.windowMs) : null;
  if (open) {
    await deps.store.addEntry(open, ev.wamid, "in", kind, ev.text, now);
    counters.inquiry_thread += 1;
    return "inquiry_thread";
  }

  if (route.kind === "business") {
    const inq = await deps.store.createInquiry(ev.from, line, route.source, now);
    await deps.store.addEntry(inq, ev.wamid, "in", kind, ev.text, now);
    const ack = hi ? COPY.ack.hi : COPY.ack.en;
    await deps.sendText(line, ev.from, ack);
    await deps.store.addEntry(inq, null, "out", "text", ack, now);
    await deps.store.markAcked(inq, now);
    const shared = cfg.businessId === cfg.atlasId;
    await deps.email({
      subject: `[Business • WhatsApp • ${route.source}] +${ev.from}${ev.profileName ? ` · ${ev.profileName}` : ""}`,
      displayName: ev.profileName || `+${ev.from}`,
      rows: [
        ["Customer number", `+${ev.from}`],
        ["Chat", `https://wa.me/${ev.from}`],
        ["Profile", ev.profileName || "—"],
        ["Source", route.source],
        ["Line", shared ? "Shared number (Ask Atlas + team)" : "Business number"],
        ["First message", (ev.text || `[${ev.type}]`).slice(0, 500)],
        ["Received", fmtTs(ev.timestamp)],
      ],
      note: `Bot is silent for this number for ${Math.round(cfg.windowMs / 3600000)} h. Later messages join this inquiry without a new email.`,
    });
    await deps.store.markEmailed(inq, now);
    counters.inquiry_opened += 1;
    return "inquiry_opened";
  }

  counters.atlas += 1;
  if (ev.type !== "text" || !ev.text) {
    await deps.sendText(line, ev.from, hi ? COPY.textOnly.hi : COPY.textOnly.en);
    return "atlas";
  }
  const answer = await deps.atlas(line, ev.from, ev.text, hi);
  await deps.sendText(line, ev.from, answer, true);
  const shared = cfg.businessId === cfg.atlasId;
  if (shared && !looksDataQuestion(ev.text) && !isAtlasQuestion(ev.text)) {
    await deps.sendButton(line, ev.from, hi ? COPY.offer.hi : COPY.offer.en, TEAM_BUTTON_ID, hi ? COPY.button.hi : COPY.button.en);
  }
  return "atlas";
}

/* ─── stores ─────────────────────────────────────────────────────── */

type Query = (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;

const toInquiry = (r: Record<string, unknown>): Inquiry => ({
  id: Number(r.id),
  phone: String(r.phone),
  phoneNumberId: String(r.phone_number_id),
  source: String(r.source),
  lastAt: new Date(r.last_at as string).getTime(),
});

/** Postgres (pg Pool or PGlite — anything with query(sql, params) → { rows }). */
export function sqlStore(query: Query): Store {
  return {
    async claim(wamid, phoneNumberId) {
      const r = await query(
        `insert into wa_seen_messages (wamid, phone_number_id) values ($1, $2) on conflict (wamid) do nothing returning wamid`,
        [wamid, phoneNumberId],
      );
      return r.rows.length > 0;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const r = await query(
        `select id, phone, phone_number_id, source, last_at from wa_inquiries
          where phone = $1 and phone_number_id = $2 and last_at > $3
          order by last_at desc limit 1`,
        [phone, phoneNumberId, new Date(activeSince).toISOString()],
      );
      return r.rows[0] ? toInquiry(r.rows[0]) : null;
    },
    async createInquiry(phone, phoneNumberId, source, now) {
      const t = new Date(now).toISOString();
      const r = await query(
        `insert into wa_inquiries (phone, phone_number_id, source, opened_at, last_at) values ($1, $2, $3, $4, $4)
         returning id, phone, phone_number_id, source, last_at`,
        [phone, phoneNumberId, source, t],
      );
      return toInquiry(r.rows[0]);
    },
    async addEntry(inquiry, wamid, direction, kind, body, now) {
      const t = new Date(now).toISOString();
      await query(
        `insert into wa_inquiry_messages (inquiry_id, wamid, direction, kind, body, created_at) values ($1, $2, $3, $4, $5, $6)
         on conflict (wamid) do nothing`,
        [inquiry.id, wamid, direction, kind, body, t],
      );
      if (direction === "in") await query(`update wa_inquiries set last_at = $2 where id = $1`, [inquiry.id, t]);
    },
    async markEmailed(inquiry, now) {
      await query(`update wa_inquiries set emailed_at = $2 where id = $1`, [inquiry.id, new Date(now).toISOString()]);
    },
    async markAcked(inquiry, now) {
      await query(`update wa_inquiries set acked_at = $2 where id = $1`, [inquiry.id, new Date(now).toISOString()]);
    },
  };
}

/** Per-instance fallback when DATABASE_URL is unset (preview / local). */
export function memoryStore(): Store & { seen: Set<string>; inquiries: Inquiry[]; entries: Array<{ inquiryId: number; direction: string; body: string | null }> } {
  const seen = new Set<string>();
  const inquiries: Inquiry[] = [];
  const entries: Array<{ inquiryId: number; direction: string; body: string | null }> = [];
  return {
    seen,
    inquiries,
    entries,
    async claim(wamid) {
      if (seen.has(wamid)) return false;
      seen.add(wamid);
      return true;
    },
    async openInquiry(phone, phoneNumberId, activeSince) {
      const hits = inquiries.filter((i) => i.phone === phone && i.phoneNumberId === phoneNumberId && i.lastAt > activeSince);
      return hits.length ? hits[hits.length - 1] : null;
    },
    async createInquiry(phone, phoneNumberId, source, now) {
      const inq = { id: inquiries.length + 1, phone, phoneNumberId, source, lastAt: now };
      inquiries.push(inq);
      return inq;
    },
    async addEntry(inquiry, _wamid, direction, _kind, body, now) {
      entries.push({ inquiryId: inquiry.id, direction, body });
      if (direction === "in") inquiry.lastAt = now;
    },
    async markEmailed() {},
    async markAcked() {},
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
