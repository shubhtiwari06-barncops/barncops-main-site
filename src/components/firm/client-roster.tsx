import { GlowAvatar } from "@/components/firm/glow-avatar";
import { CLIENT_LEADERS, CLIENT_PARTIES } from "@/lib/content/clients";
import { useT } from "@/lib/i18n";

export function ClientRoster() {
  const t = useT();
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl relative z-10 px-6 py-16 md:px-12 md:py-24">
        <p className="eyebrow">{t("clientsKicker")}</p>
        <h2 className="type-section mt-3 max-w-2xl text-fg">{t("clientsTitle")}</h2>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
          {t("clientsLede")}
        </p>

        <p className="eyebrow mt-14">{t("clientsParties")}</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {CLIENT_PARTIES.map((p) => (
            <li key={p.id} className="border-t border-border pt-4">
              <h3 className="font-sans text-base font-semibold leading-snug text-fg">{p.name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.note}</p>
            </li>
          ))}
        </ul>

        <p className="eyebrow mt-16">{t("clientsLeaders")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-y-12">
          {CLIENT_LEADERS.map((c) => (
            <article
              key={c.id}
              className="flex w-1/2 flex-col items-center px-3 text-center sm:w-1/3"
            >
              <GlowAvatar src={c.photo} alt={c.name} glow={c.glow} kind="portrait" />
              <h3 className="mt-5 max-w-xs font-sans text-base font-semibold leading-snug tracking-tight text-fg">
                {c.name}
              </h3>
              <p className="mt-1.5 max-w-xs font-sans text-sm leading-relaxed text-muted">{c.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
