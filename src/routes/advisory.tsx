import { useEffect, type ReactNode } from "react";
import { Link, createFileRoute, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { BriefMock, BoothMock, PerceptionMock } from "@/components/firm/desk-mocks";
import { FaqBlock } from "@/components/firm/faq-block";
import { CloseCta } from "@/components/firm/close-cta";
import { MandateFile } from "@/components/firm/mandate-file";
import { ReadMore, firstTwoSentences } from "@/components/firm/read-more";
import { ENGAGEMENTS, SERVICES } from "@/lib/content/services";
import { CASES } from "@/lib/content/cases";
import { ADVISORY_FAQS } from "@/lib/content/faqs";
import { PROCESS, WHY } from "@/lib/content/site-copy";
import { pageHead } from "@/lib/seo";
import { useCopy, useT } from "@/lib/i18n";

export const Route = createFileRoute("/advisory")({
  head: () =>
    pageHead(
      "Election Campaign Consulting | Barnstorm",
      "Election campaign consulting for candidates, MPs, and MLAs: narrative strategy, booth intelligence, and political war-room management.",
      "/advisory",
    ),
  component: Advisory,
});

function Advisory() {
  const t = useT();
  const faqs = useCopy(ADVISORY_FAQS);
  const process = useCopy(PROCESS);
  const why = useCopy(WHY);
  useHashScroll();

  return (
    <main>
      <PageHero
        kicker={t("advisory")}
        title={t("advisoryHeroTitle")}
        lede={t("advisoryHeroLede")}
        media={
          <img
            src="/images/field/advisory-desk.jpg"
            alt="War-room briefing over constituency maps"
            className="h-auto w-full rounded-xl object-cover shadow-2xl"
            width={1600}
            height={756}
          />
        }
      >
        <div className="relative z-10 mt-8 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button asChild size="lg">
            <Link to="/contact" search={{ need: "advisory" }}>
              {t("ctaBrief")}
            </Link>
          </Button>
          <Button asChild variant="strike" size="lg">
            <Link to="/platform">{t("ctaPlatform")}</Link>
          </Button>
        </div>
      </PageHero>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
            <p className="eyebrow">{t("advisoryHow")}</p>
            <h2 className="type-section mt-3 text-slate-100">{t("advisorySeat")}</h2>
            <ReadMore lead={firstTwoSentences(t("advisoryBody1")).lead}>
              {firstTwoSentences(t("advisoryBody1")).extra ? (
                <p>{firstTwoSentences(t("advisoryBody1")).extra}</p>
              ) : null}
              <p>{t("advisoryBody2")}</p>
            </ReadMore>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("whoAdvKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("whoAdvTitle")}</h2>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2">
            {[t("whoAdv1"), t("whoAdv2"), t("whoAdv3"), t("whoAdv4")].map((line) => (
              <li key={line} className="border-t border-border pt-5 text-sm leading-relaxed text-muted sm:text-base">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DeskSection
        id="narrative"
        kicker={t("narrativeKicker")}
        title={t("narrativeTitle")}
        body={t("narrativeBody")}
        mock={<BriefMock className="min-h-96" />}
      />
      <DeskSection
        id="digital"
        kicker={t("digitalKicker")}
        title={t("digitalTitle")}
        body={t("digitalBody")}
        mock={<PerceptionMock className="min-h-96" />}
        flip
      />
      <DeskSection
        id="booth"
        kicker={t("boothDeskKicker")}
        title={t("boothDeskTitle")}
        body={t("boothDeskBody")}
        mock={<BoothMock className="min-h-96" />}
      />

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("practices")}</p>
          <h2 className="type-section mt-3 max-w-2xl text-fg">{t("practicesTitle")}</h2>
          <div className="mt-12 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const summary = firstTwoSentences(s.summary);
              return (
              <article key={s.id} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="font-mono text-xs text-subtle">{s.kicker}</p>
                <h3 className="mt-3 font-display text-xl tracking-tight text-slate-100">{s.title}</h3>
                <ReadMore lead={summary.lead}>
                  {summary.extra ? <p>{summary.extra}</p> : null}
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("pillarDoes")}</span>
                    <span className="mt-1 block">{s.does}</span>
                  </p>
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("pillarFor")}</span>
                    <span className="mt-1 block">{s.for}</span>
                  </p>
                  <p>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("pillarImproves")}</span>
                    <span className="mt-1 block">{s.improves}</span>
                  </p>
                </ReadMore>
              </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{process.kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{process.title}</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {process.items.map((step) => (
              <li key={step.n} className="border-t border-border pt-5">
                <p className="font-mono text-xs text-subtle">{step.n}</p>
                <h3 className="mt-3 font-display text-lg tracking-tight text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <div>
            <p className="eyebrow">{t("engagements")}</p>
            <h2 className="type-section mt-3 text-slate-100">{t("engagementsTitle")}</h2>
            <div className="mt-8 space-y-6">
              {ENGAGEMENTS.map((e) => {
                const fit = firstTwoSentences(e.fit);
                return (
                <article key={e.title} className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <h3 className="font-display text-xl tracking-tight text-slate-100">{e.title}</h3>
                  <p className="mt-2 font-mono text-xs text-slate-400">{e.term}</p>
                  <ReadMore lead={fit.lead}>
                    {fit.extra ? <p>{fit.extra}</p> : null}
                    <p>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("engIncludes")}</span>
                      <span className="mt-1 block">{e.includes}</span>
                    </p>
                    <p>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("engChoose")}</span>
                      <span className="mt-1 block">{e.choose}</span>
                    </p>
                  </ReadMore>
                </article>
                );
              })}
            </div>
          </div>
          <p className="mt-8 text-sm text-slate-300">
            <Link to="/platform" className="text-slate-100 underline-offset-4 hover:underline">
              {t("ctaPlatform")}
            </Link>
            {" · "}
            <Link to="/work" className="text-slate-100 underline-offset-4 hover:underline">
              {t("caseStudies")}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("outcomesKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("outcomesTitle")}</h2>
          <div className="mt-12 space-y-8">
            {CASES.slice(0, 3).map((c, i) => (
              <MandateFile key={c.slug} item={c} index={i + 1} />
            ))}
          </div>
          <p className="mt-8 text-sm">
            <Link to="/work" className="text-fg underline-offset-4 hover:underline">
              {t("workAll")}
            </Link>
          </p>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("whyAdvKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{t("whyAdvTitle")}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {why.items.map((item) => (
              <article key={item.title} className="border-t border-border pt-6">
                <h3 className="font-display text-xl tracking-tight text-fg">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock kicker={t("faqKicker")} title={t("faqAdvTitle")} items={faqs} />
      <CloseCta
        kicker={t("closeKicker")}
        title={t("closeAdvTitle")}
        body={t("closeAdvBody")}
        primaryNeed="advisory"
        secondaryTo="/platform"
      />
    </main>
  );
}

function DeskSection({
  id,
  kicker,
  title,
  body,
  mock,
  flip = false,
}: {
  id: string;
  kicker: string;
  title: string;
  body: string;
  mock: ReactNode;
  flip?: boolean;
}) {
  const t = useT();
  const copy = firstTwoSentences(body);
  return (
    <section id={id} className="scroll-mt-16 border-b border-border">
      <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
        <div className={flip ? "lg:order-2" : undefined}>{mock}</div>
        <div className="flex flex-col justify-center relative z-10 px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{kicker}</p>
          <h2 className="type-section mt-3 text-fg">{title}</h2>
          <ReadMore lead={copy.lead}>{copy.extra ? <p>{copy.extra}</p> : null}</ReadMore>
          <div className="relative z-10 mt-8">
            <Button asChild>
              <Link to="/contact" search={{ need: "advisory" }}>
                {t("ctaBrief")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function useHashScroll() {
  const hash = useLocation({ select: (l) => l.hash });
  useEffect(() => {
    const id = (hash || "").replace(/^#/, "");
    if (!id) return;
    const run = () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    const t = window.setTimeout(run, 40);
    return () => window.clearTimeout(t);
  }, [hash]);
}
