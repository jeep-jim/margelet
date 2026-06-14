import type { IngestedPost, Locale } from '../../../types/app';
import type { SpaceIntent, SpaceMemory } from './types';
import { compactText, normalize } from './text';

const SPACE_MEMORY_KEY = 'margelet_space_local_brain_v6';
const OLD_KEYS = ['margelet_space_local_brain_v3', 'margelet_space_local_brain_v2'];

function normalizeMemory(memory: Partial<SpaceMemory>): SpaceMemory {
  return {
    turns: Number(memory.turns || 0),
    lastIntent: memory.lastIntent || null,
    favoriteSources: memory.favoriteSources || {},
    topics: memory.topics || {},
    languageHints: memory.languageHints || {},
    lastUserWords: Array.isArray(memory.lastUserWords) ? memory.lastUserWords : [],
    lastSubject: memory.lastSubject || '',
    lastResult: memory.lastResult || null,
    lastDialogMood: memory.lastDialogMood || 'neutral',
    userStyle: {
      wantsShort: Number(memory.userStyle?.wantsShort || 1),
      wantsSources: Number(memory.userStyle?.wantsSources || 0),
      likesMedia: Number(memory.userStyle?.likesMedia || 0),
      likesWarmTone: Number(memory.userStyle?.likesWarmTone || 1),
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

export function learnFromQuery(memory: SpaceMemory, query: string, intent: SpaceIntent, tokens: string[], locale: Locale) {
  memory.turns += 1;
  memory.lastIntent = intent;
  memory.languageHints[locale] = (memory.languageHints[locale] || 0) + 1;
  memory.lastUserWords = tokens.slice(0, 8);

  const lower = normalize(query);
  if (/корот|кратк|short|brief/.test(lower)) memory.userStyle.wantsShort += 0.6;
  if (/источник|source|пост|канал/.test(lower)) memory.userStyle.wantsSources += 0.5;
  if (/фото|картин|видео|image|photo|video/.test(lower)) memory.userStyle.likesMedia += 0.5;
  if (/бро|друг|родн|спасибо|thanks/.test(lower)) memory.userStyle.likesWarmTone += 0.3;
  if (/поговор|поболт|обща|chat|talk/.test(lower)) memory.lastDialogMood = 'warm';

  tokens.forEach((token) => {
    memory.topics[token] = (memory.topics[token] || 0) + 1;
  });
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
