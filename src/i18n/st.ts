import { en } from './en';

// For Sesotho: all keys initialized as '' (empty) so translators can populate them.
// Any empty string or missing key automatically falls back to English in useT().
export const st: Record<string, string> = Object.keys(en).reduce<Record<string, string>>((acc, key) => {
  acc[key] = '';
  return acc;
}, {});
