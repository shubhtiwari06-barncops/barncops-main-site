export const MODULES = [
  {
    id: "graph",
    title: "Constituency graph",
    body: "Booths, households, and institutions as a living constituency intelligence layer — not a CSV that went stale on Friday.",
    who: "Campaign desks, constituency offices, party operations teams.",
    improves: "A single operating picture: who lives where, which booth, which grievance, which sanctioned work.",
  },
  {
    id: "jansunwai",
    title: "Jan-Sunwai inbox",
    body: "Grievance redressal system for sitting MPs and MLAs: intake, routing, SLA, write-back. The person at the door is already in the file.",
    who: "Officeholders and grievance desks running Jan-Sunwai workflow management.",
    improves: "First-response time, named assignment, and whether neglect is still invisible on Monday.",
  },
  {
    id: "connect",
    title: "Citizen connect",
    body: "A citizen connect platform against the graph: permissioned outreach for presence, scheme camps, and household contact — not a blast list.",
    who: "Communications and field, under role-based send rights.",
    improves: "Outreach that can be audited, scoped to a universe, and revoked.",
  },
  {
    id: "funds",
    title: "MPLADS / MLACDS tracking",
    body: "MPLADS tracking for MPs and MLACDS tracking for MLAs, tied to work and ward: what is sanctioned, what is stuck, what is visible on the ground.",
    who: "Sitting MPs (MPLADS) and MLAs (MLACDS), with office staff on named access.",
    improves: "Whether a sanctioned work is still a rumour in the constituency.",
  },
  {
    id: "booth",
    title: "Booth intelligence",
    body: "Booth-level intelligence: net favorability, turnout, and weekly contacts at booth grain, with nightly field write-back.",
    who: "Campaign command and sitting offices that still think in booths.",
    improves: "Which booths moved — and what to do before noon.",
  },
  {
    id: "briefing",
    title: "Nightly briefing",
    body: "A one-page note for principals: booths that moved, Jan-Sunwai that breached SLA, works that stalled.",
    who: "Principals and chiefs of staff.",
    improves: "Decision support without a forty-slide deck.",
  },
] as const;

export const OS_STATS = [
  {
    label: "Citizens on licensed instances",
    value: "18.2M",
    def: "Households and electors currently on licensed mandata.ai instances in the sample operating set — not a national claim.",
  },
  {
    label: "Median Jan-Sunwai first response",
    value: "19 hrs",
    def: "Median time from grievance intake to first logged human action on live instances in the sample set.",
  },
  {
    label: "Field write-back cadence",
    value: "Same night",
    def: "Target operating cadence: contacts and notes reconcile to the constituency graph before the next principal briefing.",
  },
  {
    label: "Live constituency instances",
    value: "41",
    def: "Assembly and parliamentary units currently on a licensed mandata.ai instance in the sample operating set.",
  },
] as const;

export const PLATFORM_WHO = {
  en: [
    {
      title: "Sitting MPs",
      body: "MP constituency management: Jan-Sunwai, citizen connect, MPLADS tracking, and booth intelligence on one graph.",
    },
    {
      title: "Sitting MLAs",
      body: "MLA constituency management at assembly grain — MLACDS tracking, grievance workflows, presence against the map.",
    },
    {
      title: "Constituency offices",
      body: "Office-level operational discipline: named roles, SLAs, and a file the desk can close against.",
    },
    {
      title: "Party operations teams",
      body: "A political operations platform for India: common graph, named access, audit trail — under the party’s own bench.",
    },
    {
      title: "Campaign command structures",
      body: "Booth file, contacts, and IDs that write back the same night so political campaign analytics are usable before noon.",
    },
    {
      title: "Large public-facing political offices",
      body: "High-volume grievance and outreach environments that cannot run on a shared password and a WhatsApp group.",
    },
  ],
  hi: [
    {
      title: "बैठे सांसद",
      body: "सांसद क्षेत्रीय प्रबंधन: जन-सुनवाई, नागरिक संपर्क, MPLADS ट्रैकिंग, और बूथ इंटेलिजेंस — एक ग्राफ़ पर।",
    },
    {
      title: "बैठे विधायक",
      body: "विधानसभा स्तर पर विधायक क्षेत्रीय प्रबंधन — MLACDS ट्रैकिंग, शिकायत वर्कफ़्लो, मानचित्र के विरुद्ध उपस्थिति।",
    },
    {
      title: "क्षेत्रीय कार्यालय",
      body: "कार्यालय अनुशासन: नामित भूमिकाएँ, SLA, और एक फ़ाइल जिसके विरुद्ध डेस्क केस बंद कर सके।",
    },
    {
      title: "पार्टी ऑपरेशन्स टीमें",
      body: "भारत के लिए राजनीतिक ऑपरेशन्स प्लेटफ़ॉर्म: साझा ग्राफ़, नामित पहुँच, ऑडिट ट्रेल — पार्टी की अपनी बेंच के नीचे।",
    },
    {
      title: "अभियान कमांड संरचनाएँ",
      body: "बूथ फ़ाइल, संपर्क और ID उसी रात लिखे जाएँ, ताकि दोपहर से पहले एनालिटिक्स काम आए।",
    },
    {
      title: "बड़े सार्वजनिक राजनीतिक कार्यालय",
      body: "उच्च-आयतन शिकायत और आउटरीच — साझा पासवर्ड और व्हाट्सएप ग्रुप पर नहीं चल सकते।",
    },
  ],
} as const;
