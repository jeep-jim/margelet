import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn, extractUserName } from './memoryEngine';
import { getUi } from './locales';
import { generateTalk } from './generativeCore';
import { answerIdentity } from './identityEngine';

function finishTalk(ctx: BrainContext, text: string): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  return { text, blocks: [], mode: 'talk' };
}

function withName(ctx: BrainContext) {
  const name = extractUserName(ctx.query);
  if (!name) return ctx.lang === 'ru' ? 'Запомнил. Буду держать это в памяти на этом устройстве.' : 'Got it. I’ll keep that on this device.';
  return ctx.lang === 'ru'
    ? `Запомнил, ${name}. Буду обращаться так.`
    : `Got it, ${name}. I’ll remember that on this device.`;
}

function smallTalk(ctx: BrainContext) {
  if (ctx.lang === 'ru') {
    const variants = [
      'Я тут. Давай просто поговорим — без ленты и без лишних карточек.',
      'Можно. Пиши как есть, я не буду сразу лезть в поиск.',
      'Да, бро. Я слушаю.',
      'Я на месте. Что у тебя в голове?',
      'Давай спокойно. Могу просто отвечать, а не тащить посты.',
    ];
    return generateTalk(ctx, variants);
  }
  return generateTalk(ctx, [
    'I’m here. We can just talk — no feed, no cards.',
    'Sure. Write naturally, I will not jump into search.',
    'I’m listening. What’s on your mind?',
  ]);
}

export function tryDialogAnswer(ctx: BrainContext): SpaceAnswer | null {
  const ui = getUi(ctx.lang);
  const identity = answerIdentity(ctx);

  if (ctx.intent === 'nameMemory') return finishTalk(ctx, withName(ctx));
  if (identity) return finishTalk(ctx, identity);
  if (ctx.intent === 'greeting') return finishTalk(ctx, generateTalk(ctx, ui.hello));
  if (ctx.intent === 'thanks') return finishTalk(ctx, generateTalk(ctx, ui.thanks));
  if (ctx.intent === 'permissionTalk') return finishTalk(ctx, smallTalk(ctx));
  if (ctx.intent === 'smalltalk') return finishTalk(ctx, smallTalk(ctx));

  if (ctx.isQuestionAboutSpace && !ctx.isExplicitSearch) {
    if (/(спрашивать|спросить|можно)/.test(ctx.normalized)) return finishTalk(ctx, answerIdentity({ ...ctx, intent: 'capabilities' }) || ui.capabilities);
    return finishTalk(ctx, smallTalk(ctx));
  }

  return null;
}
