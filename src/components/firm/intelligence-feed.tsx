import { BadgeCheck } from "lucide-react";

const POSTS = [
  {
    time: "2h",
    text: "Just processed the turnout data for the third phase. The 5K margin swing is real. Read our latest memo.",
  },
  {
    time: "5h",
    text: "Night-round booth sheets are in. The swing sits in three polling parts, not across the whole assembly.",
  },
  {
    time: "1d",
    text: "Jan-Sunwai queue cleared before dusk. A grievance that is not on the desk by evening did not happen.",
  },
] as const;

export function IntelligenceFeed() {
  return (
    <section className="border-b border-border bg-[#0a192f]" aria-labelledby="intel-feed-title">
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
        <h2 id="intel-feed-title" className="type-section text-slate-100">
          Live Intelligence & Ground Zero Feed
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((post) => (
            <a
              key={post.time}
              href="https://x.com/barncops"
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-xl border border-white/10 bg-[#112240] p-5 no-underline"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0a192f] font-display text-sm text-slate-100">
                  B
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-semibold text-slate-100">
                    Barnstorm Co-operations Intelligence
                    <BadgeCheck className="size-4 text-blue-400" aria-label="Verified" />
                  </p>
                  <p className="text-sm text-slate-400">@barncops</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-100">{post.text}</p>
              <p className="mt-4 text-xs text-slate-400">{post.time}</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
