import type { BrainContext, RankedPost } from './types';
import { softReaction } from './emotionEngine';
import { maybeHumor } from './humorEngine';
import { compactText, hashText, pick } from './text';
import { describeSignal } from './signalEngine';
import { MARGELET_CORE_PHRASES, resolveManifestLang } from '../knowledge';

function namePrefix(ctx: BrainContext) {
  if (!ctx.memory.userName) return '';
  if ((ctx.memory.turns + hashText(ctx.query)) % 6 !== 0) return '';
  return `${ctx.memory.userName}, `;
}

function cleanTail(ctx: BrainContext, seed: number) {
  if (ctx.intent === 'product' || ctx.intent === 'investor') return '';
  const tail = softReaction(ctx.mood, seed) + maybeHumor(ctx);
  return tail.length > 16 ? ` ${tail}` : tail;
}

export function generateTalk(ctx: BrainContext, variants: string[]) {
  const seed = hashText(ctx.query) + ctx.memory.turns + ctx.rawTokens.join('').length;
  return `${namePrefix(ctx)}${pick(variants, seed)}${cleanTail(ctx, seed)}`.trim();
}

export function generateAdviceTalk(ctx: BrainContext) {
  const lower = ctx.normalized;
  if (ctx.lang !== 'ru') {
    if (/business|money|idea/.test(lower)) return 'Ideas and money — serious pair. Are you looking for a job, side income, or your own business?';
    return 'I can try. What area is this about: work, money, relationships, or life in general?';
  }

  if (/идеи\s+и\s+деньги|нет\s+идей|нет\s+денег|свой\s+бизнес|хочу\s+бизнес/.test(lower)) {
    return 'Идеи и деньги — крепкая связка 😄 Ты хочешь своё дело, подработку или работу с ростом? Давай уточним, иначе я начну гадать.';
  }

  if (/а\s+ты\s+не\s+можешь|ты\s+сам\s+не\s+можешь/.test(lower)) {
    return 'Я бы рад, но честно: я не бизнес-наставник и не волшебник. Моя сильная сторона — найти людей, каналы и живой опыт в Telegram. Давай зацепимся за направление.';
  }

  return 'Могу попробовать. Про что совет: деньги, работа, отношения, идея или просто жизнь?';
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
    pick([
      'It is quiet inside my current margeleT flow. I will not force random posts.',
      'I do not see a clean signal here. Add a country, source, or one more word and I’ll narrow it down.',
    ], seed),
  ]);
}

export function generateFound(ctx: BrainContext, ranked: RankedPost[]) {
  const best = ranked[0]?.post;
  const ui = ctx.lang === 'ru';
  if (!best) return generateNoResult(ctx);
  const seed = hashText(ctx.query + Math.round(ranked[0].score)) + ctx.memory.turns;
  const signal = describeSignal(ctx.lang, ranked);

  if (!ctx.shouldShowBlocks) {
    const piece = compactText(best.text, 140);
    return ui ? `Нашёл близкую мысль: ${piece}` : `I see a close thought in the flow: ${piece}`;
  }

  if (ctx.intent === 'images' || ctx.intent === 'video') return pick(ui ? [
    'Собрал медиа по смыслу. Небольшая подборка 👇',
    'Нашёл визуальные совпадения. Покажу аккуратно 👇',
  ] : [
    'I found media by meaning. Small set below 👇',
    'I found visual matches. Showing a small set 👇',
  ], seed);

  if (ctx.intent === 'weather') return pick(ui ? ['Похоже, есть погодный сигнал из Telegram.', 'Нашёл погодную зацепку в потоке.'] : ['Looks like there is a weather signal from Telegram.', 'I found a weather clue in the flow.'], seed);
  if (ctx.intent === 'recipe') return pick(ui ? ['Нашёл похожий рецепт. Сначала один вариант 👇', 'Есть один домашний вариант. Покажу без простыни 👇'] : ['I found a close recipe. One option first 👇'], seed);
  if (ctx.intent === 'music') return pick(ui ? ['Нашёл музыкальные совпадения 🎵', 'Есть несколько вариантов. Что включаем? 🎵'] : ['I found music matches 🎵', 'I found a few options. What should we play? 🎵'], seed);
  if (ctx.intent === 'trend') return ui ? `Вижу сигнал: ${signal}.` : `I see a signal: ${signal}.`;
  return pick(ui ? ['Нашёл кое-что похожее 👇', 'Есть близкая зацепка. Покажу один вариант 👇'] : ['I found something close 👇', 'I found a close clue. One option first 👇'], seed);
}
