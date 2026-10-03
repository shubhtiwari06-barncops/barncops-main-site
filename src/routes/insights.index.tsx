import { Link, createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/layout/page-hero";
import { INSIGHTS } from "@/lib/content/insights";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/insights/")({
  head: () =>
    pageHead(
      "Political Insights | Barnstorm",
      "Notes from the advisory practice and the builders of mandata.ai on booth systems, Jan-Sunwai, and constituency funds.",
      "/insights",
    ),
  component: InsightsIndex,
});

function InsightsIndex() {
  const t = useT();
  return (
    <main>
      <PageHero kicker={t("insightsKicker")} title={t("insightsHeroTitle")} lede={t("insightsHeroLede")}>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">{t("insightsNote")}</p>
      </PageHero>
      <section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ul className="divide-y divide-border border-b border-border">
            {INSIGHTS.map((a) => (
              <li key={a.slug}>
                <Link
                  to="/insights/$slug"
                  params={{ slug: a.slug }}
                  className="grid gap-3 py-8 no-underline transition-colors duration-150 hover:bg-surface sm:grid-cols-12 sm:items-baseline"
                >
                  <div className="sm:col-span-3">
                    <p className="font-mono text-xs text-subtle">{a.date}</p>
                    <p className="mt-1 font-mono text-xs text-muted">{a.kicker}</p>
                  </div>
                  <div className="sm:col-span-9">
                    <h2 className="font-display text-2xl tracking-tight text-fg">{a.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{a.dek}</p>
                    <p className="mt-3 font-mono text-xs text-subtle">Barnstorm Co-operations · {a.minutes} min</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
