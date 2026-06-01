import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../types/app";
import type { ContentTag, IngestedPost } from "../types/app";
import { getParentTag, isChildTag, isParentTag } from "../lib/tag-utils";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
import { TrendsView } from "./feed/TrendsView";
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
import { buildShareUrl, getResolvedTags } from "./feed/feed.utils";

const SELECTED_TAGS_STORAGE_KEY = "margelet_feed_selected_tags";
const FEED_SEARCH_STORAGE_KEY = "margelet_feed_search";
const SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscriptions";
const SEEN_SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscription_seen_posts";
const FEED_SETTINGS_STORAGE_KEY = "margelet_feed_settings_v1";
const SEEN_POSTS_STORAGE_KEY = "margelet_seen_posts_v1";
const MAX_SEEN_POSTS_STORAGE_ITEMS = 6000;
const INITIAL_RENDER_POSTS = 18;
const RENDER_POSTS_STEP = 12;
const LOAD_MORE_DISTANCE_PX = 900;

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
  return post.contentType === "video";
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

  const queues = Array.from(groups.entries())
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => parsePostTime(b.items[0]) - parsePostTime(a.items[0]));

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
    else if (parsed?.mediaMode === "trends") mediaMode = "trends";
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
  const lastScrollYRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
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
    setSearchQuery(readSearchQueryFromStorage());
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
    writeFeedSettingsToStorage(feedSettings);
  }, [feedSettings]);

  useEffect(() => {
    if (!seenPostsHydratedRef.current) return;
    writeSeenPostsToStorage(seenPosts);
  }, [seenPosts]);


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

  {!tagsOpen && showFloatingSmartBar ? <div className="h-[74px]" /> : null}

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

  const openViewerByPost = useCallback(
    (post: IngestedPost) => {
      const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
      if (nextIndex === -1) return;

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
    [viewerPosts]
  );

  const openTextReader = useCallback((post: IngestedPost) => {
    setViewerIndex(null);
    setTextReaderPost(post);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  }, []);

  const closeViewer = useCallback(() => {
    setViewerDirection(null);
    setViewerIndex(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("next");
    setViewerIndex((viewerIndex + 1) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("prev");
    setViewerIndex((viewerIndex - 1 + viewerPosts.length) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

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

  return (
    <div className="min-h-screen bg-app pt-16 text-primary" style={{ paddingTop: "var(--app-header-offset)" }}>
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
          onChangeMediaMode={(next) =>
            setFeedSettings((prev) => ({
              ...prev,
              mediaMode: next,
            }))
          }
          locale={locale}
          floating
          visible={
            showFloatingSmartBar &&
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

      {!tagsOpen && feedSettings.mediaMode !== "trends" && !hasSubscriptions ? (
        <SubscriptionsHint text={copy.subscriptionsHint} />
      ) : null}

      {!tagsOpen && feedSettings.mediaMode !== "trends" && hasSubscriptions && hasBubbles ? (
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
      ) : null}

      {!tagsOpen ? (
        <SmartFeedBar
          copy={copy}
          mediaMode={feedSettings.mediaMode}
          onChangeMediaMode={(next) =>
            setFeedSettings((prev) => ({
              ...prev,
              mediaMode: next,
            }))
          }
          locale={locale}
          availableCountries={availableCountryOptions}
          selectedCountries={feedSettings.countries}
          favoriteCountries={feedSettings.favoriteCountries}
          onToggleCountry={toggleFeedCountry}
          onToggleFavoriteCountry={toggleFavoriteCountry}
        />        
      ) : null}

      {!tagsOpen && feedSettings.mediaMode !== "trends" && hasSubscriptions && !hasBubbles ? (
        <SubscriptionsHint text={copy.subscriptionsHint} />
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
        {feedSettings.mediaMode === 'trends' ? (
          <TrendsView countryCode={feedSettings.countries[0] || locale} locale={locale} />
        ) : (
          renderedPosts.map((post) => {
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
              >
                <FeedCard
                  post={post}
                  searchQuery={searchQuery}
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
                  liked={likedPostIds.includes(post.id)}
                  onToggleLike={() => onToggleLike(post.id)}
                  onShare={() => {
                    void handleShare(post);
                  }}
                />
              </div>
            );
          })
        )}
      </div>

      {!tagsOpen && visiblePosts.length > 0 ? (
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
        onClose={() => setTextReaderPost(null)}
        onToggleLike={() => {}}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}