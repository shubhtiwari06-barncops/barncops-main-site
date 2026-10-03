import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/layout/page-hero";
import { FaqBlock } from "@/components/firm/faq-block";
import { GOVERNANCE_FAQS } from "@/lib/content/faqs";
import { GOVERNANCE } from "@/lib/content/governance";
import { pageHead } from "@/lib/seo";
import { useCopy, useT } from "@/lib/i18n";

export const Route = createFileRoute("/governance")({
  head: () =>
    pageHead(
      "Governance and Access | mandata.ai",
      "Role-based access, permissioned outreach, activity history, and human oversight for constituency operations on mandata.ai.",
      "/governance",
    ),
  component: Governance,
});

function Governance() {
  const t = useT();
  const gov = useCopy(GOVERNANCE);
  const faqs = useCopy(GOVERNANCE_FAQS);
  return (
    <main>
      <PageHero kicker={gov.kicker} title={gov.title} lede={gov.lede}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/contact" search={{ need: "platform" }}>
              {t("ctaWalkthrough")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/platform">{t("ctaPlatform")}</Link>
          </Button>
        </div>
      </PageHero>
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <div className="grid gap-8 sm:grid-cols-2">
            {gov.items.map((item) => (
              <article key={item.title} className="border-t border-border pt-6">
                <h2 className="font-display text-2xl tracking-tight text-fg">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <FaqBlock kicker={t("faqKicker")} title={t("faqGovTitle")} items={faqs} />
    </main>
  );
}
