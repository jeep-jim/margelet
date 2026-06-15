import type { IngestedPost, Locale } from '../../../types/app';
import type { SpaceIntent, SpaceMemory, SpaceMood, SpaceState } from './types';
import { compactText, normalize, ngrams, tokenize } from './text';
import { adjustLearning } from './learningEngine';

const SPACE_MEMORY_KEY = 'margelet_space_local_brain_core_v1';
const OLD_KEYS = ['margelet_space_local_brain_v7','margelet_space_local_brain_v6', 'margelet_space_local_brain_v3', 'margelet_space_local_brain_v2'];

function normalizeMemory(memory: Partial<SpaceMemory>): SpaceMemory {
  return {
    turns: Number(memory.turns || 0),
    lastIntent: memory.lastIntent || null,
    favoriteSources: memory.favoriteSources || {},
    topics: memory.topics || {},
    phrases: memory.phrases || {},
    languageHints: memory.languageHints || {},
    lastUserWords: Array.isArray(memory.lastUserWords) ? memory.lastUserWords : [],
    lastSubject: memory.lastSubject || '',
    lastResult: memory.lastResult || null,
    lastDialogMood: memory.lastDialogMood || 'neutral',
    lastSpaceState: memory.lastSpaceState || 'listening',
    userName: memory.userName || '',
    userFacts: memory.userFacts || {},
    userStyle: {
      wantsShort: Number(memory.userStyle?.wantsShort || 1),
      wantsSources: Number(memory.userStyle?.wantsSources || 0),
      likesMedia: Number(memory.userStyle?.likesMedia || 0),
      likesWarmTone: Number(memory.userStyle?.likesWarmTone || 1),
      likesPlayful: Number(memory.userStyle?.likesPlayful || 0),
    },
  };
}

function readLegacyMemory(): Partial<SpaceMemory> | null {
  for (const key of OLD_KEYS) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null') as Partial<SpaceMemory> | null;
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {
      // optional local memory
    }
  }
  return null;
}

export function readMemory(): SpaceMemory {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPACE_MEMORY_KEY) || 'null') as SpaceMemory | null;
    if (parsed && typeof parsed === 'object') return normalizeMemory(parsed);
  } catch {
    // optional local memory
  }
  return normalizeMemory(readLegacyMemory() || {});
}

export function writeMemory(memory: SpaceMemory) {
  try {
    localStorage.setItem(SPACE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // if storage is unavailable, the brain still works without persistence.
  }
}

export function extractUserName(query: string) {
  const match = query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя)\s+([A-Za-zА-Яа-яЁёІіЇїЄєҐґ-]{2,24})/i)
    || query.match(/(?:my\s+name\s+is|call\s+me)\s+([A-Za-zА-Яа-яЁёІіЇїЄєҐґ-]{2,24})/i);
  return match?.[1]?.trim() || '';
}

export function learnFromQuery(memory: SpaceMemory, query: string, intent: SpaceIntent, tokens: string[], locale: Locale) {
  memory.turns += 1;
  memory.lastIntent = intent;
  memory.languageHints[locale] = (memory.languageHints[locale] || 0) + 1;
  memory.lastUserWords = tokens.slice(0, 8);

  const lower = normalize(query);
  const name = extractUserName(query);
  if (name) memory.userName = name;

  if (/корот|кратк|short|brief/.test(lower)) adjustLearning(memory, 'short');
  if (/источник|source|пост|канал/.test(lower)) adjustLearning(memory, 'search');
  if (/фото|картин|видео|image|photo|video/.test(lower)) adjustLearning(memory, 'media');
  if (/бро|друг|родн|спасибо|thanks|поговор|поболт|обща/.test(lower)) adjustLearning(memory, 'talk');
  if (/ахах|ха|смеш|шут|мем|лол|joke|fun/.test(lower)) memory.userStyle.likesPlayful += 0.3;

  tokens.forEach((token) => {
    memory.topics[token] = (memory.topics[token] || 0) + 1;
  });

  ngrams(tokenize(query, 12), 3).forEach((phrase) => {
    memory.phrases[phrase] = (memory.phrases[phrase] || 0) + 1;
  });

  const mood: SpaceMood = /страш|груст|плохо|жаль|умер|убил|беда|войн/.test(lower)
    ? 'careful'
    : /круто|вау|ахах|смеш|шут|мем/.test(lower)
      ? 'playful'
      : /почему|зачем|разбор/.test(lower)
        ? 'curious'
        : memory.lastDialogMood;
  memory.lastDialogMood = mood;
  const state: SpaceState = intent === 'investor' || intent === 'product' || intent === 'monetization' || intent === 'architecture' || intent === 'growth' || intent === 'risk' ? 'presenting' : intent === 'search' || intent === 'trend' || intent === 'weather' || intent === 'images' || intent === 'video' ? 'discovering' : 'listening';
  memory.lastSpaceState = state;
}

export function rememberTurn(args: {
  memory: SpaceMemory;
  query: string;
  intent: SpaceIntent;
  found: IngestedPost[];
  locale: Locale;
  subject: string;
  tokens: string[];
}) {
  const { memory, query, intent, found, locale, subject, tokens } = args;
  learnFromQuery(memory, query, intent, tokens, locale);
  if (subject) memory.lastSubject = subject;

  const best = found[0];
  if (best) {
    memory.lastResult = {
      query,
      subject: subject || memory.lastSubject,
      intent,
      postTitle: best.source.title || best.source.handle,
      sourceTitle: best.source.title,
      sourceHandle: best.source.handle,
      postText: compactText(best.text, 420),
      createdAt: best.createdAt,
      at: Date.now(),
    };
  } else if (subject) {
    memory.lastResult = { query, subject, intent, at: Date.now() };
  }

  found.slice(0, 2).forEach((post) => {
    if (!post.source.handle) return;
    memory.favoriteSources[post.source.handle] = (memory.favoriteSources[post.source.handle] || 0) + 0.25;
  });

  writeMemory(memory);
}
