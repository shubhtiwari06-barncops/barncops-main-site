import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import {
  DISTRICT,
  METRICS,
  BOOTHS,
  TREND,
  type Metric,
  type Booth,
  metricMax,
  metricMin,
  metricValue,
  rollup,
} from "@/lib/content/console-data";

function heat(value: number, metric: Metric) {
  const min = metricMin(metric);
  const max = metricMax(metric);
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const pct = Math.round(18 + t * 82);
  return `color-mix(in oklab, var(--color-accent) ${pct}%, var(--color-elevated))`;
}

export function ConstituencyConsole() {
  const t = useT();
  const [metric, setMetric] = useState<Metric>("favorability");
  const [selectedId, setSelectedId] = useState(BOOTHS[14]?.id ?? BOOTHS[0].id);

  const selected = BOOTHS.find((p) => p.id === selectedId) ?? BOOTHS[0];
  const stats = useMemo(() => rollup(metric), [metric]);

  return (
    <div className="flex flex-1 flex-col bg-bg">
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t("consoleBadge")}</Badge>
            <span className="font-mono text-xs text-muted">
              {DISTRICT.city} · {DISTRICT.name} · {DISTRICT.cycle}
            </span>
            <span className="hidden h-1.5 w-1.5 rounded-full bg-ok sm:inline-block" aria-hidden />
            <span className="hidden font-mono text-xs text-ok sm:inline">{t("liveSample")}</span>
          </div>
          <p className="font-mono text-xs text-subtle">
            {t("electorate")} {DISTRICT.electorate.toLocaleString("en-IN")} · {t("winNumber")}{" "}
            {DISTRICT.winNumber.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-0 lg:grid-cols-12">
        <div className="border-b border-border p-4 sm:p-6 lg:col-span-8 lg:border-b-0 lg:border-r">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">{t("boothHeat")}</p>
              <h1 className="mt-2 font-display text-2xl tracking-tight text-fg sm:text-3xl">
                {t(METRICS.find((m) => m.id === metric)?.labelKey ?? "mFav")}
              </h1>
            </div>
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Metric">
              {METRICS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={metric === m.id}
                  onClick={() => setMetric(m.id)}
                  className={cn(
                    "h-10 shrink-0 px-3 font-mono text-xs tracking-wide transition-colors duration-150",
                    metric === m.id
                      ? "bg-fg text-bg"
                      : "text-muted shadow-[var(--shadow-border)] hover:text-fg",
                  )}
                >
                  {t(m.shortKey)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={t("mean")} value={formatMetric(stats.avg, metric)} />
            <Stat
              label={t("range")}
              value={`${formatMetric(stats.min, metric)} – ${formatMetric(stats.max, metric)}`}
            />
            <Stat label={t("covered")} value={`${stats.covered} / ${BOOTHS.length}`} />
            <Stat
              label={t("openJan")}
              value={`${BOOTHS.reduce((a, p) => a + p.janSunwai, 0)}`}
            />
          </div>

          <div className="mt-6 grid grid-cols-8 gap-1" role="grid" aria-label={DISTRICT.name}>
            {BOOTHS.map((p) => {
              const active = p.id === selected.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="gridcell"
                  aria-label={`${p.name}, ${formatMetric(metricValue(p, metric), metric)}`}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "aspect-square w-full min-h-10 transition-[box-shadow,transform] duration-150",
                    active && "ring-2 ring-fg ring-offset-2 ring-offset-bg",
                  )}
                  style={{ background: heat(metricValue(p, metric), metric) }}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between font-mono text-xs text-subtle">
            <span>{t("low")}</span>
            <span className="hidden sm:inline">{t("clickGrid")}</span>
            <span>{t("high")}</span>
          </div>

          <div className="mt-8">
            <p className="eyebrow">{t("weekContacts")}</p>
            <div className="mt-4 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TREND} barCategoryGap="28%">
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "var(--color-subtle)", fontSize: 11, fontFamily: "IBM Plex Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: "color-mix(in oklab, var(--color-fg) 6%, transparent)" }}
                    contentStyle={{
                      background: "var(--color-elevated)",
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                      color: "var(--color-fg)",
                    }}
                  />
                  <Bar dataKey="contacts" fill="var(--color-accent)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <aside className="bg-surface p-4 sm:p-6 lg:col-span-4">
          <p className="eyebrow">{t("boothBrief")}</p>
          <h2 className="mt-3 font-display text-2xl tracking-tight text-fg">{selected.name}</h2>
          <p className="mt-1 font-mono text-xs text-subtle">{selected.id}</p>

          <dl className="mt-6 grid grid-cols-2 gap-px bg-border">
            <Fact label={t("households")} value={selected.households.toLocaleString("en-IN")} />
            <Fact label={t("contactsYtd")} value={selected.contactsYtd.toLocaleString("en-IN")} />
            <Fact label={t("turnout")} value={`${selected.turnout}%`} />
            <Fact
              label={t("netFav")}
              value={`${selected.favorability > 0 ? "+" : ""}${selected.favorability}`}
            />
            <Fact label={t("openCases")} value={`${selected.janSunwai}`} />
            <Fact label={t("mplads")} value={`${selected.mplads}%`} />
          </dl>

          <p className="mt-6 text-sm leading-relaxed text-muted">{briefing(selected)}</p>

          <div className="mt-8 flex flex-col gap-2">
            <Button asChild>
              <Link to="/contact" search={{ need: "platform" }}>
                {t("requestInstance")}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/platform">{t("platformOverview")}</Link>
            </Button>
          </div>

          <p className="mt-6 font-mono text-xs leading-relaxed text-subtle">{t("sampleNote")}</p>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-3 shadow-[var(--shadow-border)]">
      <p className="font-mono text-xs text-subtle">{label}</p>
      <p className="mt-1 font-mono text-sm tabular-nums text-fg">{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <dt className="font-mono text-xs text-subtle">{label}</dt>
      <dd className="mt-1 font-mono text-sm tabular-nums text-fg">{value}</dd>
    </div>
  );
}

function formatMetric(value: number, metric: Metric) {
  if (metric === "favorability") {
    const n = Math.round(value);
    return `${n > 0 ? "+" : ""}${n}`;
  }
  if (metric === "janSunwai") return `${Math.round(value)}`;
  return `${Math.round(value)}%`;
}

function briefing(p: Booth) {
  if (p.janSunwai >= 12) {
    return `${p.name}: ${p.janSunwai} open Jan-Sunwai. SLA first. Do not read net favorability as a vote until the inbox is honest.`;
  }
  if (p.contacts < 40) {
    return `${p.name} is under-touched. Weekly contact ${p.contacts}% with MPLADS utilization at ${p.mplads}%. Field first; message second.`;
  }
  if (p.favorability < 0) {
    return `Net negative. Turnout model ${p.turnout}% — a persuasion universe, not a turnout one. Name a local proof, not a bio.`;
  }
  return `${p.name} is holding. Keep weekly contact above 60% and MPLADS visible on the ground. ${p.contactsYtd.toLocaleString("en-IN")} contacts against ${p.households.toLocaleString("en-IN")} households.`;
}
