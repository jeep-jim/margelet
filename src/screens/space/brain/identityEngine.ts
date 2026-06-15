import type { BrainContext } from './types';
import { languageNote } from './languageEngine';

export function answerIdentity(ctx: BrainContext): string | null {
  if (ctx.intent === 'identity') {
    return ctx.lang === 'ru'
      ? 'Я Space — мозг margeleT. Не человек, но могу вести диалог, помнить тебя на этом устройстве и искать смысл внутри Telegram-потока.'
      : 'I am Space — margeleT’s brain. Not a human, but I can keep a dialogue, remember you on this device, and search meaning inside Telegram flow.';
  }

  if (ctx.intent === 'liveness') {
    return ctx.lang === 'ru'
      ? 'Я не человек. Но я не просто кнопка поиска: сначала понимаю, что ты хочешь, потом решаю — поговорить, уточнить или искать в margeleT.'
      : 'I am not human. But I am not just a search button: I first understand what you want, then decide whether to talk, clarify, or search margeleT.';
  }

  if (ctx.intent === 'capabilities') {
    return ctx.lang === 'ru'
      ? `Можно писать обычным языком: поговорить, спросить про страну, тему, канал, фото, видео, погоду, тренд или сам margeleT. Я не обязан сразу сыпать постами — сначала разбираюсь в намерении. ${languageNote(ctx.lang)}`
      : `You can write naturally: chat, ask about a country, topic, source, photo, video, weather, trend, or margeleT itself. I do not have to dump posts first — I read the intent first. ${languageNote(ctx.lang)}`;
  }

  return null;
}
