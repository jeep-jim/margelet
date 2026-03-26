import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MoreVertical,
  Play,
  Volume2,
  VolumeX,
  Pause,
  ChevronDown,
  X,
  Send,
  Trash2,
  EyeOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { ContentTag, FeedTag, Locale, Video } from "../types/app";

type Props = {
  locale: Locale;
  videos: Video[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  openSource: (channel: string) => void;
};

type FeedMode = "new" | "rising" | "trending";

type TgUser = {
  id: string;
  first_name?: string;
  username?: string;
  photo_url?: string;
};

type MediaItem = {
  type: "image" | "video";
  url: string | null;
  previewUrl?: string | null;
};

const TG_STORAGE_KEY = "margelet_tg_user";
const HIDDEN_POSTS_STORAGE_KEY = "margelet_hidden_posts";

const MODE_OPTIONS: { value: FeedMode; label: string }[] = [
  { value: "new", label: "Новое" },
  { value: "rising", label: "Взлетает" },
  { value: "trending", label: "Тренды" },
];

const TAG_OPTIONS: { value: FeedTag; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "people", label: "Люди" },
  { value: "animals", label: "Животные" },
  { value: "news", label: "Новости" },
  { value: "business", label: "Бизнес" },
  { value: "creativity", label: "Творчество" },
  { value: "finance", label: "Финансы" },
  { value: "education", label: "Образование" },
  { value: "technology", label: "Технологии" },
  { value: "memes", label: "Мемы" },
  { value: "sports", label: "Спорт" },
  { value: "music", label: "Музыка" },
  { value: "travel", label: "Путешествия" },
  { value: "food", label: "Еда" },
  { value: "other", label: "Другое" },
];

function getResolvedTag(video: Video): ContentTag {
  return video.tag || "other";
}

function getTagLabel(tag: FeedTag) {
  return TAG_OPTIONS.find((item) => item.value === tag)?.label || "Все";
}

function isAvatarUrl(value?: string | null) {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

function getDisplayText(video: Video, locale: Locale) {
  const caption = video.caption?.[locale]?.trim();
  const title = video.title?.[locale]?.trim();

  if (caption) return caption;

  if (title && !/^video from @|^post from @|^видео из @|^пост из @/i.test(title)) {
    return title;
  }

  return video.channel || "";
}

function buildShareUrl(video: Video) {
  const cleanHandle = (video.handle || video.channel || "telegram")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

  return `${window.location.origin}/#/${cleanHandle}/${video.id}`;
}

function getCurrentTelegramUser(): TgUser | null {
  try {
    const raw = localStorage.getItem(TG_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TgUser;
  } catch {
    return null;
  }
}

function getHiddenPostIds(): number[] {
  try {
    const raw = localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

function setHiddenPostIds(ids: number[]) {
  localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(ids));
}

function getMediaItems(video: Video): MediaItem[] {
  const rawMedia =
    ((video as any).mediaItems as any[]) ||
    ((video as any).media as any[]) ||
    [];

  if (Array.isArray(rawMedia) && rawMedia.length > 0) {
    const normalized = rawMedia
      .map((item) => {
        const type =
          item?.type === "video" ? "video" : "image";
        const url =
          typeof item?.url === "string" && item.url.trim()
            ? item.url.trim()
            : typeof item?.src === "string" && item.src.trim()
              ? item.src.trim()
              : null;

        const previewUrl =
          typeof item?.previewUrl === "string" && item.previewUrl.trim()
            ? item.previewUrl.trim()
            : typeof item?.poster === "string" && item.poster.trim()
              ? item.poster.trim()
              : url;

        if (!url && !previewUrl) return null;

        return {
          type,
          url,
          previewUrl: previewUrl || null,
        } satisfies MediaItem;
      })
      .filter(Boolean) as MediaItem[];

    if (normalized.length > 0) {
      return normalized;
    }
  }

  if (video.mediaType === "video") {
    return [
      {
        type: "video",
        url: video.videoUrl || null,
        previewUrl: video.previewUrl || null,
      },
    ];
  }

  return [
    {
      type: "image",
      url: video.previewUrl || null,
      previewUrl: video.previewUrl || null,
    },
  ];
}

function SourceAvatar({
  video,
  size = "md",
}: {
  video: Video;
  size?: "sm" | "md";
}) {
  const boxClass =
    size === "sm" ? "h-10 w-10 text-sm" : "h-11 w-11 text-sm";

  if (isAvatarUrl(video.avatar)) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-neutral-200 ${boxClass}`}
      >
        <img
          src={video.avatar}
          alt={video.channel}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-bold text-neutral-900 ${boxClass}`}
    >
      {video.avatar}
    </div>
  );
}

function SourceHeader({
  video,
  compact = false,
  onOpenCreator,
}: {
  video: Video;
  compact?: boolean;
  onOpenCreator: () => void;
}) {
  return (
    <button
      onClick={onOpenCreator}
      className={`flex items-center gap-3 text-left ${compact ? "" : "px-4 pt-4 pb-3"}`}
      type="button"
    >
      <SourceAvatar video={video} size="sm" />

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[18px] font-semibold leading-tight text-neutral-950">
            {video.channel}
          </div>
          {video.channelVerified ? (
            <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
          ) : null}
        </div>
        <div className="truncate text-sm text-neutral-500">{video.handle}</div>
      </div>
    </button>
  );
}

function FeedMetric({
  icon: Icon,
  value,
  active = false,
  onClick,
  filledClassName,
  idleClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
  filledClassName?: string;
  idleClassName?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-neutral-950"
      type="button"
    >
      <Icon
        className={`h-5 w-5 ${
          active
            ? filledClassName || "fill-current text-neutral-950"
            : idleClassName || "text-neutral-950"
        }`}
      />
      <span className="text-[15px] font-medium">{value}</span>
    </button>
  );
}

function CardMediaDots({
  count,
  activeIndex,
}: {
  count: number;
  activeIndex: number;
}) {
  if (count <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/25 px-2 py-1 backdrop-blur-sm">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index === activeIndex ? "bg-white" : "bg-white/45"
          }`}
        />
      ))}
    </div>
  );
}

function FeedCard({
  video,
  locale,
  liked,
  saved,
  expanded,
  menuOpen,
  canDelete,
  hideError,
  deleteError,
  deleting,
  mediaIndex,
  onOpen,
  onOpenCreator,
  onToggleLike,
  onToggleSave,
  onToggleExpand,
  onToggleMenu,
  onDelete,
  onHide,
  onPrevMedia,
  onNextMedia,
}: {
  video: Video;
  locale: Locale;
  liked: boolean;
  saved: boolean;
  expanded: boolean;
  menuOpen: boolean;
  canDelete: boolean;
  hideError: string;
  deleteError: string;
  deleting: boolean;
  mediaIndex: number;
  onOpen: () => void;
  onOpenCreator: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onToggleExpand: () => void;
  onToggleMenu: () => void;
  onDelete: () => void;
  onHide: () => void;
  onPrevMedia: () => void;
  onNextMedia: () => void;
}) {
  const displayText = getDisplayText(video, locale);
  const mediaItems = getMediaItems(video);
  const activeMedia = mediaItems[Math.max(0, Math.min(mediaIndex, mediaItems.length - 1))];
  const showExpand = displayText.length > 110;

  return (
    <article className="overflow-hidden border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <SourceHeader video={video} compact onOpenCreator={onOpenCreator} />

        <div className="relative">
          <button
            className="rounded-full p-2 text-neutral-700"
            type="button"
            onClick={onToggleMenu}
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-20 min-w-[220px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl">
              {canDelete ? (
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deleting ? "Удаляем..." : "Удалить пост"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onHide}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-neutral-700 transition hover:bg-neutral-50"
                >
                  <EyeOff className="h-4 w-4" />
                  <span>Не показывать мне этот пост</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="relative mt-3 block w-full bg-neutral-100">
        <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-200 sm:aspect-[9/12]">
          {activeMedia?.previewUrl ? (
            <img
              src={activeMedia.previewUrl}
              alt={displayText || video.channel}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
              onClick={onOpen}
            />
          ) : (
            <div
              className="absolute inset-0 bg-neutral-200"
              onClick={onOpen}
            />
          )}

          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={onPrevMedia}
                className="absolute left-0 top-0 z-10 h-full w-1/4"
                aria-label="Предыдущее медиа"
              />
              <button
                type="button"
                onClick={onNextMedia}
                className="absolute right-0 top-0 z-10 h-full w-1/4"
                aria-label="Следующее медиа"
              />
            </>
          )}

          <div className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            {activeMedia?.type || video.mediaType}
          </div>

          <div className="absolute right-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {getTagLabel(getResolvedTag(video))}
          </div>

          {(activeMedia?.type === "video" || video.mediaType === "video") && video.duration ? (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {video.duration}
            </div>
          ) : null}

          <CardMediaDots count={mediaItems.length} activeIndex={mediaIndex} />
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <FeedMetric
              icon={Heart}
              value={video.likes}
              active={liked}
              onClick={onToggleLike}
              filledClassName="fill-current text-neutral-950"
            />
          </div>

          <button
            className="rounded-full p-1 text-neutral-900"
            onClick={onToggleSave}
            type="button"
          >
            <Bookmark
              className={`h-6 w-6 ${
                saved ? "fill-current text-neutral-950" : "text-neutral-900"
              }`}
            />
          </button>
        </div>

        <div className={`text-[15px] leading-6 text-neutral-900 ${expanded ? "" : "line-clamp-2"}`}>
          {displayText}
        </div>

        {showExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="mt-1 text-sm font-medium text-neutral-500"
          >
            {expanded ? "свернуть" : "ещё"}
          </button>
        )}

        {hideError ? (
          <div className="mt-2 text-xs font-medium text-rose-600">{hideError}</div>
        ) : null}

        {deleteError ? (
          <div className="mt-2 text-xs font-medium text-rose-600">{deleteError}</div>
        ) : null}
      </div>
    </article>
  );
}

function ViewerMetric({
  icon: Icon,
  value,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
      type="button"
    >
      <Icon
        className={`h-8 w-8 ${
          active ? "fill-current text-white" : "text-white"
        }`}
      />
      {value !== "" ? <span className="text-sm font-medium">{value}</span> : null}
    </button>
  );
}

export function FeedScreen({
  locale,
  videos,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  openSource,
}: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("new");
  const [activeTag, setActiveTag] = useState<FeedTag>("all");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);

  const [hiddenPostIds, setHiddenPostIdsState] = useState<number[]>([]);
  const [locallyDeletedPostIds, setLocallyDeletedPostIds] = useState<number[]>([]);
  const [expandedCardIds, setExpandedCardIds] = useState<number[]>([]);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [deleteErrorById, setDeleteErrorById] = useState<Record<number, string>>({});
  const [hideErrorById, setHideErrorById] = useState<Record<number, string>>({});
  const [cardMediaIndexes, setCardMediaIndexes] = useState<Record<number, number>>({});
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionScrollRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const currentUser = useMemo(() => getCurrentTelegramUser(), []);

  useEffect(() => {
    setHiddenPostIdsState(getHiddenPostIds());
  }, []);

  const preferredTags = useMemo(() => {
    const source = videos.filter(
      (video) =>
        likedPostIds.includes(video.id) || savedPostIds.includes(video.id)
    );

    const counts = new Map<ContentTag, number>();

    source.forEach((video) => {
      const tag = getResolvedTag(video);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [videos, likedPostIds, savedPostIds]);

  const visibleVideos = useMemo(() => {
    let list = [...videos];

    list = list.filter(
      (video) =>
        !hiddenPostIds.includes(video.id) &&
        !locallyDeletedPostIds.includes(video.id)
    );

    if (activeTag !== "all") {
      list = list.filter((video) => getResolvedTag(video) === activeTag);
    }

    if (feedMode === "new") {
      list.sort((a, b) => b.id - a.id);
      return list;
    }

    if (feedMode === "trending") {
      list.sort((a, b) => b.likes - a.likes);
      return list;
    }

    list.sort((a, b) => {
      const aTag = getResolvedTag(a);
      const bTag = getResolvedTag(b);

      const aScore =
        a.likes * 1.2 +
        (likedPostIds.includes(a.id) ? 6 : 0) +
        (savedPostIds.includes(a.id) ? 8 : 0) +
        (preferredTags.includes(aTag) ? 4 : 0);

      const bScore =
        b.likes * 1.2 +
        (likedPostIds.includes(b.id) ? 6 : 0) +
        (savedPostIds.includes(b.id) ? 8 : 0) +
        (preferredTags.includes(bTag) ? 4 : 0);

      return bScore - aScore;
    });

    return list;
  }, [videos, hiddenPostIds, locallyDeletedPostIds, activeTag, feedMode, likedPostIds, savedPostIds, preferredTags]);

  const activeVideo = useMemo(() => {
    if (viewerIndex === null) return null;
    return visibleVideos[viewerIndex] ?? null;
  }, [viewerIndex, visibleVideos]);

  const activeMediaItems = activeVideo ? getMediaItems(activeVideo) : [];
  const activeMedia =
    activeMediaItems[Math.max(0, Math.min(viewerMediaIndex, Math.max(0, activeMediaItems.length - 1)))] || null;

  const activeLiked = activeVideo ? likedPostIds.includes(activeVideo.id) : false;
  const activeSaved = activeVideo ? savedPostIds.includes(activeVideo.id) : false;
  const activeSaveCount = activeSaved ? 1 : 0;
  const activeDisplayText = activeVideo ? getDisplayText(activeVideo, locale) : "";

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
  };

  const closeViewer = () => {
    setViewerIndex(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
  };

  const nextViewer = () => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerIndex((viewerIndex + 1) % visibleVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
  };

  const prevViewer = () => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerIndex((viewerIndex - 1 + visibleVideos.length) % visibleVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
  };

  const nextCardMedia = (postId: number, mediaCount: number) => {
    setCardMediaIndexes((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % mediaCount,
    }));
  };

  const prevCardMedia = (postId: number, mediaCount: number) => {
    setCardMediaIndexes((prev) => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + mediaCount) % mediaCount,
    }));
  };

  const handleShare = async (video: Video) => {
    const shareUrl = buildShareUrl(video);

    try {
      if (navigator.share) {
        await navigator.share({
          title: video.channel,
          text: getDisplayText(video, locale),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setCopySuccessId(video.id);
      window.setTimeout(() => {
        setCopySuccessId((prev) => (prev === video.id ? null : prev));
      }, 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccessId(video.id);
        window.setTimeout(() => {
          setCopySuccessId((prev) => (prev === video.id ? null : prev));
        }, 1600);
      } catch {
        // ignore
      }
    }
  };

  const toggleCardExpand = (postId: number) => {
    setExpandedCardIds((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  const hidePost = (postId: number) => {
    try {
      const next = Array.from(new Set([...hiddenPostIds, postId]));
      setHiddenPostIdsState(next);
      setHiddenPostIds(next);
      setMenuPostId(null);
      setHideErrorById((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      setHideErrorById((prev) => ({
        ...prev,
        [postId]: "Не удалось скрыть пост",
      }));
    }
  };

  const canDeletePost = (video: Video) => {
    const createdByTelegramId = String((video as any).createdByTelegramId || "").trim();
    if (!createdByTelegramId) return false;
    if (!currentUser?.id) return false;
    return String(currentUser.id) === createdByTelegramId;
  };

  const deletePost = async (video: Video) => {
    try {
      setDeleteLoadingId(video.id);
      setDeleteErrorById((prev) => ({ ...prev, [video.id]: "" }));

      const res = await fetch("/api/delete-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: video.id,
          url: video.postUrl,
        }),
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      setLocallyDeletedPostIds((prev) => [...prev, video.id]);
      setMenuPostId(null);

      if (activeVideo?.id === video.id) {
        closeViewer();
      }
    } catch {
      setDeleteErrorById((prev) => ({
        ...prev,
        [video.id]: "Не удалось удалить пост",
      }));
    } finally {
      setDeleteLoadingId(null);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, activeVideo?.id, viewerMediaIndex]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (isPlaying) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  }, [isPlaying, activeVideo?.id, viewerMediaIndex]);

  useEffect(() => {
    if (!expandedCaption && captionScrollRef.current) {
      captionScrollRef.current.scrollTop = 0;
    }
  }, [expandedCaption, activeVideo?.id]);

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 text-neutral-950">
      <div className="mx-auto w-full max-w-[720px] px-4 py-3">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {MODE_OPTIONS.map((mode) => {
            const active = feedMode === mode.value;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setFeedMode(mode.value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-neutral-950 text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {mode.label}
              </button>
            );
          })}

          {activeTag !== "all" && (
            <button
              type="button"
              onClick={() => setActiveTag("all")}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm text-white"
            >
              <span>{getTagLabel(activeTag)}</span>
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setTagsOpen((v) => !v)}
            className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 transition ${
              tagsOpen
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
            }`}
            aria-label="Открыть теги"
            title="Открыть теги"
          >
            <ChevronDown className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {tagsOpen && (
          <div className="mt-3 flex flex-wrap gap-2">
            {TAG_OPTIONS.filter((tag) => tag.value !== "all").map((tag) => {
              const active = activeTag === tag.value;
              return (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => {
                    setActiveTag(tag.value);
                    setTagsOpen(false);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    active
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-[720px]">
        {visibleVideos.map((video, index) => {
          const mediaItems = getMediaItems(video);
          const mediaIndex = Math.max(
            0,
            Math.min(cardMediaIndexes[video.id] || 0, mediaItems.length - 1)
          );

          return (
            <FeedCard
              key={video.id}
              video={video}
              locale={locale}
              liked={likedPostIds.includes(video.id)}
              saved={savedPostIds.includes(video.id)}
              expanded={expandedCardIds.includes(video.id)}
              menuOpen={menuPostId === video.id}
              canDelete={canDeletePost(video)}
              hideError={hideErrorById[video.id] || ""}
              deleteError={deleteErrorById[video.id] || ""}
              deleting={deleteLoadingId === video.id}
              mediaIndex={mediaIndex}
              onOpen={() => openViewer(index)}
              onOpenCreator={() => openSource(video.channel)}
              onToggleLike={() => onToggleLike(video.id)}
              onToggleSave={() => onToggleSave(video.id)}
              onToggleExpand={() => toggleCardExpand(video.id)}
              onToggleMenu={() =>
                setMenuPostId((prev) => (prev === video.id ? null : video.id))
              }
              onDelete={() => deletePost(video)}
              onHide={() => hidePost(video.id)}
              onPrevMedia={() => prevCardMedia(video.id, mediaItems.length)}
              onNextMedia={() => nextCardMedia(video.id, mediaItems.length)}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <div className="relative h-full w-full overflow-hidden bg-black">
              <div className="absolute inset-0 bg-neutral-950" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-full w-full max-w-[520px] bg-black">
                  {activeMedia?.type === "video" && activeMedia.url ? (
                    <video
                      ref={videoRef}
                      src={activeMedia.url}
                      poster={activeMedia.previewUrl || undefined}
                      className="absolute inset-0 h-full w-full object-cover"
                      autoPlay
                      loop
                      playsInline
                      muted={isMuted}
                    />
                  ) : activeMedia?.previewUrl ? (
                    <img
                      src={activeMedia.previewUrl}
                      alt={activeDisplayText || activeVideo.channel}
                      className="absolute inset-0 h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900" />
                  )}

                  <div className="absolute inset-0 bg-black/20" />

                  <div className="absolute left-4 right-4 top-4 z-30 flex items-center justify-between">
                    <button
                      onClick={closeViewer}
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                      type="button"
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </button>

                    {activeMedia?.type === "video" && activeMedia.url ? (
                      <button
                        onClick={() => setIsMuted((v) => !v)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                        type="button"
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>

                  {activeMediaItems.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setViewerMediaIndex((prev) =>
                            (prev - 1 + activeMediaItems.length) % activeMediaItems.length
                          )
                        }
                        className="absolute left-0 top-0 z-20 h-full w-1/4"
                        aria-label="Предыдущее медиа"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setViewerMediaIndex((prev) =>
                            (prev + 1) % activeMediaItems.length
                          )
                        }
                        className="absolute right-0 top-0 z-20 h-full w-1/4"
                        aria-label="Следующее медиа"
                      />
                    </>
                  )}

                  <div
                    className="absolute inset-0 z-10"
                    onClick={() => {
                      if (expandedCaption) return;

                      if (activeMedia?.type === "video" && activeMedia.url) {
                        setIsPlaying((v) => !v);
                      }
                    }}
                    onTouchStart={(e) => {
                      touchStartYRef.current = e.touches[0].clientY;
                    }}
                    onTouchEnd={(e) => {
                      if (touchStartYRef.current === null || expandedCaption) {
                        touchStartYRef.current = null;
                        return;
                      }

                      const delta = touchStartYRef.current - e.changedTouches[0].clientY;

                      if (Math.abs(delta) > 60 && activeMediaItems.length <= 1) {
                        if (delta > 0) {
                          nextViewer();
                        } else {
                          prevViewer();
                        }
                      }

                      touchStartYRef.current = null;
                    }}
                  />

                  <div
                    className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${
                      activeMedia?.type === "video" && activeMedia.url && isPlaying
                        ? "pointer-events-none opacity-0"
                        : "opacity-100"
                    }`}
                  >
                    {activeMedia?.type === "video" && activeMedia.url ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPlaying((v) => !v);
                        }}
                        className="flex h-24 w-24 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
                        type="button"
                      >
                        {isPlaying ? (
                          <Pause className="h-12 w-12 text-white" />
                        ) : (
                          <Play className="ml-1 h-12 w-12 text-white" />
                        )}
                      </button>
                    ) : null}
                  </div>

                  <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-6">
                    <ViewerMetric
                      icon={Heart}
                      value={activeVideo.likes}
                      active={activeLiked}
                      onClick={() => onToggleLike(activeVideo.id)}
                    />
                    <ViewerMetric
                      icon={Bookmark}
                      value={activeSaveCount}
                      active={activeSaved}
                      onClick={() => onToggleSave(activeVideo.id)}
                    />
                    <ViewerMetric
                      icon={Send}
                      value=""
                      onClick={() => handleShare(activeVideo)}
                    />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-8 pt-20 text-white">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openSource(activeVideo.channel);
                      }}
                      className="mb-3 flex items-center gap-3 text-left"
                      type="button"
                    >
                      <SourceAvatar video={activeVideo} size="md" />

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className="truncate text-xl font-semibold">
                            {activeVideo.channel}
                          </div>
                          {activeVideo.channelVerified ? (
                            <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                          ) : null}
                        </div>
                        <div className="truncate text-sm text-white/75">
                          {activeVideo.handle}
                        </div>
                      </div>
                    </button>

                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
                      <span>{activeMedia?.type || activeVideo.mediaType}</span>
                      <span>•</span>
                      <span>{getTagLabel(getResolvedTag(activeVideo))}</span>
                      {(activeMedia?.type === "video" || activeVideo.mediaType === "video") && activeVideo.duration ? (
                        <>
                          <span>•</span>
                          <span>{activeVideo.duration}</span>
                        </>
                      ) : null}
                    </div>

                    {activeMediaItems.length > 1 ? (
                      <div className="mb-3 flex items-center gap-1.5">
                        {activeMediaItems.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1.5 w-1.5 rounded-full ${
                              index === viewerMediaIndex ? "bg-white" : "bg-white/45"
                            }`}
                          />
                        ))}
                      </div>
                    ) : null}

                    <div
                      ref={captionScrollRef}
                      className={`max-w-[82%] text-[16px] leading-6 text-white/95 ${
                        expandedCaption
                          ? "max-h-[34vh] overflow-y-auto overscroll-contain pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                          : "line-clamp-2"
                      }`}
                      style={{
                        WebkitOverflowScrolling: "touch",
                      }}
                      onClick={(e) => {
                        if (expandedCaption) e.stopPropagation();
                      }}
                      onWheel={(e) => {
                        if (expandedCaption) e.stopPropagation();
                      }}
                      onTouchStart={(e) => {
                        if (expandedCaption) e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        if (expandedCaption) e.stopPropagation();
                      }}
                    >
                      {activeDisplayText}
                    </div>

                    {activeDisplayText.length > 110 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCaption((v) => !v);
                        }}
                        className="mt-1 text-sm font-medium text-white/75"
                        type="button"
                      >
                        {expandedCaption ? "свернуть" : "ещё"}
                      </button>
                    )}

                    {copySuccessId === activeVideo.id ? (
                      <div className="mt-2 text-xs font-medium text-[#7dd3fc]">
                        Ссылка скопирована
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}