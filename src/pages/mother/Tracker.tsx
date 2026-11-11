import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Check, 
  Clock, 
  Trash2,
  Calendar,
  Droplet,
  AlertCircle
} from 'lucide-react';
import { supabase, Symptom, PeriodLog } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { useT } from '../../i18n/useT';

const SYMPTOM_CHIPS = [
  'Cramps',
  'Pelvic pain',
  'Bloating',
  'Back pain',
  'Heavy bleeding',
  'Spotting',
  'Nausea',
  'Headache',
  'Fatigue',
  'Mood changes',
  'Breast tenderness',
  'Other'
];

const FLOW_CHIPS = ['Spotting', 'Light', 'Medium', 'Heavy', 'Very heavy'] as const;

export default function Tracker() {
  const { t } = useT();
  const { profile, refetchProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  // Symptoms state
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [logDate, setLogDate] = useState(initialDate);
  const [severity, setSeverity] = useState<number>(3);
  const [notes, setNotes] = useState('');
  const [savingSymptoms, setSavingSymptoms] = useState(false);
  const [symptomSuccess, setSymptomSuccess] = useState(false);
  const [symptomError, setSymptomError] = useState<string | null>(null);

  // Period card state
  const [periodStartDate, setPeriodStartDate] = useState(initialDate);
  const [periodEndDate, setPeriodEndDate] = useState(initialDate);
  const [periodFlow, setPeriodFlow] = useState<string | null>(null);
  const [savingPeriod, setSavingPeriod] = useState(false);
  const [periodSuccessMsg, setPeriodSuccessMsg] = useState<string | null>(null);
  const [periodErrorMsg, setPeriodErrorMsg] = useState<string | null>(null);
  const [activePeriodTab, setActivePeriodTab] = useState<'start' | 'end'>('start');

  // Recent logs
  const [recentSymptoms, setRecentSymptoms] = useState<Symptom[]>([]);
  const [recentPeriods, setRecentPeriods] = useState<PeriodLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      loadHistory();
    }
  }, [profile?.id]);

  async function loadHistory() {
    try {
      setLoadingHistory(true);
      const [sympRes, periodRes] = await Promise.all([
        supabase
          .from('symptoms')
          .select('*')
          .eq('user_id', profile!.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('period_logs')
          .select('*')
          .eq('user_id', profile!.id)
          .order('start_date', { ascending: false })
          .limit(5)
      ]);

      if (sympRes.data) setRecentSymptoms(sympRes.data);
      if (periodRes.data) setRecentPeriods(periodRes.data);
    } catch (err) {
      console.error('Error loading tracker history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }

  // Toggle multi-select symptom chips
  function toggleChip(chip: string) {
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip) 
        : [...prev, chip]
    );
  }

  // Handle saving period start
  async function handlePeriodStart(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setSavingPeriod(true);
      setPeriodErrorMsg(null);

      const { error } = await supabase.from('period_logs').insert({
        user_id: profile.id,
        start_date: periodStartDate,
        flow: periodFlow,
      });

      if (error) throw error;

      // Also update last_period_date on users profile
      await supabase
        .from('users')
        .update({ last_period_date: periodStartDate })
        .eq('id', profile.id);

      await refetchProfile();
      setPeriodSuccessMsg(`Period start recorded for ${formatDate(periodStartDate)}.`);
      setTimeout(() => setPeriodSuccessMsg(null), 4000);
      loadHistory();
    } catch (err: any) {
      console.error('Error recording period start:', err);
      setPeriodErrorMsg('Could not record period start. Please try again.');
    } finally {
      setSavingPeriod(false);
    }
  }

  // Handle saving period end
  async function handlePeriodEnd(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      setSavingPeriod(true);
      setPeriodErrorMsg(null);

      // Find the most recent period log that does not have an end date
      const { data: openPeriods } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', profile.id)
        .is('end_date', null)
        .order('start_date', { ascending: false })
        .limit(1);

      if (openPeriods && openPeriods.length > 0) {
        const targetId = openPeriods[0].id;
        const { error } = await supabase
          .from('period_logs')
          .update({ end_date: periodEndDate })
          .eq('id', targetId);
        if (error) throw error;
      } else {
        // Fallback: update most recent period log or insert with start=end
        const { data: latest } = await supabase
          .from('period_logs')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_date', { ascending: false })
          .limit(1);

        if (latest && latest.length > 0) {
          await supabase
            .from('period_logs')
            .update({ end_date: periodEndDate })
            .eq('id', latest[0].id);
        } else {
          await supabase.from('period_logs').insert({
            user_id: profile.id,
            start_date: periodEndDate,
            end_date: periodEndDate
          });
        }
      }

      setPeriodSuccessMsg(`Period end recorded for ${formatDate(periodEndDate)}.`);
      setTimeout(() => setPeriodSuccessMsg(null), 4000);
      loadHistory();
    } catch (err: any) {
      console.error('Error recording period end:', err);
      setPeriodErrorMsg('Could not record period end. Please try again.');
    } finally {
      setSavingPeriod(false);
    }
  }

  // Handle saving symptoms
  async function handleSaveSymptoms(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    if (selectedChips.length === 0) {
      setSymptomError('Please select at least one symptom chip.');
      return;
    }

    try {
      setSavingSymptoms(true);
      setSymptomError(null);

      // Required: created_at = the chosen date at noon
      const noonTimestamp = `${logDate}T12:00:00`;

      // Insert ONE row in symptoms for EACH selected symptom
      const rowsToInsert = selectedChips.map(chip => {
        const finalType = chip === 'Other' ? (otherText.trim() || 'Other') : chip;
        return {
          user_id: profile.id,
          type: finalType,
          severity: severity,
          notes: notes.trim() || null,
          created_at: noonTimestamp
        };
      });

      const { error } = await supabase.from('symptoms').insert(rowsToInsert);
      if (error) throw error;

      setSelectedChips([]);
      setOtherText('');
      setNotes('');
      setSymptomSuccess(true);
      setTimeout(() => setSymptomSuccess(false), 3500);
      loadHistory();
    } catch (err: any) {
      console.error('Error saving symptoms:', err);
      setSymptomError('Could not save symptoms. Please try again.');
    } finally {
      setSavingSymptoms(false);
    }
  }

  async function handleDeleteSymptom(id: string) {
    try {
      await supabase.from('symptoms').delete().eq('id', id);
      loadHistory();
    } catch (err) {
      console.error('Error deleting symptom:', err);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
          {t('log_title') || 'Log Symptoms & Period'}
        </h1>
        <p className="text-sm text-[#6B4A3A] mt-1">
          Record your symptoms, period dates, flow, and how your body feels.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERIOD CARD AT THE TOP */}
      {/* ========================================================================= */}
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EAD5C0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
              <Droplet className="w-4 h-4 fill-current text-[#3B1409]" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-serif text-[#3B1409]">Period</h2>
              <p className="text-[11px] text-[#6B4A3A]">
                Keep track of your cycle start and finish
              </p>
            </div>
          </div>

          {/* Toggle between Start & End actions */}
          <div className="flex rounded-xl bg-white border border-[#EAD5C0] p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActivePeriodTab('start')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors",
                activePeriodTab === 'start' 
                  ? "bg-[#A9421B] text-white" 
                  : "text-[#6B4A3A] hover:text-[#3B1409]"
              )}
            >
              Started
            </button>
            <button
              type="button"
              onClick={() => setActivePeriodTab('end')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-colors",
                activePeriodTab === 'end' 
                  ? "bg-[#A9421B] text-white" 
                  : "text-[#6B4A3A] hover:text-[#3B1409]"
              )}
            >
              Ended
            </button>
          </div>
        </div>

        {periodSuccessMsg && (
          <div className="p-3 bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-[#5E5A28] shrink-0" />
            <span>{periodSuccessMsg}</span>
          </div>
        )}

        {periodErrorMsg && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{periodErrorMsg}</span>
          </div>
        )}

        {activePeriodTab === 'start' ? (
          <form onSubmit={handlePeriodStart} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                When did it start?
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={periodStartDate}
                  onChange={(e) => setPeriodStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                Flow (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {FLOW_CHIPS.map((flow) => {
                  const isSelected = periodFlow === flow;
                  return (
                    <button
                      key={flow}
                      type="button"
                      onClick={() => setPeriodFlow(isSelected ? null : flow)}
                      className={cn(
                        "min-h-[40px] px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all focus-ring flex items-center gap-1",
                        isSelected
                          ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                          : "bg-white text-[#3B1409] border-[#B89A82] hover:border-[#2F6B3F]"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{flow}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPeriod}
              className="btn-primary w-full !min-h-[44px]"
            >
              {savingPeriod ? 'Recording...' : 'My period started'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePeriodEnd} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                When did it finish?
              </label>
              <input
                type="date"
                value={periodEndDate}
                onChange={(e) => setPeriodEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={savingPeriod}
              className="btn-primary w-full !min-h-[44px]"
            >
              {savingPeriod ? 'Recording...' : 'My period ended'}
            </button>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SYMPTOMS LOGGING CARD (MULTI-SELECT) */}
      {/* ========================================================================= */}
      <form onSubmit={handleSaveSymptoms} className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-5 shadow-xs">
        <div className="border-b border-[#EAD5C0] pb-2">
          <h2 className="text-base font-bold font-serif text-[#3B1409]">Symptoms</h2>
          <p className="text-xs text-[#6B4A3A]">
            Tap all symptoms you experienced. Tap again to unselect.
          </p>
        </div>

        {symptomSuccess && (
          <div className="p-3 bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-[#5E5A28] shrink-0" />
            <span>Check-in saved to your health story.</span>
          </div>
        )}

        {symptomError && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{symptomError}</span>
          </div>
        )}

        {/* Multi-select chips */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
            Select symptoms ({selectedChips.length} selected)
          </label>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_CHIPS.map((chip) => {
              const isSelected = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    "min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-semibold transition-all focus-ring flex items-center gap-1.5",
                    isSelected
                      ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                      : "bg-[#FFF9F2] text-[#3B1409] border-[#B89A82] hover:border-[#2F6B3F]"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>

          {selectedChips.includes('Other') && (
            <div className="pt-2 animate-in fade-in">
              <label className="block text-xs font-semibold text-[#3B1409] mb-1">
                Describe the other symptom
              </label>
              <input
                type="text"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="Type your symptom here..."
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#FFF9F2] border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* 'When?' Date Picker defaulting to today */}
        <div className="space-y-1.5 pt-2 border-t border-[#EAD5C0]">
          <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
            When?
          </label>
          <div className="relative">
            <input
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-[#FFF9F2] border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
              required
            />
          </div>
          <p className="text-[11px] text-[#6B4A3A]">
            Defaults to today. You can select a past day to record retrospectively.
          </p>
        </div>

        {/* 0 to 10 Slider: 'How strong is it?' */}
        <div className="space-y-3 pt-2 border-t border-[#EAD5C0]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#3B1409] uppercase tracking-wider">
              How strong is it?
            </label>
            <div className="flex items-center gap-1.5 bg-[#F6E7D8] px-3 py-1 rounded-full border border-[#EAD5C0]">
              <span className="text-sm font-bold text-[#3B1409]">{severity}</span>
              <span className="text-xs text-[#6B4A3A]">/ 10</span>
            </div>
          </div>

          <div className="px-1">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={severity}
              onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-[#F7CCA5] rounded-lg appearance-none cursor-pointer accent-[#A9421B]"
            />
            <div className="flex justify-between text-[11px] text-[#6B4A3A] mt-2 font-medium">
              <span>0 (None)</span>
              <span>3 (Mild)</span>
              <span>6 (Moderate)</span>
              <span>10 (Severe)</span>
            </div>
          </div>
        </div>

        {/* Optional note */}
        <div className="space-y-1.5 pt-2 border-t border-[#EAD5C0]">
          <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
            Notes (optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details about when it started, what helped, or any questions..."
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409] resize-none"
          />
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          disabled={savingSymptoms}
          className="btn-primary w-full !min-h-[44px]"
        >
          {savingSymptoms ? 'Saving...' : 'Save to my story'}
        </button>
      </form>

      {/* ========================================================================= */}
      {/* 3. RECENT LOGGED SYMPTOMS */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
          Recent Symptoms History
        </h2>

        {loadingHistory ? (
          <div className="text-center py-6 text-xs text-[#6B4A3A]">
            Loading logs...
          </div>
        ) : recentSymptoms.length > 0 ? (
          <div className="space-y-2.5">
            {recentSymptoms.map((s) => (
              <div 
                key={s.id}
                className="bg-white border border-[#EAD5C0] rounded-3xl p-4 flex items-start justify-between gap-3 shadow-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-serif text-[#3B1409] truncate">
                      {s.type}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                      s.severity >= 7 
                        ? "bg-[#F8DFC8] text-[#7A2E10] border-[#E0A77A]" 
                        : s.severity >= 4 
                        ? "bg-[#F6E7D8] text-[#3B1409] border-[#EAD5C0]" 
                        : "bg-[#FFF9F2] text-[#6B4A3A] border-[#EAD5C0]"
                    )}>
                      Level {s.severity}/10
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6B4A3A] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A9421B]" />
                    <span>{formatDate(s.created_at)}</span>
                  </p>

                  {s.notes && (
                    <p className="text-xs text-[#3B1409] bg-[#FFF9F2] p-2.5 rounded-xl border border-[#EAD5C0]/80 mt-1">
                      {s.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSymptom(s.id)}
                  title="Remove log"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B4A3A] hover:text-red-700 hover:bg-red-50 transition-colors focus-ring shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-6 text-center text-xs text-[#6B4A3A]">
            No symptoms recorded yet. Select symptoms above and tap "Save to my story".
          </div>
        )}
      </div>
    </div>
  );
}
