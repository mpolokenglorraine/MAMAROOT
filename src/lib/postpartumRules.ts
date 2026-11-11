/**
 * Clinical rules, thresholds, and warning evaluators for postpartum & early motherhood.
 * Clinicians can adjust warning tags, observation windows, and emergency messaging here.
 */

export interface PostpartumWarningResult {
  showAlert: boolean;
  title: string;
  displayText: string;
  hasHarmThoughts: boolean;
  matchedTags: string[];
}

export const POSTPARTUM_RULES_CONFIG = {
  // Postpartum early observation window: 6 weeks = 42 days
  maxPostpartumDays: 42,

  // Lookback window for logged symptoms in days
  symptomLookbackDays: 7,

  // The 7 critical postpartum warning tags specified clinically
  warningTags: [
    'Very heavy bleeding',
    'Fever',
    'Severe headache',
    'Leg pain or swelling',
    'Chest pain or trouble breathing',
    'Wound problems (for a caesarean)',
    'Thoughts of harming myself or my baby'
  ] as const,

  // Mental health specific trigger tag
  harmThoughtsTag: 'Thoughts of harming myself or my baby',

  // Emergency contact numbers
  emergencyNumbers: {
    general: '112',
    ambulance: '10177'
  },

  // Alert messaging
  copy: {
    urgentTitle: 'Please get checked today',
    urgentText: 'Go to a clinic or hospital today. If you feel very unwell, call 112 or an ambulance on 10177.',
    cultureSafetyLine: 'Baby with a fever or trouble breathing? Go to a clinic or hospital now.'
  }
} as const;

/**
 * Checks whether a symptom or log matches a target tag
 */
function matchesTag(item: any, target: string): boolean {
  const t = target.toLowerCase().trim();

  // Check type
  if (typeof item.type === 'string' && item.type.toLowerCase().trim() === t) {
    return true;
  }

  // Check tag / tags array
  if (typeof item.tag === 'string' && item.tag.toLowerCase().trim() === t) {
    return true;
  }
  if (Array.isArray(item.tags)) {
    if (item.tags.some((x: string) => (x || '').toLowerCase().trim() === t)) {
      return true;
    }
  }

  // Fuzzy check in type or notes if contains full phrase
  const typeStr = ((item.type || '') as string).toLowerCase();
  const notesStr = ((item.notes || item.note || '') as string).toLowerCase();

  return typeStr.includes(t) || notesStr.includes(t);
}

/**
 * Evaluates postpartum warning rules
 * @param symptoms Patient's recent logged symptoms
 * @param babyAgeInDays Approximate age of the youngest child in days
 * @param stages Array of user's active health stages
 */
export function evaluatePostpartumWarningRules(
  symptoms: any[],
  babyAgeInDays: number | null,
  stages: string[] = [],
  config = POSTPARTUM_RULES_CONFIG
): PostpartumWarningResult {
  const isEarlyMotherhood = stages.includes('early_motherhood');
  if (!isEarlyMotherhood) {
    return {
      showAlert: false,
      title: '',
      displayText: '',
      hasHarmThoughts: false,
      matchedTags: []
    };
  }

  // Check if within the first 6 weeks (42 days)
  // If babyAgeInDays is set and exceeds 42 days, warning card is not triggered
  if (babyAgeInDays !== null && babyAgeInDays > config.maxPostpartumDays) {
    return {
      showAlert: false,
      title: '',
      displayText: '',
      hasHarmThoughts: false,
      matchedTags: []
    };
  }

  // Lookback window: symptoms within last 7 days
  const now = Date.now();
  const cutoff = now - config.symptomLookbackDays * 24 * 60 * 60 * 1000;

  const recentSymptoms = (symptoms || []).filter(item => {
    if (!item.created_at) return true;
    const t = new Date(item.created_at).getTime();
    return !isNaN(t) && t >= cutoff;
  });

  const matchedTags: string[] = [];
  let hasHarmThoughts = false;

  for (const tag of config.warningTags) {
    const found = recentSymptoms.some(s => matchesTag(s, tag));
    if (found) {
      matchedTags.push(tag);
      if (tag.toLowerCase() === config.harmThoughtsTag.toLowerCase()) {
        hasHarmThoughts = true;
      }
    }
  }

  if (matchedTags.length > 0) {
    return {
      showAlert: true,
      title: config.copy.urgentTitle,
      displayText: config.copy.urgentText,
      hasHarmThoughts,
      matchedTags
    };
  }

  return {
    showAlert: false,
    title: '',
    displayText: '',
    hasHarmThoughts: false,
    matchedTags: []
  };
}
