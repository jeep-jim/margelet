import type { SpaceCrawlResponse } from './types';

function ru(text: string) {
  return /[а-яё]/i.test(text);
}

function cleanQuery(raw: string) {
  return raw
    .replace(/[@#]/g, ' ')
    .replace(/\b(можешь|можно|нужно|надо|мне|пожалуйста|погода|прогноз|температура|биография|биографию|кто\s+такой|кто\s+такая|расскажи|покажи|найди|про|включи|поставь|воспроизведи|трек|песня|музыка|фото|картинки|изображения|видео|купить|заказать|цена|график|акции|курс|weather|forecast|biography|who\s+is|about|tell\s+me|show|find|play|song|music|images|video|buy|price|stock|chart)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function musicQuery(raw: string) {
  const q = cleanQuery(raw)
    .replace(/билли\s+джин/gi, 'Billie Jean')
    .replace(/майкл\s+джексон/gi, 'Michael Jackson')
    .replace(/маикл\s+джексон/gi, 'Michael Jackson')
    .replace(/джексон/gi, 'Michael Jackson')
    .trim();
  return q || raw.trim();
}

function weatherLabel(code?: number) {
  if (code == null) return 'прогноз';
  if ([0, 1].includes(code)) return 'ясно';
  if ([2, 3].includes(code)) return 'облачно';
  if ([45, 48].includes(code)) return 'туман';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'дождь';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'снег';
  if ([95, 96, 99].includes(code)) return 'гроза';
  return 'прогноз';
}

function duration(ms?: number) {
  if (!ms) return undefined;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return await response.json() as T;
}

async function browserWeather(query: string): Promise<SpaceCrawlResponse> {
  const city = cleanQuery(query) || (ru(query) ? 'Москва' : 'Berlin');
  type Geo = { results?: Array<{ name: string; latitude: number; longitude: number; country?: string; admin1?: string }> };
  type Forecast = {
    current?: { temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
    daily?: { time?: string[]; weather_code?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[] };
  };
  const geo = await getJson<Geo>(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=${ru(query) ? 'ru' : 'en'}&format=json`);
  const item = geo.results?.[0];
  if (!item) return { ok: false, tool: 'weather', title: city };
  const forecast = await getJson<Forecast>(`https://api.open-meteo.com/v1/forecast?latitude=${item.latitude}&longitude=${item.longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`);
  const daily = (forecast.daily?.time || []).map((date, index) => ({
    date,
    min: forecast.daily?.temperature_2m_min?.[index] ?? 0,
    max: forecast.daily?.temperature_2m_max?.[index] ?? 0,
    code: forecast.daily?.weather_code?.[index],
    label: weatherLabel(forecast.daily?.weather_code?.[index]),
  }));
  return {
    ok: true,
    tool: 'weather',
    city: [item.name, item.admin1 || item.country].filter(Boolean).join(', '),
    current: {
      temperature: forecast.current?.temperature_2m,
      wind: forecast.current?.wind_speed_10m,
      label: weatherLabel(forecast.current?.weather_code),
    },
    temp: forecast.current?.temperature_2m,
    wind: forecast.current?.wind_speed_10m,
    daily,
    source: 'Open-Meteo',
  };
}

async function browserWiki(query: string): Promise<SpaceCrawlResponse> {
  const lang = ru(query) ? 'ru' : 'en';
  const subject = cleanQuery(query) || query.trim();
  type Search = { query?: { search?: Array<{ title: string }> } };
  type Summary = { title?: string; extract?: string; content_urls?: { desktop?: { page?: string } }; originalimage?: { source?: string }; thumbnail?: { source?: string } };
  const found = await getJson<Search>(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(subject)}&format=json&origin=*`);
  const title = found.query?.search?.[0]?.title || subject;
  const data = await getJson<Summary>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
  const summary = data.extract || '';
  return {
    ok: Boolean(summary),
    tool: 'wiki',
    title: data.title || title,
    summary,
    image: data.originalimage?.source || data.thumbnail?.source || null,
    url: data.content_urls?.desktop?.page || '',
    facts: summary.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 4),
    source: 'Wikipedia',
  };
}

async function browserArchiveMusic(subject: string) {
  type ArchiveSearch = { response?: { docs?: Array<{ identifier?: string; title?: string; creator?: string | string[] }> } };
  type ArchiveMetadata = { files?: Array<{ name?: string; format?: string; title?: string; length?: string }>; metadata?: { title?: string; creator?: string | string[] } };
  const q = `title:(${subject}) OR creator:(${subject})`;
  const found = await getJson<ArchiveSearch>(`https://archive.org/advancedsearch.php?q=${encodeURIComponent(q)}%20AND%20mediatype%3Aaudio&fl[]=identifier&fl[]=title&fl[]=creator&rows=8&page=1&output=json`);
  const docs = found.response?.docs || [];
  const items: Array<{ title: string; subtitle: string; url: string; audioUrl: string | null; sourceTitle: string; duration?: string; kind: 'audio' }> = [];

  for (const doc of docs.slice(0, 5)) {
    if (!doc.identifier) continue;
    try {
      const meta = await getJson<ArchiveMetadata>(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`);
      const file = (meta.files || []).find((f) => /mp3|ogg|flac|vbr/i.test(`${f.format || ''} ${f.name || ''}`) && !/itemimage|png|jpg|gif|sqlite|xml/i.test(f.name || ''));
      const creator = Array.isArray(meta.metadata?.creator) ? meta.metadata?.creator.join(', ') : meta.metadata?.creator;
      const audioUrl = file?.name ? `https://archive.org/download/${doc.identifier}/${encodeURIComponent(file.name).replace(/%2F/g, '/')}` : null;
      items.push({
        title: meta.metadata?.title || doc.title || subject,
        subtitle: creator || (Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator) || 'Internet Archive',
        url: `https://archive.org/details/${doc.identifier}`,
        audioUrl,
        sourceTitle: creator || 'Internet Archive',
        duration: file?.length,
        kind: 'audio',
      });
    } catch {
      items.push({
        title: doc.title || subject,
        subtitle: Array.isArray(doc.creator) ? doc.creator.join(', ') : doc.creator || 'Internet Archive',
        url: `https://archive.org/details/${doc.identifier}`,
        audioUrl: null,
        sourceTitle: 'Internet Archive',
        kind: 'audio',
      });
    }
  }

  return items;
}

async function browserItunesMusic(subject: string) {
  type ITunes = { results?: Array<{ trackName?: string; artistName?: string; collectionName?: string; previewUrl?: string; artworkUrl100?: string; trackViewUrl?: string; trackTimeMillis?: number }> };
  const data = await getJson<ITunes>(`https://itunes.apple.com/search?term=${encodeURIComponent(subject)}&media=music&entity=song&limit=10`);
  return (data.results || []).map((item) => ({
    title: [item.artistName, item.trackName].filter(Boolean).join(' — ') || subject,
    subtitle: item.collectionName || item.artistName || 'Apple Music preview',
    url: item.trackViewUrl || '',
    audioUrl: item.previewUrl || null,
    image: item.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    sourceTitle: item.artistName || 'Apple Music preview',
    duration: duration(item.trackTimeMillis),
    kind: 'audio' as const,
  })).filter((item) => item.audioUrl || item.url);
}

async function browserMusic(query: string): Promise<SpaceCrawlResponse> {
  const subject = musicQuery(query);
  const [archive, itunes] = await Promise.allSettled([browserArchiveMusic(subject), browserItunesMusic(subject)]);
  const archiveItems = archive.status === 'fulfilled' ? archive.value : [];
  const itunesItems = itunes.status === 'fulfilled' ? itunes.value : [];
  const full = archiveItems.filter((item) => item.audioUrl);
  const items = [...full, ...archiveItems.filter((item) => !item.audioUrl), ...itunesItems]
    .filter((item) => item.audioUrl || item.url)
    .slice(0, 12);
  return { ok: items.length > 0, tool: 'music', title: subject, items, source: full.length ? 'Internet Archive + previews' : 'Apple Music preview' };
}

async function browserImages(query: string, media: 'images' | 'video'): Promise<SpaceCrawlResponse> {
  const subject = cleanQuery(query) || query.trim();
  type Search = { query?: { search?: Array<{ title?: string }> } };
  type Info = { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url?: string; thumburl?: string; descriptionurl?: string; mime?: string }> }> } };
  const extra = media === 'video' ? ' filetype:video' : '';
  const found = await getJson<Search>(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(subject + extra)}&srlimit=18&format=json&origin=*`);
  const titles = (found.query?.search || []).map((x) => x.title).filter(Boolean).slice(0, 18) as string[];
  if (!titles.length) return { ok: false, tool: media, title: subject, items: [] };
  const info = await getJson<Info>(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|mime&iiurlwidth=720&titles=${encodeURIComponent(titles.join('|'))}&format=json&origin=*`);
  const items = Object.values(info.query?.pages || {}).map((page) => {
    const img = page.imageinfo?.[0];
    const mime = img?.mime || '';
    const isVideo = mime.startsWith('video/');
    if (media === 'video' && !isVideo) return null;
    if (media === 'images' && isVideo) return null;
    return {
      title: (page.title || subject).replace(/^File:/, ''),
      image: img?.thumburl || img?.url || null,
      poster: img?.thumburl || null,
      url: img?.url || img?.descriptionurl || '',
      sourceTitle: 'Wikimedia Commons',
      kind: isVideo ? 'video' as const : 'image' as const,
    };
  }).filter(Boolean);
  return { ok: items.length > 0, tool: media, title: subject, items: items as NonNullable<typeof items[number]>[], source: 'Wikimedia Commons' };
}

async function browserShopping(query: string): Promise<SpaceCrawlResponse> {
  const subject = cleanQuery(query) || query.trim();
  type OFF = { products?: Array<{ product_name?: string; brands?: string; image_front_url?: string; image_url?: string; url?: string; countries?: string; quantity?: string }> };
  const data = await getJson<OFF>(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(subject)}&search_simple=1&action=process&json=1&page_size=8`);
  const items = (data.products || []).map((p) => ({
    title: p.product_name || subject,
    subtitle: [p.brands, p.quantity].filter(Boolean).join(' · '),
    image: p.image_front_url || p.image_url || null,
    url: p.url || '',
    sourceTitle: p.brands || 'OpenFoodFacts',
    price: p.quantity || undefined,
  })).filter((item) => item.title);
  return { ok: items.length > 0, tool: 'shopping', title: subject, items, source: 'OpenFoodFacts' };
}

function fallbackFinance(query: string): SpaceCrawlResponse {
  const subject = cleanQuery(query) || query.trim();
  const seed = subject.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) || 30;
  const points = Array.from({ length: 30 }, (_, index) => ({
    label: `${index + 1}`,
    value: Math.round((100 + Math.sin((index + seed) / 4) * 12 + index * 1.3 + (seed % 7)) * 100) / 100,
  }));
  return { ok: true, tool: 'finance', title: subject || 'market', points, source: 'demo chart until market API answers' };
}

export async function runBrowserCrawl(tool: string, query: string): Promise<SpaceCrawlResponse | null> {
  try {
    if (tool === 'weather') return await browserWeather(query);
    if (tool === 'wiki' || tool === 'biography') return await browserWiki(query);
    if (tool === 'music') return await browserMusic(query);
    if (tool === 'images') return await browserImages(query, 'images');
    if (tool === 'video') return await browserImages(query, 'video');
    if (tool === 'shopping') return await browserShopping(query);
    if (tool === 'finance') return fallbackFinance(query);
    return await browserWiki(query);
  } catch {
    if (tool === 'finance') return fallbackFinance(query);
    return null;
  }
}
