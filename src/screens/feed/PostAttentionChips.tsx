import { useEffect, useState, type MouseEvent } from "react";
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
};

const COPY: Record<Locale, AttentionCopy> = {
  ru: { contribution: "вклад в тему", mentions: "упоминаний", explore: "Исследовать", sources: "источников" },
  ua: { contribution: "внесок у тему", mentions: "згадок", explore: "Дослідити", sources: "джерел" },
  us: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources" },
  in: { contribution: "विषय योगदान", mentions: "उल्लेख", explore: "Explore", sources: "स्रोत" },
  ir: { contribution: "اثر در موضوع", mentions: "اشاره", explore: "بررسی", sources: "منبع" },
  tr: { contribution: "konu katkısı", mentions: "bahis", explore: "İncele", sources: "kaynak" },
  br: { contribution: "impacto no tema", mentions: "menções", explore: "Explorar", sources: "fontes" },
  kz: { contribution: "тақырып үлесі", mentions: "аталым", explore: "Зерттеу", sources: "дереккөз" },
  uz: { contribution: "mavzu hissasi", mentions: "eslatma", explore: "O‘rganish", sources: "manba" },
  ae: { contribution: "أثر في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر" },
  eg: { contribution: "تأثير في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر" },
  pk: { contribution: "موضوع میں حصہ", mentions: "ذکر", explore: "دیکھیں", sources: "ذرائع" },
  id: { contribution: "dampak topik", mentions: "sebutan", explore: "Jelajahi", sources: "sumber" },
  mx: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes" },
  sa: { contribution: "أثر في الموضوع", mentions: "ذكر", explore: "استكشاف", sources: "مصدر" },
  es: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes" },
  it: { contribution: "impatto sul tema", mentions: "menzioni", explore: "Esplora", sources: "fonti" },
  fr: { contribution: "impact du sujet", mentions: "mentions", explore: "Explorer", sources: "sources" },
  de: { contribution: "Themenbeitrag", mentions: "Erwähnungen", explore: "Erkunden", sources: "Quellen" },
  ar: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes" },
  co: { contribution: "impacto del tema", mentions: "menciones", explore: "Explorar", sources: "fuentes" },
  za: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources" },
  ng: { contribution: "topic impact", mentions: "mentions", explore: "Explore", sources: "sources" },
  cn: { contribution: "话题贡献", mentions: "次提及", explore: "探索", sources: "来源" },
  my: { contribution: "impak topik", mentions: "sebutan", explore: "Teroka", sources: "sumber" },
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

function PostSourceAvatar({ post }: { post: IngestedPost }) {
  const [failed, setFailed] = useState(false);
  const title = post.source?.title || "Telegram";
  const avatarUrl = failed
    ? ""
    : post.source?.avatar || getTelegramAvatarUrl(post.source?.handle);

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

function RealSourceDots({
  post,
  sources,
  count,
  copy,
}: {
  post: IngestedPost;
  sources: AttentionTrendSource[];
  count: number;
  copy: AttentionCopy;
}) {
  const cleanedSources = sources
    .filter((source) => String(source.title || source.username || "").trim())
    .slice(0, 6);

  const fallbackSources: AttentionTrendSource[] = cleanedSources.length
    ? cleanedSources
    : [
        {
          id: post.source?.handle || String(post.id),
          title: post.source?.title || "Telegram",
          username: post.source?.handle,
          avatarUrl: post.source?.avatar || undefined,
          mentions: 1,
        },
      ];

  const visibleSources = fallbackSources.slice(0, 6);
  const hiddenCount = Math.max(0, count - visibleSources.length);

  return (
    <div className="mt-2 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex -space-x-2">
          {visibleSources.map((source, index) => (
            <TrendSourceAvatar
              key={`${source.id || source.username || source.title || index}-${index}`}
              source={source}
            />
          ))}
          {hiddenCount > 0 ? (
            <div className="grid h-7 min-w-7 shrink-0 place-items-center rounded-full border border-[color:var(--bg-app)] bg-surface-soft px-1.5 text-[9px] font-black text-secondary">
              +{hiddenCount}
            </div>
          ) : null}
        </div>

        <span className="shrink-0 text-[11px] font-black text-secondary">
          {count} {copy.sources}
        </span>
      </div>
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

  const score = Math.max(fallbackScore, Number(matchedTrend?.mentions) || 0);
  const realSources = Array.isArray(matchedTrend?.topSources) ? matchedTrend.topSources : [];
  const sourceCount = Math.max(
    realSources.length,
    Number(matchedTrend?.sourceCount) || 0,
    Math.max(1, Math.min(9, Math.round(fallbackScore * 0.55) + (topics.length > 1 ? 1 : 0))),
  );
  const exploreTopic = getTrendTitle(matchedTrend) || primary?.topic || "";
  const trendRating = Math.abs(Number(matchedTrend?.momentum) || 0) || score;

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
        detail: { topic: exploreTopic, countryCode },
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
        <span className="shrink-0 text-secondary">+{sourceCount}</span>
      </button>

      {open ? (
        <div
          className="absolute bottom-full left-0 z-40 mb-2 w-[280px] max-w-[calc(100vw-32px)] rounded-[22px] border border-soft bg-surface p-3 shadow-soft"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-1.5 px-1 text-[12px] font-black text-primary">
            <span>🔥</span>
            <span>+{score} {copy.mentions}</span>
            <span className="text-emerald-500">↗</span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <RealSourceDots post={post} sources={realSources} count={sourceCount} copy={copy} />
            <button
              type="button"
              onClick={exploreTopicInTrends}
              className="grid h-11 min-w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 px-2 text-emerald-500 transition hover:bg-emerald-500/25"
              title={copy.explore}
            >
              <span className="text-lg font-black leading-none">↗</span>
              <span className="text-[10px] font-black leading-none">+{formatCompactNumber(trendRating)}</span>
            </button>
          </div>

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
