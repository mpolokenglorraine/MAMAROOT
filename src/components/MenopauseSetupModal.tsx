import React, { useState } from 'react';
import { X, Calendar, Activity, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface MenopauseSetupModalProps {
  userId: string;
  existingStages?: string[];
  initialLastPeriodDate?: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function MenopauseSetupModal({
  userId,
  existingStages = [],
  initialLastPeriodDate,
  onSuccess,
  onClose
}: MenopauseSetupModalProps) {
  // Question 1: Roughly when did your periods become irregular or stop? (month and year, or Not sure)
  const [periodMonthYear, setPeriodMonthYear] = useState<string>(
    initialLastPeriodDate ? initialLastPeriodDate.slice(0, 7) : ''
  );
  const [isNotSureDate, setIsNotSureDate] = useState<boolean>(!initialLastPeriodDate);

  // Question 2: Have you had a hysterectomy or your ovaries removed? (Yes, No, Not sure)
  const [surgeryAnswer, setSurgeryAnswer] = useState<'Yes' | 'No' | 'Not sure' | ''>('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;

    try {
      setSaving(true);
      setErrorMsg(null);

      // Build updated stages array with 'menopause'
      const updatedStages = Array.from(new Set([...existingStages, 'menopause']));

      const userUpdates: Record<string, any> = {
        stages: updatedStages
      };

      // Question 1: Save last_period_date if month/year provided and not marked "Not sure"
      if (!isNotSureDate && periodMonthYear) {
        userUpdates.last_period_date = `${periodMonthYear}-01`;
      }

      // Question 2: If Yes, also set tracks_periods to false
      if (surgeryAnswer === 'Yes') {
        userUpdates.tracks_periods = false;
      }

      // 1. Update user record
      const { error: userError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      if (userError) throw userError;

      // 2. Save surgery answer as a health_events row (status 'confirmed' ONLY if she says Yes)
      if (surgeryAnswer === 'Yes') {
        const today = new Date().toISOString().split('T')[0];
        try {
          const { error: eventError } = await supabase.from('health_events').insert({
            user_id: userId,
            title: 'Hysterectomy or ovaries removed',
            event_type: 'procedure',
            status: 'confirmed',
            event_date: userUpdates.last_period_date || today,
            notes: 'Reported during perimenopause / menopause profile setup'
          });

          if (eventError) {
            // Fallback if notes column is not present
            await supabase.from('health_events').insert({
              user_id: userId,
              title: 'Hysterectomy or ovaries removed',
              event_type: 'procedure',
              status: 'confirmed',
              event_date: userUpdates.last_period_date || today
            });
          }
        } catch (eventErr) {
          console.warn('Could not record procedure health event:', eventErr);
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error saving menopause details:', err);
      setErrorMsg(err.message || 'Could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-6 space-y-6 shadow-xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[#3B1409]">
              Perimenopause & Menopause
            </h2>
            <p className="text-xs text-[#6B4A3A] leading-relaxed">
              Optional details to help guide your care and health summary.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-[#EAD5C0] flex items-center justify-center text-[#6B4A3A] hover:text-[#3B1409] transition-colors focus-ring"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Question 1: Roughly when did your periods become irregular or stop? */}
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3 shadow-2xs">
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#3B1409] block">
                Roughly when did your periods become irregular or stop?
              </label>
              <p className="text-[11px] text-[#6B4A3A]">
                Month and year, or select Not sure.
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="month"
                value={periodMonthYear}
                disabled={isNotSureDate}
                onChange={(e) => {
                  setPeriodMonthYear(e.target.value);
                  setIsNotSureDate(false);
                }}
                className={cn(
                  "input-field text-sm",
                  isNotSureDate && "opacity-50 cursor-not-allowed bg-stone-100"
                )}
              />

              <button
                type="button"
                onClick={() => {
                  const newNotSure = !isNotSureDate;
                  setIsNotSureDate(newNotSure);
                  if (newNotSure) {
                    setPeriodMonthYear('');
                  }
                }}
                className={cn(
                  "px-3.5 py-2 rounded-full border text-xs font-semibold transition-all focus-ring flex items-center gap-1.5",
                  isNotSureDate
                    ? "bg-[#A9421B] text-white border-[#A9421B]"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                {isNotSureDate && <Check className="w-3.5 h-3.5" />}
                <span>Not sure</span>
              </button>
            </div>
          </div>

          {/* Question 2: Have you had a hysterectomy or your ovaries removed? */}
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3 shadow-2xs">
            <div className="space-y-1">
              <label className="text-sm font-bold text-[#3B1409] block">
                Have you had a hysterectomy or your ovaries removed?
              </label>
              <p className="text-[11px] text-[#6B4A3A]">
                Surgeries affecting your uterus or ovaries change hormonal transitions.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['Yes', 'No', 'Not sure'] as const).map((opt) => {
                const isSelected = surgeryAnswer === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setSurgeryAnswer(opt)}
                    className={cn(
                      "min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold border transition-all focus-ring flex items-center gap-1.5",
                      isSelected
                        ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                        : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                    )}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {surgeryAnswer === 'Yes' && (
              <p className="text-[11px] text-[#A9421B] font-medium pt-1">
                This will record the surgical procedure in your health records and pause menstrual cycle tracking.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="pt-2 space-y-2.5">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving details...' : 'Save & continue'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-[#6B4A3A] hover:text-[#3B1409] transition-colors text-center"
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
