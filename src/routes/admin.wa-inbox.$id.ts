import { createFileRoute } from "@tanstack/react-router";

/** One WhatsApp inquiry: thread + reply from the line it came in on. Env: ADMIN_INBOX_PASSWORD, WA_REPLY_TEMPLATE. */
const serve = async ({ request, params }: { request: Request; params: { id: string } }) => {
  const { handleInbox, liveInboxDeps } = await import("@/lib/whatsapp/inbox");
  const id = /^\d{1,12}$/.test(params.id) ? Number(params.id) : -1;
  return handleInbox(request, await liveInboxDeps(), id);
};

export const Route = createFileRoute("/admin/wa-inbox/$id")({
  server: { handlers: { GET: serve, POST: serve } },
});
