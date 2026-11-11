/**
 * Confidential Crisis Helplines & Mental Health Support
 * 
 * NOTE FOR CLINICAL & PRODUCT TEAM:
 * Verified national and regional helpline numbers must be added before production launch.
 * The entries below provide structured contact metadata and verified service descriptions.
 */

export interface Helpline {
  id: string;
  name: string;
  service: string;
  phoneNumber: string; // Placeholder: verified number must be added before launch
  hours: string;
  isTollFree: boolean;
  notes?: string;
}

export const CRISIS_HELPLINES: Helpline[] = [
  {
    id: 'sadag_postnatal',
    name: 'SADAG Postnatal Mental Health Line',
    service: 'South African Depression and Anxiety Group - Maternal mental health & postpartum depression support',
    phoneNumber: '', // Verified number to be added before launch
    hours: '24 hours / 7 days a week',
    isTollFree: true,
    notes: 'Free, confidential support from trained maternal mental health counsellors.'
  },
  {
    id: 'pndsa',
    name: 'Postnatal Depression Support South Africa (PNDSA)',
    service: 'Dedicated support for mothers experiencing postnatal distress, intrusive thoughts, and anxiety',
    phoneNumber: '', // Verified number to be added before launch
    hours: '8:00 AM – 5:00 PM (Monday to Friday)',
    isTollFree: false,
    notes: 'Compassionate counselling and support group linkages.'
  },
  {
    id: 'suicide_crisis',
    name: 'National Crisis Helpline',
    service: 'Immediate emergency counselling for acute psychological distress or feelings of self-harm',
    phoneNumber: '', // Verified number to be added before launch
    hours: '24 hours / 7 days a week',
    isTollFree: true,
    notes: 'Available nationwide across all telecommunications networks.'
  },
  {
    id: 'lifeline_sa',
    name: 'LifeLine South Africa',
    service: 'Emotional support, trauma counselling, and crisis debriefing',
    phoneNumber: '', // Verified number to be added before launch
    hours: '24 hours / 7 days a week',
    isTollFree: true,
    notes: 'Nationwide emotional listening service.'
  }
];

export const EMERGENCY_NUMBERS = {
  general: '112',
  ambulance: '10177'
} as const;
