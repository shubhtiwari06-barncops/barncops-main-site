import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public-config")({
  server: {
    handlers: {
      GET: async () => {
        const { jsonOk, publicConfig } = await import("@/lib/intake/server");
        return jsonOk({ ok: true, ...publicConfig() });
      },
    },
  },
});
