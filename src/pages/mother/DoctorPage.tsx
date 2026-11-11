import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  FileText, 
  Pin, 
  Trash2, 
  Stethoscope, 
  Printer, 
  Smartphone, 
  X, 
  Check, 
  CalendarDays, 
  Activity, 
  Droplet, 
  Clock, 
  ChevronLeft, 
  ArrowLeft,
  AlertCircle,
  HelpCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  supabase, 
  DoctorNote, 
  Symptom, 
  PeriodLog, 
  HealthEvent, 
  Appointment, 
  UserCondition 
} from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { useT } from '../../i18n/useT';
import { RootsDivider, EmptyStateHeading, LeafSprigHeader } from '../../components/RootsMotif';

type DoctorSubTab = 'summary' | 'notes';
type DateRangeOption = '30days' | '3months' | '12months' | 'everything';

export default function DoctorPage() {
  const { t } = useT();
  const { profile } = useAuth();

  // Active sub-tab: 'summary' (default) or 'notes' ('What my doctor said')
  const [activeSubTab, setActiveSubTab] = useState<DoctorSubTab>('summary');

  // =========================================================================
  // SUB-TAB 1: HEALTH SUMMARY STATE
  // =========================================================================
  const [summaryMode, setSummaryMode] = useState<'builder' | 'view'>('builder');
  const [mainConcern, setMainConcern] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRangeOption>('3months');

  // Section checkboxes (all ticked by default)
  const [includeSections, setIncludeSections] = useState({
    symptoms: true,
    periods: true,
    conditions: true,
    healthEvents: true,
    appointments: true,
    doctorNotes: true,
  });

  // Questions for doctor
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionInput, setCurrentQuestionInput] = useState<string>('');

  // Loaded raw data for summary
  const [symptomsData, setSymptomsData] = useState<Symptom[]>([]);
  const [periodLogsData, setPeriodLogsData] = useState<PeriodLog[]>([]);
  const [conditionsData, setConditionsData] = useState<UserCondition[]>([]);
  const [healthEventsData, setHealthEventsData] = useState<HealthEvent[]>([]);
  const [appointmentsData, setAppointmentsData] = useState<Appointment[]>([]);
  const [doctorNotesData, setDoctorNotesData] = useState<DoctorNote[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // Full screen 'Show on my phone' mode
  const [showPhoneFullscreen, setShowPhoneFullscreen] = useState<boolean>(false);

  // =========================================================================
  // SUB-TAB 2: "WHAT MY DOCTOR SAID" STATE
  // =========================================================================
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteDoctorName, setNoteDoctorName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchDoctorNotes();
      fetchAllSummaryData();
    }
  }, [profile?.id]);

  async function fetchDoctorNotes() {
    try {
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_id', profile!.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
      setDoctorNotesData(data || []);
    } catch (err) {
      console.error('Error fetching doctor notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  }

  async function fetchAllSummaryData() {
    if (!profile?.id) return;
    try {
      setLoadingData(true);
      const [
        symptomsRes,
        periodsRes,
        conditionsRes,
        eventsRes,
        apptsRes,
        notesRes
      ] = await Promise.all([
        supabase.from('symptoms').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('period_logs').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
        supabase.from('user_conditions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('health_events').select('*').eq('user_id', profile.id).order('event_date', { ascending: false }),
        supabase.from('appointments').select('*').eq('user_id', profile.id).order('date', { ascending: false }),
        supabase.from('doctor_notes').select('*').eq('patient_id', profile.id).order('created_at', { ascending: false }),
      ]);

      setSymptomsData(symptomsRes.data || []);
      setPeriodLogsData(periodsRes.data || []);
      setConditionsData(conditionsRes.data || []);
      setHealthEventsData(eventsRes.data || []);
      setAppointmentsData(apptsRes.data || []);
      setDoctorNotesData(notesRes.data || []);
    } catch (err) {
      console.error('Error fetching summary records:', err);
    } finally {
      setLoadingData(false);
    }
  }

  // Handle adding notes in "What my doctor said"
  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id || !noteContent.trim()) return;

    try {
      setSavingNote(true);
      const { error } = await supabase.from('doctor_notes').insert({
        patient_id: profile.id,
        doctor_name: noteDoctorName.trim() || 'My Care Provider',
        content: noteContent.trim(),
        is_pinned: noteIsPinned,
      });

      if (error) throw error;

      setNoteDoctorName('');
      setNoteContent('');
      setNoteIsPinned(false);
      setShowAddNote(false);
      await fetchDoctorNotes();
    } catch (err) {
      console.error('Error adding doctor note:', err);
    } finally {
      setSavingNote(false);
    }
  }

  async function togglePin(noteId: string, currentPinned: boolean) {
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', noteId);

      if (error) throw error;
      await fetchDoctorNotes();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  }

  async function deleteNote(noteId: string) {
    if (!window.confirm('Delete this note?')) return;
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      await fetchDoctorNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  // Questions builder helper
  const handleAddQuestion = () => {
    if (!currentQuestionInput.trim()) return;
    setQuestions(prev => [...prev, currentQuestionInput.trim()]);
    setCurrentQuestionInput('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Date filter cutoff calculation
  const cutoffTime = useMemo<number | null>(() => {
    if (dateRange === 'everything') return null;
    const now = Date.now();
    if (dateRange === '30days') return now - 30 * 24 * 60 * 60 * 1000;
    if (dateRange === '3months') return now - 90 * 24 * 60 * 60 * 1000;
    if (dateRange === '12months') return now - 365 * 24 * 60 * 60 * 1000;
    return null;
  }, [dateRange]);

  const isAfterCutoff = (dateStr?: string | null): boolean => {
    if (!cutoffTime) return true;
    if (!dateStr) return false;
    const time = new Date(dateStr).getTime();
    return !isNaN(time) && time >= cutoffTime;
  };

  // Filtered summary datasets based on dateRange
  const filteredSymptoms = useMemo(() => {
    return symptomsData.filter(s => isAfterCutoff(s.created_at));
  }, [symptomsData, cutoffTime]);

  const filteredPeriods = useMemo(() => {
    return periodLogsData.filter(p => isAfterCutoff(p.start_date || p.created_at));
  }, [periodLogsData, cutoffTime]);

  const filteredEvents = useMemo(() => {
    return healthEventsData.filter(e => isAfterCutoff(e.event_date || e.created_at));
  }, [healthEventsData, cutoffTime]);

  const filteredAppointments = useMemo(() => {
    return appointmentsData.filter(a => isAfterCutoff(a.date || a.created_at));
  }, [appointmentsData, cutoffTime]);

  const filteredDoctorNotes = useMemo(() => {
    return doctorNotesData.filter(n => isAfterCutoff(n.created_at));
  }, [doctorNotesData, cutoffTime]);

  // Symptoms severe pain count (7 or more)
  const severePainDaysCount = useMemo(() => {
    const severeOnes = filteredSymptoms.filter(s => {
      const isPain = (s.type || '').toLowerCase().includes('pain') || true; // Severe symptoms
      return isPain && (s.severity ?? 0) >= 7;
    });
    // Distinct days
    const uniqueDays = new Set(
      severeOnes.map(s => {
        if (!s.created_at) return '';
        return s.created_at.split('T')[0];
      }).filter(Boolean)
    );
    return uniqueDays.size;
  }, [filteredSymptoms]);

  // Periods with gaps calculation
  const periodsWithGaps = useMemo(() => {
    // Sort chronological ascending to calculate gaps accurately, then present in standard view
    const sorted = [...filteredPeriods].sort((a, b) => {
      const tA = new Date(a.start_date).getTime();
      const tB = new Date(b.start_date).getTime();
      return tA - tB;
    });

    return sorted.map((p, idx) => {
      let gapText = '—';
      if (idx > 0) {
        const prevDate = new Date(sorted[idx - 1].start_date).getTime();
        const currDate = new Date(p.start_date).getTime();
        const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
        gapText = `${diffDays} days`;
      }

      // Length calculation
      let lengthText = '5 days';
      if (p.end_date && p.start_date) {
        const sTime = new Date(p.start_date).getTime();
        const eTime = new Date(p.end_date).getTime();
        const dur = Math.round((eTime - sTime) / (1000 * 60 * 60 * 24)) + 1;
        if (dur > 0 && dur < 30) lengthText = `${dur} days`;
      } else if (profile?.period_length_days) {
        lengthText = `${profile.period_length_days} days`;
      }

      return {
        ...p,
        lengthText,
        gapText,
      };
    }).reverse(); // Display newest first
  }, [filteredPeriods, profile?.period_length_days]);

  // Status badge formatter for summary:
  // Never describe a suspected item as confirmed!
  const renderExactStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2F6B3F] text-white border border-[#2F6B3F]">
          Confirmed
        </span>
      );
    }
    if (s === 'doctor_suspected' || s === 'suspected') {
      return (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7CCA5] text-[#3B1409] border border-[#E0A77A]">
          Doctor suspected
        </span>
      );
    }
    return (
      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F6E7D8] text-[#3B1409] border border-[#EAD5C0]">
        Experienced
      </span>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="relative pt-1 overflow-hidden no-print">
        <LeafSprigHeader />
        <div className="flex items-center gap-2 mb-1 relative z-10">
          <Stethoscope className="w-5 h-5 text-[#2F6B3F]" />
          <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
            Doctor & Consultations
          </h1>
        </div>
        <p className="text-sm text-[#6B4A3A] relative z-10">
          Prepare clinical health summaries and keep track of instructions from your healthcare team.
        </p>

        {/* Sub-tabs: 'Summary' (default) and 'What my doctor said' */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-white border border-[#EAD5C0] rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveSubTab('summary')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all focus-ring",
              activeSubTab === 'summary'
                ? "bg-[#2F6B3F] text-white shadow-xs"
                : "text-[#3B1409] hover:bg-[#F6E7D8]/60"
            )}
          >
            Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('notes')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all focus-ring",
              activeSubTab === 'notes'
                ? "bg-[#2F6B3F] text-white shadow-xs"
                : "text-[#3B1409] hover:bg-[#F6E7D8]/60"
            )}
          >
            What my doctor said {notes.length > 0 && `(${notes.length})`}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: HEALTH SUMMARY BUILDER OR REPORT */}
      {/* ========================================================================= */}
      {activeSubTab === 'summary' && (
        <div className="space-y-5">
          {summaryMode === 'builder' ? (
            /* SUMMARY BUILDER FORM */
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-5 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold font-serif text-[#3B1409]">
                  Prepare a Health Summary
                </h2>
                <p className="text-xs text-[#6B4A3A] mt-0.5">
                  Select what to include to generate an organized, clear summary for your next consultation.
                </p>
              </div>

              {/* Text field: Main concern */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Main concern
                </label>
                <input
                  type="text"
                  value={mainConcern}
                  onChange={(e) => setMainConcern(e.target.value)}
                  placeholder="e.g. Recurrent severe pelvic pain and fatigue around my cycle"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* Date range chips: Last 30 days, Last 3 months, Last 12 months, Everything */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Date range
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: '30days', label: 'Last 30 days' },
                    { id: '3months', label: 'Last 3 months' },
                    { id: '12months', label: 'Last 12 months' },
                    { id: 'everything', label: 'Everything' },
                  ].map((range) => {
                    const isSelected = dateRange === range.id;
                    return (
                      <button
                        key={range.id}
                        type="button"
                        onClick={() => setDateRange(range.id as DateRangeOption)}
                        className={cn(
                          "min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus-ring flex items-center gap-1.5",
                          isSelected
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{range.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Checkboxes: Symptoms, Periods, Conditions, Health story events, Appointments, Doctor notes (all ticked) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Include sections
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                  {[
                    { key: 'symptoms', label: 'Symptoms' },
                    { key: 'periods', label: 'Periods' },
                    { key: 'conditions', label: 'Conditions' },
                    { key: 'healthEvents', label: 'Health story events' },
                    { key: 'appointments', label: 'Appointments' },
                    { key: 'doctorNotes', label: 'Doctor notes' },
                  ].map(({ key, label }) => {
                    const checked = includeSections[key as keyof typeof includeSections];
                    return (
                      <label
                        key={key}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-colors",
                          checked
                            ? "bg-[#E3F1DA]/50 border-[#BFDDAE] text-[#1F4A2B]"
                            : "bg-[#FFF9F2] border-[#EAD5C0] text-[#6B4A3A]"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setIncludeSections(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }));
                          }}
                          className="w-4 h-4 rounded text-[#2F6B3F] accent-[#2F6B3F]"
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Questions for my doctor */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider">
                  Questions for my doctor
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentQuestionInput}
                    onChange={(e) => setCurrentQuestionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                    placeholder="e.g. Could my pelvic pain be related to endometriosis?"
                    className="flex-1 px-3.5 py-2.5 min-h-[44px] text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="btn-secondary !w-auto !min-h-[44px] !py-2 !px-4 text-xs font-bold shrink-0"
                  >
                    Add
                  </button>
                </div>

                {questions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2.5 bg-[#FFF9F2] border border-[#EAD5C0] rounded-xl text-xs text-[#3B1409]"
                      >
                        <span className="leading-snug">
                          <strong className="text-[#A9421B] mr-1.5">Q{idx + 1}:</strong> {q}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="p-1 text-[#6B4A3A] hover:text-red-700 rounded-md"
                          title="Remove question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 'Create summary' button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSummaryMode('view')}
                  className="btn-primary flex items-center justify-center gap-2 font-bold shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Create summary</span>
                </button>
              </div>
            </div>
          ) : (
            /* CLEAN WHITE HEALTH SUMMARY REPORT */
            <div className="space-y-4 animate-in fade-in">
              
              {/* Top Control Bar: Save as PDF / print, Show on phone, Edit */}
              <div className="flex flex-wrap items-center justify-between gap-2 no-print p-3 bg-white border border-[#EAD5C0] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setSummaryMode('builder')}
                  className="btn-secondary !w-auto !min-h-[40px] !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit parameters</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPhoneFullscreen(true)}
                    className="btn-secondary !w-auto !min-h-[40px] !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5 font-semibold hover:border-[#2F6B3F] hover:text-[#2F6B3F]"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Show on my phone</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-primary !w-auto !min-h-[40px] !py-1.5 !px-4 text-xs inline-flex items-center gap-1.5 font-bold shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Save as PDF or print</span>
                  </button>
                </div>
              </div>

              {/* PRINTABLE / VIEWABLE SUMMARY CARD */}
              <div 
                id="printable-summary"
                className="printable-summary bg-white border border-[#EAD5C0] rounded-3xl p-6 md:p-8 space-y-6 shadow-xs text-[#3B1409]"
              >
                {/* Header: 'Health summary', Patient name, Today's date */}
                <div className="border-b border-[#EAD5C0] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold font-serif text-[#3B1409] tracking-tight">
                      Health summary
                    </h1>
                    <p className="text-xs text-[#6B4A3A] mt-0.5">
                      Prepared from the patient's personal health journal in Mama Root
                    </p>
                  </div>
                  <div className="text-left sm:text-right text-xs space-y-0.5">
                    <p className="font-bold text-[#3B1409]">
                      Patient: <span className="text-[#A9421B]">{profile?.full_name || 'Mama Root Member'}</span>
                    </p>
                    <p className="text-[#6B4A3A]">
                      Date: {formatDate(new Date())}
                    </p>
                  </div>
                </div>

                {/* Main concern */}
                {mainConcern.trim() && (
                  <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl p-4 space-y-1">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
                      Main concern
                    </h2>
                    <p className="text-sm font-semibold text-[#3B1409] leading-relaxed">
                      {mainConcern}
                    </p>
                  </div>
                )}

                {/* 1. SYMPTOMS TABLE & COUNT LINE */}
                {includeSections.symptoms && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#EAD5C0] pb-1.5">
                      <h2 className="text-sm font-bold font-serif text-[#3B1409]">
                        Symptoms
                      </h2>
                      {severePainDaysCount > 0 ? (
                        <span className="text-xs font-bold text-[#A9421B] bg-[#F8DFC8] px-2.5 py-0.5 rounded-full border border-[#E0A77A]">
                          Severe pain (7 or more) on {severePainDaysCount} {severePainDaysCount === 1 ? 'day' : 'days'}
                        </span>
                      ) : (
                        <span className="text-xs text-[#6B4A3A]">
                          No severe symptoms (7+) recorded
                        </span>
                      )}
                    </div>

                    {filteredSymptoms.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No symptoms logged during this timeframe.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#EAD5C0] text-[#6B4A3A]">
                              <th className="py-2 pr-3 font-semibold">Date</th>
                              <th className="py-2 px-3 font-semibold">Symptom</th>
                              <th className="py-2 pl-3 font-semibold text-right">Strength</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAD5C0]/60">
                            {filteredSymptoms.map((s) => (
                              <tr key={s.id} className="hover:bg-[#FFF9F2]/50">
                                <td className="py-2.5 pr-3 text-[#6B4A3A] whitespace-nowrap">
                                  {formatDate(s.created_at)}
                                </td>
                                <td className="py-2.5 px-3 font-medium text-[#3B1409]">
                                  {s.type}
                                  {s.notes && (
                                    <span className="block text-[11px] text-[#6B4A3A] font-normal mt-0.5">
                                      {s.notes}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 pl-3 text-right font-bold whitespace-nowrap">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-md",
                                    s.severity >= 7 ? "bg-[#F8DFC8] text-[#7A2E10]" : "text-[#3B1409]"
                                  )}>
                                    {s.severity}/10
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. PERIODS (start date, length, gap) */}
                {includeSections.periods && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Periods & Cycles
                    </h2>

                    {periodsWithGaps.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No period logs recorded for this timeframe.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#EAD5C0] text-[#6B4A3A]">
                              <th className="py-2 pr-3 font-semibold">Start date</th>
                              <th className="py-2 px-3 font-semibold">Length</th>
                              <th className="py-2 pl-3 font-semibold text-right">Cycle gap</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAD5C0]/60">
                            {periodsWithGaps.map((p) => (
                              <tr key={p.id || p.start_date} className="hover:bg-[#FFF9F2]/50">
                                <td className="py-2.5 pr-3 font-medium text-[#3B1409] whitespace-nowrap">
                                  {formatDate(p.start_date)}
                                  {p.flow && (
                                    <span className="block text-[11px] text-[#6B4A3A] font-normal">
                                      Flow: {p.flow}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[#3B1409] whitespace-nowrap">
                                  {p.lengthText}
                                </td>
                                <td className="py-2.5 pl-3 text-right font-semibold text-[#A9421B] whitespace-nowrap">
                                  {p.gapText}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CONDITIONS WITH STATUS */}
                {includeSections.conditions && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Conditions
                    </h2>

                    {conditionsData.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No chronic or specific conditions listed.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {conditionsData.map((c) => (
                          <div 
                            key={c.id || c.condition}
                            className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-xl flex items-center justify-between text-xs"
                          >
                            <span className="font-bold text-[#3B1409]">{c.condition}</span>
                            {renderExactStatusBadge(c.status)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. HEALTH STORY EVENTS (status labels exactly as stored) */}
                {includeSections.healthEvents && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Health Story Events & Diagnoses
                    </h2>

                    {filteredEvents.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No health story events recorded in this timeframe.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredEvents.map((evt) => {
                          const detailsStr = typeof evt.details === 'string' ? evt.details : (evt.notes || '');
                          return (
                            <div 
                              key={evt.id || evt.title}
                              className="p-3 border border-[#EAD5C0] rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
                            >
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#3B1409]">{evt.title}</span>
                                  {evt.event_type && (
                                    <span className="text-[10px] uppercase font-semibold text-[#6B4A3A] px-1.5 py-0.5 bg-[#F6E7D8] rounded">
                                      {evt.event_type.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                {evt.event_date && (
                                  <p className="text-[11px] text-[#6B4A3A]">
                                    Date: {formatDate(evt.event_date)}
                                  </p>
                                )}
                                {detailsStr && (
                                  <p className="text-xs text-[#3B1409] leading-relaxed pt-0.5">
                                    {detailsStr}
                                  </p>
                                )}
                              </div>
                              <div className="shrink-0 pt-0.5">
                                {renderExactStatusBadge(evt.status)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. APPOINTMENTS */}
                {includeSections.appointments && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Appointments
                    </h2>

                    {filteredAppointments.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No appointments recorded in this timeframe.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredAppointments.map((a) => (
                          <div 
                            key={a.id}
                            className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-xl text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#3B1409]">{a.title}</span>
                              <span className="text-[#6B4A3A] text-[11px] font-medium">{formatDate(a.date)}</span>
                            </div>
                            {a.doctor_name && (
                              <p className="text-[#A9421B] font-semibold text-[11px]">
                                Clinician: {a.doctor_name}
                              </p>
                            )}
                            {a.description && (
                              <p className="text-[#3B1409] text-xs pt-0.5">
                                {a.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 6. DOCTOR NOTES */}
                {includeSections.doctorNotes && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Doctor Notes
                    </h2>

                    {filteredDoctorNotes.length === 0 ? (
                      <p className="text-xs text-[#6B4A3A] italic py-2">
                        No consultation notes recorded in this timeframe.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {filteredDoctorNotes.map((n) => (
                          <div 
                            key={n.id}
                            className="p-3.5 border border-[#EAD5C0] rounded-2xl text-xs space-y-1.5 bg-white"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-[#3B1409]">
                                {n.doctor_name || 'Care Provider'}
                              </span>
                              <span className="text-[11px] text-[#6B4A3A]">
                                {formatDate(n.created_at)}
                              </span>
                            </div>
                            <p className="text-[#3B1409] leading-relaxed whitespace-pre-wrap">
                              {n.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 7. QUESTIONS FOR MY DOCTOR */}
                {questions.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <h2 className="text-sm font-bold font-serif text-[#3B1409] border-b border-[#EAD5C0] pb-1.5">
                      Questions for my Doctor
                    </h2>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-[#3B1409] font-medium">
                      {questions.map((q, idx) => (
                        <li key={idx} className="leading-relaxed pl-1">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* FOOTER: 'Prepared from the patient's own records in Mama Root. This is not a diagnosis.' */}
                <div className="border-t border-[#EAD5C0] pt-4 mt-8 text-center text-xs text-[#6B4A3A] italic">
                  Prepared from the patient's own records in Mama Root. This is not a diagnosis.
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: "WHAT MY DOCTOR SAID" */}
      {/* ========================================================================= */}
      {activeSubTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
              Consultation Notes ({notes.length})
            </span>
            <button
              type="button"
              onClick={() => setShowAddNote(!showAddNote)}
              className="btn-primary !w-auto text-xs !py-2 !px-3.5 inline-flex items-center gap-1.5 focus-ring"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddNote ? 'Cancel' : 'Add a note'}</span>
            </button>
          </div>

          {/* Add Note Form */}
          {showAddNote && (
            <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in">
              <h2 className="text-base font-bold font-serif text-[#3B1409]">Record Doctor Guidance</h2>
              <p className="text-xs text-[#6B4A3A]">
                Write down advice, prescriptions, or instructions your doctor or midwife shared.
              </p>
              <form onSubmit={handleAddNote} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3B1409] mb-1">
                    Doctor or clinic name (optional)
                  </label>
                  <input
                    type="text"
                    value={noteDoctorName}
                    onChange={(e) => setNoteDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Mthembu, Pelvic Clinic, Midwife"
                    className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B1409] mb-1">
                    What my doctor said *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write the advice, treatment plan, or follow-up recommendation..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409] resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinNote"
                    checked={noteIsPinned}
                    onChange={(e) => setNoteIsPinned(e.target.checked)}
                    className="w-4 h-4 rounded text-[#A9421B] accent-[#A9421B]"
                  />
                  <label htmlFor="pinNote" className="text-xs font-medium text-[#3B1409] cursor-pointer">
                    Pin this note to the top
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingNote || !noteContent.trim()}
                    className="btn-primary w-full"
                  >
                    {savingNote ? 'Saving note...' : 'Save note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3">
            {loadingNotes ? (
              <div className="py-8 text-center text-xs text-[#6B4A3A]">
                Loading your consultation notes...
              </div>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={cn(
                    "bg-white border rounded-3xl p-4.5 space-y-3 transition-colors shadow-xs",
                    note.is_pinned 
                      ? "border-[#E0A77A] bg-[#F8DFC8]/25" 
                      : "border-[#EAD5C0]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center font-bold font-serif text-xs shrink-0">
                        {note.doctor_name ? note.doctor_name.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-serif text-[#3B1409] leading-tight">
                          {note.doctor_name || 'My Care Provider'}
                        </h3>
                        <p className="text-[11px] text-[#6B4A3A]">
                          {formatDate(note.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => togglePin(note.id, note.is_pinned)}
                        title={note.is_pinned ? "Unpin note" : "Pin note"}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-colors focus-ring",
                          note.is_pinned 
                            ? "text-[#A9421B] bg-[#F6E7D8]" 
                            : "text-[#6B4A3A] hover:bg-[#F6E7D8]"
                        )}
                      >
                        <Pin className={cn("w-4 h-4", note.is_pinned && "fill-current text-[#A9421B]")} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNote(note.id)}
                        title="Delete note"
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-[#6B4A3A] hover:text-red-700 hover:bg-red-50 transition-colors focus-ring"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-[#3B1409] whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#EAD5C0] rounded-3xl p-8 text-center space-y-4 shadow-xs">
                <EmptyStateHeading 
                  icon={FileText} 
                  title="No notes recorded yet" 
                  subtitle="Keep a personal record of what your healthcare provider advised so you never forget instructions." 
                />
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddNote(true)}
                    className="btn-secondary !h-11 !min-h-[44px] text-xs max-w-xs mx-auto"
                  >
                    Write down first note
                  </button>
                </div>
                <RootsDivider className="pt-4" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FULL-SCREEN "SHOW ON MY PHONE" MODAL */}
      {/* ========================================================================= */}
      {showPhoneFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-white overflow-y-auto p-5 sm:p-8 space-y-6 text-[#1A0A04]"
          role="dialog"
          aria-modal="true"
        >
          {/* Top floating bar to exit full screen */}
          <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs pb-3 pt-1 border-b border-[#EAD5C0] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9421B]">
                Doctor Presentation Mode
              </span>
              <h2 className="text-lg font-bold font-serif text-[#1A0A04]">
                Health summary
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowPhoneFullscreen(false)}
              className="btn-secondary !w-auto !min-h-[44px] !py-2 !px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Exit full screen</span>
            </button>
          </div>

          {/* Large text readable summary */}
          <div className="max-w-xl mx-auto space-y-6 text-sm sm:text-base leading-relaxed">
            
            {/* Patient Header */}
            <div className="bg-[#FFF9F2] p-4 rounded-2xl border border-[#EAD5C0] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-[#6B4A3A]">Patient</p>
                <p className="text-lg font-bold text-[#1A0A04]">{profile?.full_name || 'Mama Root Member'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase font-bold text-[#6B4A3A]">Date</p>
                <p className="text-sm font-semibold text-[#1A0A04]">{formatDate(new Date())}</p>
              </div>
            </div>

            {/* Main concern */}
            {mainConcern && (
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#A9421B]">
                  Main concern
                </h3>
                <p className="text-base sm:text-lg font-semibold text-[#1A0A04] bg-[#FFF9F2] p-4 rounded-2xl border border-[#EAD5C0]">
                  {mainConcern}
                </p>
              </div>
            )}

            {/* Symptoms summary */}
            {includeSections.symptoms && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-serif text-[#1A0A04]">Symptoms</h3>
                  {severePainDaysCount > 0 && (
                    <span className="text-xs font-bold text-[#A9421B] bg-[#F8DFC8] px-2.5 py-1 rounded-full border border-[#E0A77A]">
                      Severe pain (7+) on {severePainDaysCount} days
                    </span>
                  )}
                </div>
                {filteredSymptoms.length === 0 ? (
                  <p className="text-xs text-[#6B4A3A] italic">No symptoms in this period.</p>
                ) : (
                  <div className="divide-y divide-[#EAD5C0] border border-[#EAD5C0] rounded-2xl overflow-hidden bg-white">
                    {filteredSymptoms.map((s) => (
                      <div key={s.id} className="p-3.5 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-[#1A0A04]">{s.type}</p>
                          <p className="text-xs text-[#6B4A3A]">{formatDate(s.created_at)}</p>
                          {s.notes && <p className="text-xs text-[#3B1409] mt-0.5">{s.notes}</p>}
                        </div>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold shrink-0",
                          s.severity >= 7 ? "bg-[#F8DFC8] text-[#7A2E10]" : "bg-[#F6E7D8] text-[#3B1409]"
                        )}>
                          {s.severity}/10
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Periods */}
            {includeSections.periods && (
              <div className="space-y-2">
                <h3 className="text-base font-bold font-serif text-[#1A0A04]">Periods & Cycles</h3>
                {periodsWithGaps.length === 0 ? (
                  <p className="text-xs text-[#6B4A3A] italic">No periods logged.</p>
                ) : (
                  <div className="divide-y divide-[#EAD5C0] border border-[#EAD5C0] rounded-2xl overflow-hidden bg-white">
                    {periodsWithGaps.map((p) => (
                      <div key={p.id || p.start_date} className="p-3.5 flex items-center justify-between text-xs sm:text-sm">
                        <div>
                          <p className="font-bold text-[#1A0A04]">{formatDate(p.start_date)}</p>
                          <p className="text-xs text-[#6B4A3A]">Length: {p.lengthText}</p>
                        </div>
                        <p className="font-bold text-[#A9421B]">Cycle gap: {p.gapText}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Conditions */}
            {includeSections.conditions && conditionsData.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold font-serif text-[#1A0A04]">Conditions</h3>
                <div className="space-y-2">
                  {conditionsData.map((c) => (
                    <div key={c.id || c.condition} className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-bold">{c.condition}</span>
                      {renderExactStatusBadge(c.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Events */}
            {includeSections.healthEvents && filteredEvents.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold font-serif text-[#1A0A04]">Diagnoses & Events</h3>
                <div className="space-y-2">
                  {filteredEvents.map((e) => (
                    <div key={e.id || e.title} className="p-3.5 border border-[#EAD5C0] rounded-2xl space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm sm:text-base">{e.title}</span>
                        {renderExactStatusBadge(e.status)}
                      </div>
                      <p className="text-xs text-[#6B4A3A]">{formatDate(e.event_date)}</p>
                      {e.details && <p className="text-xs sm:text-sm text-[#3B1409]">{typeof e.details === 'string' ? e.details : e.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions */}
            {questions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-base font-bold font-serif text-[#1A0A04]">Questions for Doctor</h3>
                <div className="p-4 bg-[#E3F1DA]/40 border border-[#BFDDAE] rounded-2xl space-y-2">
                  {questions.map((q, idx) => (
                    <p key={idx} className="text-sm font-semibold text-[#1F4A2B]">
                      {idx + 1}. {q}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 pb-12 text-center text-xs text-[#6B4A3A] italic">
              Prepared from the patient's own records in Mama Root. This is not a diagnosis.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
