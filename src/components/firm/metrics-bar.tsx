import { FIRM } from "@/lib/content/firm";
import { useT } from "@/lib/i18n";

export function MetricsBar() {
  const t = useT();
  const stats = [
    { n: FIRM.voters, l: t("statVoters") },
    { n: FIRM.states, l: t("statStates") },
    { n: FIRM.pcs, l: t("statPcs") },
    { n: FIRM.acs, l: t("statAcs") },
    { n: `${FIRM.founded}`, l: t("statSince") },
  ];
  return (
    <section className="border-b border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <div key={s.l} className="bg-bg px-4 py-6 last:col-span-2 sm:px-6 sm:last:col-span-1 lg:last:col-span-1">
            <p className="font-display text-3xl tabular-nums tracking-tight text-fg">{s.n}</p>
            <p className="mt-1 font-mono text-xs text-muted">{s.l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
