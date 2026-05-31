import { useState } from "react";
import type { IngestedPost } from "../../types/app";

type AttentionTopic = {
  topic: string;
  score: number;
  kind?: "search" | "auto";
};

const STOP = new Set([
  "это","что","как","для","если","или","его","её","ее","она","они","оно","уже","ещё","еще",
  "который","которая","которые","которых","которое","чтобы","только","можно","нужно",
  "есть","нет","при","про","без","над","под","одно","одна","один","одни","самых","самый",
  "самая","самое","некоторые","некоторых","будет","будут","были","было","быть",
  "сейчас","сегодня","завтра","этого","этой","этот","эти","все","всё","как-то","после",
  "перед","между","через","каждый","каждая","каждое","пользователь","пользователи",
  "смогли","смогла","смог","составил","составила","составили","список","наиболее",
  "обязательно","посмотреть","ответает","обход","многие","разные","новые","новый",
  "the","and","for","with","this","that","from","are","was","were","you","your",
]);

const TOPIC_HINTS = [
  "инди игры","инди-игры","indie games","steam","playstation","xbox","nintendo",
  "openai","chatgpt","gpt","gemini","claude","ai","искусственный интеллект",
  "tesla","bitcoin","биткоин","ethereum","ton","крипта","акции","сбербанк",
  "история игрушек","toy story","муравьи","муравей","жуки","насекомые",
];

function cleanText(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\wа-яё_-]+/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTopic(value: string) {
  return cleanText(value)
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP.has(word))
    .join(" ")
    .trim();
}

function formatTopic(value: string) {
  return normalizeTopic(value).replace(/\s+/g, " ").trim();
}

function containsQuery(haystack: string, query: string) {
  const normalizedQuery = normalizeTopic(query);
  if (normalizedQuery.length < 2) return false;

  if (haystack.includes(normalizedQuery)) return true;

  const parts = normalizedQuery
    .split(/\s+/)
    .filter((part) => part.length > 2 && !STOP.has(part));

  if (!parts.length) return false;
  return parts.every((part) => haystack.includes(part));
}

function scoreCandidate(candidate: string, index: number, haystack: string) {
  const topic = normalizeTopic(candidate);
  const words = topic.split(/\s+/).filter(Boolean);
  if (!words.length) return -1000;
  if (words.some((word) => STOP.has(word))) return -1000;

  let score = Math.max(0, 60 - index);

  // Фразы обычно лучше одиночных слов, но не даём случайным длинным кускам побеждать.
  if (words.length === 1) score += 4;
  if (words.length === 2) score += 28;
  if (words.length === 3) score += 18;
  if (words.length > 3) score -= 20;

  for (const word of words) {
    if (word.length >= 5) score += 4;
    if (word.length >= 8) score += 3;
    if (/[a-z]/i.test(word)) score += 5;
    if (/\d/.test(word)) score += 2;
    if (word.includes("-")) score += 4;
  }

  // Частотность в самом посте.
  const occurrences = haystack.split(topic).length - 1;
  score += occurrences * 12;

  // Готовые подсказки под нормальные рыночные/поисковые темы.
  for (const hint of TOPIC_HINTS) {
    const normalizedHint = normalizeTopic(hint);
    if (!normalizedHint) continue;
    if (topic.includes(normalizedHint) || normalizedHint.includes(topic)) {
      score += 45;
    }
  }

  // Штрафуем фразы-глаголы/мусорные связки, которые выглядят как кусок предложения.
  const badParts = [
    "составил", "составила", "составили", "пользователь", "смогли", "обязательно",
    "посмотреть", "которые", "который", "таких", "этими", "ответает", "обход",
  ];
  if (badParts.some((part) => topic.includes(part))) score -= 80;

  return score;
}

function buildSearchTopic(searchQuery: string | undefined, haystack: string): AttentionTopic | null {
  const topic = formatTopic(searchQuery || "");
  if (topic.length < 2) return null;
  if (!containsQuery(haystack, topic)) return null;

  const words = topic.split(/\s+/).filter(Boolean);
  return {
    topic,
    score: Math.min(20, 12 + words.length * 2),
    kind: "search",
  };
}

function getAttentionTopics(post: IngestedPost, searchQuery?: string): AttentionTopic[] {
  const haystack = cleanText([
    post.source?.title,
    post.source?.handle,
    post.tag,
    post.text,
    post.postUrl,
  ].filter(Boolean).join(" "));

  const topics: AttentionTopic[] = [];
  const searchTopic = buildSearchTopic(searchQuery, haystack);
  if (searchTopic) topics.push(searchTopic);

  const hintTopics = TOPIC_HINTS
    .map((hint) => formatTopic(hint))
    .filter((hint) => hint.length >= 3 && containsQuery(haystack, hint))
    .map((topic, index) => ({ topic, rawScore: 100 - index }));

  const words = haystack
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOP.has(word) && !/^\d+$/.test(word))
    .slice(0, 90);

  const candidates: string[] = [];

  // Одиночные сильные слова.
  for (let i = 0; i < words.length; i++) {
    candidates.push(words[i]);
  }

  // Двух- и трёхсловные фразы.
  for (let i = 0; i < words.length - 1; i++) {
    candidates.push(`${words[i]} ${words[i + 1]}`);
  }

  for (let i = 0; i < words.length - 2; i++) {
    candidates.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  // Фразы из кавычек/названий часто важнее обычного текста.
  const quoted = String(post.text || "").match(/[«\"“](.*?)[»\"”]/g) || [];
  for (const item of quoted) {
    const cleaned = formatTopic(item);
    if (cleaned.length >= 3) candidates.push(cleaned);
  }

  const ranked = [
    ...hintTopics,
    ...Array.from(new Set(candidates.map(formatTopic)))
      .filter((topic) => topic.length >= 4)
      .filter((topic) => !topics.some((existing) => existing.topic === topic))
      .map((topic, index) => ({
        topic,
        rawScore: scoreCandidate(topic, index, haystack),
      })),
  ]
    .filter((item) => item.rawScore > -100)
    .sort((a, b) => b.rawScore - a.rawScore);

  const sourceBoost = post.source?.verified ? 3 : 1;
  const mediaBoost = post.media?.length ? 2 : 0;

  for (const item of ranked) {
    if (topics.length >= 3) break;
    if (topics.some((existing) => existing.topic === item.topic)) continue;

    topics.push({
      topic: item.topic,
      score: Math.max(2, 9 - topics.length * 2 + sourceBoost + mediaBoost),
      kind: "auto",
    });
  }

  return topics.slice(0, 3);
}

function iconByIndex(index: number, item?: AttentionTopic) {
  if (item?.kind === "search") return "🔎";
  if (index === 0) return "🔥";
  if (index === 1) return "⚡";
  return "📈";
}

export function PostAttentionChips({
  post,
  searchQuery = "",
}: {
  post: IngestedPost;
  searchQuery?: string;
}) {
  const [open, setOpen] = useState(false);
  const topics = getAttentionTopics(post, searchQuery);

  if (!topics.length) {
    return (
      <div className="inline-flex max-w-full items-center rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[11px] font-semibold text-secondary">
        ⚡ Attention +1
      </div>
    );
  }

  const primary = topics[0];
  const extraCount = Math.max(0, topics.length - 1);

  return (
    <div className="relative inline-flex max-w-full">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (extraCount > 0) setOpen((prev) => !prev);
        }}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-app"
      >
        <span>{iconByIndex(0, primary)}</span>
        <span className="max-w-[130px] truncate">{primary.topic}</span>
        <span className="shrink-0 text-emerald-500">+{primary.score}</span>

        {extraCount > 0 ? (
          <span className="shrink-0 text-secondary">+{extraCount}</span>
        ) : null}
      </button>

      {open && extraCount > 0 ? (
        <div
          className="absolute bottom-full left-0 z-40 mb-2 w-[280px] max-w-[calc(100vw-32px)] rounded-[22px] border border-soft bg-surface p-3 shadow-soft"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-2 px-1 text-[10px] font-black uppercase tracking-[0.16em] text-secondary">
            Вклад в внимание
          </div>

          <div className="space-y-1.5">
            {topics.map((item, index) => (
              <div
                key={`${item.topic}-${index}`}
                className="flex items-center gap-2 rounded-2xl bg-surface-soft px-3 py-2 text-[12px] font-semibold text-primary"
              >
                <span className="shrink-0">{iconByIndex(index, item)}</span>
                <span className="min-w-0 flex-1 truncate">{item.topic}</span>
                <span className="shrink-0 text-emerald-500">+{item.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
