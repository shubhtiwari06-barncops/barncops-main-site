import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHero({
  kicker,
  title,
  lede,
  children,
  className,
  media,
}: {
  kicker: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  className?: string;
  media?: ReactNode;
}) {
  return (
    <section className={cn("border-b border-border", className)}>
      <div
        className={cn(
          "relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24",
          media && "grid grid-cols-1 items-center gap-8 lg:grid-cols-2",
        )}
      >
        <div>
          <p className="eyebrow">{kicker}</p>
          <h1 className="type-page mt-4 max-w-4xl text-slate-100">{title}</h1>
          {lede ? (
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">{lede}</p>
          ) : null}
          {children}
        </div>
        {media ? <div className="min-w-0">{media}</div> : null}
      </div>
    </section>
  );
}
