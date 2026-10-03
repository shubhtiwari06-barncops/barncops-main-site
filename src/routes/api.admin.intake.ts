import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/intake")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { clientIp, handleAdminList, jsonFail, rateLimit } = await import("@/lib/intake/server");
        try {
          if (!rateLimit("admin", clientIp(request))) {
            return jsonFail(429, "Too many attempts. Wait and try again.");
          }
          return await handleAdminList(request.headers.get("x-admin-token"));
        } catch {
          return jsonFail(500, "The file could not be read.");
        }
      },
    },
  },
});
