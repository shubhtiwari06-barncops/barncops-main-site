import type { CaseStudy } from "@/lib/content/cases";
import { useT } from "@/lib/i18n";
import { seatMarkFor } from "@/lib/content/assembly-maps";
import { ConstituencyMark } from "@/components/firm/assembly-map";
import { ReadMore, firstTwoSentences } from "@/components/firm/read-more";

export function MandateFile({ item, index }: { item: CaseStudy; index: number }) {
  const t = useT();
  const snap = firstTwoSentences(item.snap);
  const mark = seatMarkFor(item.slug);
  return (
    <article className={mark ? "grid items-start gap-6 lg:grid-cols-2" : "grid items-start gap-6"}>
      <div className="relative z-10 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur md:p-8">
        <p className="font-mono text-xs text-slate-400">
          {item.n} · {item.practice}
        </p>
        <h3 className="mt-3 font-display text-2xl tracking-tight text-slate-100">{item.title}</h3>
        <p className="mt-3 text-sm font-medium text-slate-100">
          {item.placeLabel}: {item.place}
        </p>
        <ReadMore lead={snap.lead}>
          {snap.extra ? <p>{snap.extra}</p> : null}
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workContext")}</span>
            <span className="mt-1 block">{item.context}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workChallenge")}</span>
            <span className="mt-1 block">{item.challenge}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workIntervention")}</span>
            <span className="mt-1 block">{item.intervention}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workModel")}</span>
            <span className="mt-1 block">{item.model}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workOutcome")}</span>
            <span className="mt-1 block">{item.outcome}</span>
          </p>
          <p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-slate-400">{t("workTakeaway")}</span>
            <span className="mt-1 block">{item.takeaway}</span>
          </p>
        </ReadMore>
      </div>
      {mark ? <ConstituencyMark mark={mark} /> : null}
    </article>
  );
}
