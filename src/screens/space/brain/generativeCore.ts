import type { BrainContext, RankedPost } from './types';
import { getUi } from './locales';
import { softReaction } from './emotionEngine';
import { maybeHumor } from './humorEngine';
import { compactText, pick, sentence } from './text';
import { describeSignal } from './signalEngine';

function namePrefix(ctx: BrainContext) {
  if (!ctx.memory.userName || ctx.memory.turns % 5 !== 0) return '';
  return `${ctx.memory.userName}, `;
}

export function generateTalk(ctx: BrainContext, variants: string[]) {
  const seed = ctx.query.length + ctx.memory.turns + ctx.rawTokens.join('').length;
  const tail = softReaction(ctx.mood, seed) + maybeHumor(ctx);
  return `${namePrefix(ctx)}${pick(variants, seed)}${tail}`.trim();
}

export function generateNoResult(ctx: BrainContext) {
  const seed = ctx.query.length + ctx.memory.turns;
  if (ctx.lang === 'ru') {
    const variants = [
      'В моём текущем потоке margeleT про это тихо. В интернете наверняка что-то есть — но у себя сейчас не вижу чистого сигнала.',
      'Не хочу притягивать случайный пост. Сейчас в margeleT нет точного совпадения, можно дать ещё одну зацепку — и я сузю поиск.',
      'Пока пусто по моей базе. Значит, в Telegram-потоке margeleT это сейчас не вспыхнуло.',
    ];
    return generateTalk(ctx, [pick(variants, seed)]);
  }
  return generateTalk(ctx, [
    'It is quiet in my current margeleT flow. The wider internet may have it, but I do not see a clean signal here yet.',
    'I do not want to force a random post. Give me one more clue and I’ll narrow it down.',
  ]);
}

export function generateFound(ctx: BrainContext, ranked: RankedPost[]) {
  const best = ranked[0]?.post;
  const ui = getUi(ctx.lang);
  if (!best) return generateNoResult(ctx);
  const seed = ctx.query.length + Math.round(ranked[0].score) + ctx.memory.turns;
  const signal = describeSignal(ctx.lang, ranked);

  if (!ctx.shouldShowBlocks) {
    const piece = sentence(best.text, ctx.memory.userStyle.wantsShort > 2 ? 110 : 160);
    return ctx.lang === 'ru'
      ? generateTalk(ctx, [`Вижу близкую мысль в потоке: ${piece}`])
      : generateTalk(ctx, [`I see a close thought in the flow: ${piece}`]);
  }

  if (ctx.intent === 'images') return pick([ui.foundGallery, 'Собрал визуальные совпадения. Покажу без простыни.'], seed);
  if (ctx.intent === 'video') return pick([ui.foundVideo, 'Есть близкие видео. Сначала маленькая подборка.'], seed);
  if (ctx.intent === 'weather') return pick(['Похоже, есть погодный сигнал из Telegram.', 'Нашёл погодную зацепку в потоке.'], seed);
  if (ctx.intent === 'recipe') return pick([ui.recipeFound, 'Нашёл похожий живой рецепт. Сначала один вариант.'], seed);
  if (ctx.intent === 'trend') return pick([`Вижу сигнал: ${signal}.`, ui.foundOne], seed);
  return pick([ui.foundOne, `Есть близкое совпадение: ${compactText(best.source.title || best.source.handle || 'источник', 42)}.`], seed);
}
