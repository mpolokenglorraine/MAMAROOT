import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Smartphone, 
  Share2, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  FileText, 
  ChevronRight,
  ArrowLeft,
  X,
  Clock,
  ShieldCheck,
  Stethoscope,
  Paperclip
} from 'lucide-react';
import { supabase, Symptom, Appointment, DoctorNote, UserCondition, HealthEvent, HealthDocument } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { formatDate, cn } from '../lib/utils';

type DateRange = '30_days' | '3_months' | '12_months' | 'all';

export default function ConsultationSummary() {
  const { user, profile } = useAuth();

  // Mode: 'builder' | 'view'
  const [viewMode, setViewMode] = useState<'builder' | 'view'>('builder');

  // Form State
  const [mainConcern, setMainConcern] = useState<string>('Persistent pelvic pain');
  const [dateRange, setDateRange] = useState<DateRange>('3_months');
  const [includeSymptoms, setIncludeSymptoms] = useState<boolean>(true);
  const [includeConditions, setIncludeConditions] = useState<boolean>(true);
  const [includeEvents, setIncludeEvents] = useState<boolean>(true);
  const [includeDocuments, setIncludeDocuments] = useState<boolean>(true);
  const [includeAppointments, setIncludeAppointments] = useState<boolean>(true);
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);

  // Questions dynamic list
  const [questions, setQuestions] = useState<string[]>([
    'Are these pain flare-ups consistent with my suspected condition?',
    'Should we schedule a pelvic scan or adjust medication?'
  ]);
  const [newQuestion, setNewQuestion] = useState<string>('');

  // Data states loaded from patient's records
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [conditions, setConditions] = useState<UserCondition[]>([]);
  const [healthEvents, setHealthEvents] = useState<HealthEvent[]>([]);
  const [healthDocuments, setHealthDocuments] = useState<HealthDocument[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Actions state
  const [showPhoneView, setShowPhoneView] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadPatientData();
    }
  }, [profile?.id]);

  async function loadPatientData() {
    if (!profile?.id) return;
    try {
      setLoading(true);

      // 1. Symptoms
      const { data: sympData } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (sympData) setSymptoms(sympData);

      // 2. User Conditions
      const { data: condData } = await supabase
        .from('user_conditions')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (condData) setConditions(condData);

      // 3. Health Events
      try {
        const { data: eventsData } = await supabase
          .from('health_events')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (eventsData) setHealthEvents(eventsData);
      } catch (err) {
        console.warn('Could not query health_events table:', err);
      }

      // 4. Appointments
      const { data: apptData } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });
      if (apptData) setAppointments(apptData);

      // 5. Doctor notes ("What my doctor said")
      const { data: notesData } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_id', profile.id)
        .order('created_at', { ascending: false });
      if (notesData) setDoctorNotes(notesData);

      // 6. Health Documents
      try {
        const { data: docsData } = await supabase
          .from('health_documents')
          .select('*')
          .eq('user_id', profile.id)
          .order('document_date', { ascending: false });
        if (docsData) setHealthDocuments(docsData);
      } catch (docErr) {
        console.warn('Could not load health_documents:', docErr);
      }

    } catch (err) {
      console.error('Error loading patient consultation data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Filter helper by date range
  const isWithinDateRange = (dateStr?: string | null): boolean => {
    if (!dateStr || dateRange === 'all') return true;
    const d = new Date(dateStr).getTime();
    if (isNaN(d)) return true;
    const now = Date.now();
    const daysDiff = (now - d) / (1000 * 60 * 60 * 24);
    if (dateRange === '30_days') return daysDiff <= 30;
    if (dateRange === '3_months') return daysDiff <= 90;
    if (dateRange === '12_months') return daysDiff <= 365;
    return true;
  };

  // Filtered dataset
  const filteredSymptoms = symptoms.filter(s => isWithinDateRange(s.created_at));
  const filteredAppointments = appointments.filter(a => isWithinDateRange(a.date));
  const filteredNotes = doctorNotes.filter(n => isWithinDateRange(n.created_at));
  const filteredEvents = healthEvents.filter(e => isWithinDateRange(e.event_date || e.created_at));
  const filteredDocuments = healthDocuments.filter(d => isWithinDateRange(d.document_date || d.created_at));

  // Determine bleeding note from symptoms
  const getBleedingStatus = (s: Symptom): string => {
    const t = (s.type || '').toLowerCase();
    const n = (s.notes || '').toLowerCase();
    if (t.includes('heavy bleeding')) return 'Heavy bleeding';
    if (t.includes('bleeding')) return 'Reported';
    if (n.includes('heavy bleeding') || n.includes('heavy flow')) return 'Heavy bleeding';
    if (n.includes('spotting')) return 'Spotting';
    if (n.includes('bleeding') || n.includes('bleed')) return 'Reported';
    return '—';
  };

  // Calculate unique days with severe pain (>= 7)
  const severePainDaysSet = new Set(
    filteredSymptoms
      .filter(s => s.severity >= 7)
      .map(s => new Date(s.created_at).toISOString().split('T')[0])
  );
  const severeDaysCount = severePainDaysSet.size;
  const severeCountText = severeDaysCount > 0
    ? `Severe pain (7 or more) on ${severeDaysCount} day${severeDaysCount === 1 ? '' : 's'}`
    : 'No severe pain (7 or more) recorded in this period';

  // Questions management
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions([...questions, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Patient name display (respecting anonymous_mode)
  const patientDisplayName = profile?.anonymous_mode 
    ? 'Name withheld' 
    : (profile?.full_name || user?.user_metadata?.full_name || 'Patient');

  const currentDateFormatted = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const rangeLabelMap: Record<DateRange, string> = {
    '30_days': 'Last 30 days',
    '3_months': 'Last 3 months',
    '12_months': 'Last 12 months',
    'all': 'Complete history'
  };

  // Plain-text generator for Share and Clipboard
  const generatePlainTextSummary = (): string => {
    const lines: string[] = [];
    lines.push('HEALTH SUMMARY — MAMA ROOT');
    lines.push(`Patient: ${patientDisplayName}`);
    lines.push(`Date: ${currentDateFormatted}`);
    lines.push(`Timeframe: ${rangeLabelMap[dateRange]}`);
    lines.push('----------------------------------------');

    if (mainConcern.trim()) {
      lines.push(`MAIN CONCERN:`);
      lines.push(mainConcern.trim());
      lines.push('');
    }

    if (includeSymptoms) {
      lines.push(`SYMPTOMS (${severeCountText}):`);
      if (filteredSymptoms.length > 0) {
        filteredSymptoms.forEach(s => {
          lines.push(`• ${formatDate(s.created_at)} — ${s.type} | Pain: ${s.severity}/10 | Bleeding: ${getBleedingStatus(s)}${s.notes ? ` ("${s.notes}")` : ''}`);
        });
      } else {
        lines.push('• No symptoms recorded in this timeframe.');
      }
      lines.push('');
    }

    if (includeConditions) {
      lines.push('CONDITIONS:');
      if (conditions.length > 0) {
        conditions.forEach(c => {
          lines.push(`• ${c.condition} — Status: ${c.status}${c.diagnosed_year ? ` (Noticed/diagnosed: ${c.diagnosed_year})` : ''}`);
        });
      } else {
        lines.push('• No chronic conditions recorded.');
      }
      lines.push('');
    }

    if (includeEvents && (filteredEvents.length > 0 || (profile?.stages && profile.stages.length > 0))) {
      lines.push('HEALTH STORY & STAGE:');
      if (filteredEvents.length > 0) {
        filteredEvents.forEach(e => {
          lines.push(`• ${e.title} — Status: ${e.status}${e.event_date ? ` (${formatDate(e.event_date)})` : ''}`);
        });
      } else if (profile?.stages) {
        lines.push(`• Active stages: ${profile.stages.join(', ')}`);
      }
      lines.push('');
    }

    if (includeDocuments) {
      lines.push('HEALTH DOCUMENTS:');
      if (filteredDocuments.length > 0) {
        filteredDocuments.forEach(doc => {
          lines.push(`• ${doc.title} — Type: ${doc.document_type} | Date: ${formatDate(doc.document_date)}`);
        });
      } else {
        lines.push('• No documents recorded in this timeframe.');
      }
      lines.push('');
    }

    if (includeAppointments) {
      lines.push('RECENT APPOINTMENTS:');
      if (filteredAppointments.length > 0) {
        filteredAppointments.forEach(a => {
          lines.push(`• ${formatDate(a.date)} — ${a.title}${a.doctor_name ? ` with ${a.doctor_name}` : ''}${a.description ? ` (Notes: ${a.description})` : ''}`);
        });
      } else {
        lines.push('• No appointments scheduled or recorded.');
      }
      lines.push('');
    }

    if (includeNotes) {
      lines.push('WHAT MY DOCTOR SAID:');
      if (filteredNotes.length > 0) {
        filteredNotes.forEach(n => {
          lines.push(`• ${n.doctor_name || 'Care provider'} (${formatDate(n.created_at)}): "${n.content}"`);
        });
      } else {
        lines.push('• No consultation notes recorded yet.');
      }
      lines.push('');
    }

    if (questions.length > 0) {
      lines.push('QUESTIONS FOR MY DOCTOR:');
      questions.forEach((q, idx) => {
        lines.push(`${idx + 1}. ${q}`);
      });
      lines.push('');
    }

    lines.push('----------------------------------------');
    lines.push("Prepared from the patient's own records in Mama Root. This is not a diagnosis.");
    return lines.join('\n');
  };

  // Actions handlers
  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const textSummary = generatePlainTextSummary();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mama Root Health Summary - ${patientDisplayName}`,
          text: textSummary,
        });
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(textSummary);
      setToastMessage('Summary copied to clipboard!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // =========================================================================
  // VIEW: 1. BUILDER FORM
  // =========================================================================
  if (viewMode === 'builder') {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-white border border-[#E6D5CB] rounded-2xl p-5 space-y-5 shadow-xs">
          <div className="border-b border-[#E6D5CB] pb-3">
            <h2 className="text-base font-bold text-[#572D43]">Prepare Doctor Summary</h2>
            <p className="text-xs text-[#65515A] mt-0.5">
              Select what to include to walk into your next consultation prepared.
            </p>
          </div>

          {/* Main concern field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#572D43] uppercase tracking-wider">
              Main concern
            </label>
            <input
              type="text"
              value={mainConcern}
              onChange={(e) => setMainConcern(e.target.value)}
              placeholder="e.g. Persistent pelvic pain, Heavy bleeding, Fertility review"
              className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
            />
          </div>

          {/* Date range chip set */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#572D43] uppercase tracking-wider">
              Timeframe
            </label>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: '30_days', label: 'Last 30 days' },
                  { id: '3_months', label: 'Last 3 months' },
                  { id: '12_months', label: 'Last 12 months' },
                  { id: 'all', label: 'Everything' }
                ] as const
              ).map((chip) => {
                const isSelected = dateRange === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setDateRange(chip.id)}
                    className={cn(
                      "chip min-h-[44px]",
                      isSelected ? "chip-selected" : "bg-white"
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Include checkboxes */}
          <div className="space-y-2.5 pt-2 border-t border-[#E6D5CB]">
            <label className="block text-xs font-bold text-[#572D43] uppercase tracking-wider">
              Include in summary
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSymptoms}
                  onChange={(e) => setIncludeSymptoms(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Symptoms & pain severity log ({symptoms.length} entries)
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeConditions}
                  onChange={(e) => setIncludeConditions(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Conditions & diagnosis status ({conditions.length} recorded)
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeEvents}
                  onChange={(e) => setIncludeEvents(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Health story events & life stages
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeDocuments}
                  onChange={(e) => setIncludeDocuments(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Health documents & test records ({healthDocuments.length})
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeAppointments}
                  onChange={(e) => setIncludeAppointments(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Recent appointments & scheduled visits ({appointments.length})
                </span>
              </label>

              <label className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F4E8E0]/30 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="w-5 h-5 rounded text-[#572D43] accent-[#572D43] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#2B1A24]">
                  Doctor notes & past clinician advice ({doctorNotes.length})
                </span>
              </label>
            </div>
          </div>

          {/* Questions for my doctor */}
          <div className="space-y-2.5 pt-2 border-t border-[#E6D5CB]">
            <div>
              <label className="block text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Questions for my doctor
              </label>
              <p className="text-[11px] text-[#65515A]">
                Write down key questions you want answered during your appointment.
              </p>
            </div>

            {/* Existing questions */}
            {questions.length > 0 && (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2.5 bg-[#FFF9F3] border border-[#E6D5CB] rounded-xl text-xs text-[#2B1A24]"
                  >
                    <span className="font-medium pt-0.5">{idx + 1}. {q}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-[#65515A] hover:text-red-700 p-1 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add question input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddQuestion();
                  }
                }}
                placeholder="Type a question for your doctor..."
                className="flex-1 px-3.5 py-2.5 min-h-[44px] text-xs bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="btn-secondary !w-auto px-4 !h-[44px] !min-h-[44px] text-xs shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Primary Create summary button */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => {
                setViewMode('view');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="btn-primary"
            >
              Create summary
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 2. SUMMARY VIEW (Clean white page / printable document)
  // =========================================================================
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#572D43] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2">
          <Check className="w-4 h-4 text-[#D9A7A4]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Toolbar (Hidden in print) */}
      <div className="no-print space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMode('builder')}
            className="text-xs font-semibold text-[#572D43] hover:text-[#431F33] flex items-center gap-1.5 min-h-[44px] px-2 focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Edit parameters</span>
          </button>
          <span className="text-xs text-[#65515A] font-medium">
            {rangeLabelMap[dateRange]}
          </span>
        </div>

        {/* 3 Main Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary !h-11 !min-h-[44px] px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5"
            title="Save as PDF or print this consultation summary"
          >
            <Printer className="w-4 h-4 shrink-0 text-[#572D43]" />
            <span className="truncate">Save / Print</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPhoneView(true)}
            className="btn-secondary !h-11 !min-h-[44px] px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5"
            title="Open large-text full screen mode to show your doctor on your phone"
          >
            <Smartphone className="w-4 h-4 shrink-0 text-[#572D43]" />
            <span className="truncate">Show on phone</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="btn-secondary !h-11 !min-h-[44px] px-2 text-[11px] font-semibold flex items-center justify-center gap-1.5"
            title="Share summary text or copy to clipboard"
          >
            <Share2 className="w-4 h-4 shrink-0 text-[#572D43]" />
            <span className="truncate">Share</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE HEALTH SUMMARY CARD */}
      {/* ========================================================================= */}
      <div className="printable-summary bg-white border border-[#E6D5CB] rounded-2xl p-6 sm:p-8 space-y-6 text-[#2B1A24] shadow-xs">
        
        {/* Header: Health Summary + Name + Date */}
        <div className="border-b border-[#E6D5CB] pb-4 space-y-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#572D43] font-heading">
                Health summary
              </h1>
              <p className="text-sm font-semibold text-[#2B1A24] mt-1">
                Patient: <span className="font-bold">{patientDisplayName}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#65515A] block">Date prepared:</span>
              <span className="text-xs font-semibold text-[#572D43]">{currentDateFormatted}</span>
            </div>
          </div>
          <p className="text-[11px] text-[#65515A]">
            Report timeframe: {rangeLabelMap[dateRange]}
          </p>
        </div>

        {/* 1. Main Concern */}
        {mainConcern.trim() && (
          <div className="space-y-1 bg-[#F4E8E0]/40 p-3.5 rounded-xl border border-[#E6D5CB]">
            <span className="text-xs font-bold text-[#572D43] uppercase tracking-wider block">
              Main Concern
            </span>
            <p className="text-sm font-bold text-[#2B1A24]">
              {mainConcern}
            </p>
          </div>
        )}

        {/* 2. Symptoms Table */}
        {includeSymptoms && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Recorded Symptoms
              </h2>
              <span className="text-[11px] font-semibold text-[#914E61]">
                Newest first
              </span>
            </div>

            {/* One-line severity count */}
            <div className="p-2.5 bg-[#FFF9F3] border border-[#E6D5CB] rounded-xl text-xs font-semibold text-[#572D43] flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#914E61]" />
              <span>{severeCountText}</span>
            </div>

            {filteredSymptoms.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6D5CB] text-[#65515A]">
                      <th className="py-2 pr-3 font-bold uppercase tracking-wider text-[10px]">Date</th>
                      <th className="py-2 pr-3 font-bold uppercase tracking-wider text-[10px]">Symptom</th>
                      <th className="py-2 pr-3 font-bold uppercase tracking-wider text-[10px]">Pain</th>
                      <th className="py-2 font-bold uppercase tracking-wider text-[10px]">Bleeding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6D5CB]/70">
                    {filteredSymptoms.map((s) => (
                      <tr key={s.id} className="align-top">
                        <td className="py-2.5 pr-3 text-[#65515A] whitespace-nowrap font-medium">
                          {formatDate(s.created_at)}
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-[#2B1A24]">
                          {s.type}
                          {s.notes && (
                            <span className="block text-[11px] font-normal text-[#65515A] italic mt-0.5">
                              "{s.notes}"
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 font-bold whitespace-nowrap">
                          <span className={cn(
                            s.severity >= 7 ? "text-[#6B2F3C] font-black" : "text-[#572D43]"
                          )}>
                            {s.severity}/10
                          </span>
                        </td>
                        <td className="py-2.5 text-[#65515A] whitespace-nowrap">
                          {getBleedingStatus(s)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No symptoms recorded in this timeframe.
              </p>
            )}
          </div>
        )}

        {/* 3. Conditions */}
        {includeConditions && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Conditions & Status
              </h2>
            </div>

            {conditions.length > 0 ? (
              <div className="space-y-2">
                {conditions.map((c) => (
                  <div 
                    key={c.id || c.condition}
                    className="flex items-center justify-between py-2 border-b border-[#E6D5CB]/60 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#2B1A24]">
                        {c.condition}
                      </span>
                      {c.diagnosed_year && (
                        <span className="text-[11px] text-[#65515A] ml-1.5">
                          (noticed/diagnosed {c.diagnosed_year})
                        </span>
                      )}
                    </div>
                    {/* Exact status label as stored */}
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-md",
                      c.status?.toLowerCase().includes('confirmed')
                        ? "bg-[#572D43] text-white"
                        : c.status?.toLowerCase().includes('suspected')
                        ? "bg-[#F3D9D6] text-[#6B2F3C] border border-[#D9A7A4]"
                        : "bg-[#F4E8E0] text-[#572D43] border border-[#E6D5CB]"
                    )}>
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No conditions recorded in health history.
              </p>
            )}
          </div>
        )}

        {/* 4. Health Story Events */}
        {includeEvents && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Health Story Events & Life Stage
              </h2>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="space-y-2">
                {filteredEvents.map((evt) => (
                  <div 
                    key={evt.id}
                    className="flex items-center justify-between py-2 border-b border-[#E6D5CB]/60 last:border-b-0"
                  >
                    <div>
                      <span className="font-semibold text-xs text-[#2B1A24]">
                        {evt.title}
                      </span>
                      {evt.event_date && (
                        <span className="text-[11px] text-[#65515A] ml-1.5">
                          ({formatDate(evt.event_date)})
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F4E8E0] text-[#572D43] border border-[#E6D5CB]">
                      {evt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : profile?.stages && profile.stages.length > 0 ? (
              <div className="space-y-1 py-1">
                <span className="text-xs text-[#65515A]">Current tracked stages:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.stages.map((stg) => (
                    <span key={stg} className="text-[10px] font-bold bg-[#F4E8E0] text-[#572D43] px-2.5 py-0.5 rounded-md">
                      {stg.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No health story events recorded.
              </p>
            )}
          </div>
        )}

        {/* Health Documents (Title, Type, Date only - not the files) */}
        {includeDocuments && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5 flex items-center justify-between">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Health Documents & Records
              </h2>
              <span className="text-[10px] text-[#65515A]">Titles & dates only</span>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <div 
                    key={doc.id || doc.file_path}
                    className="flex items-center justify-between py-2 border-b border-[#E6D5CB]/60 last:border-b-0 text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-[#2B1A24] block truncate">
                        {doc.title}
                      </span>
                      <span className="text-[11px] text-[#65515A]">
                        {formatDate(doc.document_date)}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F4E8E0] text-[#572D43] border border-[#E6D5CB] whitespace-nowrap shrink-0">
                      {doc.document_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No health documents recorded in this timeframe.
              </p>
            )}
          </div>
        )}

        {/* 5. Recent Appointments */}
        {includeAppointments && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Recent Care Appointments
              </h2>
            </div>

            {filteredAppointments.length > 0 ? (
              <div className="space-y-2">
                {filteredAppointments.map((appt) => (
                  <div key={appt.id} className="py-2 border-b border-[#E6D5CB]/60 last:border-b-0 text-xs space-y-0.5">
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-[#572D43]">{appt.title}</span>
                      <span className="text-[#65515A]">{formatDate(appt.date)}</span>
                    </div>
                    {appt.doctor_name && (
                      <p className="text-[#914E61] font-medium">{appt.doctor_name}</p>
                    )}
                    {appt.description && (
                      <p className="text-[#65515A] italic">{appt.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No appointments within this timeframe.
              </p>
            )}
          </div>
        )}

        {/* 6. Doctor Notes ("What my doctor said") */}
        {includeNotes && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                What My Doctor Said (Past Guidance)
              </h2>
            </div>

            {filteredNotes.length > 0 ? (
              <div className="space-y-2.5">
                {filteredNotes.map((note) => (
                  <div key={note.id} className="bg-[#FFF9F3] p-3 rounded-xl border border-[#E6D5CB] text-xs space-y-1">
                    <div className="flex items-center justify-between text-[#65515A]">
                      <span className="font-bold text-[#572D43]">{note.doctor_name || 'Care Provider'}</span>
                      <span>{formatDate(note.created_at)}</span>
                    </div>
                    <p className="text-[#2B1A24] leading-relaxed italic">
                      "{note.content}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#65515A] italic py-1">
                No past doctor guidance recorded in this timeframe.
              </p>
            )}
          </div>
        )}

        {/* 7. Questions For My Doctor */}
        {questions.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="border-b border-[#E6D5CB] pb-1.5">
              <h2 className="text-xs font-bold text-[#572D43] uppercase tracking-wider">
                Questions For My Doctor
              </h2>
            </div>
            <ol className="space-y-2 list-decimal pl-5 text-xs text-[#2B1A24]">
              {questions.map((q, idx) => (
                <li key={idx} className="font-medium pl-1 leading-relaxed">
                  {q}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Strict Mandatory Footer Line */}
        <div className="pt-4 border-t border-[#E6D5CB] text-center">
          <p className="text-[11px] text-[#65515A] font-medium leading-relaxed italic">
            Prepared from the patient's own records in Mama Root. This is not a diagnosis.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL-SCREEN LARGE-TEXT PHONE MODAL ("Show on my phone") */}
      {/* ========================================================================= */}
      {showPhoneView && (
        <div className="fixed inset-0 z-50 bg-white text-[#2B1A24] overflow-y-auto p-6 flex flex-col justify-between font-sans animate-in fade-in duration-200">
          <div className="max-w-xl mx-auto w-full space-y-6 pb-20">
            {/* Top close bar */}
            <div className="flex items-center justify-between border-b border-[#E6D5CB] pb-4 sticky top-0 bg-white z-10 pt-2">
              <div>
                <span className="text-xs font-bold text-[#914E61] uppercase tracking-wider">Doctor Consultation Mode</span>
                <h1 className="text-2xl font-bold text-[#572D43]">Health summary</h1>
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneView(false)}
                className="w-11 h-11 rounded-full bg-[#F4E8E0] text-[#572D43] flex items-center justify-center font-bold hover:bg-[#EAD6CA] transition-colors focus-ring"
                aria-label="Close phone view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Header */}
            <div className="bg-[#FFF9F3] border border-[#E6D5CB] rounded-2xl p-4 space-y-1">
              <p className="text-lg font-bold text-[#572D43]">
                Patient: <span className="text-[#2B1A24]">{patientDisplayName}</span>
              </p>
              <p className="text-sm text-[#65515A]">
                Date: {currentDateFormatted} ({rangeLabelMap[dateRange]})
              </p>
            </div>

            {/* Main concern */}
            {mainConcern.trim() && (
              <div className="bg-[#F4E8E0] border border-[#E6D5CB] rounded-2xl p-4 space-y-1">
                <span className="text-xs font-bold text-[#572D43] uppercase tracking-wider block">Main Concern:</span>
                <p className="text-xl font-bold text-[#572D43] leading-snug">
                  {mainConcern}
                </p>
              </div>
            )}

            {/* Symptoms summary */}
            {includeSymptoms && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-[#572D43] uppercase tracking-wider">
                  Symptoms Summary
                </h2>
                <div className="p-3 bg-[#F3D9D6] border border-[#D9A7A4] rounded-xl text-sm font-bold text-[#6B2F3C]">
                  {severeCountText}
                </div>

                <div className="space-y-2">
                  {filteredSymptoms.slice(0, 10).map((s) => (
                    <div key={s.id} className="p-3 border border-[#E6D5CB] rounded-xl bg-white space-y-1">
                      <div className="flex items-center justify-between text-base font-bold">
                        <span>{s.type}</span>
                        <span className={cn(s.severity >= 7 ? "text-[#6B2F3C]" : "text-[#572D43]")}>
                          Pain: {s.severity}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#65515A]">
                        <span>{formatDate(s.created_at)}</span>
                        <span>Bleeding: {getBleedingStatus(s)}</span>
                      </div>
                      {s.notes && (
                        <p className="text-xs text-[#2B1A24] italic pt-1 border-t border-[#E6D5CB]/60">
                          "{s.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {includeConditions && conditions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-base font-bold text-[#572D43] uppercase tracking-wider">
                  Recorded Conditions
                </h2>
                <div className="space-y-2">
                  {conditions.map((c) => (
                    <div key={c.id || c.condition} className="p-3 border border-[#E6D5CB] rounded-xl flex items-center justify-between">
                      <span className="font-bold text-base text-[#2B1A24]">
                        {c.condition}
                        {c.diagnosed_year && <span className="text-xs font-normal text-[#65515A] ml-2">({c.diagnosed_year})</span>}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#572D43] text-white">
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Health Documents (Title, Type, Date only) */}
            {includeDocuments && filteredDocuments.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-base font-bold text-[#572D43] uppercase tracking-wider">
                  Health Documents & Records
                </h2>
                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <div key={doc.id || doc.file_path} className="p-3 border border-[#E6D5CB] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-base text-[#2B1A24] block">
                          {doc.title}
                        </span>
                        <span className="text-xs text-[#65515A]">
                          Date: {formatDate(doc.document_date)}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F4E8E0] text-[#572D43] border border-[#E6D5CB]">
                        {doc.document_type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions for doctor */}
            {questions.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-base font-bold text-[#572D43] uppercase tracking-wider">
                  Questions to Discuss
                </h2>
                <div className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-3.5 bg-[#FFF9F3] border border-[#E6D5CB] rounded-xl text-sm font-semibold text-[#2B1A24] leading-relaxed">
                      {idx + 1}. {q}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#E6D5CB] text-center">
              <p className="text-xs text-[#65515A] italic">
                Prepared from the patient's own records in Mama Root. This is not a diagnosis.
              </p>
            </div>
          </div>

          {/* Sticky Done button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-[#E6D5CB]">
            <div className="max-w-xl mx-auto">
              <button
                type="button"
                onClick={() => setShowPhoneView(false)}
                className="btn-primary"
              >
                Close phone view
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
