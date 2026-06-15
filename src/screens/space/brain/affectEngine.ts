import type { SpaceMood } from './types';
import { normalize } from './text';

export function detectMood(query: string): SpaceMood {
  const lower = normalize(query);
  if (/(убил|умер|погиб|беда|страш|груст|плохо|жаль|войн|катастроф|авари)/.test(lower)) return 'careful';
  if (/(вау|круто|ахах|ха|смеш|шут|мем|огонь|lol|funny)/.test(lower)) return 'playful';
  if (/(почему|зачем|разбер|объясни|интересно|как так)/.test(lower)) return 'curious';
  if (/(найди|покажи|ищи|собери|подбери)/.test(lower)) return 'searching';
  if (/(бро|друг|родн|поговор|поболт)/.test(lower)) return 'warm';
  return 'neutral';
}

export function maybeEmoji(mood: SpaceMood, seed: number) {
  if (mood === 'careful') return seed % 3 === 0 ? ' Бережно.' : '';
  if (mood === 'playful') return seed % 2 === 0 ? ' 🙂' : ' 😄';
  if (mood === 'curious') return seed % 3 === 0 ? ' Интересно.' : '';
  if (mood === 'searching') return seed % 4 === 0 ? ' 👇' : '';
  if (mood === 'warm') return seed % 2 === 0 ? ' 🙂' : '';
  return '';
}
