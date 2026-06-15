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
      ? `Ты про ${last.subject}. В прошлой находке была тема состояния, но рейтинг я не подтверждаю без точного источника. Могу поискать точнее.`
      : `You mean ${last.subject}. The previous result mentioned wealth, but I will not confirm a ranking without a precise source. I can search tighter.`;
  }

  if (last.postText) {
    return ctx.lang === 'ru'
      ? `Ты про ${last.subject}. По прошлому найденному посту смысл такой: ${compactText(last.postText, 160)}`
      : `You mean ${last.subject}. From the previous post: ${compactText(last.postText, 160)}`;
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

  const blocks = planBlocks(ranked, ctx.intent, { gallery: ui.galleryTitle, video: ui.videoTitle }, ctx.shouldShowBlocks);
  const text = generateFound(ctx, ranked);
  return { text, blocks, mode: blocks.length ? 'show' : 'answer' };
}

export function synthesizeSoftTalk(ctx: BrainContext): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  const variants = ctx.lang === 'ru'
    ? ['Да, можем. Я рядом — пиши как есть.', 'Конечно. Без поиска, просто поговорим.', 'Давай. Я слушаю.']
    : ['Sure. I’m here — write naturally.', 'Of course. No search, just talk.', 'Let’s talk. I’m listening.'];
  return { text: generateTalk(ctx, variants), blocks: [], mode: 'talk' };
}
