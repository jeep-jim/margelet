import type { SpaceAnswer, SpaceBlock } from '../brain/types';
import { buildInvestorBlocks } from '../knowledge';
import type { SpaceOSDecision, SpaceOSInput, SpaceOSMemory } from './types';
import { readSpaceOSMemory, rememberSpaceOSTurn, writeSpaceOSMemory } from './spaceMemory';
import { routeSpaceOS } from './spaceRouter';
import { runInternetTool, searchTelegramSupplement } from './spaceTools';
import { getLocalLlmStatus, tryLocalLlmReply, warmLocalLlm } from './localLlmOS';

function compact(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function isRu(decision: Pick<SpaceOSDecision, 'lang'>) {
  return decision.lang === 'ru';
}

function tunnelBlock(topic: string): SpaceBlock {
  return {
    type: 'tunnel',
    title: 'Туннель интереса',
    subtitle: 'Черновик 24-часового локального туннеля. Переписку не храним как соцсеть; дальше подключим приглашения через Telegram.',
    topic: topic || 'общая тема',
    people: [
      { name: 'Катя', note: 'может искать похожий интерес' },
      { name: 'Саша', note: 'может быть рядом по теме' },
    ],
    cta: 'Открыть туннель на 24 часа',
  };
}

function nameAnswer(query: string, memory: SpaceOSMemory): SpaceAnswer | null {
  const q = query.toLowerCase().replace(/ё/g, 'е');
  const set = query.match(/(?:меня\s+зовут|зови\s+меня|мое\s+имя|моё\s+имя|my\s+name\s+is|call\s+me)\s+([^.!?\n]{2,42})/i);
  if (set?.[1]) {
    const name = set[1].trim().replace(/[,.!?]+$/g, '');
    writeSpaceOSMemory({ ...memory, userName: name, updatedAt: Date.now() });
    return { text: `Запомнил: ${name}. Только на этом устройстве.`, blocks: [], mode: 'talk' };
  }
  if (/я\s+не\s+арсений|я\s+не\s+стас|не\s+называй\s+меня/.test(q)) {
    writeSpaceOSMemory({ ...memory, userName: '', updatedAt: Date.now() });
    return { text: 'Понял, убрал имя из локальной памяти.', blocks: [], mode: 'talk' };
  }
  if (/как\s+зовут\s+меня|мое\s+имя|моё\s+имя|what\s+is\s+my\s+name/.test(q)) {
    return {
      text: memory.userName ? `Ты назывался: ${memory.userName}.` : 'Ты ещё не называл имя. Можешь написать: “меня зовут …”.',
      blocks: [],
      mode: 'talk',
    };
  }
  return null;
}

function extractFacts(blocks: SpaceBlock[]) {
  const facts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'weather') facts.push(`${block.title}: ${block.summary}`);
    if (block.type === 'webInfo') {
      facts.push(`${block.title}: ${block.summary}`);
      block.facts?.slice(0, 4).forEach((fact) => facts.push(fact));
    }
    if (block.type === 'chart') {
      const last = block.points[block.points.length - 1];
      if (last) facts.push(`${block.title}: последнее значение ${last.value} (${last.label})`);
    }
    if (block.type === 'music') {
      facts.push(`Найдено треков: ${block.tracks.length}. Первый: ${block.tracks[0]?.title || ''}`);
    }
    if (block.type === 'shop') {
      facts.push(`Найдено вариантов: ${block.items.length}. Первый: ${block.items[0]?.title || ''}`);
    }
    if (block.type === 'gallery') facts.push(`Найдена медиаподборка: ${block.items.length} элементов.`);
    if (block.type === 'quote') facts.push(`Сигнал margeleT от ${block.title}: ${block.text.slice(0, 180)}`);
  }
  return facts.map(compact).filter(Boolean).slice(0, 8);
}

function toolLead(decision: SpaceOSDecision, blocks: SpaceBlock[]) {
  const ru = isRu(decision);
  if (decision.tool === 'weather') return ru ? 'Проверил погоду по открытым данным.' : 'I checked live weather data.';
  if (decision.tool === 'music') return ru ? 'Нашёл варианты трека. Жми на строку — плеер останется внизу.' : 'I found track options. Tap one and the player will stay in the tray.';
  if (decision.tool === 'images') return ru ? 'Собрал визуальную подборку.' : 'I collected a visual set.';
  if (decision.tool === 'video') return ru ? 'Собрал видео и превью.' : 'I collected videos and previews.';
  if (decision.tool === 'finance') return ru ? 'Собрал быстрый график. Это не инвестиционный совет.' : 'I built a quick chart. This is not financial advice.';
  if (decision.tool === 'shopping') return ru ? 'Нашёл первые варианты в открытых источниках.' : 'I found initial options from open sources.';
  if (decision.tool === 'biography') return ru ? 'Собрал короткую справку.' : 'I collected a compact reference.';
  if (blocks.some((block) => block.type === 'quote')) return ru ? 'В свежем потоке margeleT есть близкий сигнал.' : 'There is a close signal in the fresh margeleT flow.';
  return ru ? 'Проверил открытые источники.' : 'I checked open sources.';
}

function fallbackTalk(query: string, decision: SpaceOSDecision, memory: SpaceOSMemory) {
  const q = query.toLowerCase().replace(/ё/g, 'е');
  const name = memory.userName ? `${memory.userName}, ` : '';
  const ru = isRu(decision);

  if (!ru) {
    if (/hello|hi|hey/.test(q)) return `Hey${memory.userName ? `, ${memory.userName}` : ''}. I’m here. We can talk, search the web, build widgets, or look at live margeleT signals.`;
    return `I’m here. I can talk it through first, and if we need facts I’ll search the web instead of forcing Telegram.`;
  }

  if (/^(привет|здаров|здравствуй|салам|хай)\b/.test(q)) {
    return `${name}привет 🙂 Я здесь. Можем просто поговорить, а если понадобится — я полезу в сеть и соберу факты или виджет.`;
  }
  if (/ты\s+тут|ты\s+здесь|слышишь|слушаешь/.test(q)) {
    return `${name}тут. Слушаю тебя.`;
  }
  if (/устал|устала|грустно|плохо|одинок|выгор/.test(q)) {
    return `${name}понял. Тогда не буду превращать это в поисковую выдачу. Что сильнее давит сейчас: усталость, тревога или просто всё надоело?`;
  }
  if (/совет|бизнес|деньг|работ|карьер|иде/.test(q)) {
    return `${name}давай разберём без магии. Сначала надо понять цель: тебе нужны быстрые деньги, своё дело на будущее или просто новая точка опоры?`;
  }
  if (/спор|не соглас|думаешь|правда|мнение/.test(q)) {
    return `${name}я бы тут не соглашался автоматически. Давай разложим: что в этой мысли выглядит сильным, а где может быть ловушка?`;
  }
  if (/кошк|кот|собак|жизн|истори|пенси|реформ|любов|отношен/.test(q)) {
    return `${name}могу поговорить об этом нормально, без Telegram. Я сначала отвечу своими словами, а если понадобятся факты — проверю сеть.`;
  }
  if (decision.tool === 'chat') {
    return `${name}я понял направление. Скажу по-человечески: можно просто обсудить мысль, можно поспорить, а можно превратить её в поиск по интернету.`;
  }
  return `${name}я попробовал разобрать запрос. Если нужны точные факты — лучше сразу включить поиск по сети, а не гадать.`;
}

function statusBlock(): SpaceBlock {
  const status = getLocalLlmStatus();
  const ready = status.status === 'ready';
  const loading = status.status === 'loading';
  return {
    type: 'stat',
    title: 'Local AI',
    value: ready ? 'ready' : loading ? 'loading' : status.status,
    caption: ready
      ? 'Локальная модель отвечает в браузере.'
      : loading
        ? 'Модель ещё загружается. Первый запуск может быть долгим.'
        : 'Сейчас работает честный fallback + инструменты. Для WebLLM нужен браузер с WebGPU или включенный browser AI.',
    tone: ready ? 'green' : loading ? 'blue' : 'orange',
  };
}

async function answerWithLlmOrFallback(input: SpaceOSInput, decision: SpaceOSDecision, memory: SpaceOSMemory, facts?: string[]) {
  const llmText = await tryLocalLlmReply({
    query: input.query,
    locale: input.locale,
    decision,
    memory,
    facts,
    timeoutMs: decision.tool === 'chat' ? 10000 : 5500,
  });
  return llmText || fallbackTalk(input.query, decision, memory);
}

export async function runSpaceOS(input: SpaceOSInput): Promise<SpaceAnswer> {
  warmLocalLlm(input.locale);

  const memory = readSpaceOSMemory();
  const name = nameAnswer(input.query, memory);
  if (name) return name;

  const decision = routeSpaceOS(input.query, input.locale);
  const updatedMemory = rememberSpaceOSTurn(memory, input.query, decision);

  if (/\b(ai|llm|webllm|local ai|локальная модель|статус модели|модель)\b/i.test(input.query)) {
    return { text: 'Показываю честный статус генератора речи.', blocks: [statusBlock()], mode: 'show' };
  }

  if (decision.tool === 'product') {
    const text = await answerWithLlmOrFallback(input, decision, updatedMemory, [
      'margeleT превращает Telegram-поток в индекс внимания.',
      'Space — разговорный слой поверх интернета, виджетов и свежих сигналов.',
    ]);
    return {
      text,
      blocks: buildInvestorBlocks(input.query, decision.lang),
      mode: 'present',
    };
  }

  if (decision.tool === 'tunnel') {
    return {
      text: isRu(decision)
        ? 'Это уже про людей, а не про выдачу. Покажу черновик туннеля интереса.'
        : 'This is about people, not search results. I’ll show a tunnel draft.',
      blocks: [tunnelBlock(decision.subject)],
      mode: 'show',
    };
  }

  if (decision.tool === 'chat') {
    const text = await answerWithLlmOrFallback(input, decision, updatedMemory);
    return { text, blocks: [], mode: 'talk' };
  }

  const external = decision.useInternet ? await runInternetTool(decision) : { text: '', blocks: [] as SpaceBlock[] };
  const telegramBlocks = decision.useTelegram ? searchTelegramSupplement(input.posts, decision, external.blocks.length ? 1 : 2) : [];
  const blocks = [...external.blocks, ...telegramBlocks];

  if (blocks.length) {
    const facts = extractFacts(blocks);
    const llmLead = await tryLocalLlmReply({
      query: input.query,
      locale: input.locale,
      decision,
      memory: updatedMemory,
      facts,
      timeoutMs: 4500,
    });
    return {
      text: llmLead || external.text || toolLead(decision, blocks),
      blocks,
      mode: 'show',
    };
  }

  const text = await answerWithLlmOrFallback(input, decision, updatedMemory, [
    isRu(decision)
      ? 'Инструменты не вернули уверенный результат.'
      : 'Tools did not return a confident result.',
  ]);
  return { text, blocks: [], mode: 'talk' };
}
