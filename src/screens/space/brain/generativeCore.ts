import type { BrainContext, RankedPost } from './types';
import { getUi } from './locales';
import { maybeEmoji } from './affectEngine';
import { compactText, pick, sentence } from './text';

function namePrefix(ctx: BrainContext) {
  if (!ctx.memory.userName || ctx.memory.turns % 4 !== 0) return '';
  return ctx.lang === 'ru' ? `${ctx.memory.userName}, ` : `${ctx.memory.userName}, `;
}

export function generateTalk(ctx: BrainContext, variants: string[]) {
  const seed = ctx.query.length + ctx.memory.turns + ctx.rawTokens.join('').length;
  return `${namePrefix(ctx)}${pick(variants, seed)}${maybeEmoji(ctx.mood, seed)}`.trim();
}

export function generateNoResult(ctx: BrainContext) {
  const seed = ctx.query.length + ctx.memory.turns;
  if (ctx.lang === 'ru') {
    const variants = [
      'Сейчас в моей базе про это тихо. В Telegram наверняка может быть больше, но в margeleT за текущий поток точного сигнала не вижу.',
      'Пока не вижу надёжного совпадения в margeleT. Можно сузить: страна, источник или ещё одно ключевое слово.',
      'Я понял направление, но не хочу притягивать случайный пост. Дай одну зацепку — и я копну точнее.',
    ];
    return generateTalk(ctx, [pick(variants, seed)]);
  }
  return generateTalk(ctx, [
    'I get the direction, but I do not see a clean margeleT match right now. Add a country, source, or one more keyword and I’ll narrow it down.',
    'It is quiet in my current margeleT flow for this. I can search more tightly if you give me one more clue.',
  ]);
}

export function generateFound(ctx: BrainContext, ranked: RankedPost[]) {
  const best = ranked[0]?.post;
  const ui = getUi(ctx.lang);
  if (!best) return generateNoResult(ctx);
  const seed = ctx.query.length + Math.round(ranked[0].score) + ctx.memory.turns;

  if (!ctx.shouldShowBlocks) {
    const piece = sentence(best.text, ctx.memory.userStyle.wantsShort > 2 ? 120 : 170);
    return ctx.lang === 'ru'
      ? generateTalk(ctx, [`Похоже, в потоке margeleT ближе всего вот это: ${piece}`])
      : generateTalk(ctx, [`Closest margeleT signal I see: ${piece}`]);
  }

  if (ctx.intent === 'images') return pick([ui.foundGallery, 'Собрал визуальные совпадения. Сначала маленькая подборка 👇'], seed);
  if (ctx.intent === 'video') return pick([ui.foundVideo, 'Есть близкие видео. Показываю аккуратно 👇'], seed);
  if (ctx.intent === 'recipe') return pick([ui.recipeFound, 'Нашёл похожий живой рецепт. Сначала один вариант 👇'], seed);
  if (ctx.intent === 'trend') return pick(['Вижу близкий сигнал. Покажу аккуратно 👇', ui.foundOne], seed);
  return pick([ui.foundOne, `Есть близкое совпадение: ${compactText(best.source.title || best.source.handle || 'источник', 42)} 👇`], seed);
}
