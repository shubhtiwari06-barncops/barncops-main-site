import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OFFER, SERVE, WHY } from "@/lib/content/site-copy";
import { CASES } from "@/lib/content/cases";
import { FOUNDER } from "@/lib/content/clients";
import { seatMarkFor } from "@/lib/content/assembly-maps";
import { ORGANIZATION_JSON_LD, pageHead } from "@/lib/seo";
import { useCopy, useT } from "@/lib/i18n";
import { HeroField } from "@/components/firm/hero-field";
import { ImpactWall } from "@/components/firm/impact-wall";
import { GlowAvatar } from "@/components/firm/glow-avatar";
import { ConstituencyMark } from "@/components/firm/assembly-map";
import { IntelligenceFeed } from "@/components/firm/intelligence-feed";
import { WhatsAppCta } from "@/components/contact/whatsapp-cta";
import { ClientRoster } from "@/components/firm/client-roster";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead(
      "Political Consulting in India | Barnstorm",
      "Political consulting firm in India. Election campaign management, war-room operations, and mandata.ai constituency governance.",
      "/",
    ),
    scripts: [{ type: "application/ld+json", children: JSON.stringify(ORGANIZATION_JSON_LD) }],
  }),
  component: Home,
});

function Home() {
  const t = useT();
  const offer = useCopy(OFFER);
  const serve = useCopy(SERVE);
  const why = useCopy(WHY);
  const selected = ["panipat-urban", "shivraj-sentiment", "adarsh-nagar"]
    .map((slug) => CASES.find((item) => item.slug === slug))
    .filter((item) => item != null);
  const closing = ["bhawanipatna", "niwari"].map((id) => seatMarkFor(id)).filter((mark) => mark != null);
  return (
    <main>
      <section className="relative min-h-[88dvh] overflow-hidden">
        <HeroField />
        <div className="relative mx-auto flex min-h-[88dvh] max-w-7xl flex-col justify-end px-4 pb-14 pt-28 sm:px-6 sm:pb-20">
          <p className="eyebrow">{t("heroKicker")}</p>
          <h1 className="type-hero mt-5 max-w-5xl text-fg">{t("heroTitle")}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-fg/90 sm:text-lg">{t("heroLede")}</p>
          <div className="relative z-10 mt-8 flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/contact">{t("ctaBrief")}</Link>
            </Button>
            <Button asChild variant="strike" size="lg">
              <Link to="/platform">{t("ctaPlatform")}</Link>
            </Button>
            <WhatsAppCta prominent />
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{offer.kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-slate-100">{offer.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{offer.lede}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {offer.items.map((item) => (
              <article key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <p className="font-mono text-xs text-slate-400">
                  {item.kicker} · {item.kind}
                </p>
                <h3 className="mt-3 font-display text-2xl tracking-tight text-slate-100">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">{item.sig}</p>
                <Link
                  to={item.to}
                  className="relative z-10 mt-6 inline-flex items-center gap-2 font-mono text-xs tracking-wide text-cyan-300 no-underline"
                >
                  {item.cta} <ArrowRight className="size-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{serve.kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-slate-100">{serve.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{serve.lede}</p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {serve.items.map((item) => (
              <article key={item.title} className="border-t border-white/10 pt-5">
                <h3 className="font-display text-xl tracking-tight text-slate-100">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ImpactWall />

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{why.kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-slate-100">{why.title}</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {why.items.map((item) => (
              <article key={item.title} className="border-t border-white/10 pt-5">
                <h3 className="font-display text-xl tracking-tight text-slate-100">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-12">
          <div className="flex justify-center lg:col-span-5">
            <GlowAvatar src={FOUNDER.photo} alt={t("founderName")} glow="teal" size="xl" kind="upper" />
          </div>
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("founderKicker")}</p>
            <h2 className="type-section mt-3 text-slate-100">{t("founderName")}</h2>
            <p className="mt-2 text-sm font-medium text-slate-100">{t("founderTitle")}</p>
            <p className="mt-6 max-w-2xl text-sm leading-relaxed text-slate-300">{t("founderBioHome")}</p>
            <div className="relative z-10 mt-8">
              <Button asChild variant="secondary">
                <Link to="/about">
                  {t("founderReadProfile")} <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <ClientRoster />

      <section className="border-b border-border" id="mandates">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <p className="eyebrow">{t("workSnapKicker")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-slate-100">{t("caseStudies")}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">{t("workDisclaimer")}</p>
          <div className="mt-10 space-y-6">
            {selected.map((item) => {
              const mark = seatMarkFor(item.slug);
              return (
                <article
                  key={item.slug}
                  className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] lg:grid lg:grid-cols-12"
                >
                  <div className={mark ? "p-6 md:p-8 lg:col-span-7" : "p-6 md:p-8 lg:col-span-12"}>
                    <p className="font-mono text-xs text-slate-400">
                      {item.n} · {item.practice}
                    </p>
                    <h3 className="mt-3 font-display text-2xl tracking-tight text-slate-100">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-200">
                      {item.placeLabel}: {item.place}
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">{item.snap}</p>
                  </div>
                  {mark ? (
                    <div className="border-t border-white/10 lg:col-span-5 lg:border-l lg:border-t-0">
                      <ConstituencyMark mark={mark} framed={false} />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <div className="mt-14 border-t border-white/10 pt-12">
            <p className="eyebrow">{t("operatingGeographies")}</p>
            <h3 className="mt-3 font-display text-3xl tracking-tight text-slate-100">{t("assemblyTheatres")}</h3>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {closing.map((mark) => (
                <ConstituencyMark key={mark.id} mark={mark} />
              ))}
            </div>
          </div>
          <div className="relative z-10 mt-10">
            <Button asChild variant="secondary">
              <Link to="/work">
                {t("workAll")} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <IntelligenceFeed />

      <section className="border-t border-white/10">
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
          <p className="eyebrow">{t("electionAtlas")}</p>
          <h2 className="type-section mt-3 max-w-3xl text-slate-100">
            Every Indian election since 1952, constituency by constituency.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
            Lok Sabha and Vidhan Sabha results, swing, margins and leader histories — free, from ECI records.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <li>
              <a href="https://atlas.barncops.in/lok-sabha/2024/" className="text-sm text-slate-200 no-underline hover:text-white">
                Lok Sabha 2024
              </a>
            </li>
            <li>
              <a href="https://atlas.barncops.in/lok-sabha/2024/party-wise/" className="text-sm text-slate-200 no-underline hover:text-white">
                2024 party-wise seats
              </a>
            </li>
            <li>
              <a href="https://atlas.barncops.in/lok-sabha/2024/state-wise/" className="text-sm text-slate-200 no-underline hover:text-white">
                2024 state-wise results
              </a>
            </li>
            <li>
              <a href="https://atlas.barncops.in/vidhan-sabha/" className="text-sm text-slate-200 no-underline hover:text-white">
                Vidhan Sabha results
              </a>
            </li>
            <li>
              <a href="https://atlas.barncops.in/bihar/vidhan-sabha/2025/" className="text-sm text-slate-200 no-underline hover:text-white">
                Bihar 2025
              </a>
            </li>
            <li>
              <a href="https://atlas.barncops.in/ask/" className="text-sm text-slate-200 no-underline hover:text-white">
                Ask the Atlas
              </a>
            </li>
          </ul>
          <div className="mt-8">
            <Button asChild variant="accent">
              <a href="https://atlas.barncops.in/elections/">Open the Atlas</a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
