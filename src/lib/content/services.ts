export const SERVICES = [
  {
    id: "strategy",
    kicker: "01",
    title: "Narrative strategy",
    summary:
      "Political strategy consulting written as a document a booth agent can execute and a principal can remember.",
    does: "Win-number architecture, coalition math, contrast, surrogate discipline, and one-page Friday memos for principals.",
    for: "Candidates and party leadership who need election campaign consulting, not a slogan workshop.",
    improves: "Whether the next 72 hours have a line the field can argue with — and whether the war-room is still improvising.",
    details: [
      "Win-number architecture and coalition math",
      "Narrative spine, contrast, and permission structures",
      "Speech, debate, and surrogate discipline",
      "Decision memos for principals — one page, not forty",
    ],
  },
  {
    id: "booth",
    kicker: "02",
    title: "Booth-level intelligence",
    summary:
      "Booth management strategy at the grain of the actual roll: universes, scripts, quality, and nightly reconciliation.",
    does: "Booth universe design against the roll, turf quality, persuasion sequenced before turnout, booth micro-targeting.",
    for: "Campaigns that treat booth-level intelligence as the unit of the race, not a ground-team folklore file.",
    improves: "ID quality, walkable turf, and whether Monday morning still matches the sheet the booth agent is holding.",
    details: [
      "Booth universe design against the actual roll",
      "Turf, training, and quality control",
      "Persuasion vs. turnout — sequenced, not mixed",
      "Volunteer and paid-canvass operating cadence",
    ],
  },
  {
    id: "perception",
    kicker: "03",
    title: "Digital perception & social command",
    summary:
      "Political campaign analytics and rapid response on a 72-hour clock, written back to the booth file — not a content calendar.",
    does: "Perception audits, opposition books, short-form testing with a kill criterion, rapid-response desks.",
    for: "Principals whose digital command must survive contact with a roll, not just a reel.",
    improves: "Whether a stale claim dies before it hardens, and whether digital output maps to booths.",
    details: [
      "Qualitative and tracker programs",
      "Issue salience vs. horse-race lag",
      "Opposition books built for rapid response",
      "Vulnerability audits for sitting MPs and MLAs",
    ],
  },
  {
    id: "warroom",
    kicker: "04",
    title: "Ground war-room",
    summary:
      "Political war-room management for the last thirty days: named decision rights, rapid response, one Friday memo.",
    does: "War-room cadence, paid and earned as one channel, crisis protocols with named decision rights.",
    for: "Races that need a room that runs, not a war-room photograph.",
    improves: "Decision rights, response time, and whether the last month is logistics or panic.",
    details: [
      "War-room operating cadence",
      "Rapid response desks",
      "Paid and earned as one channel plan",
      "Crisis protocols with named decision rights",
    ],
  },
  {
    id: "digital",
    kicker: "05",
    title: "Digital organizing",
    summary:
      "Political outreach operations treated as a single system — lists, creative, conversion, write-back to the constituency graph.",
    does: "Acquisition, nurture, conversion architecture, relational programs, integration with the mandata.ai graph.",
    for: "Campaigns and parties that need outreach with write-back, not a vendor stack held together by screenshots.",
    improves: "Whether a digital contact becomes a household in the file.",
    details: [
      "Acquisition, nurture, and conversion architecture",
      "Creative testing with a kill criterion",
      "Relational and community programs",
      "Integration with the mandata.ai graph",
    ],
  },
  {
    id: "governing",
    kicker: "06",
    title: "Officeholder operations",
    summary:
      "MP and MLA constituency management after the oath: Jan-Sunwai, presence, MPLADS / MLACDS as a governing practice.",
    does: "Jan-Sunwai SLA design, presence calendar, MPLADS / MLACDS utilization, campaign-to-governance handoff.",
    for: "Sitting MPs and MLAs, and constituency offices that intend to remain visible between cycles.",
    improves: "First-response time, fund visibility, and whether governing still has a map on Monday morning.",
    details: [
      "Jan-Sunwai intake and SLA design",
      "Presence calendar against the map",
      "MPLADS / MLACDS utilization",
      "Handoff from campaign graph to governing graph",
    ],
  },
] as const;

export const ENGAGEMENTS = [
  {
    title: "Race command",
    term: "90–180 days",
    fit: "Candidates and party units inside a live or coming cycle who need election campaign consulting as an embedded seat.",
    includes:
      "Full advisory seat: narrative strategy, booth design, digital perception, political war-room management, and a mandata.ai instance when the graph must persist.",
    choose:
      "Choose this when the clock is real and the theory of the race does not yet exist — or the last ninety days need named command.",
    body: "A full advisory seat: strategy, booth design, perception, war-room, and a mandata.ai instance. For campaigns that need a room and a map at once.",
  },
  {
    title: "Governing retainer",
    term: "12 months",
    fit: "Sitting MPs and MLAs, constituency offices, and members who already won and intend to keep the work visible.",
    includes:
      "Officeholder operations, Jan-Sunwai workflow management, MPLADS / MLACDS tracking, citizen connect discipline, and the platform.",
    choose:
      "Choose this when counting day is behind you and the next race will be lost in the inbox if the office has no operating picture.",
    body: "Officeholder operations, Jan-Sunwai, MPLADS, and the platform. Built for people who already won and intend to keep the work visible.",
  },
  {
    title: "Platform only",
    term: "Annual license",
    fit: "Parties, large public-facing offices, and firms that already have a consulting bench.",
    includes:
      "mandata.ai under your operators: constituency graph, grievance workflows, citizen connect, fund tracking, access control, nightly briefing.",
    choose:
      "Choose this when you already have a room and need a constituency operating system underneath it — not another visiting consultant.",
    body: "mandata.ai for campaigns, parties, and public offices that already have a consulting bench and need the graph underneath it.",
  },
] as const;
