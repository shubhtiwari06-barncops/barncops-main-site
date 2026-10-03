import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { getSql } from "@/lib/db";
import { env, isWorkspacePreview } from "@/lib/env.server";
import {
  assertAdmin,
  jsonFail,
  jsonOk,
  makeRef,
  postSlack,
  sendResend,
} from "@/lib/intake/server";
import { INTAKE_INBOX } from "@/lib/intake/public";
import {
  ESCALATE_RE,
  GREETING_RE,
  NEED_BUTTONS,
  PATH_LIST,
  ROLE_LIST,
  TIME_LIST,
  looksLikeCallbackWindow,
  looksLikeName,
  isStaleConversation,
  msgCallbackFiled,
  msgCallbackPhone,
  msgCallbackTime,
  msgChallenge,
  msgContinue,
  msgEscalated,
  msgGeography,
  msgIntake,
  msgMedia,
  msgNeed,
  msgOpen,
  msgPath,
  msgRepeat,
  msgRole,
  msgTimeline,
  msgUnclear,
  msgWalkthrough,
  normalizePhone,
  parseNeed,
  parsePath,
  parseRole,
  parseTimeline,
  type WaStage,
} from "./copy";

type Contact = {
  id: string;
  phone: string;
  wa_id: string | null;
  profile_name: string | null;
  stage: WaStage;
  name: string | null;
  role: string | null;
  geography: string | null;
  need_type: string | null;
  timeline: string | null;
  challenge: string | null;
  path_choice: string | null;
  last_inbound: string | null;
  last_inbound_at: string | Date | null;
  unread: boolean;
  escalated: boolean;
  reference_id: string | null;
};

type Reply = {
  text: string;
  buttons?: { id: string; title: string }[];
  list?: { button: string; sections: { title: string; rows: { id: string; title: string }[] }[] };
};

function cloudConfigured() {
  return Boolean(env("WHATSAPP_PHONE_NUMBER_ID") && env("WHATSAPP_BUSINESS_TOKEN"));
}

function verifyToken() {
  return env("WHATSAPP_WEBHOOK_VERIFY_TOKEN") ?? (isWorkspacePreview() ? "preview-whatsapp" : undefined);
}

function tokensEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function verifyWebhookGet(url: URL): Response {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = verifyToken();
  if (mode === "subscribe" && token && expected && challenge && tokensEqual(token, expected)) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new Response("Forbidden", { status: 403 });
}

function verifySignature(raw: string, header: string | null): boolean {
  const secret = env("WHATSAPP_APP_SECRET");
  if (!secret) return true;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice(7);
  try {
    return tokensEqual(expected, given);
  } catch {
    return false;
  }
}

async function sendCloud(to: string, reply: Reply): Promise<{ ok: boolean; skipped: boolean; wamid?: string }> {
  const id = env("WHATSAPP_PHONE_NUMBER_ID");
  const token = env("WHATSAPP_BUSINESS_TOKEN");
  if (!id || !token) return { ok: true, skipped: true };
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
  };
  if (reply.buttons?.length) {
    payload.type = "interactive";
    payload.interactive = {
      type: "button",
      body: { text: reply.text.slice(0, 1024) },
      action: {
        buttons: reply.buttons.slice(0, 3).map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    };
  } else if (reply.list) {
    payload.type = "interactive";
    payload.interactive = {
      type: "list",
      body: { text: reply.text.slice(0, 1024) },
      action: {
        button: reply.list.button.slice(0, 20),
        sections: reply.list.sections,
      },
    };
  } else {
    payload.type = "text";
    payload.text = { body: reply.text.slice(0, 4096), preview_url: false };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${id}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { messages?: { id?: string }[] };
    return { ok: res.ok, skipped: false, wamid: data.messages?.[0]?.id };
  } catch {
    return { ok: false, skipped: false };
  }
}

async function getContact(phone: string): Promise<Contact | null> {
  const sql = await getSql();
  const rows = await sql<Contact>`
    select id, phone, wa_id, profile_name, stage, name, role, geography, need_type, timeline,
           challenge, path_choice, last_inbound, last_inbound_at, unread, escalated, reference_id
    from whatsapp_contacts where phone = ${phone} limit 1
  `;
  return rows[0] ?? null;
}

async function upsertContact(input: {
  phone: string;
  waId?: string;
  profileName?: string;
}): Promise<Contact> {
  const existing = await getContact(input.phone);
  const sql = await getSql();
  if (existing) {
    await sql`
      update whatsapp_contacts
      set wa_id = coalesce(${input.waId ?? null}, wa_id),
          profile_name = coalesce(${input.profileName ?? null}, profile_name),
          updated_at = now()
      where id = ${existing.id}
    `;
    return { ...existing, wa_id: input.waId ?? existing.wa_id, profile_name: input.profileName ?? existing.profile_name };
  }
  const id = crypto.randomUUID();
  const ref = makeRef("WA");
  await sql`
    insert into whatsapp_contacts (id, phone, wa_id, profile_name, stage, reference_id)
    values (${id}, ${input.phone}, ${input.waId ?? null}, ${input.profileName ?? null}, ${"new"}, ${ref})
  `;
  const created = await getContact(input.phone);
  if (!created) throw new Error("contact insert failed");
  return created;
}

async function patchContact(id: string, fields: Partial<Contact>) {
  const sql = await getSql();
  await sql`
    update whatsapp_contacts set
      stage = coalesce(${fields.stage ?? null}, stage),
      name = coalesce(${fields.name ?? null}, name),
      role = coalesce(${fields.role ?? null}, role),
      geography = coalesce(${fields.geography ?? null}, geography),
      need_type = coalesce(${fields.need_type ?? null}, need_type),
      timeline = coalesce(${fields.timeline ?? null}, timeline),
      challenge = coalesce(${fields.challenge ?? null}, challenge),
      path_choice = coalesce(${fields.path_choice ?? null}, path_choice),
      last_inbound = coalesce(${fields.last_inbound ?? null}, last_inbound),
      last_inbound_at = now(),
      unread = coalesce(${fields.unread ?? null}, unread),
      escalated = coalesce(${fields.escalated ?? null}, escalated),
      updated_at = now()
    where id = ${id}
  `;
}

async function storeMessage(contactId: string, direction: "in" | "out", body: string, wamid?: string, msgType = "text") {
  const sql = await getSql();
  if (wamid) {
    const dup = await sql<{ id: string }>`select id from whatsapp_messages where wamid = ${wamid} limit 1`;
    if (dup[0]) return false;
  }
  await sql`
    insert into whatsapp_messages (id, contact_id, wamid, direction, msg_type, body)
    values (${crypto.randomUUID()}, ${contactId}, ${wamid ?? null}, ${direction}, ${msgType}, ${body.slice(0, 8000)})
  `;
  if (direction === "out") {
    await sql`update whatsapp_contacts set last_outbound_at = now(), updated_at = now() where id = ${contactId}`;
  }
  return true;
}

async function replyTo(contact: Contact, reply: Reply) {
  const sent = await sendCloud(contact.phone, reply);
  await storeMessage(contact.id, "out", reply.text, sent.wamid, reply.buttons ? "button" : reply.list ? "list" : "text");
}

async function fileQualification(contact: Contact) {
  const sql = await getSql();
  const ref = contact.reference_id ?? makeRef("WA");
  const email = `wa-${contact.phone}@filed.barncops.in`;
  const existing = await sql<{ id: string }>`
    select id from intake_requests where reference_id = ${ref} limit 1
  `;
  if (!existing[0]) {
    await sql`
      insert into intake_requests (
        id, type, name, role, geography, timeline, challenge, room, need_type,
        contact_channel, email, phone, source_page, consent, reference_id, status
      ) values (
        ${crypto.randomUUID()}, 'intake', ${contact.name ?? contact.profile_name ?? "WhatsApp principal"},
        ${contact.role}, ${contact.geography}, ${contact.timeline}, ${contact.challenge},
        ${"WhatsApp thread"}, ${contact.need_type}, ${"whatsapp"}, ${email}, ${contact.phone},
        ${"/whatsapp"}, ${true}, ${ref}, 'new'
      )
    `;
  }
  const summary = [
    `WhatsApp qualification ${ref}`,
    `Phone: ${contact.phone}`,
    `Name: ${contact.name ?? "—"}`,
    `Role: ${contact.role ?? "—"}`,
    `Need: ${contact.need_type ?? "—"}`,
    `Geography: ${contact.geography ?? "—"}`,
    `Clock: ${contact.timeline ?? "—"}`,
    "",
    "Challenge:",
    contact.challenge ?? "—",
  ].join("\n");
  await sendResend(INTAKE_INBOX, `WhatsApp qualification ${ref} — Barnstorm Co-operations`, summary);
  await postSlack(`WhatsApp qualification ${ref}\n${contact.name ?? contact.phone} · ${contact.role ?? "—"} · ${contact.geography ?? "—"}`);
}

async function escalate(contact: Contact, reason: string, inbound: string) {
  const sql = await getSql();
  await sql`
    update whatsapp_contacts set escalation_reason = ${reason}, escalated = true, escalated_at = now(),
      stage = ${"escalated"}, unread = true, last_inbound = ${inbound}, last_inbound_at = now(), updated_at = now()
    where id = ${contact.id}
  `;
  const ref = contact.reference_id ?? makeRef("WA");
  const summary = [
    `WhatsApp escalation ${ref}`,
    `Reason: ${reason}`,
    `Phone: ${contact.phone}`,
    `Name: ${contact.name ?? contact.profile_name ?? "—"}`,
    `Stage: ${contact.stage}`,
    `Role: ${contact.role ?? "—"}`,
    `Geography: ${contact.geography ?? "—"}`,
    `Need: ${contact.need_type ?? "—"}`,
    "",
    "Last inbound:",
    inbound,
  ].join("\n");
  await sendResend(INTAKE_INBOX, `WhatsApp escalation ${ref} — Barnstorm Co-operations`, summary);
  await postSlack(`WhatsApp escalation ${ref}\n${contact.phone} · ${reason}`);
}

async function fileCallback(contact: Contact, callbackPhone: string, preferredTime: string) {
  const sql = await getSql();
  const ref = makeRef("CB");
  await sql`
    insert into callback_requests (
      id, contact_id, phone, callback_phone, preferred_time, name, geography, need_type, challenge, status, reference_id
    ) values (
      ${crypto.randomUUID()}, ${contact.id}, ${contact.phone}, ${callbackPhone}, ${preferredTime},
      ${contact.name}, ${contact.geography}, ${contact.need_type}, ${contact.challenge}, ${"new"}, ${ref}
    )
  `;
  const summary = [
    `Callback ${ref}`,
    `Call: ${callbackPhone}`,
    `Window: ${preferredTime}`,
    `WhatsApp: ${contact.phone}`,
    `Name: ${contact.name ?? "—"}`,
    `Role: ${contact.role ?? "—"}`,
    `Geography: ${contact.geography ?? "—"}`,
    `Need: ${contact.need_type ?? "—"}`,
  ].join("\n");
  await sendResend(INTAKE_INBOX, `Callback ${ref} — Barnstorm Co-operations`, summary);
  await postSlack(`Callback ${ref}\n${contact.name ?? contact.phone} · ${callbackPhone} · ${preferredTime}`);
  return ref;
}

async function nextFromStage(contact: Contact, text: string, idHint?: string): Promise<{ contact: Contact; reply: Reply | null }> {
  const raw = (idHint || text).trim();
  const stage = contact.stage;

  if (stage === "escalated") {
    return { contact, reply: null };
  }

  if (stage === "new" || stage === "ask_name") {
    if (GREETING_RE.test(text) || !looksLikeName(text)) {
      await patchContact(contact.id, { stage: "ask_name", last_inbound: text, unread: true });
      return { contact: { ...contact, stage: "ask_name" }, reply: { text: msgOpen() } };
    }
    await patchContact(contact.id, { stage: "ask_role", name: text.slice(0, 120), last_inbound: text, unread: true });
    return {
      contact: { ...contact, stage: "ask_role", name: text.slice(0, 120) },
      reply: { text: msgRole(), list: ROLE_LIST },
    };
  }

  if (stage === "ask_role") {
    const role = parseRole(raw);
    if (!role) return { contact, reply: { text: msgUnclear(msgRole()), list: ROLE_LIST } };
    await patchContact(contact.id, { stage: "ask_geography", role, last_inbound: text, unread: true });
    return { contact: { ...contact, stage: "ask_geography", role }, reply: { text: msgGeography() } };
  }

  if (stage === "ask_geography") {
    if (text.replace(/\s+/g, " ").trim().length < 3) {
      return { contact, reply: { text: msgUnclear(msgGeography()) } };
    }
    const geography = text.replace(/\s+/g, " ").trim().slice(0, 240);
    await patchContact(contact.id, { stage: "ask_need", geography, last_inbound: text, unread: true });
    return {
      contact: { ...contact, stage: "ask_need", geography },
      reply: { text: msgNeed(), buttons: NEED_BUTTONS },
    };
  }

  if (stage === "ask_need") {
    const need = parseNeed(raw);
    if (!need) return { contact, reply: { text: msgUnclear(msgNeed()), buttons: NEED_BUTTONS } };
    await patchContact(contact.id, { stage: "ask_timeline", need_type: need, last_inbound: text, unread: true });
    return {
      contact: { ...contact, stage: "ask_timeline", need_type: need },
      reply: { text: msgTimeline(), list: TIME_LIST },
    };
  }

  if (stage === "ask_timeline") {
    const timeline = parseTimeline(raw);
    if (!timeline) return { contact, reply: { text: msgUnclear(msgTimeline()), list: TIME_LIST } };
    await patchContact(contact.id, { stage: "ask_challenge", timeline, last_inbound: text, unread: true });
    return { contact: { ...contact, stage: "ask_challenge", timeline }, reply: { text: msgChallenge() } };
  }

  if (stage === "ask_challenge") {
    if (text.replace(/\s+/g, " ").trim().length < 8) {
      return { contact, reply: { text: msgUnclear(msgChallenge()) } };
    }
    const challenge = text.replace(/\s+/g, " ").trim().slice(0, 4000);
    const next = { ...contact, stage: "offer_path" as const, challenge };
    await patchContact(contact.id, { stage: "offer_path", challenge, last_inbound: text, unread: true });
    await fileQualification(next);
    return { contact: next, reply: { text: msgPath(), list: PATH_LIST } };
  }

  if (stage === "offer_path") {
    const path = parsePath(raw);
    if (!path) return { contact, reply: { text: msgUnclear(msgPath()), list: PATH_LIST } };
    if (path === "callback") {
      await patchContact(contact.id, { stage: "ask_callback_phone", path_choice: path, last_inbound: text, unread: true });
      return {
        contact: { ...contact, stage: "ask_callback_phone", path_choice: path },
        reply: { text: msgCallbackPhone() },
      };
    }
    if (path === "walkthrough") {
      await patchContact(contact.id, { stage: "filed", path_choice: path, last_inbound: text, unread: true });
      await sendResend(
        INTAKE_INBOX,
        `WhatsApp walkthrough ${contact.reference_id ?? ""} — Barnstorm Co-operations`,
        `Walkthrough requested\nPhone: ${contact.phone}\nName: ${contact.name ?? "—"}\nGeography: ${contact.geography ?? "—"}`,
      );
      await postSlack(`WhatsApp walkthrough\n${contact.name ?? contact.phone} · ${contact.geography ?? "—"}`);
      return { contact: { ...contact, stage: "filed", path_choice: path }, reply: { text: msgWalkthrough() } };
    }
    if (path === "intake") {
      await patchContact(contact.id, { stage: "continue", path_choice: path, last_inbound: text, unread: true });
      return { contact: { ...contact, stage: "continue", path_choice: path }, reply: { text: msgIntake() } };
    }
    await patchContact(contact.id, { stage: "continue", path_choice: path, last_inbound: text, unread: true });
    return { contact: { ...contact, stage: "continue", path_choice: path }, reply: { text: msgContinue() } };
  }

  if (stage === "ask_callback_phone") {
    const phone = normalizePhone(text);
    if (!phone) return { contact, reply: { text: msgUnclear(msgCallbackPhone()) } };
    const sql = await getSql();
    await sql`update whatsapp_contacts set path_choice = ${`callback:${phone}`}, stage = ${"ask_callback_time"}, last_inbound = ${text}, last_inbound_at = now(), unread = true, updated_at = now() where id = ${contact.id}`;
    return {
      contact: { ...contact, stage: "ask_callback_time", path_choice: `callback:${phone}` },
      reply: { text: msgCallbackTime() },
    };
  }

  if (stage === "ask_callback_time") {
    const windowText = text.replace(/\s+/g, " ").trim();
    if (!looksLikeCallbackWindow(windowText)) {
      return { contact, reply: { text: msgUnclear(msgCallbackTime()) } };
    }
    const stored = (contact.path_choice ?? "").startsWith("callback:")
      ? contact.path_choice!.slice("callback:".length)
      : contact.phone;
    const ref = await fileCallback({ ...contact, path_choice: stored }, stored, windowText.slice(0, 240));
    await patchContact(contact.id, { stage: "filed", last_inbound: text, unread: true, path_choice: "callback" });
    return { contact: { ...contact, stage: "filed", path_choice: "callback" }, reply: { text: msgCallbackFiled(ref) } };
  }

  if (stage === "continue" || stage === "filed") {
    await patchContact(contact.id, { last_inbound: text, unread: true });
    return { contact, reply: null };
  }

  await patchContact(contact.id, { stage: "ask_name", last_inbound: text, unread: true });
  return { contact: { ...contact, stage: "ask_name" }, reply: { text: msgOpen() } };
}

type Inbound = {
  from: string;
  wamid?: string;
  text: string;
  idHint?: string;
  profileName?: string;
  waId?: string;
  msgType: string;
};

function extractInbounds(payload: unknown): Inbound[] {
  const out: Inbound[] = [];
  const root = payload as {
    entry?: {
      changes?: {
        value?: {
          contacts?: { wa_id?: string; profile?: { name?: string } }[];
          messages?: Record<string, unknown>[];
        };
      }[];
    }[];
  };
  for (const entry of root.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const profileName = value?.contacts?.[0]?.profile?.name;
      const waId = value?.contacts?.[0]?.wa_id;
      for (const msg of value?.messages ?? []) {
        const from = String(msg.from ?? "");
        if (!from) continue;
        const type = String(msg.type ?? "text");
        let text = "";
        let idHint: string | undefined;
        if (type === "text") {
          text = String((msg.text as { body?: string } | undefined)?.body ?? "");
        } else if (type === "interactive") {
          const interactive = msg.interactive as {
            type?: string;
            button_reply?: { id?: string; title?: string };
            list_reply?: { id?: string; title?: string };
          };
          idHint = interactive.button_reply?.id || interactive.list_reply?.id;
          text = interactive.button_reply?.title || interactive.list_reply?.title || idHint || "";
        } else if (type === "button") {
          const button = msg.button as { payload?: string; text?: string } | undefined;
          idHint = button?.payload;
          text = button?.text || button?.payload || "";
        }
        out.push({
          from: from.replace(/\D/g, ""),
          wamid: typeof msg.id === "string" ? msg.id : undefined,
          text,
          idHint,
          profileName,
          waId,
          msgType: type,
        });
      }
    }
  }
  return out;
}

export async function handleInboundMessage(item: Inbound): Promise<{
  stage: string | null;
  reply: string | null;
  ref: string | null;
}> {
  const phone = item.from.replace(/\D/g, "");
  if (!phone) return { stage: null, reply: null, ref: null };
  const contact = await upsertContact({ phone, waId: item.waId, profileName: item.profileName });
  const fresh = item.wamid
    ? await storeMessage(contact.id, "in", item.text || `[${item.msgType}]`, item.wamid, item.msgType)
    : true;
  if (!fresh) return { stage: contact.stage, reply: null, ref: contact.reference_id };

  if (item.msgType !== "text" && item.msgType !== "interactive" && item.msgType !== "button") {
    await replyTo(contact, { text: msgMedia() });
    return { stage: contact.stage, reply: msgMedia(), ref: contact.reference_id };
  }

  const body = item.text.trim();
  if (!body && !item.idHint) return { stage: contact.stage, reply: null, ref: contact.reference_id };

  if (contact.escalated || contact.stage === "escalated") {
    await patchContact(contact.id, { last_inbound: body, unread: true });
    return { stage: "escalated", reply: null, ref: contact.reference_id };
  }

  let active = contact;
  if (contact.stage !== "new" && isStaleConversation(contact.last_inbound_at)) {
    const sql = await getSql();
    await sql`
      update whatsapp_contacts
      set stage = ${"ask_name"}, path_choice = null, last_inbound = ${body}, last_inbound_at = now(),
          unread = true, updated_at = now()
      where id = ${contact.id}
    `;
    active = { ...contact, stage: "ask_name", path_choice: null, last_inbound: body, last_inbound_at: new Date() };
  }

  if (ESCALATE_RE.test(body) && active.stage !== "ask_challenge") {
    await escalate(contact, body.slice(0, 180), body);
    const reply = contact.escalated ? msgRepeat() : msgEscalated();
    await replyTo(contact, { text: reply });
    return { stage: "escalated", reply, ref: contact.reference_id };
  }

  const result = await nextFromStage(active, body, item.idHint);
  if (result.reply) await replyTo(result.contact, result.reply);
  return {
    stage: result.contact.stage,
    reply: result.reply?.text ?? null,
    ref: result.contact.reference_id,
  };
}

export async function handleWebhookPost(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return jsonFail(401, "Invalid signature.");
  }
  let payload: unknown = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    return jsonFail(400, "Invalid payload.");
  }
  const items = extractInbounds(payload);
  const replies: { from: string; stage: string | null; reply: string | null; ref: string | null }[] = [];
  for (const item of items) {
    try {
      const result = await handleInboundMessage(item);
      replies.push({ from: item.from, ...result });
    } catch (err) {
      console.error("[whatsapp] inbound failed", err);
    }
  }
  return jsonOk({ ok: true, handled: items.length, replies });
}

export async function handleWhatsAppSend(request: Request): Promise<Response> {
  const denied = assertAdmin(request);
  if (denied) return denied;
  const raw = (await request.json().catch(() => null)) as { to?: string; text?: string } | null;
  const to = String(raw?.to ?? "").replace(/\D/g, "");
  const text = String(raw?.text ?? "").trim();
  if (to.length < 10 || text.length < 1) return jsonFail(400, "Phone and text are required.");
  const contact = await upsertContact({ phone: to });
  const sent = await sendCloud(to, { text });
  await storeMessage(contact.id, "out", text, sent.wamid);
  if (sent.skipped) return jsonOk({ ok: true, skipped: true });
  if (!sent.ok) return jsonFail(502, "WhatsApp send failed.");
  return jsonOk({ ok: true, skipped: false });
}

export async function handleAdminWhatsApp(headerToken: string | null): Promise<Response> {
  const denied = assertAdmin(
    new Request("https://barnstorm.local/api/admin/whatsapp", {
      headers: headerToken ? { "x-admin-token": headerToken } : {},
    }),
  );
  if (denied) return denied;
  const sql = await getSql();
  const contacts = await sql<Record<string, unknown>>`
    select id, phone, profile_name, stage, name, role, geography, need_type, timeline,
           path_choice, last_inbound, last_inbound_at, unread, escalated, escalation_reason,
           reference_id, created_at, updated_at
    from whatsapp_contacts
    order by updated_at desc
    limit 50
  `;
  const callbacks = await sql<Record<string, unknown>>`
    select id, phone, callback_phone, preferred_time, name, geography, need_type, status, reference_id, created_at
    from callback_requests
    order by created_at desc
    limit 30
  `;
  const messages = await sql<Record<string, unknown>>`
    select id, contact_id, direction, msg_type, body, created_at
    from whatsapp_messages
    order by created_at desc
    limit 40
  `;
  const actor = createHash("sha256").update(headerToken ?? "").digest("hex").slice(0, 12);
  await sql`
    insert into admin_audit_log (id, actor, action, target_id)
    values (${crypto.randomUUID()}, ${actor}, ${"list_whatsapp"}, ${String(contacts.length)})
  `;
  return jsonOk({ ok: true, contacts, callbacks, messages, automation: cloudConfigured() });
}

export async function handleSimulateInbound(request: Request): Promise<Response> {
  const denied = assertAdmin(request);
  if (denied) return denied;
  const raw = (await request.json().catch(() => null)) as { from?: string; text?: string } | null;
  const from = String(raw?.from ?? "").replace(/\D/g, "");
  const text = String(raw?.text ?? "").trim();
  if (from.length < 10 || text.length < 1) return jsonFail(400, "from and text are required.");
  const result = await handleInboundMessage({
    from,
    text,
    msgType: "text",
    wamid: `sim-${crypto.randomUUID()}`,
    profileName: "Simulate",
  });
  return jsonOk({
    ok: true,
    stage: result.stage,
    reference: result.ref,
    reply: result.reply,
  });
}

export { cloudConfigured };
