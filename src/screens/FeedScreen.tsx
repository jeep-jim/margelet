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
  Image as ImageIcon,
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
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (channel: string) => void;
};

type FeedMode = "new" | "rising" | "trending";

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
  const cleanHandle = (video.handle || video.channel || "telegram")
    .replace(/^@/, "")
    .trim()
    .toLowerCase();

  return `${window.location.origin}/#/${cleanHandle}/${video.id}`;
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
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-neutral-200 ${boxClass}`}>
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

  if (!text) return null;

  return (
    <div className="text-[15px] leading-6 text-neutral-900">
      <div
        ref={measureRef}
        className={`relative ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </div>

      {shouldClamp ? (
        <div className="mt-0.5 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-neutral-500"
          >
            {expanded ? "Свернуть" : "Ещё"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FeedCard({
  video,
  locale,
  liked,
  saved,
  isOwner,
  isAdmin,
  menuOpen,
  onToggleMenu,
  onDelete,
  onHide,
  onOpen,
  onOpenCreator,
  onToggleLike,
  onToggleSave,
}: {
  video: Video;
  locale: Locale;
  liked: boolean;
  saved: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onDelete: () => void;
  onHide: () => void;
  onOpen: () => void;
  onOpenCreator: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  const displayText = getDisplayText(video, locale);

  return (
    <article className="overflow-hidden border-b border-neutral-200 bg-white">
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

      <button
        onClick={onOpen}
        className="relative mt-3 block w-full bg-neutral-100"
        type="button"
      >
        <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-200 sm:aspect-[9/12]">
          {video.previewUrl ? (
            <img
              src={video.previewUrl}
              alt={displayText || video.channel}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                video.bg || "from-neutral-300 to-neutral-200"
              }`}
            />
          )}

          <div className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            {video.mediaType}
          </div>

          <div className="absolute right-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {getTagLabel(getResolvedTag(video))}
          </div>

          {video.mediaType === "video" && video.duration ? (
            <div className="absolute bottom-3 right-3 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {video.duration}
            </div>
          ) : null}
        </div>
      </button>

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

        <ExpandableFeedText text={displayText} />
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
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
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
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

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

  const activeLiked = activeVideo ? likedPostIds.includes(activeVideo.id) : false;
  const activeSaved = activeVideo ? savedPostIds.includes(activeVideo.id) : false;
  const activeSaveCount = activeSaved ? 1 : 0;
  const activeDisplayText = activeVideo ? getDisplayText(activeVideo, locale) : "";

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  };

  const closeViewer = () => {
    setViewerIndex(null);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  };

  const nextViewer = () => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerIndex((viewerIndex + 1) % visibleVideos.length);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  };

  const prevViewer = () => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerIndex((viewerIndex - 1 + visibleVideos.length) % visibleVideos.length);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
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
  }, [isMuted, activeVideo?.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (isPlaying) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  }, [isPlaying, activeVideo?.id]);

  useEffect(() => {
    if (viewerIndex === null) return;

    const handleWheel = (e: WheelEvent) => {
      const captionNode = captionScrollRef.current;

      if (captionNode && captionNode.contains(e.target as Node)) {
        return;
      }

      if (Math.abs(e.deltaY) < 30) return;

      if (e.deltaY > 0) {
        nextViewer();
      } else {
        prevViewer();
      }
    };

    let startY = 0;
    let startedInsideCaption = false;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      const captionNode = captionScrollRef.current;
      startedInsideCaption = !!(
        captionNode && captionNode.contains(e.target as Node)
      );
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (startedInsideCaption) return;

      const endY = e.changedTouches[0].clientY;
      const delta = startY - endY;

      if (Math.abs(delta) < 50) return;

      if (delta > 0) {
        nextViewer();
      } else {
        prevViewer();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [viewerIndex, visibleVideos]);

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
              liked={likedPostIds.includes(video.id)}
              saved={savedPostIds.includes(video.id)}
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
              onToggleLike={() => onToggleLike(video.id)}
              onToggleSave={() => onToggleSave(video.id)}
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
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 bg-neutral-950" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-full max-w-[520px] bg-black">
                  <div className="relative h-full w-full overflow-hidden">
                    {activeVideo.mediaType === "video" && activeVideo.videoUrl ? (
                      <video
                        ref={videoRef}
                        src={activeVideo.videoUrl}
                        poster={activeVideo.previewUrl || undefined}
                        className="absolute inset-0 h-full w-full object-cover"
                        autoPlay
                        loop
                        playsInline
                        muted={isMuted}
                      />
                    ) : activeVideo.previewUrl ? (
                      <img
                        src={activeVideo.previewUrl}
                        alt={activeDisplayText || activeVideo.channel}
                        className="absolute inset-0 h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${
                          activeVideo.bg || "from-neutral-800 to-neutral-700"
                        }`}
                      />
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

                      <div className="relative">
                        <div className="flex items-center gap-2">
                          {activeVideo.mediaType === "video" && activeVideo.videoUrl ? (
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
                          ) : null}

                          <button
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                            onClick={() =>
                              setMenuPostId((prev) =>
                                prev === activeVideo.id ? null : activeVideo.id
                              )
                            }
                            type="button"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                        </div>

                        {menuPostId === activeVideo.id ? (
                          <div className="absolute right-0 top-14 z-50">
                            <MoreMenu
                              isOwner={
                                !!currentTelegramUserId &&
                                !!activeVideo.addedByTelegramId &&
                                currentTelegramUserId === activeVideo.addedByTelegramId
                              }
                              isAdmin={
                                !!currentTelegramUserId &&
                                ADMIN_TELEGRAM_IDS.has(currentTelegramUserId)
                              }
                              onDelete={() => void handleDelete(activeVideo)}
                              onHide={() => handleHide(activeVideo)}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div
                      className="absolute inset-0 z-10"
                      onClick={() => {
                        if (activeVideo.mediaType === "video" && activeVideo.videoUrl) {
                          setIsPlaying((v) => !v);
                        } else {
                          nextViewer();
                        }
                      }}
                    />

                    <div
                      className={`absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200 ${
                        activeVideo.mediaType === "video" && activeVideo.videoUrl && isPlaying
                          ? "pointer-events-none opacity-0"
                          : "opacity-100"
                      }`}
                    >
                      {activeVideo.mediaType === "video" && activeVideo.videoUrl ? (
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
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
                          {activeVideo.mediaType === "video" ? (
                            <Play className="ml-1 h-12 w-12 text-white" />
                          ) : (
                            <ImageIcon className="h-12 w-12 text-white" />
                          )}
                        </div>
                      )}
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

                    <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-8 pt-20 text-white">
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
                        <span>{activeVideo.mediaType}</span>
                        <span>•</span>
                        <span>{getTagLabel(getResolvedTag(activeVideo))}</span>
                        {activeVideo.mediaType === "video" && activeVideo.duration ? (
                          <>
                            <span>•</span>
                            <span>{activeVideo.duration}</span>
                          </>
                        ) : null}
                      </div>

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