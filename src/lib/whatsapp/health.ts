/**
 * WhatsApp deploy health — names and booleans only, never values.
 * Reported by /api/wa-warm so a deploy can be checked without reading any secret.
 */

export const REQUIRED_ENV = [
  "META_APP_SECRET|WHATSAPP_APP_SECRET",
  "WHATSAPP_BUSINESS_TOKEN",
  "DATABASE_URL",
  "ATLAS_WA_ASK_URL",
  "ATLAS_WA_SECRET",
  "WA_ASK_ATLAS_PHONE_ID|WHATSAPP_PHONE_NUMBER_ID",
  "WA_BUSINESS_PHONE_ID",
  "WA_BUSINESS_TAG",
  "ADMIN_INBOX_PASSWORD",
  "WA_REPLY_TEMPLATE",
  "WA_REPLY_TEMPLATE_LANG",
  "WA_ACK_AFTER_MS",
  "INBOX_BASE_URL",
];

export const WA_TABLES = ["wa_seen_messages", "wa_inquiries", "wa_inquiry_messages", "wa_timing", "wa_webhook_events"];
export const ATLAS_PRODUCTION_HOSTS = ["atlas.barncops.in"];

/** Names (or "a|b" alternatives) with no non-empty value. */
export function missingEnv(env: Record<string, string | undefined>): string[] {
  return REQUIRED_ENV.filter((spec) => !spec.split("|").some((n) => (env[n] || "").trim()));
}

/** "production" | "not_production" | "unset" | "invalid" — the URL itself is never returned. */
export function atlasUrlKind(raw: string | undefined): string {
  const s = (raw || "").trim();
  if (!s) return "unset";
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") return "invalid";
    return ATLAS_PRODUCTION_HOSTS.includes(u.hostname.toLowerCase()) ? "production" : "not_production";
  } catch {
    return "invalid";
  }
}

/**
 * Booleans about the phone ids — never the ids. consistent = the routing ids are set, digits-only,
 * and the Atlas id is the default sending line (WHATSAPP_PHONE_NUMBER_ID).
 */
export function phoneIdCheck(env: Record<string, string | undefined>) {
  const raw = (n: string) => (env[n] || "").trim();
  const digits = (n: string) => /^\d{6,20}$/.test(raw(n));
  const atlas = raw("WA_ASK_ATLAS_PHONE_ID");
  const business = raw("WA_BUSINESS_PHONE_ID");
  const def = raw("WHATSAPP_PHONE_NUMBER_ID");
  const detail = {
    atlas_set: !!atlas,
    business_set: !!business,
    default_set: !!def,
    atlas_digits_only: !atlas || digits("WA_ASK_ATLAS_PHONE_ID"),
    business_digits_only: !business || digits("WA_BUSINESS_PHONE_ID"),
    default_digits_only: !def || digits("WHATSAPP_PHONE_NUMBER_ID"),
    atlas_equals_default: !!atlas && atlas === def,
    business_equals_atlas: !!business && business === (atlas || def),
  };
  const consistent =
    detail.default_set &&
    detail.default_digits_only &&
    detail.atlas_digits_only &&
    detail.business_digits_only &&
    (!atlas || detail.atlas_equals_default);
  return { consistent, detail };
}

/** Signed ping: Atlas answers 400 (no question) when the intake secret matches, 401 when it does not. */
export async function atlasSecretCheck(env: Record<string, string | undefined>, fetchFn: typeof fetch = fetch): Promise<{ ok: boolean | null; status: string }> {
  const url = (env.ATLAS_WA_ASK_URL || "").trim();
  const secret = (env.ATLAS_WA_SECRET || "").trim();
  if (!/^https:\/\//i.test(url)) return { ok: null, status: "no_url" };
  if (!secret) return { ok: false, status: "no_secret" };
  try {
    const r = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-atlas-intake-secret": secret },
      body: JSON.stringify({ phone: "", q: "" }),
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 401) return { ok: false, status: "401" };
    if (r.status === 400) return { ok: true, status: "400" };
    return { ok: null, status: String(r.status) };
  } catch (err) {
    return { ok: null, status: (err as Error)?.name === "TimeoutError" ? "timeout" : "error" };
  }
}

type Query = (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;

/** Applied migration file names and any WhatsApp table that does not exist. */
export async function dbHealth(query: Query): Promise<{ migrations: string[]; missing_tables: string[] }> {
  let migrations: string[] = [];
  try {
    migrations = (await query("select name from _migrations order by name", [])).rows.map((r) => String(r.name));
  } catch {
    migrations = [];
  }
  const missing: string[] = [];
  for (const t of WA_TABLES) {
    const r = await query("select to_regclass($1) as t", [`public.${t}`]);
    if (!r.rows[0]?.t) missing.push(t);
  }
  return { migrations, missing_tables: missing };
}
