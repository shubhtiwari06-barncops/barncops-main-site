/**
 * Barnstorm Co-operations — unified intake engine (v7)
 * One state machine, one spam engine, one email dispatcher — four channels:
 *   whatsapp | messenger | instagram | x
 *
 * WhatsApp keeps its Cloud API sender; Messenger + Instagram share the Meta
 * Page token; X uses OAuth 1.0a user-context DMs.
 *
 * Requires migrations 001 + 002 + 003 applied.
 * Env: DATABASE_URL, RESEND_API_KEY, INTAKE_TO_EMAIL, FROM_EMAIL,
 *      WHATSAPP_BUSINESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID        (whatsapp)
 *      MESSENGER_PAGE_ID, MESSENGER_PAGE_TOKEN                  (fb + ig)
 *      X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET (x)
 */

import { createHmac, randomBytes } from "node:crypto";

const GRAPH_VERSION = "v21.0";

export type Channel = "whatsapp" | "messenger" | "instagram" | "x";

export type InboundMsg = {
  channel: Channel;
  senderKey: string; // whatsapp: digits; messenger: PSID; instagram: IGSID; x: numeric user id
  text: string | null;
  kind: "text" | "media";
  mediaType?: string | null;
  profileName?: string | null;
  timestamp?: string | null; // unix seconds, string
  messageId?: string | null;
};

/* ═══════════════════════════════════════════════════════════════════
   1. Language detection — Devanagari mirror
   ═══════════════════════════════════════════════════════════════════ */

function isHindi(s: string): boolean {
  return (s.match(/[\u0900-\u097F]/g) || []).length >= 3;
}

/* ═══════════════════════════════════════════════════════════════════
   2. Copy — English + Hindi
   ═══════════════════════════════════════════════════════════════════ */

const COPY = {
  en: {
    intro: [
      "Thank you for reaching Barnstorm Co-operations.",
      "",
      "We advise a small number of principals in political and public life — mandates handled strictly in confidence.",
      "",
      "To connect you with the right member of the team, may we ask the capacity in which you write?",
      "(MLA · MP · MLC · party office bearer · another)",
    ].join("\n"),
    detailsPrincipal: [
      "Thank you — noted with full discretion.",
      "",
      "Two short questions, and we will set a call:",
      "1 · The state or constituency the mandate concerns",
      "2 · Your window — an ongoing session, an approaching election, or other timeline",
    ].join("\n"),
    detailsOther: "Thank you. A line on the nature of the mandate, and the geography it concerns, will help us route this correctly.",
    schedulingBase: [
      "Thank you. A member of the team will call you personally — no intermediaries.",
      "",
      "Would you prefer:",
      "· Today, 6–9 pm IST",
      "· Tomorrow, 10 am–1 pm IST",
      "…or name a window that suits you.",
    ].join("\n"),
    windowOnlyPrompt: (ack: string) =>
      [ack, "", "One remaining question, and we will set the call:", "· Your window — an ongoing session, an approaching election, or other timeline."].join("\n"),
    confirm: (slot: string, phone: string | null, isWa: boolean) =>
      [
        slot ? `Noted — ${slot}.` : "Noted. The team will agree a time with you directly.",
        "",
        isWa
          ? "The team will reach you on this number."
          : phone
            ? `The team will call you on ${prettyPhone(phone)}.`
            : "The team will reach you here.",
        "",
        "Nothing further is needed for now. Anything you mark here before the call is read by the team directly.",
      ].join("\n"),
    slotReask: [
      "Noted — the team will read this before the call.",
      "",
      "So we reach you at the right moment, which window suits you?",
      "· Today, 6–9 pm IST",
      "· Tomorrow, 10 am–1 pm IST",
      "…or name a day and time.",
    ].join("\n"),
    askPhone: [
      "Noted. And since the team will call you personally —",
      "",
      "The best number to reach you on?",
    ].join("\n"),
  },
  hi: {
    intro: [
      "Barnstorm Co-operations में आपका स्वागत है।",
      "",
      "हम राजनीति और लोक जीवन के चुनिंदा प्रतिनिधियों को सलाह देते हैं — पूरी गोपनीयता के साथ।",
      "",
      "आपको सही व्यक्ति से जोड़ने के लिए, कृपया बताएं आप किस भूमिका में लिख रहे हैं?",
      "(विधायक · सांसद · MLC · पदाधिकारी · अन्य)",
    ].join("\n"),
    detailsPrincipal: [
      "धन्यवाद — पूर्ण गोपनीयता में नोट कर लिया गया।",
      "",
      "कॉल तय करने से पहले दो छोटे प्रश्न:",
      "१ · राज्य या क्षेत्र जिससे मामला जुड़ा है",
      "२ · आपकी समय-सीमा — सत्र, आगामी चुनाव, या कोई और अवधि",
    ].join("\n"),
    detailsOther: "धन्यवाद। मामले की प्रकृति और संबंधित क्षेत्र की एक पंक्ति दें, ताकि हम इसे सही जगह भेज सकें।",
    schedulingBase: [
      "धन्यवाद। टीम का सदस्य आपसे स्वयं संपर्क करेगा — बिना किसी बिचौलिये के।",
      "",
      "क्या आप पसंद करेंगे:",
      "· आज, शाम 6–9 बजे IST",
      "· कल, सुबह 10 बजे – दोपहर 1 बजे IST",
      "…या अपनी सुविधा का समय बताएं।",
    ].join("\n"),
    windowOnlyPrompt: (ack: string) => [ack, "", "बस एक अंतिम प्रश्न, फिर कॉल तय कर देंगे:", "· आपकी समय-सीमा — सत्र, आगामी चुनाव, या कोई और अवधि।"].join("\n"),
    confirm: (slot: string, phone: string | null, isWa: boolean) =>
      [
        slot ? `नोट किया — ${slot}।` : "नोट किया। समय टीम आपसे सीधे तय करेगी।",
        "",
        isWa
          ? "टीम आपसे इसी नंबर पर संपर्क करेगी।"
          : phone
            ? `टीम आपसे ${prettyPhone(phone)} पर संपर्क करेगी।`
            : "टीम आपसे यहीं संपर्क करेगी।",
        "",
        "अभी और कुछ करने की ज़रूरत नहीं। कॉल से पहले जो भी आप यहाँ लिखेंगे, वह सीधे टीम पढ़ेगी।",
      ].join("\n"),
    slotReask: [
      "नोट किया — कॉल से पहले टीम इसे पढ़ेगी।",
      "",
      "ताकि हम सही समय पर संपर्क करें, कौन सा समय उपयुक्त है?",
      "· आज, शाम 6–9 बजे IST",
      "· कल, सुबह 10 बजे – दोपहर 1 बजे IST",
      "…या कोई दिन और समय बताएं।",
    ].join("\n"),
    askPhone: [
      "नोट किया। और चूंकि टीम स्वयं कॉल करेगी —",
      "",
      "संपर्क के लिए सबसे उपयुक्त नंबर?",
    ].join("\n"),
  },
} as const;

/* ═══════════════════════════════════════════════════════════════════
   3. Role classification
   ═══════════════════════════════════════════════════════════════════ */

type Role = "mla" | "mp" | "mlc" | "office_bearer" | "other";

function classifyRole(raw: string): Role {
  const s = raw.toLowerCase();
  if (/(?<![A-Za-z\u0900-\u097F])(mlc|vidhan parishad|विधान परिषद)(?![A-Za-z\u0900-\u097F])/.test(s)) return "mlc";
  if (/(?<![A-Za-z\u0900-\u097F])(mp|m\.p\.|सांसद|member of parliament|lok sabha|rajya sabha|लोकसभा|राज्यसभा)(?![A-Za-z\u0900-\u097F])/.test(s)) return "mp";
  if (/(?<![A-Za-z\u0900-\u097F])(mla|m\.l\.a\.|विधायक|विधान सभा|vidhan sabha|vidhayak|legislative assembly)(?![A-Za-z\u0900-\u097F])/.test(s)) return "mla";
  if (
    /(office[ -]?bearer|पदाधिकारी|प्रभारी|prabhari|अध्यक्ष|adhyaksh|president|chairman|chairperson|spokesperson|प्रवक्ता|(general |mahama?ntri |joint )?secretary|सचिव|महामंत्री|मंत्री|mantri|minister|sarpanch|सरपंच|councillor|पार्षद|district president|जिलाध्यक्ष)/.test(s)
  )
    return "office_bearer";
  return "other";
}

const ROLE_LABEL: Record<Role, string> = { mla: "MLA", mp: "MP", mlc: "MLC", office_bearer: "Office bearer", other: "General" };
const ROLE_LABEL_HI: Record<Role, string> = { mla: "विधायक", mp: "सांसद", mlc: "MLC", office_bearer: "पदाधिकारी", other: "सामान्य" };
const isPrincipal = (r: Role) => r !== "other";

/* ═══════════════════════════════════════════════════════════════════
   4. All 28 states + 8 UTs — structural facts (stable across cycles)
   ═══════════════════════════════════════════════════════════════════ */

type StateFact = { key: string; name: string; nameHi: string; seats: number; hint: string; hintHi: string; patterns: RegExp };

const STATES: StateFact[] = [
  { key: "ap", name: "Andhra Pradesh", nameHi: "आंध्र प्रदेश", seats: 175, hint: "175 seats; coastal-Rayalaseema-Uttarandhra split runs deep.", hintHi: "175 सीटें; तटीय-रायलसीमा-उत्तरांध्र विभाजन गहरा।", patterns: /(?<![A-Za-z\u0900-\u097F])(andhra\s?pradesh|आंध्र\s?प्रदेश)(?![A-Za-z\u0900-\u097F])/i },
  { key: "ar", name: "Arunachal Pradesh", nameHi: "अरुणाचल प्रदेश", seats: 60, hint: "60 seats; frontier state, high electoral volatility.", hintHi: "60 सीटें; सीमांत राज्य, अधिक चुनावी उतार-चढ़ाव।", patterns: /(?<![A-Za-z\u0900-\u097F])(arunachal(\s?pradesh)?|अरुणाचल)(?![A-Za-z\u0900-\u097F])/i },
  { key: "as", name: "Assam", nameHi: "असम", seats: 126, hint: "126 seats; Barak-Brahmaputra divide, upper Assam tea belts pull differently.", hintHi: "126 सीटें; बराक-ब्रह्मपुत्र विभाजन, ऊपरी असम के चाय क्षेत्र अलग खींचते हैं।", patterns: /(?<![A-Za-z\u0900-\u097F])(assam|असम|आसाम)(?![A-Za-z\u0900-\u097F])/i },
  { key: "br", name: "Bihar", nameHi: "बिहार", seats: 243, hint: "243 seats; coalition arithmetic decides every cycle.", hintHi: "243 सीटें; हर चुनाव में गठबंधन का गणित निर्णायक।", patterns: /(?<![A-Za-z\u0900-\u097F])(bihar|बिहार)(?![A-Za-z\u0900-\u097F])/i },
  { key: "cg", name: "Chhattisgarh", nameHi: "छत्तीसगढ़", seats: 90, hint: "90 seats; dense tribal belts, urban Raipur pulls the other way.", hintHi: "90 सीटें; घने आदिवासी क्षेत्र, शहरी रायपुर विपरीत खींचता है।", patterns: /(?<![A-Za-z\u0900-\u097F])(chhattisgarh|छत्तीसगढ़|छत्तीसगड़)(?![A-Za-z\u0900-\u097F])/i },
  { key: "goa", name: "Goa", nameHi: "गोवा", seats: 40, hint: "40 seats; narrow margins, high defector count each cycle.", hintHi: "40 सीटें; मामूली अंतर, हर चुनाव में दलबदल अधिक।", patterns: /(?<![A-Za-z\u0900-\u097F])(goa|गोवा)(?![A-Za-z\u0900-\u097F])/i },
  { key: "gj", name: "Gujarat", nameHi: "गुजरात", seats: 182, hint: "182 seats; closest thing to a one-party assembly in India.", hintHi: "182 सीटें; भारत में एक-दलीय विधानसभा के सबसे निकट।", patterns: /(?<![A-Za-z\u0900-\u097F])(gujarat|गुजरात)(?![A-Za-z\u0900-\u097F])/i },
  { key: "hr", name: "Haryana", nameHi: "हरियाणा", seats: 90, hint: "90 seats; Jat/non-Jat arithmetic tends to be decisive.", hintHi: "90 सीटें; जाट/गैर-जाट का गणित प्रायः निर्णायक होता है।", patterns: /(?<![A-Za-z\u0900-\u097F])(haryana|हरियाणा)(?![A-Za-z\u0900-\u097F])/i },
  { key: "hp", name: "Himachal Pradesh", nameHi: "हिमाचल प्रदेश", seats: 68, hint: "68 seats; no party has held it back-to-back since 1985.", hintHi: "68 सीटें; 1985 के बाद कोई भी दल लगातार दो बार सत्ता में नहीं रहा।", patterns: /(?<![A-Za-z\u0900-\u097F])(himachal(\s?pradesh)?|हिमाचल(\s?प्रदेश)?)(?![A-Za-z\u0900-\u097F])/i },
  { key: "jh", name: "Jharkhand", nameHi: "झारखंड", seats: 81, hint: "81 seats; tribal reserved seats often decisive.", hintHi: "81 सीटें; आदिवासी आरक्षित सीटें प्रायः निर्णायक।", patterns: /(?<![A-Za-z\u0900-\u097F])(jharkhand|झारखंड|झारखण्ड)(?![A-Za-z\u0900-\u097F])/i },
  { key: "ka", name: "Karnataka", nameHi: "कर्नाटक", seats: 224, hint: "224 seats; Old Mysuru versus Bombay Karnataka runs deep.", hintHi: "224 सीटें; पुराने मैसूर बनाम बॉम्बे कर्नाटक का फर्क गहरा है।", patterns: /(?<![A-Za-z\u0900-\u097F])(karnataka|कर्नाटक)(?![A-Za-z\u0900-\u097F])/i },
  { key: "kl", name: "Kerala", nameHi: "केरल", seats: 140, hint: "140 seats; country's most reliable anti-incumbency cycle.", hintHi: "140 सीटें; देश का सबसे भरोसेमंद सत्ता-विरोधी चक्र।", patterns: /(?<![A-Za-z\u0900-\u097F])(kerala|केरल)(?![A-Za-z\u0900-\u097F])/i },
  { key: "mp", name: "Madhya Pradesh", nameHi: "मध्य प्रदेश", seats: 230, hint: "230 seats; Bundelkhand, Malwa, Mahakoshal move on different currents.", hintHi: "230 सीटें; बुंदेलखंड, मालवा, महाकौशल की राजनीति अलग-अलग बहती है।", patterns: /(?<![A-Za-z\u0900-\u097F])(madhya\s?pradesh|मध्य\s?प्रदेश|म\.?प्र\.?)(?![A-Za-z\u0900-\u097F])/i },
  { key: "mh", name: "Maharashtra", nameHi: "महाराष्ट्र", seats: 288, hint: "288 seats; six-party fluidity since 2019 has reshaped every calculation.", hintHi: "288 सीटें; 2019 के बाद छह-दलीय प्रवाह ने हर गणना बदल दी है।", patterns: /(?<![A-Za-z\u0900-\u097F])(maharashtra|महाराष्ट्र)(?![A-Za-z\u0900-\u097F])/i },
  { key: "mn", name: "Manipur", nameHi: "मणिपुर", seats: 60, hint: "60 seats; Meitei-Kuki-Naga axis reshaped since the 2023 unrest.", hintHi: "60 सीटें; 2023 की अशांति के बाद मैतेई-कुकी-नागा धुरी पुनर्संयोजित।", patterns: /(?<![A-Za-z\u0900-\u097F])(manipur|मणिपुर)(?![A-Za-z\u0900-\u097F])/i },
  { key: "ml", name: "Meghalaya", nameHi: "मेघालय", seats: 60, hint: "60 seats; three tribal regions (Khasi, Jaintia, Garo) drive separate blocs.", hintHi: "60 सीटें; तीन जनजातीय क्षेत्र (खासी, जैंतिया, गारो) अलग-अलग गुट बनाते हैं।", patterns: /(?<![A-Za-z\u0900-\u097F])(meghalaya|मेघालय)(?![A-Za-z\u0900-\u097F])/i },
  { key: "mz", name: "Mizoram", nameHi: "मिज़ोरम", seats: 40, hint: "40 seats; MNF-Congress-ZPM three-cornered contest since 2023.", hintHi: "40 सीटें; 2023 के बाद MNF-कांग्रेस-ZPM त्रिकोणीय मुकाबला।", patterns: /(?<![A-Za-z\u0900-\u097F])(mizoram|मिज़ोरम|मिजोरम)(?![A-Za-z\u0900-\u097F])/i },
  { key: "nl", name: "Nagaland", nameHi: "नागालैंड", seats: 60, hint: "60 seats; opposition-less legislatures common, tribal factional politics dominant.", hintHi: "60 सीटें; विपक्ष-रहित विधानसभा सामान्य, जनजातीय गुटीय राजनीति प्रबल।", patterns: /(?<![A-Za-z\u0900-\u097F])(nagaland|नागालैंड|नागालेंड)(?![A-Za-z\u0900-\u097F])/i },
  { key: "or", name: "Odisha", nameHi: "ओडिशा", seats: 147, hint: "147 seats; 2024 broke a 24-year BJD monopoly.", hintHi: "147 सीटें; 2024 ने 24 वर्षों का BJD एकाधिकार तोड़ा।", patterns: /(?<![A-Za-z\u0900-\u097F])(odisha|ओडिशा|ओड़िशा|उड़ीसा)(?![A-Za-z\u0900-\u097F])/i },
  { key: "pb", name: "Punjab", nameHi: "पंजाब", seats: 117, hint: "117 seats; agrarian pulse, border sensitivities decisive.", hintHi: "117 सीटें; कृषि नब्ज़, सीमावर्ती संवेदनाएँ निर्णायक।", patterns: /(?<![A-Za-z\u0900-\u097F])(punjab|पंजाब)(?![A-Za-z\u0900-\u097F])/i },
  { key: "rj", name: "Rajasthan", nameHi: "राजस्थान", seats: 200, hint: "200 seats; the incumbency pendulum has held every cycle since 1993.", hintHi: "200 सीटें; 1993 से हर चुनाव में सत्ता विरोधी लहर कायम रही है।", patterns: /(?<![A-Za-z\u0900-\u097F])(rajasthan|राजस्थान)(?![A-Za-z\u0900-\u097F])/i },
  { key: "sk", name: "Sikkim", nameHi: "सिक्किम", seats: 32, hint: "32 seats; SKM-SDF bipolar, one of India's smallest electorates.", hintHi: "32 सीटें; SKM-SDF द्विध्रुवीय, देश के सबसे छोटे मतदाताओं में।", patterns: /(?<![A-Za-z\u0900-\u097F])(sikkim|सिक्किम)(?![A-Za-z\u0900-\u097F])/i },
  { key: "tn", name: "Tamil Nadu", nameHi: "तमिलनाडु", seats: 234, hint: "234 seats; Dravidian bipolarity, few third fronts survive intact.", hintHi: "234 सीटें; द्रविड़ द्विध्रुवीयता; तीसरा मोर्चा कम ही टिकता है।", patterns: /(?<![A-Za-z\u0900-\u097F])(tamil\s?nadu|तमिल\s?नाडु|तमिलनाडु)(?![A-Za-z\u0900-\u097F])/i },
  { key: "tg", name: "Telangana", nameHi: "तेलंगाना", seats: 119, hint: "119 seats; post-BRS reset, tight Hyderabad-mofussil split.", hintHi: "119 सीटें; BRS के बाद पुनर्संयोजन, हैदराबाद-मोफ़ुसिल में तंग विभाजन।", patterns: /(?<![A-Za-z\u0900-\u097F])(telangana|तेलंगाना)(?![A-Za-z\u0900-\u097F])/i },
  { key: "tr", name: "Tripura", nameHi: "त्रिपुरा", seats: 60, hint: "60 seats; 2018 ended a 25-year Left rule; tribal Autonomous Council layers on top.", hintHi: "60 सीटें; 2018 ने 25 वर्षों का वामपंथी शासन समाप्त किया; ऊपर से जनजातीय स्वायत्त परिषद।", patterns: /(?<![A-Za-z\u0900-\u097F])(tripura|त्रिपुरा)(?![A-Za-z\u0900-\u097F])/i },
  { key: "up", name: "Uttar Pradesh", nameHi: "उत्तर प्रदेश", seats: 403, hint: "403 seats; the country's most consequential assembly.", hintHi: "403 सीटें; देश की सबसे निर्णायक विधानसभा।", patterns: /(?<![A-Za-z\u0900-\u097F])(uttar\s?pradesh|उत्तर\s?प्रदेश|यूपी|उ\.?प्र\.?)(?![A-Za-z\u0900-\u097F])/i },
  { key: "uk", name: "Uttarakhand", nameHi: "उत्तराखंड", seats: 70, hint: "70 seats; hill-plain divide, high CM churn since statehood.", hintHi: "70 सीटें; पहाड़-मैदान विभाजन, राज्य बनने के बाद से CM परिवर्तन बहुत।", patterns: /(?<![A-Za-z\u0900-\u097F])(uttarakhand|उत्तराखंड|उत्तराखण्ड)(?![A-Za-z\u0900-\u097F])/i },
  { key: "wb", name: "West Bengal", nameHi: "पश्चिम बंगाल", seats: 294, hint: "294 seats; sharp booth-level polarisation.", hintHi: "294 सीटें; बूथ-स्तर पर तीव्र ध्रुवीकरण।", patterns: /(?<![A-Za-z\u0900-\u097F])(west\s?bengal|पश्चिम\s?बंगाल|बंगाल)(?![A-Za-z\u0900-\u097F])/i },
  { key: "an", name: "Andaman & Nicobar Islands", nameHi: "अंडमान और निकोबार", seats: 0, hint: "UT with 1 Lok Sabha seat; no legislative assembly.", hintHi: "1 लोकसभा सीट वाला केंद्रशासित प्रदेश; कोई विधानसभा नहीं।", patterns: /(?<![A-Za-z\u0900-\u097F])(andaman(\s?&|\s?and)?\s?nicobar|अंडमान|निकोबार)(?![A-Za-z\u0900-\u097F])/i },
  { key: "ch", name: "Chandigarh", nameHi: "चंडीगढ़", seats: 0, hint: "UT with 1 Lok Sabha seat; dual capital of Punjab and Haryana.", hintHi: "1 लोकसभा सीट वाला केंद्रशासित प्रदेश; पंजाब और हरियाणा की संयुक्त राजधानी।", patterns: /(?<![A-Za-z\u0900-\u097F])(chandigarh|चंडीगढ़)(?![A-Za-z\u0900-\u097F])/i },
  { key: "dh", name: "Dadra & Nagar Haveli and Daman & Diu", nameHi: "दादरा और नगर हवेली एवं दमन और दीव", seats: 0, hint: "Merged UT since 2020; 2 Lok Sabha seats; no assembly.", hintHi: "2020 से विलय; 2 लोकसभा सीटें; कोई विधानसभा नहीं।", patterns: /(?<![A-Za-z\u0900-\u097F])(dadra|nagar\s?haveli|daman|diu|दादरा|नगर\s?हवेली|दमन|दीव)(?![A-Za-z\u0900-\u097F])/i },
  { key: "dl", name: "Delhi", nameHi: "दिल्ली", seats: 70, hint: "70 seats; last three cycles have each broken a national trend.", hintHi: "70 सीटें; पिछले तीन चुनाव हर बार राष्ट्रीय प्रवृत्ति के विरुद्ध रहे हैं।", patterns: /(?<![A-Za-z\u0900-\u097F])(delhi|दिल्ली)(?![A-Za-z\u0900-\u097F])/i },
  { key: "jk", name: "Jammu & Kashmir", nameHi: "जम्मू और कश्मीर", seats: 90, hint: "90 seats after 2024 delimitation; Jammu-Valley arithmetic reset.", hintHi: "2024 के परिसीमन के बाद 90 सीटें; जम्मू-कश्मीर का गणित पुनर्निर्धारित।", patterns: /(?<![A-Za-z\u0900-\u097F])(jammu|kashmir|जम्मू|कश्मीर)(?![A-Za-z\u0900-\u097F])/i },
  { key: "la", name: "Ladakh", nameHi: "लद्दाख", seats: 0, hint: "UT with 1 Lok Sabha seat and 2 Autonomous Hill Councils (Leh, Kargil); no assembly.", hintHi: "1 लोकसभा सीट और 2 स्वायत्त पर्वतीय परिषदें (लेह, कारगिल); कोई विधानसभा नहीं।", patterns: /(?<![A-Za-z\u0900-\u097F])(ladakh|लद्दाख|लदाख)(?![A-Za-z\u0900-\u097F])/i },
  { key: "ld", name: "Lakshadweep", nameHi: "लक्षद्वीप", seats: 0, hint: "Smallest UT; 1 Lok Sabha seat; no assembly.", hintHi: "सबसे छोटा केंद्रशासित प्रदेश; 1 लोकसभा सीट; कोई विधानसभा नहीं।", patterns: /(?<![A-Za-z\u0900-\u097F])(lakshadweep|लक्षद्वीप)(?![A-Za-z\u0900-\u097F])/i },
  { key: "py", name: "Puducherry", nameHi: "पुडुचेरी", seats: 30, hint: "30 seats; four disjoint districts (Puducherry, Karaikal, Mahe, Yanam); NDA-led hold.", hintHi: "30 सीटें; चार अलग-अलग ज़िले (पुडुचेरी, कराईकल, माहे, यनम); NDA के नेतृत्व में।", patterns: /(?<![A-Za-z\u0900-\u097F])(puducherry|pondicherry|पुडुचेरी|पॉण्डिचेरी)(?![A-Za-z\u0900-\u097F])/i },
];

// Case-sensitive abbreviations people actually type. MP/AP/HP deliberately excluded (collide with roles/brands).
const STATE_ABBREV: Array<{ key: string; pat: RegExp }> = [
  { key: "up", pat: /(^|[^A-Za-z])U\.?P\.?(?![A-Za-z])/ },
  { key: "wb", pat: /(^|[^A-Za-z])W\.?B\.?(?![A-Za-z])/ },
  { key: "tn", pat: /(^|[^A-Za-z])T\.?N\.?(?![A-Za-z])/ },
  { key: "jk", pat: /\bJ\s?&\s?K\b/i },
];

function detectState(text: string): StateFact | null {
  for (const s of STATES) if (s.patterns.test(text)) return s;
  for (const a of STATE_ABBREV) if (a.pat.test(text)) return STATES.find((s) => s.key === a.key) ?? null;
  return null;
}

function buildLocalityAck(state: StateFact, constituencyMatch: string | null, hi: boolean): string {
  if (constituencyMatch) {
    return hi
      ? `${constituencyMatch}, ${state.nameHi} — ${state.hintHi} पूरी गोपनीयता में नोट किया।`
      : `${constituencyMatch}, ${state.name} — ${state.hint} Noted in confidence.`;
  }
  return hi ? `${state.nameHi} — ${state.hintHi} पूरी गोपनीयता में नोट किया।` : `${state.name} — ${state.hint} Noted in confidence.`;
}

/* ═══════════════════════════════════════════════════════════════════
   5. Soft constituency capture
   ═══════════════════════════════════════════════════════════════════ */

const CONSTITUENCY_KEYWORDS = /(constituency|seat|क्षेत्र|विधानसभा|लोकसभा|निर्वाचन)/i;

function softExtractConstituency(text: string): string | null {
  const fromMatch = text.match(/\b(?:from|of)\s+([A-Z][A-Za-z\u0900-\u097F.-]{2,30}(?:\s+[A-Z][A-Za-z\u0900-\u097F.-]{2,30})?)\b/);
  if (fromMatch) return fromMatch[1].trim();
  const hiFromMatch = text.match(/([\u0900-\u097F]{3,30}(?:\s+[\u0900-\u097F]{3,30})?)\s+से/);
  if (hiFromMatch) return hiFromMatch[1].trim();
  if (CONSTITUENCY_KEYWORDS.test(text)) {
    const nearby = text.match(/([A-Z][A-Za-z\u0900-\u097F.-]{2,30})\s+(?:constituency|seat|क्षेत्र|विधानसभा|लोकसभा)/i);
    if (nearby) return nearby[1].trim();
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════
   6. Spam scoring
   ═══════════════════════════════════════════════════════════════════ */

type SpamResult = { score: number; signals: string[] };

const SPAM_PATTERNS: Array<{ id: string; weight: number; pat: RegExp }> = [
  { id: "loan_or_finance", weight: 50, pat: /\b(loan|instant\s?loan|personal\s?loan|business\s?loan|कर्ज़|लोन|उधार|instant\s?cash)\b/i },
  { id: "crypto_trading", weight: 40, pat: /\b(bitcoin|crypto|trading|forex|invest\s?now|earn\s?crypto)\b/i },
  { id: "url_or_shortlink", weight: 40, pat: /\b(https?:\/\/|www\.|bit\.ly|tinyurl|t\.co\/|shorturl|wa\.me\/|goo\.gl\/)/i },
  { id: "promo_language", weight: 30, pat: /\b(\d{1,3}\s?%\s?off|discount|special\s?offer|limited\s?time|offer\s?expires|ऑफर|छूट|डिस्काउंट)\b/i },
  { id: "marketing_services", weight: 30, pat: /\b(seo|leads?|digital\s?marketing|call\s?cent(er|re)|bpo\s?services|voice\s?call\s?service|sms\s?service)\b/i },
  { id: "make_money", weight: 40, pat: /\b(work\s?from\s?home|earn\s?(from|money)|make\s?money|part\s?time\s?job|घर\s?बैठे\s?कमाई)\b/i },
  { id: "generic_opener", weight: 15, pat: /\b(dear\s?(sir|madam|customer|user|friend)|hello\s?dear|hi\s?dear)\b/i },
  { id: "gambling", weight: 45, pat: /\b(betting|casino|dream11\s?tips|matka|jackpot|lottery)\b/i },
];

function computeSpamScore(body: string, profileName: string | null, channel: Channel, contactState: string): SpamResult {
  const signals: string[] = [];
  let score = 0;

  for (const { id, weight, pat } of SPAM_PATTERNS) {
    if (pat.test(body)) {
      score += weight;
      signals.push(id);
    }
  }

  if (body.length > 800) {
    score += 10;
    signals.push("very_long_first_touch");
  }
  if (/(.)\1{4,}/.test(body)) {
    score += 25;
    signals.push("char_repetition");
  }
  const letters = body.replace(/[^A-Za-z\u0900-\u097F]/g, "").length;
  if (body.length >= 4 && letters === 0) {
    score += 40;
    signals.push("no_letters");
  }
  if (["ASKED_ROLE", "ASKED_DETAILS", "SCHEDULING", "ASKED_PHONE"].includes(contactState) && body.trim().length <= 2) {
    score += 25;
    signals.push("terse_reply_to_prompt");
  }

  if (profileName) {
    const pn = profileName.toLowerCase();
    if (/(spam|test|call\s?cent|marketing|leads|promo|offer|advertisement|SEO|BPO)/i.test(pn)) {
      score += 30;
      signals.push("profile_name_flag");
    }
    if (/^\d+$/.test(profileName.trim())) {
      score += 20;
      signals.push("profile_name_numeric");
    }
  }

  // Country-code check only meaningful on WhatsApp (we have real numbers there).
  if (channel === "whatsapp" && !/^\d{10,12}$/.test("")) {
    /* placeholder no-op; phone claim check happens in caller via msg fields */
  }

  if (score > 100) score = 100;
  return { score, signals };
}

/* ═══════════════════════════════════════════════════════════════════
   7. Slot + phone normalization
   ═══════════════════════════════════════════════════════════════════ */

function normalizeSlot(raw: string, hi: boolean): string {
  let s = raw.trim();
  if (s.length > 200) s = s.slice(0, 200);
  const hasClock = /\b\d{1,2}\s?[:.]?\s?\d{0,2}\s?(am|pm|बजे)/i.test(s) || /\b(morning|afternoon|evening|night|सुबह|दोपहर|शाम|रात)\b/i.test(s);
  const hasIST = /\bist\b/i.test(s);
  if (hasClock && !hasIST) s = hi ? `${s} (IST)` : `${s} IST`;
  return s;
}

/** Does this reply actually name a time/day? Long free text (a new query) must never be echoed back as a "slot". */
function looksLikeSlot(raw: string): boolean {
  const t = raw.trim();
  if (!t || t.length > 90) return false;
  if (/^[12]$/.test(t)) return true; // picked option 1 / 2
  const en = /\b(today|tomorrow|tonight|tmrw|tmr|morning|afternoon|evening|noon|midday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|next\s?week|this\s?week|any\s?time|anytime|asap|right\s?now|option\s?[12]|(first|second|1st|2nd)\s?(option|one|slot|window))\b/i;
  const dated = /\b\d{1,2}(st|nd|rd|th)?\s?(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s?\d{1,2}(st|nd|rd|th)?\b/i;
  const clock = /\b\d{1,2}\s?([:.]\s?\d{2})?\s?(am|pm|a\.m\.|p\.m\.|hrs|baje)\b|\b\d{1,2}[:.]\d{2}\b/i;
  const hi = /(आज|कल|परसों|सुबह|दोपहर|शाम|रात|बजे|सोमवार|मंगलवार|बुधवार|गुरुवार|शुक्रवार|शनिवार|रविवार|पहला|दूसरा|कभी भी)/;
  return en.test(t) || dated.test(t) || clock.test(t) || hi.test(t);
}

function extractIndianPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  const m = digits.match(/(?:\+?91)?(\d{10})$/);
  if (!m) return null;
  const ten = m[1];
  return /^[6-9]/.test(ten) ? "91" + ten : null; // Indian mobiles start 6-9; store as 91XXXXXXXXXX
}

function prettyPhone(p: string): string {
  if (p.length === 12 && p.startsWith("91")) return `+91 ${p.slice(2, 7)} ${p.slice(7)}`;
  return p;
}

/* ═══════════════════════════════════════════════════════════════════
   8. Postgres access (channel-aware)
   ═══════════════════════════════════════════════════════════════════ */

type Contact = {
  senderKey: string;
  channel: Channel;
  profile_name: string | null;
  role: Role | null;
  role_raw: string | null;
  state: "NEW" | "ASKED_ROLE" | "ASKED_DETAILS" | "SCHEDULING" | "ASKED_PHONE" | "HANDOFF";
  geography: string | null;
  window_note: string | null;
  slot: string | null;
  callback_number: string | null;
  spam_score: number;
  muted_until: Date | null;
  mute_reason: string | null;
  updated_at: Date | null;
};

type ConstituencyRow = { name: string; state_key: string; house: string };

type Db = {
  loadContact(senderKey: string): Promise<Contact | null>;
  createContact(senderKey: string, profileName: string | null, channel: Channel): Promise<Contact>;
  saveContact(c: Contact): Promise<void>;
  logMessage(senderKey: string, channel: Channel, dir: "in" | "out", kind: "text" | "media", body: string | null, mediaType: string | null, spamScore: number, spamSignals: string[]): Promise<void>;
  transcript(senderKey: string): Promise<Array<{ dir: string; kind: string; body: string | null; at: Date }>>;
  isBlocked(senderKey: string): Promise<{ blocked: boolean; reason: string | null }>;
  bumpRate(senderKey: string): Promise<number>;
  matchConstituency(text: string): Promise<ConstituencyRow | null>;
};

let _db: Db | null | undefined;

async function getDb(): Promise<Db | null> {
  if (_db !== undefined) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn("[intake] DATABASE_URL not set — STATELESS mode");
    _db = null;
    return null;
  }
  try {
    const pg = await import("pg");
    const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 3 });
    _db = {
      async loadContact(senderKey) {
        const r = await pool.query(
          `select phone as "senderKey", channel, profile_name, role, role_raw, state, geography, window_note, slot,
                  callback_number, coalesce(spam_score,0) as spam_score, muted_until, mute_reason, updated_at
             from wa_contacts where phone=$1`,
          [senderKey],
        );
        return r.rows[0] ?? null;
      },
      async createContact(senderKey, profileName, channel) {
        const r = await pool.query(
          `insert into wa_contacts (phone, profile_name, state, channel) values ($1,$2,'NEW',$3)
           on conflict (phone) do update set profile_name = coalesce($2, wa_contacts.profile_name)
           returning phone as "senderKey", channel, profile_name, role, role_raw, state, geography, window_note, slot,
                    callback_number, coalesce(spam_score,0) as spam_score, muted_until, mute_reason, updated_at`,
          [senderKey, profileName, channel],
        );
        return r.rows[0];
      },
      async saveContact(c) {
        await pool.query(
          `update wa_contacts set profile_name=$2, role=$3, role_raw=$4, state=$5, geography=$6, window_note=$7, slot=$8,
                  callback_number=$9, spam_score=$10, muted_until=$11, mute_reason=$12, updated_at=now() where phone=$1`,
          [c.senderKey, c.profile_name, c.role, c.role_raw, c.state, c.geography, c.window_note, c.slot, c.callback_number, c.spam_score, c.muted_until, c.mute_reason],
        );
      },
      async logMessage(senderKey, channel, dir, kind, body, mediaType, spamScore, spamSignals) {
        await pool.query(
          `insert into wa_messages (phone, channel, direction, kind, body, media_id, spam_score, spam_signals) values ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [senderKey, channel, dir, kind, body, mediaType, spamScore, spamSignals],
        );
      },
      async transcript(senderKey) {
        const r = await pool.query(`select direction as dir, kind, body, created_at as at from wa_messages where phone=$1 order by created_at asc`, [senderKey]);
        return r.rows;
      },
      async isBlocked(senderKey) {
        const r = await pool.query(
          `select reason from wa_blocklist
             where phone = $1 or (pattern is not null and $1 ~ pattern)
             limit 1`,
          [senderKey],
        );
        return r.rows[0] ? { blocked: true, reason: r.rows[0].reason } : { blocked: false, reason: null };
      },
      async bumpRate(senderKey) {
        const r = await pool.query(
          `insert into wa_ratelimit (phone, hour_bucket, count) values ($1, date_trunc('hour', now()), 1)
             on conflict (phone, hour_bucket) do update set count = wa_ratelimit.count + 1
             returning count`,
          [senderKey],
        );
        return r.rows[0].count as number;
      },
      async matchConstituency(text) {
        try {
          const words = Array.from(new Set((text.match(/[A-Za-z\u0900-\u097F]{3,30}/g) || []).map((w) => w.toLowerCase())));
          if (words.length === 0) return null;
          const r = await pool.query(
            `select name, state_key, house from wa_constituencies
               where lower(name) = any($1::text[])
                  or exists (select 1 from unnest(aliases) as a where lower(a) = any($1::text[]))
               limit 1`,
            [words],
          );
          return r.rows[0] ?? null;
        } catch {
          return null;
        }
      },
    };
    console.log("[intake] Postgres connected");
    return _db;
  } catch (err) {
    console.error("[intake] DB init failed — STATELESS", err);
    _db = null;
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   9. Outbound senders — one per channel
   ═══════════════════════════════════════════════════════════════════ */

async function sendWhatsAppText(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_BUSINESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return console.warn("[intake] whatsapp send skipped — missing credentials");
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { preview_url: false, body } }),
    });
    if (!res.ok) console.error("[intake] whatsapp send failed", res.status, (await res.text()).slice(0, 500));
    else console.log("[intake] whatsapp reply sent to", to);
  } catch (err) {
    console.error("[intake] whatsapp send error", err);
  }
}

async function sendMetaDM(channel: "messenger" | "instagram", toId: string, body: string): Promise<void> {
  const token = process.env.MESSENGER_PAGE_TOKEN;
  const pageId = process.env.MESSENGER_PAGE_ID;
  if (!token || !pageId) return console.warn("[intake] meta dm send skipped — missing MESSENGER_PAGE_TOKEN/PAGE_ID");
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: channel, recipient: { id: toId }, message: { text: body } }),
    });
    if (!res.ok) console.error(`[intake] ${channel} send failed`, res.status, (await res.text()).slice(0, 500));
    else console.log(`[intake] ${channel} reply sent to`, toId);
  } catch (err) {
    console.error(`[intake] ${channel} send error`, err);
  }
}

/* OAuth 1.0a (HMAC-SHA256) — X DM send, no external dependency */
function pct(s: string): string {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function sendXDM(toUserId: string, body: string): Promise<void> {
  const key = process.env.X_API_KEY;
  const secret = process.env.X_API_SECRET;
  const token = process.env.X_ACCESS_TOKEN;
  const tokenSecret = process.env.X_ACCESS_SECRET;
  if (!key || !secret || !token || !tokenSecret) return console.warn("[intake] x send skipped — missing X_* credentials");
  try {
    const oauthParams: Record<string, string> = {
      oauth_consumer_key: key,
      oauth_nonce: randomBytes(16).toString("hex"),
      oauth_signature_method: "HMAC-SHA256",
      oauth_timestamp: String(Math.floor(Date.now() / 1000)),
      oauth_token: token,
      oauth_version: "1.0",
    };
    const paramPairs = Object.keys(oauthParams)
      .sort()
      .map((k) => `${pct(k)}=${pct(oauthParams[k])}`)
      .join("&");
    const baseURL = `https://api.x.com/2/dm_conversations/with/${encodeURIComponent(toUserId)}/dm_events`;
    const baseString = `POST&${pct(baseURL)}&${pct(paramPairs)}`;
    const signingKey = `${pct(secret)}&${pct(tokenSecret)}`;
    const signature = createHmac("sha256", signingKey).update(baseString).digest("base64");
    const header = `OAuth ${Object.keys({ ...oauthParams, oauth_signature: signature })
      .sort()
      .map((k) => `${pct(k)}="${pct((({ ...oauthParams, oauth_signature: signature }) as Record<string, string>)[k])}"`)
      .join(", ")}`;
    const res = await fetch(baseURL, {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "application/json" },
      body: JSON.stringify({ text: body.slice(0, 9000) }),
    });
    if (!res.ok) console.error("[intake] x send failed", res.status, (await res.text()).slice(0, 500));
    else console.log("[intake] x reply sent to", toUserId);
  } catch (err) {
    console.error("[intake] x send error", err);
  }
}

async function sendViaChannel(channel: Channel, senderKey: string, body: string): Promise<void> {
  if (channel === "whatsapp") return sendWhatsAppText(senderKey, body);
  if (channel === "x") return sendXDM(senderKey, body);
  return sendMetaDM(channel, senderKey, body);
}

/* ═══════════════════════════════════════════════════════════════════
   10. Email
   ═══════════════════════════════════════════════════════════════════ */

const CHANNEL_LABEL: Record<Channel, string> = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram", x: "X" };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function fmtTs(unix?: string | null): string {
  const n = Number(unix || 0) * 1000;
  return n ? new Date(n).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
}

async function emailTeam(channel: Channel, opts: {
  subject: string;
  displayName: string;
  rows: Array<[string, string]>;
  transcript?: Array<{ dir: string; kind: string; body: string | null; at: Date }>;
  note?: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.INTAKE_TO_EMAIL || "poll@barncops.in";
  const fromEmail = process.env.FROM_EMAIL || "Barnstorm Co-operations <poll@barncops.in>";
  if (!key) return console.warn("[intake] email skipped");
  const rowsHtml = opts.rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#5A5E66;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;vertical-align:top">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  const transcriptHtml = opts.transcript?.length
    ? `<div style="border-top:1px solid #D8D2C4;margin:24px 0;padding-top:24px"><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#2C4A6E;margin-bottom:8px">Transcript</div>${opts.transcript
        .map(
          (m) =>
            `<div style="margin-bottom:10px"><span style="font-family:monospace;font-size:11px;color:#8A6D3B">${m.dir === "in" ? "◀ inbound" : "▶ outbound"}</span> <span style="font-family:monospace;font-size:11px;color:#9AA0A8">${new Date(m.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span><div style="white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(m.body ?? `[${m.kind}]`)}</div></div>`,
        )
        .join("")}</div>`
    : "";
  const noteHtml = opts.note ? `<div style="background:#F6F2E9;border-left:3px solid #8A6D3B;padding:12px 16px;font-size:14px;line-height:1.6">${escapeHtml(opts.note)}</div>` : "";
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#1B1E24"><div style="font-family:'Spectral',Georgia,serif;font-weight:600;font-size:14px;letter-spacing:.02em">Barnstorm <span style="color:#8A6D3B">Co-operations</span></div><div style="height:2px;background:#8A6D3B;width:56px;margin:12px 0 24px"></div><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8A6D3B">${escapeHtml(CHANNEL_LABEL[channel])}</div><div style="font-family:'Spectral',Georgia,serif;font-size:22px;font-weight:500;margin:4px 0 24px">${escapeHtml(opts.displayName)}</div>${noteHtml}<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6;margin-top:16px">${rowsHtml}</table>${transcriptHtml}<div style="font-size:12px;color:#5A5E66;margin-top:32px">Reply from the ${escapeHtml(CHANNEL_LABEL[channel])} inbox — messages reach the contact on the same channel.<br>Advisory · mandata.ai</div></div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromEmail, to: [to], subject: opts.subject, html }),
    });
    if (!res.ok) console.error("[intake] email failed", res.status, (await res.text()).slice(0, 500));
    else console.log("[intake] emailed:", opts.subject);
  } catch (err) {
    console.error("[intake] email error", err);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   11. Main handler — one state machine, every channel
   ═══════════════════════════════════════════════════════════════════ */

const AUTOMUTE_SCORE = 70;
const SUSPECT_SCORE = 40;
const RATE_LIMIT_PER_HOUR = 20;
const STALE_MID_MS = 24 * 3600 * 1000;
const STALE_HANDOFF_MS = 30 * 24 * 3600 * 1000;
const SLOT_REASK = "__REASK__";

export async function handleInbound(msg: InboundMsg): Promise<void> {
  const { channel, senderKey } = msg;
  const isWa = channel === "whatsapp";
  const isText = msg.kind === "text" && !!msg.text;
  const body = isText ? msg.text! : "";
  const kind: "text" | "media" = isText ? "text" : "media";
  const name = msg.profileName || "";
  const hi = isText && isHindi(body);
  const c_copy = hi ? COPY.hi : COPY.en;
  const displayId = isWa ? `+${senderKey}` : `${CHANNEL_LABEL[channel]} · ${senderKey}`;

  const db = await getDb();

  /* Stateless fallback */
  if (!db) {
    if (isText) await sendViaChannel(channel, senderKey, c_copy.intro);
    await emailTeam(channel, {
      subject: `${CHANNEL_LABEL[channel]} inbound · ${name || senderKey}`,
      displayName: name || displayId,
      rows: [["From", displayId], ["Profile", name || "—"], ["Kind", kind], ["Received", fmtTs(msg.timestamp)]],
      note: isText ? body : undefined,
    });
    return;
  }

  /* Blocklist — silent-drop */
  const bl = await db.isBlocked(senderKey);
  if (bl.blocked) {
    console.log("[intake] blocked", { channel, senderKey, reason: bl.reason });
    return;
  }

  /* Load or create contact */
  let c = await db.loadContact(senderKey);
  if (!c) c = await db.createContact(senderKey, name || null, channel);
  if (name && c.profile_name !== name) c.profile_name = name;

  /* Stale conversation → start fresh. A half-finished intake idle >24h, or a handoff
     idle >30 days, means the next message is a NEW conversation — never an answer
     to a question asked days ago. */
  const idleMs = c.updated_at ? Date.now() - new Date(c.updated_at).getTime() : 0;
  const staleMid = c.state !== "NEW" && c.state !== "HANDOFF" && idleMs > STALE_MID_MS;
  const staleDone = c.state === "HANDOFF" && idleMs > STALE_HANDOFF_MS;
  if (staleMid || staleDone) {
    console.log("[intake] stale conversation reset", { channel, senderKey, from: c.state, idleHours: Math.round(idleMs / 3.6e6) });
    c.state = "NEW";
    c.role = null;
    c.role_raw = null;
    c.geography = null;
    c.window_note = null;
    c.slot = null;
  }

  /* Existing mute — silent, but still log */
  if (c.muted_until && c.muted_until > new Date()) {
    await db.logMessage(senderKey, channel, "in", kind, isText ? body : null, msg.mediaType ?? null, 0, ["muted_silent"]);
    console.log("[intake] muted contact — silent log", { channel, senderKey, until: c.muted_until });
    return;
  } else if (c.muted_until) {
    c.muted_until = null;
    c.mute_reason = null;
  }

  /* Rate limit */
  const hourCount = await db.bumpRate(senderKey);
  if (hourCount > RATE_LIMIT_PER_HOUR) {
    c.muted_until = new Date(Date.now() + 24 * 3600 * 1000);
    c.mute_reason = `rate_limit_${hourCount}_per_hour`;
    await db.saveContact(c);
    await db.logMessage(senderKey, channel, "in", kind, isText ? body : null, msg.mediaType ?? null, 100, ["rate_limit_exceeded"]);
    await emailTeam(channel, {
      subject: `🚫 AUTOSPAM (rate) · ${name || senderKey}`,
      displayName: name || displayId,
      rows: [["From", displayId], ["Reason", `${hourCount} messages this hour`], ["Muted until", c.muted_until.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })]],
      note: "Rate limit exceeded — bot muted for 24 hours. Add to wa_blocklist if repeat offender.",
    });
    return;
  }

  /* Spam score */
  const spam: SpamResult = isText ? computeSpamScore(body, c.profile_name, channel, c.state) : { score: 0, signals: [] };
  c.spam_score = Math.max(c.spam_score, spam.score);
  await db.logMessage(senderKey, channel, "in", kind, isText ? body : null, msg.mediaType ?? null, spam.score, spam.signals);

  /* Auto-mute */
  if (spam.score >= AUTOMUTE_SCORE) {
    c.muted_until = new Date(Date.now() + 24 * 3600 * 1000);
    c.mute_reason = `autospam_${spam.signals.join("_")}`.slice(0, 200);
    await db.saveContact(c);
    await emailTeam(channel, {
      subject: `🚫 AUTOSPAM · ${name || senderKey}`,
      displayName: name || displayId,
      rows: [
        ["From", displayId],
        ["Profile", name || "—"],
        ["Spam score", `${spam.score}/100`],
        ["Signals", spam.signals.join(", ")],
        ["Muted until", c.muted_until.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })],
      ],
      note: `AUTO-MUTED. Bot did not reply. Body: "${body.slice(0, 300)}"`,
    });
    return;
  }

  const susTag = spam.score >= SUSPECT_SCORE ? ` ⚠ SUSPECTED(${spam.score})` : "";
  const rowsBase: Array<[string, string]> = [
    ["From", displayId],
    ["Profile", name || "—"],
    ["Stage", c.state],
  ];
  if (spam.score >= SUSPECT_SCORE) rowsBase.push(["Spam score", `${spam.score}/100 — ${spam.signals.join(", ")}`]);

  let reply: string | null = null;

  /* Media */
  if (!isText) {
    await emailTeam(channel, {
      subject: `${CHANNEL_LABEL[channel]} media · ${name || senderKey}${susTag}`,
      displayName: name || displayId,
      rows: [...rowsBase, ["Kind", msg.mediaType || kind], ["Received", fmtTs(msg.timestamp)]],
      note: `Media message — view the original in the ${CHANNEL_LABEL[channel]} inbox.`,
    });
    if (c.state === "NEW") {
      reply = c_copy.intro;
      c.state = "ASKED_ROLE";
      await sendViaChannel(channel, senderKey, reply);
      await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
      await db.saveContact(c);
    }
    return;
  }

  switch (c.state) {
    case "NEW": {
      reply = c_copy.intro;
      c.state = "ASKED_ROLE";
      await sendViaChannel(channel, senderKey, reply);
      await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
      await db.saveContact(c);
      await emailTeam(channel, {
        subject: `${CHANNEL_LABEL[channel]} new lead · ${name || senderKey}${susTag}`,
        displayName: name || displayId,
        rows: [...rowsBase, ["First message", body.slice(0, 300)], ["Language", hi ? "Hindi" : "English"], ["Received", fmtTs(msg.timestamp)]],
        note: "Intro sent — asked capacity.",
      });
      break;
    }

    case "ASKED_ROLE": {
      c.role = classifyRole(body);
      c.role_raw = body.slice(0, 300);
      const state = detectState(body);
      const softCons = softExtractConstituency(body);
      const dbCons = await db.matchConstituency(body);
      const consForAck = dbCons?.name || softCons;

      if (state && isPrincipal(c.role)) {
        c.geography = body.slice(0, 500);
        c.state = "ASKED_DETAILS";
        const ack = buildLocalityAck(state, consForAck, hi);
        reply = c_copy.windowOnlyPrompt(ack);
      } else if (isPrincipal(c.role)) {
        reply = c_copy.detailsPrincipal;
        c.state = "ASKED_DETAILS";
      } else {
        reply = c_copy.detailsOther;
        c.state = "ASKED_DETAILS";
      }
      await sendViaChannel(channel, senderKey, reply);
      await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
      await db.saveContact(c);
      console.log("[intake] classified", { channel, senderKey, role: c.role, state: state?.key, cons: consForAck, hi, spam: spam.score });
      break;
    }

    case "ASKED_DETAILS": {
      if (c.geography) c.window_note = body.slice(0, 500);
      else c.geography = body.slice(0, 500);
      c.state = "SCHEDULING";
      reply = c_copy.schedulingBase;
      await sendViaChannel(channel, senderKey, reply);
      await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
      await db.saveContact(c);
      break;
    }

    case "SCHEDULING": {
      const phone = extractIndianPhone(body);
      if (phone) c.callback_number = phone;
      let slot: string | null;
      if (looksLikeSlot(body)) {
        slot = normalizeSlot(body, hi);
      } else if (c.slot !== SLOT_REASK) {
        // Free text, not a time — keep it as a note for the team, ask for the window once.
        c.window_note = [c.window_note, `Note: ${body.slice(0, 400)}`].filter(Boolean).join(" | ");
        c.slot = SLOT_REASK;
        reply = c_copy.slotReask;
        await sendViaChannel(channel, senderKey, reply);
        await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
        await db.saveContact(c);
        break;
      } else {
        // Second non-time reply — don't loop; the team agrees the time on the call.
        c.window_note = [c.window_note, `Note: ${body.slice(0, 400)}`].filter(Boolean).join(" | ");
        slot = null;
      }
      c.slot = slot;

      if (!isWa && !c.callback_number) {
        // On Messenger/IG/X we don't have their phone — one extra turn to get it.
        c.state = "ASKED_PHONE";
        reply = c_copy.askPhone;
      } else {
        c.state = "HANDOFF";
        reply = c_copy.confirm(slot ?? "", c.callback_number, isWa);
        await sendViaChannel(channel, senderKey, reply);
        await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
        await db.saveContact(c);
        await handoffEmail(db, c, channel, senderKey, name, displayId, hi, spam.score, susTag, isText);
        break;
      }
      await sendViaChannel(channel, senderKey, reply);
      await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
      await db.saveContact(c);
      break;
    }

    case "ASKED_PHONE": {
      const phone = extractIndianPhone(body);
      if (phone) {
        c.callback_number = phone;
        c.state = "HANDOFF";
        reply = c_copy.confirm(c.slot || "", phone, isWa);
        await sendViaChannel(channel, senderKey, reply);
        await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
        await db.saveContact(c);
        await handoffEmail(db, c, channel, senderKey, name, displayId, hi, spam.score, susTag, isText);
      } else {
        // They didn't give a number — fall back to platform reply, still hand off.
        c.state = "HANDOFF";
        reply = c_copy.confirm(c.slot || "", null, isWa);
        await sendViaChannel(channel, senderKey, reply);
        await db.logMessage(senderKey, channel, "out", "text", reply, null, 0, []);
        await db.saveContact(c);
        await handoffEmail(db, c, channel, senderKey, name, displayId, hi, spam.score, susTag, isText, body.slice(0, 300));
      }
      break;
    }

    case "HANDOFF": {
      const transcript = await db.transcript(senderKey);
      const role = c.role ?? "other";
      await emailTeam(channel, {
        subject: `${CHANNEL_LABEL[channel]} follow-up · ${ROLE_LABEL[role]} · ${name || senderKey}${susTag}`,
        displayName: name || displayId,
        rows: [...rowsBase, ["Received", fmtTs(msg.timestamp)]],
        transcript: transcript.slice(-6),
        note: `Conversation already handed off — reply from the ${CHANNEL_LABEL[channel]} inbox.`,
      });
      break;
    }
  }
}

async function handoffEmail(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  c: Contact,
  channel: Channel,
  senderKey: string,
  name: string,
  displayId: string,
  hi: boolean,
  spamScore: number,
  susTag: string,
  isText: boolean,
  fallbackNumberNote?: string,
): Promise<void> {
  const transcript = await db.transcript(senderKey);
  const role = c.role ?? "other";
  const stateFact = detectState(c.geography || "");
  const dbCons = await db.matchConstituency(c.geography || "");
  const softCons = softExtractConstituency(c.geography || "");
  const geoLine = stateFact ? `${dbCons?.name || softCons ? `${dbCons?.name || softCons}, ` : ""}${stateFact.name} — ${c.geography ?? "—"}` : c.geography ?? "—";

  await emailTeam(channel, {
    subject: `🔴 CALL REQUEST · ${ROLE_LABEL[role]} · ${name || senderKey} (${CHANNEL_LABEL[channel]})${susTag}`,
    displayName: name || displayId,
    rows: [
      ["Channel", CHANNEL_LABEL[channel]],
      ["Role", `${ROLE_LABEL[role]} ${hi ? `(${ROLE_LABEL_HI[role]})` : ""}`.trim()],
      ["Said", c.role_raw || "—"],
      ["Geography / mandate", geoLine],
      ["State", stateFact ? stateFact.name : "—"],
      ["State context", stateFact ? stateFact.hint : "—"],
      ["Constituency (DB match)", dbCons?.name || "—"],
      ["Constituency (soft)", softCons || "—"],
      ["Window", c.window_note || "—"],
      ["Requested slot", c.slot && c.slot !== SLOT_REASK ? c.slot : "Not given — agree on the call"],
      ["Callback number", c.callback_number ? prettyPhone(c.callback_number) : channel === "whatsapp" ? `${prettyPhone(senderKey)} (this WhatsApp number)` : fallbackNumberNote ? `— (said: "${fallbackNumberNote}") — reach via ${CHANNEL_LABEL[channel]} DM` : `— reach via ${CHANNEL_LABEL[channel]} DM`],
      ["Language", hi ? "Hindi" : "English"],
      ["Spam score (max)", `${spamScore}/100`],
      ["Thread", "HANDOFF — bot silent, team calls"],
    ],
    transcript,
    note: isPrincipal(role) ? "PRINCIPAL — prioritise this call." : "General inquiry — route as appropriate.",
  });
}
