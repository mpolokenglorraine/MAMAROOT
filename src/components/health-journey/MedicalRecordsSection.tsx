import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Search, 
  Share2, 
  Download, 
  ExternalLink, 
  Paperclip, 
  Stethoscope,
  X,
  ShieldCheck
} from 'lucide-react';
import { MedicalRecord, MedicalRecordCategory, healthJourneyService } from '../../lib/healthJourneyService';

interface MedicalRecordsSectionProps {
  userId: string;
  records: MedicalRecord[];
  onRefresh: () => void;
}

export function MedicalRecordsSection({
  userId,
  records,
  onRefresh
}: MedicalRecordsSectionProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MedicalRecordCategory>('ultrasound');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [facility, setFacility] = useState('');
  const [keyFindings, setKeyFindings] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isConfirmedByClinician, setIsConfirmedByClinician] = useState(true);
  const [isShared, setIsShared] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await healthJourneyService.addMedicalRecord({
        user_id: userId,
        title: title.trim(),
        category,
        record_date: recordDate,
        facility_or_provider: facility.trim() || undefined,
        key_findings: keyFindings.trim() || undefined,
        attachment_url: attachmentUrl.trim() || undefined,
        is_confirmed_by_clinician: isConfirmedByClinician,
        is_shared_with_doctor: isShared,
        notes: notes.trim() || undefined
      });

      setShowAddModal(false);
      setTitle('');
      setFacility('');
      setKeyFindings('');
      setAttachmentUrl('');
      setNotes('');
      onRefresh();
    } catch (err) {
      console.error('Failed to add medical record:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, recTitle: string) => {
    if (!window.confirm(`Delete record "${recTitle}"?`)) return;
    await healthJourneyService.deleteMedicalRecord(id, userId);
    onRefresh();
  };

  const filtered = records.filter(r => {
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
      (r.key_findings && r.key_findings.toLowerCase().includes(search.toLowerCase())) ||
      (r.facility_or_provider && r.facility_or_provider.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: MedicalRecordCategory) => {
    switch (cat) {
      case 'ultrasound': return 'Pelvic / Abdominal Ultrasound';
      case 'blood_test': return 'Blood Test / Lab Panel';
      case 'pathology': return 'Pathology & Biopsy';
      case 'pap_smear': return 'Pap Smear & Cytology';
      case 'surgical_report': return 'Surgical / Laparoscopy Report';
      case 'clinical_summary': return 'Doctor Consultation Summary';
      case 'other':
      default: return 'Medical Record';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4E8E0] text-[#572D43] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#914E61]" />
              Diagnostic Archive
            </span>
            <span className="text-xs text-[#777078]">
              {records.length} clinical records cataloged
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            Medical Records & Test Results
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            Organize ultrasounds, blood tests, pathology reports, and surgical summaries. Clearly separates clinician-confirmed hospital records from personal patient notes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-berry py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Upload / Log Record</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#777078] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by title, findings, hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#572D43]/15 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'ultrasound', label: 'Ultrasounds' },
            { id: 'blood_test', label: 'Blood Tests' },
            { id: 'pathology', label: 'Pathology' },
            { id: 'surgical_report', label: 'Surgical Reports' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterCategory(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                filterCategory === opt.id
                  ? 'bg-[#572D43] text-white'
                  : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Records Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 space-y-3">
          <FileText className="w-10 h-10 text-[#D9A7A4] mx-auto" />
          <h3 className="text-base font-bold text-[#572D43]">No medical records found</h3>
          <p className="text-xs text-[#777078] max-w-md mx-auto">
            Upload ultrasound findings, blood test numbers (e.g. CA-125, iron, thyroid), or biopsy results so you have them readily available during visits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(rec => (
            <div
              key={rec.id}
              className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-base font-bold text-[#572D43]">
                      {rec.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#914E61]">
                      {getCategoryLabel(rec.category)}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    rec.is_confirmed_by_clinician 
                      ? 'bg-[#572D43] text-white border-[#572D43]' 
                      : 'bg-[#F4E8E0] text-[#572D43] border-[#D9A7A4]/50'
                  }`}>
                    {rec.is_confirmed_by_clinician ? 'Clinician Verified' : 'Patient Uploaded'}
                  </span>
                </div>

                <div className="text-xs text-[#777078] space-y-1 mb-3">
                  <p className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#914E61]" />
                    <span>Date: <strong>{rec.record_date}</strong></span>
                  </p>
                  {rec.facility_or_provider && (
                    <p className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-[#914E61]" />
                      <span>Facility/Clinician: {rec.facility_or_provider}</span>
                    </p>
                  )}
                </div>

                {rec.key_findings && (
                  <div className="p-3 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#572D43] block mb-1">
                      Key Diagnostic Findings:
                    </span>
                    <p className="text-xs text-[#302B2D] leading-relaxed">
                      {rec.key_findings}
                    </p>
                  </div>
                )}

                {rec.notes && (
                  <p className="text-xs text-[#777078] italic mt-2">
                    "{rec.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {rec.is_shared_with_doctor && (
                    <span className="text-[11px] text-[#914E61] font-semibold flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> Shared with Doctor
                    </span>
                  )}
                  {rec.attachment_url && (
                    <a
                      href={rec.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#572D43] font-semibold flex items-center gap-1 hover:underline"
                    >
                      <Paperclip className="w-3 h-3 text-[#914E61]" /> File Attached
                    </a>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(rec.id, rec.title)}
                  className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#914E61]" />
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  Add Diagnostic & Medical Record
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full text-[#777078] hover:bg-[#F4E8E0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Record Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pelvic Ultrasound - Uterine Lining & Ovaries, CA-125 Serum, Pap Smear"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicalRecordCategory)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs font-semibold"
                  >
                    <option value="ultrasound">Pelvic / Abdominal Ultrasound</option>
                    <option value="blood_test">Blood Test / Hormone Panel</option>
                    <option value="pathology">Pathology / Histology Report</option>
                    <option value="pap_smear">Pap Smear & HPV Co-Test</option>
                    <option value="surgical_report">Surgical / Laparoscopy Summary</option>
                    <option value="clinical_summary">Doctor Clinical Summary</option>
                    <option value="other">Other Diagnostic Record</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Record Date *</label>
                  <input
                    type="date"
                    value={recordDate}
                    onChange={(e) => setRecordDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Issuing Facility or Healthcare Professional
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cape Town Radiologists, Lancet Laboratories, Dr. Meyer"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Key Findings & Results Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Endometrial stripe 8mm. Left ovary contains 3.2cm simple cyst. No free fluid in pouch of Douglas."
                  value={keyFindings}
                  onChange={(e) => setKeyFindings(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Document Link / File URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://... (cloud link or patient portal export)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#572D43] block">Clinician Verified</span>
                    <span className="text-[10px] text-[#777078]">Official hospital/lab report</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isConfirmedByClinician}
                    onChange={(e) => setIsConfirmedByClinician(e.target.checked)}
                    className="w-4 h-4 accent-[#914E61] cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#572D43] block">Share with Doctor</span>
                    <span className="text-[10px] text-[#777078]">Include in shared consultations</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="w-4 h-4 accent-[#914E61] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Personal Health Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Questions for your follow-up appointment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#572D43]/20 text-[#777078] hover:text-[#572D43] font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-berry py-2.5 px-5 text-xs font-semibold cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Medical Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MedicalRecordsSection;
