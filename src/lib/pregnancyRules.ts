/**
 * Clinical rules and urgent alert evaluators for pregnancy mode in Mama Root.
 * Clinicians can adjust keywords, thresholds, and emergency copy here.
 */

export interface PregnancyUrgentAlertResult {
  showAlert: boolean;
  title: string;
  displayText: string;
  matchedTriggers: string[];
}

export const PREGNANCY_RULES_CONFIG = {
  // Urgent observation window in days
  lookbackDays: 3,

  // High-severity threshold for headache
  severeHeadacheThreshold: 7,

  // Critical urgent warning tags / keywords
  criticalTags: [
    'bleeding',
    'fluid leaking',
    'reduced baby movement',
    'fever'
  ] as const,

  // Paired symptoms rule: Swelling + Headache within lookback period
  pairedSymptoms: {
    symptomA: 'swelling',
    symptomB: 'headache'
  },

  // Emergency contact lines
  emergencyNumbers: {
    emergency: '112',
    ambulance: '10177'
  },

  // Alert messaging
  copy: {
    urgentTitle: 'Please get checked today',
    urgentText:
      'Go to a clinic or hospital today. If you feel very unwell, call 112 or an ambulance on 10177.'
  }
} as const;

/**
 * Checks if a log item contains or matches a specific tag/keyword
 */
function logMatches(item: any, keyword: string): boolean {
  const kw = keyword.toLowerCase().trim();
  
  // Check array of tags
  if (Array.isArray(item.tags)) {
    if (item.tags.some((t: string) => (t || '').toLowerCase().trim().includes(kw))) {
      return true;
    }
  }

  // Check single tag
  if (typeof item.tag === 'string' && item.tag.toLowerCase().trim().includes(kw)) {
    return true;
  }

  // Check symptom type (if passed from symptoms table)
  if (typeof item.type === 'string' && item.type.toLowerCase().trim().includes(kw)) {
    return true;
  }

  // Check note / notes text
  const noteText = ((item.notes || item.note || '') as string).toLowerCase();
  return noteText.includes(kw);
}

/**
 * Evaluates urgent pregnancy rules on logs from the last 3 days
 */
export function evaluatePregnancyUrgentRules(
  pregnancyLogs: any[],
  symptoms: any[] = [],
  config = PREGNANCY_RULES_CONFIG
): PregnancyUrgentAlertResult {
  const now = Date.now();
  const lookbackCutoff = now - config.lookbackDays * 24 * 60 * 60 * 1000;

  // Combine pregnancy_logs and symptoms within the 3-day lookback window
  const allRecentLogs = [...pregnancyLogs, ...symptoms].filter(item => {
    if (!item.created_at) return true;
    const t = new Date(item.created_at).getTime();
    return !isNaN(t) && t >= lookbackCutoff;
  });

  const matchedTriggers: string[] = [];

  let hasHeadache = false;
  let hasSevereHeadache = false;
  let hasSwelling = false;

  for (const log of allRecentLogs) {
    const sev = typeof log.severity === 'number' ? log.severity : 0;

    // 1. Bleeding
    if (logMatches(log, 'bleeding')) {
      matchedTriggers.push('Bleeding');
    }

    // 2. Fluid leaking
    if (logMatches(log, 'fluid leaking')) {
      matchedTriggers.push('Fluid leaking');
    }

    // 3. Reduced baby movement
    if (logMatches(log, 'reduced baby movement')) {
      matchedTriggers.push('Reduced baby movement');
    }

    // 4. Fever
    if (logMatches(log, 'fever')) {
      matchedTriggers.push('Fever');
    }

    // Check Headache
    if (logMatches(log, 'headache')) {
      hasHeadache = true;
      if (sev >= config.severeHeadacheThreshold) {
        hasSevereHeadache = true;
        matchedTriggers.push(`Headache with severity ${sev}/10`);
      }
    }

    // Check Swelling
    if (logMatches(log, 'swelling')) {
      hasSwelling = true;
    }
  }

  // 5. Swelling with Headache within the last 3 days
  if (hasSwelling && hasHeadache) {
    matchedTriggers.push('Swelling with Headache');
  }

  const showAlert = matchedTriggers.length > 0;

  return {
    showAlert,
    title: config.copy.urgentTitle,
    displayText: config.copy.urgentText,
    matchedTriggers: Array.from(new Set(matchedTriggers))
  };
}
