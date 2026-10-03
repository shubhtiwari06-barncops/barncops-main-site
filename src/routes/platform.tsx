import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { IndiaFootprint } from "@/components/map/india-footprint";
import { OsMock } from "@/components/firm/os-mock";
import { FaqBlock } from "@/components/firm/faq-block";
import { CloseCta } from "@/components/firm/close-cta";
import { MODULES, OS_STATS, PLATFORM_WHO } from "@/lib/content/platform";
import { PLATFORM_FAQS } from "@/lib/content/faqs";
import { GOVERNANCE, WORKFLOWS } from "@/lib/content/governance";
import { pageHead } from "@/lib/seo";
import { useCopy, useT } from "@/lib/i18n";

export const Route = createFileRoute("/platform")({
  head: () =>
    pageHead(
      "mandata.ai Constituency Platform | Barnstorm",
      "mandata.ai is the constituency operating system for MPs and MLAs: Jan-Sunwai, citizen connect, booth intelligence, and MPLADS tracking.",
      "/platform",
    ),
  component: Platform,
});

function Platform() {
  const t = useT();
  const faqs = useCopy(PLATFORM_FAQS);
  const gov = useCopy(GOVERNANCE);
  const workflows = useCopy(WORKFLOWS);
  const who = useCopy(PLATFORM_WHO);
  return (
    <main>
      <PageHero
        kicker="Platform · mandata.ai"
        title={t("platformHeroTitle")}
        lede={t("platformHeroLede")}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/contact" search={{ need: "platform" }}>
              {t("ctaWalkthrough")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/console">{t("platformOpen")}</Link>
          </Button>
        </div>
      </PageHero>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("platformWhatKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("platformWhatTitle")}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{t("platformWhatBody")}</p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="grid grid-cols-2 border-b border-border sm:grid-cols-4">
          {OS_STATS.map((s) => (
            <div key={s.label} className="border-r border-border px-4 py-6 last:border-r-0 sm:px-6">
              <p className="font-display text-2xl tracking-tight text-fg sm:text-3xl">{s.value}</p>
              <p className="mt-1 font-mono text-xs text-muted">{s.label}</p>
              <p className="mt-2 text-xs leading-relaxed text-subtle">{s.def}</p>
            </div>
          ))}
        </div>
        <div className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <OsMock className="min-h-96" />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <IndiaFootprint compact />
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("platformWhoKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("platformWhoTitle")}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{t("platformWhoLede")}</p>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {who.map((item) => (
              <article key={item.title} className="bg-bg p-6">
                <h3 className="font-display text-xl tracking-tight text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            <div>
              <p className="eyebrow">{t("forCampaigns")}</p>
              <h3 className="mt-3 font-display text-2xl tracking-tight text-fg">{t("forCampaignsTitle")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t("forCampaignsBody")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("forOffice")}</p>
              <h3 className="mt-3 font-display text-2xl tracking-tight text-fg">{t("forOfficeTitle")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t("forOfficeBody")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("forParties")}</p>
              <h3 className="mt-3 font-display text-2xl tracking-tight text-fg">{t("forPartiesTitle")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t("forPartiesBody")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("modules")}</p>
          <h2 className="type-section mt-3 max-w-2xl text-fg">{t("modulesTitle")}</h2>
          <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((m, i) => (
              <article key={m.id} className="bg-bg p-6">
                <p className="font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 font-display text-xl tracking-tight text-fg">{m.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{m.body}</p>
                <p className="mt-5 font-mono text-xs uppercase tracking-wide text-subtle">{t("moduleWho")}</p>
                <p className="mt-1 text-sm text-muted">{m.who}</p>
                <p className="mt-4 font-mono text-xs uppercase tracking-wide text-subtle">{t("moduleImproves")}</p>
                <p className="mt-1 text-sm text-muted">{m.improves}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("workflowKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("workflowTitle")}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((w) => (
              <article key={w.title} className="border-t border-border pt-6">
                <h3 className="font-display text-xl tracking-tight text-fg">{w.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{w.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="governance" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{gov.kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{gov.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{gov.lede}</p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {gov.items.map((item) => (
              <article key={item.title} className="border-t border-border pt-6">
                <h3 className="font-display text-xl tracking-tight text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm">
            <Link to="/governance" className="text-fg underline-offset-4 hover:underline">
              {t("governanceNav")}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("deployKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("deployTitle")}</h2>
          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <article className="border-t border-border pt-6">
              <h3 className="font-display text-2xl tracking-tight text-fg">{t("deployPlatTitle")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t("deployPlatBody")}</p>
            </article>
            <article className="border-t border-border pt-6">
              <h3 className="font-display text-2xl tracking-tight text-fg">{t("deployAdvTitle")}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{t("deployAdvBody")}</p>
              <Link to="/advisory" className="mt-6 inline-block text-sm text-fg underline-offset-4 hover:underline">
                {t("advisoryPractice")}
              </Link>
            </article>
          </div>
        </div>
      </section>

      <FaqBlock kicker={t("faqKicker")} title={t("faqPlatTitle")} items={faqs} />
      <CloseCta
        kicker={t("access")}
        title={t("closePlatTitle")}
        body={t("closePlatBody")}
        primaryNeed="platform"
        secondaryTo="/advisory"
      />
    </main>
  );
}
