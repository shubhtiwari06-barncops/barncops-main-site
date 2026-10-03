import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env, isWorkspacePreview } from "@/lib/env.server";
import {
  DEFAULT_FROM_EMAIL,
  INTAKE_INBOX,
  PUBLIC_WHATSAPP_MESSAGE,
  PUBLIC_WHATSAPP_NUMBER,
} from "./public";
import {
  infoRequestSchema,
  intakeSchema,
  whatsappNotifySchema,
  type InfoRequestInput,
  type IntakeInput,
} from "./schema";

type Json = Record<string, unknown>;

const buckets = new Map<string, { tokens: number; updated: number }>();
const RATE_CAP = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

export function jsonOk(body: Json, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export function jsonFail(status: number, error: string) {
  return Response.json({ ok: false, error }, { status, headers: { "cache-control": "no-store" } });
}

export function clientIp(request: Request): string {
  const cf = request.headers.get("cf-connecting-ip");
  const xff = request.headers.get("x-forwarded-for");
  const real = request.headers.get("x-real-ip");
  return cf || xff?.split(",")[0]?.trim() || real || "unknown";
}

export function rateLimit(scope: string, ip: string, cap = RATE_CAP): boolean {
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const current = buckets.get(key) ?? { tokens: cap, updated: now };
  const refill = ((now - current.updated) / RATE_WINDOW_MS) * cap;
  current.tokens = Math.min(cap, current.tokens + refill);
  current.updated = now;
  if (current.tokens < 1) {
    buckets.set(key, current);
    return false;
  }
  current.tokens -= 1;
  buckets.set(key, current);
  return true;
}

export function makeRef(prefix = "BS") {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function slackSafe(value: string) {
  return value.replace(/[<>&]/g, "").slice(0, 400);
}

function tokensEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function adminSecret() {
  return env("ADMIN_TOKEN") ?? (isWorkspacePreview() ? "preview-director" : undefined);
}

function turnstileSecret() {
  return env("TURNSTILE_SECRET");
}

function turnstileSiteKey() {
  return env("TURNSTILE_SITE_KEY") ?? null;
}

function canonicalizeInbox(value: string) {
  const v = value.trim();
  if (!v) return INTAKE_INBOX;
  return v.replace(/@barnstorm\.in\b/gi, "@barncops.in");
}

export function intakeInbox() {
  return canonicalizeInbox(env("INTAKE_TO_EMAIL") ?? INTAKE_INBOX);
}

function infoInbox() {
  return canonicalizeInbox(env("INFO_TO_EMAIL") ?? intakeInbox());
}

function fromEmail() {
  return canonicalizeInbox(env("FROM_EMAIL") ?? DEFAULT_FROM_EMAIL);
}

async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = turnstileSecret();
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

export async function sendResend(to: string, subject: string, text: string) {
  const key = env("RESEND_API_KEY");
  const from = fromEmail();
  if (!key) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
  } catch {
    /* notify is best-effort */
  }
}

export async function postSlack(text: string) {
  const url = env("SLACK_WEBHOOK_URL");
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: slackSafe(text) }),
    });
  } catch {
    /* notify is best-effort */
  }
}

export async function notifyWhatsApp(input: { to: string; ref: string; name?: string }) {
  const id = env("WHATSAPP_PHONE_NUMBER_ID");
  const token = env("WHATSAPP_BUSINESS_TOKEN");
  if (!id || !token) return { skipped: true as const };
  const parsed = whatsappNotifySchema.safeParse(input);
  if (!parsed.success) return { skipped: true as const };
  const template = env("WHATSAPP_TEMPLATE_NAME") ?? "intake_ack";
  const lang = env("WHATSAPP_TEMPLATE_LANG") ?? "en";
  const to = parsed.data.to.replace(/\D/g, "");
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${id}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: lang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: parsed.data.ref },
                { type: "text", text: parsed.data.name ?? "Principal" },
              ],
            },
          ],
        },
      }),
    });
    return { skipped: false as const, ok: res.ok };
  } catch {
    return { skipped: false as const, ok: false };
  }
}

export function assertAdmin(request: Request): Response | null {
  const expected = adminSecret();
  if (!expected) return jsonFail(503, "Admin is not configured.");
  const headerToken = request.headers.get("x-admin-token");
  if (!headerToken || !tokensEqual(headerToken, expected)) {
    return jsonFail(401, "Unauthorised.");
  }
  return null;
}

export async function handleIntake(raw: unknown) {
  const parsed = intakeSchema.safeParse(raw);
  if (!parsed.success) return jsonFail(400, "The brief is incomplete. Check the required fields.");
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return jsonFail(400, "Verification failed. Refresh and submit again.");
  }
  const data = parsed.data;
  const id = crypto.randomUUID();
  const ref = makeRef();
  const sql = await getSql();
  await sql`
    insert into intake_requests (
      id, type, name, role, geography, timeline, challenge, room, need_type,
      contact_channel, email, phone, source_page, consent, reference_id, status
    ) values (
      ${id}, 'intake', ${data.name}, ${data.role}, ${data.geography}, ${data.timeline},
      ${data.challenge}, ${data.room}, ${data.needType}, ${data.contactChannel},
      ${data.email}, ${data.phone ?? null}, ${data.sourcePage ?? null}, ${true},
      ${ref}, 'new'
    )
  `;

  const summary = [
    `Confidential intake ${ref}`,
    `Name: ${data.name}`,
    `Role: ${data.role}`,
    `Need: ${data.needType}`,
    `Geography: ${data.geography}`,
    `Clock: ${data.timeline}`,
    `Room: ${data.room}`,
    `Channel: ${data.contactChannel}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Source: ${data.sourcePage ?? "—"}`,
    "",
    "Challenge:",
    data.challenge,
  ]
    .filter((line) => line !== null)
    .join("\n");

  await sendResend(intakeInbox(), `Confidential intake ${ref} — Barnstorm Co-operations`, summary);
  await postSlack(
    `Confidential intake ${ref}\n${data.name} · ${data.role} · ${data.needType} · ${data.geography}`,
  );

  const notifyTo = env("WHATSAPP_NOTIFY_TO") ?? (data.contactChannel === "whatsapp" ? data.phone : undefined);
  if (notifyTo) {
    await notifyWhatsApp({ to: notifyTo.replace(/\D/g, ""), ref, name: data.name });
  }

  return jsonOk({ ok: true, ref });
}

export async function handleInfoRequest(raw: unknown) {
  const parsed = infoRequestSchema.safeParse(raw);
  if (!parsed.success) return jsonFail(400, "The note is incomplete. Check the required fields.");
  if (!(await verifyTurnstile(parsed.data.turnstileToken))) {
    return jsonFail(400, "Verification failed. Refresh and submit again.");
  }
  const data = parsed.data;
  const id = crypto.randomUUID();
  const ref = makeRef();
  const sql = await getSql();
  await sql`
    insert into intake_requests (
      id, type, name, role, geography, timeline, challenge, room, need_type,
      contact_channel, email, phone, source_page, consent, reference_id, status
    ) values (
      ${id}, 'info', ${data.name}, null, ${data.topic}, null, ${data.message},
      null, null, 'email', ${data.email}, ${data.phone ?? null},
      ${data.sourcePage ?? null}, ${true}, ${ref}, 'new'
    )
  `;
  await sendResend(
    infoInbox(),
    `Info request ${ref} — Barnstorm Co-operations`,
    `Info request ${ref}\nName: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone ?? "—"}\nTopic: ${data.topic}\n\n${data.message}`,
  );
  await postSlack(`Info request ${ref}\n${data.name} · ${data.topic}`);
  return jsonOk({ ok: true, ref });
}

export async function handleAdminList(headerToken: string | null) {
  const expected = adminSecret();
  if (!expected) return jsonFail(503, "Admin is not configured.");
  if (!headerToken || !tokensEqual(headerToken, expected)) {
    return jsonFail(401, "Unauthorised.");
  }
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    created_at: string;
    type: string;
    name: string;
    role: string | null;
    geography: string | null;
    timeline: string | null;
    challenge: string | null;
    room: string | null;
    need_type: string | null;
    contact_channel: string | null;
    email: string;
    phone: string | null;
    source_page: string | null;
    reference_id: string;
    status: string;
  }>`
    select id, created_at, type, name, role, geography, timeline, challenge, room,
           need_type, contact_channel, email, phone, source_page, reference_id, status
    from intake_requests
    order by created_at desc
    limit 50
  `;
  const actor = createHash("sha256").update(headerToken).digest("hex").slice(0, 12);
  await sql`
    insert into admin_audit_log (id, actor, action, target_id)
    values (${crypto.randomUUID()}, ${actor}, ${"list_intake"}, ${String(rows.length)})
  `;
  return jsonOk({ ok: true, items: rows });
}

export function publicConfig() {
  const number = (env("WHATSAPP_NUMBER") ?? PUBLIC_WHATSAPP_NUMBER).replace(/\D/g, "") || PUBLIC_WHATSAPP_NUMBER;
  return {
    turnstileSiteKey: turnstileSiteKey(),
    whatsappNumber: number,
    whatsappMessage: env("WHATSAPP_DEFAULT_MESSAGE") ?? PUBLIC_WHATSAPP_MESSAGE,
    whatsappAutomation: Boolean(env("WHATSAPP_PHONE_NUMBER_ID") && env("WHATSAPP_BUSINESS_TOKEN")),
  };
}

export type { IntakeInput, InfoRequestInput };
