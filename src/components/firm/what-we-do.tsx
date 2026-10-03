import { Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Crosshair, MapPinned, Radio } from "lucide-react";
import { useT, type DictKey } from "@/lib/i18n";

const CARDS = [
  {
    n: "01",
    title: "arsenal1Title",
    body: "arsenal1Body",
    icon: Crosshair,
    to: "/advisory" as const,
    hash: "narrative",
  },
  {
    n: "02",
    title: "arsenal2Title",
    body: "arsenal2Body",
    icon: Radio,
    to: "/advisory" as const,
    hash: "digital",
  },
  {
    n: "03",
    title: "arsenal3Title",
    body: "arsenal3Body",
    icon: MapPinned,
    to: "/advisory" as const,
    hash: "booth",
  },
  {
    n: "04",
    title: "arsenal4Title",
    body: "arsenal4Body",
    icon: Cpu,
    to: "/platform" as const,
    hash: undefined,
  },
] as const;

export function WhatWeDo() {
  const t = useT();

  return (
    <section id="arsenal" className="scroll-mt-16 border-b border-border">
      <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
        <p className="eyebrow">{t("arsenalKicker")}</p>
        <h2 className="type-section mt-3 text-fg">{t("arsenalTitle")}</h2>
        <div className="mt-12 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.n}
                to={card.to}
                hash={card.hash}
                hashScrollIntoView={{ behavior: "smooth", block: "start" }}
                className="group flex min-h-64 min-w-0 flex-col overflow-visible bg-bg p-6 no-underline transition-[background-color,box-shadow] duration-200 hover:bg-elevated hover:shadow-glow sm:p-8"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs tracking-wide text-subtle">{card.n}</p>
                  <Icon
                    className="size-4 shrink-0 text-subtle transition-colors duration-200 group-hover:text-accent"
                    aria-hidden
                  />
                </div>
                <h3 className="mt-6 text-balance font-display text-xl leading-snug tracking-tight text-fg">
                  {t(card.title as DictKey)}
                </h3>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-muted">
                  {t(card.body as DictKey)}
                </p>
                <p className="mt-6 inline-flex shrink-0 items-center gap-2 font-mono text-xs tracking-wide text-accent">
                  {t("deskEnter")}
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
