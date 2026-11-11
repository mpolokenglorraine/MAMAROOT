import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  X,
  Share2,
  Activity,
  HeartCrack
} from 'lucide-react';
import { FlareUp, HealthCondition, healthJourneyService } from '../../lib/healthJourneyService';

interface FlareUpSectionProps {
  userId: string;
  flareUps: FlareUp[];
  conditions: HealthCondition[];
  onRefresh: () => void;
  initialCondition?: string;
}

export function FlareUpSection({
  userId,
  flareUps,
  conditions,
  onRefresh,
  initialCondition
}: FlareUpSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [conditionName, setConditionName] = useState(initialCondition || (conditions[0]?.name || 'Endometriosis'));
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [isOngoing, setIsOngoing] = useState(true);
  const [endTime, setEndTime] = useState('');
  const [severity, setSeverity] = useState(6);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    'Pelvic Pain',
    'Bloating / Endo Belly'
  ]);
  const [contributingFactors, setContributingFactors] = useState<string[]>(['High Stress']);
  const [medicationsTaken, setMedicationsTaken] = useState('');
  const [notes, setNotes] = useState('');
  const [isShared, setIsShared] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const COMMON_FLARE_SYMPTOMS = [
    'Pelvic Pain',
    'Severe Lower Back Ache',
    'Bloating / Endo Belly',
    'Painful Bowel Movement',
    'Pain with Intercourse',
    'Cramping Spasms',
    'Nausea & Loss of Appetite',
    'Extreme Fatigue',
    'Heavy / Clotted Bleeding',
    'Brain Fog & Dizziness',
    'Urinary Urgency / Pressure'
  ];

  const COMMON_CONTRIBUTING_FACTORS = [
    'Menstrual Phase (Luteal / Menses)',
    'High Stress or Emotional Strain',
    'Lack of Restful Sleep',
    'Suspected Food Trigger',
    'Intense Physical Exertion',
    'Cold Weather / Temperature Drop',
    'Recent Travel or Interrupted Routine'
  ];

  const handleToggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleToggleFactor = (fac: string) => {
    if (contributingFactors.includes(fac)) {
      setContributingFactors(contributingFactors.filter(f => f !== fac));
    } else {
      setContributingFactors([...contributingFactors, fac]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await healthJourneyService.addFlareUp({
        user_id: userId,
        condition_name: conditionName,
        start_time: new Date(startTime).toISOString(),
        end_time: isOngoing ? undefined : (endTime ? new Date(endTime).toISOString() : undefined),
        is_ongoing: isOngoing,
        severity,
        symptoms: selectedSymptoms,
        contributing_factors: contributingFactors,
        medications_taken: medicationsTaken.trim() || undefined,
        notes: notes.trim() || undefined,
        is_shared_with_doctor: isShared
      });

      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      console.error('Failed to log flare-up:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndFlareUp = async (id: string) => {
    const endNow = new Date().toISOString();
    await healthJourneyService.endFlareUp(id, endNow, userId);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this flare-up record?')) return;
    await healthJourneyService.deleteFlareUp(id, userId);
    onRefresh();
  };

  // Stats calculation
  const totalFlares = flareUps.length;
  const activeFlares = flareUps.filter(f => f.is_ongoing);
  const avgSeverity = totalFlares > 0 
    ? (flareUps.reduce((acc, f) => acc + f.severity, 0) / totalFlares).toFixed(1)
    : '0';

  const getSeverityBadgeClass = (sev: number) => {
    if (sev >= 8) return 'bg-rose-100 text-rose-800 border-rose-200';
    if (sev >= 5) return 'bg-[#914E61]/20 text-[#572D43] border-[#914E61]/30';
    return 'bg-[#F4E8E0] text-[#572D43] border-[#D9A7A4]/50';
  };

  const getSeverityLabel = (sev: number) => {
    if (sev >= 9) return 'Extremely Severe';
    if (sev >= 7) return 'Severe';
    if (sev >= 5) return 'Moderate';
    if (sev >= 3) return 'Mild / Discomfort';
    return 'Minimal';
  };

  return (
    <div className="space-y-6">
      {/* Overview & Quick Launch */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#914E61]/15 text-[#914E61] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#914E61]" />
              Flare-Up Monitoring
            </span>
            {activeFlares.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 animate-pulse border border-rose-200">
                {activeFlares.length} active flare-up
              </span>
            )}
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            Track Flare-Ups & Acute Pain Episodes
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            Record acute episodes, pain intensity, potential triggers, and relief methods. Track your frequency and duration over time for your clinical consultations.
          </p>
        </div>

        <button
          onClick={() => {
            setStartTime(new Date().toISOString().slice(0, 16));
            setIsOngoing(true);
            setShowAddModal(true);
          }}
          className="btn-berry py-3 px-5 text-sm font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs"
        >
          <Flame className="w-4 h-4" />
          <span>Record Flare-Up</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FFF9F3] p-5 rounded-2xl border border-[#D9A7A4]/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777078]">
            Active Flare-Ups
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-[#572D43]">
              {activeFlares.length}
            </span>
            <span className="text-xs text-[#777078]">currently ongoing</span>
          </div>
        </div>

        <div className="bg-[#FFF9F3] p-5 rounded-2xl border border-[#D9A7A4]/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777078]">
            Recorded Episodes
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-[#572D43]">
              {totalFlares}
            </span>
            <span className="text-xs text-[#777078]">total logged</span>
          </div>
        </div>

        <div className="bg-[#FFF9F3] p-5 rounded-2xl border border-[#D9A7A4]/50">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#777078]">
            Average Pain Severity
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-display text-[#914E61]">
              {avgSeverity} <span className="text-sm font-normal text-[#777078]">/ 10</span>
            </span>
            <span className="text-xs text-[#777078]">overall episodes</span>
          </div>
        </div>
      </div>

      {/* Active Flares Banner */}
      {activeFlares.map(flare => (
        <div 
          key={flare.id}
          className="bg-white border-2 border-[#914E61] rounded-3xl p-6 shadow-md relative overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                  ONGOING EPISODE • Started {new Date(flare.start_time).toLocaleDateString()} at {new Date(flare.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#572D43]">
                {flare.condition_name} Flare-Up
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getSeverityBadgeClass(flare.severity)}`}>
                  Pain: {flare.severity}/10 ({getSeverityLabel(flare.severity)})
                </span>
                {flare.medications_taken && (
                  <span className="px-2 py-0.5 rounded-md bg-[#F4E8E0] text-[#572D43] font-medium">
                    Medication: {flare.medications_taken}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => handleEndFlareUp(flare.id)}
              className="btn-berry py-2.5 px-5 text-xs font-bold shrink-0 cursor-pointer shadow-xs"
            >
              Mark Flare-Up as Ended
            </button>
          </div>
        </div>
      ))}

      {/* Flare-Ups History List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-[#F4E8E0]">
          <h3 className="text-lg font-bold text-[#572D43]">
            Previous Flare-Up History
          </h3>
          <span className="text-xs text-[#777078]">
            Chronological records for healthcare reviews
          </span>
        </div>

        {flareUps.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Activity className="w-10 h-10 text-[#D9A7A4] mx-auto" />
            <p className="text-xs text-[#777078]">
              No flare-up episodes logged yet. Log acute pain moments to build clear clinical frequency records.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {flareUps.map(flare => {
              const startFormatted = new Date(flare.start_time).toLocaleString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              const endFormatted = flare.end_time 
                ? new Date(flare.end_time).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : 'Ongoing';

              return (
                <div 
                  key={flare.id}
                  className="p-5 rounded-2xl bg-[#FFF9F3] border border-[#F4E8E0] hover:border-[#D9A7A4] transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-[#572D43]">
                          {flare.condition_name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getSeverityBadgeClass(flare.severity)}`}>
                          Severity {flare.severity}/10
                        </span>
                        {flare.is_ongoing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#777078] mt-1 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#914E61]" />
                        <span>{startFormatted} → {endFormatted}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {flare.is_shared_with_doctor && (
                        <span className="text-[11px] font-medium text-[#914E61] flex items-center gap-1">
                          <Share2 className="w-3 h-3" /> Shared
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(flare.id)}
                        className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete flare-up"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {flare.symptoms && flare.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {flare.symptoms.map(s => (
                        <span 
                          key={s}
                          className="px-2 py-0.5 rounded-md bg-white border border-[#D9A7A4]/50 text-[11px] font-medium text-[#572D43]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {flare.contributing_factors && flare.contributing_factors.length > 0 && (
                    <p className="text-xs text-[#777078]">
                      <strong className="text-[#572D43]">Possible Factors:</strong> {flare.contributing_factors.join(', ')}
                    </p>
                  )}

                  {flare.medications_taken && (
                    <p className="text-xs text-[#302B2D]">
                      <strong className="text-[#572D43]">Medications Taken:</strong> {flare.medications_taken}
                    </p>
                  )}

                  {flare.notes && (
                    <p className="text-xs text-[#777078] italic">
                      "{flare.notes}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record Flare-Up Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-[#914E61]" />
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  Record Flare-Up Episode
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
                  Associated Health Condition *
                </label>
                <select
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D] focus:outline-none focus:border-[#914E61]"
                >
                  {conditions.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                  <option value="Endometriosis">Endometriosis</option>
                  <option value="Uterine Fibroids">Uterine Fibroids</option>
                  <option value="Adenomyosis">Adenomyosis</option>
                  <option value="PCOS">PCOS</option>
                  <option value="Pelvic Pain (Unclassified)">Pelvic Pain (Unclassified)</option>
                  <option value="Other">Other Flare-Up</option>
                </select>
              </div>

              {/* Pain Severity Slider (0 to 10) */}
              <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#572D43]">
                    Pain Severity Scale (0 to 10) *
                  </label>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs border ${getSeverityBadgeClass(severity)}`}>
                    {severity} / 10 • {getSeverityLabel(severity)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full accent-[#914E61] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#777078]">
                  <span>0 (None)</span>
                  <span>3 (Mild)</span>
                  <span>5 (Moderate)</span>
                  <span>7 (Severe)</span>
                  <span>10 (Debilitating)</span>
                </div>
              </div>

              {/* Start & End Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-[#572D43]">Episode Status</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isOngoing}
                        onChange={(e) => setIsOngoing(e.target.checked)}
                        className="accent-[#914E61]"
                      />
                      <span className="text-[11px] text-[#572D43] font-semibold">Still Ongoing</span>
                    </label>
                  </div>
                  {!isOngoing && (
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Symptoms during Flare */}
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Symptoms Experienced
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/15 max-h-36 overflow-y-auto">
                  {COMMON_FLARE_SYMPTOMS.map(sym => {
                    const isSelected = selectedSymptoms.includes(sym);
                    return (
                      <button
                        type="button"
                        key={sym}
                        onClick={() => handleToggleSymptom(sym)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[#572D43] text-white' 
                            : 'bg-white border border-[#D9A7A4] text-[#572D43] hover:bg-[#F4E8E0]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{sym}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contributing factors */}
              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Suspected Contributing Factors
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/15 max-h-32 overflow-y-auto">
                  {COMMON_CONTRIBUTING_FACTORS.map(fac => {
                    const isSelected = contributingFactors.includes(fac);
                    return (
                      <button
                        type="button"
                        key={fac}
                        onClick={() => handleToggleFactor(fac)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected 
                            ? 'bg-[#914E61] text-white' 
                            : 'bg-white border border-[#D9A7A4] text-[#572D43] hover:bg-[#F4E8E0]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}{fac}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Medications or Pain Relief Measures Taken
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ibuprofen 400mg, heating pad, peppermint tea, progestin..."
                  value={medicationsTaken}
                  onChange={(e) => setMedicationsTaken(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Impact on daily activities, work disruption, how long until relief..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs text-[#302B2D]"
                />
              </div>

              <div className="p-3.5 bg-[#FFF9F3] rounded-2xl border border-[#D9A7A4]/50 flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#572D43] block">Include in Doctor's Shared Summary</span>
                  <span className="text-[11px] text-[#777078]">
                    Shares flare frequency and average pain score during consultations.
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
                  {submitting ? 'Saving...' : 'Save Flare-Up Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default FlareUpSection;
