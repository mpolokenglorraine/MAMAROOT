-- ENABLE RLS
alter table public.users enable row level security;
alter table public.symptoms enable row level security;
alter table public.appointments enable row level security;
alter table public.doctor_notes enable row level security;
alter table public.community_posts enable row level security;

-- =========================
-- TRIGGER: Handle New Users
-- =========================

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'mother')
  );
  return new;
end;
$$;

-- Trigger to execute the function on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================
-- USERS
-- =========================

drop policy if exists "Public profiles are viewable by everyone" on public.users;
create policy "Public profiles are viewable by everyone"
on public.users
for select
using (true);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================
-- SYMPTOMS
-- =========================

drop policy if exists "Users can manage own symptoms" on public.symptoms;
create policy "Users can manage own symptoms"
on public.symptoms
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- APPOINTMENTS
-- =========================

drop policy if exists "Users can manage own appointments" on public.appointments;
create policy "Users can manage own appointments"
on public.appointments
for all
to authenticated
using (auth.uid() = patient_id)
with check (auth.uid() = patient_id);

-- =========================
-- DOCTOR NOTES
-- =========================

drop policy if exists "Doctor notes viewable by patient and doctor" on public.doctor_notes;
create policy "Doctor notes viewable by patient and doctor"
on public.doctor_notes
for select
to authenticated
using (
  auth.uid() = patient_id
  or
  auth.uid() = doctor_id
);

drop policy if exists "Doctors can insert notes" on public.doctor_notes;
create policy "Doctors can insert notes"
on public.doctor_notes
for insert
to authenticated
with check (auth.uid() = doctor_id);

-- =========================
-- COMMUNITY POSTS
-- =========================

drop policy if exists "Community posts viewable by everyone" on public.community_posts;
create policy "Community posts viewable by everyone"
on public.community_posts
for select
using (true);

drop policy if exists "Users can insert community posts" on public.community_posts;
create policy "Users can insert community posts"
on public.community_posts
for insert
to authenticated
with check (auth.uid() = user_id);

-- =========================
-- INDEXES
-- =========================

create index if not exists idx_symptoms_user_id
on public.symptoms(user_id);

create index if not exists idx_appointments_patient_id
on public.appointments(patient_id);

create index if not exists idx_appointments_doctor_id
on public.appointments(doctor_id);

create index if not exists idx_doctor_notes_patient_id
on public.doctor_notes(patient_id);

create index if not exists idx_doctor_notes_doctor_id
on public.doctor_notes(doctor_id);

create index if not exists idx_community_posts_user_id
on public.community_posts(user_id);

-- =========================
-- MY HEALTH JOURNEY TABLES
-- =========================

-- 1. HEALTH CONDITIONS
create table if not exists public.health_conditions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  category text not null default 'Other',
  status text not null check (status in ('clinically_diagnosed', 'self_reported', 'suspected', 'under_investigation')),
  date_noticed date,
  diagnosed_by text,
  associated_symptoms text[] default '{}',
  current_treatment text,
  medications text,
  notes text,
  is_shared_with_doctor boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.health_conditions enable row level security;

create policy "Users can manage own conditions"
on public.health_conditions for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Doctors can view shared conditions"
on public.health_conditions for select to authenticated
using (
  is_shared_with_doctor = true 
  and exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
);

-- 2. FLARE-UPS
create table if not exists public.flare_ups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  condition_name text not null,
  start_time timestamptz not null default now(),
  end_time timestamptz,
  is_ongoing boolean default true,
  severity integer not null check (severity between 0 and 10),
  symptoms text[] default '{}',
  contributing_factors text[] default '{}',
  medications_taken text,
  notes text,
  is_shared_with_doctor boolean default false,
  created_at timestamptz default now()
);

alter table public.flare_ups enable row level security;

create policy "Users can manage own flare-ups"
on public.flare_ups for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Doctors can view shared flare-ups"
on public.flare_ups for select to authenticated
using (
  is_shared_with_doctor = true 
  and exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
);

-- 3. FOOD & WELLNESS DIARY
create table if not exists public.food_diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack', 'drink')),
  meal_time time,
  description text not null,
  ingredients text[] default '{}',
  image_url text,
  symptoms_experienced text[] default '{}',
  pain_severity integer check (pain_severity between 0 and 10),
  bloating_level text check (bloating_level in ('none', 'mild', 'moderate', 'severe')),
  bowel_changes text,
  sleep_quality text,
  physical_activity text,
  stress_level text check (stress_level in ('low', 'medium', 'high')),
  mood text,
  suspected_triggers text[] default '{}',
  notes text,
  created_at timestamptz default now()
);

alter table public.food_diary_entries enable row level security;

create policy "Users can manage own food diary"
on public.food_diary_entries for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 4. MEDICATIONS & TREATMENTS
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  is_active boolean default true,
  prescribed_by text,
  reason text,
  reminders_enabled boolean default false,
  reminder_times text[] default '{}',
  notes text,
  treatment_type text default 'medication',
  is_shared_with_doctor boolean default false,
  created_at timestamptz default now()
);

alter table public.medications enable row level security;

create policy "Users can manage own medications"
on public.medications for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Doctors can view shared medications"
on public.medications for select to authenticated
using (
  is_shared_with_doctor = true 
  and exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
);

-- 5. SEXUAL HEALTH & PROTECTION (Strictly Private)
create table if not exists public.sexual_health_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  record_type text not null check (record_type in ('contraception', 'sti_test', 'hpv_cervical', 'other')),
  title text not null,
  date date,
  result text,
  details jsonb default '{}'::jsonb,
  notes text,
  next_due_date date,
  created_at timestamptz default now()
);

alter table public.sexual_health_records enable row level security;

create policy "Users can manage own sexual health records"
on public.sexual_health_records for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6. MEDICAL RECORDS
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  category text not null check (category in ('ultrasound', 'blood_test', 'pathology', 'pap_smear', 'surgical_report', 'clinical_summary', 'other')),
  record_date date not null,
  facility_or_provider text,
  key_findings text,
  attachment_url text,
  is_confirmed_by_clinician boolean default false,
  is_shared_with_doctor boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table public.medical_records enable row level security;

create policy "Users can manage own medical records"
on public.medical_records for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Doctors can view shared medical records"
on public.medical_records for select to authenticated
using (
  is_shared_with_doctor = true 
  and exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
);

-- 7. HEALTH DOCUMENTS (Private documents uploaded to 'health-docs' bucket)
create table if not exists public.health_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  document_type text not null check (document_type in ('Scan', 'Blood test', 'Discharge summary', 'Prescription', 'Other')),
  document_date date not null default current_date,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  health_event_id uuid references public.health_events(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.health_documents enable row level security;

create policy "Users can manage own health documents"
on public.health_documents for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Doctors can view shared health documents"
on public.health_documents for select to authenticated
using (
  exists (select 1 from public.users where id = auth.uid() and role = 'doctor')
);

-- 8. REMINDERS
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  type text not null default 'Medication' check (type in ('Medication', 'Appointment', 'Log my symptoms', 'Other')),
  time text not null, -- 'HH:mm'
  weekdays text[] not null default '{"Mon","Tue","Wed","Thu","Fri","Sat","Sun"}',
  is_enabled boolean not null default true,
  created_at timestamptz default now()
);

alter table public.reminders enable row level security;

create policy "Users can manage own reminders"
on public.reminders for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 9. CULTURE ENTRIES & TRANSLATIONS
create table if not exists public.culture_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alt_names text[] default '{}',
  category text default 'General',
  description text,
  safety_guidance text,
  traditional_use text,
  reviewed_by text,
  language text default 'en',
  created_at timestamptz default now()
);

create table if not exists public.culture_entry_translations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references public.culture_entries(id) on delete cascade not null,
  language text not null,
  name text,
  alt_names text[] default '{}',
  description text,
  safety_guidance text,
  traditional_use text,
  created_at timestamptz default now()
);

alter table public.culture_entries enable row level security;
alter table public.culture_entry_translations enable row level security;

create policy "Culture entries viewable by everyone"
on public.culture_entries for select using (true);

create policy "Culture translations viewable by everyone"
on public.culture_entry_translations for select using (true);



