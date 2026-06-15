import type { Locale } from '../../../types/app';
import type { SpaceOSDecision, SpaceOSTool } from './types';

const RU = /[а-яё]/i;

const STOP = new Set(
  'что кто где когда как почему зачем про покажи найди дай расскажи напиши посоветуй поставь включи открой мне ты это сейчас сегодня можно хочу пожалуйста можешь нужно надо включить поставить купить воспроизведи объясни расскажи where when what who why how about show find give tell play open buy explain me you now today'.split(' '),
);

function norm(text: string) {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripCommon(query: string) {
  return norm(query)
    .replace(/^@/, '@')
    .replace(/^(покажи|найди|дай|расскажи|напиши|посоветуй|поставь|включи|воспроизведи|открой|купить|заказать|объясни|show|find|tell|play|open|buy|explain)\s+/i, '')
    .replace(/\b(погода|прогноз|температура|музыка|трек|песня|видео|фото|картинки|изображения|товар|цена|магазин|биография|биографию|кто такой|кто такая|акции|график|курс|профиль|канал|туннель|weather|forecast|song|music|video|images|photos|price|stock|chart|profile|bio|biography)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subject(query: string, tool: SpaceOSTool) {
  if (tool === 'profile') {
    const at = query.match(/@([a-zA-Z0-9_]{3,})/);
    if (at) return `@${at[1]}`;
  }
  const s = stripCommon(query);
  const tokens = s.split(' ').filter((t) => t && !STOP.has(t));
  return tokens.join(' ') || s || query.trim();
}

function has(q: string, words: RegExp[]) {
  return words.some((x) => x.test(q));
}

function isTinyTalk(q: string) {
  return has(q, [
    /^(привет|здравствуй|здравствуйте|салам|хай|hello|hi|hey)\b/,
    /^(как дела|как ты|ну ты как|ты тут|ты здесь|слышишь|слушаешь)\??$/,
    /^(спасибо|благодарю|ок|ладно|ясно|понял|поняла|ага|угу)$/,
  ]);
}

function isGeneralChat(q: string) {
  return has(q, [
    /\b(поговорим|поболтаем|просто общаемся|давай поговорим|мне скучно|я устал|устала|грустно|одиноко|выгорел|совет|дай совет)\b/,
    /\b(жизнь|смысл|любовь|отношения|кошка|кот|собака|пенси|реформ|истори|философ|деньги|бизнес|работа|карьера|устал|грустно|плохо|совет|идея|мечта|спор|думаешь|поговори)\b/,
  ]);
}

export function routeSpaceOS(query: string, locale: Locale): SpaceOSDecision {
  const q = norm(query);
  const lang = RU.test(query) || locale === 'ru' ? 'ru' : 'en';
  let tool: SpaceOSTool = 'chat';
  let confidence = 62;
  let useInternet = false;
  let useTelegram = false;
  let useProductDeck = false;
  let reason = 'conversation';

  const productAsk = has(q, [
    /\b(что\s+такое\s+(margelet|марджелет|space|спейс))/,
    /\b(расскажи\s+про\s+(проект|сервис|margelet|марджелет|space|спейс))/,
    /\b(инвестор|монетизац|окупаем|зарабатывает\s+проект|архитектура\s+проекта)/,
  ]);
  const humanTopic = isTinyTalk(q) || isGeneralChat(q);

  if (productAsk) {
    tool = 'product'; confidence = 98; useProductDeck = true; reason = 'product_deck';
  } else if (has(q, [/\b(погода|прогноз|температур|дожд|снег|ветер|weather|forecast)\b/])) {
    tool = 'weather'; confidence = 96; useInternet = true; reason = 'weather_api';
  } else if (has(q, [/\b(включи|поставь|послушать|сыграй|трек|песня|музыка|billie jean|майкл джексон|музло|music|song|track|play)\b/])) {
    tool = 'music'; confidence = 95; useInternet = true; reason = 'music_search';
  } else if (has(q, [/\b(фото|картин|изображен|галере|обои|images|photos|pictures)\b/])) {
    tool = 'images'; confidence = 94; useInternet = true; reason = 'image_search';
  } else if (has(q, [/\b(видео|ролик|клип|трейлер|кино|фильм|сериал|video|movie|film|trailer)\b/])) {
    tool = 'video'; confidence = 90; useInternet = true; reason = 'video_search';
  } else if (has(q, [/\b(акци[яи]|график|бирж|котиров|биткоин|bitcoin|btc|ethereum|eth|tesla|tsla|apple|aapl|курс|доллар|евро|нефть|золото|crypto|stock|finance)\b/])) {
    tool = 'finance'; confidence = 90; useInternet = true; useTelegram = false; reason = 'market_data';
  } else if (has(q, [/\b(купить|заказать|цена|товар|магазин|доставка|где\s+купить|order|buy|shop|price)\b/])) {
    tool = 'shopping'; confidence = 88; useInternet = true; reason = 'shopping_search';
  } else if (has(q, [/^@[a-zA-Z0-9_]{3,}/, /\b(профиль|аккаунт|логин|человек|автор|канал|что\s+пишет|profile|account|channel)\b/])) {
    tool = 'profile'; confidence = 86; useInternet = true; useTelegram = true; reason = 'profile_lookup';
  } else if (has(q, [/\b(биограф|кто\s+такой|кто\s+такая|история\s+жизни|моцарт|mozart|einstein|энштейн|биография|who\s+is)\b/])) {
    tool = 'biography'; confidence = 88; useInternet = true; useTelegram = false; reason = 'biography';
  } else if (has(q, [/\b(туннель|единомышленник|найди\s+людей|свести|позвать|пригласи|познаком|tunnel)\b/])) {
    tool = 'tunnel'; confidence = 90; useInternet = false; reason = 'tunnel';
  } else if (has(q, [/\b(новости|что\s+пишут|что\s+говорят|обсуждают|происходит|сигнал|источник|news|search|find)\b/])) {
    tool = 'web'; confidence = 78; useInternet = true; useTelegram = true; reason = 'web_first';
  } else if (!humanTopic && has(q, [/\b(что\s+такое|объясни|расскажи\s+про|почему|зачем|как\s+работает|как\s+устроен|what\s+is|explain|tell\s+me\s+about)\b/])) {
    tool = 'web'; confidence = 76; useInternet = true; useTelegram = false; reason = 'general_web_knowledge';
  }

  return { tool, confidence, query, subject: subject(query, tool), locale, lang, useInternet, useTelegram, useProductDeck, reason };
}
