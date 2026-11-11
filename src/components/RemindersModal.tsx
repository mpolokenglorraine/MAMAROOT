import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Bell, 
  Trash2, 
  Edit3, 
  Clock, 
  Check, 
  AlertCircle, 
  Loader2, 
  Calendar,
  Pill,
  Activity,
  CalendarCheck,
  Tag
} from 'lucide-react';
import { supabase, Reminder } from '../lib/supabase';
import { 
  WEEKDAYS, 
  Weekday, 
  REMINDER_TYPES, 
  ReminderType,
  getShowDetailsSetting, 
  setShowDetailsSetting, 
  requestBrowserNotificationPermission 
} from '../lib/reminderUtils';
import { useT } from '../i18n/useT';

interface RemindersModalProps {
  userId: string;
  onClose: () => void;
}

export default function RemindersModal({ userId, onClose }: RemindersModalProps) {
  const { t } = useT();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Notification setting
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');

  // Form state
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<ReminderType>('Medication');
  const [time, setTime] = useState<string>('09:00');
  const [selectedWeekdays, setSelectedWeekdays] = useState<Weekday[]>([...WEEKDAYS]);
  const [saving, setSaving] = useState<boolean>(false);

  // Permission prompt state for first reminder
  const [showPermissionPrompt, setShowPermissionPrompt] = useState<boolean>(false);
  const [pendingSavePayload, setPendingSavePayload] = useState<Partial<Reminder> | null>(null);

  useEffect(() => {
    loadReminders();
    setShowDetails(getShowDetailsSetting(userId));
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, [userId]);

  async function loadReminders() {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('time', { ascending: true });

      if (error) throw error;
      if (data) setReminders(data);
    } catch (err: any) {
      console.warn('Could not load reminders:', err);
    } finally {
      setLoading(false);
    }
  }

  const broadcastUpdated = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('mama_root_reminders_updated'));
    }
  };

  const handleToggleDetailsSetting = (newVal: boolean) => {
    setShowDetails(newVal);
    setShowDetailsSetting(userId, newVal);
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setTitle('');
    setType('Medication');
    setTime('09:00');
    // All weekday chips selected by default
    setSelectedWeekdays([...WEEKDAYS]);
    setShowForm(true);
    setErrorMsg(null);
  };

  const handleOpenEditForm = (reminder: Reminder) => {
    setEditingId(reminder.id || null);
    setTitle(reminder.title);
    setType((reminder.type as ReminderType) || 'Medication');
    setTime(reminder.time || '09:00');
    setSelectedWeekdays(
      Array.isArray(reminder.weekdays) && reminder.weekdays.length > 0 
        ? (reminder.weekdays as Weekday[]) 
        : [...WEEKDAYS]
    );
    setShowForm(true);
    setErrorMsg(null);
  };

  const handleToggleWeekday = (day: Weekday) => {
    if (selectedWeekdays.includes(day)) {
      if (selectedWeekdays.length === 1) {
        // keep at least 1 day
        return;
      }
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  // Toggle is_enabled on/off switch for a reminder
  const handleToggleSwitch = async (reminder: Reminder) => {
    if (!reminder.id) return;
    const nextState = !reminder.is_enabled;

    // Optimistic update
    setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, is_enabled: nextState } : r));

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_enabled: nextState })
        .eq('id', reminder.id)
        .eq('user_id', userId);

      if (error) throw error;
      broadcastUpdated();
    } catch (err) {
      console.error('Failed to toggle reminder:', err);
      // Rollback
      setReminders(prev => prev.map(r => r.id === reminder.id ? { ...r, is_enabled: !nextState } : r));
    }
  };

  // Delete a reminder
  const handleDelete = async (reminder: Reminder) => {
    if (!reminder.id) return;
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminder.id)
        .eq('user_id', userId);

      if (error) throw error;
      setReminders(prev => prev.filter(r => r.id !== reminder.id));
      broadcastUpdated();
    } catch (err: any) {
      console.error('Failed to delete reminder:', err);
      setErrorMsg('Could not delete reminder. Please try again.');
    }
  };

  // Pre-save check for first reminder notification permission
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a reminder title.');
      return;
    }

    const payload: Partial<Reminder> = {
      user_id: userId,
      title: title.trim(),
      type,
      time,
      weekdays: selectedWeekdays,
      is_enabled: true
    };

    // Check if first reminder and notification permission not yet resolved
    const isFirstReminder = reminders.length === 0;
    const needsPermissionPrompt = typeof window !== 'undefined' 
      && 'Notification' in window 
      && Notification.permission === 'default' 
      && (isFirstReminder || !editingId);

    if (needsPermissionPrompt) {
      setPendingSavePayload(payload);
      setShowPermissionPrompt(true);
      return;
    }

    await executeSave(payload);
  };

  const executeSave = async (payload: Partial<Reminder>) => {
    try {
      setSaving(true);
      setErrorMsg(null);

      if (editingId) {
        const { error } = await supabase
          .from('reminders')
          .update(payload)
          .eq('id', editingId)
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert([payload]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingId(null);
      await loadReminders();
      broadcastUpdated();
    } catch (err: any) {
      console.error('Error saving reminder:', err);
      setErrorMsg(err.message || 'Could not save reminder. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleGrantPermissionAndSave = async () => {
    setShowPermissionPrompt(false);
    const perm = await requestBrowserNotificationPermission();
    setNotifPermission(perm);
    if (pendingSavePayload) {
      await executeSave(pendingSavePayload);
      setPendingSavePayload(null);
    }
  };

  const handleSkipPermissionAndSave = async () => {
    setShowPermissionPrompt(false);
    if (pendingSavePayload) {
      await executeSave(pendingSavePayload);
      setPendingSavePayload(null);
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'Medication':
        return <Pill className="w-4 h-4 text-[#3B1409]" />;
      case 'Appointment':
        return <CalendarCheck className="w-4 h-4 text-[#3B1409]" />;
      case 'Log my symptoms':
        return <Activity className="w-4 h-4 text-[#3B1409]" />;
      default:
        return <Tag className="w-4 h-4 text-[#3B1409]" />;
    }
  };

  const formatWeekdaysLabel = (days: string[]) => {
    if (!days || days.length === 0) return 'No days selected';
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && !days.includes('Sat') && !days.includes('Sun')) return 'Weekdays';
    if (days.length === 2 && days.includes('Sat') && days.includes('Sun')) return 'Weekends';
    return days.join(', ');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-lg p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409]">
              <Bell className="w-4 h-4 text-[#3B1409]" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              Reminders
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mandatory Plain Note */}
        <div className="bg-[#F6E7D8] border border-[#EAD5C0] p-3.5 rounded-2xl text-xs text-[#3B1409] leading-relaxed">
          <p className="font-medium">
            {t('reminders_note')}
          </p>
        </div>

        {/* Notification Privacy Setting */}
        <div className="bg-white border border-[#EAD5C0] rounded-3xl p-4.5 space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#3B1409] block">
                {t('show_details_notifications')}
              </span>
              <p className="text-[11px] text-[#6B4A3A] mt-0.5 leading-snug">
                {showDetails 
                  ? 'Notifications include the reminder title.' 
                  : 'Notifications say "Mama Root: time for your reminder." No titles or health details are shown.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showDetails}
              onClick={() => handleToggleDetailsSetting(!showDetails)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 focus-ring ${
                showDetails ? 'bg-[#A9421B]' : 'bg-[#EAD5C0]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  showDetails ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {notifPermission === 'default' && (
            <div className="pt-2 border-t border-[#EAD5C0] flex items-center justify-between text-xs">
              <span className="text-[#6B4A3A] text-[11px]">Browser permissions not yet enabled</span>
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestBrowserNotificationPermission();
                  setNotifPermission(perm);
                }}
                className="text-xs font-semibold text-[#A9421B] hover:text-[#833518] hover:underline"
              >
                Enable nudges
              </button>
            </div>
          )}
        </div>

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add Reminder Button (when form is hidden) */}
        {!showForm && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
              Your Reminders ({reminders.length})
            </span>
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a reminder</span>
            </button>
          </div>
        )}

        {/* ADD / EDIT REMINDER FORM */}
        {showForm && (
          <form onSubmit={handleSaveForm} className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-4 animate-in fade-in shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#EAD5C0]">
              <h3 className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
                {editingId ? 'Edit reminder' : 'New reminder'}
              </h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-[#6B4A3A] hover:text-[#3B1409]"
              >
                Cancel
              </button>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B1409] block">
                Reminder title <span className="text-[#A9421B]">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Iron supplement, Pelvic clinic visit, Check symptoms"
                className="input-field text-sm"
                required
              />
            </div>

            {/* Type Chips */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3B1409] block">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {REMINDER_TYPES.map((t) => {
                  const isSelected = type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs'
                          : 'bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#E3F1DA]'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3B1409] block">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="input-field text-sm"
                required
              />
            </div>

            {/* Weekday Chips (All selected by default) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Repeat on
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWeekdays([...WEEKDAYS])}
                    className="text-[10px] text-[#A9421B] font-semibold hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWeekdays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])}
                    className="text-[10px] text-[#A9421B] font-semibold hover:underline"
                  >
                    Weekdays
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => {
                  const isSelected = selectedWeekdays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleToggleWeekday(day)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs'
                          : 'bg-white text-[#6B4A3A] border-[#B89A82] hover:bg-[#E3F1DA]'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary flex-1 text-xs py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="btn-primary flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save reminder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* LIST OF REMINDERS */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-6 bg-white border border-[#EAD5C0] rounded-3xl flex items-center justify-center text-xs text-[#6B4A3A]">
              <Loader2 className="w-4 h-4 text-[#A9421B] animate-spin mr-2" />
              Loading reminders...
            </div>
          ) : reminders.length === 0 && !showForm ? (
            <div className="bg-white border border-dashed border-[#EAD5C0] rounded-3xl p-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center mx-auto">
                <Bell className="w-5 h-5 text-[#3B1409]" />
              </div>
              <h3 className="text-sm font-bold font-serif text-[#3B1409]">No reminders set</h3>
              <p className="text-xs text-[#6B4A3A] max-w-xs mx-auto">
                Set gentle nudges for medications, symptom tracking, or upcoming clinic appointments.
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenAddForm}
                  className="btn-secondary text-xs py-2 px-3 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set your first reminder</span>
                </button>
              </div>
            </div>
          ) : (
            reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-4 rounded-3xl border transition-all flex items-start justify-between gap-3 ${
                  reminder.is_enabled
                    ? 'bg-white border-[#EAD5C0] shadow-xs'
                    : 'bg-[#F6E7D8]/50 border-[#EAD5C0] opacity-70'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#F7CCA5] flex items-center justify-center shrink-0 mt-0.5 text-[#3B1409]">
                    {getTypeIcon(reminder.type)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#3B1409] truncate block">
                        {reminder.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F6E7D8] text-[#3B1409] border border-[#EAD5C0] shrink-0">
                        {reminder.type}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B4A3A]">
                      <span className="flex items-center gap-1 font-semibold text-[#3B1409]">
                        <Clock className="w-3 h-3 text-[#A9421B]" />
                        <span>{reminder.time}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#A9421B]" />
                        <span>{formatWeekdaysLabel(reminder.weekdays)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right controls: switch, edit, delete */}
                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditForm(reminder)}
                    className="p-1.5 text-[#6B4A3A] hover:text-[#3B1409] hover:bg-[#F6E7D8] rounded-lg transition-colors"
                    title="Edit reminder"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(reminder)}
                    className="p-1.5 text-[#6B4A3A] hover:text-[#833518] hover:bg-[#F8DFC8] rounded-lg transition-colors"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* On/Off Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reminder.is_enabled}
                    onClick={() => handleToggleSwitch(reminder)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors focus-ring ml-1 ${
                      reminder.is_enabled ? 'bg-[#A9421B]' : 'bg-[#EAD5C0]'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                        reminder.is_enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full text-xs"
          >
            Done
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FIRST REMINDER BROWSER PERMISSION PROMPT */}
      {/* ========================================================================= */}
      {showPermissionPrompt && (
        <div 
          className="fixed inset-0 z-60 bg-[#3B1409]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center mx-auto">
              <Bell className="w-5 h-5 text-[#3B1409]" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                Enable browser reminders?
              </h3>
              <p className="text-xs text-[#3B1409] leading-relaxed">
                Mama Root can nudge you while the app is open.
              </p>
              <p className="text-[11px] text-[#6B4A3A]">
                By default, nudges say "Mama Root: time for your reminder." No personal health details appear in notifications.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleGrantPermissionAndSave}
                className="btn-primary w-full text-xs py-2.5"
              >
                Allow nudges
              </button>
              <button
                type="button"
                onClick={handleSkipPermissionAndSave}
                className="btn-secondary w-full text-xs py-2"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
