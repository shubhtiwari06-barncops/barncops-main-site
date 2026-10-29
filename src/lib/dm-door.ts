/**
 * Instagram and Facebook DM lead door.
 * One reply. Atlas composes it. This file does not call Ask and does not
 * touch the WhatsApp webhook.
 *
 * Env: ATLAS_WA_SECRET, ATLAS_WA_ASK_URL (the door URL is the same host at
 * /api/dm-door/), ATLAS_DM_DOOR_URL (optional override), ATLAS_WA_BYPASS,
 * MESSENGER_PAGE_ID, MESSENGER_PAGE_TOKEN.
 */

const WA = "919522236699";
const GRAPH = "v21.0";

export type DoorChannel = "instagram" | "facebook";

export type DoorIn = {
  channel: DoorChannel;
  userId: string;
  text: string;
};

type Env = Record<string, string | undefined>;

export function doorUrl(env: Env): string {
  const explicit = (env.ATLAS_DM_DOOR_URL || "").trim();
  if (explicit) return explicit.endsWith("/") ? explicit : explicit + "/";
  const ask = (env.ATLAS_WA_ASK_URL || "").trim();
  if (ask) return ask.replace(/\/api\/wa-ask\/?$/i, "/api/dm-door/");
  return "https://atlas.barncops.in/api/dm-door/";
}

function letter(channel: DoorChannel): "I" | "F" {
  return channel === "instagram" ? "I" : "F";
}

function slug(value: string): string {
  const t = String(value || "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
  return t || "ask";
}

export function refCode(channel: DoorChannel, kind: string, object: string): string {
  return `(ref ${letter(channel)}.${kind}.${slug(object)})`;
}

export function waLink(channel: DoorChannel, text: string, kind: string, object: string): string {
  const body = `${String(text || "Atlas").trim()} ${refCode(channel, kind, object)}`.trim();
  return `https://wa.me/${WA}?text=${encodeURIComponent(body)}`;
}

function langOf(text: string): "en" | "roman" | "deva" {
  if (/[\u0900-\u097F]/.test(text) || /[\u0600-\u06FF]/.test(text)) return "deva";
  if (/\b(kya|kaun|kitna|batao|chahiye|hai|neta|chunav)\b/i.test(text)) return "roman";
  return "en";
}

function isAdvisory(text: string): boolean {
  return /\b(custom research|advisory|war\s*room|consult(?:ing|ant)?)\b/i.test(text)
    || /कस्टम\s*रिसर्च|एडवाइजरी|वार\s*रूम|सलाहकार/.test(text);
}

function asksPrice(text: string): boolean {
  if (/\bhow many\b/i.test(text) || /कितनी सीट|कितने सीट/.test(text)) return false;
  return /\b(price|pricing|cost|how much|kitna|daam)\b/i.test(text) || /कीमत|दाम/.test(text);
}

function wantsPlan(text: string): boolean {
  return /\b(plan|plans|subscription|ask sarathi)\b/i.test(text) || /प्लान|सरथी/.test(text);
}

/** Used only when Atlas cannot be reached. Still one reply, still no result. */
export function fallbackReply(input: DoorIn): string {
  const text = String(input.text || "").replace(/\s+/g, " ").trim();
  const lang = langOf(text);
  if (isAdvisory(text)) {
    if (lang === "deva") return "कस्टम रिसर्च और एडवाइजरी सिर्फ़ एक लीड है। नाम, संस्था, ज़रूरत, और सुविधा का समय भेजें।";
    if (lang === "roman") return "Custom research aur advisory sirf ek lead hai. Naam, organisation, zarurat, aur pasand ka time bhejein.";
    return "Custom research and advisory are a lead only. Send your name, organisation, the need, and a preferred time.";
  }
  if (wantsPlan(text) && !asksPrice(text)) {
    const link = waLink(input.channel, "Ask Sarathi", "PR", "ask-sarathi");
    const line = lang === "deva"
      ? "Ask Sarathi। अगला कदम WhatsApp है।"
      : lang === "roman"
        ? "Ask Sarathi. Agla kadam WhatsApp hai."
        : "Ask Sarathi. The next step is WhatsApp.";
    return line + "\n" + link;
  }
  const link = waLink(input.channel, text || "Atlas", asksPrice(text) ? "PR" : "GEN", asksPrice(text) ? "ask-sarathi" : "ask");
  if (asksPrice(text)) {
    const line = lang === "deva" ? "Ask Sarathi ₹1,499 से।" : lang === "roman" ? "Ask Sarathi ₹1,499 se." : "Ask Sarathi from ₹1,499.";
    return line + "\n" + link;
  }
  const door = lang === "deva"
    ? "जवाब WhatsApp पर दिया जाता है।\nक्या चाहिए: एक सीट, एक क्षेत्र, एक नेता, या एक प्लान?"
    : lang === "roman"
      ? "Jawab WhatsApp par milta hai.\nKya chahiye: ek seat, ek ilaka, ek neta, ya ek plan?"
      : "The answer is delivered on WhatsApp.\nWhat do you want: a seat, a region, a leader, or a plan?";
  return door + "\n" + link;
}

function prose(text: string): string {
  return text.split(/https:\/\/wa\.me\//)[0];
}

/** A result, a payment link, or a request for caste / religion / party / phone is not a door reply. */
export function rejectedReply(text: string): boolean {
  const body = prose(text);
  if (/rzp\.io/i.test(body)) return true;
  if (/\b(won by|margin of)\b/i.test(body) && /\d{3,}/.test(body)) return true;
  if (/\b(caste|religion|party)\b|जाति|धर्म|किस पार्टी/.test(body)) return true;
  if (/(phone number|mobile number|मोबाइल|नंबर)/i.test(body) && /(send|share|भेज|बता|दीजिए)/i.test(body)) return true;
  return false;
}

export async function composeDoorReply(input: DoorIn, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<string> {
  const secret = (env.ATLAS_WA_SECRET || "").trim();
  const url = doorUrl(env);
  if (secret && /^https:\/\//i.test(url)) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "x-atlas-intake-secret": secret,
    };
    const bypass = (env.ATLAS_WA_BYPASS || "").trim();
    if (bypass) {
      headers["x-vercel-protection-bypass"] = bypass;
      headers["x-vercel-set-bypass-cookie"] = "true";
    }
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ channel: input.channel, user_id: input.userId, text: input.text || "" }),
        signal: ac.signal,
        redirect: "manual",
      });
      if (res.status >= 300 && res.status < 400) return fallbackReply(input);
      const raw = await res.text();
      if (!res.ok || raw.startsWith("<!") || /just a moment/i.test(raw)) return fallbackReply(input);
      const body = JSON.parse(raw) as { text?: string };
      if (body && typeof body.text === "string" && body.text.trim() && !rejectedReply(body.text)) return body.text;
    } catch {
      /* Atlas missed. The fallback still does not answer. */
    } finally {
      clearTimeout(timer);
    }
  }
  return fallbackReply(input);
}

function graphProduct(channel: DoorChannel): "instagram" | "messenger" {
  return channel === "instagram" ? "instagram" : "messenger";
}

export async function sendDoorReply(channel: DoorChannel, userId: string, text: string, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<void> {
  const token = (env.MESSENGER_PAGE_TOKEN || "").trim();
  const pageId = (env.MESSENGER_PAGE_ID || "").trim();
  if (!token || !pageId || !userId || !text) return;
  const res = await fetchImpl(`https://graph.facebook.com/${GRAPH}/${pageId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: graphProduct(channel),
      recipient: { id: userId },
      message: { text },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[dm-door] send failed", res.status, detail.slice(0, 200));
  }
}

export async function replyToSocialDm(
  input: DoorIn,
  deps?: { env?: Env; fetchImpl?: typeof fetch; send?: (channel: DoorChannel, userId: string, text: string) => Promise<void> },
): Promise<string> {
  const env = deps?.env || process.env;
  const fetchImpl = deps?.fetchImpl || fetch;
  let text = fallbackReply(input);
  try {
    text = await composeDoorReply(input, env, fetchImpl);
    if (rejectedReply(text)) text = fallbackReply(input);
  } catch {
    text = fallbackReply(input);
  }
  const send = deps?.send || ((channel, userId, body) => sendDoorReply(channel, userId, body, env, fetchImpl));
  try {
    await send(input.channel, input.userId, text);
  } catch (err) {
    console.error("[dm-door] send error", err);
  }
  return text;
}
