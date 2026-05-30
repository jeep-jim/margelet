import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type TrendItem = {
  word: string;
  mentions: number;
  change: string;
  history: number[];
};

type TrendsData = TrendItem[];

async function getTrends(country: string, hours: number): Promise<TrendItem[]> {
  try {
    const trendsPath = path.join(process.cwd(), `data/trends/${country}/trends.json`);
    const data = await readFile(trendsPath, 'utf-8');
    const trends = JSON.parse(data) as TrendsData;
    
    // Фильтруем по часам и возвращаем
    return trends.slice(0, 20).map((t: TrendItem) => ({
      word: t.word,
      mentions: t.mentions,
      change: t.change,
      history: t.history.slice(-hours)
    }));
  } catch {
    return [];
  }
}

async function getSummary(country: string, hours: number): Promise<{ summary: string }> {
  // TODO: AI summary через OpenAI или локальную LLM
  return { summary: 'AI summary coming soon...' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, country = 'ru', hours = '24' } = req.query;

  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 час кэша
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    switch (action) {
      case 'trends': {
        const trends = await getTrends(String(country), Number(hours));
        return res.status(200).json({ ok: true, trends });
      }
      
      case 'summary': {
        const summary = await getSummary(String(country), Number(hours));
        return res.status(200).json({ ok: true, ...summary });
      }
      
      default:
        return res.status(400).json({ ok: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('v1 api error', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}