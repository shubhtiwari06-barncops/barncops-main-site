import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/info-request")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientIp, handleInfoRequest, jsonFail, rateLimit } = await import("@/lib/intake/server");
        try {
          const ip = clientIp(request);
          if (!rateLimit("info", ip)) {
            return jsonFail(429, "Too many notes from this network. Wait and try again.");
          }
          const raw = await request.json().catch(() => null);
          return await handleInfoRequest(raw);
        } catch {
          return jsonFail(500, "The note could not be filed. Try again.");
        }
      },
    },
  },
});
