import { metaAppSecret, verifyHubToken, verifyMetaSignature } from "./meta-sig.ts";
import { admit, handle, note, routeConfig, type RouteConfig, type RouteDeps, type WaEvent } from "./route.ts";

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

export async function liveDeps(): Promise<RouteDeps> {
  const R = await import("./route.ts");
  const E = await import("../intake-engine.ts");
  const store = await R.defaultStore();
  return {
    store,
    now: () => Date.now(),
    atlas: E.atlasAnswer,
    sendText: (id, to, body, preview) => E.sendWhatsAppText(to, body, !!preview, id),
    sendButton: (id, to, body, buttonId, title) => E.sendWhatsAppButton(to, body, buttonId, title, id),
    sendButtons: (id, to, body, buttons) => E.sendWhatsAppButtons(to, body, buttons, id),
    email: (e) => E.emailTeam("whatsapp", e),
  };
}

type WaitUntil = (p: Promise<unknown>) => void;

/** Vercel's per-request background hook; undefined elsewhere (then the work is awaited before the 200). */
function vercelWaitUntil(): WaitUntil | undefined {
  const ctx = (globalThis as Record<symbol, { get?: () => { waitUntil?: WaitUntil } | undefined } | undefined>)[Symbol.for("@vercel/request-context")];
  const wu = ctx?.get?.()?.waitUntil;
  return typeof wu === "function" ? wu : undefined;
}

/** Status callbacks and refused POSTs are frequent: record each kind at most once a minute per instance. */
const lastNoted = new Map<string, number>();
function throttle(kind: string, now = Date.now()): boolean {
  if (now - (lastNoted.get(kind) || 0) < 60_000) return false;
  lastNoted.set(kind, now);
  return true;
}

export type WebhookOpts = { deps?: RouteDeps; cfg?: RouteConfig; waitUntil?: WaitUntil | null };

/**
 * Signature → parse → admit (route, type, Meta-id dedupe) → 200. Replies, rows and email run
 * after the response via waitUntil, so Meta never waits on Atlas and never retries for slowness.
 */
export async function handleWhatsAppWebhookPost(request: Request, opts: WebhookOpts = {}): Promise<Response> {
  const receivedAt = Date.now();
  const raw = Buffer.from(await request.arrayBuffer());
  const header = request.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(raw, header, metaAppSecret())) {
    const verdict = header ? "signature_mismatch" : "signature_missing";
    console.error("[whatsapp] webhook refused", verdict);
    if (throttle("sig")) await note(opts.deps || (await liveDeps()), "signature_fail", "none", verdict);
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
    if (!events.length) {
      if (throttle("signed")) await note(opts.deps || (await liveDeps()), "signed_no_messages", "none", null);
      return new Response("ok", { status: 200 });
    }
    const deps = opts.deps || (await liveDeps());
    const cfg = opts.cfg || routeConfig();
    const admitted: WaEvent[] = [];
    for (const ev of events) if (!(await admit(ev, deps, cfg))) admitted.push(ev);
    if (admitted.length) {
      const waitUntil = opts.waitUntil === null ? undefined : opts.waitUntil || vercelWaitUntil();
      const work = async (bg: boolean) => {
        for (const ev of admitted) {
          try {
            await handle(ev, deps, cfg, receivedAt, bg);
          } catch (err) {
            console.error("[whatsapp] handler error", (err as Error)?.message);
            await note(deps, "handler_error", "none", String((err as Error)?.name || "Error").slice(0, 40));
          }
        }
      };
      if (waitUntil) waitUntil(work(true));
      else await work(false);
    }
  } catch (err) {
    console.error("[whatsapp] handler error", (err as Error)?.message);
  }
  return new Response("ok", { status: 200 });
}
