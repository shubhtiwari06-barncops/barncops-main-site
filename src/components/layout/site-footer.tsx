import { Link } from "@tanstack/react-router";
import { Mark, Wordmark } from "@/components/layout/mark";
import { openRoster } from "@/components/layout/roster-dialog";
import { FOOTER_NAV } from "@/lib/content/nav";
import { FIRM, SOCIAL } from "@/lib/content/firm";
import { useT, type DictKey } from "@/lib/i18n";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2">
            <Mark className="h-8 w-10" />
            <Wordmark />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{t("footerBlurb")}</p>
          <p className="mt-6 font-mono text-xs tracking-wide text-subtle">
            {FIRM.offices.join(" · ")}
          </p>
          <p className="eyebrow mt-8">{t("social")}</p>
          <ul className="mt-4 flex items-center gap-2">
            {SOCIAL.map((s) => (
              <li key={s.id}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={t(s.labelKey)}
                  className="flex size-11 items-center justify-center text-muted transition-colors duration-150 hover:text-fg"
                >
                  <SocialIcon id={s.id} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:grid-cols-3">
          <FooterCol title={t("practice")} items={FOOTER_NAV.practice} />
          <div>
            <FooterCol title={t("firm")} items={FOOTER_NAV.firm} />
            <button
              type="button"
              onClick={openRoster}
              className="mt-3 text-left text-sm text-muted transition-colors duration-150 hover:text-fg"
            >
              {t("roster")}
            </button>
          </div>
          <div>
            <p className="eyebrow">{t("legal")}</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted no-underline transition-colors duration-150 hover:text-fg">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted no-underline transition-colors duration-150 hover:text-fg">
                  {t("terms")}
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("footerLegal")}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-mono text-xs text-subtle">
            © {new Date().getFullYear()} {FIRM.legal}
          </p>
          <p className="font-mono text-xs text-subtle">
            Advisory · {FIRM.product}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: readonly { labelKey: string; to?: string; href?: string }[];
}) {
  const t = useT();
  return (
    <div>
      <p className="eyebrow">{title}</p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item.labelKey}>
            {item.href ? (
              <a
                href={item.href}
                className="text-sm text-muted no-underline transition-colors duration-150 hover:text-fg"
              >
                {t(item.labelKey as DictKey)}
              </a>
            ) : (
              <Link
                to={item.to ?? "/"}
                className="text-sm text-muted no-underline transition-colors duration-150 hover:text-fg"
              >
                {t(item.labelKey as DictKey)}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ id }: { id: (typeof SOCIAL)[number]["id"] }) {
  const common = "size-5";
  if (id === "x") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.851L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    );
  }
  if (id === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" className={common} fill="currentColor" aria-hidden>
        <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.84-2.05 3.79-2.05 4.05 0 4.8 2.67 4.8 6.14V23h-4v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.72-2.54 3.49V23h-4V8.5z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}
