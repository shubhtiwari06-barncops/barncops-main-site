import { useRouterState } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RosterDialog } from "@/components/layout/roster-dialog";
import { PolyTechField } from "@/components/firm/polytech-field";
import { useLocale, useT } from "@/lib/i18n";
import { WhatsAppFloat } from "@/components/contact/whatsapp-cta";

declare global {
  interface Window {
    Alpine?: { start: () => void; initTree: (el: Element) => void };
    __alpineStarted?: boolean;
  }
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isProductConsole = pathname === "/console";
  const isInternalDesk =
    pathname === "/console/intake" ||
    pathname.startsWith("/console/intake/") ||
    pathname === "/console/whatsapp" ||
    pathname.startsWith("/console/whatsapp/");
  const isMandataLanding = pathname === "/mandata" || pathname.startsWith("/mandata/");
  const hideChrome = isProductConsole || isInternalDesk || isMandataLanding;
  const hydrate = useLocale((s) => s.hydrate);
  const t = useT();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const boot = () => {
      const alpine = (window as Window & {
        Alpine?: { start: () => void; initTree: (el: Element) => void };
        __alpineStarted?: boolean;
      }).Alpine;
      if (!alpine) return;
      const root = document.getElementById("main");
      if (window.__alpineStarted) {
        if (root) alpine.initTree(root);
        return;
      }
      alpine.start();
      window.__alpineStarted = true;
    };
    if (window.Alpine) boot();
    else window.addEventListener("alpine:loaded", boot);
    return () => window.removeEventListener("alpine:loaded", boot);
  }, [pathname]);

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#0a192f] text-slate-100">
      <PolyTechField />
      <RosterDialog />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-fg focus:px-3 focus:py-2 focus:text-bg"
      >
        {t("skip")}
      </a>
      {isInternalDesk || isMandataLanding ? null : <SiteHeader compact={isProductConsole} />}
      <div id="main" className="relative z-10 flex flex-1 flex-col">
        {children}
      </div>
      {hideChrome ? null : <SiteFooter />}
      {isInternalDesk ? null : <WhatsAppFloat />}
    </div>
  );
}
