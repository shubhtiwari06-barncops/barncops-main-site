import { DIRECTOR_WHATSAPP_HREF } from "@/lib/intake/public";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export function WhatsAppCta({
  className,
  prominent = false,
}: {
  className?: string;
  prominent?: boolean;
}) {
  const t = useT();
  return (
    <a
      href={DIRECTOR_WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        prominent
          ? "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#128C7E] px-6 text-sm font-semibold text-white no-underline shadow-lg hover:bg-[#0e7a6e]"
          : "inline-flex h-12 items-center justify-center px-6 text-sm font-medium text-slate-100 no-underline shadow-[var(--shadow-border)] hover:bg-white/5",
        className,
      )}
    >
      {t("waCta")}
    </a>
  );
}

export function WhatsAppFloat() {
  const t = useT();
  return (
    <a
      href={DIRECTOR_WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={t("waCta")}
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#128C7E] text-white shadow-lg hover:bg-[#0e7a6e]"
    >
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden fill="currentColor">
        <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10 10 0 0 0 4.65 1.18h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.85c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.12.11-1.81-.11-.41-.14-.95-.31-1.63-.61-2.87-1.24-4.74-4.13-4.88-4.32-.14-.19-1.16-1.54-1.16-2.94s.73-2.08 1-2.37c.24-.27.64-.4 1.02-.4.12 0 .23 0 .33.01.29.01.43.03.62.48.24.57.82 1.98.89 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.41.5-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.54.73 1.8.86.27.13.44.2.51.31.07.11.07.64-.17 1.32z" />
      </svg>
    </a>
  );
}
