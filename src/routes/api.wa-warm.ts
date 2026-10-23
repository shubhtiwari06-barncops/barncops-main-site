import { createFileRoute } from "@tanstack/react-router";

/**
 * Keep-warm ping (Vercel cron, every 5 min): loads the WhatsApp route + store on this function
 * and pings the Atlas engine's warm path. Returns timings only — no secrets, no data.
 * Env: ATLAS_WA_ASK_URL (the warm ping goes to <url>?warm=1), CRON_SECRET (Vercel sends it as a Bearer token).
 */
export const Route = createFileRoute("/api/wa-warm")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const cron = (process.env.CRON_SECRET || "").trim();
        if (cron && request.headers.get("authorization") !== `Bearer ${cron}`) {
          return new Response("Unauthorized", { status: 401 });
        }
        const t0 = Date.now();
        const R = await import("@/lib/whatsapp/route");
        const store = await R.defaultStore();
        await store.timings(1).catch(() => []);
        await import("@/lib/intake-engine");
        const local = Date.now() - t0;
        let atlas: number | string = "skipped";
        const url = (process.env.ATLAS_WA_ASK_URL || "").trim();
        if (/^https:\/\//i.test(url)) {
          const t1 = Date.now();
          try {
            const u = new URL(url);
            u.searchParams.set("warm", "1");
            const r = await fetch(u, { signal: AbortSignal.timeout(10000) });
            atlas = r.ok ? Date.now() - t1 : `status ${r.status}`;
          } catch {
            atlas = "error";
          }
        }
        return Response.json({ ok: true, local_ms: local, atlas_ms: atlas }, { headers: { "cache-control": "no-store" } });
      },
    },
  },
});
