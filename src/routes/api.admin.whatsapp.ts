import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientIp, jsonFail, rateLimit } = await import("@/lib/intake/server");
        const { handleAdminWhatsApp } = await import("@/lib/whatsapp/server");
        try {
          if (!rateLimit("admin-wa", clientIp(request))) {
            return jsonFail(429, "Too many attempts. Wait and try again.");
          }
          return await handleAdminWhatsApp(request.headers.get("x-admin-token"));
        } catch {
          return jsonFail(500, "The file could not be read.");
        }
      },
      POST: async ({ request }) => {
        const { clientIp, jsonFail, rateLimit } = await import("@/lib/intake/server");
        const { handleSimulateInbound } = await import("@/lib/whatsapp/server");
        try {
          if (!rateLimit("admin-wa-sim", clientIp(request), 40)) {
            return jsonFail(429, "Too many attempts. Wait and try again.");
          }
          return await handleSimulateInbound(request);
        } catch {
          return jsonFail(500, "The inbound could not be filed.");
        }
      },
    },
  },
});
