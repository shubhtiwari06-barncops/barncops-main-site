import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/intake")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { clientIp, handleIntake, jsonFail, rateLimit } = await import("@/lib/intake/server");
        try {
          const ip = clientIp(request);
          if (!rateLimit("intake", ip)) {
            return jsonFail(429, "Too many briefs from this network. Wait and try again.");
          }
          const raw = await request.json().catch(() => null);
          return await handleIntake(raw);
        } catch {
          return jsonFail(500, "The brief could not be filed. Try again.");
        }
      },
    },
  },
});
