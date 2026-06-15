import { buildInvestorBlocks } from '../knowledge';
import type { SpaceAnswer, SpaceBlock, SpaceOSDecision, SpaceOSInput, SpaceOSMemory } from './types';
import { readSpaceOSMemory, rememberAssistantTurn, rememberSpaceOSTurn, writeSpaceOSMemory } from './spaceMemory';
import { routeSpaceOS } from './spaceRouter';
import { runInternetTool, searchTelegramSupplement } from './spaceTools';
import { getLocalLlmStatus, tryLocalLlmReply } from './localLlmOS';

const HARD_BANNED = [
  'слышу тебя',
  'вижу ты продолжаешь',
  'отвечу прямо',
  'важнее не выдача',
  'докрутим',
  'развернем',
  'развернём',
  'понял направление',
  'обсудить мысль',
  'превратить ее в поиск',
  'превратить её в поиск',
  'локальная модель не дала ответ',
  'могу продолжить только через инструмент',
];

const STOP = new Set(
  'и в во на по про для что это как кто где когда почему зачем можно можешь надо нужно хочу покажи расскажи объясни включи поставь найди дай мне ты я он она оно они мы вы а но или же ли бы не да нет ок окей бро друг пожалуйста'.split(' '),
);

function compact(value: unknown) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function lower(value: unknown) {
  return compact(value).toLowerCase().replace(/ё/g, 'е');
}

function sanitize(text: string) {
  let next = compact(text)
    .replace(/^(Space|Спейс|Spike|Спайк)\s*[:—-]\s*/i, '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();

  const hay = lower(next);
  if (HARD_BANNED.some((line) => hay.includes(lower(line)))) return '';
  if (next.length > 1100) next = `${next.slice(0, 1100).trim()}…`;
  return next;
}

function isRu(decision: Pick<SpaceOSDecision, 'lang'>) {
  return decision.lang === 'ru';
}

function internalPostUrl(post: SpaceOSInput['posts'][number]) {
  const handle = String(post.source.handle || 'telegram').replace(/^@+/, '') || 'telegram';
  const postId = String(post.postUrl || post.id).split('/').filter(Boolean).pop()?.replace(/\?single$/, '') || String(post.id);
  return `/${handle}/${postId}`;
}

function textOfPost(post: SpaceOSInput['posts'][number]) {
  return `${post.text || ''} ${post.source.title || ''} ${post.source.handle || ''} ${(post.media || []).map((m) => `${m.fileName || ''} ${m.url || ''}`).join(' ')}`
    .toLowerCase()
    .replace(/ё/g, 'е');
}

function keywords(query: string) {
  return lower(query)
    .replace(/[^a-zа-я0-9\s-]+/gi, ' ')
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 2 && !STOP.has(x))
    .slice(0, 10);
}

function rememberNameOrCode(query: string, memory: SpaceOSMemory): SpaceAnswer | null {
  const q = lower(query);

  const explicitName = query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)\s+([^.!?\n]{2,42})/i);
  if (explicitName?.[1]) {
    const name = compact(explicitName[1]).replace(/[,.!?]+$/g, '');
    writeSpaceOSMemory({ ...memory, userName: name, updatedAt: Date.now() });
    return { text: `Запомнил: ${name}.`, blocks: [], mode: 'talk' };
  }

  const botNick = query.match(/(?:буду\s+называть\s+тебя|назову\s+тебя|тебя\s+будут\s+звать)\s+([^.!?\n]{2,42})/i);
  if (botNick?.[1]) {
    const nickName = compact(botNick[1]).replace(/[,.!?]+$/g, '');
    writeSpaceOSMemory({ ...memory, nickName, updatedAt: Date.now() });
    return { text: `Ок, для тебя я теперь ${nickName}.`, blocks: [], mode: 'talk' };
  }

  if (/я\s+не\s+арсений|я\s+не\s+стас|не\s+называй\s+меня/.test(q)) {
    writeSpaceOSMemory({ ...memory, userName: '', updatedAt: Date.now() });
    return { text: 'Убрал имя из локальной памяти.', blocks: [], mode: 'talk' };
  }

  if (/как\s+зовут\s+меня|мо[её]\s+имя|what\s+is\s+my\s+name/.test(q)) {
    const name = compact(memory.userName || '');
    return { text: name ? `Ты назывался: ${name}.` : 'Имя пока не записано в локальной памяти.', blocks: [], mode: 'talk' };
  }

  const code = query.match(/(?:запомни|кодовое\s+слово|секретное\s+слово)\s+([^.!?\n]{2,42})/i);
  if (code?.[1]) {
    const word = compact(code[1]).replace(/[,.!?]+$/g, '');
    const codeWords = Array.from(new Set([...(memory.codeWords || []), word])).slice(-20);
    writeSpaceOSMemory({ ...memory, codeWords, updatedAt: Date.now() });
    return { text: `Запомнил кодовое слово: ${word}.`, blocks: [], mode: 'talk' };
  }

  return null;
}

function rememberMusic(memory: SpaceOSMemory, subject: string) {
  const chunks = subject.split(/[-—–]/).map(compact).filter(Boolean);
  const artist = chunks.length > 1 ? chunks[0] : '';
  const track = chunks.length > 1 ? chunks.slice(1).join(' — ') : subject;
  writeSpaceOSMemory({ ...memory, lastArtist: artist || memory.lastArtist, lastTrack: track || memory.lastTrack, updatedAt: Date.now() });
}

function leadFor(decision: SpaceOSDecision, blocks: SpaceBlock[]) {
  const ru = isRu(decision);
  if (decision.tool === 'weather') return ru ? 'Показываю погоду.' : 'Here is the weather.';
  if (decision.tool === 'music') return ru ? 'Нашёл музыку. Нажми на трек — плеер останется играть внизу.' : 'I found music. Tap a track; the player stays in the tray.';
  if (decision.tool === 'images') return ru ? 'Нашёл изображения.' : 'I found images.';
  if (decision.tool === 'video') return ru ? 'Нашёл видео и превью.' : 'I found videos and previews.';
  if (decision.tool === 'finance') return ru ? 'Собрал график. Это не инвестиционный совет.' : 'I built a chart. This is not financial advice.';
  if (decision.tool === 'shopping') return ru ? 'Нашёл варианты покупки.' : 'I found shopping options.';
  if (decision.tool === 'biography') return ru ? 'Собрал справку.' : 'I collected a reference.';
  if (blocks.some((block) => block.type === 'quote')) return ru ? 'В margeleT нашёлся свежий близкий сигнал.' : 'I found a fresh related margeleT signal.';
  return ru ? 'Нашёл это.' : 'I found this.';
}

function statusBlock(title: string, value: string, caption: string, tone: 'blue' | 'green' | 'orange' | 'violet' = 'blue'): SpaceBlock {
  return { type: 'stat', title, value, caption, tone };
}

function modelStatusBlock(): SpaceBlock {
  const status = getLocalLlmStatus();
  const ready = status.status === 'ready';
  const loading = status.status === 'loading';
  return statusBlock(
    'Space AI',
    ready ? 'ready' : loading ? 'loading' : status.status,
    ready
      ? 'Модель отвечает в браузере.'
      : loading
        ? 'Модель загружается.'
        : `Browser AI недоступен в этом браузере. Инструменты поиска работают отдельно.`,
    ready ? 'green' : loading ? 'blue' : 'orange',
  );
}

function tunnelBlock(topic: string): SpaceBlock {
  return {
    type: 'tunnel',
    title: 'Туннель интереса',
    subtitle: 'Локальный черновик: тема хранится на устройстве, сервер не хранит переписку.',
    topic: topic || 'общая тема',
    people: [
      { name: 'Катя', note: 'ищет похожую тему' },
      { name: 'Саша', note: 'может совпасть по интересу' },
    ],
    cta: 'Открыть туннель на 24 часа',
  };
}

function searchLocalAudio(posts: SpaceOSInput['posts'], decision: SpaceOSDecision): SpaceBlock | null {
  if (decision.tool !== 'music') return null;
  const tokens = keywords(decision.subject || decision.query).filter((token) => !['группа', 'песня', 'трек', 'музыка', 'любую', 'любой'].includes(token));
  if (!tokens.length) return null;

  const ranked = posts
    .map((post) => {
      const audio = post.media?.filter((m) => m.kind === 'audio' && m.url) || [];
      if (!audio.length) return null;
      const hay = textOfPost(post);
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0) + (post.contentType === 'audio' ? 0.8 : 0);
      return score > 0 ? { post, audio, score } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (!ranked.length) return null;
  return {
    type: 'music',
    title: decision.lang === 'ru' ? `Музыка: ${decision.subject || decision.query}` : `Music: ${decision.subject || decision.query}`,
    subtitle: decision.lang === 'ru' ? 'Нашёл аудио внутри margeleT.' : 'Found audio inside margeleT.',
    tracks: ranked.map((item) => ({
      title: compact(item.post.media.find((m) => m.kind === 'audio')?.fileName || item.post.text.split('\n')[0] || item.post.source.title || decision.subject).slice(0, 120),
      sourceTitle: item.post.source.title || item.post.source.handle || 'margeleT audio',
      postUrl: internalPostUrl(item.post),
      audioUrl: item.audio[0]?.url || null,
    })),
  };
}

function factLines(blocks: SpaceBlock[]) {
  const facts: string[] = [];
  for (const block of blocks) {
    if (block.type === 'weather') facts.push(`${block.title}: ${block.summary}`);
    if (block.type === 'webInfo') facts.push(`${block.title}: ${block.summary}`);
    if (block.type === 'music') facts.push(`tracks:${block.tracks.length}`);
    if (block.type === 'gallery') facts.push(`media:${block.items.length}`);
    if (block.type === 'quote') facts.push(`${block.title}: ${block.text.slice(0, 160)}`);
  }
  return facts.map(compact).filter(Boolean).slice(0, 8);
}

async function llmText(input: SpaceOSInput, decision: SpaceOSDecision, memory: SpaceOSMemory, facts: string[] = [], timeoutMs = 8000) {
  const text = await tryLocalLlmReply({ query: input.query, locale: input.locale, decision, memory, facts, timeoutMs });
  return sanitize(text || '');
}

function noBrainText(decision: SpaceOSDecision) {
  return decision.lang === 'ru'
    ? 'Я не буду изображать умный ответ без модели. Могу искать по интернету, погоде, музыке, картинкам, видео и margeleT — или подключим внешний LLM-ключ для полноценного разговора.'
    : 'I will not fake an answer without a model. I can search web, weather, music, images, video and margeleT — or use an external LLM key for full conversation.';
}

export async function runSpaceOS(input: SpaceOSInput): Promise<SpaceAnswer> {
  const memory = readSpaceOSMemory();
  const named = rememberNameOrCode(input.query, memory);
  if (named) {
    rememberAssistantTurn(named.text);
    return named;
  }

  const decision = routeSpaceOS(input.query, input.locale);
  const updatedMemory = rememberSpaceOSTurn(memory, input.query, decision);

  if (/\b(ai|llm|webllm|local ai|локальная модель|статус модели|модель)\b/i.test(input.query)) {
    const answer = { text: 'Статус Space AI:', blocks: [modelStatusBlock()], mode: 'show' as const };
    rememberAssistantTurn(answer.text);
    return answer;
  }

  if (decision.tool === 'product') {
    const blocks = buildInvestorBlocks(input.query, decision.lang);
    const text = await llmText(input, decision, updatedMemory, [
      'margeleT — индекс внимания Telegram и поисковый слой поверх потока.',
      'Space — разговорный слой с интернет-инструментами, виджетами и свежими сигналами margeleT.',
    ], 7000);
    const answerText = text || (decision.lang === 'ru' ? 'Показываю, как устроен margeleT и Space.' : 'Here is how margeleT and Space are structured.');
    rememberAssistantTurn(answerText);
    return { text: answerText, blocks, mode: 'present' };
  }

  if (decision.tool === 'tunnel') {
    const block = tunnelBlock(decision.subject);
    const text = await llmText(input, decision, updatedMemory, ['Туннель — временный локальный чат по совпавшему интересу.'], 6000);
    const answerText = text || (decision.lang === 'ru' ? 'Собрал черновик туннеля.' : 'I prepared a tunnel draft.');
    rememberAssistantTurn(answerText);
    return { text: answerText, blocks: [block], mode: 'show' };
  }

  if (decision.tool === 'music') {
    rememberMusic(updatedMemory, decision.subject || input.query);
    const localMusic = searchLocalAudio(input.posts, decision);
    if (localMusic) {
      const answerText = leadFor(decision, [localMusic]);
      rememberAssistantTurn(answerText);
      return { text: answerText, blocks: [localMusic], mode: 'show' };
    }
  }

  if (decision.tool !== 'chat') {
    const external = decision.useInternet ? await runInternetTool(decision) : { text: '', blocks: [] as SpaceBlock[] };
    const telegramBlocks = decision.useTelegram && external.blocks.length < 2
      ? searchTelegramSupplement(input.posts, decision, external.blocks.length ? 1 : 2)
      : [];
    const blocks = [...external.blocks, ...telegramBlocks];

    if (blocks.length) {
      const facts = factLines(blocks);
      const llm = await llmText(input, decision, updatedMemory, facts, 5000);
      const answerText = llm || external.text || leadFor(decision, blocks);
      rememberAssistantTurn(answerText);
      return { text: answerText, blocks, mode: 'show' };
    }

    const llm = await llmText(input, decision, updatedMemory, [], 5000);
    const answerText = llm || (decision.lang === 'ru' ? 'Не нашёл надёжный источник для карточки. Попробуй сформулировать точнее или укажи город/трек/тему.' : 'I did not find a reliable source for the card. Try a more specific city, track, or topic.');
    rememberAssistantTurn(answerText);
    return { text: answerText, blocks: [], mode: 'talk' };
  }

  const text = await llmText(input, decision, updatedMemory, [], 9000);
  const answerText = text || noBrainText(decision);
  rememberAssistantTurn(answerText);
  return { text: answerText, blocks: [], mode: 'talk' };
}
