import { createFileRoute } from "@tanstack/react-router";
import { handleWhatsAppWebhookGet, handleWhatsAppWebhookPost } from "../lib/whatsapp/webhook-handlers";

/**
 * Meta WhatsApp Cloud API webhook — Barnstorm Co-operations
 * POST is rejected unless X-Hub-Signature-256 matches HMAC-SHA256(raw body, META_APP_SECRET).
 * GET is the hub.verify_token handshake. This is the only webhook for +91 95222 36699.
 *
 * Env: META_APP_SECRET, WHATSAPP_WEBHOOK_VERIFY_TOKEN, WHATSAPP_BUSINESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID.
 * Requires migrations 001 + 002 + 003.
 */

export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleWhatsAppWebhookGet(new URL(request.url)),
      POST: async ({ request }: { request: Request }) => handleWhatsAppWebhookPost(request),
    },
  },
});
