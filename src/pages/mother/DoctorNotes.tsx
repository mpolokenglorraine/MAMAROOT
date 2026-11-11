import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Pin, 
  Trash2, 
  Plus 
} from 'lucide-react';
import { supabase, DoctorNote } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { formatDate, cn } from '../../lib/utils';

export default function DoctorNotes() {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchNotes();
    }
  }, [profile?.id]);

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('doctor_notes')
        .select('*')
        .eq('patient_id', profile?.id)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.id) return;

    try {
      const { error } = await supabase.from('doctor_notes').insert({
        patient_id: profile.id,
        doctor_name: doctorName.trim() || 'My Care Provider',
        content: content.trim(),
        is_pinned: isPinned,
      });

      if (error) throw error;

      setDoctorName('');
      setContent('');
      setIsPinned(false);
      setShowAdd(false);
      fetchNotes();
    } catch (err) {
      console.error('Error saving doctor note:', err);
    }
  }

  async function togglePin(noteId: string, currentPinned: boolean) {
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .update({ is_pinned: !currentPinned })
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error('Error toggling pin:', err);
    }
  }

  async function deleteNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('doctor_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between pb-4 border-b border-[#E6D5CB]">
        <div>
          <h1 className="text-2xl font-bold text-[#572D43]">What my doctor said</h1>
          <p className="text-xs text-[#65515A]">Personal records of clinician recommendations</p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="btn-secondary !h-10 !min-h-[40px] !w-auto px-4 text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </header>

      {showAdd && (
        <div className="bg-white border border-[#E6D5CB] rounded-2xl p-5 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#572D43]">Record Consultation Note</h2>
          <form onSubmit={handleAddNote} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Doctor or clinic name</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. Sarah Thompson"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                className="w-full px-3.5 py-2.5 min-h-[44px] text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#572D43] mb-1">Advice or instructions</label>
              <textarea 
                placeholder="What did your doctor share?"
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E6D5CB] rounded-xl outline-none focus-ring text-[#2B1A24] resize-none"
                rows={4}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinnedNoteCheck"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-[#572D43] accent-[#572D43]"
              />
              <label htmlFor="pinnedNoteCheck" className="text-xs font-medium text-[#2B1A24]">
                Pin this note to the top
              </label>
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
          <div className="py-6 text-center text-xs text-[#65515A]">Loading notes...</div>
        ) : notes.length > 0 ? (
          notes.map((note) => (
            <div 
              key={note.id} 
              className={cn(
                "bg-white border rounded-2xl p-4 space-y-2",
                note.is_pinned ? "border-[#D9A7A4] bg-[#F4E8E0]/30" : "border-[#E6D5CB]"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#572D43]">{note.doctor_name || 'My Care Provider'}</h3>
                  <p className="text-[11px] text-[#65515A]">{formatDate(note.created_at)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => togglePin(note.id, note.is_pinned)}
                    className="p-1.5 rounded-lg text-[#65515A] hover:bg-[#F4E8E0]"
                  >
                    <Pin className={cn("w-4 h-4", note.is_pinned && "fill-current text-[#572D43]")} />
                  </button>
                  <button 
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-lg text-[#65515A] hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#2B1A24] leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#E6D5CB] space-y-2">
            <FileText className="w-8 h-8 text-[#D9A7A4] mx-auto" />
            <p className="text-xs text-[#65515A]">No notes yet. Tap "Add Note" to record doctor instructions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
