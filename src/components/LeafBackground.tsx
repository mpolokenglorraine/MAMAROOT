import React from 'react';
import { useLocation } from 'react-router-dom';

interface LeafBackgroundProps {
  forceHide?: boolean;
}

export default function LeafBackground({ forceHide = false }: LeafBackgroundProps) {
  const location = useLocation();

  // Hide on dense form pages (Log /tracker) or if forceHide is set (e.g. Calendar day sheet modal)
  const isDensePage = location.pathname.includes('/tracker') || location.pathname.includes('/log') || forceHide;

  if (isDensePage) {
    return null;
  }

  return (
    <div 
      className="leaf-bg-motif no-print fixed inset-0 pointer-events-none overflow-hidden z-0" 
      aria-hidden="true"
    >
      {/* High on the left edge, partly off-screen */}
      <div 
        className="absolute -left-16 top-12 w-[200px] h-[280px] pointer-events-none select-none"
        style={{ opacity: 0.28 }}
      >
        <svg 
          viewBox="0 0 200 280" 
          fill="none" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Curved stem */}
          <path 
            d="M20 270 C35 200 50 120 170 20" 
            stroke="#6DB04F" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          {/* 6 small oval leaves */}
          <path d="M42 225 C32 215 18 212 12 222 C24 232 38 232 42 225 Z" fill="#6DB04F" />
          <path d="M60 190 C72 178 88 182 85 196 C72 196 60 190 60 190 Z" fill="#6DB04F" />
          <path d="M82 150 C70 138 54 142 50 156 C64 156 78 154 82 150 Z" fill="#6DB04F" />
          <path d="M106 116 C120 102 136 108 132 122 C118 122 106 116 106 116 Z" fill="#6DB04F" />
          <path d="M132 78 C120 64 104 68 100 82 C114 82 128 80 132 78 Z" fill="#6DB04F" />
          <path d="M166 32 C176 18 190 26 184 40 C172 40 164 34 166 32 Z" fill="#6DB04F" />
        </svg>
      </div>

      {/* Low on the right edge, just above bottom tab bar, mirrored, partly off-screen */}
      <div 
        className="absolute -right-16 bottom-20 w-[200px] h-[280px] pointer-events-none select-none scale-x-[-1]"
        style={{ opacity: 0.28 }}
      >
        <svg 
          viewBox="0 0 200 280" 
          fill="none" 
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Curved stem */}
          <path 
            d="M20 270 C35 200 50 120 170 20" 
            stroke="#6DB04F" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
          />
          {/* 6 small oval leaves */}
          <path d="M42 225 C32 215 18 212 12 222 C24 232 38 232 42 225 Z" fill="#6DB04F" />
          <path d="M60 190 C72 178 88 182 85 196 C72 196 60 190 60 190 Z" fill="#6DB04F" />
          <path d="M82 150 C70 138 54 142 50 156 C64 156 78 154 82 150 Z" fill="#6DB04F" />
          <path d="M106 116 C120 102 136 108 132 122 C118 122 106 116 106 116 Z" fill="#6DB04F" />
          <path d="M132 78 C120 64 104 68 100 82 C114 82 128 80 132 78 Z" fill="#6DB04F" />
          <path d="M166 32 C176 18 190 26 184 40 C172 40 164 34 166 32 Z" fill="#6DB04F" />
        </svg>
      </div>
    </div>
  );
}
