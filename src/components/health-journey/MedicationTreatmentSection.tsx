import React, { useState } from 'react';
import { 
  Pill, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  Bell, 
  BellOff, 
  Stethoscope, 
  ShieldAlert, 
  X,
  Share2,
  Syringe,
  Activity
} from 'lucide-react';
import { MedicationRecord, healthJourneyService } from '../../lib/healthJourneyService';

interface MedicationTreatmentSectionProps {
  userId: string;
  medications: MedicationRecord[];
  onRefresh: () => void;
}

export function MedicationTreatmentSection({
  userId,
  medications,
  onRefresh
}: MedicationTreatmentSectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'medication' | 'procedure'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicationRecord | null>(null);

  // Form State
  const [treatmentType, setTreatmentType] = useState<'medication' | 'procedure'>('medication');
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [prescribedBy, setPrescribedBy] = useState('');
  const [reason, setReason] = useState('');
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [notes, setNotes] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = (type: 'medication' | 'procedure' = 'medication') => {
    setEditingMed(null);
    setTreatmentType(type);
    setName('');
    setDosage('');
    setFrequency('Once daily');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsActive(true);
    setPrescribedBy('');
    setReason('');
    setRemindersEnabled(false);
    setNotes('');
    setIsShared(true);
    setShowAddModal(true);
  };

  const openEditModal = (med: MedicationRecord) => {
    setEditingMed(med);
    setTreatmentType(med.treatment_type);
    setName(med.name);
    setDosage(med.dosage || '');
    setFrequency(med.frequency || '');
    setStartDate(med.start_date || '');
    setEndDate(med.end_date || '');
    setIsActive(med.is_active);
    setPrescribedBy(med.prescribed_by || '');
    setReason(med.reason || '');
    setRemindersEnabled(med.reminders_enabled);
    setNotes(med.notes || '');
    setIsShared(med.is_shared_with_doctor);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingMed) {
        await healthJourneyService.updateMedication(
          editingMed.id,
          {
            name: name.trim(),
            dosage: dosage.trim() || undefined,
            frequency: frequency.trim() || undefined,
            start_date: startDate || undefined,
            end_date: endDate || undefined,
            is_active: isActive,
            prescribed_by: prescribedBy.trim() || undefined,
            reason: reason.trim() || undefined,
            reminders_enabled: remindersEnabled,
            notes: notes.trim() || undefined,
            treatment_type: treatmentType,
            is_shared_with_doctor: isShared
          },
          userId
        );
      } else {
        await healthJourneyService.addMedication({
          user_id: userId,
          name: name.trim(),
          dosage: dosage.trim() || undefined,
          frequency: frequency.trim() || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          is_active: isActive,
          prescribed_by: prescribedBy.trim() || undefined,
          reason: reason.trim() || undefined,
          reminders_enabled: remindersEnabled,
          reminder_times: [],
          notes: notes.trim() || undefined,
          treatment_type: treatmentType,
          is_shared_with_doctor: isShared
        });
      }

      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to save medication:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, medName: string) => {
    if (!window.confirm(`Delete "${medName}" record?`)) return;
    await healthJourneyService.deleteMedication(id, userId);
    onRefresh();
  };

  const filtered = medications.filter(m => {
    if (filterType === 'all') return true;
    return m.treatment_type === filterType;
  });

  const activeMeds = filtered.filter(m => m.is_active);
  const pastMeds = filtered.filter(m => !m.is_active);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4E8E0] text-[#572D43] flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5 text-[#914E61]" />
              Treatment History
            </span>
            <span className="text-xs text-[#777078]">
              {activeMeds.length} active prescriptions & therapies
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            Medications, Therapies & Procedures
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            Maintain an accurate, updated list of current medications, dosages, prescribing clinicians, and past surgical or therapeutic procedures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openAddModal('medication')}
            className="btn-berry py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
          >
            <Pill className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
          <button
            onClick={() => openAddModal('procedure')}
            className="px-4 py-3 rounded-xl bg-[#F4E8E0] hover:bg-[#D9A7A4]/50 text-xs font-semibold text-[#572D43] flex items-center gap-2 shrink-0 cursor-pointer transition-colors"
          >
            <Syringe className="w-4 h-4 text-[#914E61]" />
            <span>Add Procedure</span>
          </button>
        </div>
      </div>

      {/* Medical Safety Disclaimer */}
      <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 text-xs text-[#777078] flex items-start gap-3 leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-[#914E61] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#572D43]">Prescription Guidance:</strong> Mama Root is a personal tracking tool. It does not prescribe medicines, alter dosages, or recommend cessation of treatments. Always consult your prescribing doctor or pharmacist before making any changes to your medication schedule.
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {[
          { id: 'all', label: 'All Treatments' },
          { id: 'medication', label: 'Medications & Hormones' },
          { id: 'procedure', label: 'Surgeries & Procedures' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              filterType === t.id
                ? 'bg-[#572D43] text-white'
                : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Records Lists: Active vs Completed */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 space-y-3">
          <Pill className="w-10 h-10 text-[#D9A7A4] mx-auto" />
          <h3 className="text-base font-bold text-[#572D43]">No treatment records found</h3>
          <p className="text-xs text-[#777078] max-w-md mx-auto">
            Log your current pain relief, hormone therapies, supplements, or past surgeries to bring a clear summary to consultations.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active section */}
          {activeMeds.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#572D43] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Prescriptions & Current Therapies ({activeMeds.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeMeds.map(med => (
                  <div
                    key={med.id}
                    className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-base font-bold text-[#572D43]">
                            {med.name}
                          </h4>
                          {med.dosage && (
                            <p className="text-xs font-semibold text-[#914E61] mt-0.5">
                              {med.dosage} {med.frequency ? `• ${med.frequency}` : ''}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      </div>

                      {med.reason && (
                        <p className="text-xs text-[#777078] mb-1">
                          <strong className="text-[#572D43]">Target / Reason:</strong> {med.reason}
                        </p>
                      )}

                      {med.prescribed_by && (
                        <p className="text-xs text-[#777078] mb-1 flex items-center gap-1">
                          <Stethoscope className="w-3.5 h-3.5 text-[#914E61]" />
                          <span>Prescriber: {med.prescribed_by}</span>
                        </p>
                      )}

                      {med.start_date && (
                        <p className="text-[11px] text-[#777078]">
                          Started: {med.start_date}
                        </p>
                      )}

                      {med.notes && (
                        <p className="text-xs text-[#777078] italic mt-2">
                          "{med.notes}"
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {med.reminders_enabled ? (
                          <span className="text-[11px] text-[#914E61] font-semibold flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5" /> Reminders On
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#777078]">Reminders Off</span>
                        )}
                        {med.is_shared_with_doctor && (
                          <span className="text-[11px] text-[#572D43] font-medium flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-[#914E61]" /> Shared
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(med)}
                          className="p-1.5 rounded-lg text-[#777078] hover:text-[#572D43] hover:bg-[#F4E8E0] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(med.id, med.name)}
                          className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past / Discontinued section */}
          {pastMeds.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#777078] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-stone-400" />
                Completed & Past Treatments ({pastMeds.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastMeds.map(med => (
                  <div
                    key={med.id}
                    className="bg-[#FFF9F3] rounded-3xl p-6 border border-[#F4E8E0] opacity-80 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="text-base font-bold text-[#572D43]">
                            {med.name}
                          </h4>
                          {med.dosage && (
                            <p className="text-xs text-[#777078] mt-0.5">
                              {med.dosage}
                            </p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F4E8E0] text-[#777078]">
                          Completed / Ended
                        </span>
                      </div>

                      {med.end_date && (
                        <p className="text-[11px] text-[#777078]">
                          Ended on: {med.end_date}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#F4E8E0] flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(med)}
                        className="p-1.5 rounded-lg text-[#777078] hover:text-[#572D43] cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(med.id, med.name)}
                        className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#914E61]" />
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  {editingMed ? 'Update Treatment Record' : 'Record Medication or Procedure'}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Record Type *</label>
                  <select
                    value={treatmentType}
                    onChange={(e) => setTreatmentType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs font-semibold"
                  >
                    <option value="medication">Prescription / Medication / Supplement</option>
                    <option value="procedure">Clinical Procedure / Surgery / Therapy</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    {treatmentType === 'medication' ? 'Medication Name *' : 'Procedure / Therapy Name *'}
                  </label>
                  <input
                    type="text"
                    placeholder={treatmentType === 'medication' ? 'e.g. Dienogest, Tranexamic Acid...' : 'e.g. Diagnostic Laparoscopy, Pelvic Floor PT...'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    required
                  />
                </div>
              </div>

              {treatmentType === 'medication' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#572D43] mb-1">Dosage (As Entered / Prescribed)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2mg, 500mg, 1 tablet"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#572D43] mb-1">Frequency</label>
                    <input
                      type="text"
                      placeholder="e.g. Once daily at bedtime, As needed for severe cramps"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#572D43]">Current Status</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="accent-[#914E61]"
                      />
                      <span className="text-[11px] text-[#572D43] font-semibold">Currently Active</span>
                    </label>
                  </div>
                  {!isActive && (
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="End Date"
                      className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Prescribing Doctor / Clinic
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Adams, MediClinic"
                    value={prescribedBy}
                    onChange={(e) => setPrescribedBy(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Reason / Condition Addressed
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Endometriosis pain management, cycle regulation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>
              </div>

              {/* Reminders Toggle (Explicit User Opt-in) */}
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#572D43] block">Enable Dose Reminders</span>
                  <span className="text-[11px] text-[#777078]">
                    Only enabled when you explicitly request schedule alerts.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={remindersEnabled}
                  onChange={(e) => setRemindersEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#914E61] cursor-pointer"
                />
              </div>

              {/* Share With Doctor */}
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#572D43] block">Share with Healthcare Provider</span>
                  <span className="text-[11px] text-[#777078]">
                    Includes this medication in clinical consultation summaries.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 accent-[#914E61] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Personal Experience & Tolerance Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Side effects, how effectively it reduces symptoms, food timing..."
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
                  {submitting ? 'Saving...' : editingMed ? 'Update Treatment' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default MedicationTreatmentSection;
