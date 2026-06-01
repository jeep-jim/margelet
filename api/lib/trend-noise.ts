import type { IngestedPost } from "./contracts.js";

export const UNSAFE_OBJECT_KEYS = new Set(["__proto__", "prototype", "constructor"]);

export const STOP_WORDS = new Set([
  "other","misc","undefined","null","none","nan","это","что","как","для","если","или","его","её","ее","она","они","оно","там","тут","уже","ещё","еще","вот","все","всё","сам","сама","сами","над","под","без","при","про","чем","тем","где","кто","когда","почему","потому","так","также","только","можно","нужно","будет","будут","были","было","быть","есть","нет","да","не","но","же","бы","ли","на","по","из","от","до","за","во","со","ко","об","а","и","в","с","к","у","о","мы","вы","он","их","им","нас","вам","тебя","меня","наш","наши","наша","наше","ваш","который","которая","которое","которые","которых","которым","которыми","того","той","том","тому","этот","эта","эти","этих","этом","этого","этой","этим","здесь","туда","сюда","пока","после","перед","сейчас","сегодня","вчера","завтра","день","дня","дней","года","год","лет","раз","раза","разом","всего","почти","очень","снова","сразу","прямо","просто","больше","меньше","через","теперь","даже","могут","может","мочь","должен","должна","должны","стоит","стал","стала","стали","нельзя","подписаться","подписывайтесь","подпишись","читать","далее","видео","фото","смотреть","ссылка","канал","каналы","новости","новость","пост","поста","посты","сообщает","сообщили","пишут","заявил","рассказал","рублей","рубля","руб","тыс","млн","млрд","тысяч","около","более","менее","россии","россию","россией","российский","российская","российские","москве","москвы","москву","июня","января","февраля","марта","апреля","мая","июля","августа","сентября","октября","ноября","декабря","один","одна","одно","одни","из-за","изза","такой","такая","такое","такие","году","словам","области","детей","сообщение","комментарии","источник","источники","автор","авторы","главное","подробнее","речь","идет","идёт","самом","деле","первую","очередь","реальном","времени","данным","таких","таким",
  "the","and","for","with","this","that","from","are","was","were","you","your","they","have","has","had","not","but","his","her","its","our","their","about","into","after","before","what","when","where","why","how","who","all","can","will","would","could","should","just","more","than","then","there","here","now","new","don","one","two","most","join","over","every","only","today","yesterday","tomorrow","year","years","day","days","video","photo","watch","read","subscribe","follow","channel","channels","post","posts","news","update","updates","breaking","said","says","say","reported","reports","report","live","official","latest","first","last","next","again","many","much","some","any","also","even","still","very","really","click","link","source","sources","usd","eur","rub","million","billion","thousand","max","min",
  "de","la","el","los","las","un","una","unos","unas","por","para","con","sin","del","que","como","más","mas","muy","le","les","des","une","aux","avec","sur","dans","est","sont","plus","moins","pour","par","der","die","das","und","oder","ist","sind","mit","von","auf","ein","eine","einer","nicht","mehr","ve","bir","bu","şu","icin","için","olan","olarak","daha","sonra","önce","gibi",
  "من","في","على","إلى","عن","مع","هذا","هذه","ذلك","التي","الذي","كان","كانت","كما","بعد","قبل","اليوم","الآن","خبر","اخبار","قناة","مصدر","برای","این","آن","است","بود","شد","های","ها","در","از","به","با","که","را","اور","کے","کی","کا","میں","سے","ہے","ہیں","یہ","وہ",
  "的","了","在","是","和","与","就","都","而","及","并","或","一个","我们","你们","他们","今天","现在","berita","hari","ini","dan","atau","yang","untuk","dengan","dari","pada","adalah","akan","sudah","lebih","lagi",
]);

export const GENERIC_SINGLE_WORDS = new Set([
  "аэрогриль","аэрогриля","aerogrill","рецепт","рецепты","recipe","recipes","official","офишл","бизнес","рынок","рынки","компания","компании","люди","человек","время","страна","страны","город","города","работа","работы","деньги","цена","цены","сезон","место","места","часть","случай","уровень",
  "market","markets","company","people","person","time","country","city","work","money","price","season","place","case","level",
]);

export const KNOWN_ENTITY_WORDS = new Set([
  "ai","gpt","openai","chatgpt","apple","google","microsoft","tesla","nvidia","spacex","telegram","durov","дуров","bitcoin","btc","ethereum","eth","ton","crypto","binance","sber","сбер","сбербанк","газпром","iphone","москва","moscow","киев","kyiv","украина","россия","iran","иран","trump","трамп","putin","путин","спартак","зенит","messi","месси","ozon","wildberries","youtube","tiktok","instagram","yandex","яндекс",
]);

export const STOP_PHRASES = new Set([
  "наши каналы","наш канал","речь идет","речь идёт","самом деле","на самом деле","первую очередь","в первую очередь","реальном времени","в реальном времени","по словам","по данным","таким образом","дело в том","читать далее","смотреть видео",
  "breaking news","read more","click here","join channel","our channel","our channels","latest news","real time","according to","in fact",
]);

export function normalizeTrendToken(value: string) {
  return String(value || "").toLowerCase().replace(/^[-_@#]+|[-_]+$/g, "").trim();
}

export function isUnsafeObjectKey(value: string) {
  return UNSAFE_OBJECT_KEYS.has(normalizeTrendToken(value));
}

export function isKnownTrendEntity(value: string) {
  return KNOWN_ENTITY_WORDS.has(normalizeTrendToken(value));
}

export function isGenericSingleTrendWord(value: string) {
  return GENERIC_SINGLE_WORDS.has(normalizeTrendToken(value));
}

export function isTrendNoiseToken(token: string, blockedHandles: Set<string> = new Set()) {
  const normalized = normalizeTrendToken(token);
  if (!normalized) return true;
  if (isUnsafeObjectKey(normalized)) return true;
  if (blockedHandles.has(normalized)) return true;
  if (normalized.length < 3) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (STOP_WORDS.has(normalized)) return true;
  if (/^[a-z]$/.test(normalized)) return true;
  if (/^[а-яё]$/i.test(normalized)) return true;
  // Do not treat normal long latin words as usernames/noise.
  // The attention brain needs words like "comprehensive", "biological",
  // "distributed", "monetization", etc. for US/EN and other latin locales.
  // We only suppress long technical-looking handles with digits/underscores.
  if (/^[a-z0-9_]{10,}$/.test(normalized) && /[0-9_]/.test(normalized) && !KNOWN_ENTITY_WORDS.has(normalized)) return true;
  if (/^[a-z]+\d+[a-z0-9_]*$/.test(normalized) && !KNOWN_ENTITY_WORDS.has(normalized)) return true;
  if (/tg$/.test(normalized) && normalized.length > 5) return true;
  return false;
}

export function isTrendNoisePhrase(parts: string[], blockedHandles: Set<string> = new Set()) {
  const normalizedParts = parts.map(normalizeTrendToken).filter(Boolean);
  const phrase = normalizedParts.join(" ");
  if (!phrase) return true;
  if (STOP_PHRASES.has(phrase)) return true;
  if (normalizedParts.some((part) => blockedHandles.has(part))) return true;
  if (normalizedParts.every((part) => STOP_WORDS.has(part))) return true;
  return false;
}

export function cleanTrendText(text: string, blockedHandles: Set<string> = new Set()) {
  let next = String(text || "").toLowerCase();

  next = next.replace(/https?:\/\/\S+/g, " ");
  next = next.replace(/(?:t\.me|max\.ru|telegram\.me)\/[a-z0-9_]+/gi, " ");
  next = next.replace(/#([\wа-яё_-]+)/gi, " $1 ");
  next = next.replace(/@[\wа-яё_-]+/gi, " ");
  next = next.replace(/\b(?:наш|нашем|наша|нашу|мой|моём|моем|подписывайтесь|подпишись|читайте)\s+(?:канал|канале|каналу|чат|бот)\b/gi, " ");

  for (const handle of blockedHandles) {
    if (!handle || handle.length < 3) continue;
    next = next.replace(new RegExp(`\\b${escapeRegExp(handle)}\\b`, "gi"), " ");
  }

  return next.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

export function buildBlockedSourceHandles(posts: IngestedPost[]) {
  const handles = new Set<string>();

  for (const post of posts) {
    const rawHandle = (post as any).source?.handle || (post as any).sourceUsername || (post as any).channelUsername;
    const handle = normalizeTrendToken(String(rawHandle || "").replace(/^@+/, ""));
    if (handle) handles.add(handle);

    const sourceId = String((post as any).sourceId || "");
    const idHandle = normalizeTrendToken(sourceId.includes(":") ? sourceId.split(":").pop() || "" : sourceId);
    if (idHandle) handles.add(idHandle);

    const rawTitle = String(
      (post as any).source?.title ||
        (post as any).sourceTitle ||
        (post as any).channelTitle ||
        (post as any).sourceName ||
        (post as any).channelName ||
        "",
    );

    const titleTokens = rawTitle
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .replace(/[@#][\wа-яё_-]+/gi, " ")
      .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
      .split(/\s+/)
      .map(normalizeTrendToken)
      .filter((token) => token.length >= 4);

    for (const token of titleTokens) {
      handles.add(token);
    }
  }

  return handles;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
