import { ASSEMBLIES } from "@/lib/content/footprint";
import { useT } from "@/lib/i18n";

export function AssemblyMarquee() {
  const t = useT();
  const line = ASSEMBLIES.join("  ·  ");
  return (
    <div className="marquee relative overflow-hidden border-y border-border py-3.5">
      <p className="sr-only">{t("statAcsEngineered")}</p>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-bg to-transparent sm:w-20"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-bg to-transparent sm:w-20"
        aria-hidden
      />
      <div className="marquee-track flex w-max items-center" aria-hidden>
        <span className="px-4 font-mono text-xs uppercase tracking-widest text-accent/40">{line}</span>
        <span className="px-4 font-mono text-xs uppercase tracking-widest text-accent/40">{line}</span>
      </div>
    </div>
  );
}
