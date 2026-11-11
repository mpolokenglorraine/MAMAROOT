import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase, Reminder } from '../lib/supabase';
import { 
  getTodayWeekday, 
  triggerReminderNotification, 
  getShowDetailsSetting 
} from '../lib/reminderUtils';
import { Bell, X } from 'lucide-react';

export default function ReminderWatcher() {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [activeBanner, setActiveBanner] = useState<{ id: string; message: string } | null>(null);
  const firedMinutesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.id) return;

    loadReminders();

    // Listen for custom event when reminders are updated in Settings
    const handleRemindersUpdated = () => {
      loadReminders();
    };
    window.addEventListener('mama_root_reminders_updated', handleRemindersUpdated);

    return () => {
      window.removeEventListener('mama_root_reminders_updated', handleRemindersUpdated);
    };
  }, [profile?.id]);

  async function loadReminders() {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', profile.id)
        .eq('is_enabled', true);
      if (data) {
        setReminders(data);
      }
    } catch {
      // ignore
    }
  }

  // Interval ticker that checks current minute
  useEffect(() => {
    if (!profile?.id || reminders.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      const currentWeekday = getTodayWeekday();
      const dateKey = now.toISOString().split('T')[0];

      reminders.forEach((r) => {
        if (!r.is_enabled) return;
        const matchesDay = Array.isArray(r.weekdays) && r.weekdays.includes(currentWeekday);
        if (matchesDay && r.time === currentTime) {
          const fireKey = `${r.id || r.title}_${dateKey}_${currentTime}`;
          if (!firedMinutesRef.current.has(fireKey)) {
            firedMinutesRef.current.add(fireKey);

            // 1. Browser Notification (if granted)
            triggerReminderNotification(r, profile.id);

            // 2. Gentle In-App Toast Banner
            const showDetails = getShowDetailsSetting(profile.id);
            const bannerText = showDetails && r.title 
              ? `Reminder: ${r.title}` 
              : 'Mama Root: time for your reminder.';

            setActiveBanner({
              id: fireKey,
              message: bannerText
            });

            // Auto-hide banner after 10 seconds
            setTimeout(() => {
              setActiveBanner((curr) => (curr?.id === fireKey ? null : curr));
            }, 10000);
          }
        }
      });
    };

    // Run check immediately, then every 15 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 15000);

    return () => clearInterval(interval);
  }, [profile?.id, reminders]);

  if (!activeBanner) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-[#572D43] text-white p-3.5 rounded-2xl shadow-lg border border-[#914E61] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-semibold truncate leading-tight">
            {activeBanner.message}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveBanner(null)}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 shrink-0"
          aria-label="Close notification banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
