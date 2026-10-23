import { createFileRoute } from "@tanstack/react-router";

/**
 * Keep-warm ping (Vercel cron, every 5 min): loads the WhatsApp route + store on this function
 * and pings the Atlas engine's warm path. Also reports deploy health as names/booleans only:
 * missing env names, applied migrations, missing WhatsApp tables, whether ATLAS_WA_ASK_URL is
 * the Atlas production host. Never returns a value.
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
        const H = await import("@/lib/whatsapp/health");
        const t0 = Date.now();
        const R = await import("@/lib/whatsapp/route");
        const store = await R.defaultStore();
        await store.timings(1).catch(() => []);
        await import("@/lib/intake-engine");
        const local = Date.now() - t0;

        let db: unknown = "no_database_url";
        if (process.env.DATABASE_URL) {
          try {
            const pg = await import("pg");
            const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
            try {
              db = await H.dbHealth((sql, params) => pool.query(sql, params));
            } finally {
              await pool.end();
            }
          } catch {
            db = "unreachable";
          }
        }

        let atlas: number | string = "skipped";
        const url = (process.env.ATLAS_WA_ASK_URL || "").trim();
        if (/^https:\/\//i.test(url)) {
          const t1 = Date.now();
          try {
            const u = new URL(url);
            u.searchParams.set("warm", "1");
            const r = await fetch(u, { signal: AbortSignal.timeout(10000), redirect: "manual" });
            const j = (await r.json().catch(() => null)) as { warm?: boolean } | null;
            atlas = r.ok && j?.warm ? Date.now() - t1 : `status ${r.status}`;
          } catch {
            atlas = "error";
          }
        }
        const ids = H.phoneIdCheck(process.env);
        const secret = await H.atlasSecretCheck(process.env);
        let webhook: unknown = "unavailable";
        try {
          webhook = await store.health(Date.now());
        } catch {
          webhook = "unavailable";
        }
        return Response.json(
          {
            ok: true,
            local_ms: local,
            atlas_ms: atlas,
            atlas_url: H.atlasUrlKind(process.env.ATLAS_WA_ASK_URL),
            atlas_secret_ok: secret.ok,
            atlas_secret_status: secret.status,
            phone_ids_consistent: ids.consistent,
            phone_ids: ids.detail,
            env_missing: H.missingEnv(process.env),
            db,
            webhook,
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
