import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CalendarDays, 
  Sparkles, 
  Heart, 
  HeartHandshake, 
  Activity, 
  Baby, 
  ThermometerSun, 
  Stethoscope, 
  Check, 
  Copy, 
  Clock, 
  AlertTriangle, 
  PhoneCall, 
  Droplet, 
  Plus, 
  Loader2, 
  ChevronRight,
  BookOpen,
  Info,
  ShieldAlert,
  AlertCircle,
  FileText,
  Calendar,
  HelpCircle
} from 'lucide-react';
import { 
  supabase, 
  PeriodLog, 
  Symptom, 
  HealthEvent, 
  UserCondition 
} from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { evaluateCycle } from '../../lib/cycleEngine';
import { calculateAgeAtDate } from '../../lib/menopauseRules';
import { RootsDivider, LeafSprigHeader } from '../../components/RootsMotif';

interface StageMeta {
  id: string;
  title: string;
  headerTitle?: string;
  oneLine: string;
  icon: React.ComponentType<{ className?: string }>;
  headerBg: string;
  headerTextColor: string;
  chips: string[];
  doctorQuestions: string[];
}

const STAGE_META_MAP: Record<string, StageMeta> = {
  tracking_periods: {
    id: 'tracking_periods',
    title: 'Period tracking',
    oneLine: 'Understand your cycle rhythm, variations, and flow patterns',
    icon: CalendarDays,
    headerBg: 'bg-[#A9421B]', // Terracotta
    headerTextColor: 'text-white',
    chips: [
      'Cramps',
      'Pelvic pain',
      'Bloating',
      'Heavy bleeding',
      'Spotting',
      'Headache',
      'Fatigue',
      'Mood changes',
      'Back pain'
    ],
    doctorQuestions: [
      'How regular is my cycle length based on my logged entries?',
      'Are my bleeding duration and flow levels within a healthy range?',
      'What treatments or investigations can help with the symptoms I am logging?'
    ]
  },
  trying_to_conceive: {
    id: 'trying_to_conceive',
    title: 'Trying to conceive',
    oneLine: 'Support and insights for family planning and fertile windows',
    icon: Sparkles,
    headerBg: 'bg-[#6DB04F]', // Fresh Leaf
    headerTextColor: 'text-white',
    chips: [
      'Positive pregnancy test',
      'Negative pregnancy test',
      'Ovulation signs',
      'Irregular bleeding',
      'Pelvic pain'
    ],
    doctorQuestions: [
      'How long should we try before scheduling preconception or fertility tests?',
      'Which prenatal vitamins and nutrient levels do you recommend checking?',
      'Are my cycle lengths and ovulation signs typical for healthy conception?'
    ]
  },
  pregnant: {
    id: 'pregnant',
    title: 'Pregnancy',
    oneLine: 'Week-by-week guidance for your body and your growing baby',
    icon: Heart,
    headerBg: 'bg-[#2F6B3F]', // Forest Green
    headerTextColor: 'text-white',
    chips: [
      'Nausea',
      'Heartburn',
      'Back pain',
      'Swelling',
      'Headache',
      'Contractions',
      'Reduced baby movement',
      'Bleeding',
      'Fluid leaking',
      'Fever'
    ],
    doctorQuestions: [
      'Are the symptoms I am currently experiencing normal for this week?',
      'What are the priority dates for my next ultrasound scan and routine checks?',
      'Which sudden symptoms should prompt an immediate visit to maternity triage?'
    ]
  },
  after_loss: {
    id: 'after_loss',
    title: 'Pregnancy loss support',
    headerTitle: 'We are so sorry.',
    oneLine: 'Take whatever time you need.',
    icon: HeartHandshake,
    headerBg: 'bg-[#833518]', // Clay
    headerTextColor: 'text-white',
    chips: [
      'Bleeding',
      'Pain',
      'Low mood',
      'Anxiety',
      'Not sleeping'
    ],
    doctorQuestions: [
      'What happened?',
      'What follow-up care do I need?',
      'Do I need any tests?'
    ]
  },
  postpartum: {
    id: 'postpartum',
    title: 'Postpartum',
    oneLine: 'Nurturing your recovery and healing in the weeks after giving birth',
    icon: Activity,
    headerBg: 'bg-[#F7CCA5]', // Peach with Root Brown icon & text
    headerTextColor: 'text-[#3B1409]',
    chips: [
      'Bleeding',
      'Pain',
      'Sore breasts',
      'Low mood',
      'Anxiety',
      'Not sleeping',
      'Tired',
      'Feeding worries'
    ],
    doctorQuestions: [
      'Is my postpartum bleeding (lochia) and physical healing on track?',
      'How can I tell the difference between normal baby blues and postpartum depression?',
      'What contraception options are safe while breastfeeding or recovering?'
    ]
  },
  early_motherhood: {
    id: 'early_motherhood',
    title: 'Early motherhood',
    oneLine: 'Guidance and compassionate support as you and your baby grow together',
    icon: Baby,
    headerBg: 'bg-[#6DB04F]', // Fresh Leaf
    headerTextColor: 'text-white',
    chips: [
      'Bleeding',
      'Pain',
      'Sore breasts',
      'Low mood',
      'Anxiety',
      'Not sleeping',
      'Tired',
      'Feeding worries'
    ],
    doctorQuestions: [
      'Is my baby feeding, sleeping, and developing on a healthy curve?',
      'What clinical rehabilitation exists for ongoing pelvic or core weakness?',
      'What local maternal health and mental wellbeing resources can I access?'
    ]
  },
  menopause: {
    id: 'menopause',
    title: 'Perimenopause and menopause',
    oneLine: 'Navigating hormonal changes, symptom relief, and body transitions',
    icon: ThermometerSun,
    headerBg: 'bg-[#3B1409]', // Root Brown
    headerTextColor: 'text-white',
    chips: [
      'Hot flushes',
      'Night sweats',
      'Sleep problems',
      'Mood changes',
      'Vaginal dryness',
      'Joint pain',
      'Brain fog',
      'Bleeding'
    ],
    doctorQuestions: [
      'Are my symptoms consistent with perimenopause for my age?',
      'What are the evidence-based medical and lifestyle options to ease these symptoms?',
      'Should any recent bleeding irregularities be evaluated with an ultrasound?'
    ]
  },
  living_with_condition: {
    id: 'living_with_condition',
    title: 'Living with a condition',
    oneLine: 'Managing reproductive and maternal health conditions day-to-day',
    icon: Stethoscope,
    headerBg: 'bg-[#2F6B3F]', // Forest Green
    headerTextColor: 'text-white',
    chips: [
      'Pelvic pain',
      'Heavy bleeding',
      'Bloating',
      'Fatigue',
      'Pain with sex',
      'Bowel or bladder pain',
      'Back pain'
    ],
    doctorQuestions: [
      'What treatment adjustments or pain management strategies do you recommend?',
      'How might my diagnosis impact future fertility or maternal health?',
      'What flare-up warning signs should prompt me to contact your clinic directly?'
    ]
  }
};

const FLOW_OPTIONS = ['Spotting', 'Light', 'Medium', 'Heavy', 'Very heavy'] as const;

export default function JourneyDashboard() {
  const { stage } = useParams<{ stage: string }>();
  const navigate = useNavigate();
  const { profile, refetchProfile } = useAuth();

  const meta = stage ? STAGE_META_MAP[stage] : undefined;

  // Log card common state
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [severity, setSeverity] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [savingSymptoms, setSavingSymptoms] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [recentEntries, setRecentEntries] = useState<Symptom[]>([]);
  const [logError, setLogError] = useState<string | null>(null);

  // Copied question feedback
  const [copiedQuestionIdx, setCopiedQuestionIdx] = useState<number | null>(null);

  // Period logs state (used in tracking_periods & trying_to_conceive)
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [periodDate, setPeriodDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedFlow, setSelectedFlow] = useState<string>('Medium');
  const [periodSaving, setPeriodSaving] = useState<boolean>(false);
  const [periodNotice, setPeriodNotice] = useState<string | null>(null);

  // Trying to conceive specific state
  const [transitioningToPregnant, setTransitioningToPregnant] = useState<boolean>(false);

  // Pregnancy specific state
  const [dueDateSetupMode, setDueDateSetupMode] = useState<'lmp' | 'scan' | 'unsure'>('lmp');
  const [inputLmpDate, setInputLmpDate] = useState<string>('');
  const [inputScanDueDate, setInputScanDueDate] = useState<string>('');
  const [savingDueDate, setSavingDueDate] = useState<boolean>(false);
  const [showBirthModal, setShowBirthModal] = useState<boolean>(false);
  const [birthModalDate, setBirthModalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savingBirth, setSavingBirth] = useState<boolean>(false);

  // Postpartum & Early Motherhood specific state
  const [showBabyDateModal, setShowBabyDateModal] = useState<boolean>(false);
  const [babyMonth, setBabyMonth] = useState<string>('01');
  const [babyYear, setBabyYear] = useState<string>(String(new Date().getFullYear()));
  const [savingBabyDate, setSavingBabyDate] = useState<boolean>(false);
  const [weeklyFeeling, setWeeklyFeeling] = useState<string | null>(null);
  const [savingFeeling, setSavingFeeling] = useState<boolean>(false);
  const [feelingNotice, setFeelingNotice] = useState<string | null>(null);

  // Menopause specific state
  const [inputAgeStopped, setInputAgeStopped] = useState<string>('');
  const [hysterectomyChoice, setHysterectomyChoice] = useState<'yes' | 'no' | 'not_sure' | ''>('');
  const [savingMenopauseSetup, setSavingMenopauseSetup] = useState<boolean>(false);
  const [menopauseSavedNotice, setMenopauseSavedNotice] = useState<string | null>(null);

  // Living with condition specific state
  const [userConditions, setUserConditions] = useState<UserCondition[]>([]);
  const [loadingConditions, setLoadingConditions] = useState<boolean>(false);
  const [showAddConditionModal, setShowAddConditionModal] = useState<boolean>(false);
  const [conditionChoice, setConditionChoice] = useState<string>('Endometriosis');
  const [customConditionName, setCustomConditionName] = useState<string>('');
  const [conditionStatus, setConditionStatus] = useState<string>('Confirmed by a doctor');
  const [conditionYear, setConditionYear] = useState<string>('');
  const [savingCondition, setSavingCondition] = useState<boolean>(false);

  // Pregnancy loss specific state
  const [lossEvents, setLossEvents] = useState<HealthEvent[]>([]);
  const [lossType, setLossType] = useState<'miscarriage' | 'ectopic' | 'stillbirth' | 'not_sure'>('miscarriage');
  const [lossDate, setLossDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [savingLossEvent, setSavingLossEvent] = useState<boolean>(false);

  // Symptoms from last 3 days for safety triggers
  const [last3DaysSymptoms, setLast3DaysSymptoms] = useState<Symptom[]>([]);

  useEffect(() => {
    if (profile?.id && meta) {
      loadRecentEntries();
      loadLast3DaysSymptoms();

      if (meta.id === 'tracking_periods' || meta.id === 'trying_to_conceive') {
        loadPeriodLogs();
      }
      if (meta.id === 'after_loss') {
        loadLossEvents();
      }
      if (meta.id === 'living_with_condition') {
        loadUserConditions();
      }
      if (meta.id === 'menopause') {
        if (profile.age_periods_stopped) {
          setInputAgeStopped(String(profile.age_periods_stopped));
        }
      }
    }
  }, [profile?.id, meta?.id]);

  async function loadRecentEntries() {
    if (!profile?.id || !meta) return;
    try {
      const { data } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', profile.id)
        .in('type', meta.chips)
        .order('created_at', { ascending: false })
        .limit(8);

      if (data) setRecentEntries(data);
    } catch (err) {
      console.warn('Error loading recent entries:', err);
    }
  }

  async function loadLast3DaysSymptoms() {
    if (!profile?.id) return;
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', profile.id)
        .gte('created_at', threeDaysAgo)
        .order('created_at', { ascending: false });

      if (data) setLast3DaysSymptoms(data);
    } catch (err) {
      console.warn('Error loading last 3 days symptoms:', err);
    }
  }

  async function loadPeriodLogs() {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('start_date', { ascending: false });

      if (data) setPeriodLogs(data);
    } catch (err) {
      console.warn('Error loading period logs:', err);
    }
  }

  async function loadLossEvents() {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('health_events')
        .select('*')
        .eq('user_id', profile.id)
        .eq('event_type', 'pregnancy_loss')
        .order('event_date', { ascending: false });

      if (data) setLossEvents(data);
    } catch (err) {
      console.warn('Error loading loss events:', err);
    }
  }

  async function loadUserConditions() {
    if (!profile?.id) return;
    try {
      setLoadingConditions(true);
      const { data, error } = await supabase
        .from('user_conditions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUserConditions(data || []);
    } catch (err) {
      console.warn('Error loading user conditions:', err);
    } finally {
      setLoadingConditions(false);
    }
  }

  // Toggle symptom chip
  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip]
    );
  };

  // Save symptoms to story
  const handleSaveSymptoms = async () => {
    if (!profile?.id || selectedChips.length === 0 || savingSymptoms) return;

    try {
      setSavingSymptoms(true);
      setLogError(null);

      const rows = selectedChips.map(chip => ({
        user_id: profile.id,
        type: chip,
        severity,
        notes: notes.trim() || null,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('symptoms')
        .insert(rows);

      if (error) throw error;

      setSavedSuccess(true);
      setSelectedChips([]);
      setNotes('');
      setSeverity(5);
      await loadRecentEntries();
      await loadLast3DaysSymptoms();

      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (err: any) {
      console.error('Error saving symptoms:', err);
      setLogError(err.message || 'Could not save symptoms. Please try again.');
    } finally {
      setSavingSymptoms(false);
    }
  };

  // Copy doctor question
  const handleCopyQuestion = async (q: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(q);
      setCopiedQuestionIdx(idx);
      setTimeout(() => setCopiedQuestionIdx(null), 2500);
    } catch {
      // Fallback
    }
  };

  // Period started
  const handlePeriodStarted = async () => {
    if (!profile?.id || !periodDate || periodSaving) return;
    try {
      setPeriodSaving(true);
      setPeriodNotice(null);

      const { error } = await supabase.from('period_logs').insert({
        user_id: profile.id,
        start_date: periodDate,
        flow: selectedFlow,
        end_date: null
      });

      if (error) throw error;
      setPeriodNotice('Period start recorded successfully.');
      await loadPeriodLogs();
      await refetchProfile();
      setTimeout(() => setPeriodNotice(null), 3500);
    } catch (err: any) {
      console.error('Error saving period start:', err);
      setPeriodNotice('Could not save period start. Please retry.');
    } finally {
      setPeriodSaving(false);
    }
  };

  // Period ended
  const handlePeriodEnded = async () => {
    if (!profile?.id || periodSaving) return;
    try {
      setPeriodSaving(true);
      setPeriodNotice(null);

      const openPeriod = periodLogs.find(p => !p.end_date);
      if (openPeriod?.id) {
        const { error } = await supabase
          .from('period_logs')
          .update({ end_date: periodDate })
          .eq('id', openPeriod.id);

        if (error) throw error;
        setPeriodNotice('Period end recorded on active cycle.');
      } else if (periodLogs.length > 0) {
        const mostRecent = periodLogs[0];
        const { error } = await supabase
          .from('period_logs')
          .update({ end_date: periodDate })
          .eq('id', mostRecent.id);

        if (error) throw error;
        setPeriodNotice('Period end recorded on latest cycle.');
      } else {
        setPeriodNotice('No active period found. Record a start date first.');
      }

      await loadPeriodLogs();
      await refetchProfile();
      setTimeout(() => setPeriodNotice(null), 3500);
    } catch (err: any) {
      console.error('Error ending period:', err);
      setPeriodNotice('Could not record period end. Please retry.');
    } finally {
      setPeriodSaving(false);
    }
  };

  // Trying to conceive: 'I am pregnant' button handler
  const handleIamPregnant = async () => {
    if (!profile?.id || transitioningToPregnant) return;
    try {
      setTransitioningToPregnant(true);
      const currentStages = profile.stages || [];
      const updatedStages = Array.from(new Set([...currentStages, 'pregnant']));

      const { error } = await supabase
        .from('users')
        .update({ stages: updatedStages })
        .eq('id', profile.id);

      if (error) throw error;
      await refetchProfile();
      navigate('/mother-dashboard/journey/pregnant');
    } catch (err) {
      console.error('Error transitioning to pregnant:', err);
    } finally {
      setTransitioningToPregnant(false);
    }
  };

  // Pregnancy: Save Due Date
  const handleSaveDueDate = async () => {
    if (!profile?.id || savingDueDate) return;
    try {
      setSavingDueDate(true);
      let calculatedDueDate = '';

      if (dueDateSetupMode === 'lmp' && inputLmpDate) {
        const lmp = new Date(inputLmpDate);
        const due = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);
        calculatedDueDate = due.toISOString().split('T')[0];
      } else if (dueDateSetupMode === 'scan' && inputScanDueDate) {
        calculatedDueDate = inputScanDueDate;
      }

      if (!calculatedDueDate) return;

      const payload: Record<string, any> = { due_date: calculatedDueDate };
      if (inputLmpDate) payload.last_period_date = inputLmpDate;

      const { error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', profile.id);

      if (error) throw error;
      await refetchProfile();
    } catch (err) {
      console.error('Error saving due date:', err);
    } finally {
      setSavingDueDate(false);
    }
  };

  // Pregnancy: 'I have given birth' handler
  const handleConfirmBirth = async () => {
    if (!profile?.id || savingBirth) return;
    try {
      setSavingBirth(true);
      // Sets youngest_child_birth_date to the 1st of that month (YYYY-MM-01)
      const [year, month] = birthModalDate.split('-');
      const formattedMonthDate = `${year}-${month}-01`;

      const currentStages = profile.stages || [];
      const updatedStages = currentStages
        .map(s => s === 'pregnant' ? 'early_motherhood' : s);
      if (!updatedStages.includes('early_motherhood')) {
        updatedStages.push('early_motherhood');
      }

      const { error } = await supabase
        .from('users')
        .update({
          youngest_child_birth_date: formattedMonthDate,
          stages: updatedStages
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refetchProfile();
      setShowBirthModal(false);
      navigate('/mother-dashboard/journey/early_motherhood');
    } catch (err) {
      console.error('Error recording birth completion:', err);
    } finally {
      setSavingBirth(false);
    }
  };

  // Postpartum & Early Motherhood: Save Baby Birth Date
  const handleSaveBabyDate = async () => {
    if (!profile?.id || savingBabyDate) return;
    try {
      setSavingBabyDate(true);
      const formattedDate = `${babyYear}-${babyMonth}-01`;
      const { error } = await supabase
        .from('users')
        .update({ youngest_child_birth_date: formattedDate })
        .eq('id', profile.id);

      if (error) throw error;
      await refetchProfile();
      setShowBabyDateModal(false);
    } catch (err) {
      console.error('Error saving baby birth date:', err);
    } finally {
      setSavingBabyDate(false);
    }
  };

  // Postpartum & Early Motherhood: Weekly feeling check-in
  const handleSaveWeeklyFeeling = async (choice: string) => {
    if (!profile?.id || savingFeeling) return;
    try {
      setSavingFeeling(true);
      setWeeklyFeeling(choice);
      setFeelingNotice(null);

      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('health_events')
        .insert({
          user_id: profile.id,
          event_type: 'note',
          title: 'Weekly check-in: How are you feeling in yourself?',
          details: choice,
          status: 'experienced',
          event_date: today
        });

      if (error) throw error;
      setFeelingNotice('Check-in recorded to your health story.');
      setTimeout(() => setFeelingNotice(null), 4000);
    } catch (err) {
      console.error('Error saving weekly check-in:', err);
    } finally {
      setSavingFeeling(false);
    }
  };

  // Menopause: Save setup answers
  const handleSaveMenopauseSetup = async () => {
    if (!profile?.id || savingMenopauseSetup) return;
    try {
      setSavingMenopauseSetup(true);
      setMenopauseSavedNotice(null);

      const updates: Record<string, any> = {};
      if (inputAgeStopped) {
        updates.age_periods_stopped = parseInt(inputAgeStopped, 10);
      }
      if (hysterectomyChoice === 'yes') {
        updates.tracks_periods = false;
        // Also save procedure event to health_events
        await supabase.from('health_events').insert({
          user_id: profile.id,
          event_type: 'procedure',
          title: 'Hysterectomy or ovary removal',
          details: 'Confirmed by user in menopause settings',
          status: 'confirmed',
          event_date: new Date().toISOString().split('T')[0]
        });
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('users').update(updates).eq('id', profile.id);
      }

      await refetchProfile();
      setMenopauseSavedNotice('Menopause details saved successfully.');
      setTimeout(() => setMenopauseSavedNotice(null), 3500);
    } catch (err) {
      console.error('Error saving menopause details:', err);
    } finally {
      setSavingMenopauseSetup(false);
    }
  };

  // Living with condition: Add Condition
  const handleSaveCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || savingCondition) return;

    const finalName = conditionChoice === 'Other' ? customConditionName.trim() : conditionChoice;
    if (!finalName) return;

    try {
      setSavingCondition(true);
      const payload: Partial<UserCondition> = {
        user_id: profile.id,
        condition: finalName,
        status: conditionStatus,
        diagnosed_year: conditionYear ? parseInt(conditionYear, 10) : null
      };

      const { error } = await supabase.from('user_conditions').insert([payload]);
      if (error) throw error;

      setShowAddConditionModal(false);
      setCustomConditionName('');
      setConditionYear('');
      await loadUserConditions();
    } catch (err) {
      console.error('Error adding condition:', err);
    } finally {
      setSavingCondition(false);
    }
  };

  // Save Pregnancy Loss event (What happened?)
  const handleSaveLossEvent = async () => {
    if (!profile?.id || savingLossEvent) return;
    try {
      setSavingLossEvent(true);
      const { error } = await supabase.from('health_events').insert({
        user_id: profile.id,
        title: `Pregnancy loss (${lossType})`,
        event_type: 'pregnancy_loss',
        loss_type: lossType,
        event_date: lossDate,
        status: 'experienced'
      });

      if (error) throw error;
      await loadLossEvents();
      await refetchProfile();
    } catch (err) {
      console.error('Error saving pregnancy loss record:', err);
    } finally {
      setSavingLossEvent(false);
    }
  };

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans pb-20">
        <div className="max-w-md mx-auto px-4 py-8 space-y-4 text-center">
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-8 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#3B1409]" />
            </div>
            <h1 className="text-xl font-bold font-serif text-[#3B1409] capitalize">
              {stage?.replace(/_/g, ' ') || 'Stage'}
            </h1>
            <p className="text-xs text-[#6B4A3A] max-w-xs mx-auto leading-relaxed">
              Explore your journey stages or return to Today.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/choose-journey')}
                className="btn-secondary text-xs inline-flex items-center gap-1.5 py-2 px-4"
              >
                <span>View all journey stages</span>
              </button>
            </div>
          </div>
          <RootsDivider />
        </div>
      </div>
    );
  }

  const IconComp = meta.icon;

  // Evaluate cycle range for tracking_periods & trying_to_conceive
  const cycleResult = (meta.id === 'tracking_periods' || meta.id === 'trying_to_conceive') 
    ? evaluateCycle(periodLogs, profile) 
    : null;
  const currCycleDay = cycleResult?.currentCycleDay || 1;
  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringProgress = Math.min(1, Math.max(0.04, (currCycleDay || 1) / 28));
  const ringOffset = ringCircumference - ringProgress * ringCircumference;
  const openPeriod = periodLogs.find(p => !p.end_date);

  // Pregnancy week calculation
  const pregnancyProgress = useMemo(() => {
    if (!profile?.due_date) return null;
    try {
      const today = new Date();
      const dueDate = new Date(profile.due_date);
      if (isNaN(dueDate.getTime())) return null;

      const conceptionTime = dueDate.getTime() - 280 * 24 * 60 * 60 * 1000;
      const diffMs = today.getTime() - conceptionTime;
      const currentWeek = Math.min(42, Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1));
      const daysToGo = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

      let trimester = 'First trimester';
      if (currentWeek >= 27) trimester = 'Third trimester';
      else if (currentWeek >= 13) trimester = 'Second trimester';

      return { currentWeek, trimester, daysToGo };
    } catch {
      return null;
    }
  }, [profile?.due_date]);

  // Urgent pregnancy alert trigger:
  // if in the last 3 days she logged Bleeding, Fluid leaking, Reduced baby movement, Fever, or Headache with strength 7 or more
  const showPregnantUrgentAlert = useMemo(() => {
    if (meta.id !== 'pregnant') return false;
    return last3DaysSymptoms.some(s => {
      const t = (s.type || '').toLowerCase();
      if (t.includes('bleeding')) return true;
      if (t.includes('fluid leaking') || t.includes('leaking')) return true;
      if (t.includes('reduced baby movement') || t.includes('baby movement')) return true;
      if (t.includes('fever')) return true;
      if (t.includes('headache') && (s.severity ?? 0) >= 7) return true;
      return false;
    });
  }, [meta.id, last3DaysSymptoms]);

  // Urgent postpartum / early motherhood alert trigger:
  // if she logs Very heavy bleeding, Fever, Severe headache, Chest pain or trouble breathing, Leg pain or swelling, or Thoughts of harming myself or my baby
  const showPostpartumUrgentAlert = useMemo(() => {
    if (meta.id !== 'postpartum' && meta.id !== 'early_motherhood') return false;
    return last3DaysSymptoms.some(s => {
      const t = (s.type || '').toLowerCase();
      if (t.includes('very heavy bleeding') || (t.includes('bleeding') && (s.severity ?? 0) >= 8)) return true;
      if (t.includes('fever')) return true;
      if (t.includes('severe headache') || (t.includes('headache') && (s.severity ?? 0) >= 7)) return true;
      if (t.includes('chest pain') || t.includes('breathing')) return true;
      if (t.includes('leg pain') || t.includes('swelling')) return true;
      if (t.includes('harming') || t.includes('myself or my baby')) return true;
      return false;
    });
  }, [meta.id, last3DaysSymptoms]);

  // Baby age text for Postpartum & Early Motherhood
  const babyAgeText = useMemo(() => {
    if (!profile?.youngest_child_birth_date) return null;
    try {
      const birth = new Date(profile.youngest_child_birth_date);
      const now = new Date();
      if (isNaN(birth.getTime())) return null;

      const diffDays = Math.max(0, Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30.4375);

      if (diffMonths < 3 || diffWeeks <= 12) {
        const w = Math.max(1, diffWeeks);
        return `Baby, about ${w} ${w === 1 ? 'week' : 'weeks'}`;
      } else {
        const m = Math.max(1, diffMonths);
        return `Baby, about ${m} ${m === 1 ? 'month' : 'months'}`;
      }
    } catch {
      return null;
    }
  }, [profile?.youngest_child_birth_date]);

  // Menopause safety check: age under 40
  const isMenopauseUnder40 = useMemo(() => {
    if (meta.id !== 'menopause') return false;
    if (profile?.age_periods_stopped && profile.age_periods_stopped < 40) return true;
    if (profile?.date_of_birth && profile?.last_period_date) {
      const calculatedAge = calculateAgeAtDate(profile.date_of_birth, profile.last_period_date);
      if (calculatedAge !== null && calculatedAge < 40) return true;
    }
    return false;
  }, [meta.id, profile?.age_periods_stopped, profile?.date_of_birth, profile?.last_period_date]);

  // Menopause bleeding warning: if she logged bleeding
  const showMenopauseBleedingAlert = useMemo(() => {
    if (meta.id !== 'menopause') return false;
    return last3DaysSymptoms.some(s => (s.type || '').toLowerCase().includes('bleeding'));
  }, [meta.id, last3DaysSymptoms]);

  const hasLossEvent = lossEvents.length > 0;

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans pb-24">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5 animate-in fade-in duration-300">
        
        {/* Back and Stage Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => navigate('/mother-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9421B] hover:text-[#833518] py-2 px-1 focus-ring rounded-xl min-h-[44px]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#A9421B]" />
            <span>Today</span>
          </button>

          <Link
            to="/choose-journey"
            className="text-xs font-semibold text-[#A9421B] hover:underline"
          >
            Change stages
          </Link>
        </div>

        {/* 1. Header Banner */}
        <div className={cn("rounded-3xl p-6 shadow-md relative overflow-hidden", meta.headerBg)}>
          <LeafSprigHeader />

          <div className="flex items-start gap-3.5 relative z-10">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 border",
              meta.headerTextColor === 'text-[#3B1409]'
                ? "bg-[#3B1409]/10 text-[#3B1409] border-[#3B1409]/20"
                : "bg-white/20 text-white border-white/25"
            )}>
              <IconComp className={cn("w-5 h-5", meta.headerTextColor === 'text-[#3B1409]' ? "text-[#3B1409]" : "text-white")} />
            </div>
            <div className="space-y-1 min-w-0">
              <h1 className={cn("text-xl sm:text-2xl font-bold font-serif tracking-tight leading-snug", meta.headerTextColor || "text-white")}>
                {meta.headerTitle || meta.title}
              </h1>
              <p className={cn("text-xs leading-relaxed font-sans font-medium", meta.headerTextColor === 'text-[#3B1409]' ? "text-[#3B1409]/85" : "text-white/90")}>
                {meta.oneLine}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STAGE: TRYING TO CONCEIVE SPECIFIC ACTIONS & CYCLE CARD */}
        {/* ========================================================================= */}
        {meta.id === 'trying_to_conceive' && (
          <div className="space-y-4">
            {/* 'I am pregnant' Transition Button */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  Got a positive test?
                </h3>
                <p className="text-xs text-[#6B4A3A] mt-0.5">
                  Move forward to your pregnancy journey.
                </p>
              </div>
              <button
                type="button"
                disabled={transitioningToPregnant}
                onClick={handleIamPregnant}
                className="btn-primary !w-auto !min-h-[44px] !py-2 !px-4 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                {transitioningToPregnant ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Heart className="w-3.5 h-3.5" />}
                <span>I am pregnant</span>
              </button>
            </div>

            {/* Questions to ask a clinician card */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#E3F1DA] border border-[#BFDDAE] text-[#2F6B3F] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                    Questions to ask a clinician
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                  Sample guidance, pending clinician review
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {meta.doctorQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl flex items-center justify-between gap-2 text-xs text-[#3B1409]"
                  >
                    <span className="leading-relaxed">{q}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyQuestion(q, idx)}
                      className="p-1.5 text-[#A9421B] hover:bg-[#F6E7D8] rounded-lg shrink-0 transition-colors"
                      title="Copy question"
                    >
                      {copiedQuestionIdx === idx ? <Check className="w-4 h-4 text-[#2F6B3F]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CYCLE RANGE CARD (for tracking_periods and trying_to_conceive) */}
        {/* ========================================================================= */}
        {(meta.id === 'tracking_periods' || meta.id === 'trying_to_conceive') && cycleResult && (
          <div className="bg-[#E3F1DA] border border-[#BFDDAE] rounded-3xl p-5 shadow-xs space-y-4 text-[#1F4A2B]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F4A2B]">
                Cycle Rhythm
              </span>
              <span className="text-[10px] font-semibold text-[#1F4A2B] bg-white/70 px-2 py-0.5 rounded-full border border-[#BFDDAE]">
                Sample guidance, pending clinician review
              </span>
            </div>

            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    stroke="#BFDDAE"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={ringRadius}
                    stroke="#6DB04F"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold font-serif text-[#3B1409] leading-none">
                    {currCycleDay}
                  </span>
                  <span className="text-[10px] font-bold text-[#1F4A2B] tracking-wider uppercase mt-1">
                    Cycle Day
                  </span>
                </div>
              </div>

              <div className="text-center mt-3 space-y-1">
                <p className="text-sm font-bold font-serif text-[#3B1409]">
                  {cycleResult.rangeText}
                </p>
                {cycleResult.profileCycleText && (
                  <p className="text-xs text-[#1F4A2B]">
                    {cycleResult.profileCycleText}
                  </p>
                )}
              </div>
            </div>

            {cycleResult.isLaterThanRange && cycleResult.laterThanRangeText && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] rounded-2xl text-xs text-[#7A2E10] leading-relaxed font-medium">
                {cycleResult.laterThanRangeText}
              </div>
            )}

            {periodNotice && (
              <div className="p-3 bg-white border border-[#C5C98F] rounded-2xl text-xs font-semibold text-[#3F4318] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#5E5A28]" />
                <span>{periodNotice}</span>
              </div>
            )}

            {/* Date Picker & Flow Chips for Period Logging */}
            <div className="space-y-3 pt-2 border-t border-[#BFDDAE]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1F4A2B] uppercase tracking-wider block">
                  Date
                </label>
                {openPeriod && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F8DFC8] text-[#7A2E10] border border-[#E0A77A] animate-pulse">
                    Period active
                  </span>
                )}
              </div>

              <input
                type="date"
                value={periodDate}
                onChange={(e) => setPeriodDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1F4A2B] uppercase tracking-wider block">
                  Flow
                </label>
                <div className="flex flex-wrap gap-2">
                  {FLOW_OPTIONS.map((f) => {
                    const isSelected = selectedFlow === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setSelectedFlow(f)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                          isSelected
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#E3F1DA]"
                        )}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  disabled={periodSaving}
                  onClick={handlePeriodStarted}
                  className="btn-primary min-h-[46px] flex items-center justify-center gap-1.5 text-xs"
                >
                  <Droplet className="w-3.5 h-3.5 text-white" />
                  <span>My period started</span>
                </button>

                <button
                  type="button"
                  disabled={periodSaving}
                  onClick={handlePeriodEnded}
                  className="btn-secondary min-h-[46px] flex items-center justify-center gap-1.5 text-xs bg-white"
                >
                  <Check className="w-3.5 h-3.5 text-[#2F6B3F]" />
                  <span>My period ended</span>
                </button>
              </div>
            </div>

            {/* Historical Cycle Bars */}
            {cycleResult.barData && cycleResult.barData.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#BFDDAE]/80">
                <span className="text-[11px] font-bold text-[#1F4A2B] uppercase tracking-wider block">
                  Last {cycleResult.barData.length} Cycles
                </span>
                <div className="space-y-2">
                  {cycleResult.barData.map((bar, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px]">
                      <span className="w-6 text-[#1F4A2B] font-medium shrink-0">
                        C{bar.cycleIndex}
                      </span>
                      <div className="flex-1 bg-[#BFDDAE]/50 h-4 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-[#6DB04F] h-full rounded-full transition-all duration-500"
                          style={{ width: `${bar.percentage}%` }}
                        />
                      </div>
                      <span className="w-8 font-bold text-[#3B1409] text-right shrink-0">
                        {bar.days}d
                      </span>
                      {bar.isShortest && (
                        <span className="text-[10px] bg-white text-[#1F4A2B] border border-[#BFDDAE] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                          Shortest
                        </span>
                      )}
                      {bar.isLongest && (
                        <span className="text-[10px] bg-[#2F6B3F] text-white px-1.5 py-0.5 rounded-md font-bold shrink-0">
                          Longest
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: PREGNANT SPECIFIC SECTION */}
        {/* ========================================================================= */}
        {meta.id === 'pregnant' && (
          <div className="space-y-4">
            
            {/* Highlighted urgent card in Terracotta with white text (cannot be dismissed) */}
            {showPregnantUrgentAlert && (
              <div className="bg-[#A9421B] text-white rounded-3xl p-5 shadow-md space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                  <h3 className="text-sm font-bold font-serif text-white">
                    Urgent Medical Guidance
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-white font-medium">
                  Please get checked today. Go to a clinic or hospital today. If you feel very unwell, call 112 or an ambulance on 10177.
                </p>
                <div className="flex items-center gap-2 pt-1 font-bold text-xs">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white focus-ring"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 112</span>
                  </a>
                  <a
                    href="tel:10177"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white focus-ring"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Ambulance 10177</span>
                  </a>
                </div>
              </div>
            )}

            {/* DUE DATE SETUP (If due_date is empty) */}
            {!profile?.due_date ? (
              <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    Set up your pregnancy milestones
                  </h3>
                  <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                    Sample guidance, pending clinician review
                  </span>
                </div>
                <p className="text-xs text-[#6B4A3A]">
                  How would you like to calculate your estimated due date?
                </p>

                <div className="space-y-2">
                  {[
                    { id: 'lmp', label: 'My last period date' },
                    { id: 'scan', label: 'My scan gave a due date' },
                    { id: 'unsure', label: 'I am not sure' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors",
                        dueDateSetupMode === opt.id
                          ? "bg-[#E3F1DA]/60 border-[#BFDDAE] text-[#1F4A2B]"
                          : "bg-[#FFF9F2] border-[#EAD5C0] text-[#3B1409]"
                      )}
                    >
                      <input
                        type="radio"
                        name="dueDateMode"
                        value={opt.id}
                        checked={dueDateSetupMode === opt.id}
                        onChange={() => setDueDateSetupMode(opt.id as any)}
                        className="w-4 h-4 text-[#2F6B3F] accent-[#2F6B3F]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>

                {dueDateSetupMode === 'lmp' && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <label className="text-xs font-bold text-[#3B1409] block">
                      First day of your last period
                    </label>
                    <input
                      type="date"
                      value={inputLmpDate}
                      onChange={(e) => setInputLmpDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                    />
                    {inputLmpDate && (
                      <p className="text-xs text-[#2F6B3F] font-medium">
                        Due date will be set to: {formatDate(new Date(new Date(inputLmpDate).getTime() + 280 * 24 * 60 * 60 * 1000))} (280 days)
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={savingDueDate || !inputLmpDate}
                      onClick={handleSaveDueDate}
                      className="btn-primary w-full mt-2"
                    >
                      {savingDueDate ? 'Saving...' : 'Save due date'}
                    </button>
                  </div>
                )}

                {dueDateSetupMode === 'scan' && (
                  <div className="space-y-2 pt-1 animate-in fade-in">
                    <label className="text-xs font-bold text-[#3B1409] block">
                      Estimated due date from scan
                    </label>
                    <input
                      type="date"
                      value={inputScanDueDate}
                      onChange={(e) => setInputScanDueDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                    />
                    <button
                      type="button"
                      disabled={savingDueDate || !inputScanDueDate}
                      onClick={handleSaveDueDate}
                      className="btn-primary w-full mt-2"
                    >
                      {savingDueDate ? 'Saving...' : 'Save due date'}
                    </button>
                  </div>
                )}

                {dueDateSetupMode === 'unsure' && (
                  <div className="p-3.5 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl text-xs text-[#3B1409] leading-relaxed animate-in fade-in">
                    A clinic scan can confirm how far along you are. Book one as soon as you can.
                  </div>
                )}
              </div>
            ) : (
              /* PREGNANCY MILESTONES CARD */
              pregnancyProgress && (
                <div className="bg-[#E3F1DA] border border-[#BFDDAE] rounded-3xl p-5 shadow-xs space-y-3 text-[#1F4A2B]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F4A2B]">
                      Pregnancy Progress
                    </span>
                    <span className="text-[10px] font-semibold text-[#1F4A2B] bg-white/70 px-2 py-0.5 rounded-full border border-[#BFDDAE]">
                      Sample guidance, pending clinician review
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <h2 className="text-2xl font-bold font-serif text-[#3B1409]">
                        Week {pregnancyProgress.currentWeek} of 40
                      </h2>
                      <p className="text-xs font-semibold text-[#1F4A2B] mt-0.5">
                        {pregnancyProgress.trimester}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-[#A9421B]">
                        {pregnancyProgress.daysToGo}
                      </span>
                      <span className="text-xs text-[#6B4A3A] block">days to go</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/80 h-3 rounded-full overflow-hidden p-0.5 border border-[#BFDDAE]">
                    <div
                      className="bg-[#6DB04F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (pregnancyProgress.currentWeek / 40) * 100)}%` }}
                    />
                  </div>

                  {/* Life Transition Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowBirthModal(true)}
                      className="btn-secondary !bg-white text-xs font-bold flex items-center justify-center gap-1.5 py-2.5"
                    >
                      <Baby className="w-3.5 h-3.5 text-[#2F6B3F]" />
                      <span>I have given birth</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/mother-dashboard/journey/after_loss')}
                      className="btn-secondary !bg-white text-xs font-bold flex items-center justify-center gap-1.5 py-2.5"
                    >
                      <HeartHandshake className="w-3.5 h-3.5 text-[#833518]" />
                      <span>I lost this pregnancy</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: POSTPARTUM & EARLY MOTHERHOOD SPECIFIC SECTION */}
        {/* ========================================================================= */}
        {(meta.id === 'postpartum' || meta.id === 'early_motherhood') && (
          <div className="space-y-4">
            
            {/* Urgent postpartum alert in Terracotta */}
            {showPostpartumUrgentAlert && (
              <div className="bg-[#A9421B] text-white rounded-3xl p-5 shadow-md space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                  <h3 className="text-sm font-bold font-serif text-white">
                    Urgent Medical Guidance
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-white font-medium">
                  Please get checked today. Go to a clinic or hospital today, or call 112 or an ambulance on 10177.
                </p>
                <div className="flex items-center gap-2 pt-1 font-bold text-xs">
                  <a
                    href="tel:112"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 112</span>
                  </a>
                  <a
                    href="tel:10177"
                    className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-white"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Ambulance 10177</span>
                  </a>
                </div>
              </div>
            )}

            {/* Baby Age Card */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
                  <Baby className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    {babyAgeText || "Baby's age"}
                  </h3>
                  <p className="text-xs text-[#6B4A3A]">
                    {babyAgeText ? 'Based on birth month & year' : 'Set birth date for milestone support'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBabyDateModal(true)}
                className="btn-secondary !w-auto !min-h-[38px] text-xs font-semibold px-3 py-1.5"
              >
                {babyAgeText ? 'Edit' : 'Set date'}
              </button>
            </div>

            {/* Weekly 'How are you feeling in yourself?' Card */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  How are you feeling in yourself?
                </h3>
                <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                  Weekly check-in
                </span>
              </div>
              <p className="text-xs text-[#6B4A3A]">
                Take a quiet moment to check in with your emotional wellbeing.
              </p>

              {feelingNotice && (
                <div className="p-2.5 bg-[#E3F1DA] border border-[#BFDDAE] rounded-xl text-xs text-[#1F4A2B] font-semibold">
                  {feelingNotice}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                {['Fine', 'Struggling a bit', 'Not coping'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    disabled={savingFeeling}
                    onClick={() => handleSaveWeeklyFeeling(opt)}
                    className={cn(
                      "p-3 rounded-2xl border text-xs font-semibold text-center transition-all focus-ring",
                      weeklyFeeling === opt
                        ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                        : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {weeklyFeeling === 'Not coping' && (
                <div className="p-3.5 bg-[#F8DFC8] border border-[#E0A77A] rounded-2xl text-xs text-[#7A2E10] space-y-1 font-medium leading-relaxed animate-in fade-in">
                  <p className="font-bold">
                    Please speak to a clinician or someone you trust.
                  </p>
                  <p>
                    Postpartum emotional changes are common and treatable. Your midwife, clinic doctor, or mental health nurse is there to support you without judgment.
                  </p>
                </div>
              )}
            </div>

            {/* Traditional Remedy Guidance Card */}
            <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  Someone suggested a traditional remedy for your baby?
                </h3>
                <span className="text-[10px] font-semibold text-[#6B4A3A] bg-white px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                  Sample guidance, pending clinician review
                </span>
              </div>
              <p className="text-xs text-[#3B1409] leading-relaxed">
                Baby with a fever or trouble breathing? Go to a clinic or hospital now.
              </p>
              <button
                type="button"
                onClick={() => navigate('/culture')}
                className="btn-secondary !w-auto text-xs font-bold inline-flex items-center gap-1.5 py-2 px-3.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#2F6B3F]" />
                <span>Look it up first</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: MENOPAUSE SPECIFIC SECTION */}
        {/* ========================================================================= */}
        {meta.id === 'menopause' && (
          <div className="space-y-4">
            
            {/* Under 40 Highlighted Safety Alert */}
            {isMenopauseUnder40 && (
              <div className="bg-[#A9421B] text-white rounded-3xl p-5 shadow-md space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-white shrink-0" />
                  <h3 className="text-sm font-bold font-serif text-white">
                    Important Clinical Notice
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-white font-medium">
                  Periods stopping before 40 need a medical check. This is not a normal change at your age. Please see a clinician.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/doctor')}
                  className="inline-flex items-center gap-1.5 bg-white text-[#A9421B] font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Go to Doctor summary</span>
                </button>
              </div>
            )}

            {/* Bleeding Alert */}
            {showMenopauseBleedingAlert && (
              <div className="bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] rounded-3xl p-5 shadow-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#7A2E10] shrink-0" />
                  <h3 className="text-xs font-bold font-serif">
                    Post-Menopausal Bleeding Notice
                  </h3>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  Bleeding after your periods have stopped should always be checked by a clinician.
                </p>
              </div>
            )}

            {/* Menopause Setup & Surgery Questions */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  Your Menopause Journey Profile
                </h3>
                <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                  Sample guidance, pending clinician review
                </span>
              </div>

              {menopauseSavedNotice && (
                <div className="p-2.5 bg-[#E3F1DA] border border-[#BFDDAE] text-[#1F4A2B] text-xs font-semibold rounded-xl">
                  {menopauseSavedNotice}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  How old were you when your periods became irregular or stopped?
                </label>
                <input
                  type="number"
                  min="20"
                  max="65"
                  value={inputAgeStopped}
                  onChange={(e) => setInputAgeStopped(e.target.value)}
                  placeholder="e.g. 48"
                  className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Have you had a hysterectomy or your ovaries removed?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'yes', label: 'Yes' },
                    { id: 'no', label: 'No' },
                    { id: 'not_sure', label: 'Not sure' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHysterectomyChoice(opt.id as any)}
                      className={cn(
                        "p-2.5 rounded-2xl border text-xs font-semibold text-center transition-all focus-ring",
                        hysterectomyChoice === opt.id
                          ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                          : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {hysterectomyChoice === 'yes' && (
                  <p className="text-[11px] text-[#2F6B3F] font-medium pt-1">
                    Saves surgical confirmation and adjusts period tracking automatically.
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={savingMenopauseSetup}
                  onClick={handleSaveMenopauseSetup}
                  className="btn-primary !min-h-[44px] text-xs font-bold w-full"
                >
                  {savingMenopauseSetup ? 'Saving details...' : 'Save menopause answers'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: LIVING WITH A CONDITION SPECIFIC SECTION */}
        {/* ========================================================================= */}
        {meta.id === 'living_with_condition' && (
          <div className="space-y-4">
            
            {/* Conditions list */}
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    Your Diagnosed & Tracked Conditions
                  </h3>
                  <p className="text-xs text-[#6B4A3A]">
                    Organized for sharing with clinicians.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddConditionModal(true)}
                  className="btn-primary !w-auto !min-h-[40px] !py-1.5 !px-3 text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add a condition</span>
                </button>
              </div>

              {loadingConditions ? (
                <div className="py-4 text-center text-xs text-[#6B4A3A]">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#A9421B]" />
                </div>
              ) : userConditions.length === 0 ? (
                <div className="p-4 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl text-center space-y-2">
                  <p className="text-xs text-[#6B4A3A]">
                    No conditions listed yet. Add diagnoses such as Endometriosis, PCOS, or Fibroids to track flare-ups.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userConditions.map((cond) => {
                    const statusStr = (cond.status || '').toLowerCase();
                    const isConfirmed = statusStr.includes('confirmed');
                    const isSuspected = statusStr.includes('suspected');

                    return (
                      <div
                        key={cond.id || cond.condition}
                        className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#3B1409] block sm:inline">
                            {cond.condition}
                          </span>
                          {cond.diagnosed_year && (
                            <span className="text-[11px] text-[#6B4A3A] sm:ml-2">
                              Diagnosed: {cond.diagnosed_year}
                            </span>
                          )}
                        </div>

                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0",
                          isConfirmed 
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F]" 
                            : isSuspected 
                              ? "bg-[#F7CCA5] text-[#3B1409] border-[#E0A77A]" 
                              : "bg-[#F6E7D8] text-[#3B1409] border-[#EAD5C0]"
                        )}>
                          {cond.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Button: 'Prepare a summary' to Doctor Tab */}
              <div className="pt-2 border-t border-[#EAD5C0]">
                <button
                  type="button"
                  onClick={() => navigate('/doctor')}
                  className="btn-secondary w-full text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#A9421B]" />
                  <span>Prepare a summary for my doctor</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE: PREGNANCY LOSS SPECIFIC SECTION */}
        {/* ========================================================================= */}
        {meta.id === 'after_loss' && (
          <div className="space-y-4">
            {!hasLossEvent ? (
              <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h2 className="text-base font-bold font-serif text-[#3B1409]">
                    What happened?
                  </h2>
                  <p className="text-xs text-[#6B4A3A] leading-relaxed">
                    Recording this tailors your guidance and removes pregnancy milestones from your dashboard.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3B1409] uppercase tracking-wider block">
                    Type of experience
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'miscarriage', label: 'Miscarriage' },
                      { id: 'ectopic', label: 'Ectopic pregnancy' },
                      { id: 'stillbirth', label: 'Stillbirth' },
                      { id: 'not_sure', label: 'Not sure' }
                    ].map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLossType(item.id as any)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-semibold border transition-all focus-ring",
                          lossType === item.id
                            ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3B1409] uppercase tracking-wider block">
                    Date of loss
                  </label>
                  <input
                    type="date"
                    value={lossDate}
                    onChange={(e) => setLossDate(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  />
                </div>

                <button
                  type="button"
                  disabled={savingLossEvent}
                  onClick={handleSaveLossEvent}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs"
                >
                  {savingLossEvent ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save to my story & continue</span>}
                </button>
              </div>
            ) : (
              <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3 shadow-xs">
                <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
                  Sample guidance, pending clinician review
                </span>
                <p className="text-xs text-[#3B1409] leading-relaxed">
                  Physical recovery takes time. Rest, gentle nourishment, and emotional gentleness are essential right now.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LOG CARD: SYMPTOM & CHECK-IN (COMMON TO ALL DASHBOARDS) */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-serif text-[#3B1409]">
                {meta.id === 'living_with_condition' ? 'Log Flare-Up Symptoms' : 'Log your symptoms & notes'}
              </h2>
              <p className="text-xs text-[#6B4A3A]">
                Tap chips that reflect how you feel today.
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[#6B4A3A] bg-[#FFF9F2] px-2 py-0.5 rounded-full border border-[#EAD5C0]">
              Sample guidance, pending clinician review
            </span>
          </div>

          {logError && (
            <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{logError}</span>
            </div>
          )}

          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {meta.chips.map((chip) => {
              const isSelected = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    "min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 focus-ring",
                    isSelected
                      ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                      : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>

          {/* Severity slider if any chip selected */}
          {selectedChips.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#EAD5C0] animate-in fade-in">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Overall Intensity / Severity
                </label>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-md",
                  severity >= 7 ? "bg-[#F8DFC8] text-[#7A2E10]" : "bg-[#F6E7D8] text-[#3B1409]"
                )}>
                  {severity} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value, 10))}
                className="w-full accent-[#A9421B] cursor-pointer"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5 pt-1">
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes or context..."
              className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409] resize-none"
            />
          </div>

          {/* Save Button */}
          <button
            type="button"
            disabled={savingSymptoms || selectedChips.length === 0}
            onClick={handleSaveSymptoms}
            className="btn-primary w-full flex items-center justify-center gap-2 text-xs font-bold"
          >
            {savingSymptoms ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved to your story!</span>
              </>
            ) : (
              <span>Save to my story</span>
            )}
          </button>

          {/* Recent logs */}
          {recentEntries.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#EAD5C0]">
              <span className="text-[11px] font-bold text-[#6B4A3A] uppercase tracking-wider block">
                Recent entries
              </span>
              <div className="space-y-1">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-2 bg-[#FFF9F2] rounded-xl border border-[#EAD5C0] text-xs"
                  >
                    <span className="font-medium text-[#3B1409]">{entry.type}</span>
                    <span className="text-[11px] text-[#6B4A3A]">{formatDate(entry.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <RootsDivider />

      </div>

      {/* ========================================================================= */}
      {/* MODAL: BIRTH DATE INPUT (for 'I have given birth') */}
      {/* ========================================================================= */}
      {showBirthModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#E3F1DA] border border-[#BFDDAE] text-[#2F6B3F] flex items-center justify-center mx-auto">
              <Baby className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                Welcome Little One!
              </h3>
              <p className="text-xs text-[#6B4A3A]">
                When was your baby born? This will transition your journey to Early motherhood.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#3B1409] block">
                Birth date
              </label>
              <input
                type="date"
                value={birthModalDate}
                onChange={(e) => setBirthModalDate(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={savingBirth}
                onClick={() => setShowBirthModal(false)}
                className="btn-secondary !min-h-[44px] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingBirth}
                onClick={handleConfirmBirth}
                className="btn-primary !min-h-[44px] text-xs font-bold"
              >
                {savingBirth ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BABY MONTH & YEAR (for Postpartum / Early Motherhood) */}
      {/* ========================================================================= */}
      {showBabyDateModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center mx-auto">
              <Baby className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                Baby's birth month & year
              </h3>
              <p className="text-xs text-[#6B4A3A]">
                Used to provide developmental milestones and postpartum recovery timing.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-[#3B1409] uppercase tracking-wider block mb-1">
                  Month
                </label>
                <select
                  value={babyMonth}
                  onChange={(e) => setBabyMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                >
                  {[
                    { val: '01', label: 'January' },
                    { val: '02', label: 'February' },
                    { val: '03', label: 'March' },
                    { val: '04', label: 'April' },
                    { val: '05', label: 'May' },
                    { val: '06', label: 'June' },
                    { val: '07', label: 'July' },
                    { val: '08', label: 'August' },
                    { val: '09', label: 'September' },
                    { val: '10', label: 'October' },
                    { val: '11', label: 'November' },
                    { val: '12', label: 'December' },
                  ].map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#3B1409] uppercase tracking-wider block mb-1">
                  Year
                </label>
                <select
                  value={babyYear}
                  onChange={(e) => setBabyYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                >
                  {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                    <option key={yr} value={String(yr)}>{yr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={savingBabyDate}
                onClick={() => setShowBabyDateModal(false)}
                className="btn-secondary !min-h-[44px] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingBabyDate}
                onClick={handleSaveBabyDate}
                className="btn-primary !min-h-[44px] text-xs font-bold"
              >
                {savingBabyDate ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD A CONDITION (for Living with condition) */}
      {/* ========================================================================= */}
      {showAddConditionModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                Add a condition
              </h3>
              <button
                type="button"
                onClick={() => setShowAddConditionModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCondition} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Condition *
                </label>
                <select
                  value={conditionChoice}
                  onChange={(e) => setConditionChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                >
                  <option value="Endometriosis">Endometriosis</option>
                  <option value="Fibroids">Fibroids</option>
                  <option value="PCOS">PCOS</option>
                  <option value="Ovarian cysts">Ovarian cysts</option>
                  <option value="Past ectopic pregnancy">Past ectopic pregnancy</option>
                  <option value="Other">Other with free text</option>
                </select>
              </div>

              {conditionChoice === 'Other' && (
                <div className="space-y-1.5 animate-in fade-in">
                  <label className="text-xs font-bold text-[#3B1409] block">
                    Condition name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customConditionName}
                    onChange={(e) => setCustomConditionName(e.target.value)}
                    placeholder="e.g. Adenomyosis"
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Status *
                </label>
                <div className="space-y-1.5">
                  {[
                    'Confirmed by a doctor',
                    'Suspected',
                    'Not sure'
                  ].map((st) => (
                    <label
                      key={st}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer",
                        conditionStatus === st
                          ? "bg-[#E3F1DA]/60 border-[#BFDDAE] text-[#1F4A2B]"
                          : "bg-white border-[#EAD5C0] text-[#3B1409]"
                      )}
                    >
                      <input
                        type="radio"
                        name="condStatus"
                        value={st}
                        checked={conditionStatus === st}
                        onChange={() => setConditionStatus(st)}
                        className="w-3.5 h-3.5 text-[#2F6B3F] accent-[#2F6B3F]"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Year of diagnosis (optional)
                </label>
                <input
                  type="number"
                  min="1980"
                  max={new Date().getFullYear()}
                  value={conditionYear}
                  onChange={(e) => setConditionYear(e.target.value)}
                  placeholder="e.g. 2022"
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingCondition}
                  className="btn-primary w-full text-xs font-bold flex items-center justify-center gap-2"
                >
                  {savingCondition ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save condition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
