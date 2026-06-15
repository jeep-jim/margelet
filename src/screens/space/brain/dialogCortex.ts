import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn, extractUserName } from './memoryEngine';
import { getUi } from './locales';
import { generateAdviceTalk, generateTalk } from './generativeCore';
import { answerIdentity } from './identityEngine';
import { hashText, pick } from './text';

function finishTalk(ctx: BrainContext, text: string): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  return { text, blocks: [], mode: 'talk' };
}

function withName(ctx: BrainContext) {
  const name = extractUserName(ctx.query);
  if (!name) return ctx.lang === 'ru' ? 'Запомнил. Имя буду хранить только на этом устройстве.' : 'Got it. I’ll keep that only on this device.';
  return ctx.lang === 'ru'
    ? `Запомнил, ${name}. Буду обращаться так.`
    : `Got it, ${name}. I’ll remember that on this device.`;
}

function answerNameQuestion(ctx: BrainContext) {
  if (!/(как\s+зовут\s+меня|как\s+мо[её]\s+имя|мо[её]\s+имя|what\s+is\s+my\s+name)/.test(ctx.normalized)) return null;
  if (!ctx.memory.userName) return ctx.lang === 'ru'
    ? 'Ты ещё не называл имя. Скажи “меня зовут …”, и я запомню на этом устройстве.'
    : 'You have not told me yet. Say “my name is …” and I’ll remember it on this device.';
  return ctx.lang === 'ru' ? `Тебя зовут ${ctx.memory.userName}.` : `Your name is ${ctx.memory.userName}.`;
}

function smallTalk(ctx: BrainContext) {
  const seed = hashText(ctx.query) + ctx.memory.turns;
  const name = ctx.memory.userName ? `${ctx.memory.userName}, ` : '';
  if (ctx.lang === 'ru') {
    const variants = [
      `${name}я тут. О чём хочешь поговорить?`,
      'Много чего слышал 😄 Что тебя интересует?',
      'Можно просто поболтать. Без ленты и карточек.',
      'Давай. Только если захочешь искать — скажешь прямо.',
      'Я пока не волшебник, но учусь им быть 🙂 Что разбираем?',
      'С удовольствием. Это про жизнь, работу, деньги или просто настроение?',
      'Окей. Сначала поговорим, а в Telegram полезем только если попросишь.',
    ];
    return generateTalk(ctx, [pick(variants, seed)]);
  }
  return generateTalk(ctx, [pick([
    'I’m here. What do you want to talk about?',
    'I’ve heard plenty 😄 What are you curious about?',
    'Sure. We can just talk — no feed, no cards.',
    'Okay. I’ll search only if you ask directly.',
  ], seed)]);
}

function answerLooseQuestion(ctx: BrainContext) {
  if (!/^(что|где|с\s+какого|а\s+что|what|where)\??$/.test(ctx.normalized)) return null;
  if (ctx.memory.lastIntent === 'permissionTalk') {
    return ctx.lang === 'ru'
      ? 'Я к тому, что можно писать как человеку: мысль, вопрос, тему или даже сомнение. Я сначала пойму, а уже потом решу — говорить или искать.'
      : 'I mean you can write like to a person: a thought, question, topic, or doubt. I’ll understand first, then decide whether to talk or search.';
  }
  return ctx.lang === 'ru' ? 'Дай мне ещё одну зацепку: про что именно?' : 'Give me one more clue: what is it about?';
}

export function tryDialogAnswer(ctx: BrainContext): SpaceAnswer | null {
  const ui = getUi(ctx.lang);
  const nameAnswer = answerNameQuestion(ctx);
  const identity = answerIdentity(ctx);

  if (ctx.intent === 'nameMemory') return finishTalk(ctx, withName(ctx));
  if (nameAnswer) return finishTalk(ctx, nameAnswer);
  if (identity) return finishTalk(ctx, identity);
  if (ctx.intent === 'greeting') return finishTalk(ctx, generateTalk(ctx, ui.hello));
  if (ctx.intent === 'thanks') return finishTalk(ctx, generateTalk(ctx, ui.thanks));
  if (ctx.intent === 'advice') {
    rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
    return {
      text: generateAdviceTalk(ctx),
      blocks: [{
        type: 'chips',
        title: ctx.lang === 'ru' ? 'Могу повести в одну сторону' : 'Choose a direction',
        items: ctx.lang === 'ru' ? ['свой бизнес', 'идеи без денег', 'найти людей', 'каналы с опытом', 'просто поговорить'] : ['business', 'ideas without money', 'find people', 'channels with experience'],
      }],
      mode: 'clarify',
    };
  }
  if (ctx.intent === 'permissionTalk') return finishTalk(ctx, smallTalk(ctx));
  if (ctx.intent === 'smalltalk') return finishTalk(ctx, answerLooseQuestion(ctx) || smallTalk(ctx));

  if (ctx.isQuestionAboutSpace && !ctx.isExplicitSearch && !ctx.isProductQuestion) {
    if (/(спрашивать|спросить|можно|умеешь|можешь)/.test(ctx.normalized)) {
      rememberTurn({ memory: ctx.memory, query: ctx.query, intent: 'capabilities', found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
      return {
        text: answerIdentity({ ...ctx, intent: 'capabilities' }) || ui.capabilities,
        blocks: [{
          type: 'chips',
          title: ctx.lang === 'ru' ? 'Попробуй так' : 'Try this',
          items: ctx.lang === 'ru'
            ? ['что пишут про Илона Маска', 'погода Москва', 'включи Billie Jean', 'открой туннель про бизнес', 'покажи видео про футбол', 'что такое margeleT']
            : ['news about Elon Musk', 'weather in Moscow', 'play Billie Jean', 'open a business tunnel', 'show football videos', 'what is margeleT'],
        }],
        mode: 'talk',
      };
    }
    return finishTalk(ctx, smallTalk(ctx));
  }

  return null;
}
