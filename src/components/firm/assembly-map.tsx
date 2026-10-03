import type { SeatMark } from "@/lib/content/assembly-maps";

export function ConstituencyMark({ mark, framed = true }: { mark: SeatMark; framed?: boolean }) {
  const gid = `seat-${mark.id}`;
  return (
    <figure
      className={
        framed
          ? "relative min-h-80 overflow-hidden rounded-xl border border-white/10 bg-[#071422]"
          : "relative h-full min-h-80 overflow-hidden bg-[#071422]"
      }
    >
      <svg viewBox="0 0 320 360" className="h-full min-h-80 w-full" role="img" aria-label={mark.name}>
        <defs>
          <linearGradient id={`${gid}-fill`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#14666e" stopOpacity="0.78" />
            <stop offset="58%" stopColor="#0e3d48" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#0a192f" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id={`${gid}-edge`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e4c56a" />
            <stop offset="100%" stopColor="#7dcec8" />
          </linearGradient>
        </defs>
        <g stroke="rgba(148,163,184,0.14)" strokeWidth="0.6">
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`v${i}`} x1={40 + i * 40} y1="18" x2={40 + i * 40} y2="342" />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`h${i}`} x1="18" y1={28 + i * 40} x2="302" y2={28 + i * 40} />
          ))}
        </g>
        <path d={mark.d} fill={`url(#${gid}-fill)`} stroke={`url(#${gid}-edge)`} strokeWidth="1.8" strokeLinejoin="round" />
        {mark.seams.map((d) => (
          <path key={d} d={d} fill="none" stroke="#9ad7d1" strokeOpacity="0.5" strokeWidth="1" />
        ))}
        <circle cx={mark.pin[0]} cy={mark.pin[1]} r="8" fill="none" stroke="#C9A227" strokeOpacity="0.55" />
        <circle cx={mark.pin[0]} cy={mark.pin[1]} r="3" fill="#C9A227" />
      </svg>
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071422] via-[#071422]/85 to-transparent px-5 pb-4 pt-14">
        <p className="font-display text-lg leading-snug tracking-tight text-slate-50">{mark.name}</p>
      </figcaption>
    </figure>
  );
}
