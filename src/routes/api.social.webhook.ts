import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { handleInbound } from "../lib/intake-engine";

/**
 * Meta social webhook — Messenger + Instagram DMs — Barnstorm Co-operations
 * v7 unified intake. One Meta app, one Page token, both channels.
 *
 * - GET  /api/social/webhook : Meta verification handshake (SOCIAL_WEBHOOK_VERIFY_TOKEN)
 * - POST /api/social/webhook : inbound messages (object "page" = Messenger,
 *   object "instagram" or messaging_product "instagram" = Instagram DMs)
 *
 * Env: SOCIAL_WEBHOOK_VERIFY_TOKEN, META_APP_SECRET (optional but recommended),
 *      MESSENGER_PAGE_ID, MESSENGER_PAGE_TOKEN (shared with engine).
 * Requires migrations 001 + 002 + 003.
 */

type MetaMsg = {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { mid?: string; is_echo?: boolean; text?: string; attachments?: Array<{ type?: string; mime_type?: string }> };
  // Newer Instagram webhook shape
  from?: { id?: string; username?: string };
  to?: { id?: string };
  text?: string;
  id?: string;
  is_echo?: boolean;
};
type MetaValue = { messaging_product?: string; contacts?: Array<{ profile?: { name?: string } }>; messages?: MetaMsg[] };
type MetaEntry = { id?: string; time?: number; changes?: Array<{ field?: string; value?: MetaValue }>; messaging?: MetaMsg[] };
type MetaPayload = { object?: string; entry?: MetaEntry[] };

export const Route = createFileRoute("/api/social/webhook")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge") || "";
        const expected = process.env.SOCIAL_WEBHOOK_VERIFY_TOKEN;
        if (mode === "subscribe" && expected && token === expected) return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }: { request: Request }) => {
        const raw = await request.text().catch(() => "");

        // Signature check (recommended): X-Hub-Signature-256 = "sha256=" + hex HMAC-SHA256(raw, META_APP_SECRET)
        const appSecret = process.env.META_APP_SECRET;
        const sigHeader = request.headers.get("x-hub-signature-256");
        if (appSecret && sigHeader) {
          const expected = "sha256=" + createHmac("sha256", appSecret).update(raw).digest("hex");
          if (sigHeader !== expected) {
            console.warn("[social] signature mismatch — dropped");
            return new Response("Forbidden", { status: 403 });
          }
        } else if (appSecret && !sigHeader) {
          console.warn("[social] no signature header (some retries omit it) — processing anyway");
        }

        let payload: MetaPayload = {};
        try {
          payload = JSON.parse(raw) as MetaPayload;
        } catch {
          return new Response("ok", { status: 200 });
        }

        try {
          const obj = payload.object;
          const handleOne = async (m: MetaMsg, channel: "messenger" | "instagram", contactName: string | null) => {
            const isEcho = !!(m.message?.is_echo || m.is_echo);
            if (isEcho) return;
            const senderId = m.sender?.id || m.from?.id || null;
            if (!senderId) return;
            const text = m.message?.text ?? m.text ?? null;
            const att = m.message?.attachments?.[0];
            const kind: "text" | "media" = text ? "text" : "media";
            const mediaType = att?.mime_type || att?.type || null;
            await handleInbound({
              channel,
              senderKey: senderId,
              text,
              kind,
              mediaType,
              profileName: m.from?.username || contactName,
              timestamp: null,
              messageId: m.message?.mid || m.id || null,
            });
          };
          for (const entry of payload.entry || []) {
            // Messenger shape: entry.messaging[] with sender/recipient/message
            for (const m of entry.messaging || []) {
              const chan = obj === "instagram" ? ("instagram" as const) : ("messenger" as const);
              await handleOne(m, chan, null);
            }
            // Instagram / change-list shape: entry.changes[].value.messages[]
            for (const change of entry.changes || []) {
              const value = change.value || {};
              const contactName = value.contacts?.[0]?.profile?.name || null;
              const chan = obj === "instagram" || value.messaging_product === "instagram" ? ("instagram" as const) : ("messenger" as const);
              for (const m of value.messages || []) await handleOne(m, chan, contactName);
            }
          }
        } catch (err) {
          console.error("[social] handler error", err);
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
