import { createFileRoute } from "@tanstack/react-router";
import { IntakeForm } from "@/components/contact/intake-form";
import { WhatsAppCta } from "@/components/contact/whatsapp-cta";
import { IntelligenceFeed } from "@/components/firm/intelligence-feed";
import { PageHero } from "@/components/layout/page-hero";
import { FaqBlock } from "@/components/firm/faq-block";
import { FIRM } from "@/lib/content/firm";
import { CONTACT_FAQS } from "@/lib/content/faqs";
import { pageHead } from "@/lib/seo";
import { useCopy, useT } from "@/lib/i18n";

type ContactSearch = {
  need?: string;
};

export const Route = createFileRoute("/contact")({
  validateSearch: (search: Record<string, unknown>): ContactSearch => ({
    need: typeof search.need === "string" ? search.need : undefined,
  }),
  head: () =>
    pageHead(
      "Confidential Intake | Barnstorm",
      "Request a confidential brief for election campaign consulting or a mandata.ai constituency platform consultation. Principals only.",
      "/contact",
    ),
  component: Contact,
});

function Contact() {
  const { need } = Route.useSearch();
  const t = useT();
  const faqs = useCopy(CONTACT_FAQS);

  return (
    <main>
      <PageHero kicker={t("engage")} title={t("engageHeroTitle")} lede={t("engageHeroLede")} />
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="eyebrow">{t("contactWhoKicker")}</p>
              <h2 className="mt-3 font-display text-xl tracking-tight text-fg">{t("contactWhoTitle")}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                <li>{t("contactWho1")}</li>
                <li>{t("contactWho2")}</li>
                <li>{t("contactWho3")}</li>
                <li>{t("contactWho4")}</li>
                <li>{t("contactWho5")}</li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">{t("contactIncludeKicker")}</p>
              <h2 className="mt-3 font-display text-xl tracking-tight text-fg">{t("contactIncludeTitle")}</h2>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                <li>{t("contactInclude1")}</li>
                <li>{t("contactInclude2")}</li>
                <li>{t("contactInclude3")}</li>
                <li>{t("contactInclude4")}</li>
                <li>{t("contactInclude5")}</li>
                <li>{t("contactInclude6")}</li>
              </ul>
            </div>
            <div>
              <p className="eyebrow">{t("next")}</p>
              <h2 className="mt-3 font-display text-xl tracking-tight text-fg">{t("ctaSpeak")}</h2>
              <ol className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
                <li>{t("next1")}</li>
                <li>{t("next2")}</li>
                <li>{t("next3")}</li>
                <li>{t("next4")}</li>
              </ol>
            </div>
            <div>
              <p className="eyebrow">{t("contactConfKicker")}</p>
              <h2 className="mt-3 font-display text-xl tracking-tight text-fg">{t("contactConfTitle")}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted">{t("contactConfBody")}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl relative z-10 gap-10 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow">{t("contactFormKicker")}</p>
            <p className="mt-3 mb-6 max-w-xl text-sm leading-relaxed text-muted">{t("contactFormSupport")}</p>
            <WhatsAppCta className="mb-8 inline-flex h-12 w-full items-center justify-center px-6 text-sm font-medium text-muted shadow-[var(--shadow-border)] transition-colors duration-150 hover:bg-elevated hover:text-fg sm:w-auto" />
            <IntakeForm initialNeed={need} />
          </div>
          <aside className="space-y-10 lg:col-span-5">
            <div>
              <p className="eyebrow">{t("contactNotKicker")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("contactNotBody")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("contactQualKicker")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("contactQualBody")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("studios")}</p>
              <p className="mt-3 text-sm text-muted">{FIRM.offices.join(" · ")}</p>
              <p className="mt-2 font-mono text-xs text-subtle">{t("noEmail")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("conflicts")}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t("conflictsBody")}</p>
            </div>
          </aside>
        </div>
      </section>
      <IntelligenceFeed />
      <FaqBlock kicker={t("faqKicker")} title={t("faqContactTitle")} items={faqs} />
    </main>
  );
}
