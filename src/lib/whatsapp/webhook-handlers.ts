import { verifyHubToken, verifyMetaSignature } from "./meta-sig.ts";
import type { WaEvent } from "./route.ts";

type Route = (ev: WaEvent) => Promise<unknown>;

type MetaMessage = {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: { type?: string; button_reply?: { id?: string; title?: string }; list_reply?: { id?: string; title?: string } };
  button?: { payload?: string; text?: string };
};
type MetaValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: MetaMessage[];
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

/** Inbound person messages only: statuses, echoes, history and account updates are other fields or carry no messages. */
export function eventsOf(payload: MetaWebhookPayload): WaEvent[] {
  const out: WaEvent[] = [];
  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      if (change.field && change.field !== "messages") continue;
      const value = change.value || {};
      const contactName = value.contacts?.[0]?.profile?.name || null;
      for (const msg of value.messages || []) {
        const reply = msg.interactive?.button_reply || msg.interactive?.list_reply;
        const text = msg.type === "text" ? msg.text?.body || null : reply?.title || msg.button?.text || null;
        out.push({
          phoneNumberId: value.metadata?.phone_number_id || null,
          from: msg.from,
          wamid: msg.id || null,
          type: msg.type,
          text,
          buttonId: reply?.id || msg.button?.payload || null,
          profileName: contactName,
          timestamp: msg.timestamp || null,
        });
      }
    }
  }
  return out;
}

async function liveRoute(): Promise<Route> {
  const R = await import("./route.ts");
  const E = await import("../intake-engine.ts");
  const store = await R.defaultStore();
  const deps = {
    store,
    now: () => Date.now(),
    atlas: E.atlasAnswer,
    sendText: (id: string, to: string, body: string, preview?: boolean) => E.sendWhatsAppText(to, body, !!preview, id),
    sendButton: (id: string, to: string, body: string, buttonId: string, title: string) => E.sendWhatsAppButton(to, body, buttonId, title, id),
    email: (e: { subject: string; displayName: string; rows: Array<[string, string]>; note?: string }) => E.emailTeam("whatsapp", e),
  };
  return (ev) => R.routeEvent(ev, deps);
}

export async function handleWhatsAppWebhookPost(request: Request, route?: Route): Promise<Response> {
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
    const events = eventsOf(payload);
    if (events.length) {
      const run = route || (await liveRoute());
      for (const ev of events) await run(ev);
    }
  } catch (err) {
    console.error("[whatsapp] handler error", err);
  }
  return new Response("ok", { status: 200 });
}
