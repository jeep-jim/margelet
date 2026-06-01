import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFile } from "node:fs/promises";
import path from "node:path";

type TrendSource = {
  id?: string;
  title: string;
  username?: string;
  avatarUrl?: string;
  mentions: number;
};

type TrendCountry = {
  code: string;
  mentions: number;
};

type TrendPost = {
  id: string | number;
  text: string;
  url?: string;
  publishedAt?: string;
  sourceTitle?: string;
};

type TrendItem = {
  topic?: string;
  word?: string;
  mentions: number;
  momentum?: number;
  change: string;
  sourceCount?: number;
  countries?: TrendCountry[];
  topSources?: TrendSource[];
  history?: number[];
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
  examples?: TrendPost[];
  signals?: string[];
  category?: string;
};

async function getTrends(country: string, hours: number): Promise<TrendItem[]> {
  try {
    const safeCountry = String(country || "ru").trim().toLowerCase();
    const trendsPath = path.join(process.cwd(), `data/trends/${safeCountry}/trends.json`);
    const data = await readFile(trendsPath, "utf-8");
    const trends = JSON.parse(data) as TrendItem[];

    if (!Array.isArray(trends)) return [];

    return trends.slice(0, 150).map((trend) => ({
      ...trend,
      topic: trend.topic || trend.word,
      word: trend.word || trend.topic,
      history: Array.isArray(trend.history)
        ? trend.history.slice(-Math.max(1, Number(hours) || 24))
        : [],
      topSources: Array.isArray(trend.topSources) ? trend.topSources : [],
      sourceCount:
        typeof trend.sourceCount === "number"
          ? trend.sourceCount
          : Array.isArray(trend.topSources)
            ? trend.topSources.length
            : 0,
      countries: Array.isArray(trend.countries) ? trend.countries : [],
      examples: Array.isArray(trend.examples) ? trend.examples : [],
      signals: Array.isArray(trend.signals) ? trend.signals : [],
      category: trend.category || "all",
    }));
  } catch {
    return [];
  }
}

async function getSummary(country: string, hours: number): Promise<{ summary: string }> {
  return { summary: "AI summary coming soon..." };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action, country = "ru", hours = "24" } = req.query;

  res.setHeader("Cache-Control", "public, max-age=300");
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    switch (action) {
      case "trends": {
        const trends = await getTrends(String(country), Number(hours));
        return res.status(200).json({ ok: true, trends });
      }

      case "summary": {
        const summary = await getSummary(String(country), Number(hours));
        return res.status(200).json({ ok: true, ...summary });
      }

      default:
        return res.status(400).json({ ok: false, error: "Unknown action" });
    }
  } catch (error) {
    console.error("v1 api error", error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
