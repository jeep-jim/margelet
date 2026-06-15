import type { ConversationContext } from './types';
import { pickBySeed } from './textTools';
import { userPrefix } from './humanizer';

export function debateLine(ctx: ConversationContext) {
  const prefix = userPrefix(ctx);
  return pickBySeed(ctx.query, [
    `${prefix}я бы с этим чуть поспорил 😄 Не потому что ты не прав, а потому что там есть второй слой.`,
    `${prefix}спорная мысль. Часто кажется, что ответ очевиден, но реальность обычно хитрее.`,
    `${prefix}я понимаю ход мысли, но не уверен, что вывод единственный. Давай проверим его на прочность.`,
    `${prefix}может быть. Но если принять это за истину сразу, мы можем пропустить более сильное объяснение.`,
  ]);
}
