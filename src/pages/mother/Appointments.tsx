import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  Plus
} from 'lucide-react';
import { supabase, Appointment } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate } from '../../lib/utils';

export default function Appointments() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (profile?.id) {
      fetchAppointments();
    }
  }, [profile?.id]);

  async function fetchAppointments() {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', profile?.id)
        .order('date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('appointments').insert({
        user_id: profile?.id,
        doctor_name: doctorName.trim() || null,
        title: title.trim(),
        date,
        description: description.trim() || null,
      });

      if (error) throw error;
      
      setTitle('');
      setDoctorName('');
      setDate('');
      setDescription('');
      setShowAdd(false);
      fetchAppointments();
    } catch (err) {
      console.error('Error adding appointment:', err);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between pb-4 border-b border-[#E6D5CB]">
        <div>
          <h1 className="text-2xl font-bold text-[#572D43]">Appointments</h1>
          <p className="text-xs text-[#65515A]">Schedule and track your care visits</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-secondary !h-10 !min-h-[40px] !w-auto px-4 text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Visit</span>
        </button>
      </header>

      {showAdd && (
        <div className="bg-white border border-[#E6D5CB] rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#572D43]">New Appointment</h2>
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Visit Title</label>
              <input 
                type="text" 
                placeholder="e.g. Antenatal Checkup"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Doctor or clinic name</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. A. Adeyemi"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Date and time</label>
              <input 
                type="datetime-local" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Notes</label>
              <textarea 
                placeholder="Questions to ask..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24] resize-none"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary !h-10 !min-h-[40px] !w-auto px-4 text-xs">Cancel</button>
              <button type="submit" className="btn-primary !h-10 !min-h-[40px] !w-auto px-6 text-xs">Save</button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-[#65515A]">Loading visits...</div>
        ) : appointments.length > 0 ? (
          appointments.map((appt) => (
            <div key={appt.id} className="bg-white border border-[#E6D5CB] rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#572D43]">{appt.title}</h3>
                  {appt.doctor_name && (
                    <p className="text-xs text-[#914E61] flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{appt.doctor_name}</span>
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-[#572D43] bg-[#F4E8E0] px-2.5 py-1 rounded-lg">
                  {formatDate(appt.date)}
                </span>
              </div>
              {appt.description && (
                <p className="text-xs text-[#65515A] bg-[#FFF9F3] p-2 rounded-lg border border-[#E6D5CB]">
                  {appt.description}
                </p>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6D5CB] space-y-2">
            <CalendarIcon className="w-8 h-8 text-[#D9A7A4] mx-auto" />
            <p className="text-xs text-[#65515A]">No appointments yet. Tap "Add Visit" to schedule one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
