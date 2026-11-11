import React, { useState, useEffect } from 'react';
import { Smile, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import HelplineCard from './HelplineCard';
import { useT } from '../i18n/useT';

interface PostpartumMoodCheckCardProps {
  userId: string;
  onAnswerSaved?: (answer: string) => void;
}

const MOOD_OPTIONS = ['Fine', 'Struggling a bit', 'Not coping'] as const;

export default function PostpartumMoodCheckCard({
  userId,
  onAnswerSaved
}: PostpartumMoodCheckCardProps) {
  const { t } = useT();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [lastCheckDate, setLastCheckDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showHelpline, setShowHelpline] = useState(false);

  useEffect(() => {
    if (userId) {
      loadLatestMoodCheck();
    }
  }, [userId]);

  async function loadLatestMoodCheck() {
    try {
      const { data } = await supabase
        .from('health_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'postpartum_mood_check')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latest = data[0];
        const eventDate = latest.event_date || (latest.created_at ? latest.created_at.split('T')[0] : null);
        setLastCheckDate(eventDate);
        const storedOption = latest.notes || latest.title?.replace('Mood check: ', '') || null;
        setSelectedMood(storedOption);
        if (storedOption === 'Not coping') {
          setShowHelpline(true);
        }
      }
    } catch (err) {
      console.warn('Error loading mood check:', err);
    }
  }

  async function handleSelectMood(option: typeof MOOD_OPTIONS[number]) {
    if (!userId || saving) return;

    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('health_events').insert({
        user_id: userId,
        title: `Mood check: ${option}`,
        event_type: 'postpartum_mood_check',
        status: 'experienced',
        event_date: today,
        notes: option
      });

      if (error) {
        console.warn('Error saving to health_events with notes, falling back:', error);
        await supabase.from('health_events').insert({
          user_id: userId,
          title: `Mood check: ${option}`,
          event_type: 'postpartum_mood_check',
          status: 'experienced',
          event_date: today
        });
      }

      setSelectedMood(option);
      setLastCheckDate(today);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);

      if (option === 'Not coping') {
        setShowHelpline(true);
      } else {
        setShowHelpline(false);
      }

      if (onAnswerSaved) {
        onAnswerSaved(option);
      }
    } catch (err) {
      console.error('Error saving mood check answer:', err);
    } finally {
      setSaving(false);
    }
  }

  function getOptionLabel(opt: string) {
    if (opt === 'Fine') return t('fine_option');
    if (opt === 'Struggling a bit') return t('struggling_option');
    if (opt === 'Not coping') return t('not_coping_option');
    return opt;
  }

  return (
    <div className="space-y-3">
      <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
              <Smile className="w-5 h-5 text-[#3B1409]" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-serif text-[#3B1409] leading-snug">
                {t('how_are_you_feeling_weekly')}
              </h3>
              <p className="text-[11px] text-[#6B4A3A]">
                A gentle weekly check-in for your emotional wellbeing.
              </p>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-2.5 bg-[#E8EAD0] text-[#3F4318] border border-[#C5C98F] text-xs font-semibold rounded-2xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-3.5 h-3.5 text-[#3F4318]" />
            <span>{t('checkin_saved')}</span>
          </div>
        )}

        {/* 3 Plain Options */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {MOOD_OPTIONS.map((option) => {
            const isSelected = selectedMood === option;
            return (
              <button
                key={option}
                type="button"
                disabled={saving}
                onClick={() => handleSelectMood(option)}
                className={cn(
                  "min-h-[44px] py-2.5 px-2 rounded-2xl text-xs font-semibold border transition-all text-center focus-ring flex items-center justify-center",
                  isSelected
                    ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                    : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                )}
              >
                {getOptionLabel(option)}
              </button>
            );
          })}
        </div>

        {lastCheckDate && (
          <p className="text-[10px] text-[#6B4A3A] text-right italic">
            Last checked: {lastCheckDate}
          </p>
        )}
      </div>

      {/* If she picks 'Not coping', show the helplines card and suggest speaking to a clinician */}
      {showHelpline && (
        <HelplineCard reason="not_coping" />
      )}
    </div>
  );
}
