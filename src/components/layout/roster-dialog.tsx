import { useEffect, useState } from "react";

export function openRoster() {
  window.dispatchEvent(new CustomEvent("open-roster"));
}

export function RosterDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("open-roster", onOpen);
    return () => window.removeEventListener("open-roster", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#0a192f]/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="roster-title"
        className="w-full max-w-lg rounded-xl border border-white/10 bg-[#112240]/80 p-6 shadow-[0_24px_80px_rgba(10,25,47,0.55)] backdrop-blur sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#0fb5a8]">The Roster</p>
        <h2 id="roster-title" className="mt-3 font-display text-3xl tracking-tight text-[#f5f5f5]">
          The Roster
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-[#c5ced6] sm:text-base">
          We don't hire employees. We deploy political operatives and data architects. If you belong in a war-room, send your brief.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="mailto:lead@barncops.in"
            className="inline-flex h-12 items-center justify-center bg-[#0b1f3a] px-5 text-sm font-medium text-white no-underline shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-[#123056]"
          >
            Submit Intelligence (CV)
          </a>
          <button type="button" className="h-12 px-3 text-sm text-[#9aa3ad] hover:text-white" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
