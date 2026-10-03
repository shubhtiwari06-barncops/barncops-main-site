import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { INDIA_STATES, INDIA_VB } from "@/lib/content/india-paths";
import { FOOTPRINT, FOOTPRINT_IDS, type FootprintState } from "@/lib/content/footprint";
import { IndiaSvg } from "@/components/map/india-svg";
import { useT } from "@/lib/i18n";

export function IndiaFootprint({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string>("Madhya Pradesh");
  const [hoverId, setHoverId] = useState<string | null>(null);

  const selected = useMemo(
    () => FOOTPRINT.find((s) => s.id === selectedId) ?? FOOTPRINT[0],
    [selectedId],
  );
  const focusId = hoverId && FOOTPRINT_IDS.has(hoverId) ? hoverId : selectedId;
  const tipId = hoverId && FOOTPRINT_IDS.has(hoverId) ? hoverId : selectedId;
  const tipState = FOOTPRINT.find((s) => s.id === tipId);
  const tipPath = INDIA_STATES.find((s) => s.id === tipId);

  return (
    <div className={cn("grid items-start gap-8 lg:grid-cols-12", className)}>
      <div
        className="relative map-layer lg:col-span-7"
        onMouseLeave={() => setHoverId(null)}
      >
        <IndiaSvg
          title={t("footprintTitle")}
          focusId={focusId}
          interactive
          onEnter={setHoverId}
          onSelect={setSelectedId}
        />
        {tipState && tipPath ? (
          <MapTooltip state={tipState} cx={tipPath.cx} cy={tipPath.cy} />
        ) : null}
        <p className="mt-3 font-mono text-xs text-subtle">{t("mapHint")}</p>
      </div>

      <aside className="lg:col-span-5">
        <StateCard state={selected} />
        {compact ? null : (
          <ul className="mt-6 grid grid-cols-2 gap-2">
            {FOOTPRINT.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(s.id);
                    setHoverId(s.id);
                  }}
                  onMouseEnter={() => setHoverId(s.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between px-3 text-left text-sm transition-colors duration-150",
                    s.id === selectedId
                      ? "bg-fg text-bg"
                      : "text-fg shadow-[var(--shadow-border)] hover:bg-elevated",
                  )}
                >
                  <span>{s.id}</span>
                  <span className="font-mono text-xs opacity-70">{s.short}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}

function MapTooltip({
  state,
  cx,
  cy,
}: {
  state: FootprintState;
  cx: number;
  cy: number;
}) {
  const t = useT();
  const left = (cx / INDIA_VB.w) * 100;
  const top = (cy / INDIA_VB.h) * 100;
  const xShift = left > 72 ? "-100%" : left < 22 ? "0%" : "-50%";
  const yShift = top < 16 ? "12px" : "calc(-100% - 10px)";

  return (
    <div
      key={state.id}
      className="pointer-events-none absolute z-10 min-w-44 max-w-64 bg-elevated px-3 py-2.5 shadow-[var(--shadow-glow)] ring-1 ring-accent/50"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(${xShift}, ${yShift})`,
      }}
      role="status"
    >
      <p className="font-display text-base tracking-tight text-fg">{state.id}</p>
      <p className="mt-1.5 font-mono text-xs leading-relaxed text-accent">{state.cycles}</p>
      <p className="mt-1 font-mono text-xs tabular-nums text-muted">
        {state.pcCount} {t("pcLabel")} · {state.acCount} {t("acLabel")}
      </p>
    </div>
  );
}

function StateCard({ state }: { state: FootprintState }) {
  const t = useT();
  return (
    <div className="bg-surface p-5 shadow-[var(--shadow-border)] sm:p-6">
      <p className="eyebrow">{t("footprintLive")}</p>
      <h3 className="mt-2 font-display text-2xl tracking-tight text-fg">{state.id}</h3>
      <p className="mt-3 font-mono text-xs uppercase tracking-wide text-subtle">{t("cycleLabel")}</p>
      <p className="mt-2 font-mono text-xs leading-relaxed text-accent">{state.cycles}</p>
      <dl className="mt-4 grid grid-cols-2 gap-px bg-border">
        <div className="bg-surface p-3">
          <dt className="font-mono text-xs text-subtle">{t("pcLabel")}</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-fg">{state.pcCount}</dd>
        </div>
        <div className="bg-surface p-3">
          <dt className="font-mono text-xs text-subtle">{t("acLabel")}</dt>
          <dd className="mt-1 font-mono text-lg tabular-nums text-fg">{state.acCount}</dd>
        </div>
      </dl>
      <p className="mt-4 font-mono text-xs uppercase tracking-wide text-subtle">{t("pcList")}</p>
      <p className="mt-2 text-sm leading-relaxed text-fg">{state.pcs.join(" · ")}</p>
      <p className="mt-4 font-mono text-xs uppercase tracking-wide text-subtle">{t("acList")}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{state.acs.join(" · ")}</p>
    </div>
  );
}
