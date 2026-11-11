import React from 'react';
import { Sparkles, HeartHandshake, ShieldCheck, AlertCircle } from 'lucide-react';
import { RootsDivider, LeafSprigHeader } from '../../components/RootsMotif';

export default function CulturePage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="relative pt-1 overflow-hidden">
        <LeafSprigHeader />
        <h1 className="text-2xl font-bold font-serif text-[#3B1409] relative z-10">Culture</h1>
        <p className="text-sm text-[#6B4A3A] mt-1 font-sans relative z-10">
          Bridging African maternal wisdom, generational practices, and clinical evidence.
        </p>
      </div>

      {/* Immediate Baby Safety Alert */}
      <div className="bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] rounded-3xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-9 h-9 rounded-full bg-[#F7CCA5] flex items-center justify-center shrink-0 text-[#3B1409] mt-0.5">
          <AlertCircle className="w-5 h-5 text-[#7A2E10]" />
        </div>
        <div className="text-xs space-y-0.5">
          <p className="font-bold text-[#7A2E10] uppercase tracking-wider text-[11px]">Emergency Health Caution</p>
          <p className="font-semibold text-[#7A2E10] leading-relaxed">
            Baby with a fever or trouble breathing? Go to a clinic or hospital now.
          </p>
        </div>
      </div>

      {/* Coming Soon Highlight Card */}
      <div className="bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] rounded-3xl p-5 space-y-2.5 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409]">
            <Sparkles className="w-4 h-4 text-[#7A2E10]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#7A2E10]">Traditional Wisdom & Safety</span>
        </div>
        <p className="text-sm leading-relaxed font-medium">
          A dedicated repository celebrating cultural practices, indigenous botanical knowledge, and traditional postpartum rituals verified for maternal safety.
        </p>
      </div>

      {/* Culture Pillars preview */}
      <div className="bg-white border border-[#EAD5C0] rounded-3xl p-5 space-y-3.5 shadow-xs">
        <h2 className="text-sm font-bold font-serif text-[#3B1409]">Our Cultural Commitments</h2>
        <div className="space-y-3 text-xs text-[#6B4A3A]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409] shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4 text-[#3B1409]" />
            </div>
            <span className="leading-relaxed">Honoring traditional nourishment remedies like soups, broths, and herbs safely.</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F7CCA5] flex items-center justify-center text-[#3B1409] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-[#3B1409]" />
            </div>
            <span className="leading-relaxed">Clear safety guidance on which practices nurture you and which need clinical caution.</span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <RootsDivider />
      </div>
    </div>
  );
}
