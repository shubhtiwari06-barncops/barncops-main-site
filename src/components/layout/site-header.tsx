import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { LangToggle } from "@/components/layout/lang-toggle";
import { Mark } from "@/components/layout/mark";
import { openRoster } from "@/components/layout/roster-dialog";
import { Button } from "@/components/ui/button";
import { NAV } from "@/lib/content/nav";
import { cn } from "@/lib/cn";
import { useT, type DictKey } from "@/lib/i18n";

function navHash(item: (typeof NAV)[number]) {
  return "hash" in item && typeof item.hash === "string" ? item.hash : undefined;
}

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 isolate z-menu h-14 border-b border-slate-300/80 bg-slate-50/90 text-slate-900 shadow-[0_8px_30px_rgba(11,31,58,0.08)] backdrop-blur-md",
          compact && "h-12",
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl flex-nowrap items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 text-slate-950 no-underline"
            onClick={() => setOpen(false)}
          >
            <Mark tone="navy" className="h-8 w-10" />
            <span className="whitespace-nowrap font-display text-sm tracking-tight text-slate-950 sm:text-base">
              Barnstorm Co-operations
            </span>
          </Link>

          <nav className="hidden flex-nowrap items-center gap-4 lg:flex xl:gap-5" aria-label="Primary">
            {NAV.map((item) =>
              item.badge ? (
                <Link
                  key={item.labelKey}
                  to={item.to}
                  hash={navHash(item)}
                  hashScrollIntoView
                  className="badge-glow inline-flex h-8 shrink-0 items-center whitespace-nowrap bg-accent px-3 font-mono text-xs tracking-wide text-accent-fg no-underline transition-opacity duration-150 hover:opacity-90"
                  activeProps={{ className: "opacity-100" }}
                >
                  {t(item.labelKey as DictKey)}
                </Link>
              ) : (
                <Link
                  key={item.labelKey}
                  to={item.to}
                  hash={navHash(item)}
                  hashScrollIntoView
                  className="inline-flex shrink-0 items-center whitespace-nowrap text-sm text-slate-700 no-underline transition-colors duration-150 hover:text-slate-950"
                  activeProps={{ className: "text-slate-950" }}
                >
                  {t(item.labelKey as DictKey)}
                </Link>
              ),
            )}
            <a
              href="https://atlas.barncops.in/elections/"
              className="inline-flex shrink-0 items-center whitespace-nowrap text-sm text-slate-700 no-underline transition-colors duration-150 hover:text-slate-950"
            >
              {t("electionAtlas")}
            </a>
            <button
              type="button"
              onClick={openRoster}
              className="inline-flex shrink-0 items-center whitespace-nowrap text-sm text-slate-700 no-underline transition-colors duration-150 hover:text-slate-950"
            >
              {t("roster")}
            </button>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <LangToggle ink />
            <Button asChild size="sm">
              <Link to="/contact">{t("engage")}</Link>
            </Button>
          </div>

          <button
            type="button"
            className="relative z-menu flex size-11 shrink-0 items-center justify-center text-slate-950 lg:hidden"
            aria-label={open ? t("closeMenu") : t("openMenu")}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="relative size-5">
              <Menu
                className={cn(
                  "absolute inset-0 size-5 transition-[opacity,transform] duration-200",
                  open ? "scale-75 opacity-0" : "scale-100 opacity-100",
                )}
              />
              <X
                className={cn(
                  "absolute inset-0 size-5 transition-[opacity,transform] duration-200",
                  open ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
              />
            </span>
          </button>
        </div>
      </header>

      <div
        id="mobile-nav"
        className={cn(
          "fixed inset-x-0 bottom-0 z-overlay bg-bg/95 transition-[opacity,transform] duration-200 lg:hidden",
          compact ? "top-12" : "top-14",
          open
            ? "translate-y-0 opacity-100"
            : "pointer-events-none invisible translate-y-1 opacity-0",
        )}
        aria-hidden={!open}
      >
        <nav className="mx-auto flex h-full max-w-7xl flex-col overflow-y-auto px-4 pb-8 pt-4 sm:px-6" aria-label="Mobile">
          {NAV.map((item) => (
            <Link
              key={item.labelKey}
              to={item.to}
              hash={navHash(item)}
              hashScrollIntoView
              onClick={() => setOpen(false)}
              className="flex min-h-12 items-center border-b border-border no-underline"
            >
              {item.badge ? (
                <span className="badge-glow bg-accent px-3 py-1 font-mono text-xl tracking-wide text-accent-fg">
                  {t(item.labelKey as DictKey)}
                </span>
              ) : (
                <span className="font-display text-2xl text-fg">{t(item.labelKey as DictKey)}</span>
              )}
            </Link>
          ))}
          <a
            href="https://atlas.barncops.in/elections/"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center border-b border-border font-display text-2xl text-fg no-underline"
          >
            {t("electionAtlas")}
          </a>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              openRoster();
            }}
            className="flex min-h-12 items-center border-b border-border text-left font-display text-2xl text-fg"
          >
            {t("roster")}
          </button>
          <div className="mt-6 flex items-center justify-between gap-3">
            <LangToggle />
            <Button asChild>
              <Link to="/contact" onClick={() => setOpen(false)}>
                {t("engage")}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
