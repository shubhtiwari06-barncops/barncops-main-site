import { createFileRoute } from "@tanstack/react-router";

/** WhatsApp inquiry inbox (list). Env: ADMIN_INBOX_PASSWORD. */
const serve = async ({ request }: { request: Request }) => {
  const { handleInbox, liveInboxDeps } = await import("@/lib/whatsapp/inbox");
  return handleInbox(request, await liveInboxDeps(), null);
};

export const Route = createFileRoute("/admin/wa-inbox/")({
  server: { handlers: { GET: serve, POST: serve } },
});
