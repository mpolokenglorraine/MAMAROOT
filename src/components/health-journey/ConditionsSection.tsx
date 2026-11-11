import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  Activity, 
  Heart, 
  X,
  Share2,
  Stethoscope,
  Info
} from 'lucide-react';
import { 
  HealthCondition, 
  DiagnosisStatus, 
  SUGGESTED_CONDITIONS, 
  healthJourneyService 
} from '../../lib/healthJourneyService';

interface ConditionsSectionProps {
  userId: string;
  conditions: HealthCondition[];
  onRefresh: () => void;
  onSelectConditionForTracking?: (conditionName: string) => void;
}

export function ConditionsSection({ 
  userId, 
  conditions, 
  onRefresh,
  onSelectConditionForTracking
}: ConditionsSectionProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCondition, setEditingCondition] = useState<HealthCondition | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Endometriosis');
  const [status, setStatus] = useState<DiagnosisStatus>('suspected');
  const [dateNoticed, setDateNoticed] = useState('');
  const [diagnosedBy, setDiagnosedBy] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptomInput, setCustomSymptomInput] = useState('');
  const [currentTreatment, setCurrentTreatment] = useState('');
  const [medications, setMedications] = useState('');
  const [notes, setNotes] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const openAddModal = (preset?: typeof SUGGESTED_CONDITIONS[0]) => {
    setEditingCondition(null);
    if (preset) {
      setName(preset.name);
      setCategory(preset.category);
      setSelectedSymptoms(preset.typicalSymptoms.slice(0, 4));
    } else {
      setName('');
      setCategory('Other');
      setSelectedSymptoms([]);
    }
    setStatus('suspected');
    setDateNoticed(new Date().toISOString().split('T')[0]);
    setDiagnosedBy('');
    setCurrentTreatment('');
    setMedications('');
    setNotes('');
    setIsShared(false);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (condition: HealthCondition) => {
    setEditingCondition(condition);
    setName(condition.name);
    setCategory(condition.category || 'Other');
    setStatus(condition.status);
    setDateNoticed(condition.date_noticed || '');
    setDiagnosedBy(condition.diagnosed_by || '');
    setSelectedSymptoms(condition.associated_symptoms || []);
    setCurrentTreatment(condition.current_treatment || '');
    setMedications(condition.medications || '');
    setNotes(condition.notes || '');
    setIsShared(condition.is_shared_with_doctor);
    setErrorMsg('');
    setShowAddModal(true);
  };

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleAddCustomSymptom = () => {
    if (!customSymptomInput.trim()) return;
    if (!selectedSymptoms.includes(customSymptomInput.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptomInput.trim()]);
    }
    setCustomSymptomInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify the condition name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      if (editingCondition) {
        await healthJourneyService.updateCondition(
          editingCondition.id,
          {
            name: name.trim(),
            category,
            status,
            date_noticed: dateNoticed || undefined,
            diagnosed_by: diagnosedBy.trim() || undefined,
            associated_symptoms: selectedSymptoms,
            current_treatment: currentTreatment.trim() || undefined,
            medications: medications.trim() || undefined,
            notes: notes.trim() || undefined,
            is_shared_with_doctor: isShared
          },
          userId
        );
      } else {
        await healthJourneyService.addCondition({
          user_id: userId,
          name: name.trim(),
          category,
          status,
          date_noticed: dateNoticed || undefined,
          diagnosed_by: diagnosedBy.trim() || undefined,
          associated_symptoms: selectedSymptoms,
          current_treatment: currentTreatment.trim() || undefined,
          medications: medications.trim() || undefined,
          notes: notes.trim() || undefined,
          is_shared_with_doctor: isShared
        });
      }

      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save condition.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, condName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${condName}" from your conditions?`)) return;
    await healthJourneyService.deleteCondition(id, userId);
    onRefresh();
  };

  const filtered = conditions.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (st: DiagnosisStatus) => {
    switch (st) {
      case 'clinically_diagnosed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#572D43] text-white">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D9A7A4]" />
            Clinically Diagnosed
          </span>
        );
      case 'under_investigation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#914E61]/15 text-[#914E61]">
            <Activity className="w-3.5 h-3.5" />
            Under Investigation
          </span>
        );
      case 'suspected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#D9A7A4]/25 text-[#572D43]">
            <AlertCircle className="w-3.5 h-3.5 text-[#914E61]" />
            Suspected Condition
          </span>
        );
      case 'self_reported':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F4E8E0] text-[#572D43]">
            <Heart className="w-3.5 h-3.5 text-[#914E61]" />
            Self-Reported
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F4E8E0] text-[#572D43]">
              Personal Condition Space
            </span>
            <span className="text-xs text-[#777078]">
              {conditions.length} {conditions.length === 1 ? 'condition' : 'conditions'} recorded
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            My Health Conditions
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            Record confirmed diagnoses, suspected conditions, and unexplained patterns. Distinctly tracks physician-confirmed records from personal observations.
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="btn-berry py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Add Condition</span>
        </button>
      </div>

      {/* Suggested Quick Starters if few conditions recorded */}
      {conditions.length === 0 && (
        <div className="bg-[#FFF9F3] rounded-3xl p-6 border border-[#D9A7A4]/50">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#572D43]">
            <Info className="w-4 h-4 text-[#914E61]" />
            <span>Common Women's Health Conditions (Click to Quick-Add):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CONDITIONS.slice(0, 8).map(preset => (
              <button
                key={preset.name}
                onClick={() => openAddModal(preset)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#D9A7A4]/40 hover:border-[#914E61] hover:bg-[#F4E8E0] text-xs font-semibold text-[#572D43] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3 h-3 text-[#914E61]" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#777078] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search conditions or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#572D43]/15 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'clinically_diagnosed', label: 'Clinically Diagnosed' },
            { id: 'suspected', label: 'Suspected' },
            { id: 'under_investigation', label: 'Under Investigation' },
            { id: 'self_reported', label: 'Self-Reported' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setFilterStatus(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === opt.id 
                  ? 'bg-[#572D43] text-white' 
                  : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conditions Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#572D43]/10 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#F4E8E0] text-[#572D43] flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7 text-[#914E61]" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#572D43]">No conditions found</h3>
            <p className="text-xs text-[#777078] mt-1 leading-relaxed">
              {search || filterStatus !== 'all' 
                ? 'Try adjusting your search terms or filter.' 
                : 'Recording your conditions helps tailor symptom trackers, flare-up logs, and consultation notes.'}
            </p>
          </div>
          <button
            onClick={() => openAddModal()}
            className="btn-berry py-2.5 px-4 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Condition</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filtered.map(condition => (
            <div 
              key={condition.id}
              className="bg-white rounded-3xl p-6 border border-[#572D43]/10 hover:border-[#914E61]/40 transition-all shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#572D43] leading-snug">
                      {condition.name}
                    </h3>
                    <p className="text-[11px] font-medium text-[#777078] mt-0.5">
                      Category: {condition.category}
                    </p>
                  </div>
                  {getStatusBadge(condition.status)}
                </div>

                {condition.diagnosed_by && (
                  <div className="flex items-center gap-1.5 text-xs text-[#777078] mb-2">
                    <Stethoscope className="w-3.5 h-3.5 text-[#914E61]" />
                    <span>Clinician/Facility: <strong>{condition.diagnosed_by}</strong></span>
                  </div>
                )}

                {condition.date_noticed && (
                  <p className="text-xs text-[#777078] mb-3">
                    Diagnosed / First Noticed: <span className="font-semibold text-[#572D43]">{condition.date_noticed}</span>
                  </p>
                )}

                {condition.associated_symptoms && condition.associated_symptoms.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#777078]">
                      Tracked Symptoms:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {condition.associated_symptoms.map(s => (
                        <span 
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-[#FFF9F3] border border-[#D9A7A4]/50 text-[11px] font-medium text-[#572D43]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {condition.current_treatment && (
                  <p className="text-xs text-[#302B2D] bg-[#F4E8E0]/50 p-2.5 rounded-xl mb-2">
                    <strong className="text-[#572D43]">Treatment:</strong> {condition.current_treatment}
                  </p>
                )}

                {condition.notes && (
                  <p className="text-xs text-[#777078] italic line-clamp-2">
                    "{condition.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#F4E8E0] flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px]">
                  {condition.is_shared_with_doctor ? (
                    <span className="text-[#914E61] font-semibold flex items-center gap-1">
                      <Share2 className="w-3 h-3" /> Shared with Doctor
                    </span>
                  ) : (
                    <span className="text-[#777078]">Private</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {onSelectConditionForTracking && (
                    <button
                      onClick={() => onSelectConditionForTracking(condition.name)}
                      className="px-2.5 py-1 rounded-lg bg-[#F4E8E0] hover:bg-[#D9A7A4]/50 text-xs font-semibold text-[#572D43] flex items-center gap-1 cursor-pointer transition-colors"
                      title="Track symptoms for this condition"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#914E61]" />
                      <span>Track</span>
                    </button>
                  )}
                  <button
                    onClick={() => openEditModal(condition)}
                    className="p-1.5 rounded-lg text-[#777078] hover:text-[#572D43] hover:bg-[#F4E8E0] transition-colors cursor-pointer"
                    title="Edit condition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(condition.id, condition.name)}
                    className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete condition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Condition Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div>
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  {editingCondition ? 'Update Condition Record' : 'Record Health Condition'}
                </h3>
                <p className="text-xs text-[#777078]">
                  Keep accurate personal records to support your wellness and doctor visits.
                </p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-full text-[#777078] hover:bg-[#F4E8E0] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Condition Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Endometriosis, PCOS, Uterine Fibroids, Ovarian Cyst..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Diagnosis Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DiagnosisStatus)}
                    className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                  >
                    <option value="clinically_diagnosed">Clinically Diagnosed by Physician</option>
                    <option value="suspected">Suspected / Symptoms Match</option>
                    <option value="under_investigation">Under Clinical Investigation / Testing</option>
                    <option value="self_reported">Self-Reported Observation</option>
                  </select>
                  <p className="text-[10px] text-[#777078] mt-1">
                    Confirmed diagnoses are distinguished from suspected conditions.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                  >
                    {SUGGESTED_CONDITIONS.map(sc => (
                      <option key={sc.category} value={sc.category}>{sc.category}</option>
                    ))}
                    <option value="Other">Other Condition</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Date Diagnosed / First Noticed
                  </label>
                  <input
                    type="date"
                    value={dateNoticed}
                    onChange={(e) => setDateNoticed(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Diagnosing Physician / Facility
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Mthembu, Groote Schuur Hospital"
                    value={diagnosedBy}
                    onChange={(e) => setDiagnosedBy(e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                  />
                </div>
              </div>

              {/* Associated Symptoms Selection */}
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Symptoms Associated with this Condition
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/15 min-h-12 mb-2">
                  {selectedSymptoms.map(sym => (
                    <span 
                      key={sym}
                      className="px-2.5 py-1 rounded-md bg-[#572D43] text-white text-xs flex items-center gap-1.5"
                    >
                      {sym}
                      <button
                        type="button"
                        onClick={() => handleToggleSymptom(sym)}
                        className="hover:text-[#D9A7A4] cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedSymptoms.length === 0 && (
                    <span className="text-xs text-[#777078] italic">
                      Select typical symptoms below or add your own...
                    </span>
                  )}
                </div>

                {/* Quick Symptom suggestions from matching preset */}
                {(() => {
                  const match = SUGGESTED_CONDITIONS.find(sc => sc.category === category);
                  const suggestions = match ? match.typicalSymptoms : [];
                  return (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {suggestions.map(s => {
                        const isSelected = selectedSymptoms.includes(s);
                        return (
                          <button
                            type="button"
                            key={s}
                            onClick={() => handleToggleSymptom(s)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-[#914E61] text-white' 
                                : 'bg-white border border-[#D9A7A4] text-[#572D43] hover:bg-[#F4E8E0]'
                            }`}
                          >
                            {isSelected ? '✓ ' : '+ '}{s}
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Add Custom Symptom Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add other symptom..."
                    value={customSymptomInput}
                    onChange={(e) => setCustomSymptomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSymptom();
                      }
                    }}
                    className="flex-1 p-2 rounded-lg bg-white border border-[#572D43]/20 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSymptom}
                    className="px-3 py-2 rounded-lg bg-[#F4E8E0] text-[#572D43] font-bold text-xs hover:bg-[#D9A7A4]/50 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Current Treatment & Management
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hormonal therapy, pelvic floor physical therapy, dietary changes..."
                  value={currentTreatment}
                  onChange={(e) => setCurrentTreatment(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Relevant Medications
                </label>
                <input
                  type="text"
                  placeholder="e.g. Progestin, NSAIDs for pain, Metformin..."
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Personal Notes / Clinical History
                </label>
                <textarea
                  rows={2}
                  placeholder="Key observations, diagnostic surgical notes, scan results..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                />
              </div>

              {/* Privacy & Sharing Control */}
              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#572D43] block">Share with Healthcare Provider</span>
                  <span className="text-[11px] text-[#777078]">
                    When enabled, this condition will be included in your doctor's shared workspace view.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 accent-[#914E61] cursor-pointer"
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
                  {submitting ? 'Saving...' : editingCondition ? 'Update Condition' : 'Save Condition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ConditionsSection;
