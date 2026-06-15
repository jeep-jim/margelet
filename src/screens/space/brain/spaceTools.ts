import type { BrainContext, SpaceBlock } from './types';
import type { ToolDecision } from './toolRouter';

type CrawlResult = {
  ok?: boolean;
  tool?: string;
  title?: string;
  summary?: string;
  city?: string;
  temp?: number;
  wind?: number;
  code?: number;
  source?: string;
  image?: string;
  url?: string;
  facts?: string[];
};

async function callCrawler(tool: string, query: string): Promise<CrawlResult | null> {
  if (typeof fetch === 'undefined') return null;
  try {
    const response = await fetch(`/api/space-crawl?tool=${encodeURIComponent(tool)}&q=${encodeURIComponent(query)}`, {
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return null;
    return (await response.json()) as CrawlResult;
  } catch {
    return null;
  }
}

function weatherSummary(data: CrawlResult, lang: string) {
  if (typeof data.temp !== 'number') return data.summary || '';
  const temp = Math.round(data.temp);
  const wind = typeof data.wind === 'number' ? `, ветер ${Math.round(data.wind)} м/с` : '';
  if (lang === 'ru') return `Сейчас около ${temp}°${wind}. ${data.summary || ''}`.trim();
  return `Now around ${temp}°${wind}. ${data.summary || ''}`.trim();
}

export async function runExternalTool(ctx: BrainContext, decision: ToolDecision): Promise<{ text?: string; blocks: SpaceBlock[] }> {
  if (decision.tool === 'weather') {
    const data = await callCrawler('weather', decision.subject || ctx.query);
    if (!data?.ok) return { blocks: [] };
    const city = data.city || decision.subject || ctx.subject || ctx.query;
    return {
      text: ctx.lang === 'ru' ? `Показываю погоду по ${city} 🌤️` : `Showing the weather for ${city} 🌤️`,
      blocks: [{
        type: 'weather',
        city,
        title: ctx.lang === 'ru' ? `Погода: ${city}` : `Weather: ${city}`,
        summary: weatherSummary(data, ctx.lang),
        sourceTitle: data.source || 'Open-Meteo',
      }],
    };
  }

  if (decision.tool === 'biography' || decision.tool === 'web') {
    const data = await callCrawler('wiki', decision.subject || ctx.query);
    if (!data?.ok) return { blocks: [] };
    const facts = data.facts?.filter(Boolean).slice(0, 4) || [];
    return {
      text: ctx.lang === 'ru'
        ? `Нашёл базовую справку. Коротко и по делу 👇`
        : `I found a clean reference. Short version 👇`,
      blocks: [{
        type: 'webInfo',
        title: data.title || decision.subject || ctx.query,
        summary: data.summary || '',
        image: data.image || null,
        sourceTitle: data.source || 'Wikipedia',
        url: data.url || '',
        facts,
      }],
    };
  }

  if (decision.tool === 'finance') {
    return {
      text: ctx.lang === 'ru'
        ? 'Финансовый виджет заложен. Для боевого графика нужен market-data источник; пока могу поискать свежие обсуждения и новости.'
        : 'The finance widget is prepared. A market data source is needed for live charts; for now I can search discussions and news.',
      blocks: [{
        type: 'stat',
        title: ctx.lang === 'ru' ? 'Финансовый режим' : 'Finance mode',
        value: 'β',
        caption: ctx.lang === 'ru' ? 'Следующий слой: график цены + источники + сигнал рынка.' : 'Next layer: price chart + sources + market signal.',
        tone: 'green',
      }],
    };
  }

  return { blocks: [] };
}
