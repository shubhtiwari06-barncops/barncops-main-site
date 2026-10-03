import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { ClientRoster } from "@/components/firm/client-roster";
import { ImpactWall } from "@/components/firm/impact-wall";
import { FOOTPRINT } from "@/lib/content/footprint";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/track-record")({
  head: () =>
    pageHead(
      "Track Record | Barnstorm Co-operations",
      "Operating footprint since 2019: about 90 million electors, 200+ assembly segments, 35+ parliamentary constituencies, and 10+ states.",
      "/track-record",
    ),
  component: TrackRecord,
});

function TrackRecord() {
  const t = useT();
  return (
    <main>
      <PageHero kicker={t("trackRecord")} title={t("impactSeoTitle")} lede={t("impactLede")} />
      <ImpactWall intro={false} />
      <ClientRoster />

      <section>
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("impactStatesKicker")}</p>
          <h2 className="type-section mt-3 text-fg">{t("impactStatesTitle")}</h2>
          <div className="mt-10 divide-y divide-border border-y border-border">
            {FOOTPRINT.map((s) => (
              <article key={s.id} className="grid gap-2 py-6 sm:grid-cols-12 sm:items-start">
                <p className="font-mono text-xs text-subtle sm:col-span-2">{s.short}</p>
                <div className="sm:col-span-4">
                  <h3 className="font-sans text-lg font-semibold tracking-tight text-fg">{s.id}</h3>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {s.pcCount} {t("pcLabel")} · {s.acCount} {t("acLabel")}
                  </p>
                  <p className="mt-2 font-mono text-xs leading-relaxed text-accent">{s.cycles}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted sm:col-span-6">{s.pcs.join(" · ")}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <Button asChild>
              <Link to="/contact">{t("ctaBrief")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
