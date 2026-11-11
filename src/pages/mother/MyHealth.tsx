import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Calendar, 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  MapPin, 
  Pin, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  X,
  Heart,
  CalendarCheck,
  Stethoscope,
  Mic,
  Trash2,
  Sparkles,
  ShieldCheck,
  Flame,
  Utensils,
  Lock,
  Pill,
  History,
  LayoutGrid,
  TrendingUp,
  Share2
} from 'lucide-react';
import { supabase, Symptom, Appointment, DoctorNote } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate } from '../../lib/utils';
import { ConsultationTranscriber } from '../../components/ConsultationTranscriber';
import { HealthTrendChart } from '../../components/HealthTrendChart';

// Health Journey Modular Components
import { ConditionsSection } from '../../components/health-journey/ConditionsSection';
import { FlareUpSection } from '../../components/health-journey/FlareUpSection';
import { FoodWellnessDiarySection } from '../../components/health-journey/FoodWellnessDiarySection';
import { SexualHealthSection } from '../../components/health-journey/SexualHealthSection';
import { MedicationTreatmentSection } from '../../components/health-journey/MedicationTreatmentSection';
import { MedicalRecordsSection } from '../../components/health-journey/MedicalRecordsSection';
import { TimelineAndSummarySection } from '../../components/health-journey/TimelineAndSummarySection';
import { 
  HealthCondition, 
  FlareUp, 
  FoodDiaryEntry, 
  MedicationRecord, 
  SexualHealthRecord, 
  MedicalRecord, 
  healthJourneyService 
} from '../../lib/healthJourneyService';

export type JourneyTab = 
  | 'overview'
  | 'conditions' 
  | 'symptoms' 
  | 'flareups'
  | 'food_diary' 
  | 'sexual_health' 
  | 'medications' 
  | 'medical_records' 
  | 'timeline'
  | 'appointments' 
  | 'notes';

const COMMON_SYMPTOMS = [
  'Pelvic Cramping',
  'Fatigue / Exhaustion',
  'Bloating ("Endo Belly")',
  'Lower Back Ache',
  'Pain with Intercourse',
  'Painful Bowel Movement',
  'Nausea & Queasiness',
  'Headache / Migraine',
  'Hot Flashes / Sweats',
  'Breast Tenderness',
  'Heavy / Clotted Flow',
  'Mood Sensitivity'
];

export default function MyHealth() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as JourneyTab) || 'overview';
  const [activeTab, setActiveTab] = useState<JourneyTab>(initialTab);

  // Synchronize tab with query param
  const handleTabChange = (tab: JourneyTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // ================= DATA STATES =================
  // Existing Supabase states
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomsLoading, setSymptomsLoading] = useState(true);
  const [showAddSymptom, setShowAddSymptom] = useState(false);
  const [symptomType, setSymptomType] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState(3);
  const [symptomNotes, setSymptomNotes] = useState('');
  const [symptomSubmitting, setSymptomSubmitting] = useState(false);
  const [symptomSuccess, setSymptomSuccess] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [showAddAppointment, setShowAddAppointment] = useState(false);
  const [apptDoctorName, setApptDoctorName] = useState('');
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState('');
  const [apptDescription, setApptDescription] = useState('');
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptSuccess, setApptSuccess] = useState(false);

  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesSearch, setNotesSearch] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteDoctorName, setNoteDoctorName] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteIsPinned, setNoteIsPinned] = useState(false);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [showMotherTranscriber, setShowMotherTranscriber] = useState(false);
  const [personalVisitNotes, setPersonalVisitNotes] = useState<Array<{ id: string; date: string; content: string }>>(() => {
    try {
      const saved = localStorage.getItem('mamaroot_personal_consultation_transcripts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // New My Health Journey States
  const [conditions, setConditions] = useState<HealthCondition[]>([]);
  const [flareUps, setFlareUps] = useState<FlareUp[]>([]);
  const [foodEntries, setFoodEntries] = useState<FoodDiaryEntry[]>([]);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);
  const [sexualRecords, setSexualRecords] = useState<SexualHealthRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(true);
  const [targetTrackingCondition, setTargetTrackingCondition] = useState<string | undefined>(undefined);

  // Fetch all user health records
  const loadAllJourneyData = async () => {
    if (!profile?.id) return;
    setJourneyLoading(true);
    try {
      const [condData, flareData, foodData, medData, sexData, medRecData] = await Promise.all([
        healthJourneyService.getConditions(profile.id),
        healthJourneyService.getFlareUps(profile.id),
        healthJourneyService.getFoodDiary(profile.id),
        healthJourneyService.getMedications(profile.id),
        healthJourneyService.getSexualHealthRecords(profile.id),
        healthJourneyService.getMedicalRecords(profile.id)
      ]);
      setConditions(condData);
      setFlareUps(flareData);
      setFoodEntries(foodData);
      setMedications(medData);
      setSexualRecords(sexData);
      setMedicalRecords(medRecData);
    } catch (err) {
      console.warn('Error loading health journey records:', err);
    } finally {
      setJourneyLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchSymptoms();
      fetchAppointments();
      fetchNotes();
      loadAllJourneyData();
    }
  }, [profile?.id]);

  async function fetchSymptoms() {
    setSymptomsLoading(true);
    try {
      const { data, error } = await supabase
        .from('symptoms')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSymptoms(data || []);
    } catch (err) {
      console.error('Error fetching symptoms:', err);
    } finally {
      setSymptomsLoading(false);
    }
  }

  async function fetchAppointments() {
    setAppointmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', profile?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setAppointmentsLoading(false);
    }
  }

  async function fetchNotes() {
    setNotesLoading(true);
    try {
      const { data, error } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_id', profile?.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }

  // Symptom submission
  async function handleAddSymptom(e: React.FormEvent) {
    e.preventDefault();
    if (!symptomType.trim()) return;
    setSymptomSubmitting(true);
    try {
      const { error } = await supabase.from('symptoms').insert({
        user_id: profile?.id,
        type: symptomType.trim(),
        severity: symptomSeverity,
        notes: symptomNotes.trim() || null,
      });

      if (error) throw error;

      setSymptomType('');
      setSymptomSeverity(3);
      setSymptomNotes('');
      setShowAddSymptom(false);
      setSymptomSuccess(true);
      setTimeout(() => setSymptomSuccess(false), 3000);
      fetchSymptoms();
    } catch (err) {
      console.error('Error saving symptom:', err);
    } finally {
      setSymptomSubmitting(false);
    }
  }

  // Appointment submission
  async function handleAddAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!apptTitle.trim() || !apptDate) return;
    setApptSubmitting(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        user_id: profile?.id,
        doctor_name: apptDoctorName.trim() || null,
        title: apptTitle.trim(),
        date: apptDate,
        description: apptDescription.trim() || null,
      });

      if (error) throw error;

      setApptDoctorName('');
      setApptTitle('');
      setApptDate('');
      setApptDescription('');
      setShowAddAppointment(false);
      setApptSuccess(true);
      setTimeout(() => setApptSuccess(false), 3000);
      fetchAppointments();
    } catch (err) {
      console.error('Error saving appointment:', err);
    } finally {
      setApptSubmitting(false);
    }
  }

  // Doctor note submission by patient ("What my doctor said")
  async function handleAddDoctorNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteContent.trim() || !profile?.id) return;
    setNoteSubmitting(true);
    try {
      const { error } = await supabase.from('doctor_notes').insert({
        patient_id: profile.id,
        doctor_name: noteDoctorName.trim() || null,
        content: noteContent.trim(),
        is_pinned: noteIsPinned,
      });

      if (error) throw error;

      setNoteDoctorName('');
      setNoteContent('');
      setNoteIsPinned(false);
      setShowAddNote(false);
      fetchNotes();
    } catch (err) {
      console.error('Error saving doctor note:', err);
    } finally {
      setNoteSubmitting(false);
    }
  }

  // Pin toggle for doctor note
  async function handleTogglePin(noteId: string, currentPinned: boolean) {
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  }

  // Delete doctor note
  async function handleDeleteDoctorNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  const handleSavePersonalTranscript = (transcriptText: string) => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      content: transcriptText
    };
    const updated = [newEntry, ...personalVisitNotes];
    setPersonalVisitNotes(updated);
    try {
      localStorage.setItem('mamaroot_personal_consultation_transcripts', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
    setShowMotherTranscriber(false);
  };

  const handleDeletePersonalTranscript = (id: string) => {
    const updated = personalVisitNotes.filter(item => item.id !== id);
    setPersonalVisitNotes(updated);
    try {
      localStorage.setItem('mamaroot_personal_consultation_transcripts', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }
  };

  const activeFlaresCount = flareUps.filter(f => f.is_ongoing).length;
  const activeMedsCount = medications.filter(m => m.is_active).length;

  const filteredNotes = notes.filter(n => {
    if (!notesSearch.trim()) return true;
    const query = notesSearch.toLowerCase();
    return (
      (n.content && n.content.toLowerCase().includes(query)) ||
      (n.doctor_name && n.doctor_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-500 font-sans">
      {/* Page Header */}
      <header className="pb-6 border-b border-[#F4E8E0]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4E8E0] text-[#572D43] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#914E61]" />
              <span>Modern Heritage Women's Health Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-[#572D43]">
              My Health Journey
            </h1>
            <p className="text-sm text-[#777078] mt-1 max-w-2xl leading-relaxed">
              Your personalized women's health space. Track diagnosed and suspected conditions, flare-ups, food rhythms, medications, sexual health, and doctor consultation summaries.
            </p>
          </div>

          {/* Quick status counters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-white border border-[#572D43]/15 text-xs font-semibold text-[#572D43] shadow-2xs">
              {conditions.length} Conditions
            </span>
            {activeFlaresCount > 0 && (
              <span className="px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-pulse">
                {activeFlaresCount} Active Flare-Up
              </span>
            )}
            <span className="px-3 py-1 rounded-xl bg-white border border-[#572D43]/15 text-xs font-semibold text-[#572D43] shadow-2xs">
              {activeMedsCount} Active Meds
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN NAVIGATION TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-3 mt-6 border-b border-[#302B2D]/10 overflow-x-auto pb-px custom-scrollbar">
          <button
            onClick={() => handleTabChange('overview')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'overview' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Journey Hub</span>
            {activeTab === 'overview' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('conditions')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'conditions' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Heart className="w-4 h-4 text-[#914E61]" />
            <span>1. My Conditions</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#F4E8E0] text-[#572D43]">
              {conditions.length}
            </span>
            {activeTab === 'conditions' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('symptoms')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'symptoms' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. Symptom Tracker</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#F4E8E0] text-[#572D43]">
              {symptoms.length}
            </span>
            {activeTab === 'symptoms' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('flareups')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'flareups' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Flame className="w-4 h-4 text-[#914E61]" />
            <span>Flare-Ups</span>
            {activeFlaresCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
            {activeTab === 'flareups' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('food_diary')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'food_diary' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>3. Food & Wellness</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#F4E8E0] text-[#572D43]">
              {foodEntries.length}
            </span>
            {activeTab === 'food_diary' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('sexual_health')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'sexual_health' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Lock className="w-4 h-4 text-[#914E61]" />
            <span>4. Sexual Health</span>
            {activeTab === 'sexual_health' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('medications')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'medications' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Pill className="w-4 h-4" />
            <span>5. Medications</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#F4E8E0] text-[#572D43]">
              {medications.length}
            </span>
            {activeTab === 'medications' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('medical_records')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'medical_records' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>6. Medical Records</span>
            <span className="text-xs px-1.5 py-0.2 rounded-full bg-[#F4E8E0] text-[#572D43]">
              {medicalRecords.length}
            </span>
            {activeTab === 'medical_records' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('timeline')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'timeline' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <History className="w-4 h-4 text-[#914E61]" />
            <span>7. Health Timeline</span>
            {activeTab === 'timeline' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('appointments')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'appointments' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Care Visits ({appointments.length})</span>
            {activeTab === 'appointments' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('notes')}
            className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors relative flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'notes' ? 'text-[#572D43]' : 'text-[#777078] hover:text-[#302B2D]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Doctor Notes ({notes.length})</span>
            {activeTab === 'notes' && (
              <motion.div layoutId="health-tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#572D43]" />
            )}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* TAB CONTENT AREAS */}
      {/* ========================================================================= */}

      {/* 0. JOURNEY HUB / OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Welcome Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#914E61]">
                Welcome, {profile?.full_name || 'Sister'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#572D43]">
                Your Health Journey at a Glance
              </h2>
              <p className="text-xs sm:text-sm text-[#777078] max-w-xl leading-relaxed">
                Mama Root supports you with and without confirmed medical diagnoses across endometriosis, fibroids, PCOS, menstrual health, and reproductive transitions.
              </p>
            </div>

            <button
              onClick={() => handleTabChange('timeline')}
              className="btn-berry py-3 px-5 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Consultation Summary</span>
            </button>
          </div>

          {/* 7 Core Area Navigation Cards */}
          <div>
            <h3 className="text-base font-bold text-[#572D43] mb-4">
              Explore Your Health Journey Modules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1: Conditions */}
              <div 
                onClick={() => handleTabChange('conditions')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <Heart className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    1. My Conditions
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Record confirmed and suspected conditions like endometriosis, PCOS, fibroids, and cervical changes.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>{conditions.length} recorded</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Symptom Tracker & Flare-Ups */}
              <div 
                onClick={() => handleTabChange('symptoms')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <Activity className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    2. Symptom Tracker & Rhythm Chart
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Track cycle variations, pain levels (0-10), fatigue, and 3-month Recharts wellness rhythm trends.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>{symptoms.length} logs recorded</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Food & Wellness Diary */}
              <div 
                onClick={() => handleTabChange('food_diary')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <Utensils className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    3. Food & Wellness Diary
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Daily food intake, meal times, post-meal bloating, suspected triggers, and safe pattern exploration.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>{foodEntries.length} meals logged</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 4: Sexual Health & Protection */}
              <div 
                onClick={() => handleTabChange('sexual_health')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <Lock className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    4. Sexual Health & Protection
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Private records for contraception methods, STI screening history, HPV vaccination, and Pap smear results.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>Strictly confidential</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 5: Medication & Treatment */}
              <div 
                onClick={() => handleTabChange('medications')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <Pill className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    5. Medication & Treatment
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Active prescriptions, dosages, prescribing clinicians, surgical history (laparoscopy), and optional reminders.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>{activeMedsCount} active</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 6: Medical Records */}
              <div 
                onClick={() => handleTabChange('medical_records')}
                className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61] transition-all shadow-xs flex flex-col justify-between cursor-pointer group space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] group-hover:bg-[#F4E8E0] flex items-center justify-center text-[#572D43] mb-3 transition-colors">
                    <FileText className="w-6 h-6 text-[#914E61]" />
                  </div>
                  <h4 className="text-lg font-bold text-[#572D43] group-hover:text-[#914E61] transition-colors">
                    6. Diagnostic Medical Records
                  </h4>
                  <p className="text-xs text-[#777078] mt-1 leading-relaxed">
                    Ultrasound reports, pathology tests, CA-125 numbers, and clinician-verified laboratory results.
                  </p>
                </div>
                <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between text-xs font-semibold text-[#572D43]">
                  <span>{medicalRecords.length} records</span>
                  <ChevronRight className="w-4 h-4 text-[#914E61] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 7: Health Timeline */}
              <div 
                onClick={() => handleTabChange('timeline')}
                className="sm:col-span-2 lg:col-span-3 bg-linear-to-r from-[#FFF9F3] to-[#F4E8E0] rounded-3xl p-6 border border-[#D9A7A4]/60 hover:border-[#914E61] transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#572D43] text-white flex items-center justify-center shrink-0">
                    <History className="w-6 h-6 text-[#D9A7A4]" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[#572D43]">
                      7. My Health Timeline & Doctor Summary Report
                    </h4>
                    <p className="text-xs text-[#777078] mt-0.5">
                      Filterable chronological story uniting all your milestones with one-click consultation PDF/summary export.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#914E61] shrink-0">
                  <span>View Timeline & Export</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Trend Preview */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#572D43]">
                  Recent Health Rhythms & Symptom Tracking
                </h3>
                <p className="text-xs text-[#777078]">
                  3-Month physiological rhythm trends and symptom logging
                </p>
              </div>
              <button
                onClick={() => handleTabChange('symptoms')}
                className="text-xs font-bold text-[#914E61] hover:underline flex items-center gap-1"
              >
                <span>View Full Chart</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <HealthTrendChart symptoms={symptoms} />
          </div>
        </div>
      )}

      {/* 1. MY CONDITIONS */}
      {activeTab === 'conditions' && (
        <ConditionsSection
          userId={profile?.id || ''}
          conditions={conditions}
          onRefresh={loadAllJourneyData}
          onSelectConditionForTracking={(condName) => {
            setTargetTrackingCondition(condName);
            setActiveTab('flareups');
          }}
        />
      )}

      {/* 2. SYMPTOM TRACKER */}
      {activeTab === 'symptoms' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#572D43]/10 shadow-xs">
            <div>
              <h2 className="text-xl font-display font-bold text-[#572D43]">
                Daily Symptom & Rhythm Tracking
              </h2>
              <p className="text-xs text-[#777078] mt-0.5">
                Log physical and emotional sensations to track patterns across your cycle and health stages.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('flareups')}
                className="px-3.5 py-2.5 rounded-xl bg-[#F4E8E0] text-xs font-semibold text-[#572D43] flex items-center gap-1.5 hover:bg-[#D9A7A4]/50 transition-colors"
              >
                <Flame className="w-4 h-4 text-[#914E61]" />
                <span>Flare-Up Tracker</span>
              </button>
              <button
                onClick={() => setShowAddSymptom(!showAddSymptom)}
                className="btn-berry py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Log Today's Symptom</span>
              </button>
            </div>
          </div>

          {/* Add Symptom Form Modal / Drawer */}
          <AnimatePresence>
            {showAddSymptom && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card-soft rounded-3xl p-6 sm:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#572D43]">Log New Symptom</h3>
                      <p className="text-xs text-[#777078]">Record current body sensation and severity.</p>
                    </div>
                    <button 
                      onClick={() => setShowAddSymptom(false)}
                      className="text-[#777078] hover:text-[#572D43] p-1.5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddSymptom} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#572D43] mb-1">
                        Symptom Type *
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Pelvic Cramping, Lower Back Pain, Endo Belly..."
                        value={symptomType}
                        onChange={(e) => setSymptomType(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                        required
                      />

                      {/* Common Quick Pills */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {COMMON_SYMPTOMS.map((cs) => (
                          <button
                            key={cs}
                            type="button"
                            onClick={() => setSymptomType(cs)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-[#D9A7A4] hover:bg-[#F4E8E0] text-[#572D43] font-medium transition-colors cursor-pointer"
                          >
                            + {cs}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#572D43]">
                          Severity Level (1 to 5)
                        </label>
                        <span className="text-xs font-bold text-[#914E61]">
                          Level {symptomSeverity} / 5
                        </span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="5"
                        value={symptomSeverity}
                        onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                        className="w-full accent-[#914E61] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[#777078] mt-1 font-medium">
                        <span>1 (Gentle)</span>
                        <span>2 (Noticeable)</span>
                        <span>3 (Moderate)</span>
                        <span>4 (Intense)</span>
                        <span>5 (Severe)</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#572D43] mb-1">
                        Personal Notes (Optional)
                      </label>
                      <textarea 
                        rows={2}
                        placeholder="Context, time of day, what helped relieve it..."
                        value={symptomNotes}
                        onChange={(e) => setSymptomNotes(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddSymptom(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777078] hover:text-[#572D43]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={symptomSubmitting}
                        className="btn-berry py-2.5 px-5 text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        {symptomSubmitting ? 'Saving...' : 'Save Symptom'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recharts 3-Month Trend Chart */}
          <HealthTrendChart symptoms={symptoms} />

          {/* Logged Symptoms List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#572D43]">
              Recent Symptom Check-Ins ({symptoms.length})
            </h3>

            {symptoms.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#777078]">
                No check-ins logged yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {symptoms.map(s => (
                  <div key={s.id} className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-[#572D43]">{s.type}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4E8E0] text-[#572D43]">
                        Severity {s.severity}/5
                      </span>
                    </div>
                    <p className="text-[11px] text-[#777078]">
                      {new Date(s.created_at).toLocaleDateString()} at {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-[#302B2D] italic pt-1">
                        "{s.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FLARE-UPS TRACKER */}
      {activeTab === 'flareups' && (
        <FlareUpSection
          userId={profile?.id || ''}
          flareUps={flareUps}
          conditions={conditions}
          onRefresh={loadAllJourneyData}
          initialCondition={targetTrackingCondition}
        />
      )}

      {/* 3. FOOD & WELLNESS DIARY */}
      {activeTab === 'food_diary' && (
        <FoodWellnessDiarySection
          userId={profile?.id || ''}
          entries={foodEntries}
          onRefresh={loadAllJourneyData}
        />
      )}

      {/* 4. SEXUAL HEALTH & PROTECTION */}
      {activeTab === 'sexual_health' && (
        <SexualHealthSection
          userId={profile?.id || ''}
          records={sexualRecords}
          onRefresh={loadAllJourneyData}
        />
      )}

      {/* 5. MEDICATION & TREATMENT */}
      {activeTab === 'medications' && (
        <MedicationTreatmentSection
          userId={profile?.id || ''}
          medications={medications}
          onRefresh={loadAllJourneyData}
        />
      )}

      {/* 6. MEDICAL RECORDS */}
      {activeTab === 'medical_records' && (
        <MedicalRecordsSection
          userId={profile?.id || ''}
          records={medicalRecords}
          onRefresh={loadAllJourneyData}
        />
      )}

      {/* 7. MY HEALTH TIMELINE & SUMMARY */}
      {activeTab === 'timeline' && (
        <TimelineAndSummarySection
          conditions={conditions}
          flareUps={flareUps}
          medications={medications}
          medicalRecords={medicalRecords}
          symptoms={symptoms}
          appointments={appointments}
          userName={profile?.full_name || 'Patient'}
        />
      )}

      {/* APPOINTMENTS & CARE VISITS */}
      {activeTab === 'appointments' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#572D43]/10 shadow-xs">
            <div>
              <h2 className="text-xl font-display font-bold text-[#572D43]">
                Upcoming Consultations & Care Visits
              </h2>
              <p className="text-xs text-[#777078] mt-0.5">
                Keep track of prenatal, gynecological, screening, and specialist appointments.
              </p>
            </div>
            <button
              onClick={() => setShowAddAppointment(!showAddAppointment)}
              className="btn-berry py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Health Visit</span>
            </button>
          </div>

          {/* Add Appointment Drawer */}
          <AnimatePresence>
            {showAddAppointment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card-soft rounded-3xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#572D43]">Schedule Care Visit</h3>
                    <button onClick={() => setShowAddAppointment(false)} className="text-[#777078]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddAppointment} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">Appointment Title *</label>
                      <input
                        type="text"
                        placeholder="e.g. Ultrasound Scan, Routine Pap Smear, Preconception Visit"
                        value={apptTitle}
                        onChange={(e) => setApptTitle(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">Doctor or clinic name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Amina Bello, Victoria Island Women's Clinic"
                        value={apptDoctorName}
                        onChange={(e) => setApptDoctorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">Date & Time *</label>
                      <input
                        type="datetime-local"
                        value={apptDate}
                        onChange={(e) => setApptDate(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">Notes / Questions to Ask</label>
                      <textarea
                        rows={2}
                        placeholder="Key questions you want to discuss with your doctor..."
                        value={apptDescription}
                        onChange={(e) => setApptDescription(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D]"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddAppointment(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777078]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={apptSubmitting}
                        className="btn-berry py-2 px-4 text-xs font-semibold"
                      >
                        {apptSubmitting ? 'Saving...' : 'Save Visit'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Appointments List */}
          <div className="space-y-3">
            {appointments.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 text-xs text-[#777078]">
                No upcoming visits scheduled.
              </div>
            ) : (
              appointments.map(a => (
                <div key={a.id} className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[#572D43]">{a.title}</h4>
                    {a.doctor_name && (
                      <p className="text-xs font-semibold text-[#914E61] mt-0.5">
                        {a.doctor_name}
                      </p>
                    )}
                    <p className="text-xs text-[#777078] mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#914E61]" />
                      <span>{new Date(a.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </p>
                    {a.description && (
                      <p className="text-xs text-[#302B2D] mt-2 bg-[#FFF9F3] p-2.5 rounded-xl border border-[#F4E8E0]">
                        {a.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DOCTOR NOTES ("What my doctor said") */}
      {activeTab === 'notes' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#572D43]/10 shadow-xs">
            <div>
              <h2 className="text-xl font-display font-bold text-[#572D43]">
                What My Doctor Said
              </h2>
              <p className="text-xs text-[#777078] mt-0.5">
                Record and review what your doctor or clinic advised, prescription notes, and care instructions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="btn-berry py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Doctor Note</span>
              </button>
              <button
                onClick={() => setShowMotherTranscriber(!showMotherTranscriber)}
                className="py-2.5 px-3.5 rounded-2xl border border-[#914E61] text-[#914E61] hover:bg-[#F4E8E0] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Mic className="w-4 h-4" />
                <span>Transcribe Visit</span>
              </button>
            </div>
          </div>

          {/* Add Doctor Note Drawer */}
          <AnimatePresence>
            {showAddNote && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="card-soft rounded-3xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#572D43]">Add Consultation Note</h3>
                    <button onClick={() => setShowAddNote(false)} className="text-[#777078]">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAddDoctorNote} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">Doctor or Clinic Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Amina Bello, Victoria Island Women's Clinic"
                        value={noteDoctorName}
                        onChange={(e) => setNoteDoctorName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#572D43] mb-1">What My Doctor Said *</label>
                      <textarea
                        rows={4}
                        placeholder="Key advice, diagnosis details, medication instructions, and follow-up guidance..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        className="w-full p-3 rounded-xl bg-white border border-[#572D43]/20 text-xs text-[#302B2D] leading-relaxed"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="pinNote"
                        checked={noteIsPinned}
                        onChange={(e) => setNoteIsPinned(e.target.checked)}
                        className="rounded border-[#572D43]/30 text-[#914E61] focus:ring-0"
                      />
                      <label htmlFor="pinNote" className="font-semibold text-[#572D43] cursor-pointer">
                        Pin this note to the top for quick reference
                      </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddNote(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-[#777078]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={noteSubmitting || !noteContent.trim()}
                        className="btn-berry py-2 px-4 text-xs font-semibold disabled:opacity-50"
                      >
                        {noteSubmitting ? 'Saving Note...' : 'Save Note'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Transcriber Drawer */}
          <AnimatePresence>
            {showMotherTranscriber && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-3xl p-6 border border-[#914E61]/30 shadow-md">
                  <ConsultationTranscriber 
                    patientName={profile?.full_name || 'My Visit'}
                    role="mother"
                    onApplyTranscript={(transcript) => {
                      setNoteContent(transcript);
                      setShowAddNote(true);
                      handleSavePersonalTranscript(transcript);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Notes if multiple */}
          {notes.length > 2 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777078]" />
              <input
                type="text"
                placeholder="Search notes or doctors..."
                value={notesSearch}
                onChange={(e) => setNotesSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#572D43]/10 rounded-2xl text-xs outline-none text-[#302B2D]"
              />
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-4">
            {notesLoading ? (
              <div className="bg-white rounded-3xl p-8 text-center text-xs text-[#777078]">
                Loading your doctor notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 text-xs text-[#777078]">
                {notesSearch ? 'No notes match your search.' : 'No notes recorded yet. Click "Add Doctor Note" to record what your clinician advised.'}
              </div>
            ) : (
              filteredNotes.map(n => (
                <div key={n.id} className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#572D43]">
                        {n.doctor_name ? `Dr. / Clinic: ${n.doctor_name}` : 'Doctor Consultation Note'}
                      </h4>
                      <p className="text-[11px] text-[#777078]">
                        Recorded {formatDate(n.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePin(n.id, n.is_pinned)}
                        title={n.is_pinned ? 'Unpin note' : 'Pin note'}
                        className={`p-1.5 rounded-xl border transition-colors flex items-center gap-1 text-[11px] font-semibold ${
                          n.is_pinned
                            ? 'bg-[#F4E8E0] border-[#914E61] text-[#914E61]'
                            : 'border-[#572D43]/15 text-[#777078] hover:bg-[#F4E8E0]/40'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{n.is_pinned ? 'Pinned' : 'Pin'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDoctorNote(n.id)}
                        title="Delete note"
                        className="p-1.5 rounded-xl border border-transparent text-[#777078] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#302B2D] leading-relaxed whitespace-pre-wrap bg-[#FFF9F3] p-4 rounded-2xl border border-[#F4E8E0]">
                    {n.content}
                  </p>
                </div>
              ))
            )}

            {/* Personal Transcripts saved from in-person visit recorder */}
            {personalVisitNotes.map(pv => (
              <div key={pv.id} className="bg-white rounded-3xl p-6 border border-[#D9A7A4]/50 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#572D43] flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-[#914E61]" /> Personal Visit Audio Transcript • {new Date(pv.date).toLocaleDateString()}
                  </span>
                  <button onClick={() => handleDeletePersonalTranscript(pv.id)} className="text-[#777078] hover:text-rose-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-3 bg-[#FFF9F3] rounded-2xl text-xs text-[#302B2D] whitespace-pre-wrap">
                  {pv.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
