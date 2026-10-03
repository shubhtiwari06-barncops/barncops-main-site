import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

export function AppNotFound() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <p className="eyebrow">404</p>
      <h1 className="type-page mt-4">{t("notFoundTitle")}</h1>
      <p className="mt-4 max-w-md text-muted">{t("notFoundBody")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">{t("home")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/contact">{t("engage")}</Link>
        </Button>
      </div>
    </main>
  );
}
