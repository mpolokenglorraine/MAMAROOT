import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle,
  Lock,
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import PregnancySetupModal from '../components/PregnancySetupModal';
import MenopauseSetupModal from '../components/MenopauseSetupModal';
import { useT, SUPPORTED_LANGUAGES } from '../i18n/useT';

const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape'
];

const STAGES = [
  { id: 'tracking_periods', label: 'Tracking periods' },
  { id: 'trying_to_conceive', label: 'Trying to conceive' },
  { id: 'pregnant', label: 'Pregnant' },
  { id: 'after_loss', label: 'After loss' },
  { id: 'early_motherhood', label: 'Early motherhood' },
  { id: 'menopause', label: 'Perimenopause or menopause' },
  { id: 'living_with_condition', label: 'Living with a health condition' },
];

const SUGGESTED_CONDITIONS = [
  'Endometriosis',
  'Fibroids',
  'PCOS',
  'Ovarian cysts',
  'Past ectopic pregnancy',
  'Other'
];

const LANGUAGES = SUPPORTED_LANGUAGES;

interface AddedCondition {
  id: string;
  name: string;
  status: 'Confirmed by a doctor' | 'Suspected' | 'Not sure';
  year: string;
}

export default function Onboarding() {
  const { user, profile, refetchProfile } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // -------------------------------------------------------------
  // STEP 1 STATE
  // -------------------------------------------------------------
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [dob, setDob] = useState<string>('');
  const [province, setProvince] = useState<string>('Gauteng');
  const [isUnder18, setIsUnder18] = useState<boolean>(false);
  const [showPregnancyModal, setShowPregnancyModal] = useState<boolean>(false);
  const [showMenopauseModal, setShowMenopauseModal] = useState<boolean>(false);

  // -------------------------------------------------------------
  // STEP 2 STATE
  // -------------------------------------------------------------
  const [cycleRegularity, setCycleRegularity] = useState<string>('');
  const [cycleLength, setCycleLength] = useState<string>('');
  const [periodLength, setPeriodLength] = useState<string>('');
  const [lastPeriodDate, setLastPeriodDate] = useState<string>('');
  const [conditions, setConditions] = useState<AddedCondition[]>([]);
  const [customConditionInput, setCustomConditionInput] = useState<string>('');
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false);
  const [pregnanciesCount, setPregnanciesCount] = useState<string>('');
  const [childrenCount, setChildrenCount] = useState<string>('');
  const [youngestChildMonth, setYoungestChildMonth] = useState<string>(''); // YYYY-MM

  // -------------------------------------------------------------
  // STEP 3 STATE
  // -------------------------------------------------------------
  const [language, setLanguage] = useState<string>('en');

  // -------------------------------------------------------------
  // STEP 4 STATE
  // -------------------------------------------------------------
  const [agreedPrivacy, setAgreedPrivacy] = useState<boolean>(false);

  // Pre-fill state if user already has some fields
  useEffect(() => {
    if (profile) {
      if (profile.stages && Array.isArray(profile.stages) && profile.stages.length > 0) {
        setSelectedStages(profile.stages);
      }
      if (profile.date_of_birth) setDob(profile.date_of_birth);
      if (profile.province) setProvince(profile.province);
      if (profile.cycle_regularity) setCycleRegularity(profile.cycle_regularity);
      if (profile.cycle_length_days) setCycleLength(String(profile.cycle_length_days));
      if (profile.period_length_days) setPeriodLength(String(profile.period_length_days));
      if (profile.last_period_date) setLastPeriodDate(profile.last_period_date);
      if (profile.pregnancies_count !== undefined && profile.pregnancies_count !== null) {
        setPregnanciesCount(String(profile.pregnancies_count));
      }
      if (profile.children_count !== undefined && profile.children_count !== null) {
        setChildrenCount(String(profile.children_count));
      }
      if (profile.youngest_child_birth_date) {
        setYoungestChildMonth(profile.youngest_child_birth_date.slice(0, 7));
      }
      if (profile.language) setLanguage(profile.language);
    }
  }, [profile]);

  // Check age whenever DOB changes
  useEffect(() => {
    if (!dob) {
      setIsUnder18(false);
      return;
    }
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setIsUnder18(age < 18);
  }, [dob]);

  // Stage toggle
  const toggleStage = (stageId: string) => {
    if (selectedStages.includes(stageId)) {
      setSelectedStages(selectedStages.filter(s => s !== stageId));
    } else {
      setSelectedStages([...selectedStages, stageId]);
    }
  };

  // Conditions management
  const addCondition = (name: string) => {
    if (name === 'Other') {
      setShowOtherInput(true);
      return;
    }
    if (conditions.some(c => c.name.toLowerCase() === name.toLowerCase())) return;
    setConditions([
      ...conditions,
      {
        id: Math.random().toString(36).substring(2, 9),
        name,
        status: 'Suspected',
        year: ''
      }
    ]);
  };

  const addCustomCondition = () => {
    if (!customConditionInput.trim()) return;
    const trimmed = customConditionInput.trim();
    if (!conditions.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setConditions([
        ...conditions,
        {
          id: Math.random().toString(36).substring(2, 9),
          name: trimmed,
          status: 'Suspected',
          year: ''
        }
      ]);
    }
    setCustomConditionInput('');
    setShowOtherInput(false);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateConditionStatus = (id: string, status: 'Confirmed by a doctor' | 'Suspected' | 'Not sure') => {
    setConditions(conditions.map(c => c.id === id ? { ...c, status } : c));
  };

  const updateConditionYear = (id: string, year: string) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, year } : c));
  };

  // -------------------------------------------------------------
  // STEP SUBMISSIONS
  // -------------------------------------------------------------
  const handleStep1Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isUnder18) {
      return;
    }

    if (!user) {
      setErrorMsg('Session not found. Please log in.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({
          stages: selectedStages,
          date_of_birth: dob || null,
          province,
          country: 'South Africa'
        })
        .eq('id', user.id);

      if (error) throw error;
      
      if (selectedStages.includes('pregnant')) {
        setShowPregnancyModal(true);
      } else if (selectedStages.includes('menopause')) {
        setShowMenopauseModal(true);
      } else {
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Error saving step 1:', err);
      setErrorMsg(err.message || 'Could not save details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStep2Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) return;

    try {
      setSaving(true);
      // Format youngest child birth date to 1st of month
      let youngestDate: string | null = null;
      if (youngestChildMonth && parseInt(childrenCount, 10) > 0) {
        youngestDate = `${youngestChildMonth}-01`;
      }

      // Update users table with step 2 fields
      const { error: userError } = await supabase
        .from('users')
        .update({
          cycle_regularity: cycleRegularity || null,
          cycle_length_days: cycleLength ? parseInt(cycleLength, 10) : null,
          period_length_days: periodLength ? parseInt(periodLength, 10) : null,
          last_period_date: lastPeriodDate || null,
          pregnancies_count: pregnanciesCount ? parseInt(pregnanciesCount, 10) : null,
          children_count: childrenCount ? parseInt(childrenCount, 10) : null,
          youngest_child_birth_date: youngestDate
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Save conditions to user_conditions table
      if (conditions.length > 0) {
        // Delete previous conditions to avoid duplicates
        await supabase
          .from('user_conditions')
          .delete()
          .eq('user_id', user.id);

        const rows = conditions.map(c => ({
          user_id: user.id,
          condition: c.name,
          status: c.status,
          diagnosed_year: c.year ? parseInt(c.year, 10) : null
        }));

        const { error: condError } = await supabase
          .from('user_conditions')
          .insert(rows);

        if (condError) {
          console.warn('Could not insert some user_conditions:', condError);
        }
      }

      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving step 2:', err);
      setErrorMsg(err.message || 'Could not save body information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStep3Continue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('users')
        .update({ language })
        .eq('id', user.id);

      if (error) throw error;
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error saving language:', err);
      setErrorMsg(err.message || 'Could not save language. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinishOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!agreedPrivacy || !user) return;

    try {
      setSaving(true);
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('users')
        .update({
          consent_health_data: true,
          consent_at: now,
          onboarding_complete: true
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refetch profile so updated onboarding_complete and stages show immediately
      await refetchProfile();

      navigate('/mother-dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setErrorMsg(err.message || 'Could not finalize onboarding. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans flex flex-col justify-between py-6 px-4">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-between">
        
        {/* Top Header: Step Indicator & Thin Progress Bar */}
        <div className="space-y-2 pt-2 pb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-[#6B4A3A]">
            <div className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="Mama Root logo: a mother holding her child, with roots below" 
                className="w-7 h-7 object-contain"
              />
              <span className="font-serif font-bold text-[#3B1409] text-base">Mama Root</span>
            </div>
            <span>Step {step} of 4</span>
          </div>
          <div className="w-full h-1.5 bg-[#F6E7D8] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#A9421B] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: 'Where are you in your journey?' */}
        {/* ========================================================================= */}
        {step === 1 && (
          <form onSubmit={handleStep1Continue} className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
                  Where are you in your journey?
                </h1>
                <p className="text-xs text-[#6B4A3A] mt-1.5 leading-relaxed font-sans">
                  Pick all that apply. You can change this any time.
                </p>
              </div>

              {/* Multi-select chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {STAGES.map((s) => {
                  const isSelected = selectedStages.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleStage(s.id)}
                      className={cn(
                        "chip min-h-[44px]",
                        isSelected ? "chip-selected" : "bg-white text-[#3B1409] border-[#B89A82]"
                      )}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Date of birth */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Date of birth
                </label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              {/* Under 18 Kind Message */}
              {isUnder18 && (
                <div className="p-4 bg-[#F8DFC8] border border-[#E0A77A] rounded-2xl text-xs text-[#7A2E10] font-medium leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-[#7A2E10]" />
                    <span>A gentle note</span>
                  </div>
                  <p>Mama Root is for women 18 and over for now.</p>
                </div>
              )}

              {/* Province dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Province
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="input-field text-sm bg-white cursor-pointer"
                >
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#6B4A3A]">Country: South Africa</p>
              </div>
            </div>

            {/* Pinned Bottom Button */}
            <div className="pt-6 pb-2">
              <button
                type="submit"
                disabled={saving || isUnder18}
                className="btn-primary w-full disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: 'Your body, your usual' */}
        {/* ========================================================================= */}
        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
                  Your body, your usual
                </h1>
                <p className="text-xs text-[#6B4A3A] mt-1.5 leading-relaxed font-sans">
                  Every question can be skipped. Share only what feels right for you.
                </p>
              </div>

              {/* Cycle regularity chips */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Cycle regularity
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Regular', 'Irregular', 'Not sure'].map((reg) => {
                    const isSelected = cycleRegularity === reg;
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setCycleRegularity(cycleRegularity === reg ? '' : reg)}
                        className={cn(
                          "chip min-h-[44px]",
                          isSelected ? "chip-selected" : "bg-white text-[#3B1409] border-[#B89A82]"
                        )}
                      >
                        {reg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cycle & Period Length Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3B1409]">
                    Usual cycle (days)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="60"
                    value={cycleLength}
                    onChange={(e) => setCycleLength(e.target.value)}
                    placeholder="e.g. 28"
                    className="input-field text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#3B1409]">
                    Period length (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={periodLength}
                    onChange={(e) => setPeriodLength(e.target.value)}
                    placeholder="e.g. 5"
                    className="input-field text-sm"
                  />
                </div>
              </div>

              {/* Last period date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3B1409]">
                  First day of last period (optional)
                </label>
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>

              {/* Conditions List */}
              <div className="space-y-3 pt-2 border-t border-[#EAD5C0]">
                <div>
                  <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                    Health conditions & concerns
                  </label>
                  <p className="text-[11px] text-[#6B4A3A]">Tap to add any that apply to your body:</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_CONDITIONS.map((cond) => {
                    const isAdded = conditions.some(c => c.name.toLowerCase() === cond.toLowerCase());
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => addCondition(cond)}
                        className={cn(
                          "chip min-h-[44px]",
                          isAdded ? "chip-selected" : "bg-white text-[#3B1409] border-[#B89A82]"
                        )}
                      >
                        {isAdded ? `✓ ${cond}` : `+ ${cond}`}
                      </button>
                    );
                  })}
                </div>

                {/* Free-text Other input */}
                {showOtherInput && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={customConditionInput}
                      onChange={(e) => setCustomConditionInput(e.target.value)}
                      placeholder="Type condition name..."
                      className="input-field flex-1"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={addCustomCondition}
                      className="btn-primary !w-auto px-4 !h-[44px] !min-h-[44px] text-xs"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Added conditions detail cards */}
                {conditions.length > 0 && (
                  <div className="space-y-2.5 pt-2">
                    {conditions.map((cond) => (
                      <div 
                        key={cond.id}
                        className="bg-white border border-[#EAD5C0] rounded-3xl p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[#3B1409]">{cond.name}</span>
                          <button
                            type="button"
                            onClick={() => removeCondition(cond.id)}
                            className="text-[#6B4A3A] hover:text-[#833518] p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Status picker */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-semibold text-[#6B4A3A]">Status:</span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['Confirmed by a doctor', 'Suspected', 'Not sure'] as const).map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateConditionStatus(cond.id, st)}
                                className={cn(
                                  "py-1.5 px-1 rounded-full text-[10px] font-semibold border transition-all text-center min-h-[36px] flex items-center justify-center leading-tight",
                                  cond.status === st
                                    ? "bg-[#A9421B] text-white border-[#A9421B]"
                                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Optional Year */}
                        <div>
                          <input
                            type="number"
                            min="1970"
                            max={new Date().getFullYear()}
                            placeholder="Year noticed or diagnosed (optional)"
                            value={cond.year}
                            onChange={(e) => updateConditionYear(cond.id, e.target.value)}
                            className="input-field text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reproductive History: Pregnancies & Children */}
              <div className="space-y-3 pt-2 border-t border-[#EAD5C0]">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Reproductive history
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#3B1409]">Number of pregnancies</span>
                    <input
                      type="number"
                      min="0"
                      value={pregnanciesCount}
                      onChange={(e) => setPregnanciesCount(e.target.value)}
                      placeholder="0"
                      className="input-field text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#3B1409]">Number of children</span>
                    <input
                      type="number"
                      min="0"
                      value={childrenCount}
                      onChange={(e) => setChildrenCount(e.target.value)}
                      placeholder="0"
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                {/* If children > 0, show youngest child's birth month & year */}
                {parseInt(childrenCount, 10) > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs font-semibold text-[#3B1409]">
                      Youngest child's birth month and year
                    </span>
                    <input
                      type="month"
                      value={youngestChildMonth}
                      onChange={(e) => setYoungestChildMonth(e.target.value)}
                      className="input-field text-sm"
                    />
                    <p className="text-[11px] text-[#6B4A3A]">
                      We use this to show relevant guidance for your child's age.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned Bottom Buttons */}
            <div className="pt-6 pb-2 space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-xs font-semibold text-[#6B4A3A] hover:text-[#3B1409] transition-colors text-center"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: 'Your language' */}
        {/* ========================================================================= */}
        {step === 3 && (
          <form onSubmit={handleStep3Continue} className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
                  Your language
                </h1>
                <p className="text-xs text-[#6B4A3A] mt-1.5 leading-relaxed font-sans">
                  Choose your preferred language for Mama Root.
                </p>
              </div>

              {/* Language chips */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  {LANGUAGES.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          "chip min-h-[44px] text-sm font-semibold",
                          isSelected ? "chip-selected" : "bg-white text-[#3B1409] border-[#B89A82]"
                        )}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs text-[#6B4A3A] italic pt-1">
                  More languages coming soon
                </p>
              </div>
            </div>

            {/* Pinned Bottom Buttons */}
            <div className="pt-6 pb-2 space-y-3">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Continue'}
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 text-xs font-semibold text-[#6B4A3A] hover:text-[#3B1409] transition-colors text-center"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: 'Your privacy' */}
        {/* ========================================================================= */}
        {step === 4 && (
          <form onSubmit={handleFinishOnboarding} className="flex-1 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
                  Your privacy
                </h1>
                <p className="text-xs text-[#6B4A3A] mt-1.5 leading-relaxed font-sans">
                  How we protect your health information and honor your trust.
                </p>
              </div>

              {/* Privacy Explanation Card */}
              <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3.5 shadow-xs text-xs text-[#3B1409] leading-relaxed">
                <div>
                  <h3 className="font-bold text-[#3B1409] font-serif mb-0.5">What is collected</h3>
                  <p className="text-[#6B4A3A]">
                    Only the health information you choose to share, such as your cycle details, symptoms, stages, and notes.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAD5C0]/70">
                  <h3 className="font-bold text-[#3B1409] font-serif mb-0.5">Why we collect it</h3>
                  <p className="text-[#6B4A3A]">
                    To personalise your experience, calculate relevant health ranges, and keep your history ready for your care visits.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAD5C0]/70">
                  <h3 className="font-bold text-[#3B1409] font-serif mb-0.5">Who can see it</h3>
                  <p className="text-[#6B4A3A]">
                    Only you. Your health records are completely private to your account.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EAD5C0]/70">
                  <h3 className="font-bold text-[#3B1409] font-serif mb-0.5">Your rights & control</h3>
                  <p className="text-[#6B4A3A]">
                    You can view, edit, export, or permanently delete your health records at any time directly in Settings.
                  </p>
                </div>
              </div>

              {/* Required Consent Checkbox */}
              <div className="bg-[#F6E7D8] border border-[#EAD5C0] rounded-3xl p-4.5">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className="w-5 h-5 rounded text-[#A9421B] accent-[#A9421B] mt-0.5 shrink-0 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-[#3B1409] leading-snug">
                    I agree to Mama Root keeping my health information to personalise my app.
                  </span>
                </label>
              </div>
            </div>

            {/* Pinned Bottom Buttons */}
            <div className="pt-6 pb-2 space-y-3">
              <button
                type="submit"
                disabled={!agreedPrivacy || saving}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Finishing setup...' : 'Finish & Go to Today'}
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-2 text-xs font-semibold text-[#6B4A3A] hover:text-[#3B1409] transition-colors text-center"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {/* Pregnancy Setup Modal if Pregnant is selected */}
        {showPregnancyModal && user && (
          <PregnancySetupModal
            userId={user.id}
            existingStages={selectedStages}
            onClose={() => {
              setShowPregnancyModal(false);
              if (selectedStages.includes('menopause')) {
                setShowMenopauseModal(true);
              } else {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            onSuccess={async () => {
              await refetchProfile();
              setShowPregnancyModal(false);
              if (selectedStages.includes('menopause')) {
                setShowMenopauseModal(true);
              } else {
                setStep(2);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
        )}

        {/* Menopause Setup Modal if Menopause is selected */}
        {showMenopauseModal && user && (
          <MenopauseSetupModal
            userId={user.id}
            existingStages={selectedStages}
            initialLastPeriodDate={lastPeriodDate}
            onClose={() => {
              setShowMenopauseModal(false);
              setStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSuccess={async () => {
              await refetchProfile();
              setShowMenopauseModal(false);
              setStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </div>
    </div>
  );
}
