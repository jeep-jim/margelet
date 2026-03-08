const REDDIT_URL = "https://www.reddit.com/r/popular.json?limit=12";
const HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";

const FALLBACK_TRENDS = [
  "AI tools for creators",
  "ChatGPT workflow",
  "content automation",
  "short-form video ideas",
  "viral hooks",
  "creator monetization",
  "productivity systems",
  "startup mistakes",
  "online business ideas",
  "faceless content",
];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s\-–—:]/gu, "")
    .trim();
}

function cleanTrend(value) {
  const text = normalizeText(value);
  if (!text) return "";
  if (text.length < 12) return "";
  if (text.length > 140) return text.slice(0, 140).trim();
  return text;
}

function dedupe(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchRedditTrends() {
  const data = await fetchJson(REDDIT_URL);
  const children = safeArray(data?.data?.children);

  return children
    .map((item) => cleanTrend(item?.data?.title))
    .filter(Boolean)
    .slice(0, 8);
}

async function fetchHackerNewsTrends() {
  const ids = safeArray(await fetchJson(HN_TOP_URL)).slice(0, 8);
  if (!ids.length) return [];

  const items = await Promise.all(
    ids.map((id) => fetchJson(`${HN_ITEM_URL}/${id}.json`))
  );

  return items
    .map((item) => cleanTrend(item?.title))
    .filter(Boolean)
    .slice(0, 6);
}

function scoreTrend(agentTopic, trend) {
  const topic = String(agentTopic || "").toLowerCase().trim();
  const value = String(trend || "").toLowerCase();

  let score = 0;

  if (!topic) return 1;

  const topicWords = topic.split(/\s+/).filter(Boolean);
  for (const word of topicWords) {
    if (word.length < 3) continue;
    if (value.includes(word)) score += 3;
  }

  if (
    value.includes("ai") ||
    value.includes("chatgpt") ||
    value.includes("creator") ||
    value.includes("video") ||
    value.includes("content")
  ) {
    score += 1;
  }

  return score;
}

function blendTopic(agentTopic, trend) {
  const base = normalizeText(agentTopic || "");
  const clean = cleanTrend(trend);

  if (!clean) return base || "Trending topic";

  if (!base) return clean;

  const lowerBase = base.toLowerCase();
  const lowerTrend = clean.toLowerCase();

  if (lowerTrend.includes(lowerBase)) return clean;
  if (lowerBase.includes(lowerTrend)) return base;

  return `${base} — ${clean}`;
}

export async function fetchTrendTopics() {
  const [reddit, hn] = await Promise.all([
    fetchRedditTrends(),
    fetchHackerNewsTrends(),
  ]);

  const merged = dedupe([...reddit, ...hn, ...FALLBACK_TRENDS]);

  return merged.slice(0, 20);
}

export async function pickTrendTopic(agentTopic, options = {}) {
  const enableTrends =
    typeof options.enableTrends === "boolean" ? options.enableTrends : true;

  if (!enableTrends) {
    return normalizeText(agentTopic || "");
  }

  const trends = await fetchTrendTopics();
  if (!trends.length) {
    return normalizeText(agentTopic || "");
  }

  const ranked = [...trends].sort(
    (a, b) => scoreTrend(agentTopic, b) - scoreTrend(agentTopic, a)
  );

  const best = ranked[0] || trends[0];
  return blendTopic(agentTopic, best);
}

export async function getTrendPack(agentTopic) {
  const trends = await fetchTrendTopics();

  const ranked = [...trends].sort(
    (a, b) => scoreTrend(agentTopic, b) - scoreTrend(agentTopic, a)
  );

  return {
    topic: normalizeText(agentTopic || ""),
    selected: blendTopic(agentTopic, ranked[0] || ""),
    trends: ranked.slice(0, 10),
  };
}