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
  ],
  atlas: [
    { href: "https://atlas.barncops.in/elections/", labelKey: "electionAtlas" },
    { href: "https://atlas.barncops.in/lok-sabha/2024/", labelKey: "atlasLs2024" },
    { href: "https://atlas.barncops.in/lok-sabha/2024/party-wise/", labelKey: "atlasPartyWise" },
    { href: "https://atlas.barncops.in/lok-sabha/2024/state-wise/", labelKey: "atlasStateWise" },
    { href: "https://atlas.barncops.in/vidhan-sabha/", labelKey: "atlasVidhan" },
    { href: "https://atlas.barncops.in/ask/", labelKey: "atlasAsk" },
  ],
  firm: [
    { to: "/about", labelKey: "firm" },
    { to: "/governance", labelKey: "governanceNav" },
    { to: "/track-record", labelKey: "trackRecord" },
    { to: "/insights", labelKey: "insights" },
    { to: "/contact", labelKey: "footerBrief" },
  ],
} as const;
