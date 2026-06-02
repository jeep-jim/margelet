import { useEffect, useState, type MouseEvent } from "react";
import { TrendingUp } from "lucide-react";
import type { IngestedPost, Locale } from "../../types/app";

type AttentionTopic = {
  topic: string;
  score: number;
  kind?: "search" | "auto";
};

type AttentionCopy = {
  contribution: string;
  mentions: string;
  explore: string;
  sources: string;
  allMentions: string;
};

const COPY: Record<Locale, AttentionCopy> = {
  ru: { contribution: "вклад в тему", mentions: "упоминаний", explore: "Исследовать", sources: "источников", allMentions: "Все упоминания" },
  ua: { contribution: "внесок у тему", mentions: "згадок", explore: "Дослідити", sources: "джерел", allMentions: "Усі згадки" },
  us: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources", allMentions: "All mentions" },
  in: { contribution: "विषय योगदान", mentions: "उल्लेख", explore: "Explore", sources: "स्रोत", allMentions: "All mentions" },
  ir: { contribution: "اثر در موضوع", mentions: "اشاره", explore: "بررسی", sources: "منبع", allMentions: "All mentions" },
  tr: { contribution: "konu katkısı", mentions: "bahis", explore: "İncele", sources: "kaynak", allMentions: "All mentions" },
  br: { contribution: "impacto no tema", mentions: "menções", explore: "Explorar", sources: "fontes", allMentions: "All mentions" },
  kz: { contribution: "тақырып үлесі", mentions: "аталым", explore: "Зерттеу", sources: "дереккөз", allMentions: "All mentions" },
  uz: { contribution: "mavzu hissasi", mentions: "eslatma", explore: "O‘rganish", sources: "manba", allMentions: "All mentions" },
  ae: { contribution: "أثر في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر", allMentions: "All mentions" },
  eg: { contribution: "تأثير في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر", allMentions: "All mentions" },
  pk: { contribution: "موضوع میں حصہ", mentions: "ذکر", explore: "دیکھیں", sources: "ذرائع", allMentions: "All mentions" },
  id: { contribution: "dampak topik", mentions: "sebutan", explore: "Jelajahi", sources: "sumber", allMentions: "All mentions" },
  mx: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes", allMentions: "All mentions" },
  sa: { contribution: "أثر في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر", allMentions: "All mentions" },
  es: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes", allMentions: "All mentions" },
  it: { contribution: "impatto sul tema", mentions: "menzioni", explore: "Esplora", sources: "fonti", allMentions: "All mentions" },
  fr: { contribution: "impact du sujet", mentions: "mentions", explore: "Explorer", sources: "sources", allMentions: "All mentions" },
  de: { contribution: "Themenbeitrag", mentions: "Erwähnungen", explore: "Erkunden", sources: "Quellen", allMentions: "All mentions" },
  ar: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes", allMentions: "All mentions" },
  co: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes", allMentions: "All mentions" },
  za: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources", allMentions: "All mentions" },
  ng: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources", allMentions: "All mentions" },
  cn: { contribution: "话题贡献", mentions: "次提及", explore: "探索", sources: "来源", allMentions: "全部提及" },
  my: { contribution: "impak topik", mentions: "sebutan", explore: "Teroka", sources: "sumber", allMentions: "All mentions" },
};

type AttentionTrendSource = {
  id?: string;
  title: string;
  username?: string;
  avatarUrl?: string;
  mentions?: number;
};

type AttentionTrend = {
  topic?: string;
  word?: string;
  mentions?: number;
  momentum?: number;
  sourceCount?: number;
  topSources?: AttentionTrendSource[];
  examples?: Array<{ text?: string; sourceTitle?: string; sourceUsername?: string; sourceAvatarUrl?: string }>;
  signals?: string[];
};

const PENDING_ATTENTION_TOPIC_KEY = "margelet_pending_attention_topic_v1";
const OPEN_ATTENTION_TOPIC_EVENT = "margelet:open-attention-topic";

const SIGNAL_STOP = new Set([
  "это","что","как","если","или","его","её","ее","она","они","оно","уже","ещё","еще",
  "который","которая","которые","которых","которое","чтобы","только","можно","нужно",
  "есть","нет","одно","одна","один","одни","самых","самый","самая","самое",
  "будет","будут","были","было","быть","сейчас","сегодня","завтра","этого","этой",
  "этот","эти","все","всё","как-то","после","перед","между","через","каждый",
  "наш","наша","наше","наши","канал","канале","канала","подписаться","подписывайтесь",
  "реклама","ссылка","дорогие","подписчики","гости","волне","исправленного","привет","друзья",
  "the","and","for","with","this","that","from","are","was","were","you","your",
]);

function stripNoise(value: string) {
  return String(value || "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\b(?:t\.me|max\.ru)\/\S+/g, " ")
    .replace(/[@#][\wа-яё_.-]+/gi, " ")
    .replace(/[|•]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSignal(value: string) {
  return stripNoise(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !SIGNAL_STOP.has(word) && !/^\d+$/.test(word))
    .join(" ")
    .trim();
}

function getUsefulLines(post: IngestedPost) {
  return String(post.text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(stripNoise)
    .filter(Boolean)
    .filter((line) => !/(подписывай|подписаться|наш канал|ссылка в шапке|реклама|max\.ru|дорогие подписчики|привет,? друзья|уважаемые подписчики)/i.test(line))
    .slice(0, 3);
}

function buildSearchTopic(searchQuery: string | undefined, haystack: string): AttentionTopic | null {
  const topic = normalizeSignal(searchQuery || "");
  if (topic.length < 2) return null;

  const parts = topic.split(/\s+/).filter((part) => part.length > 2);
  if (!parts.length) return null;
  if (!parts.every((part) => haystack.includes(part))) return null;

  return {
    topic,
    score: Math.min(20, 10 + parts.length * 2),
    kind: "search",
  };
}

function buildAutoTopic(post: IngestedPost): AttentionTopic | null {
  const lines = getUsefulLines(post);
  const snippet = lines[0] || lines.join(" ");
  const display = stripNoise(snippet);
  const signals = normalizeSignal(lines.join(" "));
  const words = signals.split(/\s+/).filter(Boolean);

  if (!display || words.length < 2) return null;

  const titleWords = display.split(/\s+/).filter(Boolean).slice(0, 12);
  const title = titleWords.join(" ");
  const mediaBoost = post.media?.length ? 2 : 0;
  const sourceBoost = post.source?.verified ? 2 : 0;

  return {
    topic: title,
    score: Math.max(6, Math.min(16, 8 + mediaBoost + sourceBoost)),
    kind: "auto",
  };
}

function getAttentionTopics(post: IngestedPost, searchQuery?: string): AttentionTopic[] {
  const haystack = normalizeSignal([
    post.text,
    post.tag,
  ].filter(Boolean).join(" "));

  const topics: AttentionTopic[] = [];
  const searchTopic = buildSearchTopic(searchQuery, haystack);
  if (searchTopic) topics.push(searchTopic);

  const autoTopic = buildAutoTopic(post);
  if (autoTopic && !topics.some((item) => item.topic === autoTopic.topic)) {
    topics.push(autoTopic);
  }

  return topics.slice(0, 2);
}

function compactTopic(topic: string) {
  const clean = topic.replace(/\s+/g, " ").trim();
  if (clean.length <= 92) return clean;
  return `${clean.slice(0, 89).trim()}…`;
}


function getTelegramAvatarUrl(handle?: string | null) {
  const clean = String(handle || "").replace(/^@+/, "").trim();
  return clean ? `https://t.me/i/userpic/320/${clean}.jpg` : "";
}

function getTrendTitle(trend: AttentionTrend | null | undefined) {
  return String(trend?.topic || trend?.word || "").trim();
}

function getCountryCode(post: IngestedPost, locale: Locale) {
  return String(post.sourceCountryCode || locale || "ru").trim().toLowerCase();
}

function getTrendSearchText(trend: AttentionTrend) {
  return [
    trend.topic,
    trend.word,
    ...(trend.signals || []),
    ...(trend.examples || []).map((example) => example.text || ""),
  ]
    .filter(Boolean)
    .join(" ");
}

function getTopicTokens(value: string) {
  return normalizeSignal(value)
    .split(/\s+/)
    .filter((item) => item.length > 2);
}

function getOverlapScore(a: string, b: string) {
  const left = new Set(getTopicTokens(a));
  const right = new Set(getTopicTokens(b));
  if (!left.size || !right.size) return 0;

  let hits = 0;
  for (const token of left) {
    if (right.has(token)) hits += 1;
  }

  return hits / Math.max(1, Math.min(left.size, right.size));
}

function findMatchingTrend(trends: AttentionTrend[], topic: string) {
  let best: AttentionTrend | null = null;
  let bestScore = 0;

  for (const trend of trends) {
    const trendText = getTrendSearchText(trend);
    const score = Math.max(
      getOverlapScore(topic, getTrendTitle(trend)),
      getOverlapScore(topic, trendText),
    );

    if (score > bestScore) {
      best = trend;
      bestScore = score;
    }
  }

  return bestScore >= 0.32 ? best : null;
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}

function TrendSourceAvatar({ source }: { source: AttentionTrendSource }) {
  const [failed, setFailed] = useState(false);
  const title = String(source.title || source.username || "Telegram").trim();
  const avatarUrl = failed ? "" : String(source.avatarUrl || getTelegramAvatarUrl(source.username)).trim();

  return (
    <div
      className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--bg-app)] bg-surface-soft text-[10px] font-black text-primary"
      title={title}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        title.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function getTrendSources(trend: AttentionTrend | null | undefined) {
  const map = new Map<string, AttentionTrendSource>();

  for (const source of trend?.topSources || []) {
    const title = String(source.title || source.username || "").trim();
    if (!title) continue;
    const key = String(source.id || source.username || title).toLowerCase();
    map.set(key, source);
  }

  for (const example of trend?.examples || []) {
    const title = String(example.sourceTitle || example.sourceUsername || "").trim();
    if (!title) continue;
    const key = String(example.sourceUsername || title).toLowerCase();
    if (map.has(key)) continue;

    map.set(key, {
      id: example.sourceUsername || title,
      title,
      username: example.sourceUsername,
      avatarUrl: example.sourceAvatarUrl,
      mentions: 1,
    });
  }

  return [...map.values()];
}

function RealSourceDots({
  sources,
  count,
  copy,
}: {
  sources: AttentionTrendSource[];
  count: number;
  copy: AttentionCopy;
}) {
  const visibleSources = sources
    .filter((source) => String(source.title || source.username || "").trim())
    .slice(0, 6);

  if (!visibleSources.length && count <= 0) return null;

  const totalCount = Math.max(count, visibleSources.length);
  const hiddenCount = Math.max(0, totalCount - visibleSources.length);
  const sourceLabel = hiddenCount > 0
    ? `+${hiddenCount} ${copy.sources}`
    : `${totalCount} ${copy.sources}`;

  return (
    <div className="mt-3 flex min-w-0 items-center gap-2">
      {visibleSources.length ? (
        <div className="flex -space-x-2">
          {visibleSources.map((source, index) => (
            <TrendSourceAvatar
              key={`${source.id || source.username || source.title || index}-${index}`}
              source={source}
            />
          ))}
        </div>
      ) : null}

      <span className="shrink-0 text-[11px] font-black text-secondary">
        {sourceLabel}
      </span>
    </div>
  );
}

export function PostAttentionChips({
  post,
  searchQuery = "",
  locale = "us",
}: {
  post: IngestedPost;
  searchQuery?: string;
  locale?: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [matchedTrend, setMatchedTrend] = useState<AttentionTrend | null>(null);
  const copy = COPY[locale] || COPY.us;
  const topics = getAttentionTopics(post, searchQuery);
  const primary = topics[0];
  const fallbackScore = primary?.score || (post.media?.length ? 8 : 5);
  const countryCode = getCountryCode(post, locale);

  useEffect(() => {
    if (!open || !primary) return;

    let cancelled = false;

    setMatchedTrend(null);

    async function fetchTrendMatch() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        const trends = Array.isArray(data?.trends) ? (data.trends as AttentionTrend[]) : [];
        const next = findMatchingTrend(trends, primary.topic);

        if (!cancelled) setMatchedTrend(next);
      } catch {
        if (!cancelled) setMatchedTrend(null);
      }
    }

    fetchTrendMatch();

    return () => {
      cancelled = true;
    };
  }, [open, primary?.topic, countryCode]);

  const matchedMentions = Number(matchedTrend?.mentions) || 0;
  const score = Math.max(fallbackScore, matchedMentions);
  const realSources = getTrendSources(matchedTrend);
  const sourceCount = matchedTrend
    ? Math.max(realSources.length, Number(matchedTrend.sourceCount) || 0)
    : 0;
  const hasMatchedTopic = Boolean(matchedTrend && sourceCount > 0 && matchedMentions > 0);
  const exploreTopic = hasMatchedTopic ? getTrendTitle(matchedTrend) : "";

  function exploreTopicInTrends(event: MouseEvent) {
    event.stopPropagation();
    if (!exploreTopic) return;

    try {
      localStorage.setItem(PENDING_ATTENTION_TOPIC_KEY, exploreTopic);
    } catch {
      // ignore localStorage errors
    }

    window.dispatchEvent(
      new CustomEvent(OPEN_ATTENTION_TOPIC_EVENT, {
        detail: {
          topic: exploreTopic,
          fallbackTopic: primary?.topic || "",
          countryCode,
        },
      }),
    );
    setOpen(false);
  }

  return (
    <div className="relative inline-flex max-w-full">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-app"
      >
        <span className="text-emerald-500">↗</span>
        <span className="shrink-0">{copy.contribution}</span>
        <span className="shrink-0 text-emerald-500">+{score}</span>
        {sourceCount > 0 ? (
          <span className="shrink-0 text-secondary">+{sourceCount}</span>
        ) : null}
      </button>

      {open && hasMatchedTopic ? (
        <div
          className="absolute bottom-full left-0 z-40 mb-2 w-[280px] max-w-[calc(100vw-32px)] rounded-[22px] border border-soft bg-surface p-3 shadow-soft"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={exploreTopicInTrends}
            className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-emerald-500/20 px-3 py-2.5 text-left text-emerald-400 transition hover:bg-emerald-500/30"
            title={copy.explore}
          >
            <span className="flex min-w-0 items-center gap-1.5 text-[13px] font-black text-primary">
              <span>🔥</span>
              <span className="truncate">{copy.allMentions}</span>
            </span>

            <span className="flex shrink-0 items-center gap-2 text-[14px] font-black">
              <span>+{formatCompactNumber(matchedMentions)}</span>
              <TrendingUp className="h-5 w-5" strokeWidth={3} />
            </span>
          </button>

          <RealSourceDots sources={realSources} count={sourceCount} copy={copy} />

          {primary ? (
            <div className="mt-2 rounded-2xl bg-surface-soft px-3 py-2 text-[12px] font-semibold leading-relaxed text-primary">
              {compactTopic(primary.topic)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
