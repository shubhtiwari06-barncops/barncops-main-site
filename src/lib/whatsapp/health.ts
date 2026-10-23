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

export const WA_TABLES = ["wa_seen_messages", "wa_inquiries", "wa_inquiry_messages", "wa_timing"];
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
