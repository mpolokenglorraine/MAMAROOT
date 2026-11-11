import { createClient } from '@supabase/supabase-js';

let supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Sanitize URL: Strip trailing /rest/v1 or /rest/v1/ if present
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. App may not function correctly.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'mother' | 'doctor';
  avatar_url?: string;
  created_at: string;
  stages?: string[];
  date_of_birth?: string;
  province?: string;
  country?: string;
  cycle_regularity?: string;
  cycle_length_days?: number;
  period_length_days?: number;
  last_period_date?: string;
  pregnancies_count?: number;
  children_count?: number;
  youngest_child_birth_date?: string;
  due_date?: string;
  age_periods_stopped?: number;
  language?: string;
  consent_health_data?: boolean;
  consent_at?: string;
  onboarding_complete?: boolean;
  anonymous_mode?: boolean;
  hide_pregnancy_content?: boolean;
  tracks_periods?: boolean;
};

export type PeriodLog = {
  id?: string;
  user_id: string;
  start_date: string;
  end_date?: string | null;
  flow?: string | null;
  notes?: string | null;
  created_at?: string;
};

export type Pregnancy = {
  id?: string;
  user_id: string;
  due_date?: string | null;
  last_period_date?: string | null;
  risk_tags?: string[] | null;
  status?: string;
  created_at?: string;
};

export type PregnancyLog = {
  id?: string;
  user_id: string;
  pregnancy_id?: string | null;
  tags?: string[] | null;
  tag?: string | null;
  severity?: number | null;
  notes?: string | null;
  note?: string | null;
  created_at?: string;
};

export type PregnancyContent = {
  id?: string;
  week_from: number;
  week_to: number;
  title: string;
  body?: string;
  content?: string;
  risk_tags?: string[] | null;
  reviewed_by: string;
  trimester?: number | string | null;
};

export type LifeStageContent = {
  id?: string;
  stage: string;
  age_from_days: number;
  age_to_days: number;
  title: string;
  body?: string;
  content?: string;
  reviewed_by: string;
  evidence_tag?: string;
  evidence_level?: string;
};

export type UserCondition = {
  id?: string;
  user_id: string;
  condition: string;
  status: string;
  diagnosed_year?: number | null;
  created_at?: string;
};

export type HealthEvent = {
  id?: string;
  user_id: string;
  title: string;
  event_type: string;
  status: string;
  loss_type?: string;
  event_date?: string;
  notes?: string;
  details?: any;
  created_at?: string;
};

export type Symptom = {
  id: string;
  user_id: string;
  type: string;
  severity: number;
  notes?: string;
  created_at: string;
};

export type HealthDocument = {
  id?: string;
  user_id: string;
  title: string;
  document_type: string; // 'Scan' | 'Blood test' | 'Discharge summary' | 'Prescription' | 'Other'
  type?: string;
  document_date: string; // YYYY-MM-DD
  file_path: string; // {user id}/{random uuid}-{original file name}
  file_name: string;
  file_size?: number;
  mime_type?: string;
  health_event_id?: string | null;
  created_at?: string;
};

export type Reminder = {
  id?: string;
  user_id: string;
  title: string;
  type: 'Medication' | 'Appointment' | 'Log my symptoms' | 'Other' | string;
  time: string; // "HH:mm" (24-hour)
  weekdays: string[]; // ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  is_enabled: boolean;
  created_at?: string;
};

export type CultureEntry = {
  id: string;
  name: string;
  alt_names?: string[] | null;
  category?: string;
  description?: string;
  safety_guidance?: string;
  traditional_use?: string;
  reviewed_by?: string;
  language?: string;
  created_at?: string;
};

export type CultureEntryTranslation = {
  id: string;
  entry_id: string;
  language: string;
  name?: string | null;
  alt_names?: string[] | null;
  description?: string | null;
  safety_guidance?: string | null;
  traditional_use?: string | null;
  created_at?: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  doctor_name?: string;
  title: string;
  date: string;
  description?: string;
  created_at: string;
};

export type DoctorNote = {
  id: string;
  patient_id: string;
  doctor_name?: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

export type CommunityPost = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: Profile;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  users?: Profile;
};
