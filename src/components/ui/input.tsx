import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full bg-elevated px-3 text-sm text-fg placeholder:text-subtle",
        "shadow-[var(--shadow-border)] transition-[box-shadow] duration-150",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
