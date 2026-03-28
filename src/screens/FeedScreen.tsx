import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MoreVertical,
  Volume2,
  VolumeX,
  ChevronDown,
  X,
  Send,
  Trash2,
  EyeOff,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MutableRefObject,
} from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { ContentTag, FeedTag, Locale, PostMedia, Video } from "../types/app";

type Props = {
  locale: Locale;
  videos: Video[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (channel: string) => void;
};

type FeedMode = "new" | "rising" | "trending";
type ViewerDirection = "next" | "prev" | null;

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

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);
const DRAG_SWITCH_DISTANCE = 88;
const DRAG_SWITCH_VELOCITY = 430;
const HORIZONTAL_SWIPE_DISTANCE = 48;

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
  return caption || title || "";
}

function buildShareUrl(video: Video) {
  return video.postUrl || window.location.href;
}

function normalizeMediaList(video: Video): PostMedia[] {
  if (Array.isArray(video.media) && video.media.length > 0) {
    return video.media.filter(
      (item): item is PostMedia =>
        !!item &&
        (item.type === "image" || item.type === "video") &&
        typeof item.url === "string" &&
        !!item.url.trim()
    );
  }

  if (video.videoUrl) {
    return [
      {
        id: "video-1",
        type: "video",
        url: video.videoUrl,
        poster: video.previewUrl || null,
      },
    ];
  }

  if (video.previewUrl) {
    return [
      {
        id: "image-1",
        type: "image",
        url: video.previewUrl,
        poster: null,
      },
    ];
  }

  return [];
}

function parseDurationToSeconds(duration?: string) {
  if (!duration) return 0;

  const parts = duration.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
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
      {String(video.avatar || "TG").slice(0, 2).toUpperCase()}
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

function MoreMenu({
  isOwner,
  isAdmin,
  onDelete,
  onHide,
}: {
  isOwner: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onHide: () => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-40 min-w-[220px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
      {isOwner || isAdmin ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isAdmin && !isOwner ? "Удалить пост (admin)" : "Удалить пост"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onHide}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neutral-800 transition hover:bg-neutral-100"
        >
          <EyeOff className="h-4 w-4" />
          <span>Не показывать мне этот пост</span>
        </button>
      )}
    </div>
  );
}

function ExpandableFeedText({
  text,
}: {
  text: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [shouldClamp, setShouldClamp] = useState(false);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;

    const styles = window.getComputedStyle(node);
    const lineHeight = parseFloat(styles.lineHeight || "0");

    if (!lineHeight) {
      setShouldClamp(text.length > 120);
      return;
    }

    const maxHeight = lineHeight * 2 + 1;
    setShouldClamp(node.scrollHeight > maxHeight);
  }, [text]);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!text) return null;

  return (
    <div className="text-[15px] leading-6 text-neutral-900">
      <div className="relative">
        <div
          ref={measureRef}
          className={`${expanded ? "" : "line-clamp-2 pr-14"}`}
        >
          {text}
        </div>

        {shouldClamp && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute bottom-0 right-0 bg-white pl-2 text-sm font-medium text-neutral-500"
          >
            Ещё
          </button>
        ) : null}
      </div>

      {shouldClamp && expanded ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-sm font-medium text-neutral-500"
          >
            Свернуть
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ExpandableTextPostText({
  text,
}: {
  text: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [shouldClamp, setShouldClamp] = useState(false);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;

    const styles = window.getComputedStyle(node);
    const lineHeight = parseFloat(styles.lineHeight || "0");

    if (!lineHeight) {
      setShouldClamp(text.length > 400);
      return;
    }

    const maxHeight = lineHeight * 10 + 1;
    setShouldClamp(node.scrollHeight > maxHeight);
  }, [text]);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!text) return null;

  return (
    <div className="text-[15px] leading-7 text-neutral-900">
      <div className="relative">
        <div
          ref={measureRef}
          className={`${expanded ? "" : "line-clamp-[10] pr-14"}`}
        >
          {text}
        </div>

        {shouldClamp && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute bottom-0 right-0 bg-white pl-2 text-sm font-medium text-neutral-500"
          >
            Ещё
          </button>
        ) : null}
      </div>

      {shouldClamp && expanded ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-sm font-medium text-neutral-500"
          >
            Свернуть
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeedMediaSlide({
  item,
  displayText,
  className = "",
  active = true,
  muted = true,
  videoRef,
}: {
  item: PostMedia;
  displayText: string;
  className?: string;
  active?: boolean;
  muted?: boolean;
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const attachVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      localVideoRef.current = node;
      if (videoRef) {
        videoRef.current = node;
      }
    },
    [videoRef]
  );

  useEffect(() => {
    if (item.type !== "video") return;

    const node = localVideoRef.current;
    if (!node) return;

    node.muted = muted;

    if (active) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [active, muted, item.type, item.url]);

  if (item.type === "video") {
    return (
      <video
        ref={attachVideoRef}
        src={item.url}
        poster={item.poster || undefined}
        className={className || "absolute inset-0 h-full w-full object-cover"}
        muted={muted}
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={item.url}
      alt={displayText}
      className={className || "absolute inset-0 h-full w-full object-cover"}
      referrerPolicy="no-referrer"
    />
  );
}

function MediaDots({
  total,
  activeIndex,
  onSelect,
  light = false,
}: {
  total: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  light?: boolean;
}) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(index);
            }}
            className={`h-2.5 rounded-full transition-all ${
              active
                ? light
                  ? "w-5 bg-white"
                  : "w-5 bg-neutral-950"
                : light
                  ? "w-2.5 bg-white/45"
                  : "w-2.5 bg-neutral-950/35"
            }`}
            aria-label={`Переключить медиа ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

function SwipeCarousel({
  items,
  displayText,
  aspectClass,
  activeIndex,
  onChange,
  controlsTone = "light",
  mediaActive = true,
  muted = true,
  videoRef,
}: {
  items: PostMedia[];
  displayText: string;
  aspectClass: string;
  activeIndex: number;
  onChange: (next: number) => void;
  controlsTone?: "light" | "dark";
  mediaActive?: boolean;
  muted?: boolean;
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;
  const current = items[activeIndex];

  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden bg-neutral-200`}
      onTouchStart={(event) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartXRef.current;
        const endX = event.changedTouches[0]?.clientX ?? null;
        touchStartXRef.current = null;

        if (startX === null || endX === null) return;

        const delta = endX - startX;
        if (delta <= -HORIZONTAL_SWIPE_DISTANCE && canNext) {
          onChange(activeIndex + 1);
        }
        if (delta >= HORIZONTAL_SWIPE_DISTANCE && canPrev) {
          onChange(activeIndex - 1);
        }
      }}
    >
      <FeedMediaSlide
        item={current}
        displayText={displayText}
        className="absolute inset-0 h-full w-full object-cover"
        active={current.type === "video" ? mediaActive : true}
        muted={muted}
        videoRef={current.type === "video" ? videoRef : undefined}
      />

      {canPrev ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(activeIndex - 1);
          }}
          className={`absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light" ? "bg-black/35 text-white" : "bg-white/85 text-neutral-900"
          }`}
          aria-label="Предыдущее медиа"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(activeIndex + 1);
          }}
          className={`absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light" ? "bg-black/35 text-white" : "bg-white/85 text-neutral-900"
          }`}
          aria-label="Следующее медиа"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <MediaDots
        total={items.length}
        activeIndex={activeIndex}
        onSelect={onChange}
        light={controlsTone === "light"}
      />
    </div>
  );
}

function FeedCard({
  video,
  locale,
  isOwner,
  isAdmin,
  menuOpen,
  onToggleMenu,
  onDelete,
  onHide,
  onOpen,
  onOpenCreator,
  mediaIndex,
  onChangeMediaIndex,
}: {
  video: Video;
  locale: Locale;
  isOwner: boolean;
  isAdmin: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
  onHide: () => void;
  onOpen: () => void;
  onOpenCreator: () => void;
  mediaIndex: number;
  onChangeMediaIndex: (next: number) => void;
}) {
  const displayText = getDisplayText(video, locale);
  const mediaItems = normalizeMediaList(video);
  const mediaExists = mediaItems.length > 0;
  const cardRef = useRef<HTMLElement | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.6
        );
      },
      {
        threshold: [0, 0.25, 0.6, 0.85, 1],
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className="overflow-hidden border-b border-neutral-200 bg-white"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <SourceHeader video={video} compact onOpenCreator={onOpenCreator} />

        <div className="relative">
          <button
            className="rounded-full p-2 text-neutral-700"
            onClick={onToggleMenu}
            type="button"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen ? (
            <MoreMenu
              isOwner={isOwner}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onHide={onHide}
            />
          ) : null}
        </div>
      </div>

      {mediaExists ? (
        <button
          onClick={onOpen}
          className="relative mt-3 block w-full bg-neutral-100 text-left"
          type="button"
        >
          <SwipeCarousel
            items={mediaItems}
            displayText={displayText || video.channel}
            aspectClass="aspect-[9/10.2] sm:aspect-[9/9.8]"
            activeIndex={Math.min(mediaIndex, mediaItems.length - 1)}
            onChange={onChangeMediaIndex}
            controlsTone="light"
            mediaActive={isCardVisible}
            muted
          />

          <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {getTagLabel(getResolvedTag(video))}
          </div>

          {mediaItems.length > 1 ? (
            <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {Math.min(mediaIndex, mediaItems.length - 1) + 1}/{mediaItems.length}
            </div>
          ) : null}

          {mediaItems[mediaIndex]?.type === "video" && video.duration ? (
            <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {video.duration}
            </div>
          ) : null}
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="block w-full px-4 pt-3 text-left"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
              {getTagLabel(getResolvedTag(video))}
            </div>
          </div>

          <ExpandableTextPostText text={displayText} />
        </button>
      )}

      {mediaExists ? (
        <div className="px-4 py-3">
          <ExpandableFeedText text={displayText} />
        </div>
      ) : null}
    </article>
  );
}

function ViewerMetric({
  icon: Icon,
  value,
  active = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
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
        className={`h-8 w-8 ${active ? "fill-current text-white" : "text-white"}`}
      />
      {value !== "" ? <span className="text-sm font-medium">{value}</span> : null}
    </button>
  );
}

function ViewerActionButton({
  icon: Icon,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
      type="button"
    >
      <Icon className="h-8 w-8 text-white" />
      <span className="text-sm font-medium opacity-0">0</span>
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
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
}: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerDirection, setViewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("new");
  const [activeTag, setActiveTag] = useState<FeedTag>("all");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>({});
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionScrollRef = useRef<HTMLDivElement | null>(null);

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
  }, [videos, activeTag, feedMode, likedPostIds, savedPostIds, preferredTags]);

  const activeVideo = useMemo(() => {
    if (viewerIndex === null) return null;
    return visibleVideos[viewerIndex] ?? null;
  }, [viewerIndex, visibleVideos]);

  const activeVideoMedia = useMemo(() => {
    return activeVideo ? normalizeMediaList(activeVideo) : [];
  }, [activeVideo]);

  const activeViewerMedia =
    activeVideoMedia[Math.min(viewerMediaIndex, Math.max(activeVideoMedia.length - 1, 0))] || null;

  const activeLiked = activeVideo ? likedPostIds.includes(activeVideo.id) : false;
  const activeSaved = activeVideo ? savedPostIds.includes(activeVideo.id) : false;
  const activeSaveCount = activeSaved ? 1 : 0;
  const activeDisplayText = activeVideo ? getDisplayText(activeVideo, locale) : "";

  const setFeedCardMediaIndex = useCallback((videoId: number, nextIndex: number) => {
    setFeedMediaIndexes((prev) => ({
      ...prev,
      [videoId]: Math.max(0, nextIndex),
    }));
  }, []);

  const openViewer = useCallback((index: number) => {
    setViewerDirection(null);
    setViewerIndex(index);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerDirection(null);
    setViewerIndex(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerDirection("next");
    setViewerIndex((viewerIndex + 1) % visibleVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, visibleVideos.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerDirection("prev");
    setViewerIndex((viewerIndex - 1 + visibleVideos.length) % visibleVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, visibleVideos.length]);

  const handleViewerDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;

    if (offsetY < -DRAG_SWITCH_DISTANCE || velocityY < -DRAG_SWITCH_VELOCITY) {
      nextViewer();
      return;
    }

    if (offsetY > DRAG_SWITCH_DISTANCE || velocityY > DRAG_SWITCH_VELOCITY) {
      prevViewer();
      return;
    }
  };

  const handleMediaToggle = () => {
    if (!activeViewerMedia || activeViewerMedia.type !== "video") {
      return;
    }

    setIsPlaying((prev) => !prev);
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

  const handleDelete = async (video: Video) => {
    try {
      setActionError("");
      await onDeletePost(video.id);
      setMenuPostId(null);

      if (activeVideo?.id === video.id) {
        closeViewer();
      }
    } catch (error: any) {
      setActionError(String(error?.message || "Не удалось удалить пост"));
    }
  };

  const handleHide = (video: Video) => {
    setActionError("");
    onHidePost(video.id);
    setMenuPostId(null);

    if (activeVideo?.id === video.id) {
      closeViewer();
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, activeVideo?.id, viewerMediaIndex]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activeViewerMedia || activeViewerMedia.type !== "video") return;

    if (isPlaying) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  }, [isPlaying, activeVideo?.id, viewerMediaIndex, activeViewerMedia?.type]);

  useEffect(() => {
    if (activeViewerMedia?.type !== "video") {
      setIsPlaying(true);
      setIsMuted(true);
      setVideoProgress(0);
    }
  }, [activeViewerMedia?.type]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activeViewerMedia || activeViewerMedia.type !== "video") {
      setVideoProgress(0);
      return;
    }

    const updateProgress = () => {
      const duration =
        Number.isFinite(node.duration) && node.duration > 0
          ? node.duration
          : parseDurationToSeconds(activeVideo?.duration);

      const currentTime =
        Number.isFinite(node.currentTime) && node.currentTime >= 0
          ? node.currentTime
          : 0;

      setVideoProgress(duration > 0 ? Math.min(currentTime / duration, 1) : 0);
    };

    const handleLoadedMetadata = () => updateProgress();
    const handleTimeUpdate = () => updateProgress();
    const handleEnded = () => {
      setVideoProgress(1);
    };

    updateProgress();

    node.addEventListener("loadedmetadata", handleLoadedMetadata);
    node.addEventListener("timeupdate", handleTimeUpdate);
    node.addEventListener("ended", handleEnded);

    return () => {
      node.removeEventListener("loadedmetadata", handleLoadedMetadata);
      node.removeEventListener("timeupdate", handleTimeUpdate);
      node.removeEventListener("ended", handleEnded);
    };
  }, [activeVideo?.id, activeVideo?.duration, activeViewerMedia?.url, activeViewerMedia?.type]);

  useEffect(() => {
    if (!expandedCaption && captionScrollRef.current) {
      captionScrollRef.current.scrollTop = 0;
    }
  }, [expandedCaption, activeVideo?.id]);

  useEffect(() => {
    if (viewerIndex === null) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewerIndex]);

  useEffect(() => {
    if (viewerIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        nextViewer();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        prevViewer();
        return;
      }

      if (event.key === "ArrowRight" && activeVideoMedia.length > 1) {
        event.preventDefault();
        setViewerMediaIndex((prev) => Math.min(prev + 1, activeVideoMedia.length - 1));
        return;
      }

      if (event.key === "ArrowLeft" && activeVideoMedia.length > 1) {
        event.preventDefault();
        setViewerMediaIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerIndex, closeViewer, nextViewer, prevViewer, activeVideoMedia.length]);

  const viewerVariants = {
    enter: (direction: ViewerDirection) => ({
      y: direction === "next" ? "100%" : direction === "prev" ? "-100%" : 0,
      opacity: 1,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: ViewerDirection) => ({
      y: direction === "next" ? "-18%" : direction === "prev" ? "18%" : 0,
      opacity: 0.72,
    }),
  };

  const activeIsOwner =
    !!activeVideo &&
    !!currentTelegramUserId &&
    !!activeVideo.addedByTelegramId &&
    currentTelegramUserId === activeVideo.addedByTelegramId;

  const activeIsAdmin =
    !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

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

      {actionError ? (
        <div className="mx-auto mb-3 w-full max-w-[720px] px-4">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[720px]">
        {visibleVideos.map((video, index) => {
          const isOwner =
            !!currentTelegramUserId &&
            !!video.addedByTelegramId &&
            currentTelegramUserId === video.addedByTelegramId;

          const isAdmin =
            !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

          return (
            <FeedCard
              key={video.id}
              video={video}
              locale={locale}
              isOwner={isOwner}
              isAdmin={isAdmin}
              menuOpen={menuPostId === video.id}
              onToggleMenu={() =>
                setMenuPostId((prev) => (prev === video.id ? null : video.id))
              }
              onDelete={() => void handleDelete(video)}
              onHide={() => handleHide(video)}
              onOpen={() => openViewer(index)}
              onOpenCreator={() => openSource(video.channel)}
              mediaIndex={feedMediaIndexes[video.id] || 0}
              onChangeMediaIndex={(next) => setFeedCardMediaIndex(video.id, next)}
            />
          );
        })}
      </div>

      <AnimatePresence initial={false} custom={viewerDirection}>
        {activeVideo && (
          <motion.div
            key={`viewer-shell-${activeVideo.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="h-full w-full max-w-[520px] overflow-hidden bg-black">
                  <AnimatePresence initial={false} mode="wait" custom={viewerDirection}>
                    <motion.div
                      key={activeVideo.id}
                      custom={viewerDirection}
                      variants={viewerVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.92 }}
                      drag="y"
                      dragDirectionLock
                      dragElastic={0.04}
                      dragMomentum={false}
                      onDragEnd={handleViewerDragEnd}
                      className="relative h-full w-full overflow-hidden touch-pan-y"
                    >
                      {activeViewerMedia ? (
                        <SwipeCarousel
                          items={activeVideoMedia}
                          displayText={activeDisplayText || activeVideo.channel}
                          aspectClass="h-full"
                          activeIndex={Math.min(viewerMediaIndex, activeVideoMedia.length - 1)}
                          onChange={setViewerMediaIndex}
                          controlsTone="light"
                          mediaActive={activeViewerMedia?.type === "video" ? isPlaying : true}
                          muted={isMuted}
                          videoRef={videoRef}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#0a0a0f]" />
                      )}

                      <div className="absolute inset-0 bg-black/20" />

                      {activeViewerMedia?.type === "video" ? (
                        <button
                          type="button"
                          onClick={handleMediaToggle}
                          className="absolute inset-0 z-10 block"
                          aria-label={isPlaying ? "Поставить видео на паузу" : "Продолжить видео"}
                        />
                      ) : null}

                      <div className="absolute left-4 right-4 top-4 z-30 flex items-center justify-between">
                        <button
                          onClick={closeViewer}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                          type="button"
                        >
                          <ArrowLeft className="h-6 w-6" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={() =>
                              setMenuPostId((prev) =>
                                prev === activeVideo.id ? null : activeVideo.id
                              )
                            }
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                            type="button"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {menuPostId === activeVideo.id ? (
                            <MoreMenu
                              isOwner={activeIsOwner}
                              isAdmin={activeIsAdmin}
                              onDelete={() => void handleDelete(activeVideo)}
                              onHide={() => handleHide(activeVideo)}
                            />
                          ) : null}
                        </div>
                      </div>

                      {activeViewerMedia?.type === "video" && !isPlaying ? (
                        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
                            <Play className="ml-1 h-12 w-12 text-white" />
                          </div>
                        </div>
                      ) : null}

                      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
                        {activeViewerMedia?.type === "video" ? (
                          <ViewerActionButton
                            icon={isMuted ? VolumeX : Volume2}
                            onClick={() => setIsMuted((v) => !v)}
                          />
                        ) : null}
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
                        <ViewerActionButton
                          icon={Send}
                          onClick={() => void handleShare(activeVideo)}
                        />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSource(activeVideo.channel);
                          }}
                          className="mb-3 flex items-center gap-3 pr-20 text-left"
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
                            if (expandedCaption) {
                              e.stopPropagation();
                            }
                          }}
                          onWheel={(e) => {
                            if (expandedCaption) {
                              e.stopPropagation();
                            }
                          }}
                          onTouchStart={(e) => {
                            if (expandedCaption) {
                              e.stopPropagation();
                            }
                          }}
                          onTouchMove={(e) => {
                            if (expandedCaption) {
                              e.stopPropagation();
                            }
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

                        {activeViewerMedia?.type === "video" ? (
                          <div className="mt-3">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                              <div
                                className="h-full rounded-full bg-white transition-[width] duration-100"
                                style={{
                                  width: `${Math.max(0, Math.min(videoProgress * 100, 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : null}

                        {copySuccessId === activeVideo.id ? (
                          <div className="mt-2 text-xs font-medium text-[#7dd3fc]">
                            Ссылка скопирована
                          </div>
                        ) : null}

                        {actionError ? (
                          <div className="mt-2 text-xs font-medium text-rose-300">
                            {actionError}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
