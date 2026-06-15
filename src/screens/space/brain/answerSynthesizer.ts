import type { BrainContext, RankedPost, SpaceAnswer } from './types';
import { getUi } from './locales';
import { rememberTurn } from './memoryEngine';
import { planBlocks } from './blockPlanner';
import { compactText } from './text';
import { generateFound, generateNoResult, generateProductTalk, generateTalk } from './generativeCore';
import { buildInvestorBlocks } from '../knowledge';

function answerFromPreviousFact(ctx: BrainContext): string | null {
  if (!ctx.memory.lastResult?.subject) return null;
  if (!/(он|она|они|его|ее|её|him|her|it|they|he|she)/.test(ctx.normalized)) return null;
  const last = ctx.memory.lastResult;

  if (/(богат|состояни|миллиард|rich|wealth)/.test(ctx.normalized)) {
    return ctx.lang === 'ru'
      ? `Ты про ${last.subject}. Я не буду подтверждать рейтинг без чистого источника. Могу поискать точнее по margeleT.`
      : `You mean ${last.subject}. I will not confirm a ranking without a clean source. I can search margeleT more precisely.`;
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

export function synthesizeProduct(ctx: BrainContext): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: 'margeleT', tokens: ctx.tokens });
  return {
    text: generateProductTalk(ctx),
    blocks: buildInvestorBlocks(ctx.query, ctx.lang),
    mode: 'present',
  };
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
    ? ['Да.', 'Понял.', 'Хорошо.', 'Можно.', 'Я рядом.', 'Давай спокойно.', 'Интересно. Продолжай.', 'С этого места подробнее.']
    : ['Yes.', 'Got it.', 'Okay.', 'Sure.', 'I’m here.', 'Let’s keep it calm.', 'Interesting. Go on.', 'Tell me more from there.'];
  return { text: generateTalk(ctx, variants), blocks: [], mode: 'talk' };
}
