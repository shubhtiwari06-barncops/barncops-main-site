import { Link } from "@tanstack/react-router";
import { WhatsAppCta } from "@/components/contact/whatsapp-cta";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function CloseCta({
  kicker,
  title,
  body,
  primaryTo = "/contact",
  primaryNeed,
  secondaryTo = "/platform",
  secondaryLabel,
}: {
  kicker: string;
  title: string;
  body: string;
  primaryTo?: "/contact" | "/advisory" | "/platform";
  primaryNeed?: string;
  secondaryTo?: "/platform" | "/advisory" | "/console" | "/contact";
  secondaryLabel?: string;
}) {
  const t = useT();
  const secondaryText =
    secondaryLabel ??
    (secondaryTo === "/platform"
      ? t("ctaPlatform")
      : secondaryTo === "/advisory"
        ? t("advisoryPractice")
        : t("ctaMandate"));
  return (
    <section>
      <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
        <div className="bg-surface px-6 py-12 shadow-[var(--shadow-border)] sm:px-12">
          <p className="eyebrow">{kicker}</p>
          <h2 className="type-section mt-3 max-w-3xl text-fg">{title}</h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">{body}</p>
          <div className="relative z-10 mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg">
              {primaryTo === "/contact" ? (
                <Link to="/contact" search={primaryNeed ? { need: primaryNeed } : undefined}>
                  {t("ctaBrief")}
                </Link>
              ) : (
                <Link to={primaryTo}>{t("ctaBrief")}</Link>
              )}
            </Button>
            <Button asChild variant="strike" size="lg">
              {secondaryTo === "/contact" ? (
                <Link to="/contact">{secondaryText}</Link>
              ) : secondaryTo === "/advisory" ? (
                <Link to="/advisory">{secondaryText}</Link>
              ) : secondaryTo === "/console" ? (
                <Link to="/console">{secondaryText}</Link>
              ) : (
                <Link to="/platform">{secondaryText}</Link>
              )}
            </Button>
            <WhatsAppCta prominent />
          </div>
        </div>
      </div>
    </section>
  );
}
