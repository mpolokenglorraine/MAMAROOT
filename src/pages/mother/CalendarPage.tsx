import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  AlertCircle, 
  X,
  Droplet,
  Activity,
  CalendarCheck
} from 'lucide-react';
import { supabase, Appointment, Symptom, PeriodLog } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';
import { evaluateCycle, parseDateOnly, CycleEngineResult } from '../../lib/cycleEngine';
import { LeafSprigHeader } from '../../components/RootsMotif';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CalendarPage() {
  const { profile, refetchProfile } = useAuth();
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [periods, setPeriods] = useState<PeriodLog[]>([]);
  const [cycleResult, setCycleResult] = useState<CycleEngineResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Appointment Form Modal state
  const [showApptModal, setShowApptModal] = useState(false);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);
  const [apptTitle, setApptTitle] = useState('');
  const [apptDoctorName, setApptDoctorName] = useState('');
  const [apptDateTime, setApptDateTime] = useState('');
  const [apptNotes, setApptNotes] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);
  const [apptError, setApptError] = useState<string | null>(null);

  // Quick feedback toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadCalendarData();
    }
  }, [profile?.id]);

  async function loadCalendarData() {
    try {
      setLoading(true);
      const [apptRes, sympRes, periodRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*')
          .eq('user_id', profile!.id)
          .order('date', { ascending: true }),
        supabase
          .from('symptoms')
          .select('*')
          .eq('user_id', profile!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('period_logs')
          .select('*')
          .eq('user_id', profile!.id)
          .order('start_date', { ascending: true })
      ]);

      const loadedAppts = apptRes.data || [];
      const loadedSymps = sympRes.data || [];
      const loadedPeriods = periodRes.data || [];

      setAppointments(loadedAppts);
      setSymptoms(loadedSymps);
      setPeriods(loadedPeriods);

      // Evaluate cycle engine
      const result = evaluateCycle(loadedPeriods, profile);
      setCycleResult(result);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // Month navigation
  function prevMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToToday() {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDateStr(now.toISOString().split('T')[0]);
  }

  // Days in month calculation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  // Build grid days array
  const gridCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const dStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    gridCells.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: true });
  }

  // Next month leading days to complete row of 7
  const remainingCells = 7 - (gridCells.length % 7);
  if (remainingCells < 7) {
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      gridCells.push({ dateStr: dStr, dayNumber: d, isCurrentMonth: false });
    }
  }

  // Helper check: Period day
  function isPeriodDay(dateStr: string): boolean {
    const checkTime = parseDateOnly(dateStr).getTime();
    for (const p of periods) {
      if (!p.start_date) continue;
      const startTime = parseDateOnly(p.start_date).getTime();
      let endTime = startTime;
      if (p.end_date) {
        endTime = parseDateOnly(p.end_date).getTime();
      } else {
        // Default to period_length_days (or 5 days) if no end_date specified
        const len = profile?.period_length_days || 5;
        endTime = startTime + (len - 1) * 24 * 60 * 60 * 1000;
      }
      if (checkTime >= startTime && checkTime <= endTime) {
        return true;
      }
    }
    return false;
  }

  // Helper check: Predicted period range (dashed Berry)
  function isPredictedPeriodDay(dateStr: string): boolean {
    if (!cycleResult || cycleResult.isSuppressed || !cycleResult.expectedStartDate || !cycleResult.expectedEndDate) {
      return false;
    }
    return dateStr >= cycleResult.expectedStartDate && dateStr <= cycleResult.expectedEndDate;
  }

  // Helper check: Has symptoms
  function hasSymptomsOnDay(dateStr: string): boolean {
    return symptoms.some(s => s.created_at && s.created_at.split('T')[0] === dateStr);
  }

  // Helper check: Has appointments
  function hasAppointmentsOnDay(dateStr: string): boolean {
    return appointments.some(a => a.date && a.date.split('T')[0] === dateStr);
  }

  // Selected Day items
  const daySymptoms = symptoms.filter(s => s.created_at && s.created_at.split('T')[0] === selectedDateStr);
  const dayAppointments = appointments.filter(a => a.date && a.date.split('T')[0] === selectedDateStr);
  const isSelectedPeriod = isPeriodDay(selectedDateStr);

  // Button 1: 'Period started here'
  async function handlePeriodStartedHere() {
    if (!profile?.id) return;
    try {
      const { error } = await supabase.from('period_logs').insert({
        user_id: profile.id,
        start_date: selectedDateStr
      });
      if (error) throw error;

      await supabase
        .from('users')
        .update({ last_period_date: selectedDateStr })
        .eq('id', profile.id);

      await refetchProfile();
      showToast(`Period start recorded for ${formatDate(selectedDateStr)}`);
      loadCalendarData();
    } catch (err) {
      console.error('Error logging period start:', err);
      showToast('Could not record period start.');
    }
  }

  // Button 2: 'Log symptoms'
  function handleLogSymptomsHere() {
    navigate(`/tracker?date=${selectedDateStr}`);
  }

  // Button 3: 'Add appointment'
  function openAddApptForm() {
    setEditingApptId(null);
    setApptTitle('');
    setApptDoctorName('');
    // Default to selected date at 09:00
    setApptDateTime(`${selectedDateStr}T09:00`);
    setApptNotes('');
    setApptError(null);
    setShowApptModal(true);
  }

  function openEditApptForm(appt: Appointment) {
    setEditingApptId(appt.id);
    setApptTitle(appt.title);
    setApptDoctorName(appt.doctor_name || '');
    // Ensure ISO format or slice to YYYY-MM-DDTHH:mm
    const dt = appt.date ? appt.date.slice(0, 16) : `${selectedDateStr}T09:00`;
    setApptDateTime(dt);
    setApptNotes(appt.description || '');
    setApptError(null);
    setShowApptModal(true);
  }

  async function handleSaveAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id || !apptTitle.trim()) return;

    try {
      setSavingAppt(true);
      setApptError(null);

      const payload = {
        user_id: profile.id,
        title: apptTitle.trim(),
        doctor_name: apptDoctorName.trim() || null,
        date: apptDateTime || `${selectedDateStr}T09:00:00`,
        description: apptNotes.trim() || null,
      };

      if (editingApptId) {
        const { error } = await supabase
          .from('appointments')
          .update(payload)
          .eq('id', editingApptId);
        if (error) throw error;
        showToast('Appointment updated.');
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(payload);
        if (error) throw error;
        showToast('Appointment added.');
      }

      setShowApptModal(false);
      loadCalendarData();
    } catch (err) {
      console.error('Error saving appointment:', err);
      setApptError('Could not save appointment. Please try again.');
    } finally {
      setSavingAppt(false);
    }
  }

  async function handleDeleteAppointment(id: string) {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
      showToast('Appointment deleted.');
      if (editingApptId === id) setShowApptModal(false);
      loadCalendarData();
    } catch (err) {
      console.error('Error deleting appointment:', err);
      showToast('Could not delete appointment.');
    }
  }

  // Upcoming appointments list: today and future
  const upcomingAppointments = appointments
    .filter(a => a.date && a.date.split('T')[0] >= todayStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#3B1409] text-white px-4 py-2 rounded-2xl text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-[#F7CCA5]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="relative pt-1 overflow-hidden">
        <LeafSprigHeader />
        <h1 className="text-2xl font-bold font-serif text-[#3B1409] relative z-10">Calendar</h1>
        <p className="text-sm text-[#6B4A3A] mt-1 relative z-10">
          Review your cycle days, logged symptoms, and scheduled appointments.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. MONTH CALENDAR VIEW */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#EAD5C0] rounded-3xl p-4 shadow-xs space-y-4">
        {/* Month Title & Prev/Next Buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-semibold text-[#A9421B] bg-[#F6E7D8]/80 hover:bg-[#F6E7D8] px-2.5 py-1.5 rounded-xl border border-[#EAD5C0] transition-colors focus-ring"
            >
              Today
            </button>
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 rounded-xl border border-[#EAD5C0] flex items-center justify-center text-[#3B1409] hover:bg-[#F6E7D8] transition-colors focus-ring"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 rounded-xl border border-[#EAD5C0] flex items-center justify-center text-[#3B1409] hover:bg-[#F6E7D8] transition-colors focus-ring"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-[#6B4A3A] pt-1 border-t border-[#EAD5C0]/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#A9421B] inline-block" />
            <span>Period day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-[#833518] bg-[#F7CCA5]/20 inline-block" />
            <span>Predicted range</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#833518] inline-block" />
            <span>Symptoms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#3B1409] inline-block" />
            <span>Appointment</span>
          </div>
        </div>

        {/* Weekday Labels (Mon - Sun) */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-[#6B4A3A] pb-1">
          {WEEKDAYS.map(w => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {gridCells.map((cell) => {
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDateStr;
            const isPeriod = isPeriodDay(cell.dateStr);
            const isPredicted = !isPeriod && isPredictedPeriodDay(cell.dateStr);
            const hasSymp = hasSymptomsOnDay(cell.dateStr);
            const hasAppt = hasAppointmentsOnDay(cell.dateStr);

            return (
              <button
                key={cell.dateStr}
                type="button"
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={cn(
                  "h-12 rounded-2xl flex flex-col items-center justify-between p-1 transition-all relative focus-ring",
                  !cell.isCurrentMonth && "opacity-30",
                  isPeriod
                    ? "bg-[#A9421B] text-white font-bold"
                    : isPredicted
                    ? "border-2 border-dashed border-[#833518] text-[#833518] bg-[#F7CCA5]/20 font-semibold"
                    : "bg-[#FFF9F2] text-[#3B1409] border border-[#EAD5C0]/80 hover:border-[#A9421B]",
                  isSelected && !isPeriod && "ring-2 ring-[#A9421B] bg-white shadow-xs",
                  isSelected && isPeriod && "ring-2 ring-[#3B1409] ring-offset-1"
                )}
              >
                {/* Day number (Today is Root Brown circle with white number) */}
                {isToday && !isPeriod ? (
                  <span className="w-5 h-5 rounded-full bg-[#3B1409] text-white flex items-center justify-center font-bold text-[11px] leading-none mt-0.5 shadow-2xs">
                    {cell.dayNumber}
                  </span>
                ) : (
                  <span className={cn(
                    "text-xs leading-none mt-0.5",
                    isPeriod && "text-white font-bold"
                  )}>
                    {cell.dayNumber}
                  </span>
                )}

                {/* Markers indicator row */}
                <div className="flex items-center justify-center gap-1 w-full pb-0.5 min-h-[6px]">
                  {/* Dot for symptoms (Clay #833518) */}
                  {hasSymp && (
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      isPeriod ? "bg-white" : "bg-[#833518]"
                    )} />
                  )}

                  {/* Ring for appointments (Root Brown #3B1409) */}
                  {hasAppt && (
                    <span className={cn(
                      "w-2 h-2 rounded-full border-2 shrink-0",
                      isPeriod ? "border-white bg-white/40" : "border-[#3B1409] bg-[#3B1409]/20"
                    )} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAPPED DAY DETAILS SHEET */}
      {/* ========================================================================= */}
      <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#EAD5C0] pb-2">
          <div>
            <span className="text-[10px] font-bold text-[#A9421B] uppercase tracking-wider block">
              Day details
            </span>
            <h2 className="text-base font-bold font-serif text-[#3B1409]">
              {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h2>
          </div>
          {isSelectedPeriod && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#A9421B] text-white">
              Period day
            </span>
          )}
        </div>

        {/* Symptoms on this day */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#3B1409] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#A9421B]" />
            <span>Symptoms logged ({daySymptoms.length})</span>
          </span>

          {daySymptoms.length > 0 ? (
            <div className="space-y-2">
              {daySymptoms.map(s => (
                <div key={s.id} className="bg-white p-3 rounded-2xl border border-[#EAD5C0] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#3B1409]">{s.type}</span>
                    {s.notes && (
                      <p className="text-[11px] text-[#6B4A3A] italic mt-0.5">"{s.notes}"</p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F6E7D8] text-[#3B1409]">
                    Level {s.severity}/10
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic bg-white/70 p-3 rounded-2xl border border-[#EAD5C0]">
              No symptoms logged for this day.
            </p>
          )}
        </div>

        {/* Appointments on this day */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#3B1409] uppercase tracking-wider flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-[#A9421B]" />
            <span>Appointments ({dayAppointments.length})</span>
          </span>

          {dayAppointments.length > 0 ? (
            <div className="space-y-2">
              {dayAppointments.map(a => (
                <div key={a.id} className="bg-white p-3.5 rounded-2xl border border-[#EAD5C0] space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold font-serif text-[#3B1409]">{a.title}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditApptForm(a)}
                        className="p-1.5 text-[#6B4A3A] hover:text-[#3B1409] rounded-lg hover:bg-[#F6E7D8]"
                        title="Edit appointment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAppointment(a.id)}
                        className="p-1.5 text-[#6B4A3A] hover:text-red-700 rounded-lg hover:bg-red-50"
                        title="Delete appointment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {a.doctor_name && (
                    <p className="text-[#A9421B] font-medium">{a.doctor_name}</p>
                  )}
                  <p className="text-[11px] text-[#6B4A3A] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#A9421B]" />
                    <span>{new Date(a.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                  {a.description && (
                    <p className="text-[11px] text-[#6B4A3A] italic pt-0.5">"{a.description}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#6B4A3A] italic bg-white/70 p-3 rounded-2xl border border-[#EAD5C0]">
              No appointments on this day.
            </p>
          )}
        </div>

        {/* 3 Action Buttons */}
        <div className="pt-2 border-t border-[#EAD5C0] grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Button 1: Period started here */}
          <button
            type="button"
            onClick={handlePeriodStartedHere}
            className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#A9421B] text-xs font-bold text-[#A9421B] hover:bg-[#F6E7D8] transition-colors flex items-center justify-center gap-1.5 focus-ring shadow-2xs"
          >
            <Droplet className="w-3.5 h-3.5 fill-current" />
            <span>Period started here</span>
          </button>

          {/* Button 2: Log symptoms */}
          <button
            type="button"
            onClick={handleLogSymptomsHere}
            className="w-full py-2.5 px-3 rounded-2xl bg-white border border-[#EAD5C0] text-xs font-bold text-[#3B1409] hover:bg-[#F6E7D8] transition-colors flex items-center justify-center gap-1.5 focus-ring shadow-2xs"
          >
            <Activity className="w-3.5 h-3.5 text-[#A9421B]" />
            <span>Log symptoms</span>
          </button>

          {/* Button 3: Add appointment */}
          <button
            type="button"
            onClick={openAddApptForm}
            className="btn-primary w-full !min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5 text-white" />
            <span>Add appointment</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. UPCOMING APPOINTMENTS SECTION UNDER CALENDAR */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#6B4A3A] uppercase tracking-wider">
            Upcoming Appointments
          </h2>
          <button
            type="button"
            onClick={openAddApptForm}
            className="text-xs font-semibold text-[#A9421B] hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New visit</span>
          </button>
        </div>

        {upcomingAppointments.length > 0 ? (
          <div className="space-y-2.5">
            {upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white border border-[#EAD5C0] rounded-3xl p-4 shadow-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold font-serif text-[#3B1409] leading-snug">
                      {appt.title}
                    </h3>
                    {appt.doctor_name && (
                      <p className="text-xs font-medium text-[#A9421B]">
                        {appt.doctor_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditApptForm(appt)}
                      className="p-1.5 text-[#6B4A3A] hover:text-[#3B1409] rounded-xl hover:bg-[#F6E7D8] transition-colors"
                      title="Edit appointment"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAppointment(appt.id)}
                      className="p-1.5 text-[#6B4A3A] hover:text-red-700 rounded-xl hover:bg-red-50 transition-colors"
                      title="Delete appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#6B4A3A] font-medium pt-1 border-t border-[#EAD5C0]/60">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#A9421B]" />
                    <span>{new Date(appt.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#A9421B]" />
                    <span>{new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                {appt.description && (
                  <p className="text-xs text-[#3B1409] bg-[#FFF9F2] p-2.5 rounded-2xl border border-[#EAD5C0]/80 italic">
                    "{appt.description}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#EAD5C0] rounded-3xl p-6 text-center space-y-2">
            <CalendarCheck className="w-8 h-8 text-[#F7CCA5] mx-auto" />
            <p className="text-xs text-[#6B4A3A]">
              No upcoming appointments. Tap a day on the calendar or "New visit" to add one.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* APPOINTMENT FORM MODAL (Add / Edit) */}
      {/* ========================================================================= */}
      {showApptModal && (
        <div 
          className="fixed inset-0 z-50 bg-[#3B1409]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#FFF9F2] border border-[#EAD5C0] rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAD5C0]">
              <h2 className="text-base font-bold font-serif text-[#3B1409]">
                {editingApptId ? 'Edit appointment' : 'Add appointment'}
              </h2>
              <button
                type="button"
                onClick={() => setShowApptModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B4A3A] hover:bg-[#F6E7D8] focus-ring"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {apptError && (
              <div className="p-3 bg-[#F8DFC8] border border-[#E0A77A] text-[#7A2E10] text-xs font-semibold rounded-2xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{apptError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAppointment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder="e.g. Antenatal checkup, Pelvic scan, Gynae consultation"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-2xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                  Doctor or clinic name
                </label>
                <input
                  type="text"
                  value={apptDoctorName}
                  onChange={(e) => setApptDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Mthembu, Johannesburg Central Clinic"
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-2xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={apptDateTime}
                  onChange={(e) => setApptDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#EAD5C0] rounded-2xl outline-none focus-ring text-[#3B1409]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3B1409] uppercase tracking-wider mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={apptNotes}
                  onChange={(e) => setApptNotes(e.target.value)}
                  placeholder="Instructions to bring files, fasting requirements, questions to ask..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#EAD5C0] rounded-2xl outline-none focus-ring text-[#3B1409] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowApptModal(false)}
                  className="btn-secondary flex-1 text-xs py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAppt || !apptTitle.trim()}
                  className="btn-primary flex-1 text-xs py-2.5"
                >
                  {savingAppt ? 'Saving...' : editingApptId ? 'Update' : 'Save appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
