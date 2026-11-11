import { supabase } from './supabase';

/**
 * Inserts sample data for testing the timeline, cycle insights, and doctor summary.
 * All rows are for the signed-in user only, and clearly labelled with 'Sample:'
 */
export async function insertSampleData(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'No user ID provided' };

  try {
    const now = new Date();
    const getDateDaysAgo = (days: number): string => {
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return d.toISOString().split('T')[0];
    };
    const getTimestampDaysAgo = (days: number, hour = 10): string => {
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      d.setHours(hour, 0, 0, 0);
      return d.toISOString();
    };

    // 1. Four period_logs with start dates ~38, 66, 104, and 135 days ago (gaps: 28, 38, 31)
    const samplePeriods = [
      {
        user_id: userId,
        start_date: getDateDaysAgo(38),
        end_date: getDateDaysAgo(33),
        flow: 'Heavy',
        notes: 'Sample: Heavy flow with menstrual cramping on days 1-2',
      },
      {
        user_id: userId,
        start_date: getDateDaysAgo(66),
        end_date: getDateDaysAgo(61),
        flow: 'Heavy',
        notes: 'Sample: Heavy flow and pelvic pressure',
      },
      {
        user_id: userId,
        start_date: getDateDaysAgo(104),
        end_date: getDateDaysAgo(99),
        flow: 'Medium',
        notes: 'Sample: Medium cycle flow, 5 days duration',
      },
      {
        user_id: userId,
        start_date: getDateDaysAgo(135),
        end_date: getDateDaysAgo(131),
        flow: 'Light',
        notes: 'Sample: Light flow cycle onset',
      },
    ];

    // 2. Eight symptoms across the last 60 days
    // Pelvic pain strength 7 on three different days (e.g. 10, 24, 42 days ago)
    // Bloating, Back pain, Heavy bleeding, Fatigue, Fatigue (each note starts with 'Sample:')
    const sampleSymptoms = [
      {
        user_id: userId,
        type: 'Pelvic pain',
        severity: 7,
        notes: 'Sample: Sharp throbbing pelvic pain, felt intensely on left side',
        created_at: getTimestampDaysAgo(10, 14),
      },
      {
        user_id: userId,
        type: 'Pelvic pain',
        severity: 7,
        notes: 'Sample: Severe cyclic pelvic pain radiating to lower abdomen',
        created_at: getTimestampDaysAgo(24, 9),
      },
      {
        user_id: userId,
        type: 'Pelvic pain',
        severity: 7,
        notes: 'Sample: Intense deep pelvic ache after physical activity',
        created_at: getTimestampDaysAgo(42, 16),
      },
      {
        user_id: userId,
        type: 'Bloating',
        severity: 5,
        notes: 'Sample: Lower abdominal fullness and moderate distension',
        created_at: getTimestampDaysAgo(8, 11),
      },
      {
        user_id: userId,
        type: 'Back pain',
        severity: 6,
        notes: 'Sample: Dull lower lumbar pain radiating into thighs',
        created_at: getTimestampDaysAgo(18, 15),
      },
      {
        user_id: userId,
        type: 'Heavy bleeding',
        severity: 8,
        notes: 'Sample: Heavy flooding requiring hourly changes',
        created_at: getTimestampDaysAgo(38, 8),
      },
      {
        user_id: userId,
        type: 'Fatigue',
        severity: 5,
        notes: 'Sample: Overwhelming afternoon lethargy and brain fog',
        created_at: getTimestampDaysAgo(15, 13),
      },
      {
        user_id: userId,
        type: 'Fatigue',
        severity: 6,
        notes: 'Sample: Exhaustion despite resting, generalized muscle aches',
        created_at: getTimestampDaysAgo(30, 10),
      },
    ];

    // 3. One diagnosis titled 'Sample: Endometriosis' with status 'confirmed'
    const endometriosisEvent = {
      user_id: userId,
      event_type: 'diagnosis',
      title: 'Sample: Endometriosis',
      status: 'confirmed',
      event_date: getDateDaysAgo(120),
      details: 'Sample: Laparoscopic confirmation by gynecologist. Found stage II endometriotic implants on pelvic wall.',
    };

    // 4. One diagnosis titled 'Sample: Possible PID' with status 'doctor_suspected'
    const pidEvent = {
      user_id: userId,
      event_type: 'diagnosis',
      title: 'Sample: Possible PID',
      status: 'doctor_suspected',
      event_date: getDateDaysAgo(50),
      details: 'Sample: Clinical signs and tender pelvic exam prompted suspicion of pelvic inflammatory disease.',
    };

    // 5. Two appointments titled 'Sample: ...'
    const sampleAppointments = [
      {
        user_id: userId,
        doctor_name: 'Dr. Khumalo',
        title: 'Sample: Gynecology consultation',
        date: getDateDaysAgo(14),
        description: 'Sample: Review of persistent pelvic pain and ultrasound scan results.',
        created_at: getTimestampDaysAgo(14, 9),
      },
      {
        user_id: userId,
        doctor_name: 'Dr. Mthembu',
        title: 'Sample: Pelvic ultrasound review',
        date: getDateDaysAgo(45),
        description: 'Sample: Transvaginal ultrasound imaging to assess ovaries and uterine lining.',
        created_at: getTimestampDaysAgo(45, 11),
      },
    ];

    // 6. One doctor_notes row starting 'Sample:'
    const sampleDoctorNote = {
      patient_id: userId,
      doctor_name: 'Dr. Khumalo',
      content: 'Sample: Patient seen for cyclic pelvic pain (severity 7/10) and heavy menses. Discussed non-steroidal anti-inflammatories, pelvic floor physiotherapy, and conservative hormonal options. Follow-up planned in 3 months.',
      is_pinned: true,
      created_at: getTimestampDaysAgo(14, 11),
    };

    // Insert all in parallel
    const [periodsRes, symptomsRes, event1Res, event2Res, apptsRes, noteRes] = await Promise.all([
      supabase.from('period_logs').insert(samplePeriods),
      supabase.from('symptoms').insert(sampleSymptoms),
      supabase.from('health_events').insert([endometriosisEvent]),
      supabase.from('health_events').insert([pidEvent]),
      supabase.from('appointments').insert(sampleAppointments),
      supabase.from('doctor_notes').insert([sampleDoctorNote]),
    ]);

    if (periodsRes.error) throw periodsRes.error;
    if (symptomsRes.error) throw symptomsRes.error;
    if (event1Res.error) throw event1Res.error;
    if (event2Res.error) throw event2Res.error;
    if (apptsRes.error) throw apptsRes.error;
    if (noteRes.error) throw noteRes.error;

    return { success: true };
  } catch (err: any) {
    console.error('Error inserting sample data:', err);
    return { success: false, error: err.message || 'Failed to insert sample data' };
  }
}

/**
 * Removes only rows whose note or title starts with 'Sample:' for the signed-in user.
 */
export async function removeSampleData(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId) return { success: false, error: 'No user ID provided' };

  try {
    await Promise.all([
      // period_logs where notes start with Sample:
      supabase.from('period_logs').delete().eq('user_id', userId).ilike('notes', 'Sample:%'),
      // symptoms where notes start with Sample:
      supabase.from('symptoms').delete().eq('user_id', userId).ilike('notes', 'Sample:%'),
      // health_events where title starts with Sample:
      supabase.from('health_events').delete().eq('user_id', userId).ilike('title', 'Sample:%'),
      // appointments where title starts with Sample:
      supabase.from('appointments').delete().eq('user_id', userId).ilike('title', 'Sample:%'),
      // doctor_notes where content starts with Sample: or doctor_name starts with Sample:
      supabase.from('doctor_notes').delete().eq('patient_id', userId).ilike('content', 'Sample:%'),
      supabase.from('doctor_notes').delete().eq('patient_id', userId).ilike('doctor_name', 'Sample:%'),
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('Error removing sample data:', err);
    return { success: false, error: err.message || 'Failed to remove sample data' };
  }
}
