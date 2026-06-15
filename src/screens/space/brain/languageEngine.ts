import type { Locale } from '../../../types/app';
import type { SpaceLanguage } from './types';

export const SUPPORTED_DIALOG_LANGUAGES = ['ru', 'us'] as const;

export function detectSpaceLanguage(query: string, fallback: Locale): SpaceLanguage {
  if (/[а-яёіїєґ]/i.test(query)) return 'ru';
  if (/\b(hi|hello|hey|news|show|find|what|why|how|video|photo|recipe|thanks|can|you|weather)\b/i.test(query)) return 'us';
  return fallback === 'ru' || fallback === 'us' ? fallback : 'us';
}

export function isRussianLanguage(lang: SpaceLanguage) {
  return lang === 'ru';
}

export function languageNote(lang: SpaceLanguage) {
  return lang === 'ru'
    ? 'Пока я говорю стабильно на русском и английском. Остальные языки добавим в этот же слой без переписывания мозга.'
    : 'For now I speak reliably in Russian and English. Other languages will plug into this same layer later.';
}
