/**
 * Clinical configuration and thresholds for cycle calculations and period tracking.
 * All parameters can be reviewed and adjusted by clinicians.
 */

export const CYCLE_CONFIG = {
  // Minimum number of completed cycle lengths required to calculate personalized range
  minCyclesForRange: 3,

  // Maximum number of recent cycle lengths used in analysis
  maxRecentCyclesToAnalyze: 6,

  // Threshold difference between longest and shortest cycle (in days) to consider regular
  // If (longest - shortest) <= 4, narrow median-based window is calculated
  regularCycleDiffThresholdDays: 4,

  // Day tolerance around median for regular cycles (+/- 2 days)
  regularCycleToleranceDays: 2,

  // Fallback default cycle length in days if not set on profile
  defaultCycleLengthDays: 28,

  // Stages that suppress period cycle prediction
  suppressedStages: ['menopause', 'pregnant'] as const,

  // Standard copy templates
  messages: {
    fewerThanThreeCycles:
      'Log the first day of each period. Your range appears after 3 cycles.',
    profileCycleText: (days: number) =>
      `Your usual: ${days} days.`,
    narrowRange: (startFormatted: string, endFormatted: string) =>
      `Next period expected between ${startFormatted} and ${endFormatted}`,
    variableRange: (shortest: number, longest: number, startFormatted: string, endFormatted: string) =>
      `Your cycles range from ${shortest} to ${longest} days. Your next period could start between ${startFormatted} and ${endFormatted}.`,
    laterThanRange:
      'It is later than your usual range. This can happen for many reasons. A clinician can help if you are worried.',
    disclaimer:
      'This is an estimate from your own logs. It is not medical advice.',
    irregularExplanation:
      'Your cycles are irregular, so we show a range instead of a date, and we never assume pregnancy.',
    pausedTracksPeriods:
      'Period tracking is paused. Symptom tracking and health history remain active.',
    pausedMenopause:
      'Cycle predictions are paused during menopause. Symptom tracking and care remain active.',
    pausedPregnancy:
      'Cycle predictions are paused during pregnancy. Symptom tracking and care remain active.'
  }
} as const;

export type CycleConfig = typeof CYCLE_CONFIG;
