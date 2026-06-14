export type SpaceUi = {
  hello: string[];
  thanks: string[];
  capabilities: string;
  identity: string;
  liveness: string;
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
    hello: ['Я тут, бро 🙂', 'На связи 🐙', 'Тут. Слушаю тебя, бро.'],
    thanks: ['Всегда рядом, бро 🤝', 'Готово, бро.', 'Обнял, продолжаем.'],
    capabilities: 'Можешь писать как человеку. Я умею поговорить, понять намерение, искать по margeleT новости, темы, страны, каналы, фото, видео и посты. Если ты просто общаешься — я не лезу в ленту.',
    identity: 'Я Space — живой поиск margeleT. Не человек, но стараюсь вести диалог нормально: сначала понимаю, потом ищу.',
    liveness: 'Не живой как человек 🙂 Я локальный мозг Space: держу контекст на твоём устройстве и подключаю данные margeleT, когда ты реально просишь найти.',
    smalltalk: ['Да, бро, можем просто поговорить 🙂', 'Конечно. Можно без поиска — просто общаемся.', 'Я рядом. Пиши как есть, я подстроюсь.'],
    permissionTalk: 'Да, конечно 🙂 Можем просто поговорить. Я не буду ничего искать, пока ты сам не попросишь.',
    abilityVideo: 'Да, найду. Только напиши тему, страну или канал — и я аккуратно покажу видео, без мусорной выдачи.',
    abilitySearch: 'Да, смогу. Я сначала уточню смысл, а потом покажу самое близкое из margeleT.',
    clarifySearch: 'Понял. Тут лучше уточнить: тебе нужен короткий ответ, источники, фото/видео или разбор темы?',
    noExact: 'Понял, но точного совпадения сейчас не вижу. Дай ещё одно слово, страну или источник — сузим.',
    factCareful: 'Понимаю продолжение, но не хочу придумывать без источника. Могу поискать точнее или показать найденное.',
    foundOne: 'Нашёл близкое. Покажу сначала один вариант 👇',
    foundGallery: 'Собрал медиа по смыслу. Сначала небольшая подборка 👇',
    foundVideo: 'Нашёл близкие видео. Показываю аккуратно 👇',
    recipeFound: 'Да, нашёл живой вариант. Сначала один самый близкий 👇',
    weatherClarify: 'По погоде уточни город и период: сегодня, завтра или неделя? Тогда соберу красиво.',
    trendClarify: 'Тему понял. Уточни страну или объект — и я соберу сигнал по Telegram-потоку.',
    continueTitle: 'Можно дальше',
    chipsGeneral: ['Коротко объясни', 'Показать источники', 'Найти фото'],
    chipsCapability: ['Найди новости про Илона Маска', 'Что обсуждают в Индии?', 'Покажи видео'],
    chipsRecipe: ['Показать ещё рецепт', 'Найти с видео', 'Сделай инструкцию'],
    chipsImage: ['Ещё картинки', 'Только видео', 'Открыть источники'],
    chipsTrend: ['Что растёт?', 'По странам', 'Дай кратко'],
    galleryTitle: 'Медиа из Telegram',
    videoTitle: 'Видео и превью',
  },
  us: {
    hello: ['I’m here 🙂', 'Ready 🐙', 'Here with you.'],
    thanks: ['Anytime 🤝', 'Got you.', 'Always.'],
    capabilities: 'You can write naturally. I can chat, understand intent, and search margeleT for news, topics, countries, channels, photos, videos, and posts. If you are just talking, I will not open the feed.',
    identity: 'I’m Space — margeleT’s live search brain. Not human, but I try to hold a real dialog: understand first, search second.',
    liveness: 'Not alive like a human 🙂 I’m Space: a local dialog brain that keeps context on your device and uses margeleT data when you actually ask me to search.',
    smalltalk: ['Sure, we can just talk 🙂', 'Of course. No search unless you ask.', 'I’m here. Write naturally.'],
    permissionTalk: 'Yes, of course 🙂 We can just talk. I will not search until you ask me to.',
    abilityVideo: 'Yes. Give me a topic, country, or channel and I’ll show video results carefully, not a random dump.',
    abilitySearch: 'Yes. I’ll understand the intent first, then show the closest margeleT result.',
    clarifySearch: 'Got it. What do you want: a short answer, sources, photos/videos, or topic analysis?',
    noExact: 'I understand, but I do not see a precise match right now. Add one more word, country, or source and I’ll narrow it down.',
    factCareful: 'I understand the follow-up, but I do not want to invent without a source. I can search more precisely or show what I found.',
    foundOne: 'I found a close match. One clean result first 👇',
    foundGallery: 'I found media by meaning. Small set first 👇',
    foundVideo: 'I found close video posts 👇',
    recipeFound: 'Yes — I found a real Telegram recipe. Closest one first 👇',
    weatherClarify: 'For weather, tell me the city and period: today, tomorrow, or week? Then I’ll format it nicely.',
    trendClarify: 'I get the topic. Add a country or object and I’ll collect the Telegram signal.',
    continueTitle: 'You can continue',
    chipsGeneral: ['Explain shortly', 'Show sources', 'Find photos'],
    chipsCapability: ['Find Elon Musk news', 'What is discussed in India?', 'Show videos'],
    chipsRecipe: ['More recipes', 'Find video', 'Make steps'],
    chipsImage: ['More images', 'Only video', 'Open sources'],
    chipsTrend: ['What is growing?', 'By countries', 'Short summary'],
    galleryTitle: 'Telegram media',
    videoTitle: 'Videos and previews',
  },
};

export function getUi(lang: string) {
  return UI[lang] || UI.us;
}
