import type { IngestedPost, Locale } from '../../../types/app';
import type { BrainContext, SpaceState } from './types';
import { detectIntent, isExplicitSearchRequest, isProductQuestion, isQuestionAboutSpace, isPureDialogMessage } from './intentEngine';
import { readMemory } from './memoryEngine';
import { detectSpaceLanguage } from './languageEngine';
import { normalize, PRONOUN_HINTS, tokenize } from './text';
import { detectMood } from './emotionEngine';
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
  const music = query.match(/(?:включи|поставь|послушать)\s+(.+)/i)?.[1]?.trim();
  if (music) return music.replace(/[?.!,]+$/g, '').slice(0, 72);
  const capitalized = query.match(/[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+(?:\s+[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+){0,3}/g);
  if (capitalized?.length) return capitalized[capitalized.length - 1].trim();
  return tokens.slice(0, 4).join(' ');
}

function effectiveTokens(query: string, rawTokens: string[], lastSubject: string) {
  if (!hasPronounFollowup(query, lastSubject)) return rawTokens;
  return Array.from(new Set([...rawTokens, ...tokenize(lastSubject)])).slice(0, 18);
}

function inferState(intent: BrainContext['intent'], isPureDialog: boolean): SpaceState {
  if (['investor','product','monetization','architecture','growth','risk'].includes(intent)) return intent === 'investor' ? 'investing' : 'presenting';
  if (intent === 'tunnel') return 'connecting';
  if (['trend','search','recipe','weather','images','video','source','music'].includes(intent)) return 'discovering';
  if (intent === 'fact' || intent === 'advice') return 'explaining';
  if (isPureDialog) return 'listening';
  return 'thinking';
}

export function buildContext(query: string, posts: IngestedPost[], locale: Locale): BrainContext {
  const memory = readMemory();
  const normalized = normalize(query);
  const rawTokens = tokenize(query);
  const lang = detectSpaceLanguage(query, locale);
  const { intent, confidence } = detectIntent(query);
  const tokens = effectiveTokens(query, rawTokens, memory.lastSubject);
  const subject = extractSubject(query, rawTokens, memory.lastSubject);
  const isExplicitSearch = isExplicitSearchRequest(normalized);
  const questionAboutSpace = isQuestionAboutSpace(normalized);
  const productQuestion = isProductQuestion(normalized) || ['investor','product','monetization','architecture','growth','risk'].includes(intent);
  const isProductIntent = ['investor','product','monetization','architecture','growth','risk'].includes(intent);
  const isPureDialog = !isProductIntent && !['tunnel','music'].includes(intent) && (isPureDialogMessage(query, intent) || (!isExplicitSearch && questionAboutSpace));
  const mood = detectMood(query) === 'neutral' ? memory.lastDialogMood : detectMood(query);
  const state = inferState(intent, isPureDialog);
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
    isProductQuestion: productQuestion,
    isPureDialog,
    wantsChips: false,
    mood,
    state,
    attention,
    shouldSearch: false,
    shouldShowBlocks: false,
    searchQuery: attentionText(attention) || subject || rawTokens.join(' '),
  } satisfies BrainContext;

  const policy = applyReplyPolicy(base);
  return { ...base, ...policy };
}
