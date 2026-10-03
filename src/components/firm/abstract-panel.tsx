import { cn } from "@/lib/cn";

export function AbstractPanel({
  className,
  label,
}: {
  className?: string;
  label?: string;
  tone?: "teal" | "navy";
}) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-surface",
        className,
      )}
    >
      <div className="grid-bleed pointer-events-none absolute inset-0 opacity-5" />
      {label ? (
        <p className="absolute bottom-4 left-4 font-mono text-xs tracking-wide text-subtle">{label}</p>
      ) : null}
    </div>
  );
}