import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AssemblyMarquee } from "@/components/firm/assembly-marquee";
import { IndiaFootprint } from "@/components/map/india-footprint";
import { IMPACT } from "@/lib/content/firm";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";

export function ImpactWall({ intro = true }: { intro?: boolean }) {
  const t = useT();
  const root = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setOn(true);
      return;
    }
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setOn(true);
      },
      { threshold: 0.08, rootMargin: "220px" },
    );
    io.observe(el);
    const fallback = window.setTimeout(() => setOn(true), 1600);
    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <section ref={root} id="footprint" className="border-b border-border">
      <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
        {intro ? (
          <>
            <p className="eyebrow">{t("footprintKicker")}</p>
            <h2 className="type-section mt-3 max-w-4xl text-fg">{t("impactSeoTitle")}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {t("impactLede")}
            </p>
          </>
        ) : null}

        <div className={cn("grid gap-10 sm:grid-cols-2", intro && "mt-12")}>
          {IMPACT.map((s, i) => (
            <div
              key={s.labelKey}
              className={cn("border-t border-border pt-6", on ? "impact-in" : "opacity-0")}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className={cn("type-impact", i === 0 ? "text-accent" : "text-fg")}>{s.n}</p>
              <p className="mt-3 max-w-sm font-sans text-sm font-medium leading-relaxed text-muted sm:text-base">
                {t(s.labelKey)}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 font-mono text-xs leading-relaxed text-subtle">{t("impactStates")}</p>
        <p className="mt-3 max-w-3xl font-mono text-xs leading-relaxed text-subtle">{t("impactFootnote")}</p>

        <div className="mt-16">
          <p className="eyebrow">{t("footprintTitle")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t("footprintLede")}</p>
          <IndiaFootprint className="mt-10" />
        </div>
      </div>

      <AssemblyMarquee />

      <div className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-12">
          <p className="max-w-2xl text-base leading-relaxed text-fg">{t("impactBanner")}</p>
          <Button asChild variant="accent" size="lg" className="badge-glow shrink-0">
            <Link to="/platform">{t("impactCta")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}