import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Check, 
  Trash2, 
  Edit3, 
  Clock, 
  Droplet, 
  Plus, 
  X,
  ChevronDown
} from 'lucide-react';
import { supabase, PeriodLog } from '../lib/supabase';
import { formatDate, cn } from '../lib/utils';
import { parseDateOnly } from '../lib/cycleEngine';

const FLOW_OPTIONS = [
  'Spotting',
  'Light',
  'Medium',
  'Heavy',
  'Very heavy'
] as const;

interface PeriodLoggingCardProps {
  userId: string;
  onPeriodsUpdated?: () => void;
}

export default function PeriodLoggingCard({ userId, onPeriodsUpdated }: PeriodLoggingCardProps) {
  const [periodDate, setPeriodDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedFlow, setSelectedFlow] = useState<string>('Medium');
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit State
  const [editingPeriod, setEditingPeriod] = useState<PeriodLog | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editFlow, setEditFlow] = useState<string>('');

  useEffect(() => {
    if (userId) {
      fetchPeriods();
    }
  }, [userId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function fetchPeriods() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });

      if (error) {
        console.warn('Error fetching period_logs:', error);
      }
      setPeriods(data || []);
    } catch (err) {
      console.error('Fetch periods error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Active / open period is one without end_date
  const openPeriod = periods.find(p => !p.end_date);

  // 1. My period started
  const handlePeriodStarted = async () => {
    if (!userId || !periodDate) return;
    try {
      setSaving(true);
      const { error } = await supabase.from('period_logs').insert({
        user_id: userId,
        start_date: periodDate,
        flow: selectedFlow,
        end_date: null
      });

      if (error) throw error;

      showToast('Period start recorded.');
      await fetchPeriods();
      onPeriodsUpdated?.();
    } catch (err) {
      console.error('Error recording period start:', err);
      showToast('Could not save period start. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // 2. My period ended
  const handlePeriodEnded = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      if (openPeriod?.id) {
        // Close the currently active open period
        const { error } = await supabase
          .from('period_logs')
          .update({
            end_date: periodDate
          })
          .eq('id', openPeriod.id);

        if (error) throw error;
        showToast('Period end recorded.');
      } else if (periods.length > 0) {
        // Fallback: set end date on the most recent period
        const mostRecent = periods[0];
        const { error } = await supabase
          .from('period_logs')
          .update({
            end_date: periodDate
          })
          .eq('id', mostRecent.id);

        if (error) throw error;
        showToast('Period end recorded on latest cycle.');
      } else {
        showToast('No active period found. Log a start date first.');
      }

      await fetchPeriods();
      onPeriodsUpdated?.();
    } catch (err) {
      console.error('Error recording period end:', err);
      showToast('Could not record period end. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Delete period
  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('period_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showToast('Period entry removed.');
      await fetchPeriods();
      onPeriodsUpdated?.();
    } catch (err) {
      console.error('Error deleting period:', err);
      showToast('Could not delete period. Please retry.');
    }
  };

  // 4. Save edits
  const handleSaveEdit = async () => {
    if (!editingPeriod?.id || !editStartDate) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('period_logs')
        .update({
          start_date: editStartDate,
          end_date: editEndDate || null,
          flow: editFlow || null
        })
        .eq('id', editingPeriod.id);

      if (error) throw error;

      showToast('Period updated successfully.');
      setEditingPeriod(null);
      await fetchPeriods();
      onPeriodsUpdated?.();
    } catch (err) {
      console.error('Error saving period edit:', err);
      showToast('Could not save changes. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate gaps between consecutive periods in days
  const chronologicalPeriods = [...periods].sort((a, b) => 
    parseDateOnly(a.start_date).getTime() - parseDateOnly(b.start_date).getTime()
  );

  const gapMap = new Map<string, number | null>();
  for (let i = 0; i < chronologicalPeriods.length; i++) {
    const curr = chronologicalPeriods[i];
    if (i === 0) {
      gapMap.set(curr.id || `${curr.start_date}-${i}`, null);
    } else {
      const prev = chronologicalPeriods[i - 1];
      const dPrev = parseDateOnly(prev.start_date).getTime();
      const dCurr = parseDateOnly(curr.start_date).getTime();
      const gapDays = Math.round((dCurr - dPrev) / (1000 * 60 * 60 * 24));
      gapMap.set(curr.id || `${curr.start_date}-${i}`, gapDays > 0 ? gapDays : null);
    }
  }

  // Display last 6 periods newest first
  const displayPeriods = periods.slice(0, 6);

  return (
    <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-5 shadow-xs">
      
      {/* Toast */}
      {toastMessage && (
        <div className="p-3 bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#3F4318]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
            <Droplet className="w-4 h-4 text-[#3B1409]" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-serif text-[#3B1409]">Period Logging</h2>
            <p className="text-[11px] text-[#6B4A3A]">
              Log your start and end dates to predict your personalized cycle range.
            </p>
          </div>
        </div>

        {openPeriod && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#F8DFC8] text-[#7A2E10] border border-[#E0A77A] animate-pulse">
            Period active
          </span>
        )}
      </div>

      {/* Date Picker Input (Defaults to today, can choose earlier date for past periods) */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
          Date (Today or past date)
        </label>
        <div className="relative">
          <input
            type="date"
            value={periodDate}
            onChange={(e) => setPeriodDate(e.target.value)}
            className="input-field text-sm"
          />
        </div>
      </div>

      {/* Optional Flow Chips */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
          Flow (Optional)
        </label>
        <div className="flex flex-wrap gap-2">
          {FLOW_OPTIONS.map((flow) => {
            const isSelected = selectedFlow === flow;
            return (
              <button
                key={flow}
                type="button"
                onClick={() => setSelectedFlow(isSelected ? '' : flow)}
                className={cn(
                  "min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus-ring",
                  isSelected
                    ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                {flow}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons: 'My period started' & 'My period ended' */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          disabled={saving}
          onClick={handlePeriodStarted}
          className="btn-primary min-h-[48px] flex items-center justify-center gap-1.5"
        >
          <Droplet className="w-4 h-4 text-white" />
          <span>My period started</span>
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handlePeriodEnded}
          className="btn-secondary min-h-[48px] flex items-center justify-center gap-1.5"
        >
          <Check className="w-4 h-4 text-[#A9421B]" />
          <span>My period ended</span>
        </button>
      </div>

      {/* Edit Modal / Form if active */}
      {editingPeriod && (
        <div className="p-4 bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
              Edit Period Entry
            </h3>
            <button
              type="button"
              onClick={() => setEditingPeriod(null)}
              className="text-[#6B4A3A] hover:text-[#3B1409] p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] font-bold text-[#6B4A3A] block mb-1">Start Date</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-[#6B4A3A] block mb-1">End Date (optional)</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="input-field text-xs"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[#6B4A3A] block mb-1">Flow</label>
            <div className="flex flex-wrap gap-1.5">
              {FLOW_OPTIONS.map((fl) => (
                <button
                  key={fl}
                  type="button"
                  onClick={() => setEditFlow(fl)}
                  className={cn(
                    "text-[11px] px-3 py-1 rounded-full border transition-all",
                    editFlow === fl
                      ? "bg-[#A9421B] text-white border-[#A9421B]"
                      : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                  )}
                >
                  {fl}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="btn-primary flex-1 py-2 text-xs"
            >
              Save changes
            </button>
            <button
              type="button"
              onClick={() => setEditingPeriod(null)}
              className="btn-secondary px-3 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List of last 6 periods */}
      <div className="space-y-2.5 pt-2 border-t border-[#EAD5C0]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
            Last 6 Logged Periods
          </span>
          <span className="text-[11px] text-[#6B4A3A]">
            {periods.length} total recorded
          </span>
        </div>

        {loading ? (
          <div className="text-center py-4 text-xs text-[#6B4A3A]">
            Loading period history...
          </div>
        ) : displayPeriods.length > 0 ? (
          <div className="space-y-2">
            {displayPeriods.map((p, idx) => {
              const key = p.id || `${p.start_date}-${idx}`;
              const gap = gapMap.get(key);

              // Calculate length in days
              let lengthText = 'Ongoing';
              if (p.end_date) {
                const d1 = parseDateOnly(p.start_date).getTime();
                const d2 = parseDateOnly(p.end_date).getTime();
                const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
                const days = Math.max(1, diff + 1);
                lengthText = `${days} day${days === 1 ? '' : 's'}`;
              }

              return (
                <div
                  key={key}
                  className="p-3.5 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#3B1409]">
                        {formatDate(p.start_date)}
                      </span>
                      {p.flow && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F6E7D8] text-[#3B1409] border border-[#EAD5C0]">
                          {p.flow}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#6B4A3A] flex items-center gap-2 flex-wrap">
                      <span>Length: {lengthText}</span>
                      <span>•</span>
                      <span>
                        Gap since previous: {gap !== null && gap !== undefined ? `${gap} days` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPeriod(p);
                        setEditStartDate(p.start_date);
                        setEditEndDate(p.end_date || '');
                        setEditFlow(p.flow || '');
                      }}
                      className="p-2 text-[#6B4A3A] hover:text-[#3B1409] hover:bg-[#F6E7D8] focus-ring rounded-lg transition-colors"
                      title="Edit period entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-[#6B4A3A] hover:text-[#833518] hover:bg-[#F8DFC8] focus-ring rounded-lg transition-colors"
                      title="Delete period entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl text-center text-xs text-[#6B4A3A]">
            No periods logged yet. Tap "My period started" above to record your first cycle.
          </div>
        )}
      </div>

    </div>
  );
}
