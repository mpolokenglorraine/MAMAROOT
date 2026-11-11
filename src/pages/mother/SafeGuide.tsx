import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Utensils, 
  Moon, 
  Activity, 
  Pill, 
  Heart,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function SafeGuide() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const guides = [
    {
      title: 'Nourishing Foods',
      icon: Utensils,
      description: 'Wholesome nutrition and foods to enjoy or handle with care.',
      recommended: [
        'Dark leafy greens (spinach, moringa, callaloo)',
        'Whole grains, millet, and brown rice',
        'Well-cooked beans, lentils, and lean proteins',
        'Plenty of clean water and warm herbal infusions'
      ],
      caution: [
        'Raw or undercooked meat, poultry, and eggs',
        'Unpasteurized dairy products',
        'High-mercury predatory fish'
      ]
    },
    {
      title: 'Rest & Sleep Support',
      icon: Moon,
      description: 'Positions and daily rhythms that support circulation and ease.',
      recommended: [
        'Side sleeping (especially left side) to promote blood flow',
        'Pillow support between knees and under tummy',
        'Wind-down routine with dim lighting and calm hydration'
      ],
      caution: [
        'Prolonged flat back-sleeping during later pregnancy trimesters'
      ]
    },
    {
      title: 'Gentle Movement & Exercise',
      icon: Activity,
      description: 'Low-impact movement to ease pelvic tension and preserve stamina.',
      recommended: [
        'Daily brisk walking in comfortable footwear',
        'Pelvic floor gentle strengthening and release',
        'Prenatal stretching and deep diaphragmatic breathing'
      ],
      caution: [
        'Contact sports or activities with fall risks',
        'Straining or holding your breath during exertion'
      ]
    },
    {
      title: 'Medication & Remedies',
      icon: Pill,
      description: 'Always check with your care provider before taking supplements.',
      recommended: [
        'Prescribed prenatal vitamins with folate and iron',
        'Supplements approved by your doctor or midwife'
      ],
      caution: [
        'Unverified herbal teas without clinical clearance',
        'Over-the-counter NSAIDs (unless specifically directed by doctor)'
      ]
    },
    {
      title: 'Cultural Care & Rituals',
      icon: Heart,
      description: 'Harmonizing traditional maternal wisdom with evidence-informed care.',
      recommended: [
        'Warm bone broths and ginger-infused postpartum soups',
        'Gentle belly binding when clinically healed and approved',
        'Loving family support and community rest periods'
      ],
      caution: [
        'Harsh cleansing concoctions or restrictive fasting'
      ]
    }
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-[#572D43]">Safe Guide</h1>
        <p className="text-sm text-[#65515A] mt-1">
          Evidence-informed daily guidance and maternal safety practices.
        </p>
      </div>

      <div className="space-y-3">
        {guides.map((guide, idx) => {
          const Icon = guide.icon;
          const isExpanded = expandedIndex === idx;

          return (
            <div 
              key={guide.title}
              className="bg-white border border-[#E6D5CB] rounded-2xl p-4 shadow-xs space-y-3"
            >
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between text-left focus-ring"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4E8E0] text-[#572D43] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#914E61]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#572D43]">{guide.title}</h3>
                    <p className="text-xs text-[#65515A] line-clamp-1">{guide.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[#65515A]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#65515A]" />
                )}
              </button>

              {isExpanded && (
                <div className="pt-2 border-t border-[#E6D5CB] space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-[#572D43] block mb-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#914E61]" />
                      <span>Recommended Practices</span>
                    </span>
                    <ul className="space-y-1 pl-5 list-disc text-[#65515A]">
                      {guide.recommended.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {guide.caution.length > 0 && (
                    <div className="pt-1">
                      <span className="font-bold text-[#6B2F3C] block mb-1.5 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#914E61]" />
                        <span>Things to Approach with Care</span>
                      </span>
                      <ul className="space-y-1 pl-5 list-disc text-[#65515A]">
                        {guide.caution.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
