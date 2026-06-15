import type { ConversationContext } from './types';
import { pickBySeed } from './textTools';
import { userPrefix } from './humanizer';

export function empathyLine(ctx: ConversationContext) {
  const prefix = userPrefix(ctx);
  if (ctx.mood === 'sad' || ctx.mood === 'tired') {
    return pickBySeed(ctx.query, [
      `${prefix}давай без давления. Я могу просто поговорить, помочь разложить мысли или переключить тебя на что-то лёгкое.`,
      `${prefix}сейчас не обязательно быть продуктивным. Иногда нормальный первый шаг — просто назвать, что именно давит.`,
      `${prefix}если хочешь, можем идти очень маленькими шагами: что случилось, что чувствуешь, и что можно сделать прямо сегодня.`,
    ]);
  }

  return pickBySeed(ctx.query, [
    `${prefix}я с тобой в диалоге. Не буду сразу превращать это в поисковую выдачу.`,
    `${prefix}давай спокойно. Я могу быть собеседником, а не только поиском.`,
    `${prefix}окей. Сначала человеческий смысл, потом уже инструменты.`,
  ]);
}
