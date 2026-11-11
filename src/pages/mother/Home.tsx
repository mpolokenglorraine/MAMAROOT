import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  Calendar,
  FileText,
  Activity,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Heart,
  Droplet,
  Baby,
  Sparkles,
  Bell,
  CalendarCheck,
  CalendarDays,
  HeartHandshake,
  ThermometerSun,
  Plus,
  Check
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { 
  supabase, 
  Symptom, 
  Appointment, 
  DoctorNote, 
  UserCondition, 
  PeriodLog,
  Pregnancy,
  PregnancyContent,
  LifeStageContent,
  Reminder
} from '../../lib/supabase';
import { formatDate, cn } from '../../lib/utils';
import { isReminderDueToday, isAppointmentInNext24Hours } from '../../lib/reminderUtils';
import { 
  evaluateCard1Alert, 
  evaluateCard2Alert, 
  Card1AlertResult, 
  Card2AlertResult 
} from '../../lib/clinicalAlertEvaluator';
import { 
  evaluatePregnancyUrgentRules, 
  PregnancyUrgentAlertResult 
} from '../../lib/pregnancyRules';
import { 
  evaluatePostpartumWarningRules, 
  PostpartumWarningResult 
} from '../../lib/postpartumRules';
import { 
  evaluateMenopauseSafetyRules, 
  MenopauseSafetyResult 
} from '../../lib/menopauseRules';
import HelplineCard from '../../components/HelplineCard';
import PostpartumMoodCheckCard from '../../components/PostpartumMoodCheckCard';
import { evaluateCycle, CycleEngineResult, parseDateOnly } from '../../lib/cycleEngine';
import { useT } from '../../i18n/useT';
import { LeafSprigHeader, LeafSprigMargin } from '../../components/RootsMotif';

interface StageTileVisual {
  title: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  tileBg: string;
  isPeach?: boolean;
}

const STAGE_TILE_INFO: Record<string, StageTileVisual> = {
  tracking_periods: {
    title: 'Period tracking',
    status: 'Cycle & flow rhythm',
    icon: CalendarDays,
    tileBg: 'bg-[#A9421B]', // Terracotta
  },
  trying_to_conceive: {
    title: 'Trying to conceive',
    status: 'Support & insights',
    icon: Sparkles,
    tileBg: 'bg-[#6DB04F]', // Fresh Leaf
  },
  pregnant: {
    title: 'Pregnancy',
    status: 'Week-by-week guidance',
    icon: Heart,
    tileBg: 'bg-[#2F6B3F]', // Forest Green
  },
  after_loss: {
    title: 'Pregnancy loss support',
    status: 'Compassionate care',
    icon: HeartHandshake,
    tileBg: 'bg-[#833518]', // Clay
  },
  postpartum: {
    title: 'Postpartum',
    status: 'Recovery & baby care',
    icon: Activity,
    tileBg: 'bg-[#F7CCA5]', // Peach with Root Brown icon & text
    isPeach: true,
  },
  early_motherhood: {
    title: 'Early motherhood',
    status: 'Growing together',
    icon: Baby,
    tileBg: 'bg-[#6DB04F]', // Fresh Leaf
  },
  menopause: {
    title: 'Perimenopause & menopause',
    status: 'Hormonal & body care',
    icon: ThermometerSun,
    tileBg: 'bg-[#3B1409]', // Root Brown
  },
  living_with_condition: {
    title: 'Living with a condition',
    status: 'Condition management',
    icon: Stethoscope,
    tileBg: 'bg-[#2F6B3F]', // Forest Green
  },
};

export default function MotherHome() {
  const { user, profile } = useAuth();
  const { t } = useT();
  const navigate = useNavigate();

  // User state
  const [latestSymptom, setLatestSymptom] = useState<Symptom | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [latestDoctorNote, setLatestDoctorNote] = useState<DoctorNote | null>(null);
  const [, setLoading] = useState(true);

  // Reminders and 24h Appointment state
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [hiddenTodayIds, setHiddenTodayIds] = useState<string[]>([]);
  const [appointmentNext24h, setAppointmentNext24h] = useState<Appointment | null>(null);

  // Clinical Alerts state
  const [card1Alert, setCard1Alert] = useState<Card1AlertResult>({
    showAlert: false,
    severePainDays: 0,
    heavyBleedingDays: 0,
    displayText: '',
    expandableText: ''
  });
  const [card2Alert, setCard2Alert] = useState<Card2AlertResult>({
    showAlert: false,
    title: '',
    displayText: ''
  });
  const [card1Expanded, setCard1Expanded] = useState<boolean>(false);

  // Pregnancy state
  const [pregnancyUrgentAlert, setPregnancyUrgentAlert] = useState<PregnancyUrgentAlertResult>({
    showAlert: false,
    title: '',
    displayText: '',
    matchedTriggers: []
  });
  const [activePregnancy, setActivePregnancy] = useState<Pregnancy | null>(null);
  const [pregnancyContent, setPregnancyContent] = useState<PregnancyContent | null>(null);
  const [hasWeeklyContent, setHasWeeklyContent] = useState<boolean>(false);
  const [pregnancyWeek, setPregnancyWeek] = useState<number | null>(null);
  const [daysUntilDue, setDaysUntilDue] = useState<number | null>(null);
  const [trimesterText, setTrimesterText] = useState<string>('');

  // Postpartum & Early Motherhood state
  const [postpartumAlert, setPostpartumAlert] = useState<PostpartumWarningResult>({
    showAlert: false,
    title: '',
    displayText: '',
    hasHarmThoughts: false,
    matchedTags: []
  });
  const [babyAgeInDays, setBabyAgeInDays] = useState<number | null>(null);
  const [babyAgeText, setBabyAgeText] = useState<string>('');
  const [lifeStageContent, setLifeStageContent] = useState<LifeStageContent | null>(null);
  const [hasLifeStageContent, setHasLifeStageContent] = useState<boolean>(false);

  // Perimenopause & Menopause state
  const [menopauseSafety, setMenopauseSafety] = useState<MenopauseSafetyResult>({
    showUnder40Alert: false,
    under40Text: '',
    showPostmenopausalBleedingAlert: false,
    bleedingText: ''
  });
  const [menopauseContent, setMenopauseContent] = useState<LifeStageContent | null>(null);
  const [hasMenopauseContent, setHasMenopauseContent] = useState<boolean>(false);

  // Cycle Engine state
  const [cycleResult, setCycleResult] = useState<CycleEngineResult | null>(null);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [allLifeStageContent, setAllLifeStageContent] = useState<LifeStageContent[]>([]);

  // Extract first name
  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Sister';
  const firstName = fullName.trim().split(' ')[0] || 'Sister';
  const initial = firstName.charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData();
    } else {
      setLoading(false);
    }

    const handleRemindersUpdated = () => {
      if (profile?.id) {
        loadDashboardData();
      }
    };
    window.addEventListener('mama_root_reminders_updated', handleRemindersUpdated);
    return () => {
      window.removeEventListener('mama_root_reminders_updated', handleRemindersUpdated);
    };
  }, [profile?.id, profile?.stages, profile?.tracks_periods, profile?.cycle_regularity]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // 1. Symptoms for this user
      const { data: sympData } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });

      const allSymptoms: Symptom[] = sympData || [];
      if (allSymptoms.length > 0) {
        setLatestSymptom(allSymptoms[0]);
      } else {
        setLatestSymptom(null);
      }

      // 2. User Conditions
      const { data: condData } = await supabase
        .from('user_conditions')
        .select('*')
        .eq('user_id', profile!.id);

      const allConditions: UserCondition[] = condData || [];

      // Evaluate clinical alerts from patient's own saved data (Zero AI)
      const evaluatedCard1 = evaluateCard1Alert(allSymptoms);
      setCard1Alert(evaluatedCard1);

      const evaluatedCard2 = evaluateCard2Alert(
        allSymptoms,
        allConditions,
        profile?.stages || []
      );
      setCard2Alert(evaluatedCard2);

      // 3. Appointments & next 24h appointment
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', profile!.id)
        .order('date', { ascending: true });

      if (apptData && apptData.length > 0) {
        const nowMs = Date.now();
        const upcoming = apptData.find((a: Appointment) => new Date(a.date).getTime() >= nowMs - 3600000) || apptData[0];
        setUpcomingAppointment(upcoming);
        const next24 = apptData.find((a: Appointment) => isAppointmentInNext24Hours(a.date));
        setAppointmentNext24h(next24 || null);
      } else {
        setUpcomingAppointment(null);
        setAppointmentNext24h(null);
      }

      // 4. Reminders due today
      try {
        const { data: remindersData } = await supabase
          .from('reminders')
          .select('*')
          .eq('user_id', profile!.id)
          .eq('is_enabled', true)
          .order('time', { ascending: true });

        if (remindersData) {
          const todayList = remindersData.filter(r => isReminderDueToday(r));
          setDueReminders(todayList);
        } else {
          setDueReminders([]);
        }
      } catch (remErr) {
        console.warn('Could not query reminders for Today:', remErr);
      }

      // 5. Latest doctor note
      const { data: notesData } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notesData && notesData.length > 0) {
        setLatestDoctorNote(notesData[0]);
      }

      // 6. Period logs for Cycle Engine
      const { data: periodData } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', profile!.id)
        .order('start_date', { ascending: false });

      setPeriodLogs(periodData || []);
      const evaluatedCycle = evaluateCycle(periodData || [], profile);
      setCycleResult(evaluatedCycle);

      // 7. Pregnancy Data & Content (Zero AI)
      const { data: pregData } = await supabase
        .from('pregnancies')
        .select('*')
        .eq('user_id', profile!.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const activePreg = pregData && pregData.length > 0 ? (pregData[0] as Pregnancy) : null;
      setActivePregnancy(activePreg);

      const { data: pregLogsData } = await supabase
        .from('pregnancy_logs')
        .select('*')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false });

      const evaluatedPregAlert = evaluatePregnancyUrgentRules(
        pregLogsData || [],
        allSymptoms
      );
      setPregnancyUrgentAlert(evaluatedPregAlert);

      const { data: contentData } = await supabase
        .from('pregnancy_content')
        .select('*');

      if (activePreg?.due_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = parseDateOnly(activePreg.due_date);
        const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setDaysUntilDue(diffDays);

        const daysPregnant = 280 - diffDays;
        const currentWeek = Math.max(1, Math.min(42, Math.floor(daysPregnant / 7) + 1));
        setPregnancyWeek(currentWeek);

        let trim = 'First trimester';
        if (currentWeek >= 28) {
          trim = 'Third trimester';
        } else if (currentWeek >= 13) {
          trim = 'Second trimester';
        }
        setTrimesterText(trim);

        const candidateRows = (contentData || []).filter(
          (row: PregnancyContent) => currentWeek >= row.week_from && currentWeek <= row.week_to
        );

        if (candidateRows.length > 0) {
          setHasWeeklyContent(true);
          const userRisks = activePreg.risk_tags || [];
          const riskMatch = candidateRows.find(
            (row: PregnancyContent) =>
              Array.isArray(row.risk_tags) &&
              row.risk_tags.some((rt: string) => userRisks.includes(rt))
          );
          setPregnancyContent(riskMatch || candidateRows[0]);
        } else {
          setHasWeeklyContent(false);
          setPregnancyContent(null);
        }
      } else {
        setPregnancyWeek(null);
        setDaysUntilDue(null);
        setHasWeeklyContent(false);
        setPregnancyContent(null);
      }

      // 8. Early Motherhood & Postpartum Data
      let calcBabyDays: number | null = null;
      let calcBabyAgeText = '';
      if (profile?.youngest_child_birth_date) {
        const birthDate = parseDateOnly(profile.youngest_child_birth_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.max(0, Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24)));
        calcBabyDays = diffDays;
        if (diffDays < 90) {
          const weeks = Math.max(1, Math.round(diffDays / 7));
          calcBabyAgeText = `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
        } else {
          const months = Math.max(3, Math.round(diffDays / 30.4375));
          calcBabyAgeText = `${months} ${months === 1 ? 'month' : 'months'}`;
        }
      }
      setBabyAgeInDays(calcBabyDays);
      setBabyAgeText(calcBabyAgeText);

      const evaluatedPostpartum = evaluatePostpartumWarningRules(
        allSymptoms,
        calcBabyDays,
        profile?.stages || []
      );
      setPostpartumAlert(evaluatedPostpartum);

      // Query life_stage_content
      const { data: lifeStageData } = await supabase
        .from('life_stage_content')
        .select('*');

      setAllLifeStageContent((lifeStageData as LifeStageContent[]) || []);

      if (lifeStageData && lifeStageData.length > 0) {
        const matchedRows = (lifeStageData as LifeStageContent[]).filter(row => {
          const stageMatch = row.stage === 'postpartum' || row.stage === 'early_motherhood';
          if (!stageMatch) return false;
          if (calcBabyDays === null) return true;
          return calcBabyDays >= (row.age_from_days ?? 0) && calcBabyDays <= (row.age_to_days ?? 9999);
        });

        if (matchedRows.length > 0) {
          setHasLifeStageContent(true);
          setLifeStageContent(matchedRows[0]);
        } else {
          setHasLifeStageContent(false);
          setLifeStageContent(null);
        }
      } else {
        setHasLifeStageContent(false);
        setLifeStageContent(null);
      }

      // 9. Perimenopause & Menopause Safety
      const evaluatedMenoSafety = evaluateMenopauseSafetyRules(
        profile?.date_of_birth,
        profile?.last_period_date,
        profile?.stages || [],
        allSymptoms
      );
      setMenopauseSafety(evaluatedMenoSafety);

      if (lifeStageData && lifeStageData.length > 0) {
        const menoRows = (lifeStageData as LifeStageContent[]).filter(row => {
          return row.stage === 'perimenopause' || row.stage === 'menopause';
        });

        if (menoRows.length > 0) {
          setHasMenopauseContent(true);
          setMenopauseContent(menoRows[0]);
        } else {
          setHasMenopauseContent(false);
          setMenopauseContent(null);
        }
      } else {
        setHasMenopauseContent(false);
        setMenopauseContent(null);
      }
    } catch (err) {
      console.error('Error loading Today dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const stages = profile?.stages || [];
  const isPregnancyContentHidden = 
    profile?.hide_pregnancy_content === true || 
    (profile?.id ? localStorage.getItem(`mama_root_hide_pregnancy_${profile.id}`) === 'true' : false);

  const activeStages = isPregnancyContentHidden
    ? stages.filter(s => s !== 'pregnant')
    : stages;

  const hasStages = Array.isArray(activeStages) && activeStages.length > 0;
  const isPregnant = activeStages.includes('pregnant');
  const isPostpartumOrEarlyMotherhood = activeStages.includes('postpartum') || activeStages.includes('early_motherhood');
  const isMenopause = activeStages.includes('menopause');
  const isIrregular = profile?.cycle_regularity?.toLowerCase() === 'irregular';
  
  const showCycleCard = 
    profile?.tracks_periods !== false && 
    periodLogs.length > 0 && 
    cycleResult !== null && 
    !cycleResult.isSuppressed;

  function getContentForStage(stageKey: string): LifeStageContent | null {
    if (!allLifeStageContent || allLifeStageContent.length === 0) return null;
    return allLifeStageContent.find(row => row.stage === stageKey) || null;
  }

  // Calculate SVG Cycle Ring metrics (radius 45, circumference ~283)
  const ringRadius = 45;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~282.74
  const typicalDays = profile?.cycle_length_days || 28;
  const currDay = cycleResult?.currentCycleDay || 1;
  const progressRatio = Math.min(1, Math.max(0.04, currDay / typicalDays));
  const ringOffset = Math.round(ringCircumference * (1 - progressRatio));

  return (
    <div className="space-y-4 fade-up">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: Gradient Forest Green to Fresh Leaf + Soft Leaf Pattern */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl p-5 bg-gradient-to-br from-[#2F6B3F] to-[#6DB04F] text-white overflow-hidden shadow-sm">
        {/* Soft leaf pattern at 20 percent opacity */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="todayLeafPattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M10 50 C15 35 25 25 45 15 C35 30 30 45 10 50 Z" fill="#FFFFFF" />
              <path d="M10 50 C25 40 38 28 45 15" stroke="#6DB04F" strokeWidth="1" strokeLinecap="round" />
              <path d="M40 30 C45 22 52 18 58 12 C52 24 48 30 40 30 Z" fill="#FFFFFF" opacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#todayLeafPattern)" />
        </svg>

        {/* Large decorative leaf sprig in top-right corner (Fresh Leaf, 25 to 30% opacity) */}
        <LeafSprigHeader />

        {/* Header content: Logo (44px) + Greeting + Peach Avatar circle */}
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img 
              src="/logo.png" 
              alt="Mama Root logo: a mother holding her child, with roots below" 
              className="w-11 h-11 object-contain shrink-0" 
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold font-heading text-white leading-tight truncate">
                {t('today_greeting', { name: firstName })}
              </h1>
              <p className="text-xs text-white/90 font-normal mt-0.5">
                {t('today_subhead')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-11 h-11 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center font-bold text-sm shadow-xs hover:bg-[#eab88b] transition-colors focus-ring shrink-0 font-heading"
            aria-label="Open Settings"
          >
            {initial}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MY JOURNEY TILES */}
      {/* ========================================================================= */}
      <section className="space-y-2.5 pt-1" aria-label="My journey stages">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#6B4A3A] font-sans">
            My journey
          </h2>
          <button
            type="button"
            onClick={() => navigate('/choose-journey')}
            className="text-xs font-semibold text-[#2F6B3F] hover:text-[#1F4A2B] focus-ring rounded-md py-0.5 px-1"
          >
            {activeStages.length > 0 ? 'Edit' : 'Choose stages'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {activeStages.map((stageId) => {
            const info: StageTileVisual = STAGE_TILE_INFO[stageId] || {
              title: stageId.replace(/_/g, ' '),
              status: 'Tap to view',
              icon: Sparkles,
              tileBg: 'bg-[#2F6B3F]',
              isPeach: false,
            };
            const Icon = info.icon;
            const isPeach = Boolean(info.isPeach);
            return (
              <button
                key={stageId}
                type="button"
                onClick={() => navigate(`/mother-dashboard/journey/${stageId}`)}
                className={cn(
                  "rounded-3xl p-4 shadow-xs text-left flex flex-col justify-between focus-ring group min-h-[112px] transition-all hover:scale-[1.02] border",
                  info.tileBg,
                  isPeach ? "border-[#E0A77A] text-[#3B1409]" : "border-transparent text-white"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-3 group-hover:scale-105 transition-transform",
                  isPeach ? "bg-[#3B1409]/10 text-[#3B1409]" : "bg-white/20 text-white"
                )}>
                  <Icon className={cn("w-6 h-6", isPeach ? "text-[#3B1409]" : "text-white")} />
                </div>
                <div>
                  <h3 className={cn("text-xs font-bold font-serif leading-tight", isPeach ? "text-[#3B1409]" : "text-white")}>
                    {info.title}
                  </h3>
                  <p className={cn("text-[11px] mt-0.5 leading-tight font-sans", isPeach ? "text-[#3B1409]/80" : "text-white/90")}>
                    {info.status}
                  </p>
                </div>
              </button>
            );
          })}

          {/* 'Add another' tile */}
          <button
            type="button"
            onClick={() => navigate('/choose-journey')}
            className="border-2 border-dashed border-[#BFDDAE] bg-[#E3F1DA] hover:bg-[#d4ebcf] rounded-3xl p-4 shadow-xs transition-all text-left flex flex-col justify-between focus-ring group min-h-[112px]"
          >
            <div className="w-10 h-10 rounded-full bg-white text-[#2F6B3F] flex items-center justify-center shrink-0 mb-3 group-hover:scale-105 transition-transform shadow-xs">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-serif text-[#1F4A2B] leading-tight">
                Add another
              </h3>
              <p className="text-[11px] text-[#2F6B3F] mt-0.5 leading-tight font-medium font-sans">
                Update stages
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. CYCLE CARD OVERLAPPING BANNER (Mint #E3F1DA with Mint border #BFDDAE) */}
      {/* Holds CYCLE RING: Fresh Leaf on Mint track, cycle day in Root Brown */}
      {/* ========================================================================= */}
      {showCycleCard && cycleResult ? (
        <div className="-mt-2 relative z-10 bg-[#E3F1DA] border border-[#BFDDAE] rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in duration-300 text-[#1F4A2B]">
          <div className="flex items-center justify-between border-b border-[#BFDDAE]/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="icon-circle-peach bg-[#F7CCA5]">
                <Droplet className="w-5 h-5 text-[#3B1409]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#1F4A2B]">
                  Cycle Guidance
                </span>
                <h2 className="text-base font-bold font-heading text-[#3B1409] leading-tight">
                  Your Natural Rhythm
                </h2>
              </div>
            </div>

            <Link
              to="/tracker"
              className="text-xs font-semibold text-[#A9421B] hover:text-[#833518] bg-white border border-[#BFDDAE] px-3 py-1.5 rounded-xl shrink-0 transition-colors focus-ring"
            >
              Log period
            </Link>
          </div>

          {/* SVG Animated Cycle Ring */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg 
                className="w-full h-full -rotate-90" 
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {/* Mint track */}
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  stroke="#BFDDAE"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Fresh Leaf animated ring */}
                <circle
                  cx="50"
                  cy="50"
                  r={ringRadius}
                  stroke="#6DB04F"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  className="cycle-ring-anim"
                  style={{ '--ring-target': `${ringOffset}` } as React.CSSProperties}
                />
              </svg>

              {/* Day in centre in Root Brown */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-extrabold font-heading text-[#3B1409] leading-none">
                  {currDay}
                </span>
                <span className="text-[11px] font-bold text-[#1F4A2B] tracking-wider uppercase mt-1">
                  Cycle Day
                </span>
              </div>
            </div>

            {/* Range text & Profile usual days underneath */}
            <div className="text-center mt-3 space-y-1">
              <p className="text-sm font-bold font-heading text-[#3B1409]">
                {cycleResult.rangeText}
              </p>
              {cycleResult.profileCycleText && (
                <p className="text-xs text-[#1F4A2B]">
                  {cycleResult.profileCycleText}
                </p>
              )}
            </div>
          </div>

          {/* If later than usual range (clean microcopy, no technical/scary words) */}
          {cycleResult.isLaterThanRange && cycleResult.laterThanRangeText && (
            <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] rounded-2xl text-xs text-[#7A2E10] leading-relaxed font-medium">
              {cycleResult.laterThanRangeText}
            </div>
          )}

          {/* Last 6 Cycle Lengths bars */}
          {cycleResult.barData && cycleResult.barData.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#C5C98F]/70">
              <span className="text-[11px] font-bold text-[#3F4318] uppercase tracking-wider block">
                Last {cycleResult.barData.length} Cycles
              </span>
              <div className="space-y-1.5">
                {cycleResult.barData.map((bar, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[11px]">
                    <span className="w-5 text-[#6B4A3A] font-medium shrink-0">
                      C{bar.cycleIndex}
                    </span>
                    <div className="flex-1 bg-[#F7CCA5]/60 h-4 rounded-full overflow-hidden p-0.5">
                      <div
                        className="bg-[#A9421B] h-full rounded-full transition-all duration-500"
                        style={{ width: `${bar.percentage}%` }}
                      />
                    </div>
                    <span className="w-7 font-bold text-[#3B1409] text-right shrink-0">
                      {bar.days}d
                    </span>
                    {bar.isShortest && (
                      <span className="text-[10px] bg-white text-[#3B1409] border border-[#C5C98F] px-1.5 py-0.5 rounded-md font-bold shrink-0">
                        Shortest
                      </span>
                    )}
                    {bar.isLongest && (
                      <span className="text-[10px] bg-[#A9421B] text-white px-1.5 py-0.5 rounded-md font-bold shrink-0">
                        Longest
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Irregular notice */}
          {isIrregular && (
            <p className="text-xs text-[#6B4A3A] leading-relaxed pt-1 border-t border-[#C5C98F]/70">
              Your cycles are irregular, so we show a range instead of a date, and we never assume pregnancy.
            </p>
          )}

          {/* Mandatory disclaimer */}
          <p className="text-[11px] text-[#6B4A3A] italic leading-normal pt-1 border-t border-[#C5C98F]/70 text-center">
            {cycleResult.disclaimer}
          </p>
        </div>
      ) : null}

      {/* ========================================================================= */}
      {/* 3. CLINICAL ALERTS & NOTICES (Highlight style or Root Brown urgent) */}
      {/* ========================================================================= */}
      {/* Postpartum warning (First 6 weeks) */}
      {postpartumAlert.showAlert && (
        <div className="bg-[#3B1409] text-white rounded-3xl p-4 shadow-sm space-y-2 border border-[#3B1409]">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach bg-[#F7CCA5] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-white">
                {postpartumAlert.title}
              </h2>
              <p className="text-xs text-white/90 leading-relaxed font-normal">
                {postpartumAlert.displayText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Postpartum harm thoughts helpline */}
      {postpartumAlert.hasHarmThoughts && (
        <HelplineCard reason="harm_thoughts" />
      )}

      {/* Pregnancy urgent alert */}
      {pregnancyUrgentAlert.showAlert && (
        <div className="bg-[#3B1409] text-white rounded-3xl p-4 shadow-sm space-y-2 border border-[#3B1409]">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach bg-[#F7CCA5] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-white">
                {pregnancyUrgentAlert.title}
              </h2>
              <p className="text-xs text-white/90 leading-relaxed font-normal">
                {pregnancyUrgentAlert.displayText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Card 2 Urgent */}
      {card2Alert.showAlert && (
        <div className="bg-[#3B1409] text-white rounded-3xl p-4 shadow-sm space-y-2 border border-[#3B1409]">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach bg-[#F7CCA5] shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-white">
                {card2Alert.title}
              </h2>
              <p className="text-xs text-white/90 leading-relaxed font-normal">
                {card2Alert.displayText}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Card 1: Worth raising with doctor (Highlight Card) */}
      {card1Alert.showAlert && (
        <div className="highlight-card space-y-3">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach">
              <Stethoscope className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-[#7A2E10]">
                Worth raising with your doctor
              </h2>
              <p className="text-xs text-[#7A2E10] leading-relaxed">
                {card1Alert.displayText}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E0A77A]">
            <button
              type="button"
              onClick={() => setCard1Expanded(!card1Expanded)}
              className="flex items-center justify-between w-full text-xs font-bold text-[#7A2E10] py-1 focus-ring rounded-lg text-left"
            >
              <span>What to say and ask</span>
              {card1Expanded ? (
                <ChevronUp className="w-4 h-4 text-[#7A2E10] shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#7A2E10] shrink-0" />
              )}
            </button>
            {card1Expanded && (
              <div className="mt-1.5 p-3 bg-white/80 border border-[#E0A77A] rounded-2xl text-xs text-[#3B1409] leading-relaxed italic">
                “{card1Alert.expandableText}”
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="btn-primary flex items-center justify-center gap-1.5 text-xs font-semibold h-11"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>{t('prepare_summary')}</span>
          </button>
        </div>
      )}

      {/* Menopause Under 40 Alert (Highlight Card) */}
      {menopauseSafety.showUnder40Alert && (
        <div className="highlight-card space-y-3">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach">
              <Stethoscope className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-[#7A2E10]">
                Important to discuss with a clinician
              </h2>
              <p className="text-xs text-[#7A2E10] leading-relaxed">
                {menopauseSafety.under40Text || t('periods_stopping_under_40')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/doctor')}
            className="btn-primary flex items-center justify-center gap-1.5 text-xs font-semibold h-11"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>{t('take_doctor_summary')}</span>
          </button>
        </div>
      )}

      {/* Menopause Bleeding Alert (Highlight Card) */}
      {menopauseSafety.showPostmenopausalBleedingAlert && (
        <div className="highlight-card space-y-2">
          <div className="flex items-start gap-3">
            <div className="icon-circle-peach">
              <AlertCircle className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <h2 className="text-sm font-bold font-heading text-[#7A2E10]">
                Worth checking with your doctor
              </h2>
              <p className="text-xs text-[#7A2E10] leading-relaxed">
                {menopauseSafety.bleedingText || t('postmenopausal_bleeding_warning')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. APPOINTMENT IN NEXT 24 HOURS */}
      {/* ========================================================================= */}
      {appointmentNext24h && (
        <div className="app-card border-2 border-[#A9421B] space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="icon-circle-peach">
                <CalendarCheck className="w-5 h-5 text-[#3B1409]" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#A9421B] uppercase tracking-wider block">
                  {t('appointment_24h_title')}
                </span>
                <h2 className="text-sm font-bold font-heading text-[#3B1409] leading-snug">
                  {appointmentNext24h.title}
                </h2>
              </div>
            </div>
            <Link
              to="/calendar"
              className="text-[11px] font-semibold text-[#A9421B] hover:underline shrink-0 pt-0.5"
            >
              {t('view_care')}
            </Link>
          </div>

          <div className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#EAD5C0] space-y-1 text-xs text-[#3B1409]">
            {appointmentNext24h.doctor_name && (
              <p className="font-semibold text-[#A9421B]">
                {t('care_provider', { name: appointmentNext24h.doctor_name })}
              </p>
            )}
            <p className="text-[#6B4A3A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#A9421B]" />
              <span>{new Date(appointmentNext24h.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </p>
            {appointmentNext24h.description && (
              <p className="text-[11px] text-[#6B4A3A] italic pt-0.5">
                "{appointmentNext24h.description}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DUE TODAY (Reminders matching today) */}
      {/* ========================================================================= */}
      {dueReminders.length > 0 && (
        (() => {
          const visibleReminders = dueReminders.filter(
            (r) => !hiddenTodayIds.includes(r.id || r.title)
          );

          if (visibleReminders.length === 0) {
            return (
              <div className="app-card py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs text-[#3B1409]">
                  <div className="w-8 h-8 rounded-full bg-[#E8EAD0] text-[#3F4318] flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#5E5A28]" />
                  </div>
                  <div>
                    <span className="font-bold block font-heading">{t('due_today_title')}</span>
                    <span className="text-[11px] text-[#6B4A3A]">{t('all_done_today')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHiddenTodayIds([])}
                  className="text-[11px] font-semibold text-[#A9421B] hover:underline"
                >
                  {t('show_again')}
                </button>
              </div>
            );
          }

          return (
            <div className="app-card space-y-3">
              <div className="flex items-center justify-between border-b border-[#EAD5C0] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="icon-circle-peach">
                    <Bell className="w-4 h-4 text-[#3B1409]" />
                  </div>
                  <h2 className="text-sm font-bold font-heading text-[#3B1409]">
                    {t('due_today_title')}
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-[#6B4A3A]">
                  {t('pending_count', { count: visibleReminders.length })}
                </span>
              </div>

              <div className="space-y-2">
                {visibleReminders.map((r) => (
                  <div
                    key={r.id || r.title}
                    className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#EAD5C0] flex items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#3B1409] truncate">
                          {r.title}
                        </span>
                        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#A9421B] border border-[#EAD5C0]">
                          {r.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#6B4A3A] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#A9421B]" />
                        <span>{r.time}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHiddenTodayIds((prev) => [...prev, r.id || r.title])}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#B89A82] text-xs font-bold text-[#3B1409] hover:bg-[#A9421B] hover:text-white transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 text-[#5E5A28]" />
                      <span>{t('done_btn')}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()
      )}

      {/* ========================================================================= */}
      {/* 6. LOSS SUPPORT LINK CARD (if selected) */}
      {/* ========================================================================= */}
      {stages.includes('after_loss') && (
        <Link
          to="/loss-support"
          className="app-card flex items-center justify-between hover:border-[#A9421B] transition-all group block"
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="icon-circle-peach group-hover:bg-[#A9421B] group-hover:text-white transition-colors">
              <Heart className="w-5 h-5 text-[#3B1409] group-hover:text-white" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-sm font-bold font-heading text-[#3B1409]">
                Support after a pregnancy loss
              </h2>
              <p className="text-xs text-[#6B4A3A] leading-relaxed line-clamp-2">
                Guidance for your body, your heart, and questions for your doctor. Take whatever time you need.
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#A9421B] group-hover:translate-x-0.5 transition-transform shrink-0 ml-3" />
        </Link>
      )}

      {/* ========================================================================= */}
      {/* 7. PREGNANCY CARDS (Week X of 40) */}
      {/* ========================================================================= */}
      {isPregnant && (
        <div className="space-y-3">
          <div className="app-card space-y-3">
            <div className="flex items-center gap-3">
              <div className="icon-circle-peach">
                <Baby className="w-5 h-5 text-[#3B1409]" />
              </div>
              <div className="min-w-0 flex-1">
                {pregnancyWeek !== null ? (
                  <>
                    <h2 className="text-base font-bold font-heading text-[#3B1409] leading-snug">
                      Week {pregnancyWeek} of 40
                    </h2>
                    <p className="text-xs text-[#6B4A3A] font-medium">
                      {trimesterText}
                      {daysUntilDue !== null && (
                        <span>
                          {' • '}
                          {daysUntilDue > 0
                            ? `${daysUntilDue} days until due date`
                            : daysUntilDue === 0
                            ? 'Due today'
                            : `${Math.abs(daysUntilDue)} days past due date`}
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-bold font-heading text-[#3B1409] leading-snug">
                      Pregnancy journey
                    </h2>
                    <p className="text-xs text-[#6B4A3A] leading-relaxed mt-0.5">
                      A clinic can confirm how far along you are with a scan. Book one as soon as you can.
                    </p>
                  </>
                )}
              </div>
            </div>

            {activePregnancy?.risk_tags && activePregnancy.risk_tags.length > 0 && (
              <div className="pt-2.5 border-t border-[#EAD5C0] space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-semibold text-[#6B4A3A]">Recorded factors:</span>
                  {activePregnancy.risk_tags.map(tag => (
                    <span key={tag} className="tag-suspected">
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[#A9421B] italic">
                  Tell your clinician about these at every visit.
                </p>
              </div>
            )}
          </div>

          {/* 'This week' Card */}
          {pregnancyWeek !== null && (
            <div className="app-card space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
                  This week
                </span>
                {pregnancyContent?.reviewed_by && (
                  <span className="tag-confirmed">
                    Reviewed by {pregnancyContent.reviewed_by}
                  </span>
                )}
              </div>

              {hasWeeklyContent && pregnancyContent ? (
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold font-heading text-[#3B1409]">
                    {pregnancyContent.title}
                  </h3>
                  <p className="text-xs text-[#3B1409] leading-relaxed whitespace-pre-line">
                    {pregnancyContent.body || pregnancyContent.content}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#6B4A3A] italic">
                  {t('guidance_coming_soon')}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. POSTPARTUM & EARLY MOTHERHOOD CARDS */}
      {/* ========================================================================= */}
      {isPostpartumOrEarlyMotherhood && (
        <div className="space-y-3">
          {/* Baby Age Card */}
          {profile?.youngest_child_birth_date && babyAgeText && (
            <div className="app-card space-y-2">
              <div className="flex items-center gap-3">
                <div className="icon-circle-peach">
                  <Baby className="w-5 h-5 text-[#3B1409]" />
                </div>
                <div>
                  <h2 className="text-base font-bold font-heading text-[#3B1409] leading-snug">
                    {t('baby_card_title', { age: babyAgeText })}
                  </h2>
                  <p className="text-xs text-[#6B4A3A]">
                    Approximate age from birth month. Every baby grows at their own pace.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* For you and baby right now Card */}
          <div className="app-card space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
                {t('for_you_and_baby_right_now')}
              </span>
              {hasLifeStageContent && lifeStageContent?.reviewed_by && (
                <span className="tag-confirmed">
                  {t('reviewed_by', { name: lifeStageContent.reviewed_by })}
                </span>
              )}
            </div>

            {hasLifeStageContent && lifeStageContent ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold font-heading text-[#3B1409]">
                    {lifeStageContent.title}
                  </h3>
                  {(lifeStageContent.evidence_tag || lifeStageContent.evidence_level) && (
                    <span className="tag-confirmed">
                      {lifeStageContent.evidence_tag || lifeStageContent.evidence_level}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#3B1409] leading-relaxed whitespace-pre-line">
                  {lifeStageContent.body || lifeStageContent.content}
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#6B4A3A] italic">
                {t('guidance_coming_soon')}
              </p>
            )}
          </div>

          {/* Traditional Remedy Card */}
          <div className="app-card space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading text-[#3B1409] leading-snug">
                {t('traditional_remedy_card_title')}
              </h3>
              <p className="text-xs text-[#6B4A3A] leading-relaxed">
                Grandmothers and elders offer care from love. Check which remedies nurture your baby safely and which need clinical caution.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/culture')}
              className="btn-primary gap-1.5 text-xs h-11"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{t('look_it_up_first')}</span>
            </button>

            <div className="pt-2 border-t border-[#EAD5C0] flex items-center gap-1.5 text-xs text-[#A9421B] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t('baby_fever_emergency')}</span>
            </div>
          </div>

          {/* Weekly Mood Check */}
          {profile?.id && (
            <PostpartumMoodCheckCard userId={profile.id} />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. PERIMENOPAUSE & MENOPAUSE CARD */}
      {/* ========================================================================= */}
      {isMenopause && (
        <div className="app-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
              {t('for_you_right_now')}
            </span>
            {hasMenopauseContent && menopauseContent?.reviewed_by && (
              <span className="tag-confirmed">
                {t('reviewed_by', { name: menopauseContent.reviewed_by })}
              </span>
            )}
          </div>

          {hasMenopauseContent && menopauseContent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold font-heading text-[#3B1409]">
                  {menopauseContent.title}
                </h3>
                {(menopauseContent.evidence_tag || menopauseContent.evidence_level) && (
                  <span className="tag-confirmed">
                    {menopauseContent.evidence_tag || menopauseContent.evidence_level}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#3B1409] leading-relaxed whitespace-pre-line">
                {menopauseContent.body || menopauseContent.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic">
              {t('guidance_coming_soon')}
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. OTHER STAGES GUIDANCE CARDS */}
      {/* ========================================================================= */}
      {activeStages.includes('trying_to_conceive') && (
        <div className="app-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
              Trying to conceive
            </span>
            {getContentForStage('trying_to_conceive')?.reviewed_by && (
              <span className="tag-confirmed">
                {t('reviewed_by', { name: getContentForStage('trying_to_conceive')!.reviewed_by })}
              </span>
            )}
          </div>
          {getContentForStage('trying_to_conceive') ? (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold font-heading text-[#3B1409]">
                {getContentForStage('trying_to_conceive')!.title}
              </h3>
              <p className="text-xs text-[#3B1409] leading-relaxed whitespace-pre-line">
                {getContentForStage('trying_to_conceive')!.body || getContentForStage('trying_to_conceive')!.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic">
              {t('guidance_coming_soon')}
            </p>
          )}
        </div>
      )}

      {activeStages.includes('living_with_condition') && (
        <div className="app-card space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
              Living with a condition
            </span>
            {getContentForStage('living_with_condition')?.reviewed_by && (
              <span className="tag-confirmed">
                {t('reviewed_by', { name: getContentForStage('living_with_condition')!.reviewed_by })}
              </span>
            )}
          </div>
          {getContentForStage('living_with_condition') ? (
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold font-heading text-[#3B1409]">
                {getContentForStage('living_with_condition')!.title}
              </h3>
              <p className="text-xs text-[#3B1409] leading-relaxed whitespace-pre-line">
                {getContentForStage('living_with_condition')!.body || getContentForStage('living_with_condition')!.content}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic">
              {t('guidance_coming_soon')}
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. PRIMARY BUTTON: 'Log how I feel' */}
      {/* ========================================================================= */}
      <div>
        <Link
          to="/tracker"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-5 h-5 text-white" />
          <span>{t('log_how_feel')}</span>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 12. HEALTH OVERVIEW SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
          {t('health_overview')}
        </h2>

        {/* Recent check-in */}
        <div className="app-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3B1409] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#F7CCA5] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-[#3B1409]" />
              </div>
              <span className="font-heading">{t('latest_checkin')}</span>
            </span>
            <Link
              to="/tracker"
              className="text-[11px] font-semibold text-[#A9421B] hover:underline"
            >
              {t('open_log')}
            </Link>
          </div>

          {latestSymptom ? (
            <div className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#EAD5C0] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#3B1409]">{latestSymptom.type}</span>
                <span className="text-[11px] font-semibold text-[#A9421B]">
                  Level {latestSymptom.severity}/10
                </span>
              </div>
              <p className="text-[11px] text-[#6B4A3A]">
                Recorded {formatDate(latestSymptom.created_at)}
              </p>
              {latestSymptom.notes && (
                <p className="text-xs text-[#3B1409] italic mt-1 pt-1 border-t border-[#EAD5C0]/60">
                  "{latestSymptom.notes}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic py-1">
              No recent check-in. Tap "{t('log_how_feel')}" to record your symptoms.
            </p>
          )}
        </div>

        {/* Next Scheduled Visit */}
        <div className="app-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#3B1409] flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#F7CCA5] flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-[#3B1409]" />
              </div>
              <span className="font-heading">{t('next_appointment')}</span>
            </span>
            <Link
              to="/calendar"
              className="text-[11px] font-semibold text-[#A9421B] hover:underline"
            >
              {t('view_care')}
            </Link>
          </div>

          {upcomingAppointment ? (
            <div className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#EAD5C0] space-y-1">
              <h3 className="text-xs font-bold text-[#3B1409]">{upcomingAppointment.title}</h3>
              {upcomingAppointment.doctor_name && (
                <p className="text-xs font-medium text-[#A9421B]">
                  {upcomingAppointment.doctor_name}
                </p>
              )}
              <p className="text-[11px] text-[#6B4A3A] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#A9421B]" />
                <span>{new Date(upcomingAppointment.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between py-1">
              <p className="text-xs text-[#6B4A3A] italic">
                No upcoming appointments scheduled.
              </p>
              <Link
                to="/calendar"
                className="text-xs font-semibold text-[#A9421B] hover:underline shrink-0"
              >
                Add appointment
              </Link>
            </div>
          )}
        </div>

        {/* Doctor Note */}
        {latestDoctorNote && (
          <div className="app-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3B1409] flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#F7CCA5] flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-[#3B1409]" />
                </div>
                <span className="font-heading">{t('what_my_doctor_said')}</span>
              </span>
              <Link
                to="/doctor"
                className="text-[11px] font-semibold text-[#A9421B] hover:underline"
              >
                {t('all_notes')}
              </Link>
            </div>

            <div className="bg-[#FFF9F2] p-3 rounded-2xl border border-[#EAD5C0] space-y-1">
              <p className="text-xs font-bold text-[#A9421B]">
                {latestDoctorNote.doctor_name || 'Care Provider'}
              </p>
              <p className="text-xs text-[#3B1409] leading-relaxed line-clamp-3">
                "{latestDoctorNote.content}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 13. GUIDES & ARTICLES */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
          Resources & Guides
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/mother-dashboard/safe-guide"
            className="app-card flex flex-col justify-between hover:border-[#A9421B] transition-colors group p-4"
          >
            <div>
              <div className="icon-circle-peach mb-2 group-hover:bg-[#A9421B] group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5 text-[#3B1409] group-hover:text-white" />
              </div>
              <h3 className="text-xs font-bold font-heading text-[#3B1409] leading-snug">Safe Guide</h3>
              <p className="text-[11px] text-[#6B4A3A] mt-1 leading-normal line-clamp-2">
                Nourishment, movement, and wellness safeguards.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A9421B] mt-2 pt-2 border-t border-[#EAD5C0]">
              <span>Read guide</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>

          <Link
            to="/mother-dashboard/learn"
            className="app-card flex flex-col justify-between hover:border-[#A9421B] transition-colors group p-4"
          >
            <div>
              <div className="icon-circle-peach mb-2 group-hover:bg-[#A9421B] group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5 text-[#3B1409] group-hover:text-white" />
              </div>
              <h3 className="text-xs font-bold font-heading text-[#3B1409] leading-snug">{t('cultural_learn_hub')}</h3>
              <p className="text-[11px] text-[#6B4A3A] mt-1 leading-normal line-clamp-2">
                Cultural insights and clinical knowledge.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#A9421B] mt-2 pt-2 border-t border-[#EAD5C0]">
              <span>Explore</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
