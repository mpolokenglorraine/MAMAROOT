import { PeriodLog, Profile } from './supabase';
import { CYCLE_CONFIG } from './cycleConfig';

export interface CycleBarData {
  cycleIndex: number;
  days: number;
  isShortest: boolean;
  isLongest: boolean;
  percentage: number;
}

export interface CycleEngineResult {
  isSuppressed: boolean;
  suppressionReason?: string;
  hasEnoughCycles: boolean;
  cycleCount: number;
  recentCycleLengths: number[];
  shortest?: number;
  longest?: number;
  typical?: number;
  lastStartDate?: string;
  currentCycleDay?: number | null;
  rangeText: string;
  profileCycleText?: string;
  isLaterThanRange: boolean;
  laterThanRangeText?: string;
  disclaimer: string;
  barData: CycleBarData[];
  expectedStartDate?: string;
  expectedEndDate?: string;
}

/**
 * Parses YYYY-MM-DD or ISO string into a local midnight Date
 */
export function parseDateOnly(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * Adds days to a date string and returns a Date
 */
export function addDaysToDate(dateStr: string, days: number): Date {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Format date for cycle ranges (e.g., "14 Nov" or "14 Nov 2026" if different year)
 */
export function formatRangeDate(d: Date): string {
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const year = d.getFullYear();
  const currentYear = new Date().getFullYear();
  if (year !== currentYear) {
    return `${day} ${month} ${year}`;
  }
  return `${day} ${month}`;
}

/**
 * Computes median of a numbers array
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid];
  }
  return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Computes cycle lengths between consecutive start dates
 */
export function calculateCycleLengths(periods: PeriodLog[]): number[] {
  // Sort ascending by start_date
  const sorted = [...periods]
    .filter(p => !!p.start_date)
    .sort((a, b) => parseDateOnly(a.start_date).getTime() - parseDateOnly(b.start_date).getTime());

  const lengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = parseDateOnly(sorted[i].start_date).getTime();
    const d2 = parseDateOnly(sorted[i + 1].start_date).getTime();
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff < 365) {
      lengths.push(diff);
    }
  }
  return lengths;
}

/**
 * Main cycle engine evaluation
 */
export function evaluateCycle(
  periodLogs: PeriodLog[],
  profile: Profile | null,
  config = CYCLE_CONFIG
): CycleEngineResult {
  const disclaimer = config.messages.disclaimer;

  // 1. Check suppression criteria
  if (profile?.tracks_periods === false) {
    return {
      isSuppressed: true,
      suppressionReason: config.messages.pausedTracksPeriods,
      hasEnoughCycles: false,
      cycleCount: 0,
      recentCycleLengths: [],
      rangeText: config.messages.pausedTracksPeriods,
      isLaterThanRange: false,
      disclaimer,
      barData: []
    };
  }

  const stages = profile?.stages || [];
  if (stages.includes('menopause')) {
    return {
      isSuppressed: true,
      suppressionReason: config.messages.pausedMenopause,
      hasEnoughCycles: false,
      cycleCount: 0,
      recentCycleLengths: [],
      rangeText: config.messages.pausedMenopause,
      isLaterThanRange: false,
      disclaimer,
      barData: []
    };
  }

  // Check pregnancy mode suppression
  const isPregnancyContentHidden =
    profile?.hide_pregnancy_content === true ||
    (profile?.id && typeof window !== 'undefined'
      ? localStorage.getItem(`mama_root_hide_pregnancy_${profile.id}`) === 'true'
      : false);

  if (stages.includes('pregnant') && !isPregnancyContentHidden) {
    return {
      isSuppressed: true,
      suppressionReason: config.messages.pausedPregnancy,
      hasEnoughCycles: false,
      cycleCount: 0,
      recentCycleLengths: [],
      rangeText: config.messages.pausedPregnancy,
      isLaterThanRange: false,
      disclaimer,
      barData: []
    };
  }

  // 2. Filter and sort periods ascending
  const validPeriods = [...periodLogs]
    .filter(p => !!p.start_date)
    .sort((a, b) => parseDateOnly(a.start_date).getTime() - parseDateOnly(b.start_date).getTime());

  // 3. Cycle lengths between consecutive start dates
  const allCycleLengths = calculateCycleLengths(validPeriods);
  const recentCycleLengths = allCycleLengths.slice(-config.maxRecentCyclesToAnalyze);
  const cycleCount = recentCycleLengths.length;

  // 4. Calculate Current Cycle Day from most recent start date
  let lastStartDate: string | undefined;
  let currentCycleDay: number | null = null;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (validPeriods.length > 0) {
    const mostRecentPeriod = validPeriods[validPeriods.length - 1];
    lastStartDate = mostRecentPeriod.start_date;
    const lastStartMidnight = parseDateOnly(lastStartDate);
    const diffDays = Math.round((todayMidnight.getTime() - lastStartMidnight.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) {
      currentCycleDay = diffDays + 1; // Start day is Cycle day 1
    }
  }

  // 5. Fewer than 3 cycles
  if (cycleCount < config.minCyclesForRange) {
    let profileCycleText: string | undefined;
    if (profile?.cycle_length_days) {
      profileCycleText = config.messages.profileCycleText(profile.cycle_length_days);
    }

    return {
      isSuppressed: false,
      hasEnoughCycles: false,
      cycleCount,
      recentCycleLengths,
      lastStartDate,
      currentCycleDay,
      rangeText: config.messages.fewerThanThreeCycles,
      profileCycleText,
      isLaterThanRange: false,
      disclaimer,
      barData: []
    };
  }

  // 6. 3 or more cycles: Calculate statistics
  const shortest = Math.min(...recentCycleLengths);
  const longest = Math.max(...recentCycleLengths);
  const typical = calculateMedian(recentCycleLengths);

  // Bar chart data for each of her last 6 cycle lengths
  const maxBarLength = Math.max(...recentCycleLengths, 1);
  const barData: CycleBarData[] = recentCycleLengths.map((len, idx) => ({
    cycleIndex: idx + 1,
    days: len,
    isShortest: len === shortest,
    isLongest: len === longest,
    percentage: Math.max(18, Math.round((len / maxBarLength) * 100))
  }));

  if (!lastStartDate) {
    return {
      isSuppressed: false,
      hasEnoughCycles: true,
      cycleCount,
      recentCycleLengths,
      shortest,
      longest,
      typical,
      rangeText: config.messages.fewerThanThreeCycles,
      isLaterThanRange: false,
      disclaimer,
      barData
    };
  }

  // Determine Range
  let expectedStart: Date;
  let expectedEnd: Date;
  let rangeText = '';

  const cycleDiff = longest - shortest;
  if (cycleDiff <= config.regularCycleDiffThresholdDays) {
    expectedStart = addDaysToDate(lastStartDate, typical - config.regularCycleToleranceDays);
    expectedEnd = addDaysToDate(lastStartDate, typical + config.regularCycleToleranceDays);
    rangeText = config.messages.narrowRange(
      formatRangeDate(expectedStart),
      formatRangeDate(expectedEnd)
    );
  } else {
    expectedStart = addDaysToDate(lastStartDate, shortest);
    expectedEnd = addDaysToDate(lastStartDate, longest);
    rangeText = config.messages.variableRange(
      shortest,
      longest,
      formatRangeDate(expectedStart),
      formatRangeDate(expectedEnd)
    );
  }

  // Check if today is after the end of the range
  const isLaterThanRange = todayMidnight.getTime() > expectedEnd.getTime();
  const laterThanRangeText = isLaterThanRange ? config.messages.laterThanRange : undefined;

  return {
    isSuppressed: false,
    hasEnoughCycles: true,
    cycleCount,
    recentCycleLengths,
    shortest,
    longest,
    typical,
    lastStartDate,
    currentCycleDay,
    rangeText,
    isLaterThanRange,
    laterThanRangeText,
    disclaimer,
    barData,
    expectedStartDate: expectedStart.toISOString().split('T')[0],
    expectedEndDate: expectedEnd.toISOString().split('T')[0]
  };
}
