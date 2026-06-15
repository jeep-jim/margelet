export type SpaceUi = {
  hello: string[];
  thanks: string[];
  capabilities: string;
  identity: string;
  liveness: string;
  nameSaved: string;
  smalltalk: string[];
  permissionTalk: string;
  abilityVideo: string;
  abilitySearch: string;
  clarifySearch: string;
  noExact: string;
  factCareful: string;
  foundOne: string;
  foundGallery: string;
  foundVideo: string;
  recipeFound: string;
  weatherClarify: string;
  trendClarify: string;
  continueTitle: string;
  chipsGeneral: string[];
  chipsCapability: string[];
  chipsRecipe: string[];
  chipsImage: string[];
  chipsTrend: string[];
  galleryTitle: string;
  videoTitle: string;
};

export const UI: Record<string, SpaceUi> = {
  ru: {
    hello: ['Я тут, бро.', 'На связи.', 'Слушаю тебя.'],
    thanks: ['Всегда рядом.', 'Готово.', 'Обнял, продолжаем.'],
    capabilities: 'Можешь писать как человеку. Я умею просто говорить, помнить контекст на этом устройстве и искать по margeleT темы, страны, каналы, фото, видео и посты. Если ты болтаешь — я не лезу в ленту.',
    identity: 'Я Space — локальный мозг margeleT. Не человек, но стараюсь вести диалог живо: сначала понимаю, потом решаю, нужен ли поиск.',
    liveness: 'Живой — в смысле диалога. Человеком я не притворяюсь: я локальный мозг Space, который учится на этом устройстве и подключает поток margeleT только когда надо.',
    nameSaved: 'Запомнил. Буду обращаться так.',
    smalltalk: ['Да, бро, можем просто поговорить.', 'Конечно. Без поиска — просто общаемся.', 'Я рядом. Пиши как есть.'],
    permissionTalk: 'Да, конечно. Можем просто поговорить. Я не буду искать, пока ты сам не попросишь.',
    abilityVideo: 'Да, найду. Только дай тему, страну или канал — и покажу аккуратно, без мусорной выдачи.',
    abilitySearch: 'Да, смогу. Сначала пойму смысл, потом покажу самое близкое из margeleT.',
    clarifySearch: 'Понял. Нужно чуть сузить: страна, источник или ещё одно ключевое слово.',
    noExact: 'Сейчас в моей базе про это тихо. В интернете наверняка может быть больше, но в margeleT точного сигнала не вижу.',
    factCareful: 'Понимаю продолжение, но не хочу придумывать без источника. Могу поискать точнее или показать найденное.',
    foundOne: 'Нашёл близкое. Сначала один вариант 👇',
    foundGallery: 'Собрал медиа по смыслу. Небольшая подборка 👇',
    foundVideo: 'Нашёл близкие видео. Показываю аккуратно 👇',
    recipeFound: 'Да, нашёл живой вариант. Сначала один самый близкий 👇',
    weatherClarify: 'По погоде уточни город и период: сегодня, завтра или неделя?',
    trendClarify: 'Тему понял. Уточни страну или объект — и я соберу сигнал по Telegram-потоку.',
    continueTitle: 'Можно дальше',
    chipsGeneral: ['Коротко объясни', 'Показать источники', 'Найти фото'],
    chipsCapability: ['Найди новости про Илона Маска', 'Что обсуждают в Индии?', 'Покажи видео'],
    chipsRecipe: ['Показать ещё рецепт', 'Найти с видео', 'Сделай инструкцию'],
    chipsImage: ['Ещё картинки', 'Только видео', 'Открыть источники'],
    chipsTrend: ['Что растёт?', 'По странам', 'Дай кратко'],
    galleryTitle: 'Медиа из margeleT',
    videoTitle: 'Видео и превью',
  },
  us: {
    hello: ['I’m here.', 'Ready.', 'Listening.'],
    thanks: ['Anytime.', 'Got you.', 'Always.'],
    capabilities: 'You can write naturally. I can chat, keep local context on this device, and search margeleT for topics, countries, channels, photos, videos, and posts. If you are just talking, I will not open the feed.',
    identity: 'I’m Space — margeleT’s local brain. Not human, but I try to hold a real dialog: understand first, decide whether search is needed second.',
    liveness: 'Alive as a dialog, not as a person. I’m a local Space brain that learns on this device and uses margeleT flow when needed.',
    nameSaved: 'Got it. I’ll remember that on this device.',
    smalltalk: ['Sure, we can just talk.', 'Of course. No search unless you ask.', 'I’m here. Write naturally.'],
    permissionTalk: 'Yes, of course. We can just talk. I will not search until you ask me to.',
    abilityVideo: 'Yes. Give me a topic, country, or channel and I’ll show video results carefully, not a random dump.',
    abilitySearch: 'Yes. I’ll understand the intent first, then show the closest margeleT result.',
    clarifySearch: 'Got it. Narrow it a bit: country, source, or one more keyword.',
    noExact: 'It is quiet in my current margeleT base for this. The wider internet may have more, but I do not see a clean signal here yet.',
    factCareful: 'I understand the follow-up, but I do not want to invent without a source. I can search more precisely or show what I found.',
    foundOne: 'I found a close match. One clean result first 👇',
    foundGallery: 'I found media by meaning. Small set first 👇',
    foundVideo: 'I found close video posts 👇',
    recipeFound: 'Yes — I found a real Telegram recipe. Closest one first 👇',
    weatherClarify: 'For weather, tell me the city and period: today, tomorrow, or week?',
    trendClarify: 'I get the topic. Add a country or object and I’ll collect the Telegram signal.',
    continueTitle: 'You can continue',
    chipsGeneral: ['Explain shortly', 'Show sources', 'Find photos'],
    chipsCapability: ['Find Elon Musk news', 'What is discussed in India?', 'Show videos'],
    chipsRecipe: ['More recipes', 'Find video', 'Make steps'],
    chipsImage: ['More images', 'Only video', 'Open sources'],
    chipsTrend: ['What is growing?', 'By countries', 'Short summary'],
    galleryTitle: 'margeleT media',
    videoTitle: 'Videos and previews',
  },
};

export function getUi(lang: string) {
  return UI[lang] || UI.us;
}
