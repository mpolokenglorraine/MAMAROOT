import { supabase } from './supabase';

export type DiagnosisStatus = 'clinically_diagnosed' | 'self_reported' | 'suspected' | 'under_investigation';

export interface HealthCondition {
  id: string;
  user_id: string;
  name: string;
  category: string;
  status: DiagnosisStatus;
  date_noticed?: string;
  diagnosed_by?: string;
  associated_symptoms: string[];
  current_treatment?: string;
  medications?: string;
  notes?: string;
  is_shared_with_doctor: boolean;
  created_at: string;
  updated_at: string;
}

export interface FlareUp {
  id: string;
  user_id: string;
  condition_name: string;
  start_time: string;
  end_time?: string;
  is_ongoing: boolean;
  severity: number; // 0 to 10
  symptoms: string[];
  contributing_factors: string[];
  medications_taken?: string;
  notes?: string;
  is_shared_with_doctor: boolean;
  created_at: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
export type BloatingLevel = 'none' | 'mild' | 'moderate' | 'severe';
export type StressLevel = 'low' | 'medium' | 'high';

export interface FoodDiaryEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: MealType;
  meal_time?: string;
  description: string;
  ingredients: string[];
  image_url?: string;
  symptoms_experienced: string[];
  pain_severity?: number; // 0 to 10
  bloating_level?: BloatingLevel;
  bowel_changes?: string;
  sleep_quality?: string;
  physical_activity?: string;
  stress_level?: StressLevel;
  mood?: string;
  suspected_triggers: string[];
  notes?: string;
  created_at: string;
}

export interface MedicationRecord {
  id: string;
  user_id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  prescribed_by?: string;
  reason?: string;
  reminders_enabled: boolean;
  reminder_times?: string[];
  notes?: string;
  treatment_type: 'medication' | 'procedure';
  is_shared_with_doctor: boolean;
  created_at: string;
}

export interface SexualHealthRecord {
  id: string;
  user_id: string;
  record_type: 'contraception' | 'sti_test' | 'hpv_cervical' | 'other';
  title: string;
  date?: string;
  result?: string;
  details?: Record<string, any>;
  notes?: string;
  next_due_date?: string;
  created_at: string;
}

export type MedicalRecordCategory = 
  | 'ultrasound' 
  | 'blood_test' 
  | 'pathology' 
  | 'pap_smear' 
  | 'surgical_report' 
  | 'clinical_summary' 
  | 'other';

export interface MedicalRecord {
  id: string;
  user_id: string;
  title: string;
  category: MedicalRecordCategory;
  record_date: string;
  facility_or_provider?: string;
  key_findings?: string;
  attachment_url?: string;
  is_confirmed_by_clinician: boolean;
  is_shared_with_doctor: boolean;
  notes?: string;
  created_at: string;
}

// Preset Condition Categories & Suggestions
export const SUGGESTED_CONDITIONS = [
  { name: 'Endometriosis', category: 'Endometriosis', typicalSymptoms: ['Pelvic pain', 'Lower back pain', 'Pain during menstruation', 'Pain during intercourse', 'Painful bowel movements', 'Bloating (Endo belly)', 'Fatigue', 'Heavy bleeding'] },
  { name: 'Adenomyosis', category: 'Adenomyosis', typicalSymptoms: ['Severe menstrual cramping', 'Heavy menstrual bleeding', 'Pelvic pressure', 'Enlarged uterus feeling', 'Prolonged menstrual bleeding'] },
  { name: 'Uterine Fibroids', category: 'Uterine Fibroids', typicalSymptoms: ['Heavy bleeding', 'Pelvic pressure', 'Abdominal discomfort', 'Frequent urination', 'Fatigue', 'Constipation', 'Lower back ache'] },
  { name: 'PCOS (Polycystic Ovary Syndrome)', category: 'PCOS', typicalSymptoms: ['Irregular cycles', 'Skipped periods', 'Hormonal acne', 'Excess hair growth (hirsutism)', 'Hair thinning', 'Weight fluctuations', 'Fatigue'] },
  { name: 'Ovarian Cysts', category: 'Ovarian Cysts', typicalSymptoms: ['Sharp pelvic pain', 'Dull ache in lower abdomen', 'Bloating', 'Pain during bowel movements', 'Sudden pain on one side'] },
  { name: 'HPV (Human Papillomavirus)', category: 'HPV', typicalSymptoms: ['Screening follow-up', 'Abnormal Pap smear', 'Cervical changes', 'Genital bumps'] },
  { name: 'Cervical Abnormalities', category: 'Cervical Abnormalities', typicalSymptoms: ['Atypical cell findings', 'Post-coital spotting', 'Unusual vaginal discharge', 'Pelvic ache'] },
  { name: 'Pelvic Inflammatory Disease (PID)', category: 'PID', typicalSymptoms: ['Lower abdominal pain', 'Unusual discharge', 'Pain during urination', 'Fever or chills', 'Pain during intercourse'] },
  { name: 'Sexually Transmitted Infections', category: 'STI', typicalSymptoms: ['Discharge changes', 'Pelvic tenderness', 'Burning during urination', 'Itching', 'Spotting'] },
  { name: 'Menstrual Disorders (Dysmenorrhea/Menorrhagia)', category: 'Menstrual Disorders', typicalSymptoms: ['Debilitating cramps', 'Flow with large clots', 'Cycle variability', 'Luteal phase headaches', 'Fatigue'] },
  { name: 'Perimenopause & Menopause', category: 'Menopause', typicalSymptoms: ['Hot flashes', 'Night sweats', 'Cycle irregularities', 'Vaginal dryness', 'Sleep changes', 'Brain fog', 'Mood sensitivity'] },
  { name: 'Breast Health Concerns', category: 'Breast Health', typicalSymptoms: ['Cyclic breast pain', 'Dense breast tissue tenderness', 'Benign fibroadenoma observation', 'Nipple sensitivity'] }
];

// LocalStorage resilient fallback helper
function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

export const healthJourneyService = {
  // ================= CONDITIONS =================
  async getConditions(userId: string): Promise<HealthCondition[]> {
    const storageKey = `mamaroot_conditions_${userId}`;
    try {
      const { data, error } = await supabase
        .from('health_conditions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as HealthCondition[];
      }
    } catch {
      // Supabase table may not exist yet, fall through to local
    }
    return getLocal<HealthCondition>(storageKey);
  },

  async addCondition(condition: Omit<HealthCondition, 'id' | 'created_at' | 'updated_at'>): Promise<HealthCondition> {
    const storageKey = `mamaroot_conditions_${condition.user_id}`;
    const newRecord: HealthCondition = {
      ...condition,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('health_conditions')
        .insert({
          user_id: condition.user_id,
          name: condition.name,
          category: condition.category,
          status: condition.status,
          date_noticed: condition.date_noticed || null,
          diagnosed_by: condition.diagnosed_by || null,
          associated_symptoms: condition.associated_symptoms,
          current_treatment: condition.current_treatment || null,
          medications: condition.medications || null,
          notes: condition.notes || null,
          is_shared_with_doctor: condition.is_shared_with_doctor
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<HealthCondition>(storageKey);
        setLocal(storageKey, [data as HealthCondition, ...current]);
        return data as HealthCondition;
      }
    } catch {
      // Fallback
    }

    const current = getLocal<HealthCondition>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async updateCondition(id: string, updates: Partial<HealthCondition>, userId: string): Promise<HealthCondition | null> {
    const storageKey = `mamaroot_conditions_${userId}`;
    try {
      const { data, error } = await supabase
        .from('health_conditions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<HealthCondition>(storageKey);
        const updatedList = current.map(c => c.id === id ? (data as HealthCondition) : c);
        setLocal(storageKey, updatedList);
        return data as HealthCondition;
      }
    } catch {
      // Fallback
    }

    const current = getLocal<HealthCondition>(storageKey);
    let updatedRecord: HealthCondition | null = null;
    const updatedList = current.map(c => {
      if (c.id === id) {
        updatedRecord = { ...c, ...updates, updated_at: new Date().toISOString() };
        return updatedRecord;
      }
      return c;
    });
    setLocal(storageKey, updatedList);
    return updatedRecord;
  },

  async deleteCondition(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_conditions_${userId}`;
    try {
      await supabase.from('health_conditions').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<HealthCondition>(storageKey);
    setLocal(storageKey, current.filter(c => c.id !== id));
    return true;
  },

  // ================= FLARE-UPS =================
  async getFlareUps(userId: string): Promise<FlareUp[]> {
    const storageKey = `mamaroot_flareups_${userId}`;
    try {
      const { data, error } = await supabase
        .from('flare_ups')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as FlareUp[];
      }
    } catch {
      // Fall through
    }
    return getLocal<FlareUp>(storageKey);
  },

  async addFlareUp(flare: Omit<FlareUp, 'id' | 'created_at'>): Promise<FlareUp> {
    const storageKey = `mamaroot_flareups_${flare.user_id}`;
    const newRecord: FlareUp = {
      ...flare,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('flare_ups')
        .insert({
          user_id: flare.user_id,
          condition_name: flare.condition_name,
          start_time: flare.start_time,
          end_time: flare.end_time || null,
          is_ongoing: flare.is_ongoing,
          severity: flare.severity,
          symptoms: flare.symptoms,
          contributing_factors: flare.contributing_factors,
          medications_taken: flare.medications_taken || null,
          notes: flare.notes || null,
          is_shared_with_doctor: flare.is_shared_with_doctor
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<FlareUp>(storageKey);
        setLocal(storageKey, [data as FlareUp, ...current]);
        return data as FlareUp;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<FlareUp>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async endFlareUp(id: string, endTime: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_flareups_${userId}`;
    try {
      await supabase
        .from('flare_ups')
        .update({ is_ongoing: false, end_time: endTime })
        .eq('id', id);
    } catch {
      // Fall through
    }
    const current = getLocal<FlareUp>(storageKey);
    setLocal(storageKey, current.map(f => f.id === id ? { ...f, is_ongoing: false, end_time: endTime } : f));
    return true;
  },

  async deleteFlareUp(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_flareups_${userId}`;
    try {
      await supabase.from('flare_ups').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<FlareUp>(storageKey);
    setLocal(storageKey, current.filter(f => f.id !== id));
    return true;
  },

  // ================= FOOD & WELLNESS DIARY =================
  async getFoodDiary(userId: string): Promise<FoodDiaryEntry[]> {
    const storageKey = `mamaroot_food_diary_${userId}`;
    try {
      const { data, error } = await supabase
        .from('food_diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as FoodDiaryEntry[];
      }
    } catch {
      // Fall through
    }
    return getLocal<FoodDiaryEntry>(storageKey);
  },

  async addFoodDiaryEntry(entry: Omit<FoodDiaryEntry, 'id' | 'created_at'>): Promise<FoodDiaryEntry> {
    const storageKey = `mamaroot_food_diary_${entry.user_id}`;
    const newRecord: FoodDiaryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('food_diary_entries')
        .insert({
          user_id: entry.user_id,
          date: entry.date,
          meal_type: entry.meal_type,
          meal_time: entry.meal_time || null,
          description: entry.description,
          ingredients: entry.ingredients,
          image_url: entry.image_url || null,
          symptoms_experienced: entry.symptoms_experienced,
          pain_severity: entry.pain_severity ?? null,
          bloating_level: entry.bloating_level || null,
          bowel_changes: entry.bowel_changes || null,
          sleep_quality: entry.sleep_quality || null,
          physical_activity: entry.physical_activity || null,
          stress_level: entry.stress_level || null,
          mood: entry.mood || null,
          suspected_triggers: entry.suspected_triggers,
          notes: entry.notes || null
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<FoodDiaryEntry>(storageKey);
        setLocal(storageKey, [data as FoodDiaryEntry, ...current]);
        return data as FoodDiaryEntry;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<FoodDiaryEntry>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async deleteFoodDiaryEntry(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_food_diary_${userId}`;
    try {
      await supabase.from('food_diary_entries').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<FoodDiaryEntry>(storageKey);
    setLocal(storageKey, current.filter(e => e.id !== id));
    return true;
  },

  // ================= MEDICATIONS & TREATMENTS =================
  async getMedications(userId: string): Promise<MedicationRecord[]> {
    const storageKey = `mamaroot_medications_${userId}`;
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as MedicationRecord[];
      }
    } catch {
      // Fall through
    }
    return getLocal<MedicationRecord>(storageKey);
  },

  async addMedication(med: Omit<MedicationRecord, 'id' | 'created_at'>): Promise<MedicationRecord> {
    const storageKey = `mamaroot_medications_${med.user_id}`;
    const newRecord: MedicationRecord = {
      ...med,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('medications')
        .insert({
          user_id: med.user_id,
          name: med.name,
          dosage: med.dosage || null,
          frequency: med.frequency || null,
          start_date: med.start_date || null,
          end_date: med.end_date || null,
          is_active: med.is_active,
          prescribed_by: med.prescribed_by || null,
          reason: med.reason || null,
          reminders_enabled: med.reminders_enabled,
          reminder_times: med.reminder_times || [],
          notes: med.notes || null,
          treatment_type: med.treatment_type,
          is_shared_with_doctor: med.is_shared_with_doctor
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<MedicationRecord>(storageKey);
        setLocal(storageKey, [data as MedicationRecord, ...current]);
        return data as MedicationRecord;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<MedicationRecord>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async updateMedication(id: string, updates: Partial<MedicationRecord>, userId: string): Promise<MedicationRecord | null> {
    const storageKey = `mamaroot_medications_${userId}`;
    try {
      const { data, error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<MedicationRecord>(storageKey);
        setLocal(storageKey, current.map(m => m.id === id ? (data as MedicationRecord) : m));
        return data as MedicationRecord;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<MedicationRecord>(storageKey);
    let updated: MedicationRecord | null = null;
    const list = current.map(m => {
      if (m.id === id) {
        updated = { ...m, ...updates };
        return updated;
      }
      return m;
    });
    setLocal(storageKey, list);
    return updated;
  },

  async deleteMedication(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_medications_${userId}`;
    try {
      await supabase.from('medications').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<MedicationRecord>(storageKey);
    setLocal(storageKey, current.filter(m => m.id !== id));
    return true;
  },

  // ================= SEXUAL HEALTH & PROTECTION =================
  async getSexualHealthRecords(userId: string): Promise<SexualHealthRecord[]> {
    const storageKey = `mamaroot_sexual_health_${userId}`;
    try {
      const { data, error } = await supabase
        .from('sexual_health_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as SexualHealthRecord[];
      }
    } catch {
      // Fall through
    }
    return getLocal<SexualHealthRecord>(storageKey);
  },

  async addSexualHealthRecord(record: Omit<SexualHealthRecord, 'id' | 'created_at'>): Promise<SexualHealthRecord> {
    const storageKey = `mamaroot_sexual_health_${record.user_id}`;
    const newRecord: SexualHealthRecord = {
      ...record,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('sexual_health_records')
        .insert({
          user_id: record.user_id,
          record_type: record.record_type,
          title: record.title,
          date: record.date || null,
          result: record.result || null,
          details: record.details || {},
          notes: record.notes || null,
          next_due_date: record.next_due_date || null
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<SexualHealthRecord>(storageKey);
        setLocal(storageKey, [data as SexualHealthRecord, ...current]);
        return data as SexualHealthRecord;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<SexualHealthRecord>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async deleteSexualHealthRecord(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_sexual_health_${userId}`;
    try {
      await supabase.from('sexual_health_records').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<SexualHealthRecord>(storageKey);
    setLocal(storageKey, current.filter(r => r.id !== id));
    return true;
  },

  // ================= MEDICAL RECORDS =================
  async getMedicalRecords(userId: string): Promise<MedicalRecord[]> {
    const storageKey = `mamaroot_medical_records_${userId}`;
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('user_id', userId)
        .order('record_date', { ascending: false });

      if (!error && data) {
        setLocal(storageKey, data);
        return data as MedicalRecord[];
      }
    } catch {
      // Fall through
    }
    return getLocal<MedicalRecord>(storageKey);
  },

  async addMedicalRecord(rec: Omit<MedicalRecord, 'id' | 'created_at'>): Promise<MedicalRecord> {
    const storageKey = `mamaroot_medical_records_${rec.user_id}`;
    const newRecord: MedicalRecord = {
      ...rec,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          user_id: rec.user_id,
          title: rec.title,
          category: rec.category,
          record_date: rec.record_date,
          facility_or_provider: rec.facility_or_provider || null,
          key_findings: rec.key_findings || null,
          attachment_url: rec.attachment_url || null,
          is_confirmed_by_clinician: rec.is_confirmed_by_clinician,
          is_shared_with_doctor: rec.is_shared_with_doctor,
          notes: rec.notes || null
        })
        .select()
        .single();

      if (!error && data) {
        const current = getLocal<MedicalRecord>(storageKey);
        setLocal(storageKey, [data as MedicalRecord, ...current]);
        return data as MedicalRecord;
      }
    } catch {
      // Fall through
    }

    const current = getLocal<MedicalRecord>(storageKey);
    setLocal(storageKey, [newRecord, ...current]);
    return newRecord;
  },

  async deleteMedicalRecord(id: string, userId: string): Promise<boolean> {
    const storageKey = `mamaroot_medical_records_${userId}`;
    try {
      await supabase.from('medical_records').delete().eq('id', id);
    } catch {
      // Ignore
    }
    const current = getLocal<MedicalRecord>(storageKey);
    setLocal(storageKey, current.filter(r => r.id !== id));
    return true;
  },

  // ================= SHARED DATA FOR DOCTOR =================
  async getSharedPatientJourney(patientId: string) {
    const [conditions, flareUps, medications, medicalRecords] = await Promise.all([
      this.getConditions(patientId),
      this.getFlareUps(patientId),
      this.getMedications(patientId),
      this.getMedicalRecords(patientId)
    ]);

    return {
      sharedConditions: conditions.filter(c => c.is_shared_with_doctor),
      sharedFlareUps: flareUps.filter(f => f.is_shared_with_doctor),
      sharedMedications: medications.filter(m => m.is_shared_with_doctor),
      sharedMedicalRecords: medicalRecords.filter(m => m.is_shared_with_doctor)
    };
  }
};
