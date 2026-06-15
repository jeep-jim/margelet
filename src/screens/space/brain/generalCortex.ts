import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn } from './memoryEngine';
import { hashText, pick } from './text';

const RU_COMMON_TOPICS = [
  'кошка','кот','котик','собак','животн','жизн','пенси','реформ','истори','войн','кино','фильм','любов','отношен','работ','деньг','семь','страх','мечт','будущ','прошл','счаст','одиноч','учеб','школ','университет','здоров','спорт','книга','музык','игр','путешеств','переезд','политик','экономик','философ','смысл'
];

function isGeneralHumanTopic(ctx: BrainContext) {
  if (ctx.isExplicitSearch || ctx.shouldSearch || ctx.isProductQuestion) return false;
  if (ctx.intent !== 'smalltalk' && ctx.intent !== 'fact' && ctx.intent !== 'search') return false;
  if (ctx.rawTokens.length < 2) return false;
  return RU_COMMON_TOPICS.some((topic) => ctx.normalized.includes(topic));
}

function buildRuAnswer(ctx: BrainContext) {
  const q = ctx.normalized;
  const name = ctx.memory.userName ? `${ctx.memory.userName}, ` : '';

  if (/кошк|кот|котик/.test(q)) {
    return pick([
      `${name}про кошек могу говорить спокойно 😄 Они странные, но очень честные: если доверяют — это видно сразу. Ты про свою кошку или просто тема зацепила?`,
      `Кошки — это маленькие независимые начальники дома. Тут лучше уточню: хочешь забавный разговор, совет по уходу или поискать, что пишут про кошек в Telegram?`,
    ], hashText(ctx.query));
  }

  if (/пенси|реформ|политик|экономик/.test(q)) {
    return pick([
      `${name}тема тяжёлая. Я могу обсудить общую логику, но не буду делать вид, что знаю всю правду. Если хочешь, могу отдельно поискать живые реакции в Telegram.`,
      `Тут важно разделять мнение и сигнал. Могу сначала поговорить простыми словами, а потом показать, что реально обсуждают в потоке margeleT.`,
    ], hashText(ctx.query));
  }

  if (/истори|войн|прошл/.test(q)) {
    return pick([
      `История редко бывает про одну простую версию. Я могу разобрать тему спокойно: кто, когда, почему и какие версии обычно спорят между собой.`,
      `${name}давай аккуратно. История любит детали. Назови событие или эпоху — и я объясню без занудства.`,
    ], hashText(ctx.query));
  }

  if (/кино|фильм/.test(q)) {
    return pick([
      `Могу посоветовать фильм, но сначала вкус: комедия, триллер, фантастика, драма или что-то лёгкое на вечер?`,
      `Фильм на вечер — это не просто жанр 😄 Ты хочешь расслабиться, посмеяться или чтобы прям зацепило?`,
    ], hashText(ctx.query));
  }

  if (/жизн|смысл|счаст|одиноч|страх|мечт/.test(q)) {
    return pick([
      `${name}это уже не про поиск, а про разговор. Давай без умничанья: что именно сейчас внутри — тревога, усталость, интерес или хочется разобраться?`,
      `Про жизнь я могу говорить, но честно: я не психолог и не волшебник. Зато могу быть нормальным собеседником и помочь разложить мысль по полкам.`,
    ], hashText(ctx.query));
  }

  if (/деньг|работ|бизнес|заработ/.test(q)) {
    return pick([
      `Деньги — это уже практичная тема. Ты ищешь идею, работу, подработку или хочешь понять, на чём вообще можно строить своё дело?`,
      `${name}давай не будем придумывать магию. Сначала уточним: тебе нужен быстрый заработок, бизнес-идея или люди с опытом?`,
    ], hashText(ctx.query));
  }

  return pick([
    `${name}могу поговорить. Только уточни угол: тебе нужен мой взгляд, короткое объяснение или поиск по Telegram?`,
    `Я понял тему, но хочу не гадать. Давай чуть точнее — и я отвечу нормально, без случайной выдачи.`,
  ], hashText(ctx.query));
}

export function tryGeneralAnswer(ctx: BrainContext): SpaceAnswer | null {
  if (!isGeneralHumanTopic(ctx)) return null;
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  if (ctx.lang === 'ru') return { text: buildRuAnswer(ctx), blocks: [], mode: 'talk' };

  return {
    text: `I can talk about that, but I’ll be honest: I’m strongest when I connect a topic to live Telegram signals. Give me a little more context and I’ll answer normally, not like a search box.`,
    blocks: [],
    mode: 'talk',
  };
}
