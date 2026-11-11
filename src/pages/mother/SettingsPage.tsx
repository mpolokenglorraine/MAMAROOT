import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  RotateCcw, 
  Bell, 
  ShieldCheck, 
  Sliders, 
  HelpCircle, 
  Users, 
  LogOut,
  ChevronRight,
  Heart,
  Calendar,
  CheckCircle2,
  EyeOff,
  Baby,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  Lock,
  FileCheck2,
  Database
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { LOSS_SUPPORT_CONTENT } from '../../constants/lossSupportContent';
import { cn } from '../../lib/utils';
import PregnancySetupModal from '../../components/PregnancySetupModal';
import BirthCompletionModal from '../../components/BirthCompletionModal';
import MenopauseSetupModal from '../../components/MenopauseSetupModal';
import RemindersModal from '../../components/RemindersModal';
import { useT, SUPPORTED_LANGUAGES } from '../../i18n/useT';
import { RootsDivider } from '../../components/RootsMotif';
import { insertSampleData, removeSampleData } from '../../lib/demoData';

export default function SettingsPage() {
  const { t, language: currentLang } = useT();
  const { user, profile, signOut, refetchProfile } = useAuth();
  const navigate = useNavigate();

  // App settings modal state
  const [showAppSettingsModal, setShowAppSettingsModal] = useState(false);
  const [savingLang, setSavingLang] = useState(false);
  const [langSuccess, setLangSuccess] = useState(false);

  // Loss support modal state
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossStep, setLossStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedType, setSelectedType] = useState<string>('Miscarriage');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [hidePregnancyContent, setHidePregnancyContent] = useState<boolean>(true);
  const [savingLoss, setSavingLoss] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Cycle and Health Settings modal state
  const [showCycleSettingsModal, setShowCycleSettingsModal] = useState(false);
  const [savingCycleSettings, setSavingCycleSettings] = useState(false);

  // Reminders modal state
  const [showRemindersModal, setShowRemindersModal] = useState(false);

  // Pregnancy and Menopause modals
  const [showPregnancySetupModal, setShowPregnancySetupModal] = useState(false);
  const [showBirthModal, setShowBirthModal] = useState(false);
  const [showMenopauseModal, setShowMenopauseModal] = useState(false);

  // Privacy and Data Management State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingData, setDeletingData] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // Demo data state
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoMessage, setDemoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddSampleData = async () => {
    if (!profile?.id) return;
    try {
      setDemoLoading(true);
      setDemoMessage(null);
      const res = await insertSampleData(profile.id);
      if (res.success) {
        setDemoMessage({ type: 'success', text: 'Sample data added successfully! Check your Story, Calendar, and Doctor summary.' });
      } else {
        setDemoMessage({ type: 'error', text: res.error || 'Could not add sample data.' });
      }
    } catch (err: any) {
      setDemoMessage({ type: 'error', text: err.message || 'Error inserting sample data.' });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleRemoveSampleData = async () => {
    if (!profile?.id) return;
    try {
      setDemoLoading(true);
      setDemoMessage(null);
      const res = await removeSampleData(profile.id);
      if (res.success) {
        setDemoMessage({ type: 'success', text: 'Sample data removed successfully.' });
      } else {
        setDemoMessage({ type: 'error', text: res.error || 'Could not remove sample data.' });
      }
    } catch (err: any) {
      setDemoMessage({ type: 'error', text: err.message || 'Error removing sample data.' });
    } finally {
      setDemoLoading(false);
    }
  };

  const handleDownloadData = async () => {
    if (!profile?.id) return;
    try {
      setDownloadingData(true);
      setPrivacyError(null);

      // Fetch all user records
      const [
        { data: userProfile },
        { data: userSymptoms },
        { data: userConditions },
        { data: userEvents },
        { data: userPregnancies },
        { data: userPregnancyLogs },
        { data: userPeriodLogs },
        { data: userAppointments },
        { data: userDoctorNotes },
        { data: userDocs },
        { data: userReminders }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', profile.id).maybeSingle(),
        supabase.from('symptoms').select('*').eq('user_id', profile.id),
        supabase.from('user_conditions').select('*').eq('user_id', profile.id),
        supabase.from('health_events').select('*').eq('user_id', profile.id),
        supabase.from('pregnancies').select('*').eq('user_id', profile.id),
        supabase.from('pregnancy_logs').select('*').eq('user_id', profile.id),
        supabase.from('period_logs').select('*').eq('user_id', profile.id),
        supabase.from('appointments').select('*').eq('user_id', profile.id),
        supabase.from('doctor_notes').select('*').eq('patient_id', profile.id),
        supabase.from('health_documents').select('id, user_id, title, document_type, document_date, file_name, file_size, mime_type, health_event_id, created_at').eq('user_id', profile.id),
        supabase.from('reminders').select('*').eq('user_id', profile.id)
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        application: 'Mama Root',
        profile: userProfile || profile,
        health_documents: userDocs || [],
        reminders: userReminders || [],
        symptoms: userSymptoms || [],
        conditions: userConditions || [],
        health_events: userEvents || [],
        pregnancies: userPregnancies || [],
        pregnancy_logs: userPregnancyLogs || [],
        period_logs: userPeriodLogs || [],
        appointments: userAppointments || [],
        doctor_notes: userDoctorNotes || []
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `mama-root-health-data-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('Error downloading data:', err);
      setPrivacyError('Failed to generate export file. Please check your connection and try again.');
    } finally {
      setDownloadingData(false);
    }
  };

  const handleDeleteAllHealthData = async () => {
    if (!profile?.id) return;
    try {
      setDeletingData(true);
      setPrivacyError(null);

      // 1. Find all user files in 'health-docs' bucket
      const { data: docs } = await supabase
        .from('health_documents')
        .select('file_path')
        .eq('user_id', profile.id);

      if (docs && docs.length > 0) {
        const filePaths = docs.map(d => d.file_path).filter(Boolean);
        if (filePaths.length > 0) {
          try {
            await supabase.storage.from('health-docs').remove(filePaths);
          } catch (storageErr) {
            console.warn('Storage cleanup notice:', storageErr);
          }
        }
      }

      // Also list the user's directory to sweep any files
      try {
        const { data: folderFiles } = await supabase.storage.from('health-docs').list(profile.id);
        if (folderFiles && folderFiles.length > 0) {
          const folderPaths = folderFiles.map(f => `${profile.id}/${f.name}`);
          await supabase.storage.from('health-docs').remove(folderPaths);
        }
      } catch (listErr) {
        console.warn('Folder sweep notice:', listErr);
      }

      // 2. Delete database records
      await Promise.allSettled([
        supabase.from('health_documents').delete().eq('user_id', profile.id),
        supabase.from('reminders').delete().eq('user_id', profile.id),
        supabase.from('symptoms').delete().eq('user_id', profile.id),
        supabase.from('user_conditions').delete().eq('user_id', profile.id),
        supabase.from('health_events').delete().eq('user_id', profile.id),
        supabase.from('pregnancy_logs').delete().eq('user_id', profile.id),
        supabase.from('pregnancies').delete().eq('user_id', profile.id),
        supabase.from('period_logs').delete().eq('user_id', profile.id),
        supabase.from('appointments').delete().eq('user_id', profile.id),
        supabase.from('doctor_notes').delete().eq('patient_id', profile.id)
      ]);

      // 3. Clear local storage caches
      try {
        localStorage.removeItem(`mama_root_tracks_periods_${profile.id}`);
        localStorage.removeItem(`mama_root_daily_checkin_${profile.id}`);
      } catch {}

      setDeleteSuccess(true);
      setShowDeleteConfirm(false);
      await refetchProfile();
    } catch (err: any) {
      console.error('Error deleting health data:', err);
      setPrivacyError('Could not completely delete your records. Please try again.');
    } finally {
      setDeletingData(false);
    }
  };

  const isPregnant = profile?.stages?.includes('pregnant');
  const isMenopause = profile?.stages?.includes('menopause');

  const handleLostThisPregnancy = async () => {
    if (profile?.id) {
      try {
        await supabase
          .from('pregnancies')
          .update({ status: 'loss' })
          .eq('user_id', profile.id)
          .eq('status', 'active');
      } catch (err) {
        console.warn('Error updating pregnancy status to loss:', err);
      }
    }
    setShowLossModal(true);
    setLossStep(1);
  };

  // Tracks periods status (defaults to true unless explicitly false)
  const isTrackingPeriods = profile?.tracks_periods !== false;

  const handleToggleTracksPeriods = async () => {
    if (!profile?.id) return;
    try {
      setSavingCycleSettings(true);
      const newTracksPeriods = !isTrackingPeriods;
      try {
        localStorage.setItem(`mama_root_tracks_periods_${profile.id}`, String(newTracksPeriods));
      } catch {}

      await supabase
        .from('users')
        .update({ tracks_periods: newTracksPeriods })
        .eq('id', profile.id);

      await refetchProfile();
    } catch (err) {
      console.error('Error toggling tracks_periods:', err);
    } finally {
      setSavingCycleSettings(false);
    }
  };

  const STAGE_OPTIONS = [
    { value: 'tracking_periods', label: 'Cycle tracking' },
    { value: 'trying_to_conceive', label: 'Trying to conceive' },
    { value: 'pregnant', label: 'Pregnancy' },
    { value: 'postpartum', label: 'Postpartum' },
    { value: 'early_motherhood', label: 'Early motherhood' },
    { value: 'after_loss', label: 'Pregnancy loss support' },
    { value: 'menopause', label: 'Perimenopause or menopause' },
    { value: 'living_with_condition', label: 'Living with a condition' },
  ] as const;

  const handleToggleStage = async (stageVal: string) => {
    if (!profile?.id) return;
    const currentStages = profile.stages || [];
    const nextStages = currentStages.includes(stageVal)
      ? currentStages.filter(s => s !== stageVal)
      : [...currentStages, stageVal];

    try {
      await supabase.from('users').update({ stages: nextStages }).eq('id', profile.id);
      await refetchProfile();
    } catch (err) {
      console.error('Error toggling stage:', err);
    }
  };

  const handleSaveYoungestBirthDate = async (yr: string, mo: string) => {
    if (!profile?.id) return;
    const dateStr = `${yr}-${mo.padStart(2, '0')}-01`;
    try {
      await supabase.from('users').update({ youngest_child_birth_date: dateStr }).eq('id', profile.id);
      await refetchProfile();
    } catch (err) {
      console.error('Error saving birth date:', err);
    }
  };

  const handleUpdateProfileField = async (field: string, val: any) => {
    if (!profile?.id) return;
    try {
      await supabase.from('users').update({ [field]: val }).eq('id', profile.id);
      await refetchProfile();
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Mama Root Member';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'M';

  const handleLanguageChange = async (langCode: string) => {
    if (!profile?.id) return;
    try {
      setSavingLang(true);
      localStorage.setItem('mama_root_lang_' + profile.id, langCode);
      const { error } = await supabase
        .from('users')
        .update({ language: langCode })
        .eq('id', profile.id);
      if (error) {
        console.warn('Error updating users.language:', error);
      }
      await refetchProfile();
      setLangSuccess(true);
      setTimeout(() => setLangSuccess(false), 2500);
    } catch (err) {
      console.error('Error changing language:', err);
    } finally {
      setSavingLang(false);
    }
  };

  const menuRows = [
    { id: 'cycle', icon: RotateCcw, label: t('cycle_health_settings') },
    { id: 'reminders', icon: Bell, label: t('reminders_title') },
    { id: 'privacy', icon: ShieldCheck, label: t('privacy_consent') },
    { id: 'app_settings', icon: Sliders, label: t('app_settings') },
    { id: 'help', icon: HelpCircle, label: t('help_about') },
    { id: 'refer', icon: Users, label: t('refer_friend') },
  ];

  const flow = LOSS_SUPPORT_CONTENT.settingsFlow;

  const handleSaveLoss = async () => {
    if (!profile?.id) return;
    try {
      setSavingLoss(true);
      setSaveError(null);

      // 1. Save to health_events row: event_type 'pregnancy_loss', loss_type, event_date, status 'experienced'
      const eventPayload: Record<string, any> = {
        user_id: profile.id,
        title: `Pregnancy loss (${selectedType})`,
        event_type: 'pregnancy_loss',
        loss_type: selectedType,
        event_date: selectedDate,
        status: 'experienced'
      };

      const { error: insertErr } = await supabase.from('health_events').insert(eventPayload);
      if (insertErr) {
        // Fallback in case loss_type column does not exist on table
        console.warn('Initial insert into health_events failed, trying standard columns:', insertErr);
        await supabase.from('health_events').insert({
          user_id: profile.id,
          title: `Pregnancy loss: ${selectedType}`,
          event_type: 'pregnancy_loss',
          event_date: selectedDate,
          status: 'experienced'
        });
      }

      // 2. Add 'after_loss' to users.stages and remove 'pregnant' from it
      const existingStages = profile.stages || [];
      const updatedStages = Array.from(
        new Set(existingStages.filter(s => s !== 'pregnant').concat('after_loss'))
      );

      // Persist hide pregnancy preference locally as well
      if (hidePregnancyContent) {
        try {
          localStorage.setItem(`mama_root_hide_pregnancy_${profile.id}`, 'true');
        } catch {
          // ignore localStorage error
        }
      }

      // Update user profile in Supabase
      try {
        await supabase
          .from('users')
          .update({
            stages: updatedStages,
            hide_pregnancy_content: hidePregnancyContent
          })
          .eq('id', profile.id);
      } catch {
        // In case hide_pregnancy_content is not in users schema, update stages
        await supabase
          .from('users')
          .update({
            stages: updatedStages
          })
          .eq('id', profile.id);
      }

      // 3. Refetch profile in AuthContext so Today page and other pages update immediately
      await refetchProfile();

      // Step 5: Finished
      setLossStep(5);
    } catch (err: any) {
      console.error('Error saving pregnancy loss record:', err);
      setSaveError('Could not save this entry. Please check your connection and try again.');
    } finally {
      setSavingLoss(false);
    }
  };

  const closeLossModal = () => {
    setShowLossModal(false);
    setLossStep(1);
    setSaveError(null);
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans pb-12">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5">
        
        {/* Header 'Settings' with 36px Mama Root logo and a Close button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Mama Root logo: a mother holding her child, with roots below" 
              className="w-9 h-9 object-contain shrink-0" 
            />
            <h1 className="text-2xl font-bold font-serif text-[#3B1409]">{t('settings_title')}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mother-dashboard')}
            className="w-11 h-11 rounded-full bg-white border border-[#EAD5C0] flex items-center justify-center text-[#3B1409] hover:bg-[#F6E7D8] transition-colors focus-ring"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-[#EAD5C0] rounded-3xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle with first letter in Peach with Root Brown text */}
            <div className="w-12 h-12 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center font-serif font-bold text-lg shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-serif text-[#3B1409] truncate">{displayName}</h2>
              <p className="text-xs text-[#6B4A3A] truncate">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            className="text-xs font-semibold text-[#A9421B] border border-[#EAD5C0] bg-[#F6E7D8]/60 hover:bg-[#F6E7D8] px-3.5 py-1.5 rounded-xl shrink-0 transition-colors focus-ring"
          >
            View profile
          </button>
        </div>

        {/* 'My Mama Root experience' Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
                My Mama Root experience
              </h2>
              <p className="text-xs text-[#6B4A3A] mt-0.5">
                Select all life stages and health paths that apply to you. Tapping saves immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/choose-journey')}
              className="text-xs font-bold text-[#A9421B] hover:text-[#833518] hover:underline whitespace-nowrap pl-2"
            >
              Choose journey
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/choose-journey')}
            className="w-full py-3 px-4 bg-white border border-[#EAD5C0] hover:border-[#A9421B] rounded-3xl text-xs font-bold text-[#3B1409] flex items-center justify-between transition-colors shadow-2xs"
          >
            <span>Open Journey Selector ({STAGE_OPTIONS.length} stages)</span>
            <ChevronRight className="w-4 h-4 text-[#A9421B]" />
          </button>

          <div className="bg-white border border-[#EAD5C0] rounded-3xl divide-y divide-[#EAD5C0] overflow-hidden shadow-xs">
            {STAGE_OPTIONS.map((option) => {
              const currentStages = profile?.stages || [];
              const isSelected = currentStages.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleToggleStage(option.value)}
                  className={cn(
                    "w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left transition-colors focus-ring",
                    isSelected ? "bg-[#F8DFC8]/40" : "hover:bg-[#F6E7D8]/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                      isSelected 
                        ? "bg-[#A9421B] border-[#A9421B] text-white" 
                        : "border-[#B89A82] bg-white"
                    )}>
                      {isSelected && <CheckCircle2 className="w-4 h-4 fill-current text-white" />}
                    </div>
                    <span className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-[#A9421B] font-bold" : "text-[#3B1409]"
                    )}>
                      {option.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* If Postpartum or Early Motherhood is selected, ask for youngest child's birth month and year */}
          {(profile?.stages?.includes('postpartum') || profile?.stages?.includes('early_motherhood')) && (
            <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-4 space-y-3 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0 mt-0.5">
                  <Baby className="w-4 h-4 text-[#3B1409]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                    Youngest child's birth month & year
                  </h3>
                  <p className="text-xs text-[#6B4A3A]">
                    Saved as the 1st of that month to provide approximate milestone guidance.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                    Month
                  </label>
                  <select
                    value={profile?.youngest_child_birth_date ? profile.youngest_child_birth_date.split('-')[1] : '01'}
                    onChange={(e) => {
                      const yr = profile?.youngest_child_birth_date ? profile.youngest_child_birth_date.split('-')[0] : String(new Date().getFullYear());
                      handleSaveYoungestBirthDate(yr, e.target.value);
                    }}
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
                  <label className="block text-[11px] font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <select
                    value={profile?.youngest_child_birth_date ? profile.youngest_child_birth_date.split('-')[0] : String(new Date().getFullYear())}
                    onChange={(e) => {
                      const mo = profile?.youngest_child_birth_date ? profile.youngest_child_birth_date.split('-')[1] : '01';
                      handleSaveYoungestBirthDate(e.target.value, mo);
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  >
                    {Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i).map(yr => (
                      <option key={yr} value={String(yr)}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* If Cycle tracking (tracking_periods) is selected, show cycle settings */}
          {profile?.stages?.includes('tracking_periods') && (
            <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-4 space-y-4 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 border-b border-[#EAD5C0] pb-2">
                <RotateCcw className="w-4 h-4 text-[#A9421B]" />
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  Cycle settings
                </h3>
              </div>

              {/* 1. Regular, irregular, or not sure */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Cycle regularity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'regular', label: 'Regular' },
                    { val: 'irregular', label: 'Irregular' },
                    { val: 'not_sure', label: 'Not sure' }
                  ].map(reg => {
                    const isSelected = (profile?.cycle_regularity || 'regular') === reg.val;
                    return (
                      <button
                        key={reg.val}
                        type="button"
                        onClick={() => handleUpdateProfileField('cycle_regularity', reg.val)}
                        className={cn(
                          "py-2 px-1 text-xs font-semibold rounded-xl border transition-all text-center focus-ring",
                          isSelected
                            ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#B89A82] hover:border-[#A9421B]"
                        )}
                      >
                        {reg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Usual cycle length & 3. Period length */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                    Usual cycle length
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={18}
                      max={60}
                      value={profile?.cycle_length_days || 28}
                      onChange={(e) => handleUpdateProfileField('cycle_length_days', parseInt(e.target.value, 10) || 28)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-[#6B4A3A]">days</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                    Period length
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={profile?.period_length_days || 5}
                      onChange={(e) => handleUpdateProfileField('period_length_days', parseInt(e.target.value, 10) || 5)}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                    />
                    <span className="absolute right-3 top-2 text-[11px] text-[#6B4A3A]">days</span>
                  </div>
                </div>
              </div>

              {/* 4. Last period date */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Last period start date
                </label>
                <input
                  type="date"
                  value={profile?.last_period_date || ''}
                  onChange={(e) => handleUpdateProfileField('last_period_date', e.target.value || null)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* 5. Switch: 'I no longer have periods (for example after a hysterectomy)' saved to tracks_periods */}
              <div className="bg-white border border-[#EAD5C0] rounded-2xl p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-[#3B1409] block">
                    I no longer have periods (for example after a hysterectomy)
                  </span>
                  <p className="text-[11px] text-[#6B4A3A]">
                    Sets period tracking off while keeping your symptom history active.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={profile?.tracks_periods === false}
                  onClick={() => handleUpdateProfileField('tracks_periods', profile?.tracks_periods === false ? true : false)}
                  className={cn(
                    "w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 focus-ring mt-0.5",
                    profile?.tracks_periods === false ? "bg-[#A9421B]" : "bg-[#EAD5C0]"
                  )}
                >
                  <div
                    className={cn(
                      "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform",
                      profile?.tracks_periods === false ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Standard Menu Card (6 rows) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider px-1">
            Preferences & Support
          </h2>
          <div className="bg-white border border-[#EAD5C0] rounded-3xl divide-y divide-[#EAD5C0] overflow-hidden shadow-xs">
            {menuRows.map((row, idx) => {
              const Icon = row.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (row.id === 'cycle') {
                      setShowCycleSettingsModal(true);
                    } else if (row.id === 'reminders') {
                      setShowRemindersModal(true);
                    } else if (row.id === 'privacy') {
                      setShowPrivacyModal(true);
                    } else if (row.id === 'app_settings') {
                      setShowAppSettingsModal(true);
                    }
                  }}
                  className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between text-left hover:bg-[#F6E7D8]/30 transition-colors focus-ring"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#3B1409]" />
                    </div>
                    <span className="text-sm font-semibold text-[#3B1409]">
                      {row.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6B4A3A]" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo Data Card */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider px-1">
            Testing & Demonstration
          </h2>
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E3F1DA] border border-[#BFDDAE] text-[#2F6B3F] flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                  Demo data
                </h3>
                <p className="text-xs text-[#6B4A3A] mt-0.5 leading-relaxed">
                  Populate realistic sample records (period logs, pelvic symptoms, endometriosis diagnosis, appointments, and doctor notes) to explore the health story timeline and doctor summary.
                </p>
              </div>
            </div>

            {demoMessage && (
              <div className={cn(
                "p-3 rounded-2xl text-xs font-medium border flex items-center justify-between",
                demoMessage.type === 'success' 
                  ? "bg-[#E3F1DA] border-[#BFDDAE] text-[#1F4A2B]" 
                  : "bg-[#F8DFC8] border-[#E0A77A] text-[#7A2E10]"
              )}>
                <span>{demoMessage.text}</span>
                <button
                  type="button"
                  onClick={() => setDemoMessage(null)}
                  className="p-1 hover:opacity-70 rounded-md"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleAddSampleData}
                className="btn-primary !min-h-[44px] text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>Add sample data</span>
              </button>
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleRemoveSampleData}
                className="btn-secondary !min-h-[44px] text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
              >
                {demoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Remove sample data</span>
              </button>
            </div>
            <p className="text-[11px] text-[#6B4A3A] text-center pt-0.5">
              Only removes rows whose note or title starts with 'Sample:'.
            </p>
          </div>
        </div>

        {/* Secondary button with log-out icon: 'Log out' */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-[#3B1409]" />
            <span>{t('log_out')}</span>
          </button>
        </div>

        {/* Roots Motif Divider at bottom of Settings */}
        <RootsDivider className="mt-8 mb-4" />

      </div>

      {/* ========================================================================= */}
      {/* PREGNANCY LOSS SUPPORT MODAL FLOW */}
      {/* ========================================================================= */}
      {showLossModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#A9421B]" />
                <span className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
                  Care & Support
                </span>
              </div>
              <button
                type="button"
                onClick={closeLossModal}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner if any */}
            {saveError && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl">
                {saveError}
              </div>
            )}

            {/* STEP 1: Short, Kind Confirmation */}
            {lossStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-serif text-[#3B1409]">
                    {flow.confirmation.title}
                  </h3>
                  <p className="text-xs text-[#3B1409] leading-relaxed">
                    {flow.confirmation.message}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setLossStep(2)}
                    className="btn-primary"
                  >
                    {flow.confirmation.confirmButton}
                  </button>
                  <button
                    type="button"
                    onClick={closeLossModal}
                    className="btn-secondary"
                  >
                    {flow.confirmation.cancelButton}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Loss Type Chips */}
            {lossStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    What type of loss was it?
                  </h3>
                  <p className="text-xs text-[#6B4A3A] mt-1">
                    Choose the option that matches your experience, or choose Not sure.
                  </p>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {flow.lossTypes.map((item) => {
                    const isSelected = selectedType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedType(item.id)}
                        className={cn(
                          "min-h-[44px] px-4 py-2.5 rounded-full border text-xs font-semibold transition-all focus-ring",
                          isSelected
                            ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#B89A82] hover:border-[#A9421B]"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setLossStep(1)}
                    className="w-1/3 min-h-[52px] bg-white border border-[#EAD5C0] text-[#3B1409] text-xs font-semibold rounded-2xl hover:bg-[#F6E7D8] transition-colors focus-ring"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setLossStep(3)}
                    className="w-2/3 min-h-[52px] bg-[#A9421B] hover:bg-[#833518] text-white text-xs font-semibold rounded-2xl transition-colors focus-ring shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Date */}
            {lossStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    {flow.dateQuestion}
                  </h3>
                  <p className="text-xs text-[#6B4A3A] mt-1">
                    An approximate date is okay if you do not remember the exact day.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-[#6B4A3A] uppercase tracking-wider block">
                    Date of event
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full min-h-[48px] px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setLossStep(2)}
                    className="w-1/3 min-h-[52px] bg-white border border-[#EAD5C0] text-[#3B1409] text-xs font-semibold rounded-2xl hover:bg-[#F6E7D8] transition-colors focus-ring"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setLossStep(4)}
                    className="w-2/3 min-h-[52px] bg-[#A9421B] hover:bg-[#833518] text-white text-xs font-semibold rounded-2xl transition-colors focus-ring shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Hide Pregnancy Content Preference */}
            {lossStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    {flow.hidePregnancyQuestion}
                  </h3>
                  <p className="text-xs text-[#6B4A3A] leading-relaxed">
                    {flow.hidePregnancyExplanation}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setHidePregnancyContent(true)}
                    className={cn(
                      "w-full min-h-[48px] px-4 py-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all focus-ring",
                      hidePregnancyContent
                        ? "bg-[#A9421B] text-white border-[#A9421B]"
                        : "bg-white text-[#3B1409] border-[#B89A82] hover:border-[#A9421B]"
                    )}
                  >
                    <span>Yes, hide pregnancy content</span>
                    <EyeOff className={cn("w-4 h-4", hidePregnancyContent ? "text-white" : "text-[#6B4A3A]")} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setHidePregnancyContent(false)}
                    className={cn(
                      "w-full min-h-[48px] px-4 py-3 rounded-2xl border text-left text-xs font-semibold flex items-center justify-between transition-all focus-ring",
                      !hidePregnancyContent
                        ? "bg-[#A9421B] text-white border-[#A9421B]"
                        : "bg-white text-[#3B1409] border-[#B89A82] hover:border-[#A9421B]"
                    )}
                  >
                    <span>Keep as is</span>
                    <Heart className={cn("w-4 h-4", !hidePregnancyContent ? "text-white" : "text-[#6B4A3A]")} />
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setLossStep(3)}
                    disabled={savingLoss}
                    className="w-1/3 min-h-[52px] bg-white border border-[#EAD5C0] text-[#3B1409] text-xs font-semibold rounded-2xl hover:bg-[#F6E7D8] transition-colors focus-ring"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveLoss}
                    disabled={savingLoss}
                    className="w-2/3 min-h-[52px] bg-[#A9421B] hover:bg-[#833518] text-white text-xs font-semibold rounded-2xl transition-colors focus-ring shadow-xs flex items-center justify-center gap-1.5"
                  >
                    {savingLoss ? flow.savingButton : flow.saveButton}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Success & Navigation Options */}
            {lossStep === 5 && (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-[#E8EAD0] text-[#5E5A28] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-[#5E5A28]" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-bold font-serif text-[#3B1409]">
                    Saved to your health story
                  </h3>
                  <p className="text-xs text-[#6B4A3A] leading-relaxed">
                    Your profile has been updated. We have prepared gentle resources for your body and heart.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      closeLossModal();
                      navigate('/loss-support');
                    }}
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Heart className="w-4 h-4 text-white" />
                    <span>Support after a pregnancy loss</span>
                  </button>

                  <button
                    type="button"
                    onClick={closeLossModal}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CYCLE AND HEALTH SETTINGS MODAL */}
      {/* ========================================================================= */}
      {showCycleSettingsModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-1 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-[#A9421B]" />
                <span className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
                  Cycle & health settings
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCycleSettingsModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* The required switch: 'I no longer have periods (for example after a hysterectomy)' saved to tracks_periods */}
              <div className="bg-white border border-[#EAD5C0] rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <label 
                      htmlFor="no-periods-switch"
                      className="text-sm font-bold text-[#3B1409] block cursor-pointer leading-snug"
                    >
                      I no longer have periods (for example after a hysterectomy)
                    </label>
                    <p className="text-xs text-[#6B4A3A] leading-relaxed">
                      Pauses cycle predictions and period range estimates.
                    </p>
                  </div>

                  {/* Accessible switch */}
                  <button
                    id="no-periods-switch"
                    type="button"
                    role="switch"
                    aria-checked={!isTrackingPeriods}
                    onClick={handleToggleTracksPeriods}
                    disabled={savingCycleSettings}
                    className={cn(
                      "w-12 h-7 rounded-full transition-colors relative focus-ring shrink-0 mt-0.5",
                      !isTrackingPeriods ? "bg-[#A9421B]" : "bg-[#EAD5C0]"
                    )}
                  >
                    <span
                      className={cn(
                        "block w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform mt-1",
                        !isTrackingPeriods ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {/* Note that symptom tracking continues */}
                <div className="p-3 bg-[#F6E7D8]/80 border border-[#EAD5C0] rounded-xl text-xs text-[#3B1409] leading-relaxed font-medium">
                  Symptom tracking, pain records, and personal health observations continue uninterrupted even when period tracking is paused.
                </div>
              </div>

              {/* Profile Baseline Info */}
              <div className="bg-white border border-[#EAD5C0] rounded-2xl p-4 space-y-2">
                <span className="text-xs font-bold text-[#3B1409] block uppercase tracking-wider">
                  Baseline Profile Details
                </span>
                <div className="space-y-1.5 text-xs text-[#3B1409]">
                  <div className="flex justify-between py-1 border-b border-[#EAD5C0]/60">
                    <span className="text-[#6B4A3A]">Usual cycle length:</span>
                    <span className="font-semibold text-[#3B1409]">
                      {profile?.cycle_length_days ? `${profile.cycle_length_days} days` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAD5C0]/60">
                    <span className="text-[#6B4A3A]">Usual period duration:</span>
                    <span className="font-semibold text-[#3B1409]">
                      {profile?.period_length_days ? `${profile.period_length_days} days` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#6B4A3A]">Cycle regularity:</span>
                    <span className="font-semibold text-[#3B1409] capitalize">
                      {profile?.cycle_regularity || 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCycleSettingsModal(false)}
              className="btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* PREGNANCY SETUP MODAL */}
      {showPregnancySetupModal && profile?.id && (
        <PregnancySetupModal
          userId={profile.id}
          existingStages={profile.stages || []}
          onSuccess={async () => {
            setShowPregnancySetupModal(false);
            await refetchProfile();
          }}
          onClose={() => setShowPregnancySetupModal(false)}
        />
      )}

      {/* BIRTH COMPLETION MODAL */}
      {showBirthModal && profile?.id && (
        <BirthCompletionModal
          userId={profile.id}
          currentStages={profile.stages || []}
          currentChildrenCount={profile.children_count || 0}
          onSuccess={async () => {
            setShowBirthModal(false);
            await refetchProfile();
          }}
          onClose={() => setShowBirthModal(false)}
        />
      )}

      {/* MENOPAUSE SETUP MODAL */}
      {showMenopauseModal && profile?.id && (
        <MenopauseSetupModal
          userId={profile.id}
          existingStages={profile.stages || []}
          initialLastPeriodDate={profile.last_period_date}
          onSuccess={async () => {
            setShowMenopauseModal(false);
            await refetchProfile();
          }}
          onClose={() => setShowMenopauseModal(false)}
        />
      )}

      {/* PRIVACY AND CONSENT MODAL */}
      {showPrivacyModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-lg p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#A9421B]" />
                <h2 className="text-base font-bold font-serif text-[#3B1409]">
                  Privacy & Data Management
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPrivacyModal(false);
                  setShowDeleteConfirm(false);
                  setPrivacyError(null);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {privacyError && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{privacyError}</span>
              </div>
            )}

            {/* Success banners */}
            {downloadSuccess && (
              <div className="p-3 bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] text-xs font-semibold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5E5A28]" />
                <span>Your complete health archive has been exported and downloaded.</span>
              </div>
            )}

            {deleteSuccess && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#7A2E10]" />
                <span>All health data and uploaded document files have been erased.</span>
              </div>
            )}

            {/* Privacy Commitments */}
            <div className="bg-white border border-[#EAD5C0] rounded-2xl p-4 space-y-2 text-xs text-[#6B4A3A]">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-[#A9421B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#3B1409] block">Encrypted & Private</span>
                  <span>Your medical documents and logged entries are stored in a private bucket accessible only by your verified session.</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <FileCheck2 className="w-4 h-4 text-[#A9421B] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#3B1409] block">No AI Document Processing</span>
                  <span>Mama Root never uses artificial intelligence or language models to read, scan, or summarize your uploaded files.</span>
                </div>
              </div>
            </div>

            {/* Action 1: Download My Data */}
            <div className="bg-white border border-[#EAD5C0] rounded-2xl p-4 space-y-2.5">
              <div>
                <h3 className="text-sm font-bold font-serif text-[#3B1409]">Download my data</h3>
                <p className="text-xs text-[#6B4A3A] mt-0.5">
                  Export a full record of your profile, symptoms, life stage events, consultation notes, and the list of your uploaded documents.
                </p>
              </div>
              <button
                type="button"
                disabled={downloadingData}
                onClick={handleDownloadData}
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2.5"
              >
                {downloadingData ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#A9421B]" />
                    <span>Preparing download...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#3B1409]" />
                    <span>Download my data (JSON)</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 2: Delete My Health Data */}
            <div className="bg-[#FFF9F2] border border-[#E0A77A] rounded-2xl p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-[#7A2E10] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-[#7A2E10]" />
                  <span>Delete my health data</span>
                </h3>
                <p className="text-xs text-[#6B4A3A] mt-0.5">
                  Permanently remove all your symptom logs, life stage notes, and erase all files from your private document bucket.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-[#7A2E10] bg-[#F8DFC8] hover:bg-[#F6E7D8] transition-colors flex items-center justify-center gap-2 border border-[#E0A77A]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete my health data</span>
                </button>
              ) : (
                <div className="p-3 bg-white border border-[#E0A77A] rounded-xl space-y-2.5 animate-in fade-in">
                  <p className="text-xs font-bold text-[#7A2E10]">
                    Are you sure? This cannot be undone.
                  </p>
                  <p className="text-[11px] text-[#6B4A3A]">
                    All your uploaded documents will be deleted from the private bucket immediately, and your timeline entries will be erased.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={deletingData}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-secondary flex-1 text-xs py-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={deletingData}
                      onClick={handleDeleteAllHealthData}
                      className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white bg-[#A9421B] hover:bg-[#833518] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {deletingData ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Erasing...</span>
                        </>
                      ) : (
                        <span>Yes, delete all</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(false)}
                className="btn-secondary w-full text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMINDERS MODAL */}
      {showRemindersModal && profile?.id && (
        <RemindersModal
          userId={profile.id}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      {/* APP SETTINGS / LANGUAGE PICKER MODAL */}
      {showAppSettingsModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#A9421B]" />
                <h2 className="text-base font-bold font-serif text-[#3B1409]">
                  {t('app_settings')}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAppSettingsModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Picker Section */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold font-serif text-[#3B1409]">
                {t('language_picker_title')}
              </h3>
              <p className="text-xs text-[#6B4A3A]">
                {t('language_picker_subtitle')}
              </p>

              {langSuccess && (
                <div className="p-2.5 bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] text-xs font-semibold rounded-2xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#5E5A28]" />
                  <span>Language updated successfully.</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = (profile?.language || currentLang) === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      disabled={savingLang}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={cn(
                        "w-full min-h-[48px] px-4 py-3 rounded-2xl border text-sm font-semibold transition-all flex items-center justify-between text-left focus-ring",
                        isSelected
                          ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                          : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B] hover:bg-[#F6E7D8]/30"
                      )}
                    >
                      <span>{lang.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAppSettingsModal(false)}
                className="btn-secondary w-full text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
