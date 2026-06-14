import type { BrainContext, RankedPost, SpaceAnswer } from './types';
import { getUi } from './locales';
import { rememberTurn } from './memoryEngine';
import { planBlocks } from './blockPlanner';
import { compactText } from './text';

function answerFromPreviousFact(ctx: BrainContext): string | null {
  if (!ctx.memory.lastResult?.subject) return null;
  if (!/(он|она|они|его|ее|её|him|her|it|they|he|she)/.test(ctx.normalized)) return null;
  const last = ctx.memory.lastResult;

  if (/(богат|состояни|миллиард|rich|wealth)/.test(ctx.normalized)) {
    return `Ты про ${last.subject}. В найденном посте была тема состояния, но я не буду подтверждать рейтинг без точного источника. Могу поискать точнее.`;
  }

  if (last.postText) return `Ты про ${last.subject}. По прошлому найденному посту смысл такой: ${compactText(last.postText, 180)}`;
  return null;
}

export function synthesizeNoResult(ctx: BrainContext): SpaceAnswer {
  const ui = getUi(ctx.lang);
  const previous = ctx.intent === 'fact' ? answerFromPreviousFact(ctx) : null;
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  return { text: previous || (ctx.intent === 'fact' ? ui.factCareful : ui.noExact), blocks: [], mode: 'clarify' };
}

export function synthesizeFound(ctx: BrainContext, ranked: RankedPost[]): SpaceAnswer {
  const ui = getUi(ctx.lang);
  const found = ranked.map((item) => item.post);
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found, locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });

  const blocks = planBlocks(ranked, ctx.intent, { gallery: ui.galleryTitle, video: ui.videoTitle });

  let text = ui.foundOne;
  if (ctx.intent === 'recipe') text = ui.recipeFound;
  if (ctx.intent === 'images') text = ui.foundGallery;
  if (ctx.intent === 'video') text = ui.foundVideo;

  return { text, blocks, mode: blocks.length ? 'show' : 'answer' };
}
