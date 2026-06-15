import type { IngestedPost, Locale } from '../../../types/app';
import type { BrainContext, RankedPost, SpaceAnswer, SpaceBlock } from './types';
import { buildContext } from './contextEngine';
import { answerIdentity } from './identityEngine';
import { rememberTurn } from './memoryEngine';
import { routeSpaceTool, toolToIntent } from './toolRouter';
import { generateLocalLlmAnswer, getLocalLlmStatus } from './localLlm';
import { runExternalTool } from './spaceTools';
import { searchPosts } from './searchFusion';
import { planBlocks, buildTunnelBlock } from './blockPlanner';
import { buildInvestorBlocks } from '../knowledge';
import { compactText, hashText, pick } from './text';

function finish(ctx: BrainContext, text: string, blocks: SpaceBlock[] = [], mode: SpaceAnswer['mode'] = 'talk'): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.tokens });
  return { text, blocks, mode };
}

function cleanLLMText(text: string | null) {
  if (!text) return null;
  const clean = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(Привет,?\s*)?я\s+Space[:,]?\s*/i, 'Я Space. ')
    .trim();
  if (!clean || /уточни|скаж[ии]\s+точнее|я\s+не\s+понял/i.test(clean.slice(0, 120))) return null;
  return clean;
}

function fallbackChat(ctx: BrainContext) {
  const name = ctx.memory.userName ? `${ctx.memory.userName}, ` : '';
  const q = ctx.normalized;
  if (/привет|здравств|hello|hi\b/.test(q)) return `${name}привет 😄 Я Space. Слушаю тебя.`;
  if (/ты\s+тут|ты\s+здесь|слушаешь|живой/.test(q)) return `${name}я здесь. Можем просто поговорить, а если понадобится — я сам полезу искать.`;
  if (/просто\s+общаемся|поговорим|поболтаем/.test(q)) return 'Отлично. Тогда без карточек и случайных постов — просто разговариваем.';
  if (/скучно|устал|тяжело|грустно|надоело/.test(q)) return `${name}давай выдохнем. Не буду грузить выдачей. Что именно сейчас давит больше всего?`;
  if (/совет|идеи|деньг|работ|бизнес|заработ/.test(q)) return `${name}давай по-честному: волшебную кнопку я не обещаю. Но могу помочь разложить задачу: идея, деньги, люди, опыт или первые шаги?`;
  if (/кошка|кот|собак|животн/.test(q)) return 'Про животных можно спокойно 😄 Хочешь поговорить по-доброму, спросить совет или поискать что-то конкретное?';
  if (/истори|реформ|пенси|политик|экономик/.test(q)) return 'Тема большая. Я могу объяснить простыми словами, показать разные стороны или найти свежие источники. С какой стороны зайдём?';
  if (/кино|фильм|сериал/.test(q)) return 'Могу помочь выбрать. Ты хочешь лёгкую комедию, что-то умное, напряжённый триллер или просто фильм на вечер без тяжести?';
  return pick([
    `${name}я понял. Давай разберём это спокойно, без случайной выдачи.`,
    `${name}слушаю. Можешь писать как человеку — я сначала попробую понять смысл, а не сразу искать.`,
    'Я с тобой. Давай оттолкнёмся от твоей мысли и посмотрим, куда она ведёт.',
  ], hashText(ctx.query) + ctx.memory.turns);
}

function buildMusicAnswer(ctx: BrainContext, ranked: RankedPost[]): SpaceAnswer {
  if (!ranked.length) {
    return finish(ctx, ctx.lang === 'ru'
      ? 'Пока не нашёл трек в локальной базе margeleT. Когда добавим музыкальные каналы, я смогу включать аудио прямо здесь 🎵'
      : 'I did not find the track in the local margeleT base yet. After music sources are added, I will play audio here 🎵', [], 'talk');
  }
  const tracks = ranked.slice(0, 7).map(({ post }) => {
    const audio = post.media.find((item) => item.kind === 'audio');
    return {
      title: compactText(post.text || post.source.title || 'Telegram audio', 70),
      sourceTitle: post.source.title || post.source.handle || 'Telegram',
      postUrl: `/${String(post.source.handle || '').replace(/^@+/, '')}/${String(post.postUrl || post.id).split('/').filter(Boolean).pop() || post.id}`,
      audioUrl: audio?.url || null,
    };
  });
  return finish(ctx, 'Нашёл музыкальные совпадения 🎵', [{ type: 'music', title: `Музыка: ${ctx.subject || ctx.query}`, subtitle: 'Если у поста есть audio — включу прямо здесь. Иначе открою пост с треком.', tracks }], 'show');
}

function buildTelegramAnswer(ctx: BrainContext, ranked: RankedPost[]): SpaceAnswer {
  if (!ranked.length) {
    return finish(ctx, ctx.lang === 'ru'
      ? 'В margeleT по этому пока тихо. Я не буду притягивать левый пост — лучше попробую через интернет или дай конкретнее тему.'
      : 'It is quiet in margeleT on this. I will not force a random post — I can try the web or you can make the topic sharper.', [], 'talk');
  }
  const blocks = planBlocks(ranked, ctx.intent, { gallery: 'Медиа из margeleT', video: 'Видео и превью' }, true, ctx.subject);
  const text = ranked.length > 1 ? 'Нашёл несколько близких сигналов 👇' : 'Нашёл близкий сигнал 👇';
  return { text, blocks, mode: blocks.length ? 'show' : 'answer' };
}

export async function runSpaceRuntime(params: { query: string; posts: IngestedPost[]; locale: Locale }): Promise<SpaceAnswer> {
  const baseCtx = buildContext(params.query, params.posts, params.locale);
  const decision = routeSpaceTool(baseCtx);
  const ctx: BrainContext = {
    ...baseCtx,
    intent: toolToIntent(decision.tool, baseCtx.intent),
    shouldSearch: decision.shouldSearchTelegram,
    shouldShowBlocks: decision.shouldSearchTelegram || decision.tool === 'music' || decision.tool === 'shopping' || decision.tool === 'images' || decision.tool === 'video',
    searchQuery: decision.subject || baseCtx.searchQuery || params.query,
    isProductQuestion: decision.tool === 'product' || baseCtx.isProductQuestion,
  };

  const identity = decision.tool === 'chat' ? answerIdentity(ctx) : null;
  if (identity) return finish(ctx, identity);

  if (ctx.intent === 'nameMemory') {
    const match = ctx.query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)\s+(.{2,40})/i);
    const name = match?.[1]?.replace(/[.!?]+$/g, '').trim();
    return finish(ctx, name ? `Запомнил, ${name}. Буду обращаться так.` : 'Запомнил. Имя храню только на этом устройстве.');
  }

  if (/как\s+зовут\s+меня|мо[её]\s+имя|what\s+is\s+my\s+name/.test(ctx.normalized)) {
    return finish(ctx, ctx.memory.userName ? `Тебя зовут ${ctx.memory.userName}.` : 'Ты ещё не называл имя. Скажи “меня зовут …”, и я запомню на этом устройстве.');
  }

  if (decision.tool === 'product') {
    const llm = cleanLLMText(await generateLocalLlmAnswer(ctx, decision));
    return {
      text: llm || 'Покажу, почему margeleT — не просто лента, а поисковый слой внимания. Мы не ищем новости. Мы ищем момент, где рождается внимание людей.',
      blocks: buildInvestorBlocks(ctx.query, ctx.lang),
      mode: 'present',
    };
  }

  const external = await runExternalTool(ctx, decision);
  if (external.blocks.length) {
    const llm = cleanLLMText(await generateLocalLlmAnswer(ctx, decision));
    return finish(ctx, llm || external.text || fallbackChat(ctx), external.blocks, 'show');
  }

  const ranked = decision.shouldSearchTelegram ? searchPosts(ctx) : [];

  if (decision.tool === 'music') return buildMusicAnswer(ctx, ranked);

  if (decision.tool === 'tunnel') {
    return finish(ctx, ctx.lang === 'ru'
      ? 'Окей, это уже про людей. Соберу временный туннель интереса — пока локальный черновик, без переписок на сервере 🧲'
      : 'Okay, this is about people. I will create a temporary interest tunnel — local draft only 🧲', [buildTunnelBlock(decision.subject || ctx.query)], 'show');
  }

  if (decision.shouldSearchTelegram) return buildTelegramAnswer(ctx, ranked);

  const llmStatus = getLocalLlmStatus();
  const llm = cleanLLMText(await generateLocalLlmAnswer(ctx, decision));
  if (llm) return finish(ctx, llm);

  const text = fallbackChat(ctx);
  const suffix = llmStatus.status === 'loading'
    ? '\n\nЛокальная модель ещё прогревается. Пока отвечаю быстрым мозгом.'
    : '';
  return finish(ctx, `${text}${suffix}`);
}
