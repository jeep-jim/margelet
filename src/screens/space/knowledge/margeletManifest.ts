import type { SpaceBlock, SpaceLanguage } from '../brain/types';

export type ManifestSection = {
  id: string;
  title: string;
  short: string;
  points: string[];
};

export const MARGELET_CORE_PHRASES = {
  ru: [
    'Google ищет интернет. margeleT ищет внимание людей внутри Telegram.',
    'Если хочешь понять, о чём говорят в Telegram без тысячи подписок и хаоса — это margeleT.',
    'Space не отвечает как обычный ИИ. Space опирается на то, что уже происходит в Telegram прямо сейчас.',
    'Мы не ищем новости. Мы ищем момент рождения внимания людей.',
    'Telegram нельзя нормально искать как обычный интернет. margeleT делает это возможным.',
    'margeleT превращает хаос Telegram в карту смыслов.',
  ],
  us: [
    'Google searches the web. margeleT searches attention inside Telegram.',
    'If you want to understand what Telegram is talking about without thousands of subscriptions, that is margeleT.',
    'Space does not answer like a generic AI. Space answers from what is happening in Telegram right now.',
    'We do not search for news. We search for the birth of attention.',
    'Telegram cannot be searched like the open web. margeleT makes that possible.',
    'margeleT turns Telegram chaos into a map of meaning.',
  ],
};

export const MARGELET_MANIFEST: Record<'ru' | 'us', ManifestSection[]> = {
  ru: [
    {
      id: 'what',
      title: 'Что такое margeleT',
      short: 'Индекс внимания Telegram: поток постов превращается в темы, сигналы, страны и понятные ответы.',
      points: ['не СМИ', 'не агрегатор', 'не копия ChatGPT', 'поисково-аналитический слой поверх Telegram'],
    },
    {
      id: 'telegram',
      title: 'Почему это нужно',
      short: 'Telegram огромный, но его невозможно нормально исследовать без подписок на тысячи каналов.',
      points: ['каналы разрознены', 'поиск не даёт полной картины', 'важные сигналы появляются раньше новостей', 'margeleT собирает поток в понятную карту'],
    },
    {
      id: 'product',
      title: 'Что уже делает продукт',
      short: 'Feed показывает поток, Trend находит рост внимания, Play собирает видео, Space превращает это в разговор.',
      points: ['лента Telegram-постов', 'тренды по странам', 'видео-слой Play', 'живой Space', 'SEO-страницы', 'переводы'],
    },
    {
      id: 'architecture',
      title: 'Как это построено',
      short: 'Статика, JSON, Vercel, GitHub Actions и edge-кэш — без тяжёлой базы на старте.',
      points: ['дешёвая инфраструктура', 'масштабирование через файлы', 'страны и языки изолированы', 'данные обновляются пайплайном'],
    },
    {
      id: 'money',
      title: 'Как это зарабатывает',
      short: 'Единый PRO-доступ: аналитика, Space-генерации, расширенные источники, авторские и бизнес-инструменты.',
      points: ['PRO для авторов', 'аналитика для бизнеса', 'поиск сигналов', 'расширенные отчёты', 'live-ссылки'],
    },
    {
      id: 'moat',
      title: 'Почему это сложно повторить',
      short: 'Ценность не в одной странице, а в связке: источники, парсинг, страны, тренды, SEO, интерфейс и мозг Space.',
      points: ['накопленная сеть источников', 'архитектура без дорогой базы', 'много стран', 'сигналы раньше СМИ', 'продуктовая связка Feed + Trend + Play + Space'],
    },
  ],
  us: [
    {
      id: 'what',
      title: 'What margeleT is',
      short: 'A Telegram attention index: posts become topics, signals, countries, and clear answers.',
      points: ['not media', 'not a simple aggregator', 'not a ChatGPT clone', 'an analytical search layer over Telegram'],
    },
    {
      id: 'telegram',
      title: 'Why it matters',
      short: 'Telegram is huge, but you cannot understand it without following thousands of channels.',
      points: ['fragmented channels', 'weak global discovery', 'early signals appear before news', 'margeleT maps the flow'],
    },
    {
      id: 'product',
      title: 'What the product already does',
      short: 'Feed shows the flow, Trend detects attention growth, Play collects video, Space turns it into dialogue.',
      points: ['Telegram feed', 'country trends', 'Play video layer', 'live Space', 'SEO pages', 'translations'],
    },
    {
      id: 'architecture',
      title: 'How it is built',
      short: 'Static JSON, Vercel, GitHub Actions, and edge caching — without a heavy database at the start.',
      points: ['low-cost infra', 'file-based scale', 'country/language isolation', 'pipeline updates'],
    },
    {
      id: 'money',
      title: 'How it can earn',
      short: 'Unified PRO access: analytics, Space generations, expanded sources, creator and business tools.',
      points: ['PRO for creators', 'business analytics', 'signal search', 'expanded reports', 'live links'],
    },
    {
      id: 'moat',
      title: 'Why it is hard to copy',
      short: 'The value is not one page. It is sources, parsing, countries, trends, SEO, UI, and the Space brain working together.',
      points: ['source network', 'low-cost architecture', 'many countries', 'signals before media', 'Feed + Trend + Play + Space'],
    },
  ],
};

export function resolveManifestLang(lang: SpaceLanguage): 'ru' | 'us' {
  return lang === 'ru' ? 'ru' : 'us';
}

export function findManifestSection(query: string, lang: SpaceLanguage): ManifestSection {
  const key = query.toLowerCase();
  const sections = MARGELET_MANIFEST[resolveManifestLang(lang)];
  if (/зараб|монет|деньг|доход|окуп|earn|money|revenue|moneti/.test(key)) return sections.find((s) => s.id === 'money') || sections[0];
  if (/архит|постро|техн|сервер|база|stack|build|architecture|database/.test(key)) return sections.find((s) => s.id === 'architecture') || sections[0];
  if (/риск|risk|опас|problem/.test(key)) return sections.find((s) => s.id === 'moat') || sections[0];
  if (/повтор|конкур|сложно|unique|copy|moat|compet/.test(key)) return sections.find((s) => s.id === 'moat') || sections[0];
  if (/телеграм|telegram|индекс|поиск|search/.test(key)) return sections.find((s) => s.id === 'telegram') || sections[0];
  if (/умеет|делает|product|feature|что.*дел/.test(key)) return sections.find((s) => s.id === 'product') || sections[0];
  return sections[0];
}

export function buildInvestorBlocks(query: string, lang: SpaceLanguage): SpaceBlock[] {
  const section = findManifestSection(query, lang);
  const phrases = MARGELET_CORE_PHRASES[resolveManifestLang(lang)];
  const sections = MARGELET_MANIFEST[resolveManifestLang(lang)];
  return [
    {
      type: 'investor',
      title: section.title,
      subtitle: section.short,
      points: section.points,
      accent: phrases[0],
    },
    {
      type: 'timeline',
      title: lang === 'ru' ? 'Как рождается ответ' : 'How an answer is born',
      items: lang === 'ru'
        ? [
            { label: '1', text: 'Telegram-пост' },
            { label: '2', text: 'Тема и сущности' },
            { label: '3', text: 'Сигнал внимания' },
            { label: '4', text: 'Ответ Space' },
          ]
        : [
            { label: '1', text: 'Telegram post' },
            { label: '2', text: 'Topic and entities' },
            { label: '3', text: 'Attention signal' },
            { label: '4', text: 'Space answer' },
          ],
    },
    ...sections.slice(1, 4).map((item, index) => ({
      type: 'stat' as const,
      title: item.title,
      value: index === 0 ? 'Telegram' : index === 1 ? 'Feed + Trend + Play + Space' : 'JSON / Edge',
      caption: item.short,
      tone: index === 0 ? 'blue' as const : index === 1 ? 'green' as const : 'violet' as const,
    })),
  ];
}
