import React from 'react';
import { Phone, HeartHandshake, ShieldAlert, Stethoscope } from 'lucide-react';
import { CRISIS_HELPLINES, EMERGENCY_NUMBERS } from '../lib/helplines';

interface HelplineCardProps {
  reason?: 'harm_thoughts' | 'not_coping' | 'general';
  onDismiss?: () => void;
}

export default function HelplineCard({ reason = 'general' }: HelplineCardProps) {
  return (
    <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0 mt-0.5">
          <HeartHandshake className="w-5 h-5 text-[#3B1409]" />
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className="text-sm font-bold font-serif text-[#3B1409]">
            {reason === 'harm_thoughts'
              ? 'You are not alone, and help is here'
              : reason === 'not_coping'
              ? 'We hear you. You do not have to carry this alone'
              : 'Confidential Support & Helplines'}
          </h3>
          <p className="text-xs text-[#6B4A3A] leading-relaxed">
            {reason === 'harm_thoughts'
              ? 'Intrusive, overwhelming feelings and thoughts of harm happen to many mothers and are treatable medical symptoms. Please reach out to someone who can help right now.'
              : reason === 'not_coping'
              ? 'Early motherhood can feel completely overwhelming. Admitting you are struggling is an act of deep courage. Please talk to a doctor, nurse, or midwife, and reach out to these confidential services.'
              : 'Free, compassionate mental health and maternal support lines ready to listen.'}
          </p>
        </div>
      </div>

      {/* Suggestion to speak to a clinician */}
      <div className="bg-[#F6E7D8] border border-[#EAD5C0] rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-[#3B1409]">
        <Stethoscope className="w-4 h-4 text-[#A9421B] shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Talk to your clinician:</strong> A clinic nurse, doctor, or midwife can offer compassionate, confidential medical care and safe relief. You are not being judged.
        </span>
      </div>

      {/* Helpline listings */}
      <div className="space-y-2.5 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A9421B]">
          Dedicated Support Services
        </span>
        <div className="space-y-2">
          {CRISIS_HELPLINES.map((line) => (
            <div
              key={line.id}
              className="bg-white border border-[#EAD5C0] rounded-2xl p-3.5 space-y-1.5 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#3B1409]">
                  {line.name}
                </span>
                {line.isTollFree && (
                  <span className="text-[10px] font-semibold bg-[#E8EAD0] text-[#3F4318] border border-[#C5C98F] px-2 py-0.5 rounded-full">
                    Toll-free
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6B4A3A] leading-relaxed">
                {line.service}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-[#6B4A3A] italic">
                  {line.hours}
                </span>
                {line.phoneNumber ? (
                  <a
                    href={`tel:${line.phoneNumber}`}
                    className="font-bold text-[#A9421B] hover:text-[#833518] hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{line.phoneNumber}</span>
                  </a>
                ) : (
                  <span className="text-[10px] text-[#6B4A3A] bg-[#F6E7D8] border border-[#EAD5C0] px-2 py-0.5 rounded">
                    Verified national number available at launch
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate Emergency Line */}
      <div className="pt-2 border-t border-[#EAD5C0] flex items-center justify-between text-xs text-[#3B1409]">
        <span className="font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#A9421B]" />
          <span>Immediate emergency:</span>
        </span>
        <span className="font-bold text-[#A9421B]">
          Call {EMERGENCY_NUMBERS.general} or Ambulance {EMERGENCY_NUMBERS.ambulance}
        </span>
      </div>
    </div>
  );
}
