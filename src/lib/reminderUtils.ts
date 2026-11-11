import { Reminder } from './supabase';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type Weekday = typeof WEEKDAYS[number];

export const REMINDER_TYPES = [
  'Medication',
  'Appointment',
  'Log my symptoms',
  'Other'
] as const;
export type ReminderType = typeof REMINDER_TYPES[number];

/**
 * Gets today's 3-letter weekday abbreviation ('Mon', 'Tue', etc.)
 */
export function getTodayWeekday(): string {
  const dayIdx = new Date().getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const map = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return map[dayIdx];
}

/**
 * Checks if a reminder is active and scheduled for today
 */
export function isReminderDueToday(reminder: Reminder): boolean {
  if (!reminder.is_enabled) return false;
  const today = getTodayWeekday();
  return Array.isArray(reminder.weekdays) && reminder.weekdays.includes(today);
}

/**
 * Checks if an appointment timestamp is within the next 24 hours from now
 */
export function isAppointmentInNext24Hours(dateStr: string): boolean {
  if (!dateStr) return false;
  const apptTime = new Date(dateStr).getTime();
  if (isNaN(apptTime)) return false;
  const now = Date.now();
  const in24Hours = now + 24 * 60 * 60 * 1000;
  return apptTime >= now && apptTime <= in24Hours;
}

/**
 * Reads the 'Show details in notifications' setting (defaults to false)
 */
export function getShowDetailsSetting(userId: string): boolean {
  try {
    const val = localStorage.getItem(`mama_root_show_reminder_details_${userId}`);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves the 'Show details in notifications' setting
 */
export function setShowDetailsSetting(userId: string, enabled: boolean): void {
  try {
    localStorage.setItem(`mama_root_show_reminder_details_${userId}`, String(enabled));
  } catch {
    // ignore
  }
}

/**
 * Safely requests browser notification permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    return await Notification.requestPermission();
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Fires a browser notification while the app is open.
 * Strictly adheres to rule:
 * - Default text: 'Mama Root: time for your reminder.'
 * - If 'Show details in notifications' is ON: includes the reminder title.
 * - Never includes symptoms or private health details.
 */
export function triggerReminderNotification(reminder: Reminder, userId: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const showDetails = getShowDetailsSetting(userId);
  const notificationTitle = 'Mama Root';
  const notificationBody = showDetails && reminder.title
    ? `Reminder: ${reminder.title}`
    : 'Mama Root: time for your reminder.';

  try {
    new Notification(notificationTitle, {
      body: notificationBody,
      icon: '/favicon.ico',
      tag: `reminder-${reminder.id || 'single'}`
    });
  } catch (err) {
    console.warn('Could not display notification:', err);
  }
}
