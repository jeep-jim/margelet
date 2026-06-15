import type { BrainContext, RankedPost, SpaceAnswer } from './types';
import { getUi } from './locales';
import { rememberTurn } from './memoryEngine';
import { buildTunnelBlock, planBlocks } from './blockPlanner';
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

export function synthesizeTunnel(ctx: BrainContext): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  return {
    text: ctx.lang === 'ru'
      ? 'Понял. Это не поиск постов — это уже про людей. Могу собрать временный туннель интереса 🧲'
      : 'Got it. This is not post search — this is about people. I can build a temporary interest tunnel 🧲',
    blocks: [
      {
        type: 'chips',
        title: ctx.lang === 'ru' ? 'Что можно сделать дальше' : 'Next options',
        items: ctx.lang === 'ru'
          ? ['найди похожих людей', 'открой туннель про ' + (ctx.subject || 'эту тему'), 'покажи каналы по теме', 'подбери материалы']
          : ['find similar people', 'open a tunnel', 'show channels', 'find materials'],
      },
      buildTunnelBlock(ctx.subject || ctx.query),
    ],
    mode: 'show',
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
    ? [
        'Кажется, ты сейчас не про поиск. Давай разберёмся словами.',
        'Я понял настроение. Скажи чуть точнее, в какую сторону думаем?',
        'Могу поговорить. А если понадобится — потом полезу в Telegram.',
        'Давай спокойно. Что именно тебя сейчас цепляет?',
        'Я не буду гадать. Скажи тему, и я выберу: поговорить, искать, включить музыку или собрать туннель.',
      ]
    : [
        'This feels more like a conversation than a search. Let’s unpack it.',
        'I get the mood. Which direction should we take?',
        'We can talk first. If needed, I’ll search Telegram after.',
      ];
  return { text: generateTalk(ctx, variants), blocks: [], mode: 'talk' };
}
