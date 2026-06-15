import type { ConversationContext } from './types';
import { compactLines, pickBySeed } from './textTools';

const BANNED = [
  /\bуточни\b/gi,
  /\bне\s+понял\b/gi,
  /\bне\s+наш[её]л\b/gi,
  /\bя\s+только\s+telegram\b/gi,
  /\bскаж[иите]+\s+еще\b/gi,
  /\bс\s+этого\s+места\s+подробнее\b/gi,
  /\bя\s+рядом\b/gi,
  /\bя\s+слушаю\b/gi,
];

export function userPrefix(ctx: ConversationContext) {
  return ctx.userName ? `${ctx.userName}, ` : '';
}

export function cleanRobotPhrases(text: string) {
  let next = String(text || '').trim();
  for (const pattern of BANNED) {
    next = next.replace(pattern, '');
  }
  return next.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

export function makeNatural(ctx: ConversationContext, lines: string[]) {
  const text = cleanRobotPhrases(compactLines(lines));
  if (text.length > 8) return text;
  return pickBySeed(ctx.query, [
    'Давай разберёмся спокойно 🙂 Я попробую сначала понять смысл, а уже потом полезу искать факты.',
    'Окей, давай по-человечески. Сначала мысль, потом уже поиск и виджеты.',
    'Понял направление. Я не буду превращать это в сухую выдачу — сначала поговорим нормально.',
  ]);
}
