import type { BrainContext, RankedPost } from './types';
import { getUi } from './locales';
import { softReaction } from './emotionEngine';
import { maybeHumor } from './humorEngine';
import { compactText, hashText, pick, sentence } from './text';
import { describeSignal } from './signalEngine';
import { MARGELET_CORE_PHRASES, resolveManifestLang } from '../knowledge';

function namePrefix(ctx: BrainContext) {
  if (!ctx.memory.userName) return '';
  if ((ctx.memory.turns + hashText(ctx.query)) % 6 !== 0) return '';
  return `${ctx.memory.userName}, `;
}

function cleanTail(ctx: BrainContext, seed: number) {
  if (ctx.intent === 'product' || ctx.intent === 'investor') return '';
  return softReaction(ctx.mood, seed) + maybeHumor(ctx);
}

export function generateTalk(ctx: BrainContext, variants: string[]) {
  const seed = hashText(ctx.query) + ctx.memory.turns + ctx.rawTokens.join('').length;
  return `${namePrefix(ctx)}${pick(variants, seed)}${cleanTail(ctx, seed)}`.trim();
}

export function generateProductTalk(ctx: BrainContext) {
  const phrases = MARGELET_CORE_PHRASES[resolveManifestLang(ctx.lang)];
  const seed = hashText(ctx.query) + ctx.memory.turns;
  const opener = pick(
    ctx.intent === 'investor'
      ? ['Покажу, почему margeleT — не просто лента, а поисковый слой Telegram.']
      : ['margeleT превращает хаос Telegram в понятную карту внимания.'],
    seed
  );
  const phrase = pick(phrases, seed + 3);
  if (ctx.lang === 'ru') return `${opener}\n\n${phrase}`;
  return `${opener}\n\n${phrase}`;
}

export function generateNoResult(ctx: BrainContext) {
  const seed = hashText(ctx.query) + ctx.memory.turns;
  if (ctx.lang === 'ru') {
    const variants = [
      'Сейчас внутри margeleT об этом почти ничего не говорят. Не буду притягивать случайные посты.',
      'У себя не вижу чистого сигнала. Можно дать ещё одну зацепку — страну, канал или другое слово.',
      'Пока тихо в моём Telegram-потоке. Это не значит, что темы нет вообще — просто в margeleT она сейчас не вспыхнула.',
    ];
    return generateTalk(ctx, [pick(variants, seed)]);
  }
  return generateTalk(ctx, [
    'It is quiet inside my current margeleT flow. I will not force random posts.',
    'I do not see a clean signal here. Add a country, source, or one more word and I’ll narrow it down.',
  ]);
}

export function generateFound(ctx: BrainContext, ranked: RankedPost[]) {
  const best = ranked[0]?.post;
  const ui = getUi(ctx.lang);
  if (!best) return generateNoResult(ctx);
  const seed = hashText(ctx.query) + Math.round(ranked[0].score) + ctx.memory.turns;
  const signal = describeSignal(ctx.lang, ranked);

  if (!ctx.shouldShowBlocks) {
    const piece = sentence(best.text, ctx.memory.userStyle.wantsShort > 2 ? 110 : 160);
    return ctx.lang === 'ru'
      ? generateTalk(ctx, [`Вижу близкую мысль в потоке: ${piece}`])
      : generateTalk(ctx, [`I see a close thought in the flow: ${piece}`]);
  }

  if (ctx.intent === 'images') return pick([ui.foundGallery, 'Собрал визуальные совпадения. Без простыни.'], seed);
  if (ctx.intent === 'video') return pick([ui.foundVideo, 'Есть близкие видео. Сначала небольшая подборка.'], seed);
  if (ctx.intent === 'weather') return pick(['Похоже, есть погодный сигнал из Telegram.', 'Нашёл погодную зацепку в потоке.'], seed);
  if (ctx.intent === 'recipe') return pick([ui.recipeFound, 'Нашёл похожий живой рецепт. Сначала один вариант.'], seed);
  if (ctx.intent === 'trend') return pick([`Вижу сигнал: ${signal}.`, ui.foundOne], seed);
  return pick([ui.foundOne, `Есть близкое совпадение: ${compactText(best.source.title || best.source.handle || 'источник', 42)}.`], seed);
}
