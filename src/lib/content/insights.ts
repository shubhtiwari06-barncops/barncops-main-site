export const INSIGHTS = [
  {
    slug: "booth-is-the-file",
    title: "The booth is not the territory — unless you update it nightly",
    dek: "Most campaigns still treat the roll as a backdrop. It is the work.",
    date: "12 August 2026",
    minutes: 7,
    kicker: "Booth systems",
    body: [
      "A campaign that prints a turf sheet on Monday and believes it on Thursday is running on folklore. The electorate moves: additions, deletions, a factory shift change, a flood. The file either absorbs that or it lies with confidence.",
      "We have sat in rooms where a booth in-charge defended a 40% ID rate as ‘the universe is hard.’ It was not hard. It was wrong. The party model had been trained on a cycle that no longer described two wards of renters.",
      "mandata.ai is opinionated on this point. A contact that does not write back the same night is not a contact. It is an anecdote. Nightly reconciliation is the difference between a program and a story about a program.",
      "The practical test is simple. Can a principal ask, at 7 a.m., which booths moved yesterday, on which issue, and what we are doing about it before noon? If the answer requires a meeting, you do not have a map. You have a slide.",
    ],
  },
  {
    slug: "jansunwai-is-the-next-race",
    title: "Officeholders lose the next race in the Jan-Sunwai inbox",
    dek: "Governing is a campaign with better stationery and worse SLAs.",
    date: "29 June 2026",
    minutes: 6,
    kicker: "Governing",
    body: [
      "Consultants love the campaign and endure the office. That is a professional deformity. The voter who could not get a call back about a collapsed retaining wall will not be persuaded by a bio video sixteen months later.",
      "We took apart the Jan-Sunwai of a sitting MP who was ‘popular’ and trailing. Median first response was eleven days. Precincts with the worst service times were the same booths the campaign intended to run up.",
      "The fix was not charm. It was routing. Every case against a household. Every household against a booth. A briefing that named breaches, not clips.",
      "Campaigns that inherit this graph start ahead. Software does not create the trust. It makes the neglect visible early enough to be expensive to ignore.",
    ],
  },
  {
    slug: "field-is-logistics",
    title: "Field is a logistics problem wearing a politics costume",
    dek: "Scripts matter. So do walkable turfs, shift lengths, and a kill rule for bad IDs.",
    date: "4 May 2026",
    minutes: 8,
    kicker: "Field",
    body: [
      "Politics attracts people who like sentences. Field rewards people who like warehouses. The gap is where programs go to die: a brilliant contrast frame delivered by exhausted karyakartas on a turf that crosses a highway.",
      "We measure four things before we talk about message at the door. Universe integrity. Turf walkability. Shift length against heat. ID quality with a published fail threshold.",
      "Persuasion and turnout are different jobs. Mixing them in one conversation is how you produce IDs that cannot be used. Sequence them.",
      "None of this photographs well. That is a feature.",
    ],
  },
  {
    slug: "mplads-is-visible",
    title: "MPLADS is a political file pretending to be an accounts file",
    dek: "What is sanctioned, what is stuck, and which booth can see it.",
    date: "18 March 2026",
    minutes: 6,
    kicker: "Funds",
    body: [
      "An MP who cannot name, at booth grain, where last year’s MPLADS went is already in the next race. Utilization reports written for the ministry are not written for the voter.",
      "mandata.ai tracks sanction, stall, and visibility against the household graph. A school room that exists in a PDF and not on the ground is a grievance waiting for a microphone.",
      "The nightly note is allowed to contradict the last utilization certificate. When it does, the certificate is the thing that has to explain itself.",
      "This is not mysticism about ‘being on the ground.’ It is a preference for high-frequency, noisy signal over low-frequency, clean signal.",
    ],
  },
] as const;

export type Insight = (typeof INSIGHTS)[number];
