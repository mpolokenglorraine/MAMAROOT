import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  BookOpen, 
  Heart, 
  HelpCircle,
  FileText,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import { SexualHealthRecord, healthJourneyService } from '../../lib/healthJourneyService';

interface SexualHealthSectionProps {
  userId: string;
  records: SexualHealthRecord[];
  onRefresh: () => void;
}

export function SexualHealthSection({
  userId,
  records,
  onRefresh
}: SexualHealthSectionProps) {
  // Privacy shield state: masked by default to protect sensitive health info
  const [isMasked, setIsMasked] = useState(false);
  const [activeTab, setActiveTab] = useState<'contraception' | 'sti' | 'cervical' | 'education'>('contraception');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [recordType, setRecordType] = useState<'contraception' | 'sti_test' | 'hpv_cervical'>('contraception');
  const [title, setTitle] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('');
  const [nextDueDate, setNextDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const CONTRACEPTION_METHODS = [
    'Hormonal IUD (Mirena / Kyleena)',
    'Copper IUD (Non-hormonal)',
    'Contraceptive Implant (Nexplanon)',
    'Combined Oral Contraceptive Pill',
    'Progestin-Only Pill (Mini-pill)',
    'Injectable (Depo-Provera / Petogen)',
    'Barrier Method (Male / Female Condoms)',
    'Vaginal Ring (NuvaRing)',
    'Contraceptive Patch',
    'Fertility Awareness / Cycle Tracking',
    'None / Not Currently Using'
  ];

  const STI_TEST_OPTIONS = [
    'Comprehensive Sexual Health Screen (Full Panel)',
    'HIV Rapid / ELISA Antibody Test',
    'Chlamydia & Gonorrhea NAAT Swab / Urine',
    'Syphilis Serology (RPR / VDRL)',
    'Hepatitis B & C Screening',
    'Trichomoniasis Panel',
    'Herpes Simplex (HSV 1 & 2) Type-Specific',
    'Mycoplasma Genitalium'
  ];

  const CERVICAL_PROCEDURES = [
    'Pap Smear (Liquid-based Cytology)',
    'High-Risk HPV DNA Co-Test',
    'HPV Vaccination Dose 1',
    'HPV Vaccination Dose 2',
    'HPV Vaccination Dose 3 (Completion)',
    'Colposcopy Examination',
    'Cervical Biopsy / Histology'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await healthJourneyService.addSexualHealthRecord({
        user_id: userId,
        record_type: recordType,
        title: title.trim(),
        date: recordDate || undefined,
        result: result.trim() || undefined,
        next_due_date: nextDueDate || undefined,
        notes: notes.trim() || undefined
      });

      setShowAddModal(false);
      setTitle('');
      setResult('');
      setNextDueDate('');
      setNotes('');
      onRefresh();
    } catch (err) {
      console.error('Failed to save sexual health record:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this record?')) return;
    await healthJourneyService.deleteSexualHealthRecord(id, userId);
    onRefresh();
  };

  const contraceptionRecords = records.filter(r => r.record_type === 'contraception');
  const stiRecords = records.filter(r => r.record_type === 'sti_test');
  const cervicalRecords = records.filter(r => r.record_type === 'hpv_cervical');

  return (
    <div className="space-y-6">
      {/* Privacy Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#572D43] text-white flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#D9A7A4]" />
              Strictly Confidential & Private
            </span>
            <span className="text-xs text-[#777078]">
              Excluded from Doctor sync by default
            </span>
          </div>
          <h2 className="text-2xl font-display font-bold text-[#572D43]">
            Sexual Health, Contraception & Protection
          </h2>
          <p className="text-sm text-[#777078] max-w-xl mt-1 leading-relaxed">
            A discreet and safe space to record contraception methods, STI screening dates, HPV vaccination doses, and cervical health records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMasked(!isMasked)}
            className="px-3.5 py-2.5 rounded-xl border border-[#572D43]/20 bg-[#FFF9F3] text-xs font-semibold text-[#572D43] flex items-center gap-2 hover:bg-[#F4E8E0] transition-colors cursor-pointer"
            title={isMasked ? 'Reveal details' : 'Mask for screen privacy'}
          >
            {isMasked ? <Eye className="w-4 h-4 text-[#914E61]" /> : <EyeOff className="w-4 h-4 text-[#777078]" />}
            <span>{isMasked ? 'Reveal Screen' : 'Privacy Mask'}</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === 'contraception') setRecordType('contraception');
              else if (activeTab === 'sti') setRecordType('sti_test');
              else setRecordType('hpv_cervical');
              setShowAddModal(true);
            }}
            className="btn-berry py-2.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#F4E8E0] pb-2 overflow-x-auto">
        {[
          { id: 'contraception', label: 'Contraception & Planning', count: contraceptionRecords.length },
          { id: 'sti', label: 'STI Screenings & History', count: stiRecords.length },
          { id: 'cervical', label: 'HPV & Cervical Health', count: cervicalRecords.length },
          { id: 'education', label: 'Educational Guides', count: null }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-[#572D43] text-white shadow-xs'
                : 'bg-white text-[#777078] hover:text-[#572D43] border border-[#572D43]/10'
            }`}
          >
            {t.label}
            {t.count !== null && (
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === t.id ? 'bg-white/20 text-white' : 'bg-[#F4E8E0] text-[#572D43]'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Contraception */}
      {activeTab === 'contraception' && (
        <div className="space-y-4">
          {contraceptionRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 space-y-3">
              <Heart className="w-10 h-10 text-[#D9A7A4] mx-auto" />
              <h3 className="text-base font-bold text-[#572D43]">No Contraception Records Logged</h3>
              <p className="text-xs text-[#777078] max-w-md mx-auto">
                Record your current method, renewal or removal reminders, and personal tolerance notes.
              </p>
              <button
                onClick={() => {
                  setRecordType('contraception');
                  setShowAddModal(true);
                }}
                className="btn-berry py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log Contraceptive Method
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contraceptionRecords.map(r => (
                <div key={r.id} className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-[#572D43]">
                        {isMasked ? '••••••••••••' : r.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-[#F4E8E0] text-[10px] font-bold text-[#572D43]">
                        Contraceptive
                      </span>
                    </div>

                    {r.date && (
                      <p className="text-xs text-[#777078] mt-1">
                        Active Since: <strong>{r.date}</strong>
                      </p>
                    )}

                    {r.next_due_date && (
                      <p className="text-xs text-[#914E61] font-semibold mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Renewal / Check Due: {r.next_due_date}
                      </p>
                    )}

                    {r.notes && (
                      <p className="text-xs text-[#777078] italic mt-2">
                        {isMasked ? '••••••••••••••••••••' : `"${r.notes}"`}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F4E8E0] flex justify-end">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: STI Screenings & History */}
      {activeTab === 'sti' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 text-xs text-[#777078] flex items-start gap-2.5 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#914E61] shrink-0 mt-0.5" />
            <span>
              Regular sexual health screenings are proactive self-care. Note: Tests represent a point in time; regular routine testing is recommended between new sexual partners.
            </span>
          </div>

          {stiRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 space-y-3">
              <ShieldCheck className="w-10 h-10 text-[#D9A7A4] mx-auto" />
              <h3 className="text-base font-bold text-[#572D43]">No STI Screenings Recorded</h3>
              <p className="text-xs text-[#777078] max-w-md mx-auto">
                Keep a safe personal history of your test dates, panels checked, and follow-up milestones.
              </p>
              <button
                onClick={() => {
                  setRecordType('sti_test');
                  setShowAddModal(true);
                }}
                className="btn-berry py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Record STI Screening
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stiRecords.map(r => (
                <div key={r.id} className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-[#572D43]">
                        {isMasked ? '••••••••••••' : r.title}
                      </h4>
                      {r.result && (
                        <span className="px-2 py-0.5 rounded-full bg-[#572D43] text-white text-[10px] font-bold">
                          {isMasked ? '••••' : r.result}
                        </span>
                      )}
                    </div>

                    {r.date && (
                      <p className="text-xs text-[#777078] mt-1">
                        Screening Date: <strong>{r.date}</strong>
                      </p>
                    )}

                    {r.next_due_date && (
                      <p className="text-xs text-[#914E61] font-semibold mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Routine Follow-Up: {r.next_due_date}
                      </p>
                    )}

                    {r.notes && (
                      <p className="text-xs text-[#777078] italic mt-2">
                        {isMasked ? '••••••••••••••••••••' : `"${r.notes}"`}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F4E8E0] flex justify-end">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: HPV & Cervical Health */}
      {activeTab === 'cervical' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/50 text-xs text-[#777078] flex items-start gap-2.5 leading-relaxed">
            <CheckCircle2 className="w-4 h-4 text-[#914E61] shrink-0 mt-0.5" />
            <span>
              Cervical screening (Pap smear and high-risk HPV DNA testing) saves lives by detecting pre-cancerous cellular changes early when they are completely treatable.
            </span>
          </div>

          {cervicalRecords.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-[#572D43]/10 space-y-3">
              <Heart className="w-10 h-10 text-[#D9A7A4] mx-auto" />
              <h3 className="text-base font-bold text-[#572D43]">No Cervical or HPV Records Yet</h3>
              <p className="text-xs text-[#777078] max-w-md mx-auto">
                Record your Pap smear results, HPV DNA screening, or Gardasil vaccination doses.
              </p>
              <button
                onClick={() => {
                  setRecordType('hpv_cervical');
                  setShowAddModal(true);
                }}
                className="btn-berry py-2 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Record Cervical Screening or Vaccine
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cervicalRecords.map(r => (
                <div key={r.id} className="bg-white rounded-3xl p-6 border border-[#572D43]/10 shadow-xs flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-[#572D43]">
                        {isMasked ? '••••••••••••' : r.title}
                      </h4>
                      {r.result && (
                        <span className="px-2 py-0.5 rounded-full bg-[#914E61] text-white text-[10px] font-bold">
                          {isMasked ? '••••' : r.result}
                        </span>
                      )}
                    </div>

                    {r.date && (
                      <p className="text-xs text-[#777078] mt-1">
                        Date: <strong>{r.date}</strong>
                      </p>
                    )}

                    {r.next_due_date && (
                      <p className="text-xs text-[#572D43] font-semibold mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#914E61]" /> Next Due Date: {r.next_due_date}
                      </p>
                    )}

                    {r.notes && (
                      <p className="text-xs text-[#777078] italic mt-2">
                        {isMasked ? '••••••••••••••••••••' : `"${r.notes}"`}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F4E8E0] flex justify-end">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-1.5 rounded-lg text-[#777078] hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Educational Guides */}
      {activeTab === 'education' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-6 border border-[#572D43]/10 space-y-3">
            <div className="flex items-center gap-2 text-[#572D43] font-bold text-sm">
              <BookOpen className="w-4 h-4 text-[#914E61]" />
              <h4>Contraception Options & Suitability</h4>
            </div>
            <p className="text-xs text-[#777078] leading-relaxed">
              Long-acting reversible contraceptives (LARCs) like the hormonal or copper IUD and contraceptive implant have greater than 99% efficacy and require no daily action. For women managing endometriosis or heavy bleeding, hormonal IUDs and progestin pills often provide dual therapeutic benefits.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#572D43]/10 space-y-3">
            <div className="flex items-center gap-2 text-[#572D43] font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-[#914E61]" />
              <h4>Safer Sex & Barrier Protection</h4>
            </div>
            <p className="text-xs text-[#777078] leading-relaxed">
              External and internal condoms are the only contraceptive methods that also significantly reduce the risk of sexually transmitted infections (STIs). While they do not eliminate transmission of infections that spread via uncovered skin (such as HPV and HSV), consistent barrier use provides substantial protection.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#572D43]/10 space-y-3">
            <div className="flex items-center gap-2 text-[#572D43] font-bold text-sm">
              <Clock className="w-4 h-4 text-[#914E61]" />
              <h4>Emergency Contraception Windows</h4>
            </div>
            <p className="text-xs text-[#777078] leading-relaxed">
              If barrier protection fails: Levonorgestrel (e.g. Plan B / NorLevo) is most effective when taken within 72 hours (3 days). Ulipristal acetate (Ella) remains effective up to 120 hours (5 days). Insertion of a copper IUD by a clinician within 5 days is the most effective post-coital emergency method.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#572D43]/10 space-y-3">
            <div className="flex items-center gap-2 text-[#572D43] font-bold text-sm">
              <Heart className="w-4 h-4 text-[#914E61]" />
              <h4>HPV Vaccination & Cervical Screening</h4>
            </div>
            <p className="text-xs text-[#777078] leading-relaxed">
              The HPV vaccine protects against high-risk strains (types 16 & 18 responsible for 70% of cervical cancers) and genital warts. Women aged 25 to 65 are advised to undergo routine cervical screening every 3 to 5 years even if vaccinated.
            </p>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#572D43]/20 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#F4E8E0]">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#914E61]" />
                <h3 className="text-xl font-bold font-display text-[#572D43]">
                  Record Sexual & Reproductive Health
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
                  <label className="block font-bold text-[#572D43] mb-1">Record Category *</label>
                  <select
                    value={recordType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setRecordType(t);
                      setTitle('');
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs font-semibold"
                  >
                    <option value="contraception">Contraception & Family Planning</option>
                    <option value="sti_test">STI Screening & Test Result</option>
                    <option value="hpv_cervical">HPV Vaccine & Cervical Screening</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">Date *</label>
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
                  Title / Method / Test Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mirena IUD Insertion, Full STI Panel, Pap Smear..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  required
                />
                
                {/* Suggestions */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(recordType === 'contraception' 
                    ? CONTRACEPTION_METHODS.slice(0, 5) 
                    : recordType === 'sti_test' 
                    ? STI_TEST_OPTIONS.slice(0, 4) 
                    : CERVICAL_PROCEDURES.slice(0, 4)
                  ).map(sug => (
                    <button
                      type="button"
                      key={sug}
                      onClick={() => setTitle(sug)}
                      className="px-2 py-0.5 rounded-md bg-[#F4E8E0] text-[10px] text-[#572D43] font-medium hover:bg-[#D9A7A4]/50 cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Result / Status (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Negative / Normal, Active, Completed"
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#572D43] mb-1">
                    Next Due / Renewal Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#FFF9F3] border border-[#572D43]/20 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#572D43] mb-1">
                  Confidential Personal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Physician notes, how you felt during the procedure, side effects..."
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
                  {submitting ? 'Saving...' : 'Save Private Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default SexualHealthSection;
