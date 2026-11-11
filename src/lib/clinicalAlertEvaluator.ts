import { Symptom, UserCondition } from './supabase';
import { CLINICAL_THRESHOLDS } from '../constants/clinicalAlerts';

export interface Card1AlertResult {
  showAlert: boolean;
  severePainDays: number;
  heavyBleedingDays: number;
  displayText: string;
  expandableText: string;
}

export interface Card2AlertResult {
  showAlert: boolean;
  title: string;
  displayText: string;
}

/**
 * Checks if a symptom or its notes match any of the given keyword list
 */
function matchesKeyword(s: Symptom, keywords: readonly string[]): boolean {
  const typeText = (s.type || '').toLowerCase();
  const notesText = (s.notes || '').toLowerCase();
  return keywords.some(kw => {
    const term = kw.toLowerCase();
    return typeText.includes(term) || notesText.includes(term);
  });
}

/**
 * Normalizes date to YYYY-MM-DD
 */
function getDayKey(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

/**
 * Evaluates CARD 1: 'Worth raising with your doctor'
 */
export function evaluateCard1Alert(
  symptoms: Symptom[],
  thresholds = CLINICAL_THRESHOLDS.card1
): Card1AlertResult {
  const now = Date.now();
  const lookbackCutoff = now - thresholds.lookbackDays * 24 * 60 * 60 * 1000;

  // Filter symptoms within lookback period (last 60 days)
  const recentSymptoms = symptoms.filter(s => {
    const t = new Date(s.created_at).getTime();
    return !isNaN(t) && t >= lookbackCutoff;
  });

  const severeDaysSet = new Set<string>();
  const bleedingDaysSet = new Set<string>();

  for (const s of recentSymptoms) {
    const dayKey = getDayKey(s.created_at);
    if (!dayKey) continue;

    // Severe pain check (severity >= 7)
    if (s.severity >= thresholds.severePainSeverityThreshold) {
      severeDaysSet.add(dayKey);
    }

    // Heavy or very heavy bleeding check
    if (matchesKeyword(s, thresholds.heavyBleedingKeywords)) {
      bleedingDaysSet.add(dayKey);
    }
  }

  const severePainDays = severeDaysSet.size;
  const heavyBleedingDays = bleedingDaysSet.size;

  const hasPainAlert = severePainDays >= thresholds.severePainDaysMin;
  const hasBleedingAlert = heavyBleedingDays >= thresholds.heavyBleedingDaysMin;

  const showAlert = hasPainAlert || hasBleedingAlert;

  if (!showAlert) {
    return {
      showAlert: false,
      severePainDays,
      heavyBleedingDays,
      displayText: '',
      expandableText: ''
    };
  }

  // Phrasing logic
  let displayCategory = '';
  let askCategory = '';

  if (hasPainAlert && hasBleedingAlert) {
    displayCategory = `severe pain on ${severePainDays} days and heavy bleeding on ${heavyBleedingDays} days`;
    askCategory = `pain on ${severePainDays} days and heavy bleeding on ${heavyBleedingDays} days`;
  } else if (hasPainAlert) {
    displayCategory = `severe pain on ${severePainDays} day${severePainDays === 1 ? '' : 's'}`;
    askCategory = `pain on ${severePainDays} day${severePainDays === 1 ? '' : 's'}`;
  } else {
    displayCategory = `heavy bleeding on ${heavyBleedingDays} day${heavyBleedingDays === 1 ? '' : 's'}`;
    askCategory = `heavy bleeding on ${heavyBleedingDays} day${heavyBleedingDays === 1 ? '' : 's'}`;
  }

  const displayText = `You have logged ${displayCategory} in the last 2 months. This is worth discussing with a doctor or nurse. Mama Root cannot tell you what it means.`;
  const expandableText = `I have logged ${askCategory} over the last two months and it affects my daily life. What could be causing it, and what tests or next steps do you suggest?`;

  return {
    showAlert: true,
    severePainDays,
    heavyBleedingDays,
    displayText,
    expandableText
  };
}

/**
 * Evaluates CARD 2: Urgent clinical alert (history of ectopic + pregnancy + urgent symptoms)
 */
export function evaluateCard2Alert(
  symptoms: Symptom[],
  conditions: UserCondition[],
  stages: string[] = [],
  thresholds = CLINICAL_THRESHOLDS.card2
): Card2AlertResult {
  const targetTitle = 'Please get checked today';
  const targetText =
    'Because of your history, this combination needs to be checked urgently. Go to a clinic or emergency unit today. If you feel faint or have severe pain or heavy bleeding, go now or call 112 or an ambulance on 10177.';

  // 1. Check if user has condition named 'Past ectopic pregnancy' in user_conditions
  const hasPastEctopic = conditions.some(c => {
    const name = (c.condition || '').toLowerCase().trim();
    const target = thresholds.pastEctopicConditionName.toLowerCase().trim();
    return name.includes(target) || name === 'past ectopic pregnancy' || name === 'ectopic pregnancy';
  });

  if (!hasPastEctopic) {
    return { showAlert: false, title: targetTitle, displayText: targetText };
  }

  // 2. Lookback window: last 7 days
  const now = Date.now();
  const lookbackCutoff = now - thresholds.lookbackDays * 24 * 60 * 60 * 1000;
  const last7DaysSymptoms = symptoms.filter(s => {
    const t = new Date(s.created_at).getTime();
    return !isNaN(t) && t >= lookbackCutoff;
  });

  // Check pregnancy trigger:
  // Either stages containing 'pregnant' OR a log in the last 7 days with tag 'Late period' or 'Positive pregnancy test'
  const isStagePregnant = stages.some(
    s => s.toLowerCase() === thresholds.pregnantStageKey.toLowerCase()
  );

  const hasPregnancyLog = last7DaysSymptoms.some(s =>
    matchesKeyword(s, thresholds.pregnancyIndicatorTags)
  );

  const pregnancyTrigger = isStagePregnant || hasPregnancyLog;
  if (!pregnancyTrigger) {
    return { showAlert: false, title: targetTitle, displayText: targetText };
  }

  // 3. Urgent symptoms in the last 7 days:
  // one of: tag 'One-sided pain', tag 'Shoulder-tip pain', tag 'Dizziness or fainting',
  // bleeding heavy or very_heavy, or severity 7 or more.
  const hasUrgentSymptom = last7DaysSymptoms.some(s => {
    const matchesUrgentTag = matchesKeyword(s, thresholds.urgentSymptomTags);
    const matchesBleeding = matchesKeyword(s, thresholds.heavyBleedingKeywords);
    const hasHighSeverity = s.severity >= thresholds.urgentPainSeverityThreshold;

    return matchesUrgentTag || matchesBleeding || hasHighSeverity;
  });

  if (!hasUrgentSymptom) {
    return { showAlert: false, title: targetTitle, displayText: targetText };
  }

  return {
    showAlert: true,
    title: targetTitle,
    displayText: targetText
  };
}
