import { cn } from "@/lib/cn";

/** Dual-track nexus + teal strike node. Navy reads as paper on dark grounds. */
export function Mark({ className, tone = "paper" }: { className?: string; tone?: "paper" | "navy" }) {
  const ring = tone === "navy" ? "#0B1F3A" : "#D6DCE6";
  const hole = tone === "navy" ? "#f8fafc" : "#0a192f";
  return (
    <span className={cn("inline-flex h-8 w-10 shrink-0 items-center", className)}>
      <svg
        viewBox="0 0 200 156"
        width="40"
        height="31"
        className="h-full w-full"
        aria-hidden="true"
        fill="none"
      >
        <g transform="translate(100 78) rotate(-8)">
          <ellipse
            rx="90"
            ry="30"
            transform="rotate(-22)"
            stroke={ring}
            strokeWidth="12"
          />
          <ellipse
            rx="58"
            ry="26"
            transform="rotate(50)"
            stroke="#FF4D1C"
            strokeWidth="9.5"
          />
          <circle cx="3.1" cy="-33.1" r="13" fill={hole} />
          <circle cx="3.1" cy="-33.1" r="8.5" fill="#0FB5A8" />
        </g>
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span className="font-display text-lg tracking-tight text-fg">Barnstorm</span>
      <span className="mt-0.5 font-mono text-xs tracking-wide text-muted">
        Co-operations
      </span>
    </span>
  );
}
