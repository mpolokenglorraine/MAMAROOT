import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Sparkles, 
  Heart, 
  HeartHandshake, 
  Activity, 
  Baby, 
  ThermometerSun, 
  Stethoscope, 
  Check, 
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { cn } from '../lib/utils';
import { RootsDivider } from '../components/RootsMotif';

export interface StageCardDef {
  id: string;
  title: string;
  shortLine: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STAGE_CARDS: StageCardDef[] = [
  {
    id: 'tracking_periods',
    title: 'Period tracking',
    shortLine: 'Understand your cycle rhythm and flow',
    icon: CalendarDays,
  },
  {
    id: 'trying_to_conceive',
    title: 'Trying to conceive',
    shortLine: 'Support and insights for family planning',
    icon: Sparkles,
  },
  {
    id: 'pregnant',
    title: 'Pregnancy',
    shortLine: 'Week-by-week guidance for you and baby',
    icon: Heart,
  },
  {
    id: 'after_loss',
    title: 'Pregnancy loss support',
    shortLine: 'Compassionate care, recovery and healing',
    icon: HeartHandshake,
  },
  {
    id: 'postpartum',
    title: 'Postpartum',
    shortLine: 'Nurturing your body in the first weeks after birth',
    icon: Activity,
  },
  {
    id: 'early_motherhood',
    title: 'Early motherhood',
    shortLine: 'Guidance for you and baby as your child grows',
    icon: Baby,
  },
  {
    id: 'menopause',
    title: 'Perimenopause and menopause',
    shortLine: 'Navigating hormonal changes and body transitions',
    icon: ThermometerSun,
  },
  {
    id: 'living_with_condition',
    title: 'Living with a condition',
    shortLine: 'Managing reproductive health conditions day-to-day',
    icon: Stethoscope,
  },
];

export default function ChooseJourney() {
  const { user, profile, refetchProfile } = useAuth();
  const navigate = useNavigate();

  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize with user's existing stages if present
  useEffect(() => {
    if (profile?.stages && Array.isArray(profile.stages)) {
      setSelectedStages(profile.stages);
    }
  }, [profile?.stages]);

  const toggleStage = (stageId: string) => {
    setSelectedStages((prev) =>
      prev.includes(stageId)
        ? prev.filter((id) => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleContinue = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setErrorMsg(null);

      // Save stages to users table and mark onboarding_complete
      const { error } = await supabase
        .from('users')
        .update({
          stages: selectedStages,
          onboarding_complete: true,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refetchProfile();
      navigate('/mother-dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error saving stages:', err);
      setErrorMsg(err.message || 'Could not save your stages. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans pb-16">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/mother-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9421B] hover:text-[#833518] py-2 px-1 focus-ring rounded-xl min-h-[44px]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#A9421B]" />
            <span>Today</span>
          </button>

          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Mama Root logo: a mother holding her child, with roots below" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-serif font-bold text-[#3B1409] text-base">Mama Root</span>
          </div>
        </div>

        {/* Title and Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#3B1409] tracking-tight">
            Where are you in your journey?
          </h1>
          <p className="text-xs sm:text-sm text-[#6B4A3A] leading-relaxed">
            Pick all that apply. You can change this any time.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl">
            {errorMsg}
          </div>
        )}

        {/* 8 Large Selectable Cards */}
        <div className="space-y-3">
          {STAGE_CARDS.map((card) => {
            const isSelected = selectedStages.includes(card.id);
            const IconComponent = card.icon;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => toggleStage(card.id)}
                className={cn(
                  "w-full text-left p-4 rounded-3xl border transition-all duration-200 flex items-center justify-between gap-4 focus-ring shadow-xs",
                  isSelected
                    ? "bg-[#2F6B3F] text-white border-[#2F6B3F] shadow-md"
                    : "bg-white border-[#EAD5C0] hover:border-[#2F6B3F] hover:bg-[#E3F1DA]/30"
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isSelected ? "bg-white/20 text-white border border-white/30" : "bg-[#F7CCA5] text-[#3B1409]"
                    )}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <h2
                      className={cn(
                        "text-sm font-bold font-serif leading-snug",
                        isSelected ? "text-white" : "text-[#3B1409]"
                      )}
                    >
                      {card.title}
                    </h2>
                    <p
                      className={cn(
                        "text-xs leading-normal line-clamp-2",
                        isSelected ? "text-white/90" : "text-[#6B4A3A]"
                      )}
                    >
                      {card.shortLine}
                    </p>
                  </div>
                </div>

                {/* Tick when chosen */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "bg-white border-white text-[#2F6B3F] scale-105 shadow-xs"
                      : "border-[#B89A82] bg-white"
                  )}
                  aria-label={isSelected ? `${card.title} selected` : `Select ${card.title}`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-[#2F6B3F]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pinned Bottom Continue Button */}
        <div className="pt-4 space-y-4">
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="btn-primary w-full min-h-[50px] flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving your choices...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>

          <RootsDivider />
        </div>

      </div>
    </div>
  );
}
