import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  ShieldCheck, 
  Heart, 
  LogOut, 
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

const HEALTH_STAGES = [
  { id: 'cycle', label: 'Reproductive Health & Menstrual Cycle', description: 'Tracking natural rhythms, cycle comfort, and hormonal wellness' },
  { id: 'fertility', label: 'Fertility & Preconception', description: 'Understanding fertile windows, body signs, and preconception preparation' },
  { id: 'pregnancy', label: 'Pregnancy Care', description: 'Nurturing prenatal health, trimesters, and clinic visit readiness' },
  { id: 'loss', label: 'Pregnancy Loss & Gentle Healing', description: 'Compassionate physical recovery and emotional support resources' },
  { id: 'postpartum', label: 'Early Motherhood & Postpartum', description: 'The fourth trimester, newborn bonding, and maternal replenishment' },
  { id: 'menopause', label: 'Perimenopause & Menopause', description: 'Navigating hormonal changes, body transitions, and vital comfort' },
];

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [selectedStage, setSelectedStage] = useState<string>(() => {
    return localStorage.getItem('mamaroot_health_focus') || 'pregnancy';
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleStageChange = (stageId: string) => {
    setSelectedStage(stageId);
    localStorage.setItem('mamaroot_health_focus', stageId);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Mama Root Member';
  const email = profile?.email || user?.email || '';

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <header className="pb-6 border-b border-[#D9A7A4]/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-serif-italic text-[#572D43]">
              My Profile & Preferences
            </h1>
            <p className="text-sm text-[#777078] mt-1">
              Personalize your Mama Root experience, manage health stage focus, and review privacy controls.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#D9A7A4]/50 text-xs font-semibold text-[#777078] hover:bg-[#F4E8E0] hover:text-[#572D43] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Account Info Card */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs">
        <div className="flex items-start sm:items-center gap-5 pb-6 border-b border-[#F4E8E0]">
          <div className="w-16 h-16 rounded-2xl bg-[#572D43] text-white flex items-center justify-center text-2xl font-bold font-serif shrink-0 shadow-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-[#572D43] truncate">{displayName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#777078]">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#914E61]" /> {email}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F4E8E0] text-[#572D43] font-semibold text-[11px]">
                Mother Interface
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#777078]">
          <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/40">
            <p className="font-semibold text-[#572D43] mb-1">Confidential Healthcare Space</p>
            <p>Your logged symptoms and appointments remain private between you and your confirmed physician.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FFF9F3] border border-[#D9A7A4]/40">
            <p className="font-semibold text-[#572D43] mb-1">Flexible Support</p>
            <p>You can change your health focus anytime without losing historical wellness logs.</p>
          </div>
        </div>
      </section>

      {/* Health Stage / Focus Preference */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-[#914E61]" />
              <h2 className="text-xl font-bold text-[#572D43]">Health Stage & Focus</h2>
            </div>
            <p className="text-xs text-[#777078]">
              Select which area of health you are currently navigating. This customizes helpful guidance on your home dashboard.
            </p>
          </div>
          {savedNotice && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#F4E8E0] text-[#572D43] text-xs font-semibold rounded-full animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#914E61]" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {HEALTH_STAGES.map((stage) => {
            const isSelected = selectedStage === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleStageChange(stage.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected 
                    ? 'border-[#914E61] bg-[#F4E8E0] shadow-xs ring-1 ring-[#914E61]' 
                    : 'border-[#572D43]/10 bg-white hover:border-[#914E61]/40 hover:bg-[#FFF9F3]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-[#572D43]' : 'text-[#302B2D]'}`}>
                    {stage.label}
                  </span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-[#914E61] bg-[#914E61]' : 'border-[#777078]/40'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <p className="text-xs text-[#777078] leading-relaxed">
                  {stage.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Urgent Clinical Guidance & Safety */}
      <section className="bg-[#F4E8E0] rounded-3xl p-6 sm:p-8 border border-[#D9A7A4]/50 space-y-4">
        <div className="flex items-center gap-2.5 text-[#572D43]">
          <AlertTriangle className="w-5 h-5 text-[#914E61]" />
          <h2 className="text-lg font-bold">When to Seek Immediate Medical Attention</h2>
        </div>
        <p className="text-xs text-[#777078] leading-relaxed">
          Mama Root provides supportive educational guidance and record-keeping, but is not an emergency response service. 
          Please contact your local healthcare provider or hospital maternity unit immediately if you experience:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#302B2D] pt-1">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#914E61]" /> Heavy vaginal bleeding or unusual discharge</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#914E61]" /> Severe, sudden, or persistent abdominal pain</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#914E61]" /> Severe headache with vision changes or dizziness</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#914E61]" /> High fever, chills, or sudden chest tightness</li>
        </ul>
      </section>

      {/* Privacy, Trust & Brand Links */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#572D43]/10 shadow-xs space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-5 h-5 text-[#914E61]" />
          <h2 className="text-xl font-bold text-[#572D43]">Privacy, Security & Standards</h2>
        </div>
        
        <div className="space-y-3 text-xs text-[#777078] leading-relaxed">
          <p>
            <strong className="text-[#572D43]">Row-Level Security (RLS):</strong> Your health logs, appointment notes, and symptoms are secured in our database so only authenticated accounts with verified role access can view them.
          </p>
          <p>
            <strong className="text-[#572D43]">Cultural Integrity:</strong> We honor traditional African postpartum and maternal wisdom alongside evidence-based obstetric protocols.
          </p>
        </div>

        <div className="pt-4 border-t border-[#F4E8E0] flex flex-wrap items-center justify-between gap-4">
          <Link 
            to="/brand-assets"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#914E61] hover:underline"
          >
            <Sparkles className="w-4 h-4 text-[#D9A7A4]" />
            <span>Mama Root Brand Identity & Vector Assets</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
          <span className="text-[11px] text-[#777078]">
            Mama Root Care Network • Modern Heritage
          </span>
        </div>
      </section>
    </div>
  );
}
