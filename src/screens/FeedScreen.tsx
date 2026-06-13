import { Bell, ChevronDown, Menu, Plus, Search, Trash2, User, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../types/app";
import type { ContentTag, IngestedPost } from "../types/app";
import { getParentTag, isChildTag, isParentTag, resolveTagLabel } from "../lib/tag-utils";
import { SITE_TAG_GROUPS } from "../lib/tags";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import { MargeletMark } from "../components/shared/MargeletMark";
import {
  FEED_SCREEN_COPY,
  SmartFeedBar,
  type FeedMediaMode,
} from "./feed/SmartFeedBar";
import {
  ADMIN_TELEGRAM_IDS,
  FEED_FILTER_STATE_EVENT,
  FEED_FILTER_TOGGLE_EVENT,
} from "./feed/feed.constants";
import type { ViewerDirection } from "./feed/feed.types";
import { buildShareUrl, getResolvedTags, normalizeMediaList } from "./feed/feed.utils";

const SELECTED_TAGS_STORAGE_KEY = "margelet_feed_selected_tags";
const FEED_SEARCH_STORAGE_KEY = "margelet_feed_search";
const SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscriptions";
const SEEN_SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscription_seen_posts";
const FEED_SETTINGS_STORAGE_KEY = "margelet_feed_settings_v1";
const SEEN_POSTS_STORAGE_KEY = "margelet_seen_posts_v1";
const MAX_SEEN_POSTS_STORAGE_ITEMS = 6000;
const INITIAL_RENDER_POSTS = 14;
const RENDER_POSTS_STEP = 10;
const LOAD_MORE_DISTANCE_PX = 900;
const FEED_SUBSCRIPTIONS_TOGGLE_EVENT = "margelet:feed-subscriptions-toggle";
const FEED_SUBSCRIPTIONS_BADGE_EVENT = "margelet:feed-subscriptions-badge";
const FEED_SEARCH_TOGGLE_EVENT = "margelet:feed-search-toggle";
const FEED_SEARCH_STATE_EVENT = "margelet:feed-search-state";
const FEED_SEARCH_PANEL_STORAGE_KEY = "margelet_feed_search_panel_open";
const FEED_SUBSCRIPTIONS_PANEL_STORAGE_KEY = "margelet_feed_subscriptions_panel_open";

type FeedSettings = {
  mediaMode: FeedMediaMode;
  countries: string[];
  favoriteCountries: string[];
  demoteSeen: boolean;
};

type SubscriptionBubble = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
  latestPostId: number;
};

function getTelegramUserpicUrl(handle?: string | null) {
  const clean = String(handle || "").replace(/^@/, "").trim();
  return clean ? `https://t.me/i/userpic/320/${clean}.jpg` : null;
}

function isGifPost(post: IngestedPost) {
  return (
    post.contentType === "gif" ||
    post.media.some((item) => item.mimeType?.includes("gif"))
  );
}

function isVideoViewerPost(post: IngestedPost) {
  if (isGifPost(post)) return false;

  return (
    post.contentType === "video" ||
    post.media.some((item) => item.kind === "video")
  );
}

function normalizeCountryCode(value: string | null | undefined, locale: Locale) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw) return raw;
  return String(locale).toLowerCase();
}

function parsePostTime(post: IngestedPost) {
  const ms = Date.parse(String(post.createdAt || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function stableFeedHash(value: string) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function getFeedMixSeed() {
  return Math.floor(Date.now() / (3 * 60 * 60 * 1000));
}

function normalizeHandle(value: string | null | undefined) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function interleavePostsBySource(posts: IngestedPost[], locale: Locale) {
  const groups = new Map<string, IngestedPost[]>();
  let fallbackIndex = 0;

  for (const post of [...posts].sort((a, b) => parsePostTime(b) - parsePostTime(a))) {
    const country = normalizeCountryCode(post.sourceCountryCode, locale);
    const handle = normalizeHandle(post.source?.handle);
    const key = handle ? `${country}:${handle}` : `single:${fallbackIndex++}`;

    const list = groups.get(key) || [];
    list.push(post);
    groups.set(key, list);
  }

  const mixSeed = getFeedMixSeed();

  const queues = Array.from(groups.entries())
    .map(([key, items]) => ({
      key,
      items,
      newestAt: parsePostTime(items[0]),
      mixScore: stableFeedHash(`${mixSeed}:${key}`),
    }))
    .sort((a, b) => {
      const aFresh = Math.floor(a.newestAt / (6 * 60 * 60 * 1000));
      const bFresh = Math.floor(b.newestAt / (6 * 60 * 60 * 1000));

      if (aFresh !== bFresh) return bFresh - aFresh;
      return a.mixScore - b.mixScore;
    });

  const result: IngestedPost[] = [];

  while (queues.some((queue) => queue.items.length > 0)) {
    for (const queue of queues) {
      const next = queue.items.shift();
      if (next) result.push(next);
    }
  }

  return result;
}

function normalizeFeedCountries(countries: string[], fallbackCountry: string) {
  const normalized = Array.from(
    new Set(
      countries
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  const hasBaseCountry = normalized.includes(fallbackCountry);
  const extraCountries = normalized
    .filter((item) => item !== fallbackCountry)
    .slice(0, 4);

  if (hasBaseCountry) {
    return [fallbackCountry, ...extraCountries];
  }

  return extraCountries.length ? extraCountries : [fallbackCountry];
}

function normalizeFavoriteCountries(countries: string[], fallbackCountry: string) {
  const normalized = Array.from(
    new Set(
      [fallbackCountry, ...countries]
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    )
  );

  const extras = normalized
    .filter((item) => item !== fallbackCountry)
    .slice(0, 4);

  return [fallbackCountry, ...extras];
}

function detectPostMediaMode(
  post: IngestedPost
): "text" | "photo" | "video" | "mixed" {
  const hasVideo =
    post.media.some((item) => item.kind === "video") ||
    post.contentType === "video";
  const hasImage =
    post.media.some((item) => item.kind === "image") ||
    post.contentType === "image" ||
    post.contentType === "gallery" ||
    post.contentType === "gif";

  if (hasVideo) return "video";
  if (hasImage) return "photo";
  if (post.contentType === "text" || post.media.length === 0) return "text";
  return "mixed";
}

function readSelectedTagsFromStorage(): ContentTag[] {
  try {
    const raw = localStorage.getItem(SELECTED_TAGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ContentTag => typeof item === "string");
  } catch {
    localStorage.removeItem(SELECTED_TAGS_STORAGE_KEY);
    return [];
  }
}

function readSearchQueryFromStorage() {
  try {
    return localStorage.getItem(FEED_SEARCH_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function readBooleanFromStorage(key: string, fallback: boolean) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "1" || raw === "true";
  } catch {
    return fallback;
  }
}

function writeBooleanToStorage(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    //
  }
}

function stripLeadingTagEmoji(value: string) {
  return String(value || "")
    .replace(/^\s*[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+\s*/u, "")
    .trim();
}

function readSubscriptionsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string" && !!item.trim()
    );
  } catch {
    return [];
  }
}

function readSeenSubscriptionsFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, number> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (
        typeof key === "string" &&
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        result[key] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

function readFeedSettingsFromStorage(locale: Locale): FeedSettings {
  const fallbackCountry = String(locale).toLowerCase();

  try {
    const raw = localStorage.getItem(FEED_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        mediaMode: "all",
        countries: [fallbackCountry],
        favoriteCountries: [fallbackCountry],
        demoteSeen: true,
      };
    }

    const parsed = JSON.parse(raw) as Partial<FeedSettings>;
    let mediaMode: FeedMediaMode = "all";
    if (parsed?.mediaMode === "text") mediaMode = "text";
    else if (parsed?.mediaMode === "photo") mediaMode = "photo";
    else if (parsed?.mediaMode === "video") mediaMode = "video";
    else if (parsed?.mediaMode === "chat") mediaMode = "chat";
    else mediaMode = "all";

    const countries = Array.isArray(parsed?.countries)
      ? normalizeFeedCountries(
          parsed.countries.filter((item): item is string => typeof item === "string"),
          fallbackCountry
        )
      : [fallbackCountry];

    const normalizedCountries = normalizeFeedCountries(
      countries.length ? countries : [fallbackCountry],
      fallbackCountry
    );

    const rawFavorites = Array.isArray(parsed?.favoriteCountries)
      ? parsed.favoriteCountries
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      : normalizedCountries;

    const favoriteCountries = normalizeFavoriteCountries(rawFavorites, fallbackCountry);
    const favoriteSet = new Set(favoriteCountries);
    const safeCountries = normalizeFeedCountries(
      normalizedCountries.filter((country) => country === fallbackCountry || favoriteSet.has(country)),
      fallbackCountry
    );

    return {
      mediaMode,
      countries: safeCountries,
      favoriteCountries,
      demoteSeen: parsed?.demoteSeen !== false,
    };
  } catch {
    return {
      mediaMode: "all",
      countries: [fallbackCountry],
      favoriteCountries: [fallbackCountry],
      demoteSeen: true,
    };
  }
}

function writeSeenSubscriptionsToStorage(value: Record<string, number>) {
  try {
    localStorage.setItem(
      SEEN_SUBSCRIPTIONS_STORAGE_KEY,
      JSON.stringify(value)
    );
    window.dispatchEvent(new Event("storage"));
  } catch {
    //
  }
}

function writeFeedSettingsToStorage(value: FeedSettings) {
  try {
    localStorage.setItem(FEED_SETTINGS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    //
  }
}

function readSeenPostsFromStorage(): Record<number, number> {
  try {
    const raw = localStorage.getItem(SEEN_POSTS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<number, number> = {};

    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isFinite(id) && typeof value === "number" && Number.isFinite(value)) {
        result[id] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

function writeSeenPostsToStorage(value: Record<number, number>) {
  try {
    localStorage.setItem(SEEN_POSTS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    //
  }
}

function pruneSeenPostsForCurrentFeed(
  value: Record<number, number>,
  posts: IngestedPost[]
) {
  const currentIds = new Set(posts.map((post) => post.id));

  const entries = Object.entries(value)
    .map(([id, seenAt]) => [Number(id), seenAt] as const)
    .filter(
      ([id, seenAt]) =>
        currentIds.has(id) && Number.isFinite(id) && Number.isFinite(seenAt)
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_SEEN_POSTS_STORAGE_ITEMS);

  return entries.reduce<Record<number, number>>((acc, [id, seenAt]) => {
    acc[id] = seenAt;
    return acc;
  }, {});
}

function SubscriptionsHint({ text }: { text: string }) {
  return (
    <div className="mx-auto mb-4 mt-4 w-full max-w-[570px] px-4">
      <div className="flex items-center gap-4 rounded-[28px] border border-soft bg-surface px-4 py-4 shadow-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-soft">
          <Bell className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-primary">{text}</div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionsBar({
  items,
  onOpen,
}: {
  items: SubscriptionBubble[];
  onOpen: (handle: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="mb-4 mt-4 w-full">
      <div className="mx-auto w-full max-w-[570px]">
        <div className="overflow-x-auto pl-4 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2.5">
            {items.map((item) => (
              <button
                key={item.handle}
                type="button"
                onClick={() => onOpen(item.handle)}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1 text-center"
              >
                <div
                  className={`rounded-full border-2 p-[2px] ${
                    item.hasNew
                      ? "border-[color:var(--text-primary)]"
                      : "border-soft"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface">
                    {item.avatar || getTelegramUserpicUrl(item.handle) ? (
                      <img
                        src={item.avatar || getTelegramUserpicUrl(item.handle) || ""}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          const fallback = getTelegramUserpicUrl(item.handle);

                          if (fallback && event.currentTarget.src !== fallback) {
                            event.currentTarget.src = fallback;
                            return;
                          }

                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-soft text-xs font-bold text-primary">
                        {item.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full truncate text-[11px] font-medium text-secondary">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



function getVideoGridPreview(post: IngestedPost) {
  const media = normalizeMediaList(post);
  const video = media.find((item) => item.kind === "video");
  const image = media.find((item) => item.kind === "image");
  const visual = video || image || null;

  if (!visual) return null;

  const record = visual as Record<string, unknown>;
  const imageRecord = (image || {}) as Record<string, unknown>;

  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
    }

    return "";
  };

  const poster = pickString(
    record.poster,
    record.thumbnail,
    record.thumbnailUrl,
    record.thumb,
    record.thumbUrl,
    record.previewUrl,
    record.preview,
    imageRecord.url,
    imageRecord.src,
    imageRecord.previewUrl
  );

  const url = pickString(
    record.url,
    record.src,
    record.videoUrl,
    record.mediaUrl,
    record.fileUrl,
    record.file_url,
    record.downloadUrl,
    record.previewUrl
  );

  return {
    ...visual,
    url: String(url || visual.url || ""),
    poster,
  };
}

function isVideoGridSourceVerified(post: IngestedPost) {
  const source = (post.source || {}) as Record<string, unknown>;
  return Boolean(
    source.verified ||
      source.isVerified ||
      source.is_verified ||
      source.verifiedBadge ||
      source.badge === "verified"
  );
}

function getVideoGridMediaRatio(post: IngestedPost, index: number) {
  const media = normalizeMediaList(post);
  const visual =
    media.find((item) => item.kind === "video") ||
    media.find((item) => item.kind === "image");

  const record = (visual || {}) as Record<string, unknown>;
  const width = Number(record.width || record.w || record.videoWidth || 0);
  const height = Number(record.height || record.h || record.videoHeight || 0);

  if (width > 0 && height > 0) {
    return width / height;
  }

  // Если Telegram не дал размеры — не делаем огромные пустые башни.
  // Паттерн даёт живую ленту, но grid-auto-flow:dense закрывает дырки.
  const pattern = [0.62, 0.78, 1.2, 0.7, 1.55, 0.82, 1, 0.66, 1.38, 0.74];
  return pattern[index % pattern.length] || 0.78;
}

function getVideoGridCardClass(post: IngestedPost, index: number) {
  const ratio = getVideoGridMediaRatio(post, index);

  // Tetris-сетка: фиксированная мелкая сетка + dense.
  // Карточки могут занимать 1/2 колонки и разную высоту, но всегда кропаются через object-cover.
  // Так лучше потерять края превью, чем оставлять пустые клетки.
  if (ratio >= 1.35) {
    return "col-span-2 row-span-3";
  }

  if (ratio >= 1.05) {
    return index % 5 === 0 ? "col-span-2 row-span-4" : "col-span-1 row-span-3";
  }

  if (ratio >= 0.86) {
    return index % 7 === 0 ? "col-span-2 row-span-5" : "col-span-1 row-span-4";
  }

  if (ratio <= 0.56) {
    return index % 9 === 0 ? "col-span-2 row-span-6" : "col-span-1 row-span-5";
  }

  const pattern = [
    "col-span-1 row-span-5",
    "col-span-1 row-span-4",
    "col-span-2 row-span-5",
    "col-span-1 row-span-5",
    "col-span-1 row-span-4",
    "col-span-1 row-span-6",
    "col-span-2 row-span-4",
    "col-span-1 row-span-5",
  ];

  return pattern[index % pattern.length] || "col-span-1 row-span-5";
}


function FeedTopSearch({
  locale,
  searchQuery,
  setSearchQuery,
  detectedTags,
  selectedTags,
  onToggleTag,
  categoriesOpen,
  onToggleCategories,
  forceFloating,
  onCloseFloating,
  //onActivateFloating,
}: {
  locale: Locale;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  detectedTags: Array<{ value: ContentTag; emoji: string; label: string; count: number }>;
  selectedTags: ContentTag[];
  onToggleTag: (tag: ContentTag) => void;
  categoriesOpen: boolean;
  onToggleCategories: () => void;
  forceFloating: boolean;
  onCloseFloating: () => void;
  onActivateFloating: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hasQuery = searchQuery.trim().length > 0;
  const isFloating = forceFloating;
  const shouldStick = hasQuery || forceFloating;

  const placeholder =
    locale === "ru"
      ? "Поиск по каналу, тексту, теме..."
      : "Search by channel, text, topic...";

  useEffect(() => {
    if (!forceFloating || !focused) return;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [forceFloating, focused]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    inputRef.current?.blur();
  };

  const searchNode = (
      <div
        data-feed-main-search="true"
        className={[
          "feed-main-search-wrap w-full px-4",
          shouldStick
            ? "feed-main-search-sticky feed-main-search-floating pb-3 pt-2"
            : "mx-auto max-w-[570px] pb-3 pt-2",
        ].join(" ")}
      >
      <style>{`
        .feed-main-search-wrap {
          position: relative;
        }

        .feed-main-search-floating {
          position: sticky;
          top: var(--app-header-offset);
          z-index: 70;
          max-width: 570px;
          margin-left: auto;
          margin-right: auto;
        }

        .feed-main-search-sticky {
          background: linear-gradient(
            to bottom,
            rgba(18, 31, 44, .54) 0%,
            rgba(18, 31, 44, .34) 46%,
            rgba(18, 31, 44, .12) 78%,
            rgba(18, 31, 44, 0) 100%
          );
          backdrop-filter: blur(26px);
          -webkit-backdrop-filter: blur(26px);
        }

        [data-theme="light"] .feed-main-search-sticky {
          background: linear-gradient(
            to bottom,
            rgba(245, 248, 252, .88) 0%,
            rgba(245, 248, 252, .60) 48%,
            rgba(245, 248, 252, .18) 80%,
            rgba(245, 248, 252, 0) 100%
          );
        }

        .feed-main-search-toggle {
          --feed-main-search-toggle-border: #294963;
          border: 2px solid var(--feed-main-search-toggle-border);
        }

        [data-theme="light"] .feed-main-search-toggle {
          --feed-main-search-toggle-border: #cbd5e1;
        }

        .feed-main-search-toggle-active {
          border-color: #41d25a;
        }

        .feed-main-search-shell {
          --feed-main-search-bg: #142231;
          --feed-main-search-border: #294963;
          --feed-main-search-text: var(--text-primary);
          --feed-main-search-muted: var(--text-secondary);
          padding: 2px;
        }

        [data-theme="light"] .feed-main-search-shell {
          --feed-main-search-bg: #ffffff;
          --feed-main-search-border: #cbd5e1;
        }

        .feed-main-search-idle {
          background:
            linear-gradient(var(--feed-main-search-bg), var(--feed-main-search-bg)) padding-box,
            linear-gradient(90deg, var(--feed-main-search-border) 0%, var(--feed-main-search-border) 62%, #ff4d8d 73%, #ff4d8d 81%, var(--feed-main-search-border) 94%, var(--feed-main-search-border) 100%) border-box;
          border: 2px solid transparent;
          background-size: 100% 100%, 260% 100%;
          animation: feedMainSearchRun 3.2s ease-in-out infinite;
        }

        .feed-main-search-focus {
          background:
            linear-gradient(var(--feed-main-search-bg), var(--feed-main-search-bg)) padding-box,
            linear-gradient(90deg, var(--feed-main-search-border), var(--feed-main-search-border)) border-box;
          border: 2px solid transparent;
          background-size: 100% 100%, 100% 100%;
        }

        .feed-main-search-filled {
          background: #41d25a;
        }

        @keyframes feedMainSearchRun {
          0% { background-position: 0 0, 0% 50%; }
          100% { background-position: 0 0, 200% 50%; }
        }
      `}</style>

      <form className="flex items-center gap-2" onSubmit={submitSearch}>
        <div
          className={[
            "feed-main-search-shell relative h-12 min-w-0 flex-1 rounded-full",
            hasQuery ? "feed-main-search-filled" : focused ? "feed-main-search-focus" : "feed-main-search-idle",
          ].join(" ")}
        >
          <div className="relative h-full rounded-full bg-[var(--feed-main-search-bg)] text-[var(--feed-main-search-text)]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
            <input
              ref={inputRef}
              value={searchQuery}
              onFocus={() => {
                setFocused(true);
              }}
              onBlur={() => setFocused(false)}
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              placeholder={placeholder}
              enterKeyHint="search"
              className="h-full w-full rounded-full bg-transparent pl-11 pr-12 text-[15px] font-semibold outline-none placeholder:text-secondary"
            />

            {hasQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  if (isFloating) onCloseFloating();
                }}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-surface-soft text-secondary transition hover:opacity-90"
                aria-label="Очистить"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={detectedTags.length > 0 ? onToggleCategories : undefined}
          disabled={detectedTags.length === 0}
          className={[
            "feed-main-search-toggle grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface text-secondary shadow-soft transition hover:bg-surface-soft hover:text-primary disabled:opacity-45",
            categoriesOpen ? "feed-main-search-toggle-active" : "",
          ].join(" ")}
          aria-label={categoriesOpen ? "Скрыть категории" : "Показать категории"}
          title={categoriesOpen ? "Скрыть категории" : "Показать категории"}
        >
          <ChevronDown className={`h-5 w-5 transition ${categoriesOpen ? "rotate-180" : ""}`} />
        </button>
      </form>

      {categoriesOpen && detectedTags.length > 0 ? (
        <div className="mt-2 grid grid-cols-5 gap-x-1 gap-y-2 sm:grid-cols-9 sm:gap-x-1.5">
          {detectedTags.map((tag) => {
            const active = selectedTags.includes(tag.value);

            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => onToggleTag(tag.value)}
                className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-center transition hover:bg-surface-soft"
                title={`${tag.label} · ${tag.count}`}
              >
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full border text-lg shadow-sm ${
                    active
                      ? "border-[#38d25a] bg-[#38d25a] text-[#07140c]"
                      : "border-soft bg-surface-soft text-primary"
                  }`}
                >
                  {tag.emoji}
                </span>
                <span className="w-full truncate text-[10px] font-medium text-secondary">
                  {stripLeadingTagEmoji(tag.label)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      </div>
  );

  return searchNode;
}


function VideoGridView({
  posts,
  locale,
  registerFeedCardNode,
  onOpenPost,
  onSeen,
}: {
  posts: IngestedPost[];
  locale: Locale;
  registerFeedCardNode: (postId: number, node: HTMLDivElement | null) => void;
  onOpenPost: (post: IngestedPost) => void;
  onSeen: (postId: number) => void;
}) {
  const emptyText = locale === "ru" ? "Видео пока нет" : "No videos yet";
  const [previewPostId, setPreviewPostId] = useState<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressNextClickRef = useRef(false);
  const videoPreviewRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const autoPreviewTimerRef = useRef<number | null>(null);
  const [visibleVideoCount, setVisibleVideoCount] = useState(18);
  const [previewLoadPostIds, setPreviewLoadPostIds] = useState<Set<number>>(() => new Set());
  const [videoReadyPostIds, setVideoReadyPostIds] = useState<Set<number>>(() => new Set());
  const [imageFailedPostIds, setImageFailedPostIds] = useState<Set<number>>(() => new Set());
  const loadMoreVideoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    videoPreviewRefs.current.forEach((video, postId) => {
      if (postId !== previewPostId) {
        video.pause();
        try {
          video.currentTime = Math.min(0.12, video.duration || 0.12);
        } catch {
          //
        }
      }
    });

    if (previewPostId === null) return;

    const activeVideo = videoPreviewRefs.current.get(previewPostId);
    if (!activeVideo) return;

    activeVideo.muted = true;
    activeVideo.loop = true;
    void activeVideo.play().catch(() => undefined);
  }, [previewPostId]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
      }
      if (autoPreviewTimerRef.current) {
        window.clearTimeout(autoPreviewTimerRef.current);
        autoPreviewTimerRef.current = null;
      }
      videoPreviewRefs.current.forEach((video) => video.pause());
    };
  }, []);

  useEffect(() => {
    setVisibleVideoCount(18);
    setPreviewPostId(null);
    setPreviewLoadPostIds(new Set());
    setVideoReadyPostIds(new Set());
    setImageFailedPostIds(new Set());
  }, [posts]);

  useEffect(() => {
    const node = loadMoreVideoRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisibleVideoCount((prev) => Math.min(posts.length, prev + 18));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleVideoCount((prev) => Math.min(posts.length, prev + 18));
      },
      { rootMargin: "260px 0px 420px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [posts.length, visibleVideoCount]);

  useEffect(() => {
    return () => {
      if (autoPreviewTimerRef.current) {
        window.clearTimeout(autoPreviewTimerRef.current);
        autoPreviewTimerRef.current = null;
      }
    };
  }, []);

  const warmVideoPreview = useCallback((postId: number) => {
    setPreviewLoadPostIds((prev) => {
      if (prev.has(postId)) return prev;
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  }, []);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const startPreview = (postId: number) => {
    suppressNextClickRef.current = true;

    const video = videoPreviewRefs.current.get(postId);
    if (video) {
      video.muted = true;
      video.loop = true;
      try {
        if (video.currentTime < 0.08) {
          video.currentTime = Math.min(0.14, video.duration || 0.14);
        }
      } catch {
        //
      }
      void video.play().catch(() => undefined);
    }

    setPreviewPostId(postId);
  };

  const stopPreview = () => {
    clearLongPressTimer();
    window.setTimeout(() => {
      setPreviewPostId(null);
    }, 90);
  };

  if (posts.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-sm text-secondary">
        {emptyText}
      </div>
    );
  }

  const visiblePosts = posts.slice(0, visibleVideoCount);

  return (
    <div className="pt-px">
      <div className="grid grid-cols-2 gap-px [grid-auto-flow:dense] [grid-auto-rows:48px] sm:grid-cols-2 sm:[grid-auto-rows:58px]">
        {visiblePosts.map((post, index) => {
          const preview = getVideoGridPreview(post);
          const avatar = post.source?.avatar || getTelegramUserpicUrl(post.source?.handle);
          const title = post.source?.title || post.source?.handle || "Telegram";
          const verified = isVideoGridSourceVerified(post);
          const cardClass = getVideoGridCardClass(post, index);
          const poster = preview?.poster || "";
          const isPreviewing = previewPostId === post.id;
          const text = String(post.text || "")
            .replace(/https?:\/\/\S+/g, "")
            .replace(/\s+/g, " ")
            .trim();
          const canRenderVideo = preview?.kind === "video" && !!preview.url;
          const canRenderImage = preview?.kind === "image" && !!preview.url;
          const imageFailed = imageFailedPostIds.has(post.id);
          const hasImagePreview = Boolean(poster) || (canRenderImage && !imageFailed);
          const shouldRenderVideo =
            canRenderVideo &&
            (!hasImagePreview || isPreviewing || previewLoadPostIds.has(post.id));

          const videoReady = videoReadyPostIds.has(post.id);
          const showVideoFrame = videoReady && (isPreviewing || !hasImagePreview);

          return (
            <div
              key={post.id}
              ref={(node) => {
                registerFeedCardNode(post.id, node);
                // Play-сетка регистрируется только для seen-логики общей ленты.
              }}
              data-feed-post-id={post.id}
              data-video-tile-post-id={post.id}
              className={`${cardClass} relative z-0 min-h-0 hover:z-[5] focus-within:z-[5]`}
            >
              <button
                type="button"
                onContextMenu={(event) => event.preventDefault()}
                onPointerDown={(event) => {
                  if (event.pointerType === "mouse" && event.button !== 0) return;

                  clearLongPressTimer();
                  suppressNextClickRef.current = false;
                  warmVideoPreview(post.id);

                  longPressTimerRef.current = window.setTimeout(() => {
                    startPreview(post.id);
                  }, 430);
                }}
                onPointerUp={stopPreview}
                onPointerCancel={stopPreview}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") {
                    warmVideoPreview(post.id);
                    startPreview(post.id);
                  }
                }}
                onPointerLeave={stopPreview}
                onClick={() => {
                  if (suppressNextClickRef.current) {
                    suppressNextClickRef.current = false;
                    return;
                  }

                  onSeen(post.id);
                  onOpenPost(post);
                }}
                style={{
                  WebkitTouchCallout: "none",
                  touchAction: "manipulation",
                  userSelect: "none",
                }}
                className={[
                  "group relative block h-full w-full overflow-hidden bg-[#101d2b] text-left transition duration-200 active:scale-[0.995]",
                  isPreviewing ? "shadow-[0_18px_42px_rgba(0,0,0,.55)]" : "",
                ].join(" ")}
              >
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_25%_18%,rgba(74,144,226,.34),transparent_32%),radial-gradient(circle_at_80%_72%,rgba(65,210,90,.16),transparent_36%),linear-gradient(135deg,#111f31_0%,#070b11_100%)]" />

                {shouldRenderVideo ? (
                  <video
                    ref={(node) => {
                      if (node) {
                        videoPreviewRefs.current.set(post.id, node);
                        node.muted = true;
                        node.loop = true;
                      } else {
                        videoPreviewRefs.current.delete(post.id);
                      }
                    }}
                    src={preview.url}
                    poster={poster || undefined}
                    data-video-preview-post-id={post.id}
                    muted
                    playsInline
                    loop
                    draggable={false}
                    disablePictureInPicture
                    controlsList="nodownload noplaybackrate noremoteplayback"
                    preload="metadata"
                    className={[
                      "absolute inset-0 z-[2] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]",
                      showVideoFrame ? "opacity-100" : "opacity-0",
                    ].join(" ")}
                    onContextMenu={(event) => event.preventDefault()}
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      try {
                        const targetTime = isPreviewing ? 0.14 : 0.5;
                        if (video.currentTime < 0.08) {
                          video.currentTime = Math.min(targetTime, video.duration || targetTime);
                        }
                      } catch {
                        //
                      }
                    }}
                    onLoadedData={(event) => {
                      const video = event.currentTarget;
                      try {
                        if (!isPreviewing) {
                          video.pause();
                        }
                        setVideoReadyPostIds((prev) => {
                          if (prev.has(post.id)) return prev;
                          const next = new Set(prev);
                          next.add(post.id);
                          return next;
                        });
                      } catch {
                        //
                      }
                    }}
                    onCanPlay={(event) => {
                      const video = event.currentTarget;
                      if (isPreviewing) return;
                      try {
                        video.pause();
                        setVideoReadyPostIds((prev) => {
                          if (prev.has(post.id)) return prev;
                          const next = new Set(prev);
                          next.add(post.id);
                          return next;
                        });
                      } catch {
                        //
                      }
                    }}
                  />
                ) : null}

                {poster && !imageFailed ? (
                  <img
                    src={poster}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 z-[1] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading={index < 18 ? "eager" : "lazy"}
                    fetchPriority={index < 8 ? "high" : "auto"}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      setImageFailedPostIds((prev) => {
                        if (prev.has(post.id)) return prev;
                        const next = new Set(prev);
                        next.add(post.id);
                        return next;
                      });
                    }}
                  />
                ) : canRenderImage && !imageFailed ? (
                  <img
                    src={preview.url}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 z-[1] h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    loading={index < 18 ? "eager" : "lazy"}
                    fetchPriority={index < 8 ? "high" : "auto"}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={() => {
                      setImageFailedPostIds((prev) => {
                        if (prev.has(post.id)) return prev;
                        const next = new Set(prev);
                        next.add(post.id);
                        return next;
                      });
                    }}
                  />
                ) : null}

                <div
                  className={[
                    "pointer-events-none absolute inset-0 z-[3] transition duration-200",
                    isPreviewing
                      ? "bg-gradient-to-t from-black/82 via-black/26 to-black/5"
                      : "bg-gradient-to-t from-black/76 via-black/16 to-transparent",
                  ].join(" ")}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] p-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#1d3148] ring-1 ring-white/45 shadow-[0_2px_8px_rgba(0,0,0,.45)]">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt=""
                          draggable={false}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            const fallback = getTelegramUserpicUrl(post.source?.handle);
                            if (fallback && event.currentTarget.src !== fallback) {
                              event.currentTarget.src = fallback;
                              return;
                            }
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>

                    <div className="flex min-w-0 items-center gap-1">
                      <span className="min-w-0 truncate text-[11px] font-black leading-none text-white drop-shadow-[0_1px_3px_rgba(0,0,0,.95)]">
                        {title}
                      </span>
                      {verified ? <VerifiedBadge size={12} className="shrink-0" /> : null}
                    </div>
                  </div>

                  {isPreviewing && text ? (
                    <div className="mt-2 line-clamp-4 rounded-2xl bg-black/42 px-2 py-1.5 text-[12px] font-semibold leading-snug text-white shadow-[0_4px_18px_rgba(0,0,0,.35)] backdrop-blur-sm">
                      {text}
                    </div>
                  ) : null}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {visibleVideoCount < posts.length ? (
        <div ref={loadMoreVideoRef} className="h-[70vh]" aria-hidden="true" />
      ) : null}
    </div>
  );
}


const SPACE_MESSAGES_STORAGE_KEY = "margelet_space_messages_v1";
const SPACE_THREADS_STORAGE_KEY = "margelet_space_threads_v1";
const SPACE_ACTIVE_THREAD_STORAGE_KEY = "margelet_space_active_thread_v1";

type SpaceMessage = {
  role: "user" | "space";
  text: string;
};

type SpaceThread = {
  id: string;
  title: string;
  messages: SpaceMessage[];
  updatedAt: number;
};

function createSpaceThread(title = "New Space"): SpaceThread {
  return {
    id: `space-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    messages: [],
    updatedAt: Date.now(),
  };
}

function getSpaceThreadTitle(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New Space";
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
}

function readSpaceThreadsFromStorage(): SpaceThread[] {
  try {
    const raw = localStorage.getItem(SPACE_THREADS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter(
          (thread): thread is SpaceThread =>
            thread &&
            typeof thread.id === "string" &&
            typeof thread.title === "string" &&
            typeof thread.updatedAt === "number" &&
            Array.isArray(thread.messages),
        )
        .map((thread) => ({
          ...thread,
          messages: thread.messages
            .filter(
              (message): message is SpaceMessage =>
                message &&
                (message.role === "user" || message.role === "space") &&
                typeof message.text === "string",
            )
            .slice(-80),
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 40);
    }

    const legacyRaw = localStorage.getItem(SPACE_MESSAGES_STORAGE_KEY);
    const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : [];
    if (!Array.isArray(legacyParsed) || legacyParsed.length === 0) return [];

    return [
      {
        ...createSpaceThread(getSpaceThreadTitle(String(legacyParsed[0]?.text || "Space"))),
        messages: legacyParsed
          .filter(
            (message): message is SpaceMessage =>
              message &&
              (message.role === "user" || message.role === "space") &&
              typeof message.text === "string",
          )
          .slice(-80),
      },
    ];
  } catch {
    return [];
  }
}

function writeSpaceThreadsToStorage(threads: SpaceThread[]) {
  try {
    localStorage.setItem(SPACE_THREADS_STORAGE_KEY, JSON.stringify(threads.slice(0, 40)));
  } catch {
    // Space history stays local and never touches the server.
  }
}


type SpaceCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  emptyHint: string;
  backLabel: string;
  userPrefix: string;
  botAnswer: string;
  examples: string[];
};

const SPACE_COPY: Record<Locale, SpaceCopy> = {
  ru: {
    title: "margeleT Space",
    subtitle: "Глобальный поиск по живому Telegram",
    placeholder: "Спроси, что происходит прямо сейчас...",
    emptyHint: "Пиши как человеку: страна, тема, источник или событие. Space будет искать смысл в потоке Telegram.",
    backLabel: "Закрыть Space",
    userPrefix: "Ты",
    botAnswer: "Space просыпается. Скоро я буду собирать ответ по постам, странам и каналам margeleT.",
    examples: ["Что обсуждают в Индии?", "Что пишут про AI в Германии?", "Что сейчас в Telegram России?"],
  },
  us: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Ask what is happening right now...",
    emptyHint: "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer: "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: ["What is being discussed in India?", "What is written about AI in Germany?", "What is happening in Telegram now?"],
  },
  ua: {
    title: "margeleT Space",
    subtitle: "Глобальний пошук у живому Telegram",
    placeholder: "Запитай, що відбувається просто зараз...",
    emptyHint: "Пиши як людині: країна, тема, джерело або подія. Space шукатиме сенс у потоці Telegram.",
    backLabel: "Закрити Space",
    userPrefix: "Ти",
    botAnswer: "Space прокидається. Скоро я збиратиму відповіді з постів, країн і каналів margeleT.",
    examples: ["Що обговорюють в Індії?", "Що пишуть про AI у Німеччині?", "Що зараз у Telegram?"],
  },
  in: {
    title: "margeleT Space",
    subtitle: "लाइव Telegram में वैश्विक खोज",
    placeholder: "पूछो अभी क्या हो रहा है...",
    emptyHint: "साधारण भाषा में लिखो: देश, विषय, स्रोत या घटना। Space Telegram प्रवाह में अर्थ खोजेगा।",
    backLabel: "Space बंद करें",
    userPrefix: "आप",
    botAnswer: "Space जाग रहा है। जल्द ही मैं margeleT पोस्ट, देशों और चैनलों से उत्तर बनाऊँगा।",
    examples: ["भारत में क्या चर्चा हो रही है?", "जर्मनी में AI के बारे में क्या लिखा जा रहा है?", "Telegram में अभी क्या हो रहा है?"],
  },
  ir: {
    title: "margeleT Space",
    subtitle: "جستجوی جهانی در Telegram زنده",
    placeholder: "بپرس الان چه خبر است...",
    emptyHint: "طبیعی بنویس: کشور، موضوع، منبع یا رویداد. Space معنا را در جریان Telegram پیدا می‌کند.",
    backLabel: "بستن Space",
    userPrefix: "تو",
    botAnswer: "Space در حال بیدار شدن است. به‌زودی از پست‌ها، کشورها و کانال‌های margeleT پاسخ می‌سازم.",
    examples: ["در هند درباره چه چیزی حرف می‌زنند؟", "در آلمان درباره AI چه می‌نویسند؟", "الان در Telegram چه خبر است؟"],
  },
  tr: {
    title: "margeleT Space",
    subtitle: "Canlı Telegram içinde küresel arama",
    placeholder: "Şu anda ne oluyor, sor...",
    emptyHint: "Doğal yaz: ülke, konu, kaynak veya olay. Space Telegram akışındaki anlamı arayacak.",
    backLabel: "Space'i kapat",
    userPrefix: "Sen",
    botAnswer: "Space uyanıyor. Yakında margeleT gönderileri, ülkeleri ve kanallarından cevaplar kuracağım.",
    examples: ["Hindistan'da ne konuşuluyor?", "Almanya'da AI hakkında ne yazıyorlar?", "Telegram'da şu anda ne oluyor?"],
  },
  br: {
    title: "margeleT Space",
    subtitle: "Busca global no Telegram ao vivo",
    placeholder: "Pergunte o que está acontecendo agora...",
    emptyHint: "Escreva naturalmente: país, tema, fonte ou evento. O Space vai buscar sentido no fluxo do Telegram.",
    backLabel: "Fechar Space",
    userPrefix: "Você",
    botAnswer: "O Space está acordando. Em breve vou montar respostas com posts, países e canais do margeleT.",
    examples: ["O que estão discutindo na Índia?", "O que escrevem sobre AI na Alemanha?", "O que está acontecendo no Telegram agora?"],
  },
  kz: {
    title: "margeleT Space",
    subtitle: "Тірі Telegram ішіндегі ғаламдық іздеу",
    placeholder: "Қазір не болып жатқанын сұра...",
    emptyHint: "Адамша жаз: ел, тақырып, дереккөз немесе оқиға. Space Telegram ағымынан мағына іздейді.",
    backLabel: "Space жабу",
    userPrefix: "Сен",
    botAnswer: "Space оянып жатыр. Жақында margeleT посттары, елдері және арналары бойынша жауап құрастырамын.",
    examples: ["Үндістанда не талқыланып жатыр?", "Германияда AI туралы не жазып жатыр?", "Қазір Telegram-да не бар?"],
  },
  uz: {
    title: "margeleT Space",
    subtitle: "Jonli Telegram bo‘yicha global qidiruv",
    placeholder: "Hozir nima bo‘layotganini so‘rang...",
    emptyHint: "Oddiy yozing: mamlakat, mavzu, manba yoki voqea. Space Telegram oqimidan ma’no izlaydi.",
    backLabel: "Space ni yopish",
    userPrefix: "Siz",
    botAnswer: "Space uyg‘onmoqda. Tez orada margeleT postlari, mamlakatlari va kanallaridan javoblar tuzaman.",
    examples: ["Hindistonda nima muhokama qilinyapti?", "Germaniyada AI haqida nima yozishyapti?", "Telegramda hozir nima bo‘lyapti?"],
  },
  ae: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "اسأل عمّا يحدث الآن...",
    emptyHint: "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer: "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: ["ماذا يناقشون في الهند؟", "ماذا يكتبون عن AI في ألمانيا؟", "ماذا يحدث في Telegram الآن؟"],
  },
  eg: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "اسأل عمّا يحدث الآن...",
    emptyHint: "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer: "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: ["ماذا يناقشون في الهند؟", "ماذا يكتبون عن AI في ألمانيا؟", "ماذا يحدث في Telegram الآن؟"],
  },
  pk: {
    title: "margeleT Space",
    subtitle: "لائیو Telegram میں عالمی تلاش",
    placeholder: "پوچھیں ابھی کیا ہو رہا ہے...",
    emptyHint: "قدرتی انداز میں لکھیں: ملک، موضوع، ذریعہ یا واقعہ۔ Space Telegram کے بہاؤ میں معنی تلاش کرے گا۔",
    backLabel: "Space بند کریں",
    userPrefix: "آپ",
    botAnswer: "Space جاگ رہا ہے۔ جلد ہی میں margeleT پوسٹس، ممالک اور چینلز سے جواب بناؤں گا۔",
    examples: ["بھارت میں کیا بحث ہو رہی ہے؟", "جرمنی میں AI کے بارے میں کیا لکھا جا رہا ہے؟", "Telegram میں ابھی کیا ہو رہا ہے؟"],
  },
  id: {
    title: "margeleT Space",
    subtitle: "Pencarian global di Telegram langsung",
    placeholder: "Tanyakan apa yang terjadi sekarang...",
    emptyHint: "Tulis natural: negara, topik, sumber, atau peristiwa. Space akan mencari makna di aliran Telegram.",
    backLabel: "Tutup Space",
    userPrefix: "Kamu",
    botAnswer: "Space sedang bangun. Segera aku akan membuat jawaban dari postingan, negara, dan channel margeleT.",
    examples: ["Apa yang dibahas di India?", "Apa yang ditulis tentang AI di Jerman?", "Apa yang terjadi di Telegram sekarang?"],
  },
  mx: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Pregunta qué está pasando ahora...",
    emptyHint: "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer: "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: ["¿Qué se discute en India?", "¿Qué escriben sobre AI en Alemania?", "¿Qué pasa ahora en Telegram?"],
  },
  sa: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "اسأل عمّا يحدث الآن...",
    emptyHint: "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer: "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: ["ماذا يناقشون في الهند؟", "ماذا يكتبون عن AI في ألمانيا؟", "ماذا يحدث في Telegram الآن؟"],
  },
  es: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Pregunta qué está pasando ahora...",
    emptyHint: "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer: "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: ["¿Qué se discute en India?", "¿Qué escriben sobre AI en Alemania?", "¿Qué pasa ahora en Telegram?"],
  },
  it: {
    title: "margeleT Space",
    subtitle: "Ricerca globale nel Telegram vivo",
    placeholder: "Chiedi cosa sta succedendo adesso...",
    emptyHint: "Scrivi in modo naturale: paese, tema, fonte o evento. Space cercherà il senso nel flusso Telegram.",
    backLabel: "Chiudi Space",
    userPrefix: "Tu",
    botAnswer: "Space si sta svegliando. Presto costruirò risposte dai post, paesi e canali margeleT.",
    examples: ["Di cosa si parla in India?", "Cosa scrivono sull'AI in Germania?", "Cosa succede ora su Telegram?"],
  },
  fr: {
    title: "margeleT Space",
    subtitle: "Recherche globale dans le Telegram vivant",
    placeholder: "Demande ce qui se passe maintenant...",
    emptyHint: "Écris naturellement : pays, sujet, source ou événement. Space cherchera le sens dans le flux Telegram.",
    backLabel: "Fermer Space",
    userPrefix: "Toi",
    botAnswer: "Space se réveille. Bientôt je construirai des réponses depuis les posts, pays et chaînes margeleT.",
    examples: ["Que discute-t-on en Inde ?", "Que dit-on sur l'AI en Allemagne ?", "Que se passe-t-il sur Telegram maintenant ?"],
  },
  de: {
    title: "margeleT Space",
    subtitle: "Globale Suche im lebenden Telegram",
    placeholder: "Frag, was gerade passiert...",
    emptyHint: "Schreib natürlich: Land, Thema, Quelle oder Ereignis. Space sucht Bedeutung im Telegram-Strom.",
    backLabel: "Space schließen",
    userPrefix: "Du",
    botAnswer: "Space wacht auf. Bald baue ich Antworten aus margeleT-Posts, Ländern und Kanälen.",
    examples: ["Was wird in Indien diskutiert?", "Was schreibt man über AI in Deutschland?", "Was passiert gerade in Telegram?"],
  },
  ar: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Pregunta qué está pasando ahora...",
    emptyHint: "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer: "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: ["¿Qué se discute en India?", "¿Qué escriben sobre AI en Alemania?", "¿Qué pasa ahora en Telegram?"],
  },
  co: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Pregunta qué está pasando ahora...",
    emptyHint: "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer: "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: ["¿Qué se discute en India?", "¿Qué escriben sobre AI en Alemania?", "¿Qué pasa ahora en Telegram?"],
  },
  za: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Ask what is happening right now...",
    emptyHint: "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer: "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: ["What is being discussed in India?", "What is written about AI in Germany?", "What is happening in Telegram now?"],
  },
  ng: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Ask what is happening right now...",
    emptyHint: "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer: "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: ["What is being discussed in India?", "What is written about AI in Germany?", "What is happening in Telegram now?"],
  },
  cn: {
    title: "margeleT Space",
    subtitle: "实时 Telegram 的全球搜索",
    placeholder: "问问现在正在发生什么...",
    emptyHint: "像和人聊天一样输入：国家、主题、来源或事件。Space 会在 Telegram 信息流里寻找意义。",
    backLabel: "关闭 Space",
    userPrefix: "你",
    botAnswer: "Space 正在醒来。很快我会根据 margeleT 的帖子、国家和频道生成答案。",
    examples: ["印度正在讨论什么？", "德国关于 AI 写了什么？", "Telegram 现在发生了什么？"],
  },
  my: {
    title: "margeleT Space",
    subtitle: "Carian global dalam Telegram langsung",
    placeholder: "Tanya apa yang sedang berlaku sekarang...",
    emptyHint: "Tulis secara semula jadi: negara, topik, sumber atau peristiwa. Space akan mencari makna dalam aliran Telegram.",
    backLabel: "Tutup Space",
    userPrefix: "Anda",
    botAnswer: "Space sedang bangun. Tidak lama lagi saya akan bina jawapan daripada post, negara dan saluran margeleT.",
    examples: ["Apa yang dibincangkan di India?", "Apa yang ditulis tentang AI di Jerman?", "Apa yang berlaku di Telegram sekarang?"],
  },
};

function SpaceOverlay({ locale, onClose }: { locale: Locale; onClose: () => void }) {
  const copy = SPACE_COPY[locale] ?? SPACE_COPY.us;
  const [value, setValue] = useState("");
  const [threads, setThreads] = useState<SpaceThread[]>(() => readSpaceThreadsFromStorage());
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPACE_ACTIVE_THREAD_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [keyboardBottom, setKeyboardBottom] = useState(0);

  const activeThread = useMemo(() => {
    if (!threads.length) return null;
    return threads.find((thread) => thread.id === activeThreadId) || threads[0] || null;
  }, [activeThreadId, threads]);

  const messages = activeThread?.messages || [];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;

    const syncKeyboard = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardBottom(bottom);
    };

    syncKeyboard();
    window.visualViewport.addEventListener("resize", syncKeyboard);
    window.visualViewport.addEventListener("scroll", syncKeyboard);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncKeyboard);
      window.visualViewport?.removeEventListener("scroll", syncKeyboard);
    };
  }, []);

  useEffect(() => {
    writeSpaceThreadsToStorage(threads);
  }, [threads]);

  useEffect(() => {
    try {
      if (activeThread?.id) {
        localStorage.setItem(SPACE_ACTIVE_THREAD_STORAGE_KEY, activeThread.id);
      }
    } catch {
      //
    }
  }, [activeThread?.id]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, activeThread?.id]);

  const createNewChat = () => {
    const next = createSpaceThread(copy.title);
    setThreads((prev) => [next, ...prev].slice(0, 40));
    setActiveThreadId(next.id);
    setValue("");
    setMobileMenuOpen(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
  };

  const deleteThread = (threadId: string) => {
    setThreads((prev) => {
      const next = prev.filter((thread) => thread.id !== threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(next[0]?.id || null);
      }
      return next;
    });
  };

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setMobileMenuOpen(false);
    window.setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 80);
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    setThreads((prev) => {
      const now = Date.now();
      let current = activeThread;

      if (!current) {
        current = createSpaceThread(getSpaceThreadTitle(clean));
      }

      const updatedThread: SpaceThread = {
        ...current,
        title:
          current.messages.length === 0 || current.title === copy.title || current.title === "New Space"
            ? getSpaceThreadTitle(clean)
            : current.title,
        updatedAt: now,
        messages: [
          ...current.messages,
          {
            role: "user" as const,
            text: clean,
          },
          {
            role: "space" as const,
            text: copy.botAnswer,
          },
        ].slice(-80),
      };

      setActiveThreadId(updatedThread.id);

      return [
        updatedThread,
        ...prev.filter((thread) => thread.id !== updatedThread.id),
      ].slice(0, 40);
    });

    setValue("");
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(value);
  };

  const renderThreadList = (compact = false) => (
    <div className={compact ? "space-y-2" : "space-y-2"}>
      <button
        type="button"
        onClick={createNewChat}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-3 py-3 text-sm font-black text-[#07111d] transition hover:scale-[1.01] active:scale-[.99]"
      >
        <Plus className="h-4 w-4" />
        New Space
      </button>

      <div className="space-y-2">
        {threads.length === 0 ? (
          <div className="rounded-2xl bg-white/7 px-3 py-3 text-xs font-semibold leading-5 text-white/42">
            Space history will stay only on this device.
          </div>
        ) : null}

        {threads.map((thread) => {
          const active = activeThread?.id === thread.id;

          return (
            <div
              key={thread.id}
              className={[
                "group flex items-center gap-2 rounded-2xl px-2 py-2 transition",
                active ? "bg-white/13" : "bg-white/6 hover:bg-white/10",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => openThread(thread.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-xs font-black uppercase tracking-[0.16em] text-white/44">
                  Space
                </div>
                <div className="mt-0.5 truncate text-sm font-semibold text-white/82">
                  {thread.title}
                </div>
              </button>

              <button
                type="button"
                onClick={() => deleteThread(thread.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/42 opacity-100 transition hover:bg-white/10 hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Delete Space chat"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-[#02060d] text-white">
      <style>{`
        .margelet-space-bg {
          background:
            radial-gradient(ellipse at 50% -14%, rgba(23, 70, 118, .28), transparent 46%),
            radial-gradient(ellipse at 18% 24%, rgba(16, 64, 108, .14), transparent 36%),
            radial-gradient(ellipse at 78% 76%, rgba(5, 51, 69, .18), transparent 40%),
            linear-gradient(180deg, #061426 0%, #020711 52%, #020914 100%);
        }

        .margelet-space-stars::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-repeat: no-repeat;
          background-image:
            radial-gradient(circle at 7% 12%, rgba(255,255,255,.44) 0 1px, transparent 1.9px),
            radial-gradient(circle at 16% 88%, rgba(118,184,255,.27) 0 1px, transparent 1.8px),
            radial-gradient(circle at 34% 29%, rgba(255,255,255,.32) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 57% 67%, rgba(139,207,255,.25) 0 1px, transparent 1.8px),
            radial-gradient(circle at 84% 18%, rgba(255,255,255,.38) 0 .9px, transparent 1.8px),
            radial-gradient(circle at 12% 73%, rgba(255,255,255,.20) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 72% 42%, rgba(99,169,232,.20) 0 1px, transparent 1.8px),
            radial-gradient(circle at 48% 92%, rgba(255,255,255,.20) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 93% 84%, rgba(117,194,255,.18) 0 .8px, transparent 1.6px);
          opacity: .46;
        }

        .margelet-space-stars::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 16%, rgba(37, 112, 181, .10), transparent 34%),
            radial-gradient(ellipse at 82% 78%, rgba(11, 77, 99, .13), transparent 40%);
          opacity: .85;
        }

        @keyframes margeletSpaceMessageIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .margelet-space-message {
          animation: margeletSpaceMessageIn .22s ease-out both;
        }
      `}</style>

      <div className="margelet-space-bg margelet-space-stars absolute inset-0" />

      <button
        type="button"
        onClick={onClose}
        className="absolute left-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white/82 backdrop-blur-xl transition hover:bg-white/14"
        aria-label={copy.backLabel}
        title={copy.backLabel}
      >
        <X className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={() => setMobileMenuOpen((prev) => !prev)}
        className="absolute left-[68px] top-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white/82 backdrop-blur-xl transition hover:bg-white/14 lg:hidden"
        aria-label="Space chats"
        title="Space chats"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={createNewChat}
        className="absolute left-[120px] top-4 z-30 hidden h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white/82 backdrop-blur-xl transition hover:bg-white/14 max-lg:grid"
        aria-label="New Space"
        title="New Space"
      >
        <Plus className="h-5 w-5" />
      </button>

      <button
        type="button"
        className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/8 text-white/82 backdrop-blur-xl transition hover:bg-white/14"
        aria-label="Profile"
        title="Space history is stored only on this device"
      >
        <User className="h-5 w-5" />
      </button>

      <aside className="absolute bottom-0 left-0 top-0 z-20 hidden w-[260px] border-r border-white/8 bg-[#06101d]/72 px-4 pb-4 pt-20 backdrop-blur-2xl lg:block">
        {renderThreadList()}
      </aside>

      {mobileMenuOpen ? (
        <div className="absolute inset-0 z-[25] bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute bottom-0 left-0 top-0 w-[82vw] max-w-[310px] border-r border-white/8 bg-[#06101d]/92 px-4 pb-4 pt-20 shadow-[30px_0_80px_rgba(0,0,0,.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            {renderThreadList(true)}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-[720px] flex-col px-4 pt-20 sm:px-6 lg:ml-[calc(260px+((100vw-260px-720px)/2))] lg:mr-auto">
        <div
          ref={messagesRef}
          className="min-h-0 flex-1 overflow-y-auto pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center pb-24 text-center">
              <div className="text-[42px] font-black tracking-tight sm:text-[58px]">
                {copy.title}
              </div>
              <div className="mt-3 max-w-[560px] text-lg font-semibold text-white/78 sm:text-2xl">
                {copy.subtitle}
              </div>
              <div className="mt-5 max-w-[520px] text-sm leading-6 text-white/52 sm:text-base sm:leading-7">
                {copy.emptyHint}
              </div>
              <div className="mt-8 grid w-full max-w-[520px] gap-2">
                {copy.examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => send(example)}
                    className="rounded-2xl bg-white/7 px-4 py-3 text-left text-sm font-semibold text-white/72 backdrop-blur-xl transition hover:bg-white/12"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 pb-28">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`margelet-space-message flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-3 text-sm leading-6 shadow-2xl backdrop-blur-xl ${
                      message.role === "user"
                        ? "rounded-[22px] rounded-tr-[8px] bg-white text-[#07111d]"
                        : "rounded-[22px] rounded-tl-[8px] bg-white/10 text-white/82"
                    }`}
                  >
                    {message.role === "space" ? (
                      <div className="mb-1 text-xs font-black uppercase tracking-[0.18em] text-white/40">
                        Space
                      </div>
                    ) : null}
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="fixed inset-x-0 z-20 mx-auto w-full max-w-[720px] px-4 sm:px-6 lg:left-[260px] lg:right-0"
          style={{ bottom: `calc(${keyboardBottom}px + max(14px, env(safe-area-inset-bottom)))` }}
        >
          <div className="flex min-h-[54px] items-center gap-2 rounded-full border border-white/12 bg-white/10 p-1.5 shadow-[0_18px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl">
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={copy.placeholder}
              className="min-w-0 flex-1 bg-transparent px-4 text-[15px] font-semibold text-white outline-none placeholder:text-white/40"
              enterKeyHint="send"
            />
            <button
              type="submit"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:scale-[1.04] active:scale-[.98] disabled:opacity-45"
              disabled={!value.trim()}
              aria-label="Send"
            >
              <MargeletMark className="h-5 w-5" colorClassName="text-white" />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export function FeedScreen({
  locale,
  posts,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
  isFeedLoading,
}: {
  locale: Locale;
  posts: IngestedPost[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
  isFeedLoading: boolean;
}) {
  const copy = FEED_SCREEN_COPY[locale] ?? FEED_SCREEN_COPY.us;

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);
  const [viewerDirection, setViewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionHandles, setSubscriptionHandles] = useState<string[]>([]);
  const [seenSubscriptionPosts, setSeenSubscriptionPosts] = useState<
    Record<string, number>
  >({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>(() =>
    readFeedSettingsFromStorage(locale)
  );
  const [showFloatingSmartBar, setShowFloatingSmartBar] = useState(false);
  const [subscriptionsPanelOpen, setSubscriptionsPanelOpen] = useState(() =>
    typeof window === "undefined"
      ? false
      : readBooleanFromStorage(FEED_SUBSCRIPTIONS_PANEL_STORAGE_KEY, false)
  );
  const [subscriptionsOverlayOpen, setSubscriptionsOverlayOpen] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(() =>
    typeof window === "undefined"
      ? true
      : readBooleanFromStorage(FEED_SEARCH_PANEL_STORAGE_KEY, true)
  );
  const [searchOverlayOpen, setSearchOverlayOpen] = useState(false);
  const [searchCategoriesOpen, setSearchCategoriesOpen] = useState(false);
  const lastScrollYRef = useRef(0);
  const feedModeScrollPositionsRef = useRef<Partial<Record<FeedMediaMode, number>>>({});
  const currentFeedModeRef = useRef<FeedMediaMode>(feedSettings.mediaMode);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>(
    {}
  );
  const [seenPosts, setSeenPosts] = useState<Record<number, number>>(() =>
    typeof window === "undefined" ? {} : readSeenPostsFromStorage()
  );
  const [initialSeenPosts, setInitialSeenPosts] = useState<Record<number, number>>(() =>
    typeof window === "undefined" ? {} : readSeenPostsFromStorage()
  );
  const seenPostsHydratedRef = useRef(false);
  const currentSessionSeenPostIdsRef = useRef<Set<number>>(new Set());
  const feedCardNodesRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const safePostsRef = useRef<IngestedPost[]>([]);
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
  const [renderCount, setRenderCount] = useState(INITIAL_RENDER_POSTS);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const shouldGuardInlineVideo = (target: EventTarget | null) => {
      const video = target as HTMLVideoElement | null;
      if (!video || video.tagName !== "VIDEO") return false;
      if (video.closest("[data-video-tile-post-id]")) return false;
      if (viewerIndex !== null) return false;
      return true;
    };

    const stopAutoplay = () => {
      document.querySelectorAll<HTMLVideoElement>("[data-feed-post-id] video").forEach((video) => {
        if (!shouldGuardInlineVideo(video)) return;
        video.autoplay = false;
        video.removeAttribute("autoplay");
        if (!video.paused && !navigator.userActivation?.isActive) {
          video.pause();
        }
      });
    };

    const handlePlay = (event: Event) => {
      if (!shouldGuardInlineVideo(event.target)) return;
      if (navigator.userActivation?.isActive) return;
      const video = event.target as HTMLVideoElement;
      video.pause();
    };

    stopAutoplay();
    const timer = window.setInterval(stopAutoplay, 1400);
    document.addEventListener("play", handlePlay, true);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("play", handlePlay, true);
    };
  }, [viewerIndex, feedSettings.mediaMode, renderCount]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    setShowFloatingSmartBar(false);

    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    setSelectedTags(readSelectedTagsFromStorage());
    const storedSearchQuery = readSearchQueryFromStorage();
    setSearchQuery(storedSearchQuery);
    setSearchPanelOpen(
      storedSearchQuery.trim().length > 0 ||
        readBooleanFromStorage(FEED_SEARCH_PANEL_STORAGE_KEY, true)
    );
    setSearchOverlayOpen(false);
    setSubscriptionsPanelOpen(
      readBooleanFromStorage(FEED_SUBSCRIPTIONS_PANEL_STORAGE_KEY, false)
    );
    setSubscriptionsOverlayOpen(false);
    setSubscriptionHandles(readSubscriptionsFromStorage());
    setSeenSubscriptionPosts(readSeenSubscriptionsFromStorage());
    setFeedSettings(readFeedSettingsFromStorage(locale));

    const storedSeenPosts = readSeenPostsFromStorage();
    currentSessionSeenPostIdsRef.current = new Set();
    seenPostsHydratedRef.current = true;
    setSeenPosts(storedSeenPosts);
    setInitialSeenPosts(storedSeenPosts);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_TAGS_STORAGE_KEY,
      JSON.stringify(selectedTags)
    );
  }, [selectedTags]);

  useEffect(() => {
    localStorage.setItem(FEED_SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    writeBooleanToStorage(FEED_SEARCH_PANEL_STORAGE_KEY, searchPanelOpen);
  }, [searchPanelOpen]);

  useEffect(() => {
    writeBooleanToStorage(FEED_SUBSCRIPTIONS_PANEL_STORAGE_KEY, subscriptionsPanelOpen);
    window.dispatchEvent(
      new CustomEvent(FEED_SUBSCRIPTIONS_TOGGLE_EVENT, {
        detail: { open: subscriptionsPanelOpen },
      })
    );
  }, [subscriptionsPanelOpen]);

  useEffect(() => {
    currentFeedModeRef.current = feedSettings.mediaMode;
    writeFeedSettingsToStorage(feedSettings);
  }, [feedSettings]);


  useEffect(() => {
    const handleSubscriptionPanelToggle = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;

      setSubscriptionsPanelOpen((prev) => {
        if (typeof detail?.open === "boolean") {
          return detail.open;
        }

        const next = !prev;
        setSubscriptionsOverlayOpen(next);
        return next;
      });
    };

    window.addEventListener(
      FEED_SUBSCRIPTIONS_TOGGLE_EVENT,
      handleSubscriptionPanelToggle as EventListener
    );

    return () => {
      window.removeEventListener(
        FEED_SUBSCRIPTIONS_TOGGLE_EVENT,
        handleSubscriptionPanelToggle as EventListener
      );
    };
  }, []);

  useEffect(() => {
    if (!seenPostsHydratedRef.current) return;
    writeSeenPostsToStorage(seenPosts);
  }, [seenPosts]);

  useEffect(() => {
    const handleSearchToggle = () => {
      if (searchOverlayOpen || searchQuery.trim().length > 0) {
        setSearchOverlayOpen(false);
        setSearchCategoriesOpen(false);
        if (searchQuery.trim().length > 0) {
          setSearchQuery("");
        }
        setSearchPanelOpen(true);
        return;
      }

      setSearchPanelOpen(true);
      setSearchOverlayOpen(true);
    };

    window.addEventListener(FEED_SEARCH_TOGGLE_EVENT, handleSearchToggle as EventListener);

    return () => {
      window.removeEventListener(FEED_SEARCH_TOGGLE_EVENT, handleSearchToggle as EventListener);
    };
  }, [searchOverlayOpen, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setSearchPanelOpen(true);
    }
  }, [searchQuery]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FEED_SEARCH_STATE_EVENT, {
        detail: {
          open: searchOverlayOpen || searchQuery.trim().length > 0,
          hasQuery: searchQuery.trim().length > 0,
        },
      })
    );
  }, [searchOverlayOpen, searchQuery]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("[data-feed-main-search='true']")) return;
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (feedSettings.mediaMode === "chat") {
      setSearchOverlayOpen(false);
      setSearchCategoriesOpen(false);
      setSubscriptionsOverlayOpen(false);
    }
  }, [feedSettings.mediaMode]);


  useEffect(() => {
    const localeCountry = String(locale).toLowerCase();

    setFeedSettings((prev) => {
      const normalized = normalizeFeedCountries(prev.countries, localeCountry);
      const favoriteCountries = normalizeFavoriteCountries(
        prev.favoriteCountries || normalized,
        localeCountry
      );
      const favoriteSet = new Set(favoriteCountries);
      const safeCountries = normalizeFeedCountries(
        normalized.filter((country) => country === localeCountry || favoriteSet.has(country)),
        localeCountry
      );

      if (
        safeCountries.join("|") === prev.countries.join("|") &&
        favoriteCountries.join("|") === (prev.favoriteCountries || []).join("|")
      ) {
        return prev;
      }

      return {
        ...prev,
        countries: safeCountries,
        favoriteCountries,
      };
    });
  }, [locale]);  

  useEffect(() => {
    const handleToggle = () => {
      setTagsOpen((prev) => !prev);
    };

    const syncSubscriptions = () => {
      setSubscriptionHandles(readSubscriptionsFromStorage());
      setSeenSubscriptionPosts(readSeenSubscriptionsFromStorage());
    };

    window.addEventListener(
      FEED_FILTER_TOGGLE_EVENT,
      handleToggle as EventListener
    );
    window.addEventListener("focus", syncSubscriptions);
    window.addEventListener("storage", syncSubscriptions);

    return () => {
      window.removeEventListener(
        FEED_FILTER_TOGGLE_EVENT,
        handleToggle as EventListener
      );
      window.removeEventListener("focus", syncSubscriptions);
      window.removeEventListener("storage", syncSubscriptions);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FEED_FILTER_STATE_EVENT, {
        detail: tagsOpen,
      })
    );
  }, [tagsOpen]);

  useEffect(() => {
    const postOverlayOpen = viewerIndex !== null || textReaderPost !== null;

    if (postOverlayOpen) {
      setSearchOverlayOpen(false);
      setSearchCategoriesOpen(false);
      setSubscriptionsOverlayOpen(false);
    }

    if (tagsOpen || postOverlayOpen) {
      setShowFloatingSmartBar(false);
      return;
    }

    const TOP_HIDE_OFFSET = 140;
    const DELTA = 6;

    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      const prevY = lastScrollYRef.current;

      if (currentY <= TOP_HIDE_OFFSET) {
        setShowFloatingSmartBar(false);
        lastScrollYRef.current = currentY;
        return;
      }

      if (currentY < prevY - DELTA) {
        setShowFloatingSmartBar(true);
      } else if (currentY > prevY + DELTA) {
        setShowFloatingSmartBar(false);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY || 0;
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tagsOpen, viewerIndex, textReaderPost]);  

  const safePosts = useMemo(() => {
    return posts.filter(
      (post) =>
        !!post &&
        typeof post.id === "number" &&
        !!post.source &&
        typeof post.source.title === "string" &&
        typeof post.source.handle === "string" &&
        Array.isArray(post.media)
    );
  }, [posts]);

  useEffect(() => {
    safePostsRef.current = safePosts;
  }, [safePosts]);

  useEffect(() => {
    if (safePosts.length === 0) return;

    setSeenPosts((prev) => {
      const next = pruneSeenPostsForCurrentFeed(prev, safePosts);
      return Object.keys(next).length === Object.keys(prev).length ? prev : next;
    });

    setInitialSeenPosts((prev) => pruneSeenPostsForCurrentFeed(prev, safePosts));
  }, [safePosts]);

  const availableCountryOptions = useMemo(() => {
    const currentCountry = String(locale).toLowerCase();
    const set = new Set<string>([currentCountry]);

    for (const post of safePosts) {
      const code = normalizeCountryCode(post.sourceCountryCode, locale);
      if (code) set.add(code);
    }

    return Array.from(set);
  }, [safePosts, locale]);

  const subscriptionBubbles = useMemo(() => {
    if (subscriptionHandles.length === 0) return [];

    const latestByHandle = new Map<
      string,
      {
        handle: string;
        title: string;
        avatar: string | null;
        latestPostId: number;
        hasNew: boolean;
      }
    >();

    for (const post of safePosts) {
      const handle = post.source.handle;
      if (!subscriptionHandles.includes(handle)) continue;

      const existing = latestByHandle.get(handle);

      if (!existing || post.id > existing.latestPostId) {
        const latestPostId = post.id;

        latestByHandle.set(handle, {
          handle,
          title: post.source.title,
          avatar: post.source.avatar,
          latestPostId,
          hasNew: latestPostId > (seenSubscriptionPosts[handle] ?? 0),
        });
      }
    }

    return Array.from(latestByHandle.values()).sort((a, b) => {
      if (a.hasNew !== b.hasNew) {
        return a.hasNew ? -1 : 1;
      }

      return b.latestPostId - a.latestPostId;
    });
  }, [safePosts, subscriptionHandles, seenSubscriptionPosts]);


  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FEED_SUBSCRIPTIONS_BADGE_EVENT, {
        detail: { hasNew: subscriptionBubbles.some((item) => item.hasNew) },
      })
    );
  }, [subscriptionBubbles]);

  const markPostSeen = useCallback((postId: number) => {
    if (!Number.isFinite(postId)) return;

    if (currentSessionSeenPostIdsRef.current.has(postId)) {
      return;
    }

    currentSessionSeenPostIdsRef.current.add(postId);
    const now = Date.now();

    setSeenPosts((prev) => {
      if (prev[postId]) return prev;

      const next = {
        ...prev,
        [postId]: now,
      };

      return next;
    });
  }, []);  

  useEffect(() => {
    const handleSeen = (event: Event) => {
      const detail = (event as CustomEvent<{ id?: number }>).detail;
      const id = Number(detail?.id);

      if (!Number.isFinite(id)) return;
      markPostSeen(id);
    };

    window.addEventListener("margelet-feed-post-seen", handleSeen);

    return () => {
      window.removeEventListener("margelet-feed-post-seen", handleSeen);
    };
  }, [markPostSeen]);

  const isFeedCardVisibleEnough = useCallback((node: HTMLElement) => {
    const rect = node.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    if (!viewportHeight || rect.height <= 0) return false;

    const visibleTop = Math.max(rect.top, 0);
    const visibleBottom = Math.min(rect.bottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);

    // Работает и для маленьких текстовых карточек, и для больших видео-карточек:
    // либо видна существенная часть карточки, либо центр карточки попал в экран.
    const visibleRatio = visibleHeight / Math.min(rect.height, viewportHeight);
    const cardCenter = rect.top + rect.height / 2;
    const centerInsideViewport = cardCenter >= 0 && cardCenter <= viewportHeight;
    const crossesReadingZone = rect.top <= viewportHeight * 0.72 && rect.bottom >= viewportHeight * 0.18;

    return visibleRatio >= 0.18 || centerInsideViewport || crossesReadingZone;
  }, []);

  const registerFeedCardNode = useCallback(
    (postId: number, node: HTMLDivElement | null) => {
      if (!Number.isFinite(postId)) return;

      if (node) {
        feedCardNodesRef.current.set(postId, node);
        window.requestAnimationFrame(() => {
          if (!currentSessionSeenPostIdsRef.current.has(postId) && isFeedCardVisibleEnough(node)) {
            markPostSeen(postId);
          }
        });
      } else {
        feedCardNodesRef.current.delete(postId);
      }
    },
    [isFeedCardVisibleEnough, markPostSeen]
  );

  const tagStats = useMemo(() => {
    let list = [...safePosts];

    const selectedCountries = feedSettings.countries.map((item) => item.toLowerCase());
    if (selectedCountries.length > 0) {
      list = list.filter((post) =>
        selectedCountries.includes(
          normalizeCountryCode(post.sourceCountryCode, locale)
        )
      );
    }

    if (feedSettings.mediaMode === "text") {
      list = list.filter((post) => detectPostMediaMode(post) === "text");
    } else if (feedSettings.mediaMode === "photo") {
      list = list.filter((post) => detectPostMediaMode(post) === "photo");
    } else if (feedSettings.mediaMode === "video") {
      list = list.filter((post) => detectPostMediaMode(post) === "video");
    }

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((post) => {
        const haystack = [
          post.source.title,
          post.source.handle,
          post.text,
          post.postUrl,
          post.tag,
          ...getResolvedTags(post),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    const counts: Partial<Record<ContentTag, number>> = {};

    for (const post of list) {
      const postTags = getResolvedTags(post);
      const seenParents = new Set<ContentTag>();
      const seenChildren = new Set<ContentTag>();

      for (const tag of postTags) {
        if (isParentTag(tag)) {
          seenParents.add(tag);
        }

        if (isChildTag(tag)) {
          seenChildren.add(tag);
          const parent = getParentTag(tag);
          if (parent?.value) {
            seenParents.add(parent.value as ContentTag);
          }
        }
      }

      for (const tag of seenParents) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }

      for (const tag of seenChildren) {
        counts[tag] = (counts[tag] ?? 0) + 1;
      }
    }

    return counts;
  }, [safePosts, feedSettings, searchQuery, locale]);

  const visiblePosts = useMemo(() => {
    let list = [...safePosts];

    const selectedCountries = feedSettings.countries.map((item) =>
      item.toLowerCase()
    );

    if (selectedCountries.length > 0) {
      list = list.filter((post) =>
        selectedCountries.includes(
          normalizeCountryCode(post.sourceCountryCode, locale)
        )
      );
    }

    if (feedSettings.mediaMode === "text") {
      list = list.filter((post) => detectPostMediaMode(post) === "text");
    } else if (feedSettings.mediaMode === "photo") {
      list = list.filter((post) => detectPostMediaMode(post) === "photo");
    } else if (feedSettings.mediaMode === "video") {
      list = list.filter((post) => detectPostMediaMode(post) === "video");
    }

    if (selectedTags.length > 0) {
      list = list.filter((post) => {
        const postTags = getResolvedTags(post);

        return postTags.some((tag) => selectedTags.includes(tag));
      });
    }

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((post) => {
        const haystack = [
          post.source.title,
          post.source.handle,
          post.text,
          post.postUrl,
          post.tag,
          ...getResolvedTags(post),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    list = interleavePostsBySource(list, locale);

    if (feedSettings.demoteSeen) {
      const unseen: IngestedPost[] = [];
      const seen: IngestedPost[] = [];

      for (const post of list) {
        if (initialSeenPosts[post.id]) {
          seen.push(post);
        } else {
          unseen.push(post);
        }
      }

      seen.sort((a, b) => {
        const aSeenAt = initialSeenPosts[a.id] || 0;
        const bSeenAt = initialSeenPosts[b.id] || 0;

        return aSeenAt - bSeenAt;
      });

      list = [
        ...interleavePostsBySource(unseen, locale),
        ...seen,
      ];
    }

    return list;
  }, [
    safePosts,
    feedSettings,
    selectedTags,
    searchQuery,
    locale,
    initialSeenPosts,
  ]);

  useEffect(() => {
      setRenderCount(INITIAL_RENDER_POSTS);
    }, [selectedTags, searchQuery, feedSettings, locale]);

    useEffect(() => {
    const handleLoadMore = () => {
      const scrollTop = window.scrollY || window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      const distanceFromBottom = fullHeight - (scrollTop + viewportHeight);

      if (distanceFromBottom < LOAD_MORE_DISTANCE_PX) {
        setRenderCount((prev) => {
          if (prev >= visiblePosts.length) return prev;
          return Math.min(prev + RENDER_POSTS_STEP, visiblePosts.length);
        });
      }
    };

    window.addEventListener("scroll", handleLoadMore, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleLoadMore);
    };
  }, [visiblePosts.length]);

  const viewerPosts = useMemo(() => {
    return visiblePosts.filter((post) => isVideoViewerPost(post));
  }, [visiblePosts]);

  const activePost = useMemo(() => {
    if (viewerIndex === null) return null;
    return viewerPosts[viewerIndex] ?? null;
  }, [viewerIndex, viewerPosts]);

  const setFeedCardMediaIndex = useCallback((postId: number, nextIndex: number) => {
    setFeedMediaIndexes((prev) => ({
      ...prev,
      [postId]: Math.max(0, nextIndex),
    }));
  }, []);

  const closeFloatingPanels = useCallback(() => {
    setSearchOverlayOpen(false);
    setSearchCategoriesOpen(false);
    setSubscriptionsOverlayOpen(false);
  }, []);

  const changeFeedMediaMode = useCallback((next: FeedMediaMode) => {
    const current = currentFeedModeRef.current;

    if (typeof window !== "undefined") {
      feedModeScrollPositionsRef.current[current] = window.scrollY || 0;
    }

    currentFeedModeRef.current = next;

    setFeedSettings((prev) => {
      if (prev.mediaMode === next) return prev;
      return {
        ...prev,
        mediaMode: next,
      };
    });

    setShowFloatingSmartBar(false);

    if (typeof window !== "undefined") {
      const nextScroll = feedModeScrollPositionsRef.current[next] ?? 0;
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: nextScroll, left: 0, behavior: "auto" });
      });
    }
  }, []);

  const openViewerByPost = useCallback(
    (post: IngestedPost) => {
      closeFloatingPanels();
      const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
      if (nextIndex === -1) {
        return;
      }

      setTextReaderPost(null);
      setViewerDirection(null);
      setViewerIndex(nextIndex);
      setViewerMediaIndex(0);
      setExpandedCaption(false);
      setIsPlaying(true);
      setCopySuccessId(null);
      setMenuPostId(null);
      setActionError("");
      setVideoProgress(0);
    },
    [viewerPosts, closeFloatingPanels]
  );

  const openTextReader = useCallback((post: IngestedPost) => {
    closeFloatingPanels();
    setViewerIndex(null);
    setTextReaderPost(post);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  }, [closeFloatingPanels]);

  const closeViewerState = useCallback(() => {
    setViewerDirection(null);
    setViewerIndex(null);
    setTextReaderPost(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const closeViewer = useCallback(() => {
    closeViewerState();
  }, [closeViewerState]);

  useEffect(() => {
    if (viewerIndex === null) return;
    if (viewerIndex < viewerPosts.length) return;

    setViewerIndex(viewerPosts.length > 0 ? viewerPosts.length - 1 : null);
  }, [viewerIndex, viewerPosts.length]);

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    if (viewerIndex >= viewerPosts.length - 1) return;

    const currentPost = viewerPosts[viewerIndex];
    if (currentPost) markPostSeen(currentPost.id);
    setViewerDirection("next");
    setViewerIndex(viewerIndex + 1);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts, markPostSeen]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    if (viewerIndex <= 0) return;

    const currentPost = viewerPosts[viewerIndex];
    if (currentPost) markPostSeen(currentPost.id);
    setViewerDirection("prev");
    setViewerIndex(viewerIndex - 1);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts, markPostSeen]);

  const handleShare = async (post: IngestedPost) => {
    const shareUrl = buildShareUrl(post);

    try {
      if (navigator.share) {
        await navigator.share({
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setCopySuccessId(post.id);
      window.setTimeout(() => {
        setCopySuccessId((prev) => (prev === post.id ? null : prev));
      }, 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccessId(post.id);
        window.setTimeout(() => {
          setCopySuccessId((prev) => (prev === post.id ? null : prev));
        }, 1600);
      } catch {
        //
      }
    }
  };

  const handleOpenPost = (post: IngestedPost) => {
    markPostSeen(post.id);

    if (isVideoViewerPost(post)) {
      openViewerByPost(post);
      return;
    }

    openTextReader(post);
  };

  const toggleTag = (tag: ContentTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const hasSubscriptions = subscriptionHandles.length > 0;
  const hasBubbles = subscriptionBubbles.length > 0;

  const renderedPosts = useMemo(
    () => visiblePosts.slice(0, renderCount),
    [visiblePosts, renderCount]
  );

  const likedPostIdSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);

  // Saved/liked cabinet moved to CreatorScreen. Keep likes set for cards only.

  const toggleFeedCountry = useCallback(
    (country: string) => {
      const normalizedCountry = String(country || "").trim().toLowerCase();
      if (!normalizedCountry) return;

      setFeedSettings((prev) => {
        const currentCountry = String(locale).toLowerCase();
        const favoriteCountries = normalizeFavoriteCountries(
          prev.favoriteCountries || prev.countries || [currentCountry],
          currentCountry
        );
        const favoriteSet = new Set(favoriteCountries);

        if (normalizedCountry !== currentCountry && !favoriteSet.has(normalizedCountry)) {
          return prev;
        }

        const current = normalizeFeedCountries(
          prev.countries.length ? prev.countries : [currentCountry],
          currentCountry
        );
        const exists = current.includes(normalizedCountry);

        if (exists) {
          if (current.length <= 1) return prev;

          const nextCountries = current.filter((item) => item !== normalizedCountry);
          return {
            ...prev,
            countries: nextCountries.length ? nextCountries : [currentCountry],
            favoriteCountries,
          };
        }

        return {
          ...prev,
          countries: normalizeFeedCountries([...current, normalizedCountry], currentCountry),
          favoriteCountries,
        };
      });
    },
    [locale]
  );

  const toggleFavoriteCountry = useCallback(
    (country: string) => {
      const normalizedCountry = String(country || "").trim().toLowerCase();
      if (!normalizedCountry) return;

      setFeedSettings((prev) => {
        const currentCountry = String(locale).toLowerCase();
        if (normalizedCountry === currentCountry) return prev;

        const favoriteCountries = normalizeFavoriteCountries(
          prev.favoriteCountries || prev.countries || [currentCountry],
          currentCountry
        );
        const exists = favoriteCountries.includes(normalizedCountry);

        if (exists) {
          const nextFavorites = normalizeFavoriteCountries(
            favoriteCountries.filter((item) => item !== normalizedCountry),
            currentCountry
          );
          const nextCountries = normalizeFeedCountries(
            prev.countries.filter((item) => item !== normalizedCountry),
            currentCountry
          );

          return {
            ...prev,
            countries: nextCountries,
            favoriteCountries: nextFavorites,
          };
        }

        const extraFavorites = favoriteCountries.filter((item) => item !== currentCountry);
        if (extraFavorites.length >= 4) return prev;

        const nextFavorites = normalizeFavoriteCountries(
          [...favoriteCountries, normalizedCountry],
          currentCountry
        );

        return {
          ...prev,
          countries: normalizeFeedCountries([...prev.countries, normalizedCountry], currentCountry),
          favoriteCountries: nextFavorites,
        };
      });
    },
    [locale]
  );

  const hasActiveFeedFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;
  const shouldShowClearFeedFilters =
    !tagsOpen &&
    feedSettings.mediaMode !== "chat" &&
    hasActiveFeedFilters &&
    visiblePosts.length > 0;
  const shouldShowFeedRefresh =
    !tagsOpen &&
    feedSettings.mediaMode === "all" &&
    !hasActiveFeedFilters &&
    visiblePosts.length > 0;

  const clearFeedFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedTags([]);
    setRenderCount(INITIAL_RENDER_POSTS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const detectedTagOptions = useMemo(() => {
    return SITE_TAG_GROUPS
      .map((group) => ({
        value: group.value as ContentTag,
        emoji: group.emoji,
        label: resolveTagLabel(group.value, locale) || group.value,
        count: tagStats[group.value as ContentTag] ?? 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 28);
  }, [locale, tagStats]);

  const shouldShowTopSearch =
    !tagsOpen &&
    viewerIndex === null &&
    textReaderPost === null &&
    (searchPanelOpen || searchOverlayOpen || searchQuery.trim().length > 0);

  const renderFeedCards = (items: IngestedPost[]) =>
    items.map((post) => {
      const ownerTelegramId = post.addedBy?.telegramId ?? null;

      const isOwner =
        !!currentTelegramUserId &&
        !!ownerTelegramId &&
        currentTelegramUserId === ownerTelegramId;

      const isAdmin =
        !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

      return (
        <div
          key={post.id}
          ref={(node) => registerFeedCardNode(post.id, node)}
          data-feed-post-id={post.id}
          onPointerDownCapture={(event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const opensMedia =
              target.closest("img") ||
              target.closest("video") ||
              target.closest("[data-feed-media]");

            if (opensMedia) {
              closeFloatingPanels();
            }
          }}
          onClickCapture={(event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            const opensMedia =
              target.closest("img") ||
              target.closest("video") ||
              target.closest("[data-feed-media]");

            if (opensMedia) {
              closeFloatingPanels();
            }
          }}
        >
          <FeedCard
            post={post}
            locale={locale}
            isOwner={isOwner}
            isAdmin={isAdmin}
            menuOpen={menuPostId === post.id}
            onToggleMenu={() =>
              setMenuPostId((prev) => (prev === post.id ? null : post.id))
            }
            onDelete={() => {
              void onDeletePost(post.id);
            }}
            onHide={() => onHidePost(post.id)}
            onOpen={() => handleOpenPost(post)}
            onOpenCreator={() => openSource(post.source.handle)}
            onSeen={() => markPostSeen(post.id)}
            mediaIndex={feedMediaIndexes[post.id] || 0}
            onChangeMediaIndex={(next: number) =>
              setFeedCardMediaIndex(post.id, next)
            }
            liked={likedPostIdSet.has(post.id)}
            onToggleLike={() => onToggleLike(post.id)}
            onShare={() => {
              void handleShare(post);
            }}
          />
        </div>
      );
    });

  return (
    <div className="min-h-screen bg-app pt-16 text-primary" style={{ paddingTop: "var(--app-header-offset)" }}>
      {feedSettings.mediaMode === "chat" ? (
        <SpaceOverlay
          locale={locale}
          onClose={() => {
            setFeedSettings((prev) => ({ ...prev, mediaMode: "all" }));
          }}
        />
      ) : null}

      <FeedHeader
        locale={locale}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        clearTags={clearTags}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tagsOpen={tagsOpen}
        setTagsOpen={setTagsOpen}
        resultsCount={visiblePosts.length}
        tagStats={tagStats}
      />

      {!tagsOpen ? (
        <SmartFeedBar
          copy={copy}
          mediaMode={feedSettings.mediaMode}
onChangeMediaMode={changeFeedMediaMode}
          locale={locale}
          floating
          visible={
            showFloatingSmartBar &&
            !searchOverlayOpen &&
            searchQuery.trim().length === 0 &&
            viewerIndex === null &&
            textReaderPost === null
          }
          availableCountries={availableCountryOptions}
          selectedCountries={feedSettings.countries}
          favoriteCountries={feedSettings.favoriteCountries}
          onToggleCountry={toggleFeedCountry}
          onToggleFavoriteCountry={toggleFavoriteCountry}          
        />
      ) : null}

{!tagsOpen ? (
        <SmartFeedBar
          copy={copy}
          mediaMode={feedSettings.mediaMode}
onChangeMediaMode={changeFeedMediaMode}
          locale={locale}
          availableCountries={availableCountryOptions}
          selectedCountries={feedSettings.countries}
          favoriteCountries={feedSettings.favoriteCountries}
          onToggleCountry={toggleFeedCountry}
          onToggleFavoriteCountry={toggleFavoriteCountry}
        />        
      ) : null}

      {shouldShowTopSearch ? (
        <FeedTopSearch
          locale={locale}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          detectedTags={detectedTagOptions}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          categoriesOpen={searchCategoriesOpen}
          onToggleCategories={() => setSearchCategoriesOpen((prev) => !prev)}
          forceFloating={searchOverlayOpen || searchQuery.trim().length > 0}
          onCloseFloating={() => {
            setSearchOverlayOpen(false);
            setSearchCategoriesOpen(false);
            setSearchPanelOpen(true);
          }}
          onActivateFloating={() => setSearchOverlayOpen(true)}
        />
      ) : null}

{!tagsOpen && subscriptionsPanelOpen ? (
        subscriptionsOverlayOpen && typeof document !== "undefined" ? (
          createPortal(
            <div className="fixed inset-x-0 top-[var(--app-header-offset)] z-[80] mx-auto w-full max-w-[570px] bg-gradient-to-b from-[rgba(18,31,44,.72)] via-[rgba(18,31,44,.44)] to-transparent pb-5 pt-2 backdrop-blur-xl dark:from-[rgba(18,31,44,.72)] dark:via-[rgba(18,31,44,.44)]">
              {!hasSubscriptions ? (
                <SubscriptionsHint text={copy.subscriptionsHint} />
              ) : hasBubbles ? (
                <SubscriptionsBar
                  items={subscriptionBubbles}
                  onOpen={(handle) => {
                    const bubble = subscriptionBubbles.find((item) => item.handle === handle);

                    if (bubble) {
                      setSeenSubscriptionPosts((prev) => {
                        const next = {
                          ...prev,
                          [handle]: Math.max(prev[handle] ?? 0, bubble.latestPostId),
                        };
                        writeSeenSubscriptionsToStorage(next);
                        return next;
                      });
                    }

                    setSubscriptionsOverlayOpen(false);
                    openSource(handle);
                  }}
                />
              ) : (
                <SubscriptionsHint text={copy.subscriptionsHint} />
              )}
            </div>,
            document.body
          )
        ) : !hasSubscriptions ? (
          <SubscriptionsHint text={copy.subscriptionsHint} />
        ) : hasBubbles ? (
          <SubscriptionsBar
            items={subscriptionBubbles}
            onOpen={(handle) => {
              const bubble = subscriptionBubbles.find((item) => item.handle === handle);

              if (bubble) {
                setSeenSubscriptionPosts((prev) => {
                  const next = {
                    ...prev,
                    [handle]: Math.max(prev[handle] ?? 0, bubble.latestPostId),
                  };
                  writeSeenSubscriptionsToStorage(next);
                  return next;
                });
              }

              openSource(handle);
            }}
          />
        ) : (
          <SubscriptionsHint text={copy.subscriptionsHint} />
        )
      ) : null}

            {actionError ? (
        <div className="mx-auto mb-3 w-full max-w-[570px] px-4">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        </div>
      ) : null}

      {!isFeedLoading && visiblePosts.length === 0 ? (
        <div className="mx-auto mt-2 w-full max-w-[570px] px-4">
          <div className="rounded-[28px] border border-soft bg-surface px-6 py-8 text-center shadow-soft">
            <img
              src="/no_searsh.png"
              alt={copy.emptyTitle}
              className="mx-auto mb-4 h-28 w-28 object-contain"
              draggable={false}
            />

            <div className="text-[28px] font-semibold text-primary">
              {copy.emptyTitle}
            </div>

            <div className="mx-auto mt-3 max-w-[260px] text-base leading-7 text-secondary">
              {copy.emptyText}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                clearTags();
                setFeedSettings((prev) => ({
                  ...prev,
                  mediaMode: "all",
                }));
              }}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-strong px-6 py-3 text-sm font-medium text-strong-foreground bg-strong-hover"
            >
              {copy.clearAll}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[570px]">
        {feedSettings.mediaMode === "chat" ? null : feedSettings.mediaMode === "video" ? (
          <VideoGridView
            posts={renderedPosts}
            locale={locale}
            registerFeedCardNode={registerFeedCardNode}
            onOpenPost={handleOpenPost}
            onSeen={markPostSeen}
          />
        ) : (
          renderFeedCards(renderedPosts)
        )}
      </div>

      {shouldShowClearFeedFilters ? (
        <div className="mx-auto w-full max-w-[570px] px-4 py-5">
          <button
            type="button"
            onClick={clearFeedFilters}
            className="w-full rounded-2xl border border-soft bg-surface-soft px-4 py-3 text-sm font-medium text-primary transition hover:bg-surface"
          >
            {copy.clearAll}
          </button>
        </div>
      ) : shouldShowFeedRefresh ? (
        <div className="mx-auto w-full max-w-[570px] px-4 py-5">
          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
              window.location.reload();
            }}
            className="w-full rounded-2xl border border-soft bg-surface-soft px-4 py-3 text-sm font-medium text-primary transition hover:bg-surface"
          >
            {(() => {
              const FEED_END = {
                us: "Refresh feed",
                ru: "Обновить ленту",
                ua: "Оновити стрічку",
                in: "Refresh feed",
                ir: "به‌روزرسانی فید",
                de: "Feed aktualisieren",
                es: "Actualizar feed",
                tr: "Akışı yenile",
                fr: "Actualiser le fil",
                it: "Aggiorna feed",
                br: "Atualizar feed",
                kz: "Лентаны жаңарту",
                uz: "Lentani yangilash",
                ae: "تحديث الخلاصة",
                eg: "تحديث الخلاصة",
                pk: "Refresh feed",
                id: "Muat ulang feed",
                mx: "Actualizar feed",
                sa: "تحديث الخلاصة",
                ar: "Actualizar feed",
                co: "Actualizar feed",
                za: "Refresh feed",
                ng: "Refresh feed",
                cn: "刷新内容流",
                my: "Segarkan feed",
              } as const;

              return (FEED_END[locale] ?? FEED_END.us);
            })()}
          </button>
        </div>
      ) : null}

      <FeedViewer
        locale={locale}
        activePost={activePost}
        viewerDirection={viewerDirection}
        expandedCaption={expandedCaption}
        setExpandedCaption={setExpandedCaption}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        copySuccessId={copySuccessId}
        menuPostId={menuPostId}
        setMenuPostId={setMenuPostId}
        actionError={actionError}
        videoProgress={videoProgress}
        viewerMediaIndex={viewerMediaIndex}
        setViewerMediaIndex={setViewerMediaIndex}
        likedPostIds={likedPostIds}
        savedPostIds={savedPostIds}
        onToggleLike={() => {}}
        onToggleSave={onToggleSave}
        onHidePost={onHidePost}
        onDeletePost={onDeletePost}
        currentTelegramUserId={currentTelegramUserId}
        openSource={openSource}
        closeViewer={closeViewer}
        nextViewer={nextViewer}
        prevViewer={prevViewer}
        handleShare={handleShare}
        setActionError={setActionError}
      />

      <FeedTextReaderModal
        post={textReaderPost}
        locale={locale}
        liked={false}
        saved={!!textReaderPost && savedPostIds.includes(textReaderPost.id)}
        onClose={closeViewer}
        onToggleLike={() => {}}
        onToggleSave={onToggleSave}
        openSource={openSource}
      />
    </div>
  );
}