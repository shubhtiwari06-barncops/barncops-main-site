import { Children, type ReactNode } from "react";

const alpine = (attrs: Record<string, string>) => attrs as Record<string, string>;

/** Two sentences stay visible. The rest is an Alpine collapse. */
export function firstTwoSentences(text: string) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    lead: parts.slice(0, 2).join(" "),
    extra: parts.slice(2).join(" "),
  };
}

export function ReadMore({ lead, children }: { lead?: string; children?: ReactNode }) {
  const hasMore = Children.toArray(children).length > 0;
  return (
    <div {...alpine({ "x-data": "{ expanded: false }" })}>
      {lead ? <p className="mt-4 text-sm leading-relaxed text-slate-200 sm:text-base">{lead}</p> : null}
      {hasMore ? (
        <div
          className="mt-4 space-y-3 text-sm leading-relaxed text-slate-200"
          {...alpine({
            "x-show": "expanded",
            "x-collapse": "",
            "x-cloak": "",
          })}
        >
          {children}
        </div>
      ) : null}
      {hasMore ? (
        <button
          type="button"
          className="mt-5 inline-flex min-h-11 items-center rounded-md border border-emerald-400/70 bg-cyan-400/15 px-4 py-2 font-mono text-xs tracking-wide text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
          {...alpine({
            "x-on:click": "expanded = !expanded",
            "x-text": "expanded ? 'Hide Complete Data' : 'View Complete Data & Strategy'",
          })}
        >
          View Complete Data & Strategy
        </button>
      ) : null}
    </div>
  );
}
