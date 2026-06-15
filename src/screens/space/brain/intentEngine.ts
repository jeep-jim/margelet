import type { SpaceIntent } from './types';
import { normalize, tokenize } from './text';

const INTENT_KEYWORDS: Partial<Record<SpaceIntent, string[]>> = {
  greeting: ['привет','здравств','салам','hello','hi','hey','hola','bonjour','hallo','ciao','привіт'],
  thanks: ['спасибо','благодар','thanks','thank you','merci','gracias','danke'],
  capabilities: ['что умеешь','что ты умеешь','умеешь','расскажи о себе','как работаешь','что можешь','что спрашивать','what can you do','capabilities'],
  identity: ['как тебя зовут','кто ты','ты кто','твое имя','твоё имя','what is your name','who are you'],
  liveness: ['ты живой','живой','ты настоящий','ты человек','are you alive','are you real','are you human'],
  smalltalk: ['как дела','как ты','что делаешь','ты тут','ты здесь','how are you','поболтать','поговорить','общаться','скучно'],
  permissionTalk: ['ок давай поговорим','давай поговорим','давай поболтаем','поболтаться хочу','поболтать хочу','поговорить хочу','можем поговорить','можем просто поговорить','хочу общаться','просто поговорить','can we chat','can we talk'],
  nameMemory: ['меня зовут','зови меня','моё имя','мое имя','my name is','call me'],
  product: ['margelet','марджелет','маргелет','margelet','что такое margeleT','что такое марджелет','зачем нужен space','зачем нужен спейс','чем вы отличаетесь','почему вас нельзя заменить','телеграм не индексируется'],
  investor: ['инвестор','инвестору','презентация','pitch','питч','вложиться','инвестиции','почему это бизнес'],
  monetization: ['монетизация','заработать','деньги проекта','выручка','подписка','pro','окупаемость','revenue','monetization'],
  architecture: ['архитектура','как построено','без базы','json','vercel','github actions','как работает сервис'],
  growth: ['рост','seo','индексация','масштаб','трафик','google','ai search','поисковики'],
  risk: ['риски','опасности','что может пойти не так','юридически','legal','risk'],
  tunnel: ['найти человека','единомышленник','единомышленников','попутчик','партнер','партнёр','собеседник','кто еще','кто ещё','тоже ищет','хочу в питер','поехать в питер','туннель','tunnel'],
  music: ['включи','поставь','послушать','музыка','песня','трек','billie jean','билли джин','lofi','рок','music','song','play'],
  shopping: ['купить','заказать','цена','стоимость','товар','карточка товара','доставка','магазин','меню','суши','роллы','еда на заказ','buy','order','price','shop'],
  advice: ['дай совет','совет','подскажи','что делать','идеи и деньги','нет идей','нет денег','хочу бизнес','свой бизнес','работа','заработок'],
  recipe: ['рецепт','готов','пирог','капуст','салат','суп','кухн','еда','recipe','cook','food','cooking','receta'],
  weather: ['погода','прогноз','градус','дожд','снег','ветер','weather','forecast','lluvia','wetter'],
  images: ['картин','фото','изображ','галере','яркие моменты','images','photos','gallery','picture','bilder'],
  video: ['видео','ролик','смотреть','video','clip'],
  trend: ['тренд','раст','обсужда','говорят','происходит','сигнал','attention','trend','happening','discuss'],
  source: ['канал','источник','автор','source','channel'],
  fact: ['правда','это правда','почему','зачем','значит','получается','стал','стала','самый','кто такой','убил','умер','убийц','is it true','why','explain'],
  search: ['найди','покажи','дай','что пишут','ищи','новости','search','find','show','give me','news'],
};

export function isExplicitSearchRequest(lower: string) {
  if (/(дай\s+поговорить|давай\s+поговорим|поболт|обща|дай\s+совет|совет\s*$)/.test(lower)) return false;
  if (/(включи|поставь|послушать|купить|заказать|цена|стоимост|товар|доставк|магазин|меню)/.test(lower)) return true;
  return /(найди|покажи|ищи|что\s+пишут|что\s+пишет|новости\s+про|есть\s+что\s+про|собери|подбери|канал\s+|source|channel|search|find|show|look\s+for)/.test(lower)
    || /(дай\s+(рецепт|фото|картин|видео|сводк|новост|источник|пост|разбор))/i.test(lower);
}

export function isQuestionAboutSpace(lower: string) {
  return /(ты\s|тебя|тебе|тобой|у\s+тебя|тво[её]|space|спейс|как\s+тебя|кто\s+ты|что\s+умеешь|что\s+можешь|что\s+спрашивать|о\s+ч[её]м\s+спросить|как\s+работаешь)/.test(lower);
}

export function isProductQuestion(lower: string) {
  return /(margelet|марджелет|маргелет|что\s+такое\s+space|что\s+такое\s+спейс|зачем\s+нужен\s+space|зачем\s+нужен\s+спейс|чем\s+вы\s+отличаетесь|почему\s+вас\s+нельзя\s+заменить|telegram\s+не\s+индекс|телеграм\s+не\s+индекс|google\s+ищет|индекс\s+внимания)/.test(lower);
}

export function isTunnelRequest(lower: string) {
  return /(найти\s+(человека|людей|единомышлен|попутчик|собеседник|партн[её]р)|кто\s+(ещ[её]|тоже)|хочу\s+(в\s+питер|поехать|открыть|найти)|туннел|единомышлен|попутчик)/.test(lower);
}

export function isPureDialogMessage(query: string, intent: SpaceIntent) {
  const lower = normalize(query);
  const tokens = tokenize(query);
  if (['greeting','thanks','identity','liveness','capabilities','smalltalk','permissionTalk','nameMemory','advice'].includes(intent)) return true;
  if (tokens.length <= 2 && /(бро|друг|как\s+ты|как\s+дела|поговор|поболт|обща|живой|ии|бот|скучно)/.test(lower)) return true;
  return false;
}

export function detectIntent(query: string): { intent: SpaceIntent; confidence: number } {
  const lower = normalize(query);
  const tokens = tokenize(query);

  if (/(меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)/.test(lower)) return { intent: 'nameMemory', confidence: 10 };
  if (isProductQuestion(lower)) return { intent: 'product', confidence: 10 };
  if (/(инвестор|инвестору|питч|pitch|вложиться|инвестиции)/.test(lower)) return { intent: 'investor', confidence: 10 };
  if (/(монетизац|сколько\s+заработ|окупаем|выручк|подписк|pro)/.test(lower)) return { intent: 'monetization', confidence: 10 };
  if (/(архитектур|как\s+построен|без\s+базы|vercel|github|json)/.test(lower)) return { intent: 'architecture', confidence: 10 };
  if (/(seo|индексац|трафик|масштаб|рост|google)/.test(lower)) return { intent: 'growth', confidence: 9 };
  if (/(риск|опасност|юридич|legal)/.test(lower)) return { intent: 'risk', confidence: 9 };
  if (isTunnelRequest(lower)) return { intent: 'tunnel', confidence: 10 };
  if (/(включи|поставь|послушать|billie\s+jean|билли\s+джин|музык|песн|трек)/.test(lower)) return { intent: 'music', confidence: 10 };
  if (/(купить|заказать|цена|стоимост|товар|доставк|магазин|меню|суши|ролл|buy|order|price|shop)/.test(lower)) return { intent: 'shopping', confidence: 10 };
  if (/(дай\s+совет|нужен\s+совет|идеи\s+и\s+деньги|хочу\s+свой\s+бизнес|нет\s+идей|нет\s+денег|что\s+делать)/.test(lower)) return { intent: 'advice', confidence: 10 };
  if (/(ок\s+)?давай\s+(просто\s+)?(поговорим|поболтаем)|поболтаться\s+хочу|поболтать\s+хочу|поговорить\s+хочу|можем\s+(просто\s+)?поговорить|хочу\s+общаться|can\s+we\s+(chat|talk)/.test(lower)) return { intent: 'permissionTalk', confidence: 10 };
  if (/(что\s+(у\s+тебя\s+)?(можно\s+)?спрашивать|о\s+ч[её]м\s+спросить|что\s+ты\s+умеешь|что\s+умеешь|что\s+можешь|как\s+работаешь|расскажи\s+о\s+себе|what\s+can\s+i\s+ask|what\s+can\s+you\s+do)/.test(lower)) return { intent: 'capabilities', confidence: 10 };
  if (/(как\s+тебя\s+зовут|кто\s+ты|ты\s+кто|тво[её]\s+имя|what\s+is\s+your\s+name|who\s+are\s+you)/.test(lower)) return { intent: 'identity', confidence: 10 };
  if (/(ты\s+живой|ты\s+настоящий|ты\s+человек|ты\s+ии|ты\s+ai|ты\s+бот|are\s+you\s+(alive|real|human|ai|a\s+bot))/.test(lower)) return { intent: 'liveness', confidence: 10 };
  if (/(если\s+я\s+попрошу|ты\s+найд[её]шь|можешь\s+найти|сможешь\s+найти|can\s+you\s+find|will\s+you\s+find)/.test(lower)) return { intent: 'capabilities', confidence: 9 };
  if (/(как\s+дела|как\s+ты|что\s+делаешь|ты\s+тут|ты\s+здесь|how\s+are\s+you|скучно)/.test(lower)) return { intent: 'smalltalk', confidence: 8 };

  let best: { intent: SpaceIntent; confidence: number } = { intent: 'search', confidence: 0 };
  (Object.keys(INTENT_KEYWORDS) as SpaceIntent[]).forEach((intent) => {
    const keywords = INTENT_KEYWORDS[intent] ?? [];
    const confidence = keywords.reduce((sum, keyword) => lower.includes(normalize(keyword)) ? sum + 1 : sum, 0);
    if (confidence > best.confidence) best = { intent, confidence };
  });

  if (tokens.length === 0 && best.intent === 'greeting') return { intent: 'greeting', confidence: 7 };
  if (!isExplicitSearchRequest(lower) && isQuestionAboutSpace(lower) && best.confidence <= 1) return { intent: 'smalltalk', confidence: 5 };
  if (best.confidence === 0 && lower.endsWith('?')) return { intent: 'smalltalk', confidence: 2 };
  return best;
}
