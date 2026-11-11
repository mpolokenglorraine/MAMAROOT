import React, { useState } from 'react';
import { X, Calendar, Heart, ShieldAlert, Check, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { addDaysToDate } from '../lib/cycleEngine';

const RISK_TAGS = [
  { id: 'fibroids', label: 'Fibroids' },
  { id: 'past_ectopic', label: 'Past ectopic pregnancy' },
  { id: 'past_caesarean', label: 'Past caesarean section' },
  { id: 'high_blood_pressure', label: 'High blood pressure' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'twins', label: 'Twins or multiple pregnancy' },
  { id: 'other', label: 'Other health factor' }
] as const;

interface PregnancySetupModalProps {
  userId: string;
  existingStages?: string[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function PregnancySetupModal({
  userId,
  existingStages = [],
  onSuccess,
  onClose
}: PregnancySetupModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<'last_period' | 'scan' | 'not_sure'>('last_period');
  const [lastPeriodDate, setLastPeriodDate] = useState<string>('');
  const [scanDueDate, setScanDueDate] = useState<string>('');
  const [selectedRiskTags, setSelectedRiskTags] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleRiskTag = (tagId: string) => {
    setSelectedRiskTags(prev => 
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleCompleteSetup = async () => {
    if (!userId) return;
    try {
      setSaving(true);
      setErrorMessage(null);

      // Determine due date
      let finalDueDate: string | null = null;
      let finalLmpDate: string | null = null;

      if (method === 'last_period') {
        if (!lastPeriodDate) {
          setErrorMessage('Please enter your last period date, or select "Not sure".');
          setSaving(false);
          return;
        }
        finalLmpDate = lastPeriodDate;
        // due date = that date + 280 days
        const computedDueDate = addDaysToDate(lastPeriodDate, 280);
        finalDueDate = computedDueDate.toISOString().split('T')[0];
      } else if (method === 'scan') {
        if (!scanDueDate) {
          setErrorMessage('Please enter the due date given by your scan, or select "Not sure".');
          setSaving(false);
          return;
        }
        finalDueDate = scanDueDate;
      } else {
        // Not sure: create pregnancy without dates
        finalDueDate = null;
        finalLmpDate = null;
      }

      // 1. Insert into pregnancies table
      const pregnancyPayload = {
        user_id: userId,
        status: 'active',
        due_date: finalDueDate,
        last_period_date: finalLmpDate,
        risk_tags: selectedRiskTags
      };

      const { error: pregError } = await supabase
        .from('pregnancies')
        .insert(pregnancyPayload);

      if (pregError) {
        console.warn('Error inserting into pregnancies, retrying with minimal fields:', pregError);
        await supabase
          .from('pregnancies')
          .insert({
            user_id: userId,
            status: 'active',
            due_date: finalDueDate
          });
      }

      // 2. Add 'pregnant' to stages if not already present
      const updatedStages = Array.from(new Set([...existingStages, 'pregnant']));
      await supabase
        .from('users')
        .update({
          stages: updatedStages
        })
        .eq('id', userId);

      // 3. Insert health_events row
      const healthEventPayload: Record<string, any> = {
        user_id: userId,
        title: 'Pregnancy began',
        event_type: 'pregnancy',
        status: 'confirmed',
        event_date: finalLmpDate || new Date().toISOString().split('T')[0]
      };

      await supabase.from('health_events').insert(healthEventPayload);

      onSuccess();
    } catch (err: any) {
      console.error('Error completing pregnancy setup:', err);
      setErrorMessage(err.message || 'Could not save pregnancy setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#EAD5C0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409]">
              <Heart className="w-4 h-4 text-[#3B1409]" />
            </div>
            <span className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
              Pregnancy Mode Setup
            </span>
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

        {errorMessage && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl">
            {errorMessage}
          </div>
        )}

        {/* STEP 1: How far along are you? */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold font-serif text-[#3B1409]">
                How far along are you?
              </h2>
              <p className="text-xs text-[#6B4A3A] mt-1 font-sans">
                Choose the best way to calculate your due date.
              </p>
            </div>

            <div className="space-y-2.5">
              {/* Option A: First day of my last period */}
              <button
                type="button"
                onClick={() => setMethod('last_period')}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all focus-ring",
                  method === 'last_period'
                    ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                <div className="font-semibold text-xs">First day of my last period</div>
                <div className={cn("text-[11px] mt-0.5", method === 'last_period' ? "text-white/90" : "text-[#6B4A3A]")}>
                  We will add 280 days to estimate your clinical due date.
                </div>
              </button>

              {method === 'last_period' && (
                <div className="p-4 bg-white border border-[#EAD5C0] rounded-2xl space-y-1.5 animate-in fade-in">
                  <label className="text-[11px] font-bold text-[#6B4A3A] block uppercase tracking-wider">
                    Date your last period started
                  </label>
                  <input
                    type="date"
                    value={lastPeriodDate}
                    onChange={(e) => setLastPeriodDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              )}

              {/* Option B: My scan gave a due date */}
              <button
                type="button"
                onClick={() => setMethod('scan')}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all focus-ring",
                  method === 'scan'
                    ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                <div className="font-semibold text-xs">My scan gave a due date</div>
                <div className={cn("text-[11px] mt-0.5", method === 'scan' ? "text-white/90" : "text-[#6B4A3A]")}>
                  Enter the estimated date from your clinical ultrasound.
                </div>
              </button>

              {method === 'scan' && (
                <div className="p-4 bg-white border border-[#EAD5C0] rounded-2xl space-y-1.5 animate-in fade-in">
                  <label className="text-[11px] font-bold text-[#6B4A3A] block uppercase tracking-wider">
                    Due date from scan
                  </label>
                  <input
                    type="date"
                    value={scanDueDate}
                    onChange={(e) => setScanDueDate(e.target.value)}
                    className="input-field text-sm"
                  />
                </div>
              )}

              {/* Option C: Not sure */}
              <button
                type="button"
                onClick={() => setMethod('not_sure')}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition-all focus-ring",
                  method === 'not_sure'
                    ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                <div className="font-semibold text-xs">Not sure</div>
                <div className={cn("text-[11px] mt-0.5", method === 'not_sure' ? "text-white/90" : "text-[#6B4A3A]")}>
                  If you do not know your dates yet.
                </div>
              </button>

              {method === 'not_sure' && (
                <div className="p-3.5 bg-[#F6E7D8] border border-[#EAD5C0] rounded-2xl text-xs text-[#3B1409] leading-relaxed">
                  A clinic can confirm how far along you are with a scan. Book one as soon as you can.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setStep(2);
              }}
              className="btn-primary w-full mt-2"
            >
              Continue to Step 2
            </button>
          </div>
        )}

        {/* STEP 2: Optional self-reported risk tags */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold font-serif text-[#3B1409]">
                Your health background
              </h2>
              <p className="text-xs text-[#6B4A3A] mt-1 font-sans">
                Tell your clinician about these at every visit.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#6B4A3A] uppercase tracking-wider block">
                Select any that apply (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {RISK_TAGS.map((tag) => {
                  const isSelected = selectedRiskTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleRiskTag(tag.id)}
                      className={cn(
                        "min-h-[44px] px-3.5 py-2 rounded-full border text-xs font-semibold transition-all focus-ring",
                        isSelected
                          ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                          : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                      )}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3.5 bg-[#F6E7D8] border border-[#EAD5C0] rounded-2xl text-xs text-[#3B1409] leading-relaxed">
              Tell your clinician about these at every visit. This helps your care team provide attentive, personalized support.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={saving}
                className="btn-secondary w-1/3 min-h-[48px]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={saving}
                className="btn-primary w-2/3 min-h-[48px] flex items-center justify-center gap-1.5"
              >
                {saving ? 'Saving...' : 'Enter pregnancy mode'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
