export const GOVERNANCE = {
  en: {
    kicker: "Operating controls",
    title: "Governance, access, and accountability",
    lede: "mandata.ai holds political and constituency data that can damage a principal if it leaks, drifts, or is used without authority. Barnstorm Co-operations treats access as an operating problem: who may see, who may send, who may close a case, and what the log will show on Monday. This is office-level discipline, not a legal appendix.",
    items: [
      {
        title: "Role-based access",
        body: "Principal, chief of staff, booth in-charge, grievance desk — named roles, not a shared password. Sensitive races are compartmented. A constituency management platform that anyone can open is not a platform.",
      },
      {
        title: "Permissioned outreach",
        body: "Citizen connect is not a blast list. Send rights are granted, scoped to a universe, and revocable. Unpermissioned outreach does not leave the console.",
      },
      {
        title: "Activity history",
        body: "Case notes, assignments, outreach, and fund-status changes write an audit trail. Accountability is a log a chief of staff can read, not a meeting that never happened.",
      },
      {
        title: "Human oversight",
        body: "Assistance may rank, route, and draft briefings. It does not publish, sanction, or close a case without a named operator. Models are staff, not oracles.",
      },
      {
        title: "Workflow governance",
        body: "Jan-Sunwai SLAs, presence calendar, and MPLADS / MLACDS status are visible to the roles that own them. Neglect is expensive because it is visible.",
      },
      {
        title: "Office-level discipline",
        body: "Constituency operations run as a controlled environment: who is in the file, who touched it, and whether the booth sheet still matches the graph.",
      },
      {
        title: "Operational discretion",
        body: "Live races and sensitive cases stay inside the room that owns them. Barnstorm Co-operations will not sit both sides of a contest. Platform licenses in a contested constituency are disclosed before contract.",
      },
    ],
  },
  hi: {
    kicker: "ऑपरेटिंग नियंत्रण",
    title: "शासन, पहुँच, और जवाबदेही",
    lede: "mandata.ai राजनीतिक और क्षेत्रीय डेटा रखता है। बार्नस्टॉर्म को-ऑपरेशन्स पहुँच को ऑपरेटिंग समस्या मानता है: कौन देखे, कौन भेजे, कौन केस बंद करे, सोमवार को लॉग क्या दिखाए। यह कार्यालय अनुशासन है, कानूनी परिशिष्ट नहीं।",
    items: [
      {
        title: "भूमिका-आधारित पहुँच",
        body: "प्रिंसिपल, चीफ़ ऑफ़ स्टाफ़, बूथ प्रभारी, शिकायत डेस्क — नामित भूमिकाएँ, साझा पासवर्ड नहीं। संवेदनशील दौड़ अलग रखी जाती हैं।",
      },
      {
        title: "अनुमति-युक्त आउटरीच",
        body: "नागरिक संपर्क ब्लास्ट लिस्ट नहीं। भेजने का अधिकार दिया, सीमित, और निरस्त किया जाता है। बिना अनुमति आउटरीच कंसोल से बाहर नहीं जाता।",
      },
      {
        title: "गतिविधि इतिहास",
        body: "केस नोट, असाइनमेंट, आउटरीच, निधि-स्थिति — ऑडिट ट्रेल। जवाबदेही एक लॉग है, मीटिंग नहीं।",
      },
      {
        title: "मानव निगरानी",
        body: "सहायता रैंक, रूट, ड्राफ्ट कर सकती है। बिना नामित ऑपरेटर के केस बंद नहीं होता। मॉडल स्टाफ़ हैं, देववाणी नहीं।",
      },
      {
        title: "वर्कफ़्लो शासन",
        body: "जन-सुनवाई SLA, उपस्थिति कैलेंडर, MPLADS / MLACDS — स्वामी भूमिकाओं को दिखते हैं। उपेक्षा इसलिए महंगी है क्योंकि वह दिखती है।",
      },
      {
        title: "कार्यालय अनुशासन",
        body: "नियंत्रित वातावरण: फ़ाइल में कौन, किसने छुआ, बूथ शीट ग्राफ़ से मिलती है या नहीं।",
      },
      {
        title: "ऑपरेशनल विवेक",
        body: "जीवित दौड़ उसी कमरे में रहती है जिसका वह है। हम एक चुनाव के दोनों पक्ष नहीं बैठते। विवादित क्षेत्र में प्लेटफ़ॉर्म लाइसेंस अनुबंध से पहले बताए जाते हैं।",
      },
    ],
  },
} as const;

export const WORKFLOWS = {
  en: [
    {
      title: "Grievance intake and routing",
      body: "Jan-Sunwai lands on a household, then a booth, then a named desk. SLA is a clock. The grievance redressal system makes delay visible before it becomes a political fact.",
    },
    {
      title: "Constituency visibility",
      body: "Which booths moved, which cases breached, which works are stuck — one operating picture for the principal, not five vendor dashboards.",
    },
    {
      title: "Outreach planning",
      body: "Citizen connect against the graph, permissioned by role. Presence and scheme camps as planned work, not blasts from a shared phone.",
    },
    {
      title: "Field write-back",
      body: "Contacts, IDs, and notes write the same night. A briefing that cannot be contradicted by a booth agent is folklore.",
    },
    {
      title: "Fund-tracking visibility",
      body: "MPLADS tracking and MLACDS tracking: sanctioned, stalled, visible on the ground — against ward and work, not a spreadsheet in a drawer.",
    },
    {
      title: "Campaign-to-governance continuity",
      body: "The race file is the office file. Counting day is a handoff. The household in the campaign is the household in the inbox.",
    },
  ],
  hi: [
    {
      title: "शिकायत इनटेक और रूटिंग",
      body: "जन-सुनवाई घर पर, फिर बूथ पर, फिर नामित डेस्क पर। SLA एक घड़ी है। विलंब दिखता है, राजनीतिक तथ्य बनने से पहले।",
    },
    {
      title: "क्षेत्रीय दृश्यता",
      body: "कौन से बूथ हिले, कौन से केस टूटे, कौन से कार्य अटके — प्रिंसिपल के लिए एक चित्र, पाँच वेंडर डैशबोर्ड नहीं।",
    },
    {
      title: "आउटरीच योजना",
      body: "ग्राफ़ के विरुद्ध अनुमति-युक्त नागरिक संपर्क। साझा फ़ोन से ब्लास्ट नहीं।",
    },
    {
      title: "फ़ील्ड राइट-बैक",
      body: "संपर्क, ID, नोट उसी रात लिखे जाते हैं। जिसे बूथ एजेंट काट न सके, वह लोककथा है।",
    },
    {
      title: "निधि-ट्रैकिंग दृश्यता",
      body: "MPLADS / MLACDS: स्वीकृत, अटका, ज़मीन पर दिखता — दराज की शीट नहीं।",
    },
    {
      title: "अभियान-से-शासन निरंतरता",
      body: "दौड़ की फ़ाइल कार्यालय की फ़ाइल है। गिनती हैंडऑफ़ है। अभियान वाला घर इनबॉक्स वाला घर है।",
    },
  ],
} as const;
