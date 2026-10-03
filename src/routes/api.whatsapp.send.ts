import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/whatsapp/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientIp, jsonFail, rateLimit } = await import("@/lib/intake/server");
        const { handleWhatsAppSend } = await import("@/lib/whatsapp/server");
        try {
          if (!rateLimit("wa-send", clientIp(request))) {
            return jsonFail(429, "Too many attempts. Wait and try again.");
          }
          return await handleWhatsAppSend(request);
        } catch {
          return jsonFail(500, "WhatsApp send failed.");
        }
      },
    },
  },
});
