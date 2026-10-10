import { verifyHubToken, verifyMetaSignature } from "./meta-sig.ts";

type Inbound = (input: {
  channel: "whatsapp";
  senderKey: string;
  text: string | null;
  kind: "text" | "media";
  mediaType: string | null;
  profileName: string | null;
  timestamp: string | null;
  messageId: string | null;
}) => Promise<unknown>;

type MetaTextMessage = { from: string; id: string; timestamp: string; type: string; text?: { body: string } };
type MetaValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: MetaTextMessage[];
};
type MetaWebhookPayload = { object?: string; entry?: Array<{ id?: string; changes?: Array<{ value?: MetaValue; field?: string }> }> };

export async function handleWhatsAppWebhookGet(url: URL): Promise<Response> {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge") || "";
  const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (mode === "subscribe" && verifyHubToken(token, expected)) {
    return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function handleWhatsAppWebhookPost(request: Request, inbound?: Inbound): Promise<Response> {
  const raw = Buffer.from(await request.arrayBuffer());
  const header = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(raw, header, process.env.META_APP_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: MetaWebhookPayload = {};
  try {
    payload = JSON.parse(raw.toString("utf8")) as MetaWebhookPayload;
  } catch {
    return new Response("ok", { status: 200 });
  }

  try {
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const contactName = value.contacts?.[0]?.profile?.name;
        for (const msg of value.messages || []) {
          const run: Inbound = inbound || (await import("../intake-engine")).handleInbound;
          const isText = msg.type === "text" && !!msg.text?.body;
          await run({
            channel: "whatsapp",
            senderKey: msg.from,
            text: isText ? msg.text!.body : null,
            kind: isText ? "text" : "media",
            mediaType: isText ? null : msg.type,
            profileName: contactName || null,
            timestamp: msg.timestamp || null,
            messageId: msg.id || null,
          });
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp] handler error", err);
  }
  return new Response("ok", { status: 200 });
}
