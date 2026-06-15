import type { IngestedPost, Locale } from '../../../types/app';
import type { BrainContext } from './types';
import { detectIntent, isExplicitSearchRequest, isPureDialogMessage, isQuestionAboutSpace } from './intentEngine';
import { readMemory } from './memoryEngine';
import { detectLanguage, normalize, PRONOUN_HINTS, tokenize } from './text';
import { detectMood } from './affectEngine';
import { buildAttention, attentionText } from './attentionEngine';
import { applyReplyPolicy } from './replyPolicy';

function hasPronounFollowup(query: string, lastSubject: string) {
  const lower = normalize(query);
  return Boolean(lastSubject) && PRONOUN_HINTS.some((hint) => lower.split(' ').includes(hint));
}

function extractSubject(query: string, tokens: string[], lastSubject: string) {
  if (hasPronounFollowup(query, lastSubject)) return lastSubject;
  const explicit = query.match(/(?:про|about|о)\s+([^?.!,]+)/i)?.[1]?.trim();
  if (explicit) return explicit.replace(/[?.!,]+$/g, '').slice(0, 72);
  const capitalized = query.match(/[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+(?:\s+[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+){0,3}/g);
  if (capitalized?.length) return capitalized[capitalized.length - 1].trim();
  return tokens.slice(0, 4).join(' ');
}

function effectiveTokens(query: string, rawTokens: string[], lastSubject: string) {
  if (!hasPronounFollowup(query, lastSubject)) return rawTokens;
  return Array.from(new Set([...rawTokens, ...tokenize(lastSubject)])).slice(0, 18);
}

export function buildContext(query: string, posts: IngestedPost[], locale: Locale): BrainContext {
  const memory = readMemory();
  const normalized = normalize(query);
  const rawTokens = tokenize(query);
  const lang = detectLanguage(query, locale);
  const { intent, confidence } = detectIntent(query);
  const tokens = effectiveTokens(query, rawTokens, memory.lastSubject);
  const subject = extractSubject(query, rawTokens, memory.lastSubject);
  const isExplicitSearch = isExplicitSearchRequest(normalized);
  const questionAboutSpace = isQuestionAboutSpace(normalized);
  const isPureDialog = isPureDialogMessage(query, intent) || (!isExplicitSearch && questionAboutSpace);
  const mood = detectMood(query) === 'neutral' ? memory.lastDialogMood : detectMood(query);
  const attention = buildAttention(query, subject, memory, posts);
  const base = {
    query,
    normalized,
    tokens,
    rawTokens,
    locale,
    lang,
    memory,
    posts,
    intent,
    confidence,
    subject,
    isExplicitSearch,
    isQuestionAboutSpace: questionAboutSpace,
    isPureDialog,
    wantsChips: false,
    mood,
    attention,
    shouldSearch: false,
    shouldShowBlocks: false,
    searchQuery: attentionText(attention) || subject || rawTokens.join(' '),
  } satisfies BrainContext;

  const policy = applyReplyPolicy(base);
  return { ...base, ...policy };
}
