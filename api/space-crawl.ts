import type { VercelRequest, VercelResponse } from '@vercel/node';

type WikiSummary = {
  title?: string;
  extract?: string;
  content_urls?: { desktop?: { page?: string } };
  originalimage?: { source?: string };
  thumbnail?: { source?: string };
};

type GeoItem = { name: string; latitude: number; longitude: number; country?: string; admin1?: string };
type GeoResult = { results?: GeoItem[] };
type ForecastResult = {
  current?: { temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
  daily?: { time?: string[]; temperature_2m_min?: number[]; temperature_2m_max?: number[]; weather_code?: number[] };
};

type ArchiveSearch = { response?: { docs?: Array<{ identifier?: string; title?: string; creator?: string | string[] }> } };
type ArchiveMetadata = { files?: Array<{ name?: string; format?: string; title?: string; length?: string }>; metadata?: { title?: string; creator?: string | string[] } };
type ITunesSearch = { results?: Array<{ trackName?: string; artistName?: string; collectionName?: string; previewUrl?: string; artworkUrl100?: string; trackViewUrl?: string; trackTimeMillis?: number; kind?: string }> };

type CommonsSearch = { query?: { search?: Array<{ title?: string }> } };
type CommonsImages = { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ url?: string; thumburl?: string; descriptionurl?: string; mime?: string }> }> } };

type DDGResult = { AbstractText?: string; AbstractURL?: string; Heading?: string; RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Icon?: { URL?: string } } | { Topics?: Array<{ Text?: string; FirstURL?: string; Icon?: { URL?: string } }> }> };

function send(res: VercelResponse, status: number, body: unknown) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  res.status(status).json(body);
}

function pickLang(q: string) { return /[а-яё]/i.test(q) ? 'ru' : 'en'; }

function stripQuery(q: string) {
  return q
    .replace(/[@#]/g, ' ')
    .replace(/\b(бро|друг|плиз|пожалуйста|можешь|можно|нужно|надо|мне|скажи|ответь|глянь|посмотри|проверь|погода|прогноз|температура|биография|биографию|кто\s+такой|кто\s+такая|расскажи|покажи|найди|про|включи|поставь|воспроизведи|трек|песня|музыка|фото|картинки|изображения|видео|купить|заказать|цена|график|акции|курс|сегодня|завтра|послезавтра|на\s+сегодня|на\s+завтра|weather|forecast|biography|who\s+is|about|tell\s+me|show|find|play|song|music|images|video|buy|price|stock|chart|check|look)\b/gi, ' ')
    .replace(/\b(в|во|по|для)\s+(?=[а-яёa-z])/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function weatherLabel(code?: number) {
  if (code == null) return 'Погодный сигнал получен.';
  if ([0, 1].includes(code)) return 'ясно';
  if ([2, 3].includes(code)) return 'облачно';
  if ([45, 48].includes(code)) return 'туман';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'дождь';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'снег';
  if ([95, 96, 99].includes(code)) return 'гроза';
  return 'прогноз';
}

function creatorText(creator?: string | string[]) {
  return Array.isArray(creator) ? creator.filter(Boolean).join(', ') : creator || 'Internet';
}

function duration(ms?: number) {
  if (!ms) return undefined;
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function flattenTopics(topics: DDGResult['RelatedTopics'] = []) {
  return topics
    .flatMap((topic: any) => Array.isArray(topic?.Topics) ? topic.Topics : [topic])
    .filter((item: any) => Boolean(item?.Text));
}

async function weather(q: string) {
  const city = stripQuery(q) || 'Москва';
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
  const geo = await fetch(geoUrl).then((r) => r.json()) as GeoResult;
  const item = geo.results?.[0];
  if (!item) return { ok: false, error: 'city_not_found', city };
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${item.latitude}&longitude=${item.longitude}&current=temperature_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
  const forecast = await fetch(url).then((r) => r.json()) as ForecastResult;
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
    city: [item.name, item.admin1, item.country].filter(Boolean).slice(0, 2).join(', '),
    current: { temperature: forecast.current?.temperature_2m, wind: forecast.current?.wind_speed_10m, label: weatherLabel(forecast.current?.weather_code) },
    temp: forecast.current?.temperature_2m,
    wind: forecast.current?.wind_speed_10m,
    code: forecast.current?.weather_code,
    daily,
    source: 'Open-Meteo',
  };
}

async function wiki(q: string) {
  const lang = pickLang(q);
  const subject = stripQuery(q) || q;
  const searchUrl = `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(subject)}&format=json&origin=*`;
  const found = await fetch(searchUrl).then((r) => r.json()) as { query?: { search?: Array<{ title: string }> } };
  const title = found.query?.search?.[0]?.title || subject;
  const summaryUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await fetch(summaryUrl).then((r) => r.json()) as WikiSummary;
  const extract = data.extract || '';
  const facts = extract.split(/(?<=[.!?])\s+/).map((item) => item.trim()).filter(Boolean).slice(0, 4);
  return { ok: Boolean(extract), tool: 'wiki', title: data.title || title, summary: extract, image: data.originalimage?.source || data.thumbnail?.source || null, url: data.content_urls?.desktop?.page || '', facts, source: 'Wikipedia' };
}

async function commonsMedia(q: string, media: 'images' | 'video') {
  const subject = stripQuery(q) || q;
  const extra = media === 'video' ? ' filetype:video' : '';
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=${encodeURIComponent(subject + extra)}&srlimit=18&format=json&origin=*`;
  const found = await fetch(searchUrl).then((r) => r.json()) as CommonsSearch;
  const titles = (found.query?.search || []).map((x) => x.title).filter(Boolean).slice(0, 18) as string[];
  if (!titles.length) return { ok: false, items: [] };
  const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|mime&iiurlwidth=720&titles=${encodeURIComponent(titles.join('|'))}&format=json&origin=*`;
  const info = await fetch(infoUrl).then((r) => r.json()) as CommonsImages;
  const pages = Object.values(info.query?.pages || {});
  const items = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      const mime = info?.mime || '';
      const isVideo = mime.startsWith('video/');
      if (media === 'video' && !isVideo) return null;
      if (media === 'images' && isVideo) return null;
      return {
        title: (page.title || subject).replace(/^File:/, ''),
        image: info?.thumburl || info?.url || null,
        poster: info?.thumburl || null,
        url: info?.url || info?.descriptionurl || '',
        sourceTitle: 'Wikimedia Commons',
        kind: isVideo ? 'video' : 'image',
      };
    })
    .filter(Boolean);
  return { ok: items.length > 0, tool: media, title: subject, items, source: 'Wikimedia Commons' };
}

async function archiveMusic(subject: string) {
  const query = `title:(${subject}) OR creator:(${subject})`;
  const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}%20AND%20mediatype%3Aaudio&fl[]=identifier&fl[]=title&fl[]=creator&rows=6&page=1&output=json`;
  const found = await fetch(url).then((r) => r.json()) as ArchiveSearch;
  const docs = found.response?.docs || [];
  const items = [] as Array<{ title: string; subtitle: string; url: string; audioUrl: string | null; sourceTitle: string; duration?: string; kind: 'audio' }>;
  for (const doc of docs.slice(0, 4)) {
    if (!doc.identifier) continue;
    try {
      const meta = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`).then((r) => r.json()) as ArchiveMetadata;
      const file = (meta.files || []).find((f) => /mp3|ogg|flac|vbr/i.test(`${f.format || ''} ${f.name || ''}`) && !/itemimage|png|jpg|gif/i.test(f.name || ''));
      const audioUrl = file?.name ? `https://archive.org/download/${doc.identifier}/${encodeURIComponent(file.name).replace(/%2F/g, '/')}` : null;
      items.push({
        title: meta.metadata?.title || doc.title || subject,
        subtitle: creatorText(meta.metadata?.creator || doc.creator),
        url: `https://archive.org/details/${doc.identifier}`,
        audioUrl,
        sourceTitle: creatorText(meta.metadata?.creator || doc.creator),
        duration: file?.length,
        kind: 'audio',
      });
    } catch {
      items.push({ title: doc.title || subject, subtitle: creatorText(doc.creator), url: `https://archive.org/details/${doc.identifier}`, audioUrl: null, sourceTitle: creatorText(doc.creator), kind: 'audio' });
    }
  }
  return items;
}

async function itunesMusic(subject: string) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(subject)}&media=music&entity=song&limit=8`;
  const data = await fetch(url).then((r) => r.json()) as ITunesSearch;
  return (data.results || []).map((item) => ({
    title: [item.artistName, item.trackName].filter(Boolean).join(' — ') || subject,
    subtitle: item.collectionName || item.artistName || 'Apple Music preview',
    url: item.trackViewUrl || '',
    audioUrl: item.previewUrl || null,
    image: item.artworkUrl100?.replace('100x100bb', '600x600bb') || null,
    sourceTitle: item.artistName || 'Apple Music preview',
    duration: duration(item.trackTimeMillis),
    kind: 'audio' as const,
  }));
}

async function music(q: string) {
  const subject = stripQuery(q) || q;
  const [archive, itunes] = await Promise.allSettled([archiveMusic(subject), itunesMusic(subject)]);
  const archiveItems = archive.status === 'fulfilled' ? archive.value : [];
  const itunesItems = itunes.status === 'fulfilled' ? itunes.value : [];
  const full = archiveItems.filter((item) => item.audioUrl);
  const items = [...full, ...archiveItems.filter((item) => !item.audioUrl), ...itunesItems]
    .filter((item) => item.audioUrl || item.url)
    .slice(0, 12);
  return { ok: items.length > 0, tool: 'music', title: subject, items, source: 'Open music sources' };
}

async function duck(q: string, tool: string) {
  const subject = stripQuery(q) || q;
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(subject)}&format=json&no_redirect=1&no_html=1`;
  const data = await fetch(url).then((r) => r.json()) as DDGResult;
  const topics = flattenTopics(data.RelatedTopics || []);

  const items = topics.map((x: any) => ({
    title: x?.Text || subject,
    url: x?.FirstURL || data?.AbstractURL || '',
    image:
      x?.Icon?.URL
        ? x.Icon.URL.startsWith('http')
          ? x.Icon.URL
          : `https://duckduckgo.com${x.Icon.URL}`
        : '',
    sourceTitle: 'DuckDuckGo',
  }));

  if (data?.AbstractText) {
    items.unshift({
      title: data.AbstractText,
      url: data.AbstractURL || '',
      image: '',
      sourceTitle: 'DuckDuckGo',
    });
  }

  return {
    ok: items.length > 0 || Boolean(data.AbstractText),
    tool,
    title: data.Heading || subject,
    summary: data.AbstractText || '',
    url: data.AbstractURL || '',
    items: items.slice(0, 12),
    source: 'DuckDuckGo',
  };
}

async function finance(q: string) {
  const subject = stripQuery(q).toLowerCase() || q.toLowerCase();
  const symbol = subject.includes('tesla') || subject.includes('tsla') ? 'tsla.us' : subject.includes('apple') || subject.includes('aapl') ? 'aapl.us' : subject.includes('nvidia') || subject.includes('nvda') ? 'nvda.us' : subject.includes('bitcoin') || subject.includes('btc') ? 'btcusd' : 'tsla.us';
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  const csv = await fetch(url).then((r) => r.text());
  const rows = csv.trim().split('\n').slice(1).map((row) => row.split(','));
  const points = rows.slice(-30).map((row) => ({ label: row[0]?.slice(5) || '', value: Number(row[4] || 0) })).filter((p) => Number.isFinite(p.value) && p.value > 0);
  return { ok: points.length > 0, tool: 'finance', title: symbol.toUpperCase(), points, source: 'Stooq' };
}

async function aiReply(req: VercelRequest) {
  const body = typeof req.body === 'object' && req.body ? req.body as Record<string, unknown> : {};
  const query = String(body.query || req.query.q || '').slice(0, 1200);
  const locale = String(body.locale || 'ru');
  const system = String(body.system || (locale === 'ru' ? 'Ты Space. Отвечай живо, кратко и по делу.' : 'You are Space. Answer naturally and briefly.')).slice(0, 4000);
  const prompt = String(body.prompt || query).slice(0, 8000);
  if (!query.trim()) return { ok: false, error: 'empty_query' };

  const openAiKey = process.env.OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const baseUrl = process.env.SPACE_LLM_BASE_URL || (openRouterKey ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');
  const apiKey = process.env.SPACE_LLM_API_KEY || openAiKey || openRouterKey;
  const model = process.env.SPACE_LLM_MODEL || (openRouterKey ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

  if (!apiKey) return { ok: false, error: 'missing_llm_key' };

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...(openRouterKey ? { 'HTTP-Referer': 'https://margelet.space', 'X-Title': 'margeleT Space' } : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.78,
      max_tokens: 320,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { ok: false, error: `llm_http_${response.status}`, detail: text.slice(0, 500) };
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = String(data.choices?.[0]?.message?.content || '').trim();
  return { ok: Boolean(text), tool: 'ai', text, source: model };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tool = String(req.query.tool || 'wiki');
  const body = typeof req.body === 'object' && req.body ? req.body as Record<string, unknown> : {};
  const q = String(req.query.q || body.query || '').slice(0, 220);
  try {
    if (tool === 'ai') return send(res, 200, await aiReply(req));
    if (!q.trim()) return send(res, 400, { ok: false, error: 'empty_query' });
    if (tool === 'weather') return send(res, 200, await weather(q));
    if (tool === 'images') return send(res, 200, await commonsMedia(q, 'images'));
    if (tool === 'video') return send(res, 200, await commonsMedia(q, 'video'));
    if (tool === 'music') return send(res, 200, await music(q));
    if (tool === 'finance') return send(res, 200, await finance(q));
    if (tool === 'shopping' || tool === 'web' || tool === 'profile') return send(res, 200, await duck(q, tool));
    return send(res, 200, await wiki(q));
  } catch (error) {
    return send(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
