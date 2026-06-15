import type { SpaceMood } from './types';
import { normalize } from './text';

export function detectMood(query: string): SpaceMood {
  const lower = normalize(query);
  if (/(убил|умер|погиб|беда|страш|груст|плохо|жаль|войн|катастроф|авари|killed|died|sad|war|crash)/.test(lower)) return 'careful';
  if (/(вау|круто|ахах|ха|смеш|шут|мем|огонь|lol|funny|wow|cool)/.test(lower)) return 'playful';
  if (/(почему|зачем|разбер|объясни|интересно|как так|why|explain|interesting)/.test(lower)) return 'curious';
  if (/(найди|покажи|ищи|собери|подбери|find|show|search)/.test(lower)) return 'searching';
  if (/(бро|друг|родн|поговор|поболт|chat|talk)/.test(lower)) return 'warm';
  return 'neutral';
}

export function softReaction(mood: SpaceMood, seed: number) {
  if (mood === 'careful') return seed % 3 === 0 ? ' 🫶' : '';
  if (mood === 'playful') return seed % 3 === 0 ? ' 😄' : seed % 3 === 1 ? ' 🙂' : '';
  if (mood === 'curious') return seed % 4 === 0 ? ' 👀' : '';
  if (mood === 'searching') return seed % 5 === 0 ? ' 👇' : '';
  if (mood === 'warm') return seed % 4 === 0 ? ' 🙂' : '';
  return '';
}
