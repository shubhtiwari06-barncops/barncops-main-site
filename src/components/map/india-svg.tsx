import { memo } from "react";
import { FOOTPRINT_IDS } from "@/lib/content/footprint";
import { INDIA_LAND } from "@/lib/content/india-land";
import { INDIA_STATES, INDIA_VB } from "@/lib/content/india-paths";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  focusId?: string | null;
  interactive?: boolean;
  onEnter?: (id: string) => void;
  onSelect?: (id: string) => void;
  title?: string;
};

function IndiaSvgInner({
  className,
  focusId = null,
  interactive = false,
  onEnter,
  onSelect,
  title,
}: Props) {
  return (
    <svg
      viewBox={`0 0 ${INDIA_VB.w} ${INDIA_VB.h}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={title}
      id={interactive ? "india-map" : undefined}
      shapeRendering={interactive ? "geometricPrecision" : "optimizeSpeed"}
    >
      {title ? <title>{title}</title> : null}
      <g className="pointer-events-none" aria-hidden>
        <path
          d={INDIA_LAND}
          fillRule="evenodd"
          fill="var(--color-elevated)"
          stroke="var(--color-accent)"
          strokeWidth={1.6}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.95}
        />
      </g>
      {INDIA_STATES.map((st, i) => {
        const live = FOOTPRINT_IDS.has(st.id);
        if (!live) return null;
        const on = Boolean(focusId) && st.id === focusId;
        return (
          <path
            key={`live-${i}`}
            d={st.d}
            fillRule="evenodd"
            fill="var(--color-accent)"
            stroke={on ? "var(--color-fg)" : "var(--color-accent)"}
            strokeWidth={on ? 1.6 : 0.8}
            strokeLinejoin="round"
            strokeLinecap="round"
            className={cn(interactive ? "cursor-pointer" : "pointer-events-none")}
            tabIndex={interactive ? 0 : undefined}
            role={interactive ? "button" : undefined}
            aria-label={interactive ? st.id : undefined}
            aria-pressed={interactive ? st.id === focusId : undefined}
            onMouseEnter={
              interactive
                ? () => {
                    onEnter?.(st.id);
                  }
                : undefined
            }
            onFocus={
              interactive
                ? () => {
                    onSelect?.(st.id);
                    onEnter?.(st.id);
                  }
                : undefined
            }
            onClick={
              interactive
                ? () => {
                    onSelect?.(st.id);
                    onEnter?.(st.id);
                  }
                : undefined
            }
            onKeyDown={
              interactive
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect?.(st.id);
                      onEnter?.(st.id);
                    }
                  }
                : undefined
            }
          />
        );
      })}
    </svg>
  );
}

export const IndiaSvg = memo(IndiaSvgInner);