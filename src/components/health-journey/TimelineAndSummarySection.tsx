import React, { useState, useMemo } from 'react';
import { 
  History, 
  Filter, 
  Calendar, 
  FileText, 
  Printer, 
  Copy, 
  Check, 
  Flame, 
  Pill, 
  Activity, 
  Heart, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  Stethoscope, 
  ChevronRight,
  Clock,
  Share2,
  Sparkles,
  X
} from 'lucide-react';
import { 
  HealthCondition, 
  FlareUp, 
  MedicationRecord, 
  MedicalRecord, 
  FoodDiaryEntry 
} from '../../lib/healthJourneyService';
import { Symptom, Appointment } from '../../lib/supabase';

interface TimelineAndSummaryProps {
  conditions: HealthCondition[];
  flareUps: FlareUp[];
  medications: MedicationRecord[];
  medicalRecords: MedicalRecord[];
  symptoms: Symptom[];
  appointments: Appointment[];
  userName?: string;
}

type TimelineCategory = 'all' | 'conditions' | 'symptoms' | 'flareups' | 'medications' | 'appointments' | 'tests';

interface UnifiedTimelineItem {
  id: string;
  category: 'condition' | 'symptom' | 'flareup' | 'medication' | 'appointment' | 'test';
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  severity?: number;
  badge?: string;
  badgeColor?: string;
  isConfirmedClinically?: boolean;
}

export function TimelineAndSummarySection({
  conditions,
  flareUps,
  medications,
  medicalRecords,
  symptoms,
  appointments,
  userName = 'Patient'
}: TimelineAndSummaryProps) {
  const [activeCategory, setActiveCategory] = useState<TimelineCategory>('all');
  const [selectedConditionFilter, setSelectedConditionFilter] = useState<string>('all');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Generate unified chronological list
  const timelineItems: UnifiedTimelineItem[] = useMemo(() => {
    const list: UnifiedTimelineItem[] = [];

    // Conditions
    conditions.forEach(c => {
      list.push({
        id: `cond-${c.id}`,
        category: 'condition',
        date: c.date_noticed || c.created_at.split('T')[0],
        title: `${c.name} (${c.status === 'clinically_diagnosed' ? 'Confirmed Diagnosis' : 'Suspected / Self-Reported'})`,
        subtitle: c.diagnosed_by ? `Diagnosed by ${c.diagnosed_by}` : undefined,
        description: c.notes || c.current_treatment,
        badge: c.status.replace('_', ' '),
        badgeColor: c.status === 'clinically_diagnosed' ? 'bg-[#572D43] text-white' : 'bg-[#D9A7A4]/30 text-[#572D43]',
        isConfirmedClinically: c.status === 'clinically_diagnosed'
      });
    });

    // Flare-ups
    flareUps.forEach(f => {
      list.push({
        id: `flare-${f.id}`,
        category: 'flareup',
        date: f.start_time.split('T')[0],
        title: `${f.condition_name} Flare-Up (Pain ${f.severity}/10)`,
        subtitle: f.is_ongoing ? 'Active Acute Episode' : 'Resolved Episode',
        description: f.symptoms.join(', ') + (f.medications_taken ? ` • Meds: ${f.medications_taken}` : ''),
        severity: f.severity,
        badge: `Severity ${f.severity}/10`,
        badgeColor: f.severity >= 7 ? 'bg-rose-100 text-rose-800' : 'bg-[#914E61]/20 text-[#572D43]'
      });
    });

    // Medications
    medications.forEach(m => {
      list.push({
        id: `med-${m.id}`,
        category: 'medication',
        date: m.start_date || m.created_at.split('T')[0],
        title: `${m.name} ${m.dosage ? `(${m.dosage})` : ''}`,
        subtitle: `${m.treatment_type === 'procedure' ? 'Procedure' : 'Medication'} • ${m.frequency || ''}`,
        description: m.reason ? `Reason: ${m.reason}` : m.notes,
        badge: m.is_active ? 'Active' : 'Completed',
        badgeColor: m.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F4E8E0] text-[#777078]'
      });
    });

    // Medical Records / Tests
    medicalRecords.forEach(r => {
      list.push({
        id: `test-${r.id}`,
        category: 'test',
        date: r.record_date,
        title: r.title,
        subtitle: r.facility_or_provider ? `Facility: ${r.facility_or_provider}` : undefined,
        description: r.key_findings,
        badge: r.category.replace('_', ' '),
        badgeColor: 'bg-[#914E61] text-white',
        isConfirmedClinically: r.is_confirmed_by_clinician
      });
    });

    // Symptoms
    symptoms.slice(0, 30).forEach(s => {
      list.push({
        id: `symp-${s.id}`,
        category: 'symptom',
        date: s.created_at.split('T')[0],
        title: `${s.type} (Severity ${s.severity}/5)`,
        description: s.notes,
        badge: `Severity ${s.severity}/5`,
        badgeColor: 'bg-[#FFF9F3] text-[#572D43] border border-[#D9A7A4]'
      });
    });

    // Appointments
    appointments.forEach(a => {
      list.push({
        id: `appt-${a.id}`,
        category: 'appointment',
        date: a.date.split('T')[0],
        title: `Consultation: ${a.title}`,
        description: a.description,
        badge: 'Care Visit',
        badgeColor: 'bg-[#F4E8E0] text-[#572D43]'
      });
    });

    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [conditions, flareUps, medications, medicalRecords, symptoms, appointments]);

  const filteredTimeline = useMemo(() => {
    return timelineItems.filter(item => {
      if (activeCategory === 'conditions' && item.category !== 'condition') return false;
      if (activeCategory === 'symptoms' && item.category !== 'symptom') return false;
      if (activeCategory === 'flareups' && item.category !== 'flareup') return false;
      if (activeCategory === 'medications' && item.category !== 'medication') return false;
      if (activeCategory === 'appointments' && item.category !== 'appointment') return false;
      if (activeCategory === 'tests' && item.category !== 'test') return false;

      if (selectedConditionFilter !== 'all') {
        const text = `${item.title} ${item.description || ''} ${item.subtitle || ''}`.toLowerCase();
        if (!text.includes(selectedConditionFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [timelineItems, activeCategory, selectedConditionFilter]);

  // Consultation Summary Text Builder
  const consultationSummaryText = useMemo(() => {
    const confirmed = conditions.filter(c => c.status === 'clinically_diagnosed');
    const suspected = conditions.filter(c => c.status !== 'clinically_diagnosed');
    const activeMeds = medications.filter(m => m.is_active);
    const recentFlares = flareUps.slice(0, 5);

    let text = `MAMA ROOT — PATIENT HEALTH SUMMARY FOR CONSULTATION\n`;
    text += `Patient: ${userName}\nDate Generated: ${new Date().toLocaleDateString()}\n`;
    text += `--------------------------------------------------------\n\n`;

    text += `1. CLINICALLY CONFIRMED DIAGNOSES:\n`;
    if (confirmed.length === 0) {
      text += `None recorded by clinician.\n`;
    } else {
      confirmed.forEach(c => {
        text += `• ${c.name} (Diagnosed by: ${c.diagnosed_by || 'Not specified'}, Date: ${c.date_noticed || 'N/A'})\n  Treatment: ${c.current_treatment || 'None'}\n`;
      });
    }
    text += `\n`;

    text += `2. PATIENT-REPORTED & SUSPECTED CONDITIONS:\n`;
    if (suspected.length === 0) {
      text += `None reported.\n`;
    } else {
      suspected.forEach(c => {
        text += `• ${c.name} [${c.status.toUpperCase()}] — Associated symptoms: ${c.associated_symptoms?.join(', ') || 'N/A'}\n`;
      });
    }
    text += `\n`;

    text += `3. ACTIVE MEDICATIONS & THERAPIES:\n`;
    if (activeMeds.length === 0) {
      text += `No active medications reported.\n`;
    } else {
      activeMeds.forEach(m => {
        text += `• ${m.name} ${m.dosage ? `(${m.dosage})` : ''} - ${m.frequency || ''} (For: ${m.reason || 'General'})\n`;
      });
    }
    text += `\n`;

    text += `4. RECENT FLARE-UPS & ACUTE EPISODES:\n`;
    if (recentFlares.length === 0) {
      text += `No acute flare-ups logged recently.\n`;
    } else {
      recentFlares.forEach(f => {
        text += `• ${f.condition_name} on ${f.start_time.split('T')[0]} (Pain: ${f.severity}/10) - Symptoms: ${f.symptoms.join(', ')}\n`;
      });
    }
    text += `\n`;

    text += `5. RECENT DIAGNOSTIC TESTS & ULTRASOUNDS:\n`;
    medicalRecords.slice(0, 3).forEach(r => {
      text += `• ${r.title} (${r.record_date}): ${r.key_findings || 'See uploaded record'}\n`;
    });
    text += `\n`;

    text += `--------------------------------------------------------\n`;
    text += `DISCLAIMER: This report is compiled directly from the patient's personal Mama Root records to facilitate doctor-patient dialogue. It is an informational summary and does not constitute an independent clinical diagnosis.`;

    return text;
  }, [conditions, medications, flareUps, medicalRecords, userName]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(consultationSummaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  const getCategoryIcon = (cat: UnifiedTimelineItem['category']) => {
    switch (cat) {
      case 'condition': return <Heart className="w-4 h-4 text-[#572D43]" />;
      case 'flareup': return <Flame className="w-4 h-4 text-[#914E61]" />;
      case 'medication': return <Pill className="w-4 h-4 text-emerald-700" />;
      case 'test': return <FileText className="w-4 h-4 text-[#572D43]" />;
      case 'appointment': return <Calendar className="w-4 h-4 text-[#914E61]" />;
      case 'symptom':
      default: return <Activity className="w-4 h-4 text-[#777078]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4E8E0] text-[#572D43] flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[#914E61]" />
              Longitudinal Health Journey
            </span>
            <span className="text-xs text-[#777078]">
              {timelineItems.length} total chronological milestones
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            My Health Timeline & Consultation Summary
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            A comprehensive, filterable health timeline uniting your diagnoses, symptoms, flare-ups, procedures, and appointments. Easily compile a doctor-ready summary.
          </p>
        </div>

        <button
          onClick={() => setShowSummaryModal(true)}
          className="btn-berry py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Doctor Summary</span>
        </button>
      </div>

      {/* Red-Flag Urgent Care Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3 leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-950 font-bold block mb-0.5">
            When to Seek Immediate Medical Evaluation:
          </strong>
          <span>
            If you experience sudden, severe unilateral pelvic pain, fainting or lightheadedness, high fever with pelvic tenderness, or bleeding that soaks through two or more maxi pads per hour for two consecutive hours, seek urgent emergency clinical care immediately.
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Milestones' },
            { id: 'conditions', label: 'Conditions' },
            { id: 'flareups', label: 'Flare-Ups' },
            { id: 'medications', label: 'Medications' },
            { id: 'tests', label: 'Diagnostic Tests' },
            { id: 'symptoms', label: 'Symptoms' },
            { id: 'appointments', label: 'Care Visits' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                activeCategory === c.id
                  ? 'bg-[#572D43] text-white'
                  : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Condition Filter */}
        {conditions.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#777078]">Filter Condition:</span>
            <select
              value={selectedConditionFilter}
              onChange={(e) => setSelectedConditionFilter(e.target.value)}
              className="p-1.5 rounded-lg bg-white border border-[#572D43]/15 text-xs text-[#572D43] font-semibold"
            >
              <option value="all">All Conditions</option>
              {conditions.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline Stream */}
      {filteredTimeline.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#572D43]/10 space-y-3">
          <History className="w-10 h-10 text-[#D9A7A4] mx-auto" />
          <h3 className="text-base font-bold text-[#572D43]">No timeline milestones found</h3>
          <p className="text-xs text-[#777078] max-w-md mx-auto">
            Log your conditions, symptoms, meals, or medications to build your complete health narrative.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9A7A4]/50">
          {filteredTimeline.map(item => (
            <div key={item.id} className="relative group">
              {/* Dot on line */}
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#914E61] flex items-center justify-center shadow-2xs group-hover:scale-110 transition-transform">
                {getCategoryIcon(item.category)}
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#572D43]/10 hover:border-[#914E61]/40 transition-all shadow-xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-[#914E61] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.date}
                    </span>
                    <h4 className="text-base font-bold text-[#572D43] mt-0.5">
                      {item.title}
                    </h4>
                    {item.subtitle && (
                      <p className="text-xs text-[#777078]">
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize self-start ${item.badgeColor || 'bg-[#F4E8E0] text-[#572D43]'}`}>
                      {item.badge}
                    </span>
                  )}
                </div>

                {item.description && (
                  <p className="text-xs text-[#302B2D] leading-relaxed pt-1">
                    {item.description}
                  </p>
                )}

                {item.isConfirmedClinically !== undefined && (
                  <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold">
                    {item.isConfirmedClinically ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Clinician-Verified Entry
                      </span>
                    ) : (
                      <span className="text-[#914E61] flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Patient-Reported Observation
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Consultation Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#914E61]" />
                <div>
                  <h3 className="text-xl font-bold font-display text-[#572D43]">
                    Healthcare Consultation Summary
                  </h3>
                  <p className="text-xs text-[#777078]">
                    Clinical overview clearly distinguishing confirmed diagnoses from patient logs.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSummaryModal(false)}
                className="p-2 rounded-full text-[#777078] hover:bg-[#F4E8E0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formatted Preview Box */}
            <div className="p-5 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 font-mono text-xs text-[#302B2D] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto custom-scrollbar select-text">
              {consultationSummaryText}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#F4E8E0]">
              <span className="text-[11px] text-[#777078]">
                Ready to print, download, or copy to your doctor portal
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopySummary}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#572D43]/20 bg-white hover:bg-[#F4E8E0] text-xs font-semibold text-[#572D43] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-[#914E61]" /> : <Copy className="w-4 h-4 text-[#777078]" />}
                  <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                </button>

                <button
                  onClick={handlePrintSummary}
                  className="flex-1 sm:flex-none btn-berry py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default TimelineAndSummarySection;
