import { useState } from "react";
import type { IngestedPost, Locale } from "../../types/app";

type AttentionTopic = {
  topic: string;
  score: number;
  kind?: "search" | "auto";
};

type AttentionCopy = {
  contribution: string;
  mentions: string;
};

const COPY: Record<Locale, AttentionCopy> = {
  ru: { contribution: "вклад в тему", mentions: "упоминаний" },
  ua: { contribution: "внесок у тему", mentions: "згадок" },
  us: { contribution: "topic impact", mentions: "mentions" },
  in: { contribution: "विषय योगदान", mentions: "उल्लेख" },
  ir: { contribution: "اثر در موضوع", mentions: "اشاره" },
  tr: { contribution: "konu katkısı", mentions: "bahis" },
  br: { contribution: "impacto no tema", mentions: "menções" },
  kz: { contribution: "тақырып үлесі", mentions: "аталым" },
  uz: { contribution: "mavzu hissasi", mentions: "eslatma" },
  ae: { contribution: "أثر في الموضوع", mentions: "ذكر" },
  eg: { contribution: "تأثير في الموضوع", mentions: "ذكر" },
  pk: { contribution: "موضوع میں حصہ", mentions: "ذکر" },
  id: { contribution: "dampak topik", mentions: "sebutan" },
  mx: { contribution: "impacto del tema", mentions: "menciones" },
  sa: { contribution: "أثر في الموضوع", mentions: "ذكر" },
  es: { contribution: "impacto del tema", mentions: "menciones" },
  it: { contribution: "impatto sul tema", mentions: "menzioni" },
  fr: { contribution: "impact du sujet", mentions: "mentions" },
  de: { contribution: "Themenbeitrag", mentions: "Erwähnungen" },
  ar: { contribution: "impacto del tema", mentions: "menciones" },
  co: { contribution: "impacto del tema", mentions: "menciones" },
  za: { contribution: "topic impact", mentions: "mentions" },
  ng: { contribution: "topic impact", mentions: "mentions" },
  cn: { contribution: "话题贡献", mentions: "次提及" },
  my: { contribution: "impak topik", mentions: "sebutan" },
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
  const copy = COPY[locale] || COPY.us;
  const topics = getAttentionTopics(post, searchQuery);
  const primary = topics[0];
  const score = primary?.score || (post.media?.length ? 8 : 5);
  const sourceCount = Math.max(1, Math.min(9, Math.round(score * 0.55) + (topics.length > 1 ? 1 : 0)));

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

          <div className="mt-2 flex items-center gap-2">
            <PostSourceAvatar post={post} />
            <div className="min-w-0 text-[11px] font-black text-secondary">
              {post.source?.title || "Telegram"}
            </div>
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
