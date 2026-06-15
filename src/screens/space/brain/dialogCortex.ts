import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn, extractUserName } from './memoryEngine';
import { getUi } from './locales';
import { generateTalk } from './generativeCore';
import { answerIdentity } from './identityEngine';
import { hashText, pick } from './text';

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
  const seed = hashText(ctx.query) + ctx.memory.turns;
  if (ctx.lang === 'ru') {
    const variants = [
      'Конечно. Не каждый разговор должен превращаться в поиск.',
      'Да, можем просто поговорить.',
      'Я здесь. Пиши как есть.',
      'Можно. Без ленты и без карточек.',
      'Хорошо. Давай без суеты.',
      'Понял. Тогда просто общаемся.',
      'Да. А что у тебя на уме?',
      'Окей, остаюсь в режиме разговора.',
      'Супер. Я не буду тащить посты без явного запроса.',
      'Давай. Только теперь без попугайства, я стараюсь думать контекстом.',
    ];
    return generateTalk(ctx, [pick(variants, seed)]);
  }
  return generateTalk(ctx, [pick([
    'Of course. Not every talk has to become a search.',
    'Sure, we can just talk.',
    'I’m here. Write naturally.',
    'Okay. No feed, no cards.',
    'Got it. I’ll stay in dialogue mode.',
  ], seed)]);
}

function answerLooseQuestion(ctx: BrainContext) {
  if (!/^(что|а\s+что|what)\??$/.test(ctx.normalized)) return null;
  if (ctx.memory.lastIntent === 'permissionTalk') {
    return ctx.lang === 'ru'
      ? 'Я к тому, что можешь писать без команды. Не “найди”, не “покажи” — просто мысль, вопрос или тему.'
      : 'I mean you can write without a command. Not “find” or “show” — just a thought, question, or topic.';
  }
  return ctx.lang === 'ru' ? 'Уточни чуть-чуть, и я подхвачу.' : 'Give me one more clue and I’ll catch it.';
}

export function tryDialogAnswer(ctx: BrainContext): SpaceAnswer | null {
  const ui = getUi(ctx.lang);
  const identity = answerIdentity(ctx);

  if (ctx.intent === 'nameMemory') return finishTalk(ctx, withName(ctx));
  if (identity) return finishTalk(ctx, identity);
  if (ctx.intent === 'greeting') return finishTalk(ctx, generateTalk(ctx, ui.hello));
  if (ctx.intent === 'thanks') return finishTalk(ctx, generateTalk(ctx, ui.thanks));
  if (ctx.intent === 'permissionTalk') return finishTalk(ctx, smallTalk(ctx));
  if (ctx.intent === 'smalltalk') return finishTalk(ctx, answerLooseQuestion(ctx) || smallTalk(ctx));

  if (ctx.isQuestionAboutSpace && !ctx.isExplicitSearch && !ctx.isProductQuestion) {
    if (/(спрашивать|спросить|можно)/.test(ctx.normalized)) return finishTalk(ctx, answerIdentity({ ...ctx, intent: 'capabilities' }) || ui.capabilities);
    return finishTalk(ctx, smallTalk(ctx));
  }

  return null;
}
