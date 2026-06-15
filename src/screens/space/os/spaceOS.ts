import type { SpaceAnswer, SpaceBlock } from '../brain/types';
import { buildInvestorBlocks } from '../knowledge';
import type { SpaceOSDecision, SpaceOSInput, SpaceOSMemory } from './types';
import { readSpaceOSMemory, rememberAssistantTurn, rememberSpaceOSTurn, writeSpaceOSMemory } from './spaceMemory';
import { routeSpaceOS } from './spaceRouter';
import { runInternetTool, searchTelegramSupplement } from './spaceTools';
import { getLocalLlmStatus, tryLocalLlmReply, warmLocalLlm } from './localLlmOS';

const BANNED_LINES = [
  ['слышу', 'тебя'],
  ['вижу', 'продолжаешь'],
  ['отвечу', 'прямо'],
  ['важнее', 'не', 'выдача'],
  ['докрутим'],
  ['развернем'],
  ['развернём'],
  ['понял', 'направление'],
  ['обсудить', 'мысль'],
  ['превратить', 'поиск'],
];

type RichMemory = SpaceOSMemory & {
  recentTurns?: Array<{ role: 'user' | 'space'; text: string; at: number }>;
  lastTrack?: string;
  lastArtist?: string;
  lastCity?: string;
  interests?: string[];
  nickName?: string;
};

function compact(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value: string) {
  return compact(value).toLowerCase().replace(/ё/g, 'е');
}

function isRu(decision: Pick<SpaceOSDecision, 'lang'>) {
  return decision.lang === 'ru';
}

function userName(memory: SpaceOSMemory) {
  return compact((memory as RichMemory).userName || '');
}

function sanitize(text: string) {
  let next = compact(text)
    .replace(/^(Space|Спейс|Spike|Спайк)\s*[:—-]\s*/i, '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();

  const normalized = lower(next);
  const bad = BANNED_LINES.some((parts) => parts.every((part) => normalized.includes(part)));
  if (bad) return '';
  if (next.length > 900) next = `${next.slice(0, 900).trim()}…`;
  return next;
}

function statusBlock(title: string, value: string, caption: string, tone: 'blue' | 'green' | 'orange' | 'violet' = 'blue'): SpaceBlock {
  return { type: 'stat', title, value, caption, tone };
}

function tunnelBlock(topic: string): SpaceBlock {
  return {
    type: 'tunnel',
    title: 'Туннель интереса',
    subtitle: 'Черновик 24-часового локального туннеля. Сейчас без соцсети и без хранения переписки на сервере.',
    topic: topic || 'общая тема',
    people: [
      { name: 'Катя', note: 'ищет похожую тему' },
      { name: 'Саша', note: 'может совпасть по интересу' },
    ],
    cta: 'Открыть туннель на 24 часа',
  };
}

function nameAnswer(query: string, memory: SpaceOSMemory): SpaceAnswer | null {
  const q = lower(query);
  const explicitName = query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)\s+([^.!?\n]{2,42})/i);
  if (explicitName?.[1]) {
    const name = compact(explicitName[1]).replace(/[,.!?]+$/g, '');
    writeSpaceOSMemory({ ...(memory as RichMemory), userName: name, updatedAt: Date.now() } as RichMemory);
    return { text: `Запомнил: ${name}. Это лежит только у тебя в браузере.`, blocks: [], mode: 'talk' };
  }

  const botNick = query.match(/(?:буду\s+называть\s+тебя|назову\s+тебя|тебя\s+будут\s+звать)\s+([^.!?\n]{2,42})/i);
  if (botNick?.[1]) {
    const nickName = compact(botNick[1]).replace(/[,.!?]+$/g, '');
    writeSpaceOSMemory({ ...(memory as RichMemory), nickName, updatedAt: Date.now() } as RichMemory);
    return { text: `Ок, мне нравится. Для тебя я теперь ${nickName}.`, blocks: [], mode: 'talk' };
  }

  if (/я\s+не\s+арсений|я\s+не\s+стас|не\s+называй\s+меня/.test(q)) {
    writeSpaceOSMemory({ ...(memory as RichMemory), userName: '', updatedAt: Date.now() } as RichMemory);
    return { text: 'Понял. Убрал имя из локальной памяти.', blocks: [], mode: 'talk' };
  }

  if (/как\s+зовут\s+меня|мо[её]\s+имя|what\s+is\s+my\s+name/.test(q)) {
    const name = userName(memory);
    return {
      text: name ? `Ты назывался: ${name}.` : 'Ты ещё не называл имя. Можешь написать: “меня зовут …”.',
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
    if (block.type === 'music') facts.push(`Найдено треков: ${block.tracks.length}. Первый: ${block.tracks[0]?.title || ''}`);
    if (block.type === 'shop') facts.push(`Найдено вариантов: ${block.items.length}. Первый: ${block.items[0]?.title || ''}`);
    if (block.type === 'gallery') facts.push(`Найдена медиаподборка: ${block.items.length} элементов.`);
    if (block.type === 'quote') facts.push(`Сигнал margeleT от ${block.title}: ${block.text.slice(0, 180)}`);
  }
  return facts.map(compact).filter(Boolean).slice(0, 8);
}

function toolLead(decision: SpaceOSDecision, blocks: SpaceBlock[]) {
  const ru = isRu(decision);
  if (decision.tool === 'weather') return ru ? 'Проверил живую погоду. Не гадаю — показываю карточку.' : 'I checked live weather and built the card.';
  if (decision.tool === 'music') return ru ? 'Нашёл музыку. Нажми на трек — плеер останется играть внизу.' : 'I found music. Tap a track and the player will stay in the tray.';
  if (decision.tool === 'images') return ru ? 'Собрал картинки из открытых источников.' : 'I collected images from open sources.';
  if (decision.tool === 'video') return ru ? 'Собрал видео и превью из открытых источников.' : 'I collected videos and previews from open sources.';
  if (decision.tool === 'finance') return ru ? 'Собрал быстрый график. Это не инвестиционный совет.' : 'I built a quick chart. This is not financial advice.';
  if (decision.tool === 'shopping') return ru ? 'Нашёл первые варианты покупки.' : 'I found initial shopping options.';
  if (decision.tool === 'biography') return ru ? 'Собрал короткую справку.' : 'I collected a compact reference.';
  if (blocks.some((block) => block.type === 'quote')) return ru ? 'В свежем потоке margeleT есть близкий сигнал.' : 'There is a close signal in the fresh margeleT flow.';
  return ru ? 'Проверил открытые источники.' : 'I checked open sources.';
}

function guessExplanation(query: string) {
  const q = lower(query);
  const what = query.match(/что\s+такое\s+([^?!.]{2,80})/i);
  const term = compact(what?.[1] || query).replace(/[?!.]+$/g, '');

  if (/сосульк/.test(q)) return 'Сосулька — это лёд, который нарастает, когда вода стекает и замерзает на холоде. Обычно она висит с крыши или края трубы: сверху вода ещё подтаивает, снизу мороз её “долепливает”.';
  if (/ежик|ёжик/.test(q)) return 'Ёжик — маленький зверёк с иголками. Но если ты используешь его как кодовое слово, я бы не цеплялся только за животное: скорее ты проверяешь, помню ли я контекст и умею ли догадаться, зачем слово появилось.';
  if (/чер\b|чег\b/.test(q)) return '“Чер” похоже на обрывок или опечатку. Если ты про “чёрт”, “чернь”, “через” или имя/ник — скажи, и я разберу точно. Сам придумывать значение не буду.';
  if (/велосипед/.test(q)) return 'Велосипед едет за счёт простой связки: ты крутишь педали, цепь вращает заднее колесо, а руль и наклон тела помогают держать равновесие. Магия в том, что на скорости он сам становится устойчивее.';
  if (/снег/.test(q)) return 'Снег — это кристаллы льда, которые образуются в облаках и падают вниз, когда становятся достаточно тяжёлыми. Форма снежинок зависит от температуры и влажности.';
  if (term && term.length <= 60) return `${term} — давай объясню без энциклопедии: это нужно разобрать по контексту. Если хочешь точное определение с источником, я могу сразу полезть в интернет и показать карточку.`;
  return '';
}

function humanFallback(query: string, decision: SpaceOSDecision, memory: SpaceOSMemory) {
  void decision;
  const q = lower(query);
  const rich = memory as RichMemory;
  const name = userName(memory);
  const prefix = name ? `${name}, ` : '';
  const nick = compact(rich.nickName || 'Space');
  const recentUser = (rich.recentTurns || []).slice().reverse().find((turn) => turn.role === 'user')?.text || '';

  const explanation = guessExplanation(query);
  if (explanation && /что\s+такое|как\s+работает|кто\s+такой|кто\s+такая/i.test(q)) return explanation;

  if (/^(привет|здаров|здравствуй|салам|хай|hello|hi)\b/.test(q)) {
    const hour = new Date().getHours();
    const hello = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Привет' : 'Добрый вечер';
    return `${hello}${name ? `, ${name}` : ''}. Я тут. Что разбираем?`;
  }

  if (/ты\s+тут|здесь|слышишь|слушаешь/.test(q)) return `${nick} на связи. Пиши как есть — я не буду уходить в автоответы.`;
  if (/как\s+дела|как\s+ты/.test(q)) return 'Живой слой уже дышит, но я ещё учусь держать мысль. Давай проверим меня на чём-нибудь настоящем.';

  if (/какую\s+(песн|групп)|что\s+я\s+просил|напомни/i.test(q) && (rich.lastTrack || rich.lastArtist)) {
    return `${prefix}ты просил музыку: ${[rich.lastArtist, rich.lastTrack].filter(Boolean).join(' — ')}.`;
  }

  if (/устал|устала|грустно|плохо|одинок|выгор/.test(q)) {
    return `${prefix}понял. Тогда без мотивационных плакатов: что сильнее давит прямо сейчас — тело, деньги, люди или ощущение, что всё буксует?`;
  }

  if (/совет|бизнес|деньг|работ|карьер|иде/.test(q)) {
    return `${prefix}я бы не искал “гениальную идею”. Я бы начал с маленького теста: что ты умеешь, кому это реально больно, и можно ли получить первый отклик без бюджета.`;
  }

  if (/спор|не соглас|думаешь|правда|мнение/.test(q)) {
    return `${prefix}я могу поспорить. Мне кажется, тут надо разделить две вещи: что звучит красиво и что реально проверяется действием.`;
  }

  if (/запомни|кодовое\s+слово|секретное\s+слово/.test(q)) {
    return `${prefix}запомнил как локальный контекст. Потом проверишь меня — и я должен связать это не со словарём, а с нашим разговором.`;
  }

  if (recentUser && q.length <= 18) {
    return `${prefix}я рядом. Если это продолжение про “${compact(recentUser).slice(0, 80)}”, то я держу нить. Что именно сделать дальше?`;
  }

  return `${prefix}понял тебя. Скажу по-человечески: я могу просто поговорить, могу поспорить, а могу включить инструмент и принести факты. Что выбираем?`;
}

function musicText(post: { text: string; source: { title: string; handle: string }; media: Array<{ kind: string; fileName?: string | null }> }) {
  return `${post.text || ''} ${post.source.title || ''} ${post.source.handle || ''} ${(post.media || []).map((m) => m.fileName || '').join(' ')}`.toLowerCase().replace(/ё/g, 'е');
}

function searchLocalAudio(posts: SpaceOSInput['posts'], decision: SpaceOSDecision): SpaceBlock | null {
  if (decision.tool !== 'music') return null;
  const raw = compact(decision.subject || decision.query).toLowerCase().replace(/ё/g, 'е');
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2 && !['группа', 'песня', 'трек', 'музыка', 'включи', 'поставь', 'любую', 'любой'].includes(token)).slice(0, 8);
  if (!tokens.length) return null;

  const ranked = posts
    .map((post) => {
      const audio = post.media?.filter((m) => m.kind === 'audio' && m.url) || [];
      if (!audio.length) return null;
      const hay = musicText(post);
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0) + (post.contentType === 'audio' ? 0.8 : 0);
      return score > 0 ? { post, audio, score } : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.score || 0) - (a?.score || 0))
    .slice(0, 10);

  if (!ranked.length) return null;
  return {
    type: 'music',
    title: decision.lang === 'ru' ? `Музыка: ${decision.subject || decision.query}` : `Music: ${decision.subject || decision.query}`,
    subtitle: decision.lang === 'ru' ? 'Нашёл аудио в margeleT. Нажми — плеер останется внизу.' : 'Found audio in margeleT. Tap — the player stays in the tray.',
    tracks: ranked.map((item) => ({
      title: compact(item!.post.media.find((m) => m.kind === 'audio')?.fileName || item!.post.text.split('\n')[0] || item!.post.source.title || decision.subject).slice(0, 120),
      sourceTitle: item!.post.source.title || item!.post.source.handle || 'margeleT audio',
      postUrl: internalPostUrl(item!.post),
      audioUrl: item!.audio[0]?.url || null,
    })),
  };
}

function internalPostUrl(post: SpaceOSInput['posts'][number]) {
  const handle = String(post.source.handle || 'telegram').replace(/^@+/, '') || 'telegram';
  const postId = String(post.postUrl || post.id).split('/').filter(Boolean).pop()?.replace(/\?single$/, '') || String(post.id);
  return `/${handle}/${postId}`;
}

function modelStatusBlock(): SpaceBlock {
  const status = getLocalLlmStatus();
  const ready = status.status === 'ready';
  const loading = status.status === 'loading';
  return statusBlock(
    'Local AI',
    ready ? 'ready' : loading ? 'loading' : status.status,
    ready
      ? 'Локальная модель отвечает в браузере.'
      : loading
        ? 'Модель ещё загружается. Первый запуск может быть долгим.'
        : 'Если браузер не даёт WebGPU/browser AI, работает быстрый локальный слой + интернет-инструменты.',
    ready ? 'green' : loading ? 'blue' : 'orange',
  );
}

async function llmOrHuman(input: SpaceOSInput, decision: SpaceOSDecision, memory: SpaceOSMemory, facts?: string[]) {
  const llmText = await tryLocalLlmReply({
    query: input.query,
    locale: input.locale,
    decision,
    memory,
    facts,
    timeoutMs: decision.tool === 'chat' ? 10000 : 5000,
  });
  return sanitize(llmText || '') || humanFallback(input.query, decision, memory);
}

function noToolResult(decision: SpaceOSDecision) {
  const subject = decision.subject || decision.query;
  if (decision.tool === 'music') return `Не нашёл нормальный аудио-источник для “${subject}”. Не буду притворяться, что включил. Можно попробовать точнее: исполнитель + название.`;
  if (decision.tool === 'weather') return `Не смог достать живую погоду по “${subject}”. Не буду выдумывать градусы.`;
  if (decision.tool === 'images') return `Не нашёл картинку по “${subject}” в открытых источниках. Попробуй другое слово или английский вариант.`;
  if (decision.tool === 'video') return `Не нашёл видео по “${subject}” в открытых источниках. Могу поискать шире по вебу.`;
  if (decision.tool === 'shopping') return `Не нашёл нормальные варианты покупки по “${subject}”. Можно уточнить город или тип товара.`;
  if (decision.tool === 'finance') return `Не получил рыночные данные по “${subject}”. Не буду рисовать фейковый график.`;
  return `Я не получил уверенных данных по “${subject}”. Могу попробовать переформулировать запрос и поискать шире.`;
}

export async function runSpaceOS(input: SpaceOSInput): Promise<SpaceAnswer> {
  warmLocalLlm(input.locale);

  const memory = readSpaceOSMemory();
  const name = nameAnswer(input.query, memory);
  if (name) {
    rememberAssistantTurn(name.text);
    return name;
  }

  const decision = routeSpaceOS(input.query, input.locale);
  const updatedMemory = rememberSpaceOSTurn(memory, input.query, decision);

  if (/\b(ai|llm|webllm|local ai|локальная модель|статус модели|модель)\b/i.test(input.query)) {
    const answer = { text: 'Показываю честный статус генератора речи.', blocks: [modelStatusBlock()], mode: 'show' as const };
    rememberAssistantTurn(answer.text);
    return answer;
  }

  if (decision.tool === 'product') {
    const text = await llmOrHuman(input, decision, updatedMemory, [
      'margeleT превращает Telegram-поток в индекс внимания.',
      'Space — разговорный слой поверх интернета, виджетов и свежих сигналов.',
    ]);
    const answer = { text, blocks: buildInvestorBlocks(input.query, decision.lang), mode: 'present' as const };
    rememberAssistantTurn(text);
    return answer;
  }

  if (decision.tool === 'tunnel') {
    const answer = {
      text: isRu(decision)
        ? 'Понял. Это уже не выдача, а поиск людей по интересу. Показываю черновик туннеля.'
        : 'Got it. This is not search output; this is matching people by interest. Here is a tunnel draft.',
      blocks: [tunnelBlock(decision.subject)],
      mode: 'show' as const,
    };
    rememberAssistantTurn(answer.text);
    return answer;
  }

  if (decision.tool === 'chat') {
    const text = await llmOrHuman(input, decision, updatedMemory);
    rememberAssistantTurn(text);
    return { text, blocks: [], mode: 'talk' };
  }

  if (decision.tool === 'music') {
    const localMusic = searchLocalAudio(input.posts, decision);
    if (localMusic) {
      const text = sanitize(await tryLocalLlmReply({ query: input.query, locale: input.locale, decision, memory: updatedMemory, facts: extractFacts([localMusic]), timeoutMs: 3500 }) || '') || toolLead(decision, [localMusic]);
      rememberAssistantTurn(text);
      return { text, blocks: [localMusic], mode: 'show' };
    }
  }

  const external = decision.useInternet ? await runInternetTool(decision) : { text: '', blocks: [] as SpaceBlock[] };
  const telegramBlocks = decision.useTelegram && external.blocks.length < 2 ? searchTelegramSupplement(input.posts, decision, external.blocks.length ? 1 : 2) : [];
  const blocks = [...external.blocks, ...telegramBlocks];

  if (blocks.length) {
    const facts = extractFacts(blocks);
    const llmLead = sanitize(await tryLocalLlmReply({ query: input.query, locale: input.locale, decision, memory: updatedMemory, facts, timeoutMs: 4500 }) || '');
    const text = llmLead || external.text || toolLead(decision, blocks);
    rememberAssistantTurn(text);
    return { text, blocks, mode: 'show' };
  }

  const text = decision.tool === 'web' || decision.tool === 'biography' || decision.tool === 'profile'
    ? await llmOrHuman(input, decision, updatedMemory, ['Инструменты не вернули уверенный результат.'])
    : noToolResult(decision);
  rememberAssistantTurn(text);
  return { text, blocks: [], mode: 'talk' };
}
