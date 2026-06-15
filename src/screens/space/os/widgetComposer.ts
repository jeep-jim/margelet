import type { SpaceBlock } from './types';
import type { SpaceCrawlResponse, SpaceOSDecision } from './types';

function clean(value: string | undefined | null) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function titleCase(value: string) {
  const text = clean(value);
  return text ? text.slice(0, 1).toUpperCase() + text.slice(1) : text;
}

export function composeWeatherWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision): SpaceBlock | null {
  const city = clean(data.city) || titleCase(decision.subject || decision.query);
  if (!city) return null;
  const temp = data.current?.temperature ?? data.temp;
  const wind = data.current?.wind ?? data.wind;
  const label = clean(data.current?.label) || clean(data.summary) || 'прогноз получен';
  return {
    type: 'weather',
    city,
    title: decision.lang === 'ru' ? `Погода: ${city}` : `Weather: ${city}`,
    summary: temp != null
      ? `${decision.lang === 'ru' ? 'Сейчас' : 'Now'} ${Math.round(temp)}°, ${label}. ${decision.lang === 'ru' ? 'Ветер' : 'Wind'} ${Math.round(Number(wind || 0))} м/с.`
      : clean(data.summary) || label,
    sourceTitle: clean(data.source) || 'Open-Meteo',
    daily: data.daily,
  };
}

export function composeInfoWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision): SpaceBlock | null {
  const title = clean(data.title) || titleCase(decision.subject || decision.query);
  const summary = clean(data.summary) || clean(data.items?.[0]?.title) || '';
  if (!title && !summary) return null;
  const facts = data.facts?.map(clean).filter(Boolean).slice(0, 5)
    || data.items?.map((item) => clean(item.title)).filter(Boolean).slice(0, 5)
    || [];
  return {
    type: 'webInfo',
    title,
    summary: summary || facts[0] || title,
    image: data.image || data.items?.find((item) => item.image)?.image || null,
    sourceTitle: clean(data.source) || 'Internet',
    url: data.url || data.items?.[0]?.url || '',
    facts,
  };
}

export function composeGalleryWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision, forceKind?: 'image' | 'video'): SpaceBlock | null {
  const items = (data.items || [])
    .map((item) => ({
      url: item.image || item.url || '',
      poster: item.poster || item.image || null,
      kind: (forceKind || item.kind || 'image') as 'image' | 'video' | 'audio' | 'file',
      sourceTitle: item.sourceTitle || data.source || 'Web',
      postUrl: item.url || item.image || '',
    }))
    .filter((item) => item.url)
    .slice(0, 12);
  if (!items.length) return null;
  const title = forceKind === 'video'
    ? (decision.lang === 'ru' ? `Видео: ${decision.subject}` : `Videos: ${decision.subject}`)
    : (decision.lang === 'ru' ? `Картинки: ${decision.subject}` : `Images: ${decision.subject}`);
  return { type: 'gallery', title, items };
}

export function composeMusicWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision): SpaceBlock | null {
  const tracks = (data.items || [])
    .filter((item) => item.audioUrl || item.url)
    .map((item) => ({
      title: item.title,
      sourceTitle: item.sourceTitle || data.source || 'Web audio',
      postUrl: item.url || item.audioUrl || '',
      audioUrl: item.audioUrl || null,
    }))
    .slice(0, 10);
  if (!tracks.length) return null;
  return {
    type: 'music',
    title: decision.lang === 'ru' ? `Музыка: ${decision.subject || decision.query}` : `Music: ${decision.subject || decision.query}`,
    subtitle: decision.lang === 'ru' ? 'Нажми на трек — плеер останется играть в трее.' : 'Tap a track — the player keeps running in the tray.',
    tracks,
  };
}

export function composeChartWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision): SpaceBlock | null {
  if (!data.points?.length) return null;
  return {
    type: 'chart',
    title: data.title || (decision.lang === 'ru' ? `График: ${decision.subject}` : `Chart: ${decision.subject}`),
    subtitle: data.source || 'market data',
    sourceTitle: data.source || 'market',
    points: data.points.slice(-60),
  };
}

export function composeShopWidget(data: SpaceCrawlResponse, decision: SpaceOSDecision): SpaceBlock | null {
  const items = (data.items || [])
    .filter((item) => item.url || item.title)
    .map((item) => ({
      title: item.title,
      price: item.price,
      sourceTitle: item.sourceTitle || data.source || 'Web',
      postUrl: item.url || '',
      image: item.image || null,
    }))
    .slice(0, 8);
  if (!items.length) return null;
  return {
    type: 'shop',
    title: decision.lang === 'ru' ? `Варианты: ${decision.subject || decision.query}` : `Options: ${decision.subject || decision.query}`,
    subtitle: decision.lang === 'ru' ? 'Первые найденные варианты из открытого веба.' : 'First matches from the open web.',
    items,
  };
}
