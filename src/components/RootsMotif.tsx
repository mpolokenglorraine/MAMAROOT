import React from 'react';
import { cn } from '../lib/utils';

export function RootsDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center my-4 overflow-hidden opacity-70", className)} aria-hidden="true">
      <svg width="180" height="24" viewBox="0 0 180 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M90 0 C90 6 88 12 84 16 C80 20 72 22 60 23" stroke="#3B1409" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M90 0 C90 6 92 12 96 16 C100 20 108 22 120 23" stroke="#3B1409" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M90 0 V18 C90 20 88 22 85 24" stroke="#3B1409" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M90 7 C84 10 76 13 68 15 C60 17 48 18 35 19" stroke="#3B1409" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M90 7 C96 10 104 13 112 15 C120 17 132 18 145 19" stroke="#3B1409" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M78 13 C72 17 64 20 54 22" stroke="#3B1409" strokeWidth="1" strokeLinecap="round" />
        <path d="M102 13 C108 17 116 20 126 22" stroke="#3B1409" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function EmptyStateHeading({ 
  children, 
  title, 
  subtitle, 
  icon: Icon, 
  className 
}: { 
  children?: React.ReactNode; 
  title?: string; 
  subtitle?: string; 
  icon?: React.ComponentType<{ className?: string }>; 
  className?: string; 
}) {
  return (
    <div className={cn("text-center space-y-1.5", className)}>
      {Icon && (
        <div className="w-10 h-10 rounded-full bg-[#F7CCA5] text-[#3B1409] flex items-center justify-center mx-auto mb-2">
          <Icon className="w-5 h-5 text-[#3B1409]" />
        </div>
      )}
      <div className="inline-flex items-center justify-center gap-2">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 -scale-x-100" aria-hidden="true">
          <path d="M2 14 C4 9 9 4 14 2 C12 7 7 12 2 14 Z" fill="#5E5A28" />
          <path d="M2 14 C7 10 10 7 14 2" stroke="#FFF9F2" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
        <h3 className="text-sm font-bold text-[#3B1409] font-heading">{title || children}</h3>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
          <path d="M2 14 C4 9 9 4 14 2 C12 7 7 12 2 14 Z" fill="#5E5A28" />
          <path d="M2 14 C7 10 10 7 14 2" stroke="#FFF9F2" strokeWidth="0.8" strokeLinecap="round" />
        </svg>
      </div>
      {subtitle && <p className="text-xs text-[#6B4A3A] max-w-sm mx-auto">{subtitle}</p>}
    </div>
  );
}

export function LeafSprigHeader({ className }: { className?: string }) {
  return (
    <div 
      className={cn("absolute -top-2 -right-2 w-28 h-28 pointer-events-none overflow-hidden select-none z-0", className)}
      style={{ opacity: 0.28 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <path d="M96 4 C76 24 50 56 12 94" stroke="#6DB04F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M80 18 C65 10 56 20 62 30 C74 30 82 24 80 18 Z" fill="#6DB04F" />
        <path d="M66 38 C52 30 42 40 48 50 C60 50 68 44 66 38 Z" fill="#6DB04F" />
        <path d="M50 58 C36 50 26 60 32 70 C44 70 52 64 50 58 Z" fill="#6DB04F" />
        <path d="M84 32 C94 42 84 52 74 46 C74 36 82 30 84 32 Z" fill="#6DB04F" />
        <path d="M70 52 C80 62 70 72 60 66 C60 56 68 50 70 52 Z" fill="#6DB04F" />
      </svg>
    </div>
  );
}

export function LeafSprigMargin({ 
  position = 'right', 
  className 
}: { 
  position?: 'left' | 'right'; 
  className?: string 
}) {
  return (
    <div 
      className={cn(
        "pointer-events-none select-none my-3 flex items-center overflow-hidden",
        position === 'left' ? "justify-start" : "justify-end",
        className
      )}
      style={{ opacity: 0.28 }}
      aria-hidden="true"
    >
      <svg 
        viewBox="0 0 80 28" 
        fill="none" 
        className={cn("w-20 h-7", position === 'left' && "-scale-x-100")}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 24 C24 20 44 14 74 4" stroke="#6DB04F" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 18 C16 12 12 16 16 21 C22 22 25 19 22 18 Z" fill="#6DB04F" />
        <path d="M38 14 C32 8 28 12 32 17 C38 18 41 15 38 14 Z" fill="#6DB04F" />
        <path d="M54 9 C48 3 44 7 48 12 C54 13 57 10 54 9 Z" fill="#6DB04F" />
        <path d="M32 15 C38 11 42 15 39 20 C33 20 30 17 32 15 Z" fill="#6DB04F" />
        <path d="M48 10 C54 6 58 10 55 15 C49 15 46 12 48 10 Z" fill="#6DB04F" />
      </svg>
    </div>
  );
}
