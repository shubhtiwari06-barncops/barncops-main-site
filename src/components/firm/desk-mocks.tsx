import { useState } from "react";
import { cn } from "@/lib/cn";
import { ConstituencyCarousel } from "@/components/firm/constituency-carousel";

export function BriefMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-80 w-full flex-col overflow-hidden bg-[#0a192f]",
        className,
      )}
      aria-label="Narrative desk Friday memo"
    >
      <div className="relative flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-mono text-xs tracking-wide text-accent">NARRATIVE DESK · FRIDAY MEMO</p>
        <span className="font-mono text-xs text-ok">PRINCIPAL</span>
      </div>
      <div className="relative grid flex-1 gap-px bg-border sm:grid-cols-12">
        <div className="bg-[#0a192f] p-4 sm:col-span-7">
          <p className="eyebrow">Theory of the race</p>
          <p className="mt-3 font-display text-xl tracking-tight text-fg">
            Permission to govern — not a slogan.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Contrast is they talk, we deliver. The booth already knows the line. Repeat it until
            Friday; do not invent a second one.
          </p>
          <p className="mt-4 border-l-2 border-accent pl-3 font-mono text-xs leading-relaxed text-fg">
            Lock paid on Mill Gate. Kill IDs stale past 14 days. Surrogates stay on the spine.
          </p>
        </div>
        <div className="grid grid-rows-3 gap-px bg-border sm:col-span-5">
          <MemoStat k="Win number" v="87,400" n="Universe 1.12L · remaining 24.6k" />
          <MemoStat k="Coalition math" v="4.1%" n="Persuadable Hindu OBC · booth 018–044" />
          <MemoStat k="Kill rule" v="14d" n="Stale IDs out of the walk list tonight" />
        </div>
      </div>
    </div>
  );
}

function MemoStat({ k, v, n }: { k: string; v: string; n: string }) {
  return (
    <div className="bg-[#0a192f] px-4 py-3">
      <p className="font-mono text-xs text-subtle">{k}</p>
      <p className="mt-1 font-display text-xl tracking-tight text-fg">{v}</p>
      <p className="mt-1 font-mono text-xs text-muted">{n}</p>
    </div>
  );
}

const SENTIMENT = [
  { k: "Net fav", v: "+6.2", bar: 68 },
  { k: "Issue: water", v: "31%", bar: 31 },
  { k: "Issue: jobs", v: "24%", bar: 24 },
  { k: "Issue: dignity", v: "18%", bar: 18 },
] as const;

const REELS = [
  { id: "R-184", hook: "Canal colony night walk", vel: "2.4x", status: "BOOST" },
  { id: "R-191", hook: "Mill-gate tea stall", vel: "1.7x", status: "HOLD" },
  { id: "R-196", hook: "School-para cut-in", vel: "0.8x", status: "KILL" },
] as const;

const RAPID = [
  { t: "04m", claim: "Opposition cut on MPLADS delay", desk: "Counter cut ready" },
  { t: "19m", claim: "Whisper on candidate asset", desk: "Fact pack to surrogates" },
  { t: "1h", claim: "Booth 031 video from 2019", desk: "Kill — stale file" },
] as const;

export function PerceptionMock({ className }: { className?: string }) {
  const [tab, setTab] = useState<"sentiment" | "reels" | "rapid">("sentiment");

  return (
    <div
      className={cn(
        "relative flex h-full min-h-80 w-full flex-col overflow-hidden bg-[#0a192f]",
        className,
      )}
      aria-label="Social command console"
    >
      <div className="relative flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-mono text-xs tracking-wide text-accent">SOCIAL COMMAND · LIVE</p>
        <span className="flex items-center gap-2 font-mono text-xs text-ok">
          <span className="size-1.5 rounded-full bg-ok" aria-hidden />
          72h CLOCK
        </span>
      </div>
      <div className="relative flex border-b border-border" role="tablist" aria-label="Social command views">
        {(
          [
            ["sentiment", "Sentiment"],
            ["reels", "Reels"],
            ["rapid", "Rapid response"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "min-h-11 flex-1 px-3 font-mono text-xs tracking-wide transition-colors duration-150",
              tab === id ? "bg-elevated text-accent" : "text-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="relative flex-1 overflow-auto p-4">
        {tab === "sentiment" ? (
          <ul className="space-y-3">
            {SENTIMENT.map((s) => (
              <li key={s.k}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-mono text-xs text-subtle">{s.k}</p>
                  <p className="font-display text-lg tracking-tight text-fg">{s.v}</p>
                </div>
                <div className="mt-2 h-1.5 bg-slate-800">
                  <div className="h-full bg-blue-500" style={{ width: `${s.bar}%` }} />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "reels" ? (
          <ul className="space-y-2">
            {REELS.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <div>
                  <p className="font-mono text-xs text-accent">{r.id}</p>
                  <p className="text-sm text-fg">{r.hook}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-fg">{r.vel}</p>
                  <p
                    className={cn(
                      "font-mono text-xs",
                      r.status === "BOOST" && "text-ok",
                      r.status === "HOLD" && "text-warn",
                      r.status === "KILL" && "text-danger",
                    )}
                  >
                    {r.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {tab === "rapid" ? (
          <ul className="space-y-2">
            {RAPID.map((r) => (
              <li key={r.t} className="border-b border-border pb-2">
                <p className="font-mono text-xs text-accent">{r.t}</p>
                <p className="mt-1 text-sm text-fg">{r.claim}</p>
                <p className="mt-1 font-mono text-xs text-muted">{r.desk}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

export function BoothMock({ className }: { className?: string }) {
  return <ConstituencyCarousel className={className} />;
}
