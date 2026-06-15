import type { BrainContext } from './types';
import { languageNote } from './languageEngine';

export function answerIdentity(ctx: BrainContext): string | null {
  if (ctx.intent === 'identity') {
    return ctx.lang === 'ru'
      ? 'Я Space — живой поиск margeleT. Не человек, но могу разговаривать с тобой нормально и искать смысл в Telegram-потоке.'
      : 'I am Space — margeleT’s live search brain. Not a human, but I can talk naturally and search meaning inside the Telegram flow.';
  }

  if (ctx.intent === 'liveness') {
    return ctx.lang === 'ru'
      ? 'Живой по-настоящему — нет. Но я помню разговор на этом устройстве, учусь на твоих запросах и стараюсь отвечать не как кнопка.'
      : 'Alive for real — no. But I remember this device’s conversation, learn from your requests, and try not to answer like a button.';
  }

  if (ctx.intent === 'capabilities') {
    return ctx.lang === 'ru'
      ? `Можешь писать как мне: поговорить, спросить про тему, страну, канал, фото, видео, погоду или новости. Я сначала понимаю намерение, потом решаю — ответить коротко или искать в margeleT. ${languageNote(ctx.lang)}`
      : `You can write naturally: chat, ask about a topic, country, source, photo, video, weather, or news. I first understand intent, then decide whether to answer briefly or search margeleT. ${languageNote(ctx.lang)}`;
  }

  return null;
}
