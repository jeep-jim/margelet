import type { BrainContext, SpaceIntent } from './types';
import { normalize, tokenize } from './text';

export type SpaceTool =
  | 'chat'
  | 'weather'
  | 'finance'
  | 'music'
  | 'video'
  | 'images'
  | 'shopping'
  | 'profile'
  | 'biography'
  | 'tunnel'
  | 'product'
  | 'telegram'
  | 'web';

export type ToolDecision = {
  tool: SpaceTool;
  confidence: number;
  query: string;
  subject: string;
  shouldUseLocalLlm: boolean;
  shouldSearchTelegram: boolean;
  shouldShowProduct: boolean;
};

const STOP = new Set([
  'что','кто','где','когда','как','почему','зачем','про','покажи','найди','дай','расскажи','напиши','посоветуй','поставь','включи','открой','мне','ты','это','сейчас','сегодня','можно','хочу',
  'what','who','where','when','how','why','about','show','find','give','tell','play','open','me','you','now','today','i','want'
]);

function cleanSubject(text: string) {
  const normalized = normalize(text)
    .replace(/^(покажи|найди|дай|расскажи|напиши|посоветуй|поставь|включи|открой|что\s+пишет|кто\s+такой|что\s+такое|про)\s+/i, '')
    .replace(/\b(погода|прогноз|акции|акция|график|курс|цена|музыка|трек|песня|видео|фото|картинки|товар|купить|заказать|туннель|канал|профиль|биография|биографию)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = tokenize(normalized, 10).filter((token) => !STOP.has(token));
  return tokens.join(' ') || normalized || text.trim();
}

function hasAny(normalized: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(normalized));
}

export function routeSpaceTool(ctx: BrainContext): ToolDecision {
  const q = normalize(ctx.query);
  const subject = cleanSubject(ctx.query);

  const productAsk = hasAny(q, [
    /\b(margelet|марджелет|спейс|space)\b.*\b(что|зачем|как|почему|монетизац|зарабат|инвест|проект|сервис|устроен|работает|отличает)/,
    /\b(что\s+такое\s+(margelet|марджелет|space|спейс))/,
    /\b(расскажи\s+про\s+(проект|сервис|margelet|марджелет|space|спейс))/,
    /\b(я\s+инвестор|инвестор|монетизац|окупаем|зарабатывает\s+проект)/,
  ]);

  if (productAsk) {
    return { tool: 'product', confidence: 95, query: ctx.query, subject: 'margeleT', shouldUseLocalLlm: true, shouldSearchTelegram: false, shouldShowProduct: true };
  }

  if (hasAny(q, [/\b(погода|прогноз|температур|дожд|снег|ветер|weather|forecast)\b/])) {
    return { tool: 'weather', confidence: 94, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: false, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(акци[яи]|график\s+акц|бирж|котиров|биткоин|bitcoin|btc|ethereum|eth|tesla|tsla|apple|aapl|курс\s+доллар|финанс|crypto|stock)\b/])) {
    return { tool: 'finance', confidence: 88, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(включи|поставь|сыграй|послушать|трек|песня|музыка|альбом|play|song|music|track)\b/])) {
    return { tool: 'music', confidence: 92, query: ctx.query, subject, shouldUseLocalLlm: false, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(туннель|единомышленник|найди\s+людей|свести|позвать|пригласи|познаком|поговорить\s+с\s+кем|tunnel)\b/])) {
    return { tool: 'tunnel', confidence: 90, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: false, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(купить|заказать|цена|товар|магазин|доставка|где\s+купить|order|buy|shop|price)\b/])) {
    return { tool: 'shopping', confidence: 88, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(фото|картин|изображен|галере|яркие\s+моменты|images|photos|pictures)\b/])) {
    return { tool: 'images', confidence: 86, query: ctx.query, subject, shouldUseLocalLlm: false, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(видео|ролик|клип|фильм|кино|сериал|трейлер|video|movie|film)\b/])) {
    return { tool: 'video', confidence: 84, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/^@\w+/, /\b(профиль|канал|аккаунт|логин|человек|автор|что\s+пишет|паша\s+молянов|profile|channel|account)\b/])) {
    return { tool: 'profile', confidence: 82, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (hasAny(q, [/\b(биограф|кто\s+такой|кто\s+такая|история\s+жизни|mozart|моцарт|einstein|энштейн|биография)\b/])) {
    return { tool: 'biography', confidence: 82, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  if (ctx.isExplicitSearch || hasAny(q, [/\b(новости|что\s+пишут|что\s+говорят|обсуждают|происходит|сигнал|источник|канал|news|search|find)\b/])) {
    return { tool: 'telegram', confidence: 74, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: true, shouldShowProduct: false };
  }

  return { tool: 'chat', confidence: 70, query: ctx.query, subject, shouldUseLocalLlm: true, shouldSearchTelegram: false, shouldShowProduct: false };
}

export function toolToIntent(tool: SpaceTool, fallback: SpaceIntent): SpaceIntent {
  if (tool === 'weather') return 'weather';
  if (tool === 'music') return 'music';
  if (tool === 'images') return 'images';
  if (tool === 'video') return 'video';
  if (tool === 'shopping') return 'shopping';
  if (tool === 'tunnel') return 'tunnel';
  if (tool === 'profile') return 'source';
  if (tool === 'product') return 'product';
  return fallback;
}
