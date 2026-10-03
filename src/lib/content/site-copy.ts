export const SERVE = {
  en: {
    kicker: "Who we sit with",
    title: "Who Barnstorm Co-operations serves",
    lede: "A political consulting firm in India for principals who treat the race — and the office after it — as one operating problem.",
    items: [
      {
        title: "Candidates in active campaign windows",
        body: "Election campaign management when the clock is real: win number, booth file, narrative strategy, political war-room. Not a slogan workshop.",
      },
      {
        title: "Sitting MPs and MLAs",
        body: "Constituency operations after the oath — Jan-Sunwai workflow management, citizen feedback, MPLADS / MLACDS tracking, booth intelligence that does not reset on counting day.",
      },
      {
        title: "Party units and central operations",
        body: "A common constituency graph, named access, and a war-room seat where the race is live. Political operations for India, not a vendor stack.",
      },
      {
        title: "Constituency offices",
        body: "Office discipline: grievance redressal, presence against the map, fund-tracking visibility, a file the desk can close against.",
      },
      {
        title: "Serious principals on high-stakes mandates",
        body: "Embedded command for institutional political operators and, where the brief is real, investors in civic infrastructure.",
      },
    ],
  },
  hi: {
    kicker: "हम किसके साथ बैठते हैं",
    title: "बार्नस्टॉर्म को-ऑपरेशन्स किसके लिए है",
    lede: "भारत की एक राजनीतिक परामर्श संस्था — उन प्रिंसिपलों के लिए जो चुनाव और उसके बाद के कार्यालय को एक ही ऑपरेटिंग समस्या मानते हैं।",
    items: [
      {
        title: "सक्रिय अभियान खिड़की में उम्मीदवार",
        body: "जब घड़ी असली हो: विजय संख्या, बूथ फ़ाइल, कथा रणनीति, राजनीतिक वॉर-रूम। नारा कार्यशाला नहीं।",
      },
      {
        title: "बैठे सांसद और विधायक",
        body: "शपथ के बाद क्षेत्रीय संचालन — जन-सुनवाई वर्कफ़्लो, नागरिक प्रतिक्रिया, MPLADS / MLACDS ट्रैकिंग, बूथ इंटेलिजेंस जो गिनती के दिन रीसेट न हो।",
      },
      {
        title: "पार्टी इकाइयाँ और केंद्रीय संचालन",
        body: "साझा क्षेत्रीय ग्राफ़, नामित पहुँच, और जहाँ दौड़ जीवित है वहाँ एक वॉर-रूम सीट।",
      },
      {
        title: "क्षेत्रीय कार्यालय",
        body: "शिकायत निवारण, मानचित्र के विरुद्ध उपस्थिति, निधि-ट्रैकिंग दृश्यता, एक फ़ाइल जिसके विरुद्ध डेस्क केस बंद कर सके।",
      },
      {
        title: "उच्च-दांव वाले गंभीर प्रिंसिपल",
        body: "संस्थागत राजनीतिक ऑपरेटरों के लिए एम्बेडेड कमांड, और जहाँ ब्रीफ असली हो, नागरिक अवसंरचना के निवेशकों के लिए।",
      },
    ],
  },
} as const;

export const OFFER = {
  en: {
    kicker: "How the work is bought",
    title: "Advisory, mandata.ai, or both",
    lede: "Barnstorm Co-operations is one political consulting firm with two engines. Buy the seat, license the constituency management platform, or sit both — the graph is the same either way.",
    forLabel: "Who it is for",
    incLabel: "What it includes",
    whenLabel: "When to choose it",
    items: [
      {
        kicker: "01",
        kind: "Consulting seat",
        title: "Barnstorm Advisory",
        sig: "Election campaign consulting. A named chair in the war-room.",
        for: "Candidates in a live or coming cycle, sitting MPs and MLAs rebuilding a file, and party caucuses that need political war-room management without a forty-person circus.",
        inc: "Political strategy consulting: narrative, booth design, digital perception, ground war-room. One-page decision memos for principals. Field scripts a booth agent can execute.",
        when: "Choose advisory when the theory of the race does not yet exist, when booth-level intelligence is still folklore, or when the last 30–180 days need a named command.",
        cta: "See advisory",
        to: "/advisory" as const,
      },
      {
        kicker: "02",
        kind: "Constituency platform",
        title: "mandata.ai",
        sig: "Data-driven constituency governance and citizen feedback analysis.",
        for: "Sitting MPs and MLAs, constituency offices, campaign command structures, and party operations teams that already have a bench.",
        inc: "Constituency management platform: household and booth graph, Jan-Sunwai workflow management, citizen connect, MPLADS / MLACDS tracking, booth intelligence, nightly briefing — under role-based access.",
        when: "Choose the platform when the need is infrastructure: MP and MLA constituency management that persists after counting day, not another visiting consultant.",
        cta: "See mandata.ai",
        to: "/platform" as const,
      },
      {
        kicker: "03",
        kind: "Seat + graph",
        title: "Combined engagement",
        sig: "The room and the operating system. Campaign-to-governance as one brief.",
        for: "First-time principals, rebuilds, races inside ninety days, and offices that cannot afford a reset on counting day.",
        inc: "Advisory command plus mandata.ai — one theory of the race, one write-back, election campaign management that still has to govern on Monday.",
        when: "Choose combined when you need both the seat and the graph, not a consultant and a separate vendor.",
        cta: "Discuss a mandate",
        to: "/contact" as const,
      },
    ],
  },
  hi: {
    kicker: "कार्य कैसे खरीदा जाता है",
    title: "सलाह, mandata.ai, या दोनों",
    lede: "बार्नस्टॉर्म को-ऑपरेशन्स एक राजनीतिक परामर्श संस्था, दो इंजन। सीट खरीदें, क्षेत्रीय प्रबंधन प्लेटफ़ॉर्म लाइसेंस करें, या दोनों बैठें — ग्राफ़ एक ही रहता है।",
    forLabel: "किसके लिए",
    incLabel: "क्या शामिल है",
    whenLabel: "कब चुनें",
    items: [
      {
        kicker: "01",
        kind: "कंसल्टिंग सीट",
        title: "बार्नस्टॉर्म सलाह",
        sig: "चुनाव अभियान परामर्श। वॉर-रूम में नामित कुर्सी।",
        for: "जीवित या आने वाले चक्र में उम्मीदवार, फ़ाइल पुनर्निर्माण करते बैठे सांसद-विधायक, और पार्टी कॉकस जिन्हें बिना चालीस-व्यक्ति सर्कस के वॉर-रूम चाहिए।",
        inc: "राजनीतिक रणनीति: कथा, बूथ डिज़ाइन, डिजिटल परसेप्शन, ग्राउंड वॉर-रूम। प्रिंसिपलों के लिए एक-पेज मेमो। फ़ील्ड स्क्रिप्ट जो बूथ एजेंट चला सके।",
        when: "जब दौड़ का सिद्धांत अभी नहीं है, बूथ इंटेलिजेंस लोककथा है, या अंतिम 30–180 दिनों को नामित कमांड चाहिए।",
        cta: "सलाह देखें",
        to: "/advisory" as const,
      },
      {
        kicker: "02",
        kind: "क्षेत्रीय प्लेटफ़ॉर्म",
        title: "mandata.ai",
        sig: "डेटा-चालित क्षेत्रीय शासन और नागरिक प्रतिक्रिया विश्लेषण।",
        for: "बैठे सांसद-विधायक, क्षेत्रीय कार्यालय, अभियान कमांड, और जिन पार्टी टीमों के पास पहले से बेंच है।",
        inc: "क्षेत्रीय प्रबंधन प्लेटफ़ॉर्म: घर-बूथ ग्राफ़, जन-सुनवाई वर्कफ़्लो, नागरिक संपर्क, MPLADS / MLACDS ट्रैकिंग, बूथ इंटेलिजेंस, रात्रिकालीन ब्रीफिंग — भूमिका-आधारित पहुँच पर।",
        when: "जब ज़रूरत अवसंरचना की हो: गिनती के बाद भी चलने वाला सांसद-विधायक क्षेत्रीय प्रबंधन, एक और विजिटिंग कंसल्टेंट नहीं।",
        cta: "mandata.ai देखें",
        to: "/platform" as const,
      },
      {
        kicker: "03",
        kind: "सीट + ग्राफ़",
        title: "संयुक्त एंगेजमेंट",
        sig: "कक्ष और ऑपरेटिंग सिस्टम। अभियान-से-शासन एक ब्रीफ।",
        for: "पहली बार के प्रिंसिपल, पुनर्निर्माण, नब्बे दिनों के भीतर की दौड़, और वे कार्यालय जो गिनती के दिन रीसेट नहीं सह सकते।",
        inc: "सलाह कमांड प्लस mandata.ai — एक सिद्धांत, एक राइट-बैक, चुनाव अभियान प्रबंधन जो सोमवार को शासन भी करे।",
        when: "जब सीट और ग्राफ़ दोनों चाहिए, कंसल्टेंट और अलग वेंडर नहीं।",
        cta: "जनादेश पर चर्चा",
        to: "/contact" as const,
      },
    ],
  },
} as const;

export const WHY = {
  en: {
    kicker: "Why this firm",
    title: "Why principals choose Barnstorm Co-operations",
    items: [
      {
        title: "Discretion as operating discipline",
        body: "Named where the record is public. Silent where the race is live. Barnstorm Co-operations will not sit both sides of a contest. Live files stay inside the room that owns them.",
      },
      {
        title: "Booth-level intelligence, not folklore",
        body: "Universes against the actual roll. Nightly reconciliation. Booth micro-targeting a booth agent can argue with — the unit of election campaign management, not a ground-team rumour.",
      },
      {
        title: "Field-to-command continuity",
        body: "The Friday memo and the turf sheet are the same document in two resolutions. Rapid decision support for principals; a sentence the field can execute.",
      },
      {
        title: "Campaign-to-governance continuity",
        body: "Counting day is a handoff, not an archive. Jan-Sunwai workflow management, citizen feedback analysis, and MPLADS / MLACDS sit on the household that was just in the race.",
      },
      {
        title: "An embedded seat, not a visiting consultant",
        body: "Political strategy consulting as a named chair in the war-room. Models are staff, not oracles. Execution rhythm for the room, not a forty-slide deck left on the table.",
      },
    ],
  },
  hi: {
    kicker: "यह संस्था क्यों",
    title: "प्रिंसिपल बार्नस्टॉर्म को-ऑपरेशन्स क्यों चुनते हैं",
    items: [
      {
        title: "गोपनीयता ऑपरेटिंग अनुशासन है",
        body: "जहाँ रिकॉर्ड सार्वजनिक है, नाम। जहाँ दौड़ जीवित है, मौन। हम एक ही चुनाव के दोनों पक्ष नहीं बैठते। जीवित फ़ाइल उसी कमरे में रहती है जिसका वह है।",
      },
      {
        title: "बूथ-स्तरीय इंटेलिजेंस, लोककथा नहीं",
        body: "वास्तविक रोल के विरुद्ध यूनिवर्स। रात्रिकालीन समाधान। बूथ माइक्रो-टारगेटिंग जिससे बूथ एजेंट बहस कर सके।",
      },
      {
        title: "फ़ील्ड से कमांड तक निरंतरता",
        body: "शुक्रवार का मेमो और टर्फ शीट एक ही दस्तावेज़ हैं, दो रेज़ोल्यूशन में। प्रिंसिपलों के लिए तेज़ निर्णय सहयोग; फ़ील्ड के लिए एक वाक्य।",
      },
      {
        title: "अभियान से शासन तक निरंतरता",
        body: "गिनती का दिन हैंडऑफ़ है, संग्रह नहीं। जन-सुनवाई, नागरिक प्रतिक्रिया, MPLADS / MLACDS उसी घर पर बैठते हैं जो अभी दौड़ में था।",
      },
      {
        title: "एम्बेडेड सीट, विजिटिंग कंसल्टेंट नहीं",
        body: "वॉर-रूम में नामित कुर्सी के रूप में राजनीतिक रणनीति। मॉडल स्टाफ़ हैं, देववाणी नहीं।",
      },
    ],
  },
} as const;

export const PROCESS = {
  en: {
    kicker: "How an engagement begins",
    title: "From confidential intake to an embedded execution rhythm",
    items: [
      {
        n: "01",
        title: "Confidential intake",
        body: "A brief, treated as the first memo. Geography, clock, who is in the room, and whether the need is advisory, mandata.ai, or both.",
      },
      {
        n: "02",
        title: "Strategic diagnostic",
        body: "A director at Barnstorm Co-operations reads it. If there is no fit, we say so. If there is, we name the problem in operating terms — not a capability brochure.",
      },
      {
        n: "03",
        title: "Mandate definition",
        body: "A 30-minute principals-only call. Then a one-page proposal: race command, governing retainer, or platform license.",
      },
      {
        n: "04",
        title: "Operating cadence design",
        body: "Decision rights, Friday memo, booth write-back, and — if licensed — the mandata.ai instance under named roles.",
      },
      {
        n: "05",
        title: "Embedded execution rhythm",
        body: "The seat is occupied. Field gets a sentence it can argue with. Principals get the next 72 hours, not an archive.",
      },
    ],
  },
  hi: {
    kicker: "एंगेजमेंट कैसे शुरू होता है",
    title: "गोपनीय इनटेक से एम्बेडेड निष्पादन लय तक",
    items: [
      {
        n: "01",
        title: "गोपनीय इनटेक",
        body: "ब्रीफ, पहले मेमो की तरह। भूगोल, घड़ी, कमरे में कौन, सलाह या mandata.ai या दोनों।",
      },
      {
        n: "02",
        title: "रणनीतिक डायग्नोस्टिक",
        body: "बार्नस्टॉर्म को-ऑपरेशन्स का निदेशक पढ़ता है। फ़िट नहीं तो हम कहते हैं। फ़िट हो तो समस्या को ऑपरेटिंग भाषा में नाम देते हैं।",
      },
      {
        n: "03",
        title: "जनादेश परिभाषा",
        body: "प्रिंसिपल-ओनली 30 मिनट की कॉल। फिर एक पेज का प्रस्ताव: रेस कमांड, गवर्निंग रिटेनर, या प्लेटफ़ॉर्म लाइसेंस।",
      },
      {
        n: "04",
        title: "ऑपरेटिंग कैडेंस डिज़ाइन",
        body: "निर्णय अधिकार, शुक्रवार मेमो, बूथ राइट-बैक, और यदि लाइसेंस हो तो नामित भूमिकाओं पर mandata.ai इंस्टेंस।",
      },
      {
        n: "05",
        title: "एम्बेडेड निष्पादन लय",
        body: "सीट भरी जाती है। फ़ील्ड को एक वाक्य मिलता है जिससे बहस हो सके। प्रिंसिपल को अगले 72 घंटे मिलते हैं, संग्रह नहीं।",
      },
    ],
  },
} as const;
