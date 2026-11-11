import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'default' | 'light' | 'compact';
  subtitle?: string;
}

export function MamaRootEmblem({ className, size = 32, isLight }: { className?: string; size?: number | string; isLight?: boolean }) {
  return (
    <img 
      src="/logo.png" 
      alt="Mama Root logo: a mother holding her child, with roots below" 
      style={{ width: size, height: 'auto', maxHeight: size }}
      className={cn("object-contain", className)}
    />
  );
}

export function Logo({ 
  className, 
  iconOnly = false, 
  variant = 'default',
  subtitle = "The Mother's Guide • The Doctor's Assistant"
}: LogoProps) {
  const isLight = variant === 'light';

  return (
    <div className={cn("flex items-center gap-3 group select-none", className)}>
      {/* Brand Icon Mark */}
      <img 
        src="/logo.png" 
        alt="Mama Root logo: a mother holding her child, with roots below" 
        className="w-10 h-10 object-contain shrink-0"
      />
      
      {!iconOnly && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "text-xl font-bold tracking-tight font-serif leading-tight",
              isLight ? "text-white" : "text-[#3B1409]"
            )}>
              Mama<span className={isLight ? "text-[#F7CCA5]" : "text-[#A9421B]"}>Root</span>
            </span>
            <span className={cn(
              "text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full",
              isLight ? "bg-white/10 text-[#F6E7D8]" : "bg-[#F6E7D8] text-[#3B1409]"
            )}>
              Care
            </span>
          </div>
          {variant !== 'compact' && (
            <span className={cn(
              "text-[10px] font-medium tracking-tight truncate",
              isLight ? "text-white/70" : "text-[#6B4A3A]"
            )}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default Logo;
