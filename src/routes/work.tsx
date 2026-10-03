import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHero } from "@/components/layout/page-hero";
import { MandateFile } from "@/components/firm/mandate-file";
import { CASES } from "@/lib/content/cases";
import { cn } from "@/lib/cn";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

const FILTERS = ["All", "Advisory", "Platform"] as const;

export const Route = createFileRoute("/work")({
  head: () =>
    pageHead(
      "Political Consulting Mandates | Barnstorm",
      "Selected election campaign mandates: Panipat Urban, Shivraj Singh Chouhan, Adarsh Nagar, Jammu & Kashmir, and the IYC Haath Uthao programme.",
      "/work",
    ),
  component: Work,
});

function Work() {
  const t = useT();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const list = CASES.filter((c) => {
    if (filter === "All") return true;
    if (filter === "Platform") return c.practice.includes("Platform") || c.practice.includes("mandata");
    return c.practice.includes("Advisory");
  });

  return (
    <main id="mandates" className="scroll-mt-16">
      <PageHero kicker={t("caseStudies")} title={t("workHeroTitle")} lede={t("workHeroLede")}>
        <p className="mt-6 max-w-3xl border-l-2 border-accent pl-4 font-mono text-xs leading-relaxed text-muted">
          {t("workDisclaimer")}
        </p>
      </PageHero>

      <section className="border-b border-border">
        <div className="mx-auto flex max-w-7xl gap-2 px-4 py-4 sm:px-6">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-10 px-4 font-mono text-xs tracking-wide transition-colors duration-150",
                filter === f ? "bg-fg text-bg" : "text-muted shadow-[var(--shadow-border)] hover:text-fg",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
          <div className="space-y-10">
            {list.map((c, i) => (
              <MandateFile key={c.slug} item={c} index={i} />
            ))}
          </div>
          <p className="mt-16 text-sm text-subtle">
            <Link to="/contact" className="text-fg underline-offset-4 hover:underline">
              {t("ctaBrief")}
            </Link>
            {" · "}
            <Link to="/platform" className="text-fg underline-offset-4 hover:underline">
              {t("ctaPlatform")}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
