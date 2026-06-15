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

type ForecastResult = { current?: { temperature_2m?: number; wind_speed_10m?: number; weather_code?: number } };

function send(res: VercelResponse, status: number, body: unknown) {
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  res.status(status).json(body);
}

function pickLang(q: string) {
  return /[а-яё]/i.test(q) ? 'ru' : 'en';
}

function stripQuery(q: string) {
  return q
    .replace(/\b(погода|прогноз|температура|биография|биографию|кто\s+такой|кто\s+такая|расскажи|покажи|найди|про|weather|forecast|biography|who\s+is|about|tell\s+me)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function weatherLabel(code?: number) {
  if (code == null) return 'Погодный сигнал получен.';
  if ([0, 1].includes(code)) return 'Ясно или почти ясно.';
  if ([2, 3].includes(code)) return 'Облачно, местами прояснения.';
  if ([45, 48].includes(code)) return 'Туманно.';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return 'Есть вероятность дождя.';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Есть снег или мокрый снег.';
  if ([95, 96, 99].includes(code)) return 'Возможна гроза.';
  return 'Погодный сигнал получен.';
}

async function weather(q: string) {
  const city = stripQuery(q) || 'Москва';
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
  const geo = (await fetch(geoUrl).then((r) => r.json())) as GeoResult;
  const item = geo.results?.[0];
  if (!item) return { ok: false, error: 'city_not_found', city };
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${item.latitude}&longitude=${item.longitude}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`;
  const forecast = (await fetch(url).then((r) => r.json())) as ForecastResult;
  return {
    ok: true,
    tool: 'weather',
    city: [item.name, item.admin1, item.country].filter(Boolean).slice(0, 2).join(', '),
    temp: forecast.current?.temperature_2m,
    wind: forecast.current?.wind_speed_10m,
    code: forecast.current?.weather_code,
    summary: weatherLabel(forecast.current?.weather_code),
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
  const data = (await fetch(summaryUrl).then((r) => r.json())) as WikiSummary;
  const extract = data.extract || '';
  const facts = extract
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    ok: Boolean(extract),
    tool: 'wiki',
    title: data.title || title,
    summary: extract,
    image: data.originalimage?.source || data.thumbnail?.source || null,
    url: data.content_urls?.desktop?.page || '',
    facts,
    source: 'Wikipedia',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tool = String(req.query.tool || 'wiki');
  const q = String(req.query.q || '').slice(0, 180);
  if (!q.trim()) return send(res, 400, { ok: false, error: 'empty_query' });

  try {
    if (tool === 'weather') return send(res, 200, await weather(q));
    return send(res, 200, await wiki(q));
  } catch (error) {
    return send(res, 200, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
}
