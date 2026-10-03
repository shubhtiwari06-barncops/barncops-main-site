export type WaStage =
  | "new"
  | "ask_name"
  | "ask_role"
  | "ask_geography"
  | "ask_need"
  | "ask_timeline"
  | "ask_challenge"
  | "offer_path"
  | "ask_callback_phone"
  | "ask_callback_time"
  | "continue"
  | "escalated"
  | "filed";

export const GREETING_RE =
  /^(hi|hii|hello|hey|namaste|namaskar|yo|ok|okay|haan|ji|salam|salaam|as[- ]?salam.*|good (morning|evening|afternoon)|hello barnstorm.*|i would like to discuss.*)$/i;

export const ESCALATE_RE =
  /\b(speak (to|with) a director|talk (to|with) a director|need a director|call (me )?now|urgent(?:ly)?$|escalate|real person|human please|not a bot|stop (the )?bot|connect me)\b/i;

export function msgOpen() {
  return [
    "Barnstorm Co-operations.",
    "",
    "This channel is for principals and sitting offices. A short qualification keeps the file tight. If there is no fit, we will say so.",
    "",
    "Your name, as it should appear on the file.",
  ].join("\n");
}

export function msgRole() {
  return [
    "Your role in the room.",
    "",
    "1 Candidate",
    "2 Sitting MP",
    "3 Sitting MLA",
    "4 Party unit",
    "5 Constituency office",
    "6 Other",
  ].join("\n");
}

export function msgGeography() {
  return "Constituency, state, or jurisdiction — as you would brief a director.";
}

export function msgNeed() {
  return ["What do you need from Barnstorm Co-operations?", "", "1 Advisory", "2 mandata.ai", "3 Both"].join("\n");
}

export function msgTimeline() {
  return ["The clock.", "", "1 Inside 90 days", "2 This cycle", "3 Next cycle", "4 Governing, not a race"].join("\n");
}

export function msgChallenge() {
  return "The operating problem, in a few sentences. What is true, what is stuck, what a good ninety days would change.";
}

export function msgPath() {
  return [
    "Noted. A director will read this file if there is a fit.",
    "",
    "How should we proceed?",
    "",
    "1 Continue on WhatsApp",
    "2 Request a callback",
    "3 Request a platform walkthrough",
    "4 Submit a confidential intake",
  ].join("\n");
}

export function msgCallbackPhone() {
  return "The number a director should call. Include country code.";
}

export function msgCallbackTime() {
  return "Preferred window — date, time, and timezone if not IST.";
}

export function msgCallbackFiled(ref: string) {
  return `Callback ${ref} is on file. A director at Barnstorm Co-operations will review it. If there is no fit, we will say so.`;
}

export function msgWalkthrough() {
  return "A mandata.ai walkthrough is noted against this file. A director will confirm if there is a fit.";
}

export function msgIntake() {
  return "Confidential intake sits on the contact desk at mandata.ai. File it there if you would rather write than talk. This thread remains open.";
}

export function msgContinue() {
  return "The file is open. Write the next operational detail. A director reads escalations; this channel will not chase.";
}

export function msgEscalated() {
  return "This is with a director at Barnstorm Co-operations. Automated questions stop here. If there is no fit, we will say so.";
}

export function msgRepeat() {
  return "Still with the director's desk. No further automated questions.";
}

export function msgUnclear(prompt: string) {
  return `That did not file. ${prompt}`;
}

export function msgMedia() {
  return "This channel is text. Write the file in words.";
}

export const ROLE_LIST = {
  button: "Select role",
  sections: [
    {
      title: "Role",
      rows: [
        { id: "role_candidate", title: "Candidate" },
        { id: "role_MP", title: "Sitting MP" },
        { id: "role_MLA", title: "Sitting MLA" },
        { id: "role_party_unit", title: "Party unit" },
        { id: "role_office", title: "Office" },
        { id: "role_other", title: "Other" },
      ],
    },
  ],
};

export const NEED_BUTTONS = [
  { id: "need_advisory", title: "Advisory" },
  { id: "need_mandata", title: "mandata.ai" },
  { id: "need_both", title: "Both" },
];

export const TIME_LIST = {
  button: "Select clock",
  sections: [
    {
      title: "Clock",
      rows: [
        { id: "time_90", title: "Inside 90 days" },
        { id: "time_180", title: "This cycle" },
        { id: "time_cycle", title: "Next cycle" },
        { id: "time_governing", title: "Governing" },
      ],
    },
  ],
};

export const PATH_LIST = {
  button: "Select path",
  sections: [
    {
      title: "Path",
      rows: [
        { id: "path_continue", title: "Continue here" },
        { id: "path_callback", title: "Request callback" },
        { id: "path_walkthrough", title: "Platform walkthrough" },
        { id: "path_intake", title: "Confidential intake" },
      ],
    },
  ],
};

export function parseRole(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s === "1" || s === "role_candidate" || /^candidate/.test(s)) return "candidate";
  if (s === "2" || s === "role_mp" || /\bmp\b/.test(s) || /sitting mp/.test(s) || /sa[nm]sad/.test(s))
    return "MP";
  if (s === "3" || s === "role_mla" || /\bmla\b/.test(s) || /vidhayak/.test(s)) return "MLA";
  if (s === "4" || s === "role_party_unit" || /party/.test(s) || /caucus/.test(s) || /unit/.test(s))
    return "party_unit";
  if (s === "5" || s === "role_office" || /office/.test(s) || /karyalay/.test(s)) return "office";
  if (s === "6" || s === "role_other" || /^other/.test(s) || /principal/.test(s) || /investor/.test(s))
    return s.includes("investor") ? "investor" : s.includes("principal") ? "principal" : "other";
  return null;
}

export function parseNeed(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s === "1" || s === "need_advisory" || /advis/.test(s) || /consult/.test(s) || /room/.test(s))
    return "advisory";
  if (s === "2" || s === "need_mandata" || /mandata/.test(s) || /\bos\b/.test(s) || /platform/.test(s))
    return "mandata";
  if (s === "3" || s === "need_both" || /both/.test(s) || /combined/.test(s)) return "both";
  return null;
}

export function parseTimeline(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s === "1" || s === "time_90" || /90/.test(s) || /immediate/.test(s) || /urgent/.test(s)) return "90";
  if (s === "2" || s === "time_180" || /this cycle/.test(s) || /180/.test(s) || /this year/.test(s))
    return "180";
  if (s === "3" || s === "time_cycle" || /next cycle/.test(s) || /next election/.test(s)) return "cycle";
  if (s === "4" || s === "time_governing" || /govern/.test(s) || /sitting/.test(s) || /office$/.test(s))
    return "governing";
  if (s.length >= 3 && s.length <= 80) return s.slice(0, 40);
  return null;
}

export function parsePath(raw: string): "continue" | "callback" | "walkthrough" | "intake" | null {
  const s = raw.trim().toLowerCase();
  if (s === "1" || s === "path_continue" || /continue/.test(s) || /whatsapp/.test(s) || /here/.test(s))
    return "continue";
  if (s === "2" || s === "path_callback" || /callback/.test(s) || /call back/.test(s) || /phone/.test(s))
    return "callback";
  if (s === "3" || s === "path_walkthrough" || /walk/.test(s) || /demo/.test(s) || /platform/.test(s))
    return "walkthrough";
  if (s === "4" || s === "path_intake" || /intake/.test(s) || /form/.test(s) || /brief/.test(s))
    return "intake";
  return null;
}

export function looksLikeName(raw: string) {
  const s = raw.replace(/\s+/g, " ").trim();
  if (s.length < 2 || s.length > 80) return false;
  if (GREETING_RE.test(s)) return false;
  if (/\d{6,}/.test(s)) return false;
  if (s.split(" ").length > 6) return false;
  return true;
}

/** A callback window, not free text. "hello" and "send the deck" are not slots. */
export function looksLikeCallbackWindow(raw: string) {
  const s = raw.replace(/\s+/g, " ").trim();
  if (s.length < 3 || s.length > 120) return false;
  if (GREETING_RE.test(s)) return false;
  if (/^(thanks|thank you|yes|no|ok|okay|haan|ji|sure|done)\b/i.test(s) && !/\d/.test(s)) return false;
  if (/\b\d{1,2}:\d{2}\b/.test(s)) return true;
  if (/\b\d{1,2}\s*(am|pm|a\.m\.|p\.m\.)\b/i.test(s)) return true;
  if (/\b(morning|evening|afternoon|tonight|today|tomorrow|night)\b/i.test(s)) return true;
  if (/\b(mon|tue|wed|thu|fri|sat|sun)(day)?\b/i.test(s)) return true;
  if (/\b(subah|shaam|sham|dopahar|raat|kal|aaj|parson)\b/i.test(s)) return true;
  if (/\b(after|before|around|between)\b/i.test(s) && /\d/.test(s)) return true;
  return false;
}

/** Mid-flow threads older than 12 hours start again. Escalations stay with a person. */
export function isStaleConversation(
  lastInboundAt: string | Date | null | undefined,
  now = Date.now(),
  staleMs = 12 * 60 * 60 * 1000,
) {
  if (lastInboundAt == null || lastInboundAt === "") return false;
  const at = new Date(lastInboundAt).getTime();
  if (!Number.isFinite(at)) return false;
  return now - at > staleMs;
}

export function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}
