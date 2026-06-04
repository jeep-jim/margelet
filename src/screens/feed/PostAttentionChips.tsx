import { useEffect, useState } from "react";
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
  allMentions: string;
  sources: string;
};

const COPY: Record<Locale, AttentionCopy> = {
  ru: { contribution: "вклад в тему", mentions: "упоминаний", allMentions: "Все упоминания", sources: "источников" },
  ua: { contribution: "внесок у тему", mentions: "згадок", allMentions: "Усі згадки", sources: "джерел" },
  us: { contribution: "topic impact", mentions: "mentions", allMentions: "All mentions", sources: "sources" },
  in: { contribution: "विषय योगदान", mentions: "उल्लेख", allMentions: "सभी उल्लेख", sources: "स्रोत" },
  ir: { contribution: "اثر در موضوع", mentions: "اشاره", allMentions: "همه اشاره‌ها", sources: "منبع" },
  tr: { contribution: "konu katkısı", mentions: "bahis", allMentions: "Tüm bahsetmeler", sources: "kaynak" },
  br: { contribution: "impacto no tema", mentions: "menções", allMentions: "Todas as menções", sources: "fontes" },
  kz: { contribution: "тақырып үлесі", mentions: "аталым", allMentions: "Барлық аталымдар", sources: "дереккөз" },
  uz: { contribution: "mavzu hissasi", mentions: "eslatma", allMentions: "Barcha eslatmalar", sources: "manba" },
  ae: { contribution: "أثر في الموضوع", mentions: "ذكر", allMentions: "كل الإشارات", sources: "مصدر" },
  eg: { contribution: "تأثير في الموضوع", mentions: "ذكر", allMentions: "كل الإشارات", sources: "مصدر" },
  pk: { contribution: "موضوع میں حصہ", mentions: "ذکر", allMentions: "تمام ذکر", sources: "ذرائع" },
  id: { contribution: "dampak topik", mentions: "sebutan", allMentions: "Semua sebutan", sources: "sumber" },
  mx: { contribution: "impacto del tema", mentions: "menciones", allMentions: "Todas las menciones", sources: "fuentes" },
  sa: { contribution: "أثر في الموضوع", mentions: "ذكر", allMentions: "كل الإشارات", sources: "مصدر" },
  es: { contribution: "impacto del tema", mentions: "menciones", allMentions: "Todas las menciones", sources: "fuentes" },
  it: { contribution: "impatto sul tema", mentions: "menzioni", allMentions: "Tutte le menzioni", sources: "fonti" },
  fr: { contribution: "impact du sujet", mentions: "mentions", allMentions: "Toutes les mentions", sources: "sources" },
  de: { contribution: "Themenbeitrag", mentions: "Erwähnungen", allMentions: "Alle Erwähnungen", sources: "Quellen" },
  ar: { contribution: "impacto del tema", mentions: "menciones", allMentions: "Todas las menciones", sources: "fuentes" },
  co: { contribution: "impacto del tema", mentions: "menciones", allMentions: "Todas las menciones", sources: "fuentes" },
  za: { contribution: "topic impact", mentions: "mentions", allMentions: "All mentions", sources: "sources" },
  ng: { contribution: "topic impact", mentions: "mentions", allMentions: "All mentions", sources: "sources" },
  cn: { contribution: "话题贡献", mentions: "次提及", allMentions: "所有提及", sources: "来源" },
  my: { contribution: "impak topik", mentions: "sebutan", allMentions: "Semua sebutan", sources: "sumber" },
};

type AttentionTrendSource = {
  id?: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
  mentions?: number;
};

type AttentionTrendPost = {
  id?: string | number;
  text?: string;
  sourceTitle?: string;
  sourceUsername?: string;
  sourceAvatarUrl?: string;
};

type AttentionTrend = {
  topic?: string;
  word?: string;
  mentions?: number;
  sourceCount?: number;
  topSources?: AttentionTrendSource[];
  examples?: AttentionTrendPost[];
  signals?: string[];
};

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

const TREND_CACHE: Record<string, Promise<AttentionTrend[]>> = Object.create(null);

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

function getSignalWords(value: string) {
  return normalizeSignal(value)
    .split(/\s+/)
    .filter((word) => word.length > 2);
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

function getTrendTitle(trend: AttentionTrend) {
  return String(trend.topic || trend.word || "").trim();
}

function getTrendSearchText(trend: AttentionTrend) {
  const examples = Array.isArray(trend.examples) ? trend.examples : [];
  const signals = Array.isArray(trend.signals) ? trend.signals : [];
  return [
    getTrendTitle(trend),
    ...signals,
    ...examples.slice(0, 4).map((example) => example.text || ""),
  ].join(" ");
}

function tokenOverlapScore(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  let hits = 0;
  for (const word of left) {
    if (right.has(word)) hits += 1;
  }
  return hits / Math.max(1, Math.min(left.size, right.size));
}

function findMatchingTrend(trends: AttentionTrend[], post: IngestedPost, primary?: AttentionTopic) {
  const postText = [primary?.topic, post.text, post.tag].filter(Boolean).join(" ");
  const postWords = getSignalWords(postText);
  if (postWords.length < 2) return null;

  let best: AttentionTrend | null = null;
  let bestScore = 0;

  for (const trend of trends) {
    const title = getTrendTitle(trend);
    if (!title) continue;

    const trendWords = getSignalWords(getTrendSearchText(trend));
    const score = tokenOverlapScore(postWords, trendWords);

    if (score > bestScore) {
      best = trend;
      bestScore = score;
    }
  }

  return best && bestScore >= 0.28 ? best : null;
}

function fetchTrends(countryCode: string) {
  const country = String(countryCode || "ru").toLowerCase();

  if (!TREND_CACHE[country]) {
    TREND_CACHE[country] = fetch(`/api/v1?action=trends&country=${country}`)
      .then((res) => res.json())
      .then((data) => (Array.isArray(data?.trends) ? data.trends : []))
      .catch(() => []);
  }

  return TREND_CACHE[country];
}

function TrendSourceAvatar({ source }: { source: AttentionTrendSource }) {
  const [failed, setFailed] = useState(false);
  const title = String(source.title || source.username || "Telegram").trim();
  const avatarUrl = failed
    ? ""
    : String(source.avatarUrl || getTelegramAvatarUrl(source.username)).trim();

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

function TrendSourcesLine({
  sources,
  sourceCount,
  copy,
}: {
  sources: AttentionTrendSource[];
  sourceCount: number;
  copy: AttentionCopy;
}) {
  const visibleSources = sources.slice(0, 6);
  const hiddenCount = Math.max(0, sourceCount - visibleSources.length);

  if (!visibleSources.length && sourceCount <= 0) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
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

      <div className="min-w-0 text-[11px] font-black text-secondary">
        {hiddenCount > 0 ? `+${hiddenCount} ` : ""}
        {sourceCount} {copy.sources}
      </div>
    </div>
  );
}

function openTrendTopic(topic: string) {
  window.dispatchEvent(
    new CustomEvent("margelet:open-attention-topic", {
      detail: { topic },
    }),
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
  const score = primary?.score || (post.media?.length ? 8 : 5);
  const countryCode = String(post.sourceCountryCode || locale || "ru").toLowerCase();

  useEffect(() => {
    let cancelled = false;

    fetchTrends(countryCode).then((items) => {
      if (cancelled) return;
      setMatchedTrend(findMatchingTrend(items, post, primary));
    });

    return () => {
      cancelled = true;
    };
  }, [countryCode, post, primary?.topic]);

  const trendTopic = matchedTrend ? getTrendTitle(matchedTrend) : "";
  const trendMentions = matchedTrend?.mentions || 0;
  const trendSources = Array.isArray(matchedTrend?.topSources)
    ? matchedTrend.topSources.filter((source) => String(source.title || source.username || "").trim())
    : [];
  const realSourceCount = matchedTrend
    ? Math.max(
        Number(matchedTrend.sourceCount) || 0,
        trendSources.length,
      )
    : 0;
  const hasRealTrend = !!matchedTrend && !!trendTopic && trendMentions > 0 && realSourceCount > 1;
  const displayScore = hasRealTrend ? Math.max(score, trendMentions) : score;

  const handleOpenTopic = () => {
    if (!hasRealTrend || !trendTopic) return;
    setOpen(false);
    openTrendTopic(trendTopic);
  };

  useEffect(() => {
    if (!open) return;

    const close = () => setOpen(false);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    window.addEventListener("margelet:pause-feed-videos", close);
    window.addEventListener("margelet:open-attention-topic", close);
    window.addEventListener("margelet:close-attention-popups", close);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("margelet:pause-feed-videos", close);
      window.removeEventListener("margelet:open-attention-topic", close);
      window.removeEventListener("margelet:close-attention-popups", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={["relative inline-flex max-w-full", open ? "z-[9999]" : "z-0"].join(" ")}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (hasRealTrend) {
            setOpen((prev) => {
              const next = !prev;
              if (next) {
                window.dispatchEvent(new Event("margelet:close-attention-popups"));
              }
              return next;
            });
          }
        }}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[12px] font-semibold text-primary transition hover:bg-app"
      >
        <span className="text-emerald-500">↗</span>
        <span className="shrink-0">{copy.contribution}</span>
        <span className="shrink-0 text-emerald-500">+{displayScore}</span>
        {hasRealTrend ? (
          <span className="shrink-0 text-secondary">+{realSourceCount}</span>
        ) : null}
      </button>

      {open && hasRealTrend ? (
        <div
          className="absolute left-0 top-full z-[9999] mt-2 w-[290px] max-w-[calc(100vw-32px)] rounded-[22px] border border-soft bg-surface p-3 shadow-soft"
          style={{
            isolation: "isolate",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleOpenTopic}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-emerald-500/15 px-3 py-2 text-left text-emerald-400 transition hover:bg-emerald-500/20"
          >
            <span className="min-w-0 truncate text-[12px] font-black text-primary">
              🔥 {copy.allMentions}
            </span>
            <span className="inline-flex shrink-0 items-center gap-2 text-[12px] font-black">
              +{displayScore}
              <TrendingUp className="h-4 w-4" />
            </span>
          </button>

          <TrendSourcesLine
            sources={trendSources}
            sourceCount={realSourceCount}
            copy={copy}
          />

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
