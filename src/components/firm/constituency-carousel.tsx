import { cn } from "@/lib/cn";

const SEATS = [
  {
    name: "Panipat City (Haryana) • AC-25",
    booths: "204",
    threat: "High",
    heat: [
      "bg-emerald-500",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
    ],
  },
  {
    name: "Adarsh Nagar (Delhi) • AC-04",
    booths: "112",
    threat: "Stable",
    heat: [
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
    ],
  },
  {
    name: "Bhawanipatna (Odisha) • AC-80",
    booths: "256",
    threat: "Critical",
    heat: [
      "bg-slate-700",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
    ],
  },
  {
    name: "Niwari (Madhya Pradesh) • AC-46",
    booths: "188",
    threat: "High Swing",
    heat: [
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
      "bg-slate-700",
      "bg-emerald-900",
      "bg-emerald-500",
      "bg-emerald-900",
      "bg-slate-700",
      "bg-emerald-500",
    ],
  },
] as const;

export function ConstituencyCarousel({ className }: { className?: string }) {
  return (
    <div className={cn("hide-scrollbar flex snap-x snap-mandatory gap-6 overflow-x-auto py-6", className)}>
      {SEATS.map((seat) => (
        <article
          key={seat.name}
          className="min-w-[300px] snap-center rounded-xl border border-slate-700 bg-slate-800/50 p-6 md:min-w-[400px]"
        >
          <div className="mb-4 rounded-lg border border-slate-700 bg-slate-900 p-3">
            <div className="grid grid-cols-5 gap-1" aria-hidden="true">
              {seat.heat.map((tone, index) => (
                <div key={index} className={`h-6 w-full rounded ${tone}`} />
              ))}
            </div>
          </div>
          <h3 className="font-display text-xl tracking-tight text-slate-100">{seat.name}</h3>
          <dl className="mt-4 space-y-2 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-4">
              <dt>Live Booths</dt>
              <dd className="font-mono text-slate-100">{seat.booths}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt>Margin Threat</dt>
              <dd className="font-mono text-slate-100">{seat.threat}</dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
