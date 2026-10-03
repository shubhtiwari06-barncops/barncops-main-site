import { useState } from "react";
import { cn } from "@/lib/cn";

export function FaqBlock({
  kicker = "FAQ",
  title,
  items,
}: {
  kicker?: string;
  title: string;
  items: readonly { q: string; a: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <section className="border-b border-border">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
        <p className="eyebrow">{kicker}</p>
        <h2 className="type-section mt-3 max-w-3xl text-slate-100">{title}</h2>
        <div className="mt-10 divide-y divide-border border-y border-border">
          {items.map((item, i) => {
            const on = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={on}
                  onClick={() => setOpen(on ? null : i)}
                >
                  <span className="font-display text-lg tracking-tight text-slate-100">{item.q}</span>
                  <span className="font-mono text-sm text-slate-400" aria-hidden>
                    {on ? "–" : "+"}
                  </span>
                </button>
                <div className={cn("grid transition-[grid-template-rows] duration-200 ease-out", on ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <div className="overflow-hidden">
                    <p className="max-w-3xl pb-5 text-sm leading-relaxed text-slate-300 sm:text-base">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
