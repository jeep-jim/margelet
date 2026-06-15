import type { SpaceMood } from './types';
import { normalize } from './text';

export function detectMood(query: string): SpaceMood {
  const lower = normalize(query);
  if (/(убил|умер|погиб|беда|страш|груст|плохо|жаль|войн|катастроф|авари|killed|died|sad|war|crash)/.test(lower)) return 'careful';
  if (/(вау|круто|ахах|аха|ха|смеш|шут|мем|огонь|пушка|lol|funny|wow|cool|awesome)/.test(lower)) return 'playful';
  if (/(почему|зачем|разбер|объясни|интересно|как так|why|explain|interesting)/.test(lower)) return 'curious';
  if (/(найди|покажи|ищи|собери|подбери|find|show|search)/.test(lower)) return 'searching';
  if (/(инвестор|зараб|проект|сервис|margelet|марджел|investor|business)/.test(lower)) return 'presenting';
  if (/(бро|друг|родн|поговор|поболт|chat|talk)/.test(lower)) return 'warm';
  return 'neutral';
}

export function softReaction(mood: SpaceMood, seed: number) {
  const allow = seed % 100;
  if (mood === 'careful') return allow < 26 ? ' 🫶' : '';
  if (mood === 'playful') return allow < 18 ? ' 😄' : allow < 28 ? ' ⚡' : '';
  if (mood === 'curious') return allow < 18 ? ' 👀' : '';
  if (mood === 'searching') return allow < 12 ? ' 👇' : '';
  if (mood === 'presenting') return allow < 18 ? ' 💎' : '';
  if (mood === 'warm') return allow < 18 ? ' 🙂' : '';
  return '';
}
