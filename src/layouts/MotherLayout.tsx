import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, CalendarDays, History, Stethoscope, Leaf, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useT } from '../i18n/useT';
import LeafBackground from '../components/LeafBackground';

export default function MotherLayout() {
  const { t } = useT();

  const navTabs = [
    { to: '/mother-dashboard', icon: Home, label: t('nav_today') || 'Today', end: true },
    { to: '/calendar', icon: CalendarDays, label: 'Calendar', end: false },
    { to: '/story', icon: History, label: t('nav_story') || 'Story', end: false },
    { to: '/doctor', icon: Stethoscope, label: t('nav_doctor') || 'Doctor', end: false },
    { to: '/culture', icon: Leaf, label: t('nav_culture') || 'Culture', end: false },
  ];

  return (
    <div className="min-h-screen bg-[#FFF9F2] text-[#3B1409] flex flex-col font-sans relative">
      {/* Decorative quiet leaf background */}
      <LeafBackground />

      {/* Mobile-first centered single column container */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col relative px-4 pt-3 pb-28 z-10">
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Fixed Bottom Tab Bar */}
      <nav 
        aria-label="Main Navigation"
        className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EAD5C0] shadow-[0_-2px_12px_rgba(59,20,9,0.04)]"
      >
        <div className="relative max-w-md mx-auto px-1 h-16 flex items-center justify-around">
          
          {/* Round floating '+' button in the centre, sitting above the bar, with soft Peach ring */}
          <NavLink
            to="/tracker"
            aria-label="Log symptoms and check-in"
            className={({ isActive }) => cn(
              "absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-[#A9421B] text-white flex items-center justify-center shadow-md border-2 border-white ring-4 ring-[#F7CCA5]/60 hover:bg-[#833518] active:scale-95 transition-all z-50 focus-ring",
              isActive && "ring-[#A9421B] bg-[#833518]"
            )}
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </NavLink>

          {/* 5 Bottom Tabs */}
          {navTabs.map((tab, idx) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-1 rounded-2xl transition-colors focus-ring",
                idx === 2 ? "pt-2" : "", // Slight top breathing room for middle tab under floating button
                isActive 
                  ? "text-[#2F6B3F] font-bold" 
                  : "text-[#6B4A3A] font-normal hover:text-[#2F6B3F]"
              )}
            >
              {({ isActive }) => (
                <>
                  <tab.icon 
                    className={cn(
                      "w-5 h-5 mb-0.5 shrink-0 transition-transform", 
                      isActive ? "text-[#2F6B3F] stroke-[2.4]" : "text-[#6B4A3A] stroke-[1.8]"
                    )} 
                  />
                  <span className="text-[10px] leading-tight tracking-tight">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
