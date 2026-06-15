import type { SpaceIntent } from './types';
import { normalize, tokenize } from './text';

const INTENT_KEYWORDS: Record<SpaceIntent, string[]> = {
  greeting: ['привет','здравств','салам','hello','hi','hey'],
  thanks: ['спасибо','благодар','thanks','thank you'],
  capabilities: ['что умеешь','что ты умеешь','умеешь','расскажи о себе','как работаешь','что можешь','что спрашивать','what can you do','capabilities'],
  identity: ['как тебя зовут','кто ты','ты кто','твое имя','твоё имя','what is your name','who are you'],
  liveness: ['ты живой','живой','ты настоящий','ты человек','ты ии','ты бот','are you alive','are you real','are you human','are you ai'],
  smalltalk: ['как дела','как ты','что делаешь','ты тут','ты здесь','how are you'],
  permissionTalk: ['ок давай поговорим','давай поговорим','давай поболтаем','поболтаться хочу','поболтать хочу','поговорить хочу','можем поговорить','можем просто поговорить','хочу общаться','просто поговорить','can we chat','can we talk'],
  nameMemory: ['меня зовут','зови меня','моё имя','мое имя','my name is','call me'],
  recipe: ['рецепт','готов','пирог','капуст','салат','суп','кухн','еда','recipe','cook','food','cooking'],
  weather: ['погода','прогноз','градус','дожд','снег','ветер','weather','forecast'],
  images: ['картин','фото','изображ','галере','яркие моменты','images','photos','gallery','picture'],
  video: ['видео','ролик','смотреть','video','clip'],
  trend: ['тренд','раст','обсужда','говорят','происходит','сигнал','attention','trend','happening','discuss'],
  source: ['канал','источник','автор','source','channel'],
  fact: ['правда','это правда','почему','зачем','значит','получается','стал','стала','самый','кто такой','что такое','убил','умер','убийц','is it true','why','explain'],
  search: ['найди','покажи','дай','что пишут','ищи','новости','search','find','show','give me','news'],
};

export function isExplicitSearchRequest(lower: string) {
  if (/(дай\s+поговорить|давай\s+поговорим|поболт|обща)/.test(lower)) return false;
  return /(найди|покажи|ищи|что\s+пишут|новости\s+про|есть\s+что\s+про|собери|подбери|search|find|show|look\s+for)/.test(lower)
    || /(дай\s+(рецепт|фото|картин|видео|сводк|новост|источник|пост|разбор))/i.test(lower);
}

export function isQuestionAboutSpace(lower: string) {
  return /(ты\s|тебя|тебе|тобой|у\s+тебя|тво[её]|space|спейс|как\s+тебя|кто\s+ты|что\s+умеешь|что\s+можешь|что\s+спрашивать|о\s+ч[её]м\s+спросить|как\s+работаешь)/.test(lower);
}

export function isPureDialogMessage(query: string, intent: SpaceIntent) {
  const lower = normalize(query);
  const tokens = tokenize(query);
  if (['greeting','thanks','identity','liveness','capabilities','smalltalk','permissionTalk','nameMemory'].includes(intent)) return true;
  if (tokens.length <= 3 && /(бро|друг|как\s+ты|как\s+дела|поговор|поболт|обща|живой|ии|бот|hello|hi|thanks)/.test(lower)) return true;
  if (!isExplicitSearchRequest(lower) && /(хочу\s+поболт|можем\s+поговор|просто\s+поговор)/.test(lower)) return true;
  return false;
}

export function detectIntent(query: string): { intent: SpaceIntent; confidence: number } {
  const lower = normalize(query);
  const tokens = tokenize(query);

  if (/(меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)/.test(lower)) return { intent: 'nameMemory', confidence: 10 };
  if (/(ок\s+)?давай\s+(просто\s+)?(поговорим|поболтаем)|поболтаться\s+хочу|поболтать\s+хочу|поговорить\s+хочу|можем\s+(просто\s+)?поговорить|хочу\s+общаться|can\s+we\s+(chat|talk)/.test(lower)) return { intent: 'permissionTalk', confidence: 10 };
  if (/(что\s+(у\s+тебя\s+)?(можно\s+)?спрашивать|о\s+ч[её]м\s+спросить|что\s+ты\s+умеешь|что\s+умеешь|что\s+можешь|как\s+работаешь|расскажи\s+о\s+себе|what\s+can\s+i\s+ask|what\s+can\s+you\s+do)/.test(lower)) return { intent: 'capabilities', confidence: 10 };
  if (/(как\s+тебя\s+зовут|кто\s+ты|ты\s+кто|тво[её]\s+имя|what\s+is\s+your\s+name|who\s+are\s+you)/.test(lower)) return { intent: 'identity', confidence: 10 };
  if (/(ты\s+живой|ты\s+настоящий|ты\s+человек|ты\s+ии|ты\s+ai|ты\s+бот|are\s+you\s+(alive|real|human|ai|a\s+bot))/.test(lower)) return { intent: 'liveness', confidence: 10 };
  if (/(если\s+я\s+попрошу|ты\s+найд[её]шь|можешь\s+найти|сможешь\s+найти|can\s+you\s+find|will\s+you\s+find)/.test(lower)) return { intent: 'capabilities', confidence: 9 };
  if (/(как\s+дела|как\s+ты|что\s+делаешь|ты\s+тут|ты\s+здесь|how\s+are\s+you)/.test(lower)) return { intent: 'smalltalk', confidence: 8 };

  let best: { intent: SpaceIntent; confidence: number } = { intent: 'search', confidence: 0 };
  (Object.keys(INTENT_KEYWORDS) as SpaceIntent[]).forEach((intent) => {
    const confidence = INTENT_KEYWORDS[intent].reduce((sum, keyword) => lower.includes(normalize(keyword)) ? sum + 1 : sum, 0);
    if (confidence > best.confidence) best = { intent, confidence };
  });

  if (tokens.length === 0 && best.intent === 'greeting') return { intent: 'greeting', confidence: 7 };
  if (!isExplicitSearchRequest(lower) && isQuestionAboutSpace(lower) && best.confidence <= 1) return { intent: 'smalltalk', confidence: 5 };
  if (best.confidence === 0 && lower.endsWith('?')) return { intent: 'smalltalk', confidence: 2 };
  return best;
}
