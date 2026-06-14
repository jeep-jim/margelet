import type { SpaceIntent } from './types';
import { normalize, tokenize } from './text';

const INTENT_KEYWORDS: Record<SpaceIntent, string[]> = {
  greeting: ['привет','здравств','салам','hello','hi','hey','hola','bonjour','hallo','ciao','привіт'],
  thanks: ['спасибо','благодар','thanks','thank you','merci','gracias','danke'],
  capabilities: ['что умеешь','что ты умеешь','умеешь','расскажи о себе','как работаешь','что можешь','what can you do','capabilities'],
  identity: ['как тебя зовут','кто ты','ты кто','твое имя','твоё имя','what is your name','who are you'],
  liveness: ['ты живой','живой','ты настоящий','ты человек','are you alive','are you real','are you human'],
  smalltalk: ['как дела','как ты','что делаешь','ты тут','ты здесь','how are you','поболтать','поговорить','общаться'],
  permissionTalk: ['поболтаться хочу','поболтать хочу','поговорить хочу','можем поговорить','можем просто поговорить','хочу общаться','просто поговорить','can we chat','can we talk'],
  abilityCheck: ['ты ии','ты ai','ты бот','ты найдешь','ты найдёшь','можешь найти','сможешь найти','если я попрошу','are you ai','can you find','will you find'],
  recipe: ['рецепт','готов','пирог','капуст','салат','суп','кухн','еда','recipe','cook','food','cooking','receta'],
  weather: ['погода','прогноз','градус','дожд','снег','ветер','weather','forecast','lluvia','wetter'],
  images: ['картин','фото','изображ','галере','покажи картинки','images','photos','gallery','picture','bilder'],
  video: ['видео','ролик','смотреть','video','clip'],
  trend: ['тренд','раст','обсужда','говорят','происходит','сигнал','attention','trend','happening','discuss'],
  source: ['канал','источник','автор','source','channel'],
  fact: ['правда','это правда','почему','зачем','значит','получается','стал','стала','самый','кто такой','что такое','is it true','why','explain'],
  search: ['найди','покажи','дай','что пишут','ищи','новости','search','find','show','give me','news'],
};

export function isExplicitSearchRequest(lower: string) {
  return /(найди|покажи|дай\s+(?!поговорить)|ищи|что\s+пишут|новости\s+про|есть\s+что\s+про|search|find|show|give\s+me|look\s+for)/.test(lower);
}

export function isQuestionAboutSpace(lower: string) {
  return /(ты\s|тебя|тебе|тобой|у\s+тебя|тво[её]|space|спейс|как\s+тебя|кто\s+ты|что\s+умеешь|что\s+можешь|что\s+спрашивать|о\s+ч[её]м\s+спросить|как\s+работаешь)/.test(lower);
}

export function isPureDialogMessage(query: string, intent: SpaceIntent) {
  const lower = normalize(query);
  const tokens = tokenize(query);
  if (intent === 'greeting' || intent === 'thanks' || intent === 'identity' || intent === 'liveness' || intent === 'capabilities' || intent === 'smalltalk' || intent === 'permissionTalk' || intent === 'abilityCheck') return true;
  if (tokens.length <= 2 && /(бро|друг|как\s+ты|как\s+дела|поговор|поболт|обща|живой|ии|бот)/.test(lower)) return true;
  return false;
}

export function detectIntent(query: string): { intent: SpaceIntent; confidence: number } {
  const lower = normalize(query);
  const tokens = tokenize(query);

  // Hard dialog-first rules. Search must never win here.
  if (/(поболтаться\s+хочу|поболтать\s+хочу|поговорить\s+хочу|можем\s+(просто\s+)?поговорить|хочу\s+общаться|can\s+we\s+(chat|talk))/.test(lower)) return { intent: 'permissionTalk', confidence: 9 };
  if (/(что\s+(у\s+тебя\s+)?(можно\s+)?спрашивать|о\s+ч[её]м\s+спросить|что\s+ты\s+умеешь|что\s+умеешь|что\s+можешь|как\s+работаешь|расскажи\s+о\s+себе|what\s+can\s+i\s+ask|what\s+can\s+you\s+do)/.test(lower)) return { intent: 'capabilities', confidence: 9 };
  if (/(как\s+тебя\s+зовут|кто\s+ты|ты\s+кто|тво[её]\s+имя|what\s+is\s+your\s+name|who\s+are\s+you)/.test(lower)) return { intent: 'identity', confidence: 9 };
  if (/(ты\s+живой|ты\s+настоящий|ты\s+человек|ты\s+ии|ты\s+ai|ты\s+бот|are\s+you\s+(alive|real|human|ai|a\s+bot))/.test(lower)) return { intent: 'liveness', confidence: 9 };
  if (/(если\s+я\s+попрошу|ты\s+найд[её]шь|можешь\s+найти|сможешь\s+найти|can\s+you\s+find|will\s+you\s+find)/.test(lower)) return { intent: 'abilityCheck', confidence: 9 };
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
