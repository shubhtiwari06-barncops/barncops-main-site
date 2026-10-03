export const FIRM = {
  name: "Barnstorm Co-operations",
  short: "Barnstorm",
  legal: "Barnstorm Co-operations",
  product: "mandata.ai",
  founded: 2019,
  offices: ["New Delhi", "Bhopal", "Hyderabad"],
  operators: 48,
  states: "10+",
  pcs: "35+",
  acs: "200+",
  voters: "90M+",
  votersFull: "90,000,000+",
} as const;

export const SOCIAL = [
  {
    id: "x",
    labelKey: "socialX" as const,
    href: "https://x.com/BarnCops",
  },
  {
    id: "linkedin",
    labelKey: "socialLinkedin" as const,
    href: "https://www.linkedin.com/company/barncops",
  },
  {
    id: "instagram",
    labelKey: "socialInstagram" as const,
    href: "https://www.instagram.com/barncops",
  },
] as const;


export const IMPACT = [
  { n: "90,000,000+", labelKey: "statVoters" as const },
  { n: "200+", labelKey: "statAcsEngineered" as const },
  { n: "35+", labelKey: "statPcsSecured" as const },
  { n: "10+", labelKey: "statStatesMastered" as const },
] as const;

export const PRINCIPLES = [
  {
    title: "The room is not the map",
    body: "Strategy that cannot be located on a booth sheet is a speech. We write both, but we do not confuse them.",
  },
  {
    title: "MPs and MLAs are a different animal",
    body: "Campaigns end. Governing does not. The same graph that finds a persuadable booth should route a Jan-Sunwai, an MPLADS file, and a funeral wreath.",
  },
  {
    title: "Models are staff, not oracles",
    body: "A briefing is useful when a booth agent can argue with it. Ours are designed to be contradicted, then updated that night.",
  },
  {
    title: "The work is the credential",
    body: "We sit with parties and principals across the spectrum. The file, not the theatre, is what we put on the table.",
  },
] as const;

export const OFFICES = [
  {
    city: "New Delhi",
    role: "National advisory & mandata.ai",
    address: "Lodhi Road studio",
  },
  {
    city: "Bhopal",
    role: "Central & field systems",
    address: "Arera Colony studio",
  },
  {
    city: "Hyderabad",
    role: "South & product engineering",
    address: "Banjara Hills studio",
  },
] as const;
