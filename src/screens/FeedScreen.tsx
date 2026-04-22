import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../types/app";
import type { ContentTag, IngestedPost } from "../types/app";
import { getParentTag, isChildTag, isParentTag } from "../lib/tag-utils";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
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

type FeedSettings = {
  mediaMode: FeedMediaMode;
  countries: string[];
  demoteSeen: boolean;
};

type SubscriptionBubble = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
  latestPostId: number;
};

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

function detectPostMediaMode(
  post: IngestedPost
): Exclude<FeedMediaMode, "all"> | "mixed" {
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
        demoteSeen: true,
      };
    }

    const parsed = JSON.parse(raw) as Partial<FeedSettings>;
    const mediaMode: FeedMediaMode =
      parsed?.mediaMode === "text" ||
      parsed?.mediaMode === "photo" ||
      parsed?.mediaMode === "video"
        ? parsed.mediaMode
        : "all";

    const countries = Array.isArray(parsed?.countries)
      ? parsed.countries
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      : [fallbackCountry];

    return {
      mediaMode,
      countries: countries.length ? countries : [fallbackCountry],
      demoteSeen: parsed?.demoteSeen !== false,
    };
  } catch {
    return {
      mediaMode: "all",
      countries: [fallbackCountry],
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
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
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
  const copy = FEED_SCREEN_COPY[locale] ?? FEED_SCREEN_COPY.en;

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
  const [seenPosts, setSeenPosts] = useState<Record<number, number>>({});
  const [initialSeenPosts, setInitialSeenPosts] = useState<Record<number, number>>({});  
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

  useEffect(() => {
    setSelectedTags(readSelectedTagsFromStorage());
    setSearchQuery(readSearchQueryFromStorage());
    setSubscriptionHandles(readSubscriptionsFromStorage());
    setSeenSubscriptionPosts(readSeenSubscriptionsFromStorage());
    setFeedSettings(readFeedSettingsFromStorage(locale));

    const storedSeenPosts = readSeenPostsFromStorage();
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
    writeSeenPostsToStorage(seenPosts);
  }, [seenPosts]);

  useEffect(() => {
    const localeCountry = String(locale).toLowerCase();

    setFeedSettings((prev) => {
      const normalized = prev.countries.map((item) => item.toLowerCase());

      if (normalized.includes(localeCountry)) {
        return prev;
      }

      return {
        ...prev,
        countries: [localeCountry, ...normalized],
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
    setSeenPosts((prev) => {
      if (prev[postId]) {
        return prev;
      }

      return {
        ...prev,
        [postId]: Date.now(),
      };
    });
  }, []);

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

    if (feedSettings.mediaMode !== "all") {
      list = list.filter((post) => {
        const detectedMode = detectPostMediaMode(post);
        if (feedSettings.mediaMode === "text") return detectedMode === "text";
        if (feedSettings.mediaMode === "photo") return detectedMode === "photo";
        if (feedSettings.mediaMode === "video") return detectedMode === "video";
        return true;
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

    const selectedCountries = feedSettings.countries.map((item) => item.toLowerCase());
    if (selectedCountries.length > 0) {
      list = list.filter((post) =>
        selectedCountries.includes(
          normalizeCountryCode(post.sourceCountryCode, locale)
        )
      );
    }

    if (feedSettings.mediaMode !== "all") {
      list = list.filter((post) => {
        const detectedMode = detectPostMediaMode(post);
        if (feedSettings.mediaMode === "text") return detectedMode === "text";
        if (feedSettings.mediaMode === "photo") return detectedMode === "photo";
        if (feedSettings.mediaMode === "video") return detectedMode === "video";
        return true;
      });
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

      list = [...unseen, ...seen];
    }    

    return list;
  }, [safePosts, feedSettings, selectedTags, searchQuery, locale, initialSeenPosts]);  

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
          onToggleCountry={(country) =>
            setFeedSettings((prev) => {
              const currentCountry = String(locale).toLowerCase();

              if (country === currentCountry) {
                return prev;
              }

              const exists = prev.countries.includes(country);

              return {
                ...prev,
                countries: exists
                  ? prev.countries.filter((item) => item !== country)
                  : [...prev.countries, country],
              };
            })
          }          
        />
      ) : null}

      {!tagsOpen && !hasSubscriptions ? (
        <SubscriptionsHint text={copy.subscriptionsHint} />
      ) : null}

      {!tagsOpen && hasSubscriptions && hasBubbles ? (
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
          onToggleCountry={(country) =>
            setFeedSettings((prev) => {
              const currentCountry = String(locale).toLowerCase();

              if (country === currentCountry) {
                return prev;
              }

              const exists = prev.countries.includes(country);

              return {
                ...prev,
                countries: exists
                  ? prev.countries.filter((item) => item !== country)
                  : [...prev.countries, country],
              };
            })
          }
        />        
      ) : null}

      {!tagsOpen && hasSubscriptions && !hasBubbles ? (
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
        {visiblePosts.map((post) => {
          const ownerTelegramId = post.addedBy?.telegramId ?? null;

          const isOwner =
            !!currentTelegramUserId &&
            !!ownerTelegramId &&
            currentTelegramUserId === ownerTelegramId;

          const isAdmin =
            !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

          return (
            <FeedCard
              key={post.id}
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
          );
        })}
      </div>

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