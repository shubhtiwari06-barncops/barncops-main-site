import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppNotFound } from "@/lib/not-found";
import { INSIGHTS } from "@/lib/content/insights";
import { pageHead } from "@/lib/seo";
import { useT } from "@/lib/i18n";

const ARTICLE_TITLES: Record<string, string> = {
  "booth-is-the-file": "Booth file, updated nightly | Barnstorm",
  "jansunwai-is-the-next-race": "Jan-Sunwai and the next race | Barnstorm",
  "field-is-logistics": "Field is a logistics problem | Barnstorm",
  "mplads-is-visible": "MPLADS as a political file | Barnstorm",
};

const MONTHS: Record<string, string> = {
  January: "01",
  February: "02",
  March: "03",
  April: "04",
  May: "05",
  June: "06",
  July: "07",
  August: "08",
  September: "09",
  October: "10",
  November: "11",
  December: "12",
};

function publishedIso(date: string) {
  const match = date.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (!match) return date;
  const month = MONTHS[match[2]];
  if (!month) return date;
  return `${match[3]}-${month}-${match[1].padStart(2, "0")}`;
}

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params }) => {
    const article = INSIGHTS.find((a) => a.slug === params.slug);
    const head = pageHead(
      article ? (ARTICLE_TITLES[article.slug] ?? "Insights | Barnstorm") : "Insights | Barnstorm",
      article?.dek ?? "Notes from the Barnstorm Co-operations practice.",
      article ? `/insights/${article.slug}` : "/insights",
    );
    head.meta.push({ name: "author", content: "Barnstorm Co-operations" });
    if (!article) return head;
    const data = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      datePublished: publishedIso(article.date),
      author: { "@type": "Organization", name: "Barnstorm Co-operations" },
      publisher: {
        "@type": "Organization",
        name: "Barnstorm Co-operations",
        logo: {
          "@type": "ImageObject",
          url: "https://www.barncops.in/icons/icon-512.png",
        },
      },
      mainEntityOfPage: `https://www.barncops.in/insights/${article.slug}`,
    };
    return { ...head, scripts: [{ type: "application/ld+json", children: JSON.stringify(data) }] };
  },
  component: Article,
});

function Article() {
  const { slug } = Route.useParams();
  const article = INSIGHTS.find((a) => a.slug === slug);
  const t = useT();
  if (!article) return <AppNotFound />;

  return (
    <main>
      <article className="mx-auto max-w-3xl relative z-10 px-6 py-16 md:px-12 md:py-24">
        <Link
          to="/insights"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted no-underline hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {t("insights")}
        </Link>
        <p className="eyebrow mt-8">
          {article.kicker} · {article.date} · Barnstorm Co-operations · {article.minutes} min
        </p>
        <h1 className="type-page mt-4 text-fg">{article.title}</h1>
        <p className="mt-5 font-display text-xl italic leading-relaxed text-muted">{article.dek}</p>
        <div className="mt-10 space-y-5">
          {article.body.map((p) => (
            <p key={p} className="text-base leading-relaxed text-fg/90">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-12 border-t border-border pt-8 text-sm text-muted">
          <Link to="/contact" className="text-fg underline-offset-4 hover:underline">
            {t("footerBrief")}
          </Link>
        </p>
      </article>
    </main>
  );
}
