import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Heart, 
  Activity, 
  AlertTriangle, 
  Stethoscope, 
  BookOpen, 
  PhoneCall, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { LOSS_SUPPORT_CONTENT } from '../../constants/lossSupportContent';

export default function LossSupportPage() {
  const navigate = useNavigate();
  const { header, cards } = LOSS_SUPPORT_CONTENT;

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] font-sans pb-16">
      <div className="max-w-md mx-auto px-4 py-4 space-y-5 animate-in fade-in duration-300">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => navigate('/mother-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9421B] hover:text-[#833518] py-2 px-1 focus-ring rounded-xl min-h-[44px]"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-[#A9421B]" />
            <span>Today</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-serif text-[#3B1409] tracking-tight">
            {header.heading}
          </h1>
          <p className="text-sm text-[#6B4A3A] font-medium">
            {header.subheading}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CARD 1: 'Your body' */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-[#3B1409]" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              {cards.yourBody.title}
            </h2>
          </div>

          <p className="text-xs text-[#3B1409] leading-relaxed">
            {cards.yourBody.generalExpectation}
          </p>

          {/* Urgent Warning Box in Root Brown with white text */}
          <div className="bg-[#3B1409] text-white rounded-2xl p-4 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-4 h-4 text-[#F7CCA5] shrink-0" />
              <span className="text-xs font-bold font-serif tracking-wide text-white">
                {cards.yourBody.urgentTitle}
              </span>
            </div>

            <ul className="space-y-1.5 text-[11px] text-white/90 leading-normal">
              {cards.yourBody.urgentSigns.map((sign, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#F7CCA5] mt-0.5">•</span>
                  <span>{sign}</span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-white/20 text-[11px] text-white font-medium leading-relaxed">
              <p>{cards.yourBody.emergencyNotice}</p>
              <div className="flex items-center gap-3 mt-2 font-bold text-xs">
                <a
                  href={`tel:${cards.yourBody.contacts.generalEmergency}`}
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl focus-ring text-white min-h-[36px]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#F7CCA5]" />
                  <span>Call {cards.yourBody.contacts.generalEmergency}</span>
                </a>
                <a
                  href={`tel:${cards.yourBody.contacts.ambulance}`}
                  className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl focus-ring text-white min-h-[36px]"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#F7CCA5]" />
                  <span>Ambulance {cards.yourBody.contacts.ambulance}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 2: 'Your heart' in Leaf tint with Leaf border and Leaf text */}
        {/* ========================================================================= */}
        <div className="bg-[#E8EAD0] border border-[#C5C98F] text-[#3F4318] rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#5E5A28] text-white flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#3F4318]">
              {cards.yourHeart.title}
            </h2>
          </div>

          <p className="text-xs text-[#3F4318] leading-relaxed">
            {cards.yourHeart.message}
          </p>

          <div className="p-3 bg-white/80 rounded-2xl border border-[#C5C98F] text-xs text-[#3F4318] leading-relaxed">
            {cards.yourHeart.supportNote}
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#5E5A28] uppercase tracking-wider block">
              Support lines available in South Africa:
            </span>
            <div className="space-y-1.5 text-xs text-[#3F4318]">
              {cards.yourHeart.counselingHelplines.map((helpline, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-[#C5C98F]/60 last:border-0">
                  <span className="text-[#5E5A28] font-medium">{helpline.label}</span>
                  <a 
                    href={`tel:${helpline.number.replace(/\s+/g, '')}`} 
                    className="font-bold text-[#3F4318] hover:underline"
                  >
                    {helpline.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CARD 3: 'Ask your doctor' */}
        {/* ========================================================================= */}
        <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-[#3B1409]" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              {cards.askYourDoctor.title}
            </h2>
          </div>

          <p className="text-xs text-[#6B4A3A] leading-relaxed">
            {cards.askYourDoctor.intro}
          </p>

          <div className="space-y-2">
            {cards.askYourDoctor.questions.map((q, idx) => (
              <div 
                key={idx} 
                className="p-3 bg-[#FFF9F2] border border-[#EAD5C0] rounded-2xl text-xs text-[#3B1409] flex items-start gap-2.5 font-medium leading-relaxed"
              >
                <span className="w-5 h-5 rounded-full bg-[#F7CCA5] text-[#3B1409] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{q}</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#6B4A3A] italic leading-normal pt-1">
            {cards.askYourDoctor.note}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CARD 4: 'Saved to your story' */}
        {/* ========================================================================= */}
        <div className="bg-[#F6E7D8]/80 border border-[#EAD5C0] rounded-3xl p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-[#3B1409]" />
            </div>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              {cards.savedToStory.title}
            </h2>
          </div>

          <p className="text-xs text-[#3B1409] leading-relaxed font-medium">
            {cards.savedToStory.message}
          </p>

          <Link
            to="/story"
            className="w-full min-h-[44px] py-2.5 px-4 bg-white border border-[#EAD5C0] hover:border-[#A9421B] text-[#3B1409] text-xs font-bold rounded-2xl transition-colors shadow-xs flex items-center justify-between focus-ring"
          >
            <span>{cards.savedToStory.linkText}</span>
            <ChevronRight className="w-4 h-4 text-[#A9421B]" />
          </Link>
        </div>

      </div>
    </div>
  );
}
