// src/lib/margelet/providers/googleTrendsProvider.js
// Real Google Trends provider for Margelet.
// Uses Google Trends Trending Now RSS as the primary public source.
// No paid API required.

const GOOGLE_TRENDS_RSS_BASE = "https://trends.google.com/trending/rss";
const DEFAULT_GEO = "US";

export async function fetchGoogleTrends(options = {}) {
  const {
    geo = DEFAULT_GEO,
    category = "",
    limit = 12,
    fetchImpl = globalThis.fetch,
  } = options;

  if (typeof fetchImpl !== "function") {
    return {
      ok: false,
      error: {
        code: "FETCH_UNAVAILABLE",
        message: "Fetch implementation is not available.",
      },
    };
  }

  const url = buildGoogleTrendsRssUrl({ geo, category });

  try {
    const response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: "GOOGLE_TRENDS_HTTP_ERROR",
          message: `Google Trends request failed with status ${response.status}.`,
          status: response.status,
        },
      };
    }

    const xml = await response.text();
    const parsed = parseGoogleTrendsRss(xml);
    const trends = parsed.items.slice(0, Math.max(1, limit));

    return {
      ok: true,
      provider: "google-trends-rss",
      sourceUrl: url,
      geo,
      category,
      updatedAt: parsed.updatedAt || null,
      trends,
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "GOOGLE_TRENDS_FETCH_FAILED",
        message: error?.message || "Failed to fetch Google Trends RSS.",
      },
    };
  }
}

function buildGoogleTrendsRssUrl({ geo, category }) {
  const url = new URL(GOOGLE_TRENDS_RSS_BASE);

  if (geo) {
    url.searchParams.set("geo", String(geo).toUpperCase());
  }

  if (category) {
    url.searchParams.set("cat", String(category));
  }

  return url.toString();
}

function parseGoogleTrendsRss(xml) {
  const items = [];
  const updatedAt = extractTagValue(xml, "lastBuildDate") || extractTagValue(xml, "pubDate") || null;

  const itemRegex = /<item\b[\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRegex) || [];

  for (let index = 0; index < matches.length; index += 1) {
    const raw = matches[index];
    const title = decodeXml(extractTagValue(raw, "title"));
    const pubDate = decodeXml(extractTagValue(raw, "pubDate"));
    const description = decodeXml(extractTagValue(raw, "description"));
    const link = decodeXml(extractTagValue(raw, "link"));

    if (!title) continue;

    items.push({
      id: `google_trend_${index + 1}`,
      title,
      query: title,
      description,
      link,
      source: "google-trends-rss",
      score: Math.max(1, 100 - index * 3),
      startedAt: pubDate || null,
      keywords: buildKeywords(title, description),
      sourceSignals: ["google-trends", "rss", "trending-now"],
    });
  }

  return {
    updatedAt,
    items,
  };
}

function extractTagValue(xml, tagName) {
  if (!xml || !tagName) return "";

  const direct = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const cdata = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`, "i");

  const cdataMatch = xml.match(cdata);
  if (cdataMatch?.[1]) return cdataMatch[1].trim();

  const directMatch = xml.match(direct);
  if (directMatch?.[1]) return directMatch[1].trim();

  return "";
}

function buildKeywords(title, description) {
  const text = `${safeText(title)} ${safeText(description)}`.toLowerCase();

  return Array.from(
    new Set(
      text
        .replace(/[^\p{L}\p{N}\s-]/gu, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2)
        .slice(0, 12)
    )
  );
}

function decodeXml(value) {
  return safeText(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}