import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/whatsapp/notify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { assertAdmin, clientIp, jsonFail, jsonOk, notifyWhatsApp, rateLimit } =
          await import("@/lib/intake/server");
        try {
          if (!rateLimit("wa-notify", clientIp(request))) {
            return jsonFail(429, "Too many attempts. Wait and try again.");
          }
          const denied = assertAdmin(request);
          if (denied) return denied;
          const raw = (await request.json().catch(() => null)) as {
            to?: string;
            ref?: string;
            name?: string;
          } | null;
          const result = await notifyWhatsApp({
            to: String(raw?.to ?? ""),
            ref: String(raw?.ref ?? ""),
            name: raw?.name,
          });
          if (result.skipped) return jsonOk({ ok: true, skipped: true });
          if (!result.ok) return jsonFail(502, "WhatsApp notify failed.");
          return jsonOk({ ok: true, skipped: false });
        } catch {
          return jsonFail(500, "WhatsApp notify failed.");
        }
      },
    },
  },
});
