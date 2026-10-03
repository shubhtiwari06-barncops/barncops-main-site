import { cn } from "@/lib/cn";
import { useLocale, useT } from "@/lib/i18n";

export function LangToggle({ className, ink = false }: { className?: string; ink?: boolean }) {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const t = useT();

  return (
    <div
      role="group"
      aria-label={t("lang")}
      className={cn("flex items-center font-mono text-xs tracking-wide", className)}
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "flex h-11 min-w-11 items-center justify-center px-2 transition-colors duration-150",
          locale === "en" ? (ink ? "text-slate-950" : "text-fg") : ink ? "text-slate-500 hover:text-slate-950" : "text-subtle hover:text-fg",
        )}
      >
        EN
      </button>
      <span className="text-subtle" aria-hidden>
        |
      </span>
      <button
        type="button"
        onClick={() => setLocale("hi")}
        aria-pressed={locale === "hi"}
        className={cn(
          "flex h-11 min-w-11 items-center justify-center px-2 transition-colors duration-150",
          locale === "hi" ? (ink ? "text-slate-950" : "text-fg") : ink ? "text-slate-500 hover:text-slate-950" : "text-subtle hover:text-fg",
        )}
      >
        HI
      </button>
    </div>
  );
}
