/**
 * Clinical alert rules and adjustable thresholds for Mama Root.
 * These thresholds are designed to be reviewed and adjusted by clinicians.
 */

export const CLINICAL_THRESHOLDS = {
  // CARD 1: 'Worth raising with your doctor'
  card1: {
    // Number of days to look back for symptoms (last 60 days / 2 months)
    lookbackDays: 60,
    // Severity threshold to consider pain as severe (0 to 10 scale)
    severePainSeverityThreshold: 7,
    // Minimum number of distinct calendar days with severe pain to trigger
    severePainDaysMin: 3,
    // Minimum number of distinct calendar days with heavy or very heavy bleeding to trigger
    heavyBleedingDaysMin: 3,
    // Terms matching heavy or very heavy bleeding in symptom type or notes
    heavyBleedingKeywords: [
      'heavy bleeding',
      'very heavy bleeding',
      'very_heavy bleeding',
      'heavy flow',
      'very heavy flow',
      'flooding',
      'very_heavy'
    ]
  },

  // CARD 2: Urgent clinical alert (e.g. potential ectopic pregnancy complications)
  card2: {
    // Number of days to look back for recent symptoms/pregnancy indicators
    lookbackDays: 7,
    // Target condition name in user_conditions
    pastEctopicConditionName: 'Past ectopic pregnancy',
    // Stage identifier in users.stages indicating active pregnancy
    pregnantStageKey: 'pregnant',
    // Symptom tags or keywords indicating potential pregnancy
    pregnancyIndicatorTags: [
      'late period',
      'positive pregnancy test'
    ],
    // High-risk symptom tags indicating urgent clinical evaluation required
    urgentSymptomTags: [
      'one-sided pain',
      'shoulder-tip pain',
      'dizziness or fainting',
      'dizziness',
      'fainting'
    ],
    // Pain severity threshold for urgent check (0 to 10 scale)
    urgentPainSeverityThreshold: 7,
    // Bleeding terms classified as heavy or very heavy
    heavyBleedingKeywords: [
      'heavy bleeding',
      'very heavy bleeding',
      'very_heavy bleeding',
      'heavy flow',
      'flooding',
      'very_heavy'
    ],
    // Emergency contact numbers for escalation
    emergencyContacts: {
      generalEmergency: '112',
      ambulance: '10177'
    }
  }
} as const;

export type ClinicalThresholds = typeof CLINICAL_THRESHOLDS;
