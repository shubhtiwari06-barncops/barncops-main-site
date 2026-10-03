export type Metric = "favorability" | "janSunwai" | "turnout" | "contacts";

export const METRICS: { id: Metric; labelKey: "mFav" | "mJan" | "mTurn" | "mCon"; shortKey: "mFavShort" | "mJanShort" | "mTurnShort" | "mConShort" }[] = [
  { id: "favorability", labelKey: "mFav", shortKey: "mFavShort" },
  { id: "janSunwai", labelKey: "mJan", shortKey: "mJanShort" },
  { id: "turnout", labelKey: "mTurn", shortKey: "mTurnShort" },
  { id: "contacts", labelKey: "mCon", shortKey: "mConShort" },
];

export type Booth = {
  id: string;
  name: string;
  col: number;
  row: number;
  turnout: number;
  favorability: number;
  contacts: number;
  janSunwai: number;
  households: number;
  contactsYtd: number;
  mplads: number;
};

const NAMES = [
  "Gandhi Nagar",
  "Nehru Chowk",
  "Station Ward",
  "Civil Lines",
  "Mandi",
  "Ghat",
  "Old City East",
  "Old City West",
  "Tehsil",
  "Block HQ",
  "Canal Colony",
  "Railway",
  "Bazaar",
  "Temple Road",
  "School Para",
  "Mill Gate",
  "New Housing",
  "Dairy",
  "Bus Stand",
  "Kacheri",
  "Pahadi",
  "Talab",
  "Bagh",
  "Nala",
  "Purwa North",
  "Purwa South",
  "Kheda",
  "Bangar",
  "Khadar",
  "Ganj",
  "Sabzi Mandi",
  "Idgah",
  "Gomti",
  "Ridge",
  "Cut",
  "Factory",
  "Orchard",
  "Ferry",
  "Ghat 4",
  "Custom",
  "Baths",
  "Colonnade",
  "Terrace",
  "Viaduct",
  "Commons",
  "Maidan",
  "Wharf",
  "Point",
];

function rnd(seed: number) {
  const x = Math.sin(seed * 999) * 10000;
  return x - Math.floor(x);
}

export const BOOTHS: Booth[] = NAMES.map((name, i) => {
  const col = i % 8;
  const row = Math.floor(i / 8);
  const periurban = col >= 5;
  const hq = row <= 1;
  return {
    id: `B-${String(i + 1).padStart(3, "0")}`,
    name,
    col,
    row,
    turnout: Math.round(42 + rnd(i + 1) * 32 + (hq ? 6 : 0) - (periurban ? 5 : 0)),
    favorability: Math.round(-8 + rnd(i + 7) * 24 + (periurban ? 3 : 0) - (hq ? 2 : 0)),
    contacts: Math.round(18 + rnd(i + 13) * 72),
    janSunwai: Math.round(rnd(i + 23) * 22),
    households: Math.round(380 + rnd(i + 3) * 820),
    contactsYtd: Math.round(70 + rnd(i + 11) * 480),
    mplads: Math.round(35 + rnd(i + 29) * 60),
  };
});

export const DISTRICT = {
  name: "AC-25 Panipat City",
  city: "Composite · North",
  cycle: "2026",
  electorate: 284110,
  winNumber: 96840,
} as const;

export function metricValue(p: Booth, metric: Metric) {
  return p[metric];
}

export function metricMax(metric: Metric) {
  if (metric === "favorability") return 20;
  if (metric === "janSunwai") return 22;
  return 100;
}

export function metricMin(metric: Metric) {
  if (metric === "favorability") return -8;
  return 0;
}

export function rollup(metric: Metric) {
  const values = BOOTHS.map((p) => metricValue(p, metric));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    avg,
    min: Math.min(...values),
    max: Math.max(...values),
    covered: BOOTHS.filter((p) => p.contacts >= 60).length,
  };
}

export const TREND = [
  { day: "Mon", turnout: 48, contacts: 820 },
  { day: "Tue", turnout: 49, contacts: 910 },
  { day: "Wed", turnout: 49, contacts: 870 },
  { day: "Thu", turnout: 50, contacts: 1040 },
  { day: "Fri", turnout: 51, contacts: 1180 },
  { day: "Sat", turnout: 54, contacts: 1560 },
  { day: "Sun", turnout: 55, contacts: 1320 },
];
