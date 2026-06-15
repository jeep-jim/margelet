import type { BrainContext, RankedPost, SpaceAnswer } from './types';
import { getUi } from './locales';
import { rememberTurn } from './memoryEngine';
import { planBlocks } from './blockPlanner';
import { compactText } from './text';
import { generateFound, generateNoResult, generateTalk } from './generativeCore';

function answerFromPreviousFact(ctx: BrainContext): string | null {
  if (!ctx.memory.lastResult?.subject) return null;
  if (!/(он|она|они|его|ее|её|him|her|it|they|he|she)/.test(ctx.normalized)) return null;
  const last = ctx.memory.lastResult;

  if (/(богат|состояни|миллиард|rich|wealth)/.test(ctx.normalized)) {
    return ctx.lang === 'ru'
      ? `Ты про ${last.subject}. По прошлой находке тема денег рядом, но точный рейтинг я не подтвержу без чистого источника.`
      : `You mean ${last.subject}. The previous result was near money/wealth, but I will not confirm a ranking without a clean source.`;
  }

  if (last.postText) {
    return ctx.lang === 'ru'
      ? `Ты про ${last.subject}. По прошлому найденному посту смысл такой: ${compactText(last.postText, 150)}`
      : `You mean ${last.subject}. From the previous post: ${compactText(last.postText, 150)}`;
  }
  return null;
}

export function synthesizeNoResult(ctx: BrainContext): SpaceAnswer {
  const previous = ctx.intent === 'fact' ? answerFromPreviousFact(ctx) : null;
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  return { text: previous || generateNoResult(ctx), blocks: [], mode: ctx.shouldSearch ? 'clarify' : 'talk' };
}

export function synthesizeFound(ctx: BrainContext, ranked: RankedPost[]): SpaceAnswer {
  const ui = getUi(ctx.lang);
  const found = ranked.map((item) => item.post);
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found, locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });

  const blocks = planBlocks(ranked, ctx.intent, { gallery: ui.galleryTitle, video: ui.videoTitle }, ctx.shouldShowBlocks, ctx.subject);
  const text = generateFound(ctx, ranked);
  return { text, blocks, mode: blocks.length ? 'show' : 'answer' };
}

export function synthesizeSoftTalk(ctx: BrainContext): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  const variants = ctx.lang === 'ru'
    ? ['Да, можем. Я рядом.', 'Конечно. Без поиска — просто разговор.', 'Давай. Я слушаю.', 'Понял. Пиши, как человеку.']
    : ['Sure. I’m here.', 'Of course. No search — just talk.', 'Let’s talk. I’m listening.', 'Got it. Write like to a person.'];
  return { text: generateTalk(ctx, variants), blocks: [], mode: 'talk' };
}
