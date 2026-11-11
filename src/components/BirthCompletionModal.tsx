import React, { useState } from 'react';
import { X, Baby, Check, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

const DELIVERY_TYPES = [
  'Vaginal',
  'Caesarean',
  'Not sure'
] as const;

interface BirthCompletionModalProps {
  userId: string;
  currentStages?: string[];
  currentChildrenCount?: number | null;
  onSuccess: () => void;
  onClose: () => void;
}

export default function BirthCompletionModal({
  userId,
  currentStages = [],
  currentChildrenCount = 0,
  onSuccess,
  onClose
}: BirthCompletionModalProps) {
  const [birthDate, setBirthDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [deliveryType, setDeliveryType] = useState<string>('Vaginal');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!userId || !birthDate) return;
    try {
      setSaving(true);
      setErrorMessage(null);

      // 1. Set status to 'delivered' in active pregnancy
      await supabase
        .from('pregnancies')
        .update({ status: 'delivered' })
        .eq('user_id', userId)
        .eq('status', 'active');

      // 2. Add health_events row: event_type 'pregnancy', status 'confirmed', delivery type in details
      const healthEventPayload: Record<string, any> = {
        user_id: userId,
        title: `Birth (${deliveryType})`,
        event_type: 'pregnancy',
        status: 'confirmed',
        event_date: birthDate,
        loss_type: deliveryType
      };

      const { error: eventError } = await supabase
        .from('health_events')
        .insert(healthEventPayload);

      if (eventError) {
        console.warn('Initial insert to health_events failed, retrying with standard columns:', eventError);
        await supabase
          .from('health_events')
          .insert({
            user_id: userId,
            title: `Birth: ${deliveryType}`,
            event_type: 'pregnancy',
            status: 'confirmed',
            event_date: birthDate
          });
      }

      // 3. Replace 'pregnant' with 'early_motherhood' in stages
      const updatedStages = Array.from(
        new Set(currentStages.filter(s => s !== 'pregnant').concat('early_motherhood'))
      );

      // Set youngest_child_birth_date to the 1st of the birth month (YYYY-MM-01)
      const dateParts = birthDate.split('-');
      const firstOfMonth = `${dateParts[0]}-${dateParts[1]}-01`;

      // Add 1 to children_count
      const updatedChildrenCount = (currentChildrenCount || 0) + 1;

      await supabase
        .from('users')
        .update({
          stages: updatedStages,
          youngest_child_birth_date: firstOfMonth,
          children_count: updatedChildrenCount
        })
        .eq('id', userId);

      onSuccess();
    } catch (err: any) {
      console.error('Error recording birth:', err);
      setErrorMessage(err.message || 'Could not record birth. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-6 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-[#EAD5C0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409]">
              <Baby className="w-4 h-4 text-[#3B1409]" />
            </div>
            <span className="text-xs font-bold font-serif text-[#3B1409] uppercase tracking-wider">
              Birth Record
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              Congratulations on the arrival of your baby
            </h2>
            <p className="text-xs text-[#6B4A3A] leading-relaxed">
              Recording this transitions Mama Root to Early Motherhood support tailored to you and your newborn.
            </p>
          </div>

          {/* Date of birth */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#6B4A3A] uppercase tracking-wider block">
              Baby's date of birth
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Delivery Type Chips */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#6B4A3A] uppercase tracking-wider block">
              Delivery type
            </label>
            <div className="flex flex-wrap gap-2">
              {DELIVERY_TYPES.map((type) => {
                const isSelected = deliveryType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDeliveryType(type)}
                    className={cn(
                      "min-h-[44px] px-4 py-2 rounded-full border text-xs font-semibold transition-all focus-ring",
                      isSelected
                        ? "bg-[#A9421B] text-white border-[#A9421B] shadow-xs"
                        : "bg-white text-[#3B1409] border-[#B89A82] hover:bg-[#F6E7D8]"
                    )}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary w-1/3 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary w-2/3 min-h-[48px] flex items-center justify-center gap-1.5"
            >
              {saving ? 'Saving...' : 'Save to my story'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
