import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { ClientRoster } from "@/components/firm/client-roster";
import { GlowAvatar } from "@/components/firm/glow-avatar";
import { MetricsBar } from "@/components/firm/metrics-bar";
import { OFFICES, PRINCIPLES } from "@/lib/content/firm";
import { FOUNDER } from "@/lib/content/clients";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "The Agency | Barnstorm Co-operations",
      "Shubh Tiwari founded Barnstorm Co-operations in 2019. Election campaign management across 10+ states, 35+ parliamentary seats, and 200+ assembly segments.",
      "/about",
    ),
  component: About,
});

function About() {
  const t = useT();
  return (
    <main>
      <PageHero kicker={t("aboutKicker")} title={t("aboutTitle")} lede={t("aboutLede")} />
      <MetricsBar />

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-12 relative z-10 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-12 lg:gap-16">
          <div className="flex justify-center lg:col-span-5">
            <GlowAvatar src={FOUNDER.photo} alt={t("founderName")} glow="teal" size="xl" kind="upper" />
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("founderTitle")}</p>
            <h2 className="type-section mt-3 text-fg">{t("founderName")}</h2>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {t("founderBio")}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow">{t("visionKicker")}</p>
            <h2 className="type-section mt-3 text-slate-100">{t("visionTitle")}</h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">{t("visionBody")}</p>
            <div className="relative z-10 mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/platform">{t("gatewayCta")}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/console">{t("osOpen")}</Link>
              </Button>
            </div>
          </div>
          <img
            src="/images/field/ideation-os.jpg"
            alt="Conceptual mandata.ai command center"
            className="h-auto w-full rounded-xl border border-slate-700 object-cover shadow-2xl"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>

      <ClientRoster />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("principles")}</p>
          <h2 className="type-section mt-3 text-fg">{t("principlesTitle")}</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <article key={p.title} className="border-t border-border pt-6">
                <h3 className="font-display text-xl tracking-tight text-fg">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("studios")}</p>
          <h2 className="type-section mt-3 text-fg">{t("studiosTitle")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {OFFICES.map((o) => (
              <article key={o.city} className="bg-surface p-6 shadow-[var(--shadow-border)]">
                <h3 className="font-display text-2xl tracking-tight text-fg">{o.city}</h3>
                <p className="mt-2 text-sm text-muted">{o.role}</p>
                <p className="mt-4 font-mono text-xs text-subtle">{o.address}</p>
              </article>
            ))}
          </div>
          <div className="mt-10">
            <Button asChild>
              <a href="mailto:lead@1cop.in?subject=Application%20for%20Deployment">The Roster</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
