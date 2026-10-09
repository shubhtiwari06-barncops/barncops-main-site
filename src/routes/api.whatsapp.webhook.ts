import { createFileRoute } from "@tanstack/react-router";
import { handleInbound } from "../lib/intake-engine";

/**
 * Meta WhatsApp Cloud API webhook — Barnstorm Co-operations
 * v7 — now a thin adapter over the unified intake engine (src/lib/intake-engine.ts).
 * Public behavior identical to v6 (states, copy, Hindi mirror, spam, rate limit,
 * blocklist, soft constituency capture). Messenger + Instagram + X share the
 * same engine via /api/social/webhook and /api/x/webhook.
 *
 * Requires migrations 001 + 002 + 003.
 * Env: WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_BUSINESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
 * This is the only webhook for +91 95222 36699 — Atlas click-to-chat uses the same number.
 */

type MetaTextMessage = { from: string; id: string; timestamp: string; type: string; text?: { body: string } };
type MetaValue = {
  messaging_product?: string;
  metadata?: { display_phone_number?: string; phone_number_id?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
  messages?: MetaTextMessage[];
};
type MetaWebhookPayload = { object?: string; entry?: Array<{ id?: string; changes?: Array<{ value?: MetaValue; field?: string }> }> };

export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge") || "";
        const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected) return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }: { request: Request }) => {
        let payload: MetaWebhookPayload = {};
        try {
          payload = (await request.json()) as MetaWebhookPayload;
        } catch {
          return new Response("ok", { status: 200 });
        }
        try {
          for (const entry of payload.entry || []) for (const change of entry.changes || []) {
            const value = change.value || {};
            const contactName = value.contacts?.[0]?.profile?.name;
            for (const msg of value.messages || []) {
              const isText = msg.type === "text" && !!msg.text?.body;
              await handleInbound({
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
        } catch (err) {
          console.error("[whatsapp] handler error", err);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
