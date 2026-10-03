import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";
import { handleInbound } from "../lib/intake-engine";

/**
 * X (Twitter) webhook — DM intake — Barnstorm Co-operations
 * v7 unified intake, via the X Activity API (pay-per-use credits).
 *
 * - GET  /api/x/webhook : CRC handshake — X calls with ?crc_token=<token>,
 *   we respond {"response": base64(HMAC-SHA256(crc_token, X_API_SECRET))}.
 * - POST /api/x/webhook : dm.received events → intake engine.
 *
 * Env: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET, X_USER_ID.
 * Requires migrations 001 + 002 + 003, an X developer app with credits,
 * OAuth 2.0 user token granted dm.read (subscription), and the handle set to
 * allow DMs from anyone.
 */

export const Route = createFileRoute("/api/x/webhook")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const crc = url.searchParams.get("crc_token");
        const secret = process.env.X_API_SECRET;
        if (!crc || !secret) return new Response("Bad Request", { status: 400 });
        const response = createHmac("sha256", secret).update(crc).digest("base64");
        return new Response(JSON.stringify({ response, content_type: "application/json" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
      POST: async ({ request }: { request: Request }) => {
        const raw = await request.text().catch(() => "");

        // Signature check when X sends it: base64 HMAC-SHA256(raw, X_API_SECRET)
        const secret = process.env.X_API_SECRET;
        const sig = request.headers.get("x-webhook-signature");
        if (secret && sig && sig !== createHmac("sha256", secret).update(raw).digest("base64")) {
          console.warn("[x] signature mismatch — dropped");
          return new Response("Forbidden", { status: 403 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("ok", { status: 200 });
        }

        const selfId = process.env.X_USER_ID || "";
        const events: any[] = Array.isArray((payload as any)?.events)
          ? (payload as any).events
          : Array.isArray(payload)
            ? (payload as any[])
            : [payload];

        for (const ev of events) {
          try {
            const evType: string = ev?.type || ev?.type_name || ev?.event_type || "";
            const isDm = evType.includes("dm.received") || (!evType && !!(ev?.text || ev?.dm_event?.text || ev?.message_data?.text));
            if (!isDm) continue;

            const inner = ev?.dm_event || ev?.message_data || ev;
            const text: string | null = inner?.text ?? null;
            let senderId: string | null = inner?.sender_id ?? inner?.sender?.id ?? inner?.author_id ?? null;
            if (!senderId && Array.isArray(inner?.participants)) {
              const others = inner.participants.map((p: any) => String(p?.id || p?.user_id || p)).filter((id: string) => id && id !== selfId);
              senderId = others[0] ?? null;
            }
            if (!senderId || senderId === selfId) continue; // our own outbound echo

            if (!text) {
              console.log("[x] dm without text (media?) — logged for review:", JSON.stringify(ev).slice(0, 1500));
              continue;
            }

            await handleInbound({
              channel: "x",
              senderKey: String(senderId),
              text,
              kind: "text",
              mediaType: null,
              profileName: inner?.sender?.username || inner?.username || inner?.sender?.handle || null,
              timestamp: inner?.created_at ? String(Math.floor(new Date(inner.created_at).getTime() / 1000)) : null,
              messageId: inner?.id || inner?.dm_id || null,
            });
          } catch (err) {
            console.error("[x] event handler error", err);
          }
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
