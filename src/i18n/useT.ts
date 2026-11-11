import { useAuth } from '../lib/AuthContext';
import { en } from './en';
import { zu } from './zu';
import { xh } from './xh';
import { st } from './st';
import { tn } from './tn';
import { nso } from './nso';

export type SupportedLanguage = 'en' | 'zu' | 'xh' | 'st' | 'tn' | 'nso';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'zu', label: 'isiZulu' },
  { code: 'xh', label: 'isiXhosa' },
  { code: 'st', label: 'Sesotho' },
  { code: 'tn', label: 'Setswana' },
  { code: 'nso', label: 'Sepedi' },
];

const DICTIONARIES: Record<SupportedLanguage, Record<string, string>> = {
  en,
  zu,
  xh,
  st,
  tn,
  nso,
};

/**
 * Hook for translating UI text.
 * Reads users.language (default 'en').
 * If a key is missing or empty in that language, falls back to the English string.
 * Never shows a raw key.
 */
export function useT() {
  const { profile } = useAuth();
  
  // Resolve user language: profile.language -> localStorage -> default 'en'
  let langCode: SupportedLanguage = 'en';
  if (profile?.language && profile.language in DICTIONARIES) {
    langCode = profile.language as SupportedLanguage;
  } else if (typeof window !== 'undefined' && profile?.id) {
    const cached = localStorage.getItem(`mama_root_lang_${profile.id}`) as SupportedLanguage;
    if (cached && cached in DICTIONARIES) {
      langCode = cached;
    }
  }

  const dictionary = DICTIONARIES[langCode] || en;

  const t = (key: string, params?: Record<string, string | number>): string => {
    let value = dictionary[key];

    // Fall back to English if missing or empty string
    if (!value || value.trim() === '') {
      value = en[key];
    }

    // Never show a raw key
    if (!value) {
      return '';
    }

    // Replace variable placeholders like {name}, {age}, etc.
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        value = value.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return value;
  };

  return { t, language: langCode, languages: SUPPORTED_LANGUAGES };
}
