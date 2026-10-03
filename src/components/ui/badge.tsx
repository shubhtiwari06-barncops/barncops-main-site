import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 font-mono text-xs tracking-wide text-muted",
        "shadow-[var(--shadow-border)]",
        className,
      )}
      {...props}
    />
  );
}
