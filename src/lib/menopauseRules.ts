/**
 * Clinical safety rules and threshold evaluators for perimenopause & menopause in Mama Root.
 * Clinicians can adjust age thresholds, trigger tags, and messaging here.
 */

export interface MenopauseSafetyResult {
  showUnder40Alert: boolean;
  under40Text: string;
  showPostmenopausalBleedingAlert: boolean;
  bleedingText: string;
}

export const MENOPAUSE_RULES_CONFIG = {
  // Age threshold for premature / early cessation of menses
  earlyMenopauseAgeThreshold: 40,

  // Bleeding trigger keyword
  bleedingTag: 'bleeding',

  // Clinical copy (strictly non-diagnostic)
  copy: {
    under40Alert:
      'Periods stopping before 40 need a medical check. This is not a normal change at your age. Please see a clinician. Here is a summary you can take with you.',
    bleedingAlert:
      'Bleeding after your periods have stopped should always be checked by a clinician.'
  }
} as const;

/**
 * Calculates exact age at the time of the last period
 */
export function calculateAgeAtDate(dobStr: string, dateStr: string): number | null {
  try {
    const dob = new Date(dobStr);
    const targetDate = new Date(dateStr);
    if (isNaN(dob.getTime()) || isNaN(targetDate.getTime())) return null;

    let age = targetDate.getFullYear() - dob.getFullYear();
    const monthDiff = targetDate.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && targetDate.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

/**
 * Evaluates clinical safety cards for perimenopause and menopause
 */
export function evaluateMenopauseSafetyRules(
  dob: string | null | undefined,
  lastPeriodDate: string | null | undefined,
  stages: string[] = [],
  symptoms: any[] = [],
  config = MENOPAUSE_RULES_CONFIG
): MenopauseSafetyResult {
  const isMenopause = stages.includes('menopause');

  // Rule 1: If age at last period is under 40
  let showUnder40Alert = false;
  if (dob && lastPeriodDate) {
    const ageAtLastPeriod = calculateAgeAtDate(dob, lastPeriodDate);
    if (ageAtLastPeriod !== null && ageAtLastPeriod < config.earlyMenopauseAgeThreshold) {
      showUnder40Alert = true;
    }
  }

  // Rule 2: If in menopause stage and logs the tag Bleeding
  let showPostmenopausalBleedingAlert = false;
  if (isMenopause) {
    const kw = config.bleedingTag.toLowerCase().trim();
    const hasBleedingLog = (symptoms || []).some(item => {
      const typeStr = ((item.type || '') as string).toLowerCase().trim();
      const tagStr = ((item.tag || '') as string).toLowerCase().trim();
      const notesStr = ((item.notes || item.note || '') as string).toLowerCase().trim();

      if (typeStr.includes(kw) || tagStr.includes(kw) || notesStr.includes(kw)) {
        return true;
      }
      if (Array.isArray(item.tags)) {
        return item.tags.some((t: string) => (t || '').toLowerCase().trim().includes(kw));
      }
      return false;
    });

    if (hasBleedingLog) {
      showPostmenopausalBleedingAlert = true;
    }
  }

  return {
    showUnder40Alert,
    under40Text: config.copy.under40Alert,
    showPostmenopausalBleedingAlert,
    bleedingText: config.copy.bleedingAlert
  };
}
