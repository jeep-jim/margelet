import type { SpaceAnswer, SpaceBlock } from '../brain/types';
import { buildInvestorBlocks } from '../knowledge';
import type { SpaceOSDecision, SpaceOSInput, SpaceOSMemory } from './types';
import { readSpaceOSMemory, rememberAssistantTurn, rememberSpaceOSTurn, writeSpaceOSMemory } from './spaceMemory';
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
  const q = query.toLowerCase().replace(/ё/g, 'е').trim();
  const name = memory.userName ? `${memory.userName}, ` : '';
  const rich = memory as SpaceOSMemory & { lastTrack?: string; lastArtist?: string; lastCity?: string; recentTurns?: Array<{ role: string; text: string }> };
  const ru = isRu(decision);

  if (!ru) {
    if (/hello|hi|hey/.test(q)) return `Hey${memory.userName ? `, ${memory.userName}` : ''}. I’m here.`;
    return `I’m listening. Give me the thought, and I’ll answer directly first — facts and widgets only when they’re actually needed.`;
  }

  const what = query.match(/что\s+такое\s+([^?!.]{2,80})/i);
  if (what?.[1]) {
    const term = compact(what[1]);
    return `${term} — это слово или явление, которое лучше объяснить на конкретном примере. Я могу дать короткое объяснение своими словами, а если нужен точный источник — проверю сеть и покажу карточку.`;
  }

  if (/^(привет|здаров|здравствуй|салам|хай|тут|здесь)\b/.test(q)) {
    const hour = new Date().getHours();
    const day = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Привет' : 'Добрый вечер';
    return `${day}${memory.userName ? `, ${memory.userName}` : ''}. Я тут.`;
  }

  if (/какую\s+(песн|групп)|что\s+я\s+просил|напомни/i.test(q) && (rich.lastTrack || rich.lastArtist)) {
    return `${name}ты просил музыку: ${[rich.lastArtist, rich.lastTrack].filter(Boolean).join(' — ')}.`;
  }

  if (/погода|прогноз|температур/.test(q)) {
    const city = decision.subject || rich.lastCity || 'твой город';
    return `${name}по погоде не буду гадать. Сейчас попробую достать живые данные по “${city}” и показать карточку.`;
  }

  if (/включи|поставь|трек|песня|музыка|сыграй/.test(q)) {
    const track = decision.subject || rich.lastTrack || query;
    return `${name}беру музыкальный запрос “${track}”. Сначала ищу аудио, потом отдам плеер или честно покажу источник.`;
  }

  if (/устал|устала|грустно|плохо|одинок|выгор/.test(q)) {
    return `${name}слышу. Я не буду давить советами. Давай аккуратно: это больше усталость телом, тревога в голове или просто всё накопилось?`;
  }

  if (/совет|бизнес|деньг|работ|карьер|иде/.test(q)) {
    return `${name}давай без сказок про “быстрый успех”. Я бы начал с трёх вещей: что ты умеешь, что людям болит, и где можно быстро проверить спрос.`;
  }

  if (/спор|не соглас|думаешь|правда|мнение/.test(q)) {
    return `${name}я бы тут не соглашался автоматически. В мысли может быть сильная часть и слепая зона — давай разберём обе.`;
  }

  const words = q.split(/\s+/).filter(Boolean);
  const last = rich.recentTurns?.slice().reverse().find((t) => t.role === 'user')?.text || '';
  if (last && words.length <= 3) return `${name}вижу, ты продолжаешь прошлую мысль. Я рядом: ${compact(last).slice(0, 120)} — давай докрутим это, а не начнём заново.`;

  return `${name}слышу тебя. Я отвечу прямо: здесь важнее не выдача, а смысл того, что ты хочешь сделать. Давай развернём эту мысль.`;
}


function musicText(post: { text: string; source: { title: string; handle: string }; media: Array<{ kind: string; fileName?: string | null }> }) {
  return `${post.text || ''} ${post.source.title || ''} ${post.source.handle || ''} ${(post.media || []).map((m) => m.fileName || '').join(' ')}`.toLowerCase().replace(/ё/g, 'е');
}

function searchLocalAudio(posts: SpaceOSInput['posts'], decision: SpaceOSDecision): SpaceBlock | null {
  if (decision.tool !== 'music') return null;
  const raw = compact(decision.subject || decision.query).toLowerCase().replace(/ё/g, 'е');
  const tokens = raw.split(/\s+/).filter((token) => token.length > 2 && !['группа', 'песня', 'трек', 'музыка', 'включи', 'поставь'].includes(token)).slice(0, 8);
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
    subtitle: decision.lang === 'ru' ? 'Нашёл аудио в margeleT. Нажми — плеер останется в трее.' : 'Found audio in margeleT. Tap — the player stays in the tray.',
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

  if (decision.tool === 'music') {
    const localMusic = searchLocalAudio(input.posts, decision);
    if (localMusic) {
      const text = await tryLocalLlmReply({ query: input.query, locale: input.locale, decision, memory: updatedMemory, facts: extractFacts([localMusic]), timeoutMs: 3500 });
      const answer = { text: text || toolLead(decision, [localMusic]), blocks: [localMusic], mode: 'show' as const };
      rememberAssistantTurn(answer.text);
      return answer;
    }
  }

  if (decision.tool === 'chat') {
    const text = await answerWithLlmOrFallback(input, decision, updatedMemory);
    rememberAssistantTurn(text);
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
    const text = llmLead || external.text || toolLead(decision, blocks);
    rememberAssistantTurn(text);
    return { text, blocks, mode: 'show' };
  }

  const text = await answerWithLlmOrFallback(input, decision, updatedMemory, [
    isRu(decision)
      ? 'Инструменты не вернули уверенный результат.'
      : 'Tools did not return a confident result.',
  ]);
  rememberAssistantTurn(text);
  return { text, blocks: [], mode: 'talk' };
}
