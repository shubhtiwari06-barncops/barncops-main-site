const ORIGIN = "https://www.barncops.in";

export function pageHead(title: string, description: string, path = "/") {
  const pageTitle = fit(title, 60);
  const pageDescription = fit(description, 155);
  const url = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  return {
    meta: [
      { title: pageTitle },
      { name: "description", content: pageDescription },
      { property: "og:title", content: pageTitle },
      { property: "og:description", content: pageDescription },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

function fit(value: string, max: number) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const last = cut.lastIndexOf(" ");
  return (last > 24 ? cut.slice(0, last) : cut).trimEnd();
}

export const SITE_NAME = "Barnstorm Co-operations";
export const SITE_TAGLINE = "Political consulting firm in India — election campaign management and constituency intelligence.";

export const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Barnstorm Co-operations",
  url: "https://www.barncops.in",
  logo: "https://www.barncops.in/icons/icon-512.png",
  founder: { "@type": "Person", name: "Shubh Tiwari" },
  foundingDate: "2019",
  email: "poll@barncops.in",
  sameAs: [
    "https://x.com/BarnCops",
    "https://www.linkedin.com/company/barncops",
    "https://www.instagram.com/barncops",
  ],
};
