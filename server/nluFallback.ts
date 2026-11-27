import type { LanguageCode, NluRequest, NluResponse } from '../src/types/assistant.js';

function containsTeluguScript(text: string): boolean {
  return /[\u0C00-\u0C7F]/.test(text);
}

function detectLanguage(utterance: string, preferred: LanguageCode): LanguageCode {
  if (containsTeluguScript(utterance)) {
    return /[a-zA-Z]/.test(utterance) ? 'mixed' : 'te-IN';
  }
  const tenglishHints = /\b(cheyi|cheppu|kavali|ento|entha|ekkada|dabbulu|mandu|mandulu|raka|vellali|station ki|billu)\b/i;
  if (tenglishHints.test(utterance)) {
    return 'mixed';
  }
  return preferred;
}

function extractDestination(utterance: string): string | undefined {
  const clean = utterance.trim();

  if (/vijayawada|విజయవాడ/i.test(clean)) {
    if (/railway|రైల్వే|station|స్టేషన్/i.test(clean)) {
      return 'Vijayawada Railway Station';
    }
    if (/bus|బస్/i.test(clean)) {
      return 'Pandit Nehru Bus Station, Vijayawada';
    }
    return 'Vijayawada City Center';
  }

  if (/gannavaram|airport|విమానాశ్రయం/i.test(clean)) {
    return 'Vijayawada Airport (Gannavaram)';
  }

  if (/benz circle|బెంజ్ సర్కిల్/i.test(clean)) {
    return 'Benz Circle, Vijayawada';
  }

  if (/secunderabad|సికింద్రాబాద్/i.test(clean)) {
    return 'Secunderabad Railway Station';
  }

  if (/hospital|ఆసుపత్రి|aiims|మంగళగిరి|mangalagiri/i.test(clean)) {
    return 'AIIMS Mangalagiri Hospital';
  }

  const toMatch = clean.match(/(?:to|towards|ki|కు|కి)\s+([a-zA-Z\u0C00-\u0C7F0-9\s]{3,40})/i);
  if (toMatch?.[1]) {
    const candidate = toMatch[1].replace(/\b(please|cab|taxi|auto|book|cheyi|చేయి)\b/gi, '').trim();
    if (candidate.length >= 3) {
      return candidate;
    }
  }

  return undefined;
}

export function runFallbackNlu(request: NluRequest, aiConfigured: boolean, aiNotice?: string): NluResponse {
  const raw = request.utterance.trim();
  const lower = raw.toLowerCase();
  const detectedLang = detectLanguage(raw, request.language);
  const isTeluguPreferred = request.language === 'te-IN' || detectedLang === 'te-IN';

  if (!raw || raw.length < 2) {
    return {
      intent: 'clarify',
      confidence: 0.2,
      detectedLanguage: detectedLang,
      needsClarification: true,
      clarificationQuestion: isTeluguPreferred
        ? 'మీరు ఏ సహాయం కోరుకుంటున్నారో మళ్ళీ స్పష్టంగా చెప్పండి. ఉదాహరణకు: విజయవాడ రైల్వే స్టేషన్‌కు క్యాబ్ బుక్ చేయి.'
        : 'I did not catch that clearly. What would you like me to help with? For example, say "Book a cab to Vijayawada railway station."',
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: {},
      spokenResponse: isTeluguPreferred
        ? 'మీ మాట స్పష్టంగా వినిపించలేదు. దయచేసి మళ్ళీ చెప్పండి.'
        : 'I did not catch that clearly. Please tell me what task you want to do.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Repeat last
  if (/\b(repeat|say again|pardon)\b|మళ్ళీ చెప్పు|మరలా చెప్పు/i.test(lower)) {
    return {
      intent: 'repeat_last',
      confidence: 0.96,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: {},
      spokenResponse: isTeluguPreferred ? 'చివరి సమాధానాన్ని మళ్ళీ వినిపిస్తున్నాను.' : 'Repeating my last response.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Cancel
  if (/\b(cancel|stop|abort|nevermind|never mind)\b|రద్దు|ఆపు|వద్దు/i.test(lower)) {
    return {
      intent: 'cancel_action',
      confidence: 0.94,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: {},
      spokenResponse: isTeluguPreferred
        ? 'ప్రస్తుత పనిని రద్దు చేశాను. మీరు కొత్త ఆదేశం ఇవ్వవచ్చు.'
        : 'Cancelled the current operation. You can give a new command whenever ready.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Explicit OTP request (only when requested!)
  if (/\b(otp|one time password|pin code|ride code)\b|ఓటీపీ|ఓటిపి/i.test(lower)) {
    return {
      intent: 'read_otp',
      confidence: 0.95,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: true,
      entities: {},
      spokenResponse: request.hasActiveCabBooking
        ? isTeluguPreferred
          ? 'మీరు అడిగినందున టెస్ట్ ఓటీపీని చదవడానికి భద్రతా పిన్ ధృవీకరణ సిద్ధంగా ఉంది.'
          : 'You explicitly requested your test ride OTP. Please verify your security PIN to hear it aloud.'
        : isTeluguPreferred
          ? 'ప్రస్తుతం యాక్టివ్ క్యాబ్ బుకింగ్ లేదు. ముందుగా క్యాబ్ బుకింగ్ ప్రారంభించండి.'
          : 'There is no active simulated cab booking right now. Please book a cab first.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Confirm active workflow
  if (
    request.pendingWorkflow &&
    /\b(confirm|yes|proceed|go ahead|book it|okay|ok)\b|అవును|నిర్ధారించు|సరే|బుక్ చేయి/i.test(lower)
  ) {
    return {
      intent: 'confirm_action',
      confidence: 0.91,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: true,
      entities: {},
      spokenResponse: isTeluguPreferred
        ? 'నిర్ధారణ తీసుకున్నాను. దయచేసి భద్రతా పిన్‌తో పూర్తి చేయండి.'
        : 'Confirmation received. Please authorize with your security PIN to complete the simulated action.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Cab booking
  if (/\b(cab|taxi|auto|ride|uber|ola|rapido|car)\b|క్యాబ్|ఆటో|టాక్సీ|రైడ్/i.test(lower)) {
    const destination = extractDestination(raw);
    const cabCategory = /\bauto\b|ఆటో/i.test(lower)
      ? 'auto'
      : /\bsedan\b|prime/i.test(lower)
        ? 'sedan'
        : 'mini';

    if (!destination) {
      return {
        intent: 'cab_booking',
        confidence: 0.72,
        detectedLanguage: detectedLang,
        needsClarification: true,
        clarificationQuestion: isTeluguPreferred
          ? 'మీరు క్యాబ్ ఎక్కడికి వెళ్లడానికి బుక్ చేయాలి? ఉదాహరణకు: విజయవాడ రైల్వే స్టేషన్.'
          : 'Where would you like the cab to take you? For example, Vijayawada Railway Station or Benz Circle.',
        requiresLocationPermission: !request.locationGranted,
        requiresUserConfirmation: false,
        requiresSecurityPin: false,
        entities: { cabCategory },
        spokenResponse: isTeluguPreferred
          ? 'మీరు ఎక్కడికి వెళ్లాలో దయచేసి గమ్యస్థానం చెప్పండి.'
          : 'Please tell me your destination for the cab ride.',
        aiSource: 'demo_fallback',
        aiConfigured,
        aiNotice,
      };
    }

    return {
      intent: 'cab_booking',
      confidence: 0.94,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: !request.locationGranted,
      requiresUserConfirmation: true,
      requiresSecurityPin: true,
      entities: {
        destination,
        pickup: request.locationGranted ? 'Current Location (MG Road, Vijayawada)' : undefined,
        cabCategory,
      },
      spokenResponse: !request.locationGranted
        ? isTeluguPreferred
          ? `${destination}కు క్యాబ్ అంచనా ధర చూపడానికి మీ లొకేషన్ అనుమతి కావాలి. దయచేసి లొకేషన్ అనుమతి ఇవ్వండి.`
          : `I can help book a simulated cab to ${destination}. First, I need your permission to access location so I can set your pickup point.`
        : isTeluguPreferred
          ? `${destination}కు నమూనా క్యాబ్ ధరలు సిద్ధంగా ఉన్నాయి. వివరాలను చదువుతున్నాను.`
          : `Fetching sample cab options and estimated fares to ${destination}.`,
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Medicine ordering
  if (/\b(medicine|tablet|tablets|pharmacy|pill|paracetamol|metformin|crocin|dolo)\b|మందు|మందులు|మాత్రలు|ఫార్మసీ/i.test(lower)) {
    let medicineName: string | undefined;
    if (/paracetamol|dolo|crocin|పారాసెటమాల్/i.test(lower)) medicineName = 'Paracetamol 650mg';
    else if (/metformin|sugar|diabetes|మెట్‌ఫార్మిన్/i.test(lower)) medicineName = 'Metformin 500mg';
    else if (/cetirizine|allergy|cold/i.test(lower)) medicineName = 'Cetirizine 10mg';

    if (!medicineName) {
      return {
        intent: 'medicine_order',
        confidence: 0.74,
        detectedLanguage: detectedLang,
        needsClarification: true,
        clarificationQuestion: isTeluguPreferred
          ? 'మీకు ఏ మందు కావాలో పేరు చెప్పండి? ఉదాహరణకు: పారాసెటమాల్ లేదా మెట్‌ఫార్మిన్.'
          : 'Which medicine do you want to order? In this demo, you can ask for Paracetamol 650mg, Metformin 500mg, or Cetirizine 10mg.',
        requiresLocationPermission: false,
        requiresUserConfirmation: false,
        requiresSecurityPin: false,
        entities: {},
        spokenResponse: isTeluguPreferred
          ? 'మీకు కావలసిన మందు పేరు చెప్పండి.'
          : 'Which medicine would you like to order? Please say the medicine name.',
        aiSource: 'demo_fallback',
        aiConfigured,
        aiNotice,
      };
    }

    return {
      intent: 'medicine_order',
      confidence: 0.92,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: true,
      requiresSecurityPin: true,
      entities: { medicineName, quantity: '1 strip' },
      spokenResponse: isTeluguPreferred
        ? `${medicineName} నమూనా ఫార్మసీ ధర మరియు డెలివరీ వివరాలు చూపిస్తున్నాను.`
        : `Found sample pharmacy listing for ${medicineName}. Please review and confirm before placing a simulated order.`,
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Doctor appointment
  if (/\b(doctor|appointment|clinic|hospital|checkup|eye|general physician)\b|డాక్టర్|అపాయింట్‌మెంట్|ఆసుపత్రి|వైద్యుడు/i.test(lower)) {
    const specialty = /eye|vision|కంటి/i.test(lower)
      ? 'Ophthalmology (Eye Care)'
      : /cardio|heart|గుండె/i.test(lower)
        ? 'Cardiology'
        : 'General Medicine';

    return {
      intent: 'doctor_appointment',
      confidence: 0.9,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: true,
      requiresSecurityPin: false,
      entities: { specialty },
      spokenResponse: isTeluguPreferred
        ? `${specialty} డాక్టర్ నమూనా అపాయింట్‌మెంట్ స్లాట్లు చూపిస్తున్నాను.`
        : `Showing sample ${specialty} appointment slots. Select or confirm a time slot to continue.`,
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Electricity bill
  if (/\b(electricity|power|current|bill|apspdcl|tsspdcl)\b|కరెంట్ బిల్లు|విద్యుత్ బిల్లు|బిల్లు/i.test(lower)) {
    return {
      intent: 'electricity_bill',
      confidence: 0.93,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: true,
      entities: { consumerNumber: 'AP-8842-1093' },
      spokenResponse: isTeluguPreferred
        ? 'మీ నమూనా విద్యుత్ బిల్లు వివరాలను తీసుకువస్తున్నాను.'
        : 'Retrieving your sample electricity bill details and reading the amount due aloud.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Notifications
  if (/\b(notification|notifications|alerts|messages|unread)\b|నోటిఫికేషన్|సందేశాలు|అలర్ట్/i.test(lower)) {
    return {
      intent: 'read_notifications',
      confidence: 0.94,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: {},
      spokenResponse: isTeluguPreferred
        ? 'మీ ముఖ్యమైన నమూనా నోటిఫికేషన్లను చదువుతున్నాను.'
        : 'Reading your important sample notifications aloud.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Open app
  if (/\b(open|launch|start)\s+(phone|dialer|maps|whatsapp|messages|settings|clock|alarm)\b|యాప్ తెరువు/i.test(lower)) {
    const match = lower.match(/\b(phone|dialer|maps|whatsapp|messages|settings|clock|alarm)\b/);
    const appName = match?.[1] ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Phone';
    return {
      intent: 'open_app',
      confidence: 0.88,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: { appName },
      spokenResponse: isTeluguPreferred
        ? `${appName} యాప్ షార్ట్‌కట్‌ను తెరుస్తున్నాను (నమూనా ఇంటిగ్రేషన్).`
        : `Opening simulated shortcut for ${appName}. Note that browser security prevents directly launching native Android apps from a web tab.`,
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Help
  if (/\b(help|what can you do|commands|guide)\b|సహాయం|ఏం చేయగలవు/i.test(lower)) {
    return {
      intent: 'help',
      confidence: 0.95,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: {},
      spokenResponse: isTeluguPreferred
        ? 'నేను తెలుగు మరియు ఇంగ్లీష్‌లో సహాయం చేయగలను. మీరు క్యాబ్ బుక్ చేయడం, మందులు ఆర్డర్ చేయడం, డాక్టర్ అపాయింట్‌మెంట్, కరెంట్ బిల్లు, లేదా నోటిఫికేషన్లు చదవడం గురించి అడగవచ్చు.'
        : 'I can help in English and Telugu. Try saying: Book a cab to Vijayawada railway station, Check my electricity bill, Order Paracetamol medicine, Book a doctor appointment, or Read my notifications.',
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // General search or unclear fallback
  if (/\b(search|find|what is|who is|weather|train|news|tell me about)\b|వెతుకు|సమాచారం|ఏమిటి/i.test(lower)) {
    return {
      intent: 'web_search',
      confidence: 0.84,
      detectedLanguage: detectedLang,
      needsClarification: false,
      requiresLocationPermission: false,
      requiresUserConfirmation: false,
      requiresSecurityPin: false,
      entities: { searchQuery: raw },
      spokenResponse: isTeluguPreferred
        ? `"${raw}" గురించి నమూనా శోధన ఫలితాలను చూపిస్తున్నాను.`
        : `Looking up accessible summary results for "${raw}".`,
      aiSource: 'demo_fallback',
      aiConfigured,
      aiNotice,
    };
  }

  // Ambiguous command -> ask clarification instead of guessing!
  return {
    intent: 'clarify',
    confidence: 0.35,
    detectedLanguage: detectedLang,
    needsClarification: true,
    clarificationQuestion: isTeluguPreferred
      ? `మీరు "${raw}" అన్నారు. మీకు క్యాబ్ బుకింగ్, మందుల ఆర్డర్, డాక్టర్ అపాయింట్‌మెంట్, కరెంట్ బిల్లు, లేదా సాధారణ సమాచారం ఏది కావాలి?`
      : `I heard "${raw}", but I want to be sure before acting. Did you want a cab booking, medicine order, doctor appointment, electricity bill check, or a general search?`,
    requiresLocationPermission: false,
    requiresUserConfirmation: false,
    requiresSecurityPin: false,
    entities: {},
    spokenResponse: isTeluguPreferred
      ? 'మీ అభ్యర్థన స్పష్టంగా లేదు. మీరు క్యాబ్, మందులు, అపాయింట్‌మెంట్ లేదా బిల్లులలో ఏది కావాలో చెప్పండి.'
      : 'I want to be certain before taking action. Could you clarify if you want a cab, medicine order, doctor appointment, electricity bill, or general search?',
    aiSource: 'demo_fallback',
    aiConfigured,
    aiNotice,
  };
}
