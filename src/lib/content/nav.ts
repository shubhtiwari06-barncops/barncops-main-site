export const NAV = [
  { to: "/advisory", labelKey: "advisory", badge: false },
  { to: "/platform", labelKey: "mandataNav", badge: true },
  { to: "/about", labelKey: "firm", badge: false },
  { to: "/", hash: "mandates", labelKey: "caseStudies", badge: false },
  { to: "/insights", labelKey: "insights", badge: false },
] as const;

export const FOOTER_NAV = {
  practice: [
    { to: "/advisory", labelKey: "advisory" },
    { to: "/platform", labelKey: "mandataNav" },
    { to: "/console", labelKey: "footerLive" },
    { to: "/work", labelKey: "caseStudies" },
    { href: "https://atlas.barncops.in/elections/", labelKey: "electionAtlas" },
  ],
  firm: [
    { to: "/about", labelKey: "firm" },
    { to: "/governance", labelKey: "governanceNav" },
    { to: "/track-record", labelKey: "trackRecord" },
    { to: "/insights", labelKey: "insights" },
    { to: "/contact", labelKey: "footerBrief" },
  ],
} as const;
