import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Heart, 
  Clock, 
  Plus, 
  FileText, 
  Trash2, 
  ExternalLink, 
  AlertCircle, 
  Check, 
  Loader2, 
  X,
  UploadCloud,
  FileCheck2,
  FileSpreadsheet,
  Link as LinkIcon,
  Activity,
  Droplet,
  Stethoscope,
  CalendarDays,
  Baby,
  Bookmark
} from 'lucide-react';
import { 
  supabase, 
  HealthEvent, 
  HealthDocument, 
  Symptom, 
  PeriodLog, 
  Appointment, 
  DoctorNote 
} from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { RootsDivider, EmptyStateHeading, LeafSprigHeader } from '../../components/RootsMotif';

const DOCUMENT_TYPES = [
  'Scan',
  'Blood test',
  'Discharge summary',
  'Prescription',
  'Other'
] as const;

type DocumentType = typeof DOCUMENT_TYPES[number];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Event types supported by 'Add a diagnosis or note'
const EVENT_TYPE_OPTIONS = [
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'investigation', label: 'Test or scan result' },
  { id: 'procedure', label: 'Procedure or surgery' },
  { id: 'pregnancy', label: 'Pregnancy event' },
  { id: 'note', label: 'Note' },
] as const;

type EventTypeChoice = typeof EVENT_TYPE_OPTIONS[number]['id'];

// Status options for the form
const STATUS_OPTIONS = [
  { id: 'experienced', label: 'I experienced this' },
  { id: 'doctor_suspected', label: 'My doctor suspects this' },
  { id: 'confirmed', label: 'Confirmed by a doctor' },
] as const;

type StatusChoice = typeof STATUS_OPTIONS[number]['id'];

// Filter chip values
type FilterCategory = 'All' | 'Symptoms' | 'Periods' | 'Diagnoses' | 'Pregnancy';

interface TimelineItem {
  id: string;
  category: FilterCategory;
  rawType: 'symptom' | 'period' | 'health_event' | 'appointment' | 'doctor_note' | 'document';
  date: string; // ISO string or YYYY-MM-DD
  displayDate: string;
  title: string;
  subtitle?: string;
  details?: string;
  statusTag: 'Experienced' | 'Doctor suspected' | 'Confirmed';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  rawDoc?: HealthDocument;
}

export default function StoryPage() {
  const { profile } = useAuth();

  // Raw data from tables
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [events, setEvents] = useState<HealthEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active filter
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');

  // 'Add a diagnosis or note' Modal State
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const [eventType, setEventType] = useState<EventTypeChoice>('diagnosis');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eventDetails, setEventDetails] = useState<string>('');
  const [eventStatus, setEventStatus] = useState<StatusChoice>('experienced');
  const [savingEvent, setSavingEvent] = useState<boolean>(false);
  const [eventFormError, setEventFormError] = useState<string | null>(null);

  // 'Add Document' Modal State
  const [showAddDocModal, setShowAddDocModal] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docType, setDocType] = useState<DocumentType>('Scan');
  const [docDate, setDocDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [linkedEventId, setLinkedEventId] = useState<string>('');
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [docFormError, setDocFormError] = useState<string | null>(null);

  // Signed URL opening state
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Delete Document Confirmation
  const [docToDelete, setDocToDelete] = useState<HealthDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile?.id) {
      loadAllStoryData();
    }
  }, [profile?.id]);

  async function loadAllStoryData() {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const [
        symptomsRes,
        periodsRes,
        eventsRes,
        appointmentsRes,
        notesRes,
        docsRes
      ] = await Promise.all([
        supabase.from('symptoms').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('period_logs').select('*').eq('user_id', profile.id).order('start_date', { ascending: false }),
        supabase.from('health_events').select('*').eq('user_id', profile.id).order('event_date', { ascending: false }),
        supabase.from('appointments').select('*').eq('user_id', profile.id).order('date', { ascending: false }),
        supabase.from('doctor_notes').select('*').eq('patient_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('health_documents').select('*').eq('user_id', profile.id).order('document_date', { ascending: false }),
      ]);

      setSymptoms(symptomsRes.data || []);
      setPeriodLogs(periodsRes.data || []);
      setEvents(eventsRes.data || []);
      setAppointments(appointmentsRes.data || []);
      setDoctorNotes(notesRes.data || []);
      setDocuments(docsRes.data || []);
    } catch (err) {
      console.warn('Error loading story timeline data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Combine and sort all items into one single timeline, newest first
  const timelineItems = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [];

    // 1. Symptoms: Tag Experienced (Sand)
    symptoms.forEach((s) => {
      const severityText = s.severity !== undefined && s.severity !== null ? ` (Severity: ${s.severity}/10)` : '';
      list.push({
        id: `symptom-${s.id}`,
        category: 'Symptoms',
        rawType: 'symptom',
        date: s.created_at || '',
        displayDate: formatDate(s.created_at),
        title: `${s.type}${severityText}`,
        details: s.notes || undefined,
        statusTag: 'Experienced',
        icon: Activity,
        iconBg: 'bg-[#F7CCA5] text-[#3B1409]',
      });
    });

    // 2. Period logs: 'Period started' with date, Tag Experienced (Sand)
    periodLogs.forEach((p, idx) => {
      const detailsList: string[] = [];
      if (p.flow) detailsList.push(`Flow: ${p.flow}`);
      if (p.end_date) detailsList.push(`Ended: ${formatDate(p.end_date)}`);
      if (p.notes) detailsList.push(p.notes);

      list.push({
        id: `period-${p.id || idx}-${p.start_date}`,
        category: 'Periods',
        rawType: 'period',
        date: p.start_date || p.created_at || '',
        displayDate: formatDate(p.start_date),
        title: 'Period started',
        subtitle: p.flow ? `Flow: ${p.flow}` : undefined,
        details: detailsList.length > 0 ? detailsList.join(' • ') : undefined,
        statusTag: 'Experienced',
        icon: Droplet,
        iconBg: 'bg-[#F8DFC8] text-[#A9421B]',
      });
    });

    // 3. Health events: Diagnoses, investigations, procedures, pregnancy, notes
    events.forEach((e) => {
      let tag: 'Experienced' | 'Doctor suspected' | 'Confirmed' = 'Experienced';
      const statusLower = (e.status || '').toLowerCase();
      if (statusLower === 'confirmed') {
        tag = 'Confirmed';
      } else if (statusLower === 'doctor_suspected' || statusLower === 'suspected') {
        tag = 'Doctor suspected';
      } else {
        tag = 'Experienced';
      }

      let category: FilterCategory = 'All';
      if (e.event_type === 'diagnosis') {
        category = 'Diagnoses';
      } else if (e.event_type === 'pregnancy' || e.event_type === 'pregnancy_loss' || e.loss_type) {
        category = 'Pregnancy';
      }

      const eventDateStr = e.event_date || e.created_at || '';
      const subtitleStr = e.event_type 
        ? e.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : undefined;

      const detailsStr = typeof e.details === 'string' 
        ? e.details 
        : (e.notes || (e.details ? JSON.stringify(e.details) : undefined));

      list.push({
        id: `event-${e.id || e.title}`,
        category,
        rawType: 'health_event',
        date: eventDateStr,
        displayDate: formatDate(eventDateStr),
        title: e.title,
        subtitle: subtitleStr,
        details: detailsStr,
        statusTag: tag,
        icon: e.event_type === 'diagnosis' ? Stethoscope : Heart,
        iconBg: tag === 'Confirmed' ? 'bg-[#E3F1DA] text-[#2F6B3F]' : 'bg-[#F7CCA5] text-[#3B1409]',
      });
    });

    // 4. Appointments: Tag Experienced (Sand)
    appointments.forEach((a) => {
      const apptDate = a.date || a.created_at || '';
      list.push({
        id: `appt-${a.id}`,
        category: 'All',
        rawType: 'appointment',
        date: apptDate,
        displayDate: formatDate(apptDate),
        title: a.title,
        subtitle: a.doctor_name ? `With ${a.doctor_name}` : 'Healthcare appointment',
        details: a.description || undefined,
        statusTag: 'Experienced',
        icon: CalendarDays,
        iconBg: 'bg-[#F6E7D8] text-[#3B1409]',
      });
    });

    // 5. Doctor notes: Tag Experienced (Sand)
    doctorNotes.forEach((n) => {
      const noteDate = n.created_at || '';
      list.push({
        id: `note-${n.id}`,
        category: 'All',
        rawType: 'doctor_note',
        date: noteDate,
        displayDate: formatDate(noteDate),
        title: n.doctor_name ? `Doctor note: ${n.doctor_name}` : 'Doctor note',
        subtitle: n.is_pinned ? 'Pinned medical note' : undefined,
        details: n.content,
        statusTag: 'Experienced',
        icon: FileText,
        iconBg: 'bg-[#F7CCA5] text-[#3B1409]',
      });
    });

    // 6. Documents: Tag Experienced (Sand)
    documents.forEach((d) => {
      const docDateStr = d.document_date || d.created_at || '';
      list.push({
        id: `doc-${d.id || d.file_path}`,
        category: 'All',
        rawType: 'document',
        date: docDateStr,
        displayDate: formatDate(docDateStr),
        title: d.title,
        subtitle: `${d.document_type} file`,
        details: undefined,
        statusTag: 'Experienced',
        icon: FileCheck2,
        iconBg: 'bg-[#F6E7D8] text-[#3B1409]',
        rawDoc: d,
      });
    });

    // Sort newest first
    list.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [symptoms, periodLogs, events, appointments, doctorNotes, documents]);

  // Filtered items based on filter chips
  const filteredTimeline = useMemo(() => {
    if (activeFilter === 'All') return timelineItems;
    if (activeFilter === 'Symptoms') return timelineItems.filter(i => i.category === 'Symptoms');
    if (activeFilter === 'Periods') return timelineItems.filter(i => i.category === 'Periods');
    if (activeFilter === 'Diagnoses') return timelineItems.filter(i => i.category === 'Diagnoses');
    if (activeFilter === 'Pregnancy') return timelineItems.filter(i => i.category === 'Pregnancy');
    return timelineItems;
  }, [timelineItems, activeFilter]);

  // Helper for status tag styling
  // Tags: Experienced is Sand, Doctor suspected is Peach, Confirmed is Forest Green with white text
  const renderStatusTag = (tag: 'Experienced' | 'Doctor suspected' | 'Confirmed') => {
    if (tag === 'Confirmed') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#2F6B3F] text-white border border-[#2F6B3F]">
          <Check className="w-2.5 h-2.5" />
          <span>Confirmed</span>
        </span>
      );
    }
    if (tag === 'Doctor suspected') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F7CCA5] text-[#3B1409] border border-[#E0A77A]">
          <span>Doctor suspected</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#F6E7D8] text-[#3B1409] border border-[#EAD5C0]">
        <span>Experienced</span>
      </span>
    );
  };

  // =========================================================================
  // SUBMIT: 'Add a diagnosis or note'
  // =========================================================================
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!eventTitle.trim()) {
      setEventFormError('Please provide a title for this entry.');
      return;
    }

    try {
      setSavingEvent(true);
      setEventFormError(null);

      // Saves to health_events. Never change a status automatically.
      const payload: Partial<HealthEvent> = {
        user_id: profile.id,
        event_type: eventType,
        title: eventTitle.trim(),
        details: eventDetails.trim() || null,
        status: eventStatus,
        event_date: eventDate,
      };

      const { error } = await supabase.from('health_events').insert([payload]);
      if (error) throw error;

      // Reset and close
      setShowEventModal(false);
      setEventTitle('');
      setEventDetails('');
      setEventType('diagnosis');
      setEventStatus('experienced');
      setEventDate(new Date().toISOString().split('T')[0]);

      setActionNotice({ type: 'success', text: 'Diagnosis or note saved to your health story.' });
      setTimeout(() => setActionNotice(null), 3500);

      await loadAllStoryData();
    } catch (err: any) {
      console.error('Error saving health event:', err);
      setEventFormError(err.message || 'Could not save this entry. Please try again.');
    } finally {
      setSavingEvent(false);
    }
  };

  // =========================================================================
  // SUBMIT: 'Add a document'
  // =========================================================================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocFormError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setDocFormError('Files must be 10 MB or less. Please select a smaller file.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validMimes.includes(file.type)) {
      setDocFormError('Please select a JPG, PNG image or PDF document.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (!docTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setDocTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!selectedFile) {
      setDocFormError('Please select a file to upload.');
      return;
    }

    if (!docTitle.trim()) {
      setDocFormError('Please give this document a title.');
      return;
    }

    setUploadingDoc(true);
    setDocFormError(null);
    setUploadProgressText('Uploading document to private storage...');

    const safeOriginalName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const randomUuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filePath = `${profile.id}/${randomUuid}-${safeOriginalName}`;

    let uploadedSuccessfully = false;

    try {
      const { error: uploadError } = await supabase.storage
        .from('health-docs')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Storage upload failed. Please try again.');
      }

      uploadedSuccessfully = true;
      setUploadProgressText('Saving document record...');

      const docPayload: Partial<HealthDocument> = {
        user_id: profile.id,
        title: docTitle.trim(),
        document_type: docType,
        document_date: docDate,
        file_path: filePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        health_event_id: linkedEventId || null
      };

      const { error: insertError } = await supabase
        .from('health_documents')
        .insert([docPayload]);

      if (insertError) {
        if (uploadedSuccessfully) {
          try {
            await supabase.storage.from('health-docs').remove([filePath]);
          } catch (delErr) {
            console.error('Failed to clean up uploaded file after insert error:', delErr);
          }
        }
        throw new Error(insertError.message || 'Could not save document record.');
      }

      setShowAddDocModal(false);
      setSelectedFile(null);
      setDocTitle('');
      setActionNotice({ type: 'success', text: 'Document securely uploaded to your vault.' });
      setTimeout(() => setActionNotice(null), 3500);

      await loadAllStoryData();
    } catch (err: any) {
      console.error('Document upload error:', err);
      setDocFormError(err.message || 'Something went wrong while uploading your document.');
    } finally {
      setUploadingDoc(false);
      setUploadProgressText('');
    }
  };

  // Open signed URL that expires in 5 minutes
  const handleViewDocument = async (doc: HealthDocument) => {
    if (!doc.file_path) return;
    try {
      setOpeningDocId(doc.id || doc.file_path);
      const { data, error } = await supabase.storage
        .from('health-docs')
        .createSignedUrl(doc.file_path, 300);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || 'Could not generate secure view link.');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Error opening document:', err);
      setActionNotice({ type: 'error', text: err.message || 'Could not open document securely.' });
    } finally {
      setOpeningDocId(null);
    }
  };

  // Delete document confirmation
  const confirmDeleteDocument = async () => {
    if (!docToDelete || !profile?.id) return;
    try {
      setDeletingDoc(true);
      if (docToDelete.file_path) {
        try {
          await supabase.storage.from('health-docs').remove([docToDelete.file_path]);
        } catch (storageErr) {
          console.warn('Storage deletion notice:', storageErr);
        }
      }

      if (docToDelete.id) {
        await supabase
          .from('health_documents')
          .delete()
          .eq('id', docToDelete.id)
          .eq('user_id', profile.id);
      }

      setDocToDelete(null);
      setActionNotice({ type: 'success', text: 'Document deleted.' });
      setTimeout(() => setActionNotice(null), 3500);
      await loadAllStoryData();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setActionNotice({ type: 'error', text: err.message || 'Could not delete document.' });
    } finally {
      setDeletingDoc(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Header: title 'My health story', 'One timeline that follows you.' */}
      <div className="relative overflow-hidden pt-1 pr-12">
        <LeafSprigHeader className="w-20 h-20 -top-3 -right-3" />
        <h1 className="text-2xl font-bold font-serif text-[#3B1409]">
          My health story
        </h1>
        <p className="text-sm text-[#6B4A3A] mt-1 font-sans">
          One timeline that follows you.
        </p>

        {/* Action Buttons: Add a diagnosis or note & Add a document */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <button
            type="button"
            onClick={() => {
              setEventFormError(null);
              setShowEventModal(true);
            }}
            className="btn-primary !min-h-[44px] !w-auto !py-2 !px-4 text-xs inline-flex items-center gap-1.5 shadow-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Add a diagnosis or note</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              setDocTitle('');
              setDocType('Scan');
              setDocDate(new Date().toISOString().split('T')[0]);
              setLinkedEventId('');
              setDocFormError(null);
              setShowAddDocModal(true);
            }}
            className="btn-secondary !min-h-[44px] !w-auto !py-2 !px-3.5 text-xs inline-flex items-center gap-1.5 shadow-xs font-semibold"
          >
            <UploadCloud className="w-4 h-4 text-[#A9421B]" />
            <span>Add a document</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={cn(
          "p-3 rounded-2xl text-xs font-medium border flex items-center justify-between animate-in fade-in",
          actionNotice.type === 'success' 
            ? "bg-[#E3F1DA] border-[#BFDDAE] text-[#1F4A2B]" 
            : "bg-[#F8DFC8] border-[#E0A77A] text-[#7A2E10]"
        )}>
          <span>{actionNotice.text}</span>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)}
            className="p-1 hover:opacity-75 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Chips: All, Symptoms, Periods, Diagnoses, Pregnancy */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 pt-1">
        {(['All', 'Symptoms', 'Periods', 'Diagnoses', 'Pregnancy'] as FilterCategory[]).map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all focus-ring whitespace-nowrap flex items-center gap-1.5 border shrink-0",
                isSelected
                  ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                  : "bg-white text-[#3B1409] border-[#EAD5C0] hover:bg-[#F6E7D8]/60"
              )}
            >
              {isSelected && <Check className="w-3 h-3 text-white" />}
              <span>{filter}</span>
            </button>
          );
        })}
      </div>

      {/* Unified Timeline Container */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 bg-white border border-[#EAD5C0] rounded-3xl flex items-center justify-center text-xs text-[#6B4A3A]">
            <Loader2 className="w-4 h-4 text-[#A9421B] animate-spin mr-2" />
            Loading your health story...
          </div>
        ) : filteredTimeline.length === 0 ? (
          /* Friendly Empty State */
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-8 text-center space-y-3.5 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#E3F1DA] border border-[#BFDDAE] text-[#2F6B3F] flex items-center justify-center mx-auto">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                {activeFilter === 'All' 
                  ? 'Your timeline is ready' 
                  : `No ${activeFilter.toLowerCase()} recorded yet`}
              </h3>
              <p className="text-xs text-[#6B4A3A] max-w-sm mx-auto mt-1 leading-relaxed">
                {activeFilter === 'All'
                  ? 'Your symptoms, period starts, doctor notes, diagnoses, and medical records will appear here chronologically, newest first.'
                  : `There are currently no items under "${activeFilter}". You can record entries using the button below or change your filter.`}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEventFormError(null);
                  if (activeFilter === 'Diagnoses') setEventType('diagnosis');
                  else if (activeFilter === 'Pregnancy') setEventType('pregnancy');
                  setShowEventModal(true);
                }}
                className="btn-primary !min-h-[44px] !w-auto !py-2 !px-4 text-xs inline-flex items-center gap-1.5 shadow-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                <span>Add a diagnosis or note</span>
              </button>
            </div>
            <div className="pt-2">
              <RootsDivider />
            </div>
          </div>
        ) : (
          /* Timeline List */
          <div className="space-y-3">
            {filteredTimeline.map((item) => {
              const Icon = item.icon;
              const isOpeningDoc = openingDocId === (item.rawDoc?.id || item.rawDoc?.file_path);

              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#EAD5C0] rounded-3xl p-4.5 shadow-xs flex items-start gap-3.5 hover:border-[#BFDDAE] transition-all"
                >
                  {/* Icon circle */}
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold shadow-xs",
                    item.iconBg
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold font-serif text-[#3B1409] leading-snug">
                          {item.title}
                        </h2>
                        {item.subtitle && (
                          <p className="text-[11px] text-[#6B4A3A] font-medium">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Status Tag: Experienced (Sand), Doctor suspected (Peach), Confirmed (Forest Green) */}
                      <div className="shrink-0">
                        {renderStatusTag(item.statusTag)}
                      </div>
                    </div>

                    {/* Date */}
                    {item.date && (
                      <div className="flex items-center gap-1 text-[11px] text-[#6B4A3A]">
                        <Clock className="w-3 h-3 text-[#A9421B]" />
                        <span>{item.displayDate}</span>
                      </div>
                    )}

                    {/* Details or Notes */}
                    {item.details && (
                      <p className="text-xs text-[#3B1409] bg-[#FFF9F2] p-2.5 rounded-2xl border border-[#EAD5C0] leading-relaxed whitespace-pre-wrap">
                        {item.details}
                      </p>
                    )}

                    {/* Document View & Delete controls */}
                    {item.rawDoc && (
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          disabled={isOpeningDoc}
                          onClick={() => item.rawDoc && handleViewDocument(item.rawDoc)}
                          className="font-semibold text-[#A9421B] hover:text-[#833518] inline-flex items-center gap-1"
                        >
                          {isOpeningDoc ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Opening securely...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Open document</span>
                              <span className="text-[10px] text-[#6B4A3A] font-normal">(5-min private access)</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDocToDelete(item.rawDoc!)}
                          className="p-1 text-[#6B4A3A] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info Box */}
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-4.5 space-y-1.5 text-xs text-[#6B4A3A]">
        <h3 className="font-bold text-[#3B1409] flex items-center gap-1.5 font-serif text-sm">
          <Sparkles className="w-4 h-4 text-[#2F6B3F]" />
          <span>Patient-Owned Health Timeline</span>
        </h3>
        <p className="leading-relaxed">
          Your story brings together everything you experience and discuss with clinicians into one private, continuous journey. Status labels clearly distinguish what was doctor confirmed versus what was suspected or self-experienced.
        </p>
      </div>

      <div className="pt-2">
        <RootsDivider />
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ADD A DIAGNOSIS OR NOTE */}
      {/* ========================================================================= */}
      {showEventModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-lg p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#E3F1DA] border border-[#BFDDAE] flex items-center justify-center text-[#2F6B3F]">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold font-serif text-[#3B1409]">
                  Add a diagnosis or note
                </h2>
              </div>
              <button
                type="button"
                disabled={savingEvent}
                onClick={() => setShowEventModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error banner */}
            {eventFormError && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{eventFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="space-y-4">
              
              {/* Type chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block uppercase tracking-wider">
                  Type of record *
                </label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPE_OPTIONS.map((opt) => {
                    const isSelected = eventType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEventType(opt.id)}
                        className={cn(
                          "min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus-ring flex items-center gap-1.5",
                          isSelected
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Endometriosis, Pelvic ultrasound, Laparoscopy..."
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* Date picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* Details textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Details & clinical notes
                </label>
                <textarea
                  rows={3}
                  value={eventDetails}
                  onChange={(e) => setEventDetails(e.target.value)}
                  placeholder="Doctor findings, prescribed treatment, observations, or how you felt..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409] resize-none"
                />
              </div>

              {/* Status chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block uppercase tracking-wider">
                  Status *
                </label>
                <p className="text-[11px] text-[#6B4A3A]">
                  Never changed automatically. Clearly specifies confirmation level.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = eventStatus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setEventStatus(opt.id)}
                        className={cn(
                          "min-h-[44px] px-3 py-2 rounded-2xl border text-xs font-semibold text-center transition-all focus-ring flex items-center justify-center gap-1.5",
                          isSelected
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                        <span className="leading-tight">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingEvent || !eventTitle.trim()}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {savingEvent && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{savingEvent ? 'Saving entry...' : 'Save to health story'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD A DOCUMENT */}
      {/* ========================================================================= */}
      {showAddDocModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-lg p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
            
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409]">
                  <UploadCloud className="w-4 h-4 text-[#3B1409]" />
                </div>
                <h2 className="text-base font-bold font-serif text-[#3B1409]">
                  Add a document
                </h2>
              </div>
              <button
                type="button"
                disabled={uploadingDoc}
                onClick={() => setShowAddDocModal(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {docFormError && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{docFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveDocument} className="space-y-4">
              {/* File picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Select File * (Camera, Image, or PDF up to 10 MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleFileChange}
                  className="w-full text-xs text-[#3B1409] file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#A9421B] file:text-white hover:file:bg-[#833518] file:cursor-pointer cursor-pointer bg-white border border-[#EAD5C0] rounded-xl p-2 focus-ring"
                />
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Document title *
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Pelvic Ultrasound Scan, Blood panel..."
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* Document Type Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Document Type *
                </label>
                <div className="flex flex-wrap gap-2">
                  {DOCUMENT_TYPES.map((type) => {
                    const isSelected = docType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDocType(type)}
                        className={cn(
                          "min-h-[40px] px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all focus-ring flex items-center gap-1",
                          isSelected
                            ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-xs"
                            : "bg-white text-[#3B1409] border-[#EAD5C0] hover:border-[#A9421B]"
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        <span>{type}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#3B1409] block">
                  Document Date *
                </label>
                <input
                  type="date"
                  required
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              {/* Optional Link to a Health Event */}
              {events.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#3B1409] block">
                    Link to a health story event (optional)
                  </label>
                  <select
                    value={linkedEventId}
                    onChange={(e) => setLinkedEventId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#EAD5C0] rounded-xl outline-none focus-ring text-[#3B1409]"
                  >
                    <option value="">None (Stand-alone document)</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.event_type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={uploadingDoc || !selectedFile || !docTitle.trim()}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {uploadingDoc && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{uploadingDoc ? (uploadProgressText || 'Uploading...') : 'Save to private storage'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE DOCUMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-sm p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold font-serif text-[#3B1409]">
                Delete document?
              </h3>
              <p className="text-xs text-[#6B4A3A]">
                Are you sure you want to permanently remove <span className="font-bold text-[#3B1409]">"{docToDelete.title}"</span>? Both the private file and its record will be deleted.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={deletingDoc}
                onClick={() => setDocToDelete(null)}
                className="btn-secondary !min-h-[44px] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingDoc}
                onClick={confirmDeleteDocument}
                className="btn-primary !min-h-[44px] text-xs font-bold !bg-red-700 hover:!bg-red-800"
              >
                {deletingDoc ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
