import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MoreVertical,
  Play,
  VolumeX,
  Image as ImageIcon,
  ChevronDown,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

const MODE_OPTIONS: { value: FeedMode; label: string }[] = [
  { value: "new", label: "Новое" },
  { value: "rising", label: "Взлетает" },
  { value: "trending", label: "Тренды" },
];

const TAG_OPTIONS: { value: FeedTag; label: string }[] = [
  { value: "all", label: "Все" },
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
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-900">
        {video.avatar}
      </div>

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

function FeedCard({
  video,
  locale,
  liked,
  saved,
  onOpen,
  onOpenCreator,
  onToggleLike,
  onToggleSave,
}: {
  video: Video;
  locale: Locale;
  liked: boolean;
  saved: boolean;
  onOpen: () => void;
  onOpenCreator: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  return (
    <article className="overflow-hidden border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <SourceHeader video={video} compact onOpenCreator={onOpenCreator} />
        <button className="rounded-full p-2 text-neutral-700">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <button onClick={onOpen} className="relative mt-3 block w-full bg-neutral-100">
        <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-200 sm:aspect-[9/12]">
          {video.previewUrl ? (
            <img
              src={video.previewUrl}
              alt={video.title[locale]}
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

          <div className="absolute inset-0 bg-black/5" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm">
              {video.mediaType === "video" ? (
                <Play className="ml-1 h-8 w-8 text-white" />
              ) : (
                <ImageIcon className="h-8 w-8 text-white" />
              )}
            </div>
          </div>

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

        <div className="truncate text-[15px] leading-6 text-neutral-900">
          {video.title[locale]}
        </div>
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
      <span className="text-sm font-medium">{value}</span>
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

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setExpandedCaption(false);
  };

  const closeViewer = () => {
    setViewerIndex(null);
    setExpandedCaption(false);
  };

  const nextViewer = () => {
    if (viewerIndex === null || visibleVideos.length === 0) return;
    setViewerIndex((viewerIndex + 1) % visibleVideos.length);
    setExpandedCaption(false);
  };

  useEffect(() => {
    if (viewerIndex === null) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 30) return;
      nextViewer();
    };

    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      if (startY - endY > 50) {
        nextViewer();
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

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 text-neutral-950">
      <div className="sticky top-16 z-30 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-md">
        <div className="mx-auto w-full max-w-[720px] px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {MODE_OPTIONS.map((mode) => {
              const active = feedMode === mode.value;
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setFeedMode(mode.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                    active
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                  }`}
                >
                  {mode.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setTagsOpen((v) => !v)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                tagsOpen || activeTag !== "all"
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span>{activeTag === "all" ? "Теги" : getTagLabel(activeTag)}</span>
              {activeTag !== "all" ? (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTag("all");
                  }}
                  className="inline-flex"
                >
                  <X className="h-4 w-4" />
                </span>
              ) : (
                <ChevronDown className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`} />
              )}
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
      </div>

      <div className="mx-auto w-full max-w-[720px]">
        {visibleVideos.map((video, index) => (
          <FeedCard
            key={video.id}
            video={video}
            locale={locale}
            liked={likedPostIds.includes(video.id)}
            saved={savedPostIds.includes(video.id)}
            onOpen={() => openViewer(index)}
            onOpenCreator={() => openSource(video.channel)}
            onToggleLike={() => onToggleLike(video.id)}
            onToggleSave={() => onToggleSave(video.id)}
          />
        ))}
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
                    {activeVideo.previewUrl ? (
                      <img
                        src={activeVideo.previewUrl}
                        alt={activeVideo.title[locale]}
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

                    <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                      <button
                        onClick={closeViewer}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                      >
                        <ArrowLeft className="h-6 w-6" />
                      </button>

                      {activeVideo.mediaType === "video" ? (
                        <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                          <VolumeX className="h-5 w-5" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>

                    <button
                      onClick={nextViewer}
                      className="absolute inset-0 block h-full w-full"
                    >
                      <span className="sr-only">Next post</span>
                    </button>

                    <div className="absolute inset-0 flex items-center justify-center">
                      {activeVideo.mediaType === "video" ? (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/15 backdrop-blur-sm">
                          <Play className="ml-1 h-12 w-12 text-white" />
                        </div>
                      ) : (
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/15 backdrop-blur-sm">
                          <ImageIcon className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
                      <ViewerMetric
                        icon={Heart}
                        value={activeVideo.likes}
                        active={activeLiked}
                        onClick={() => onToggleLike(activeVideo.id)}
                      />
                      <ViewerMetric
                        icon={Bookmark}
                        value={20}
                        active={activeSaved}
                        onClick={() => onToggleSave(activeVideo.id)}
                      />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSource(activeVideo.channel);
                        }}
                        className="mb-3 flex items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                          {activeVideo.avatar}
                        </div>

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
                        className={`max-w-[82%] text-[16px] leading-6 text-white/95 ${
                          expandedCaption ? "" : "line-clamp-2"
                        }`}
                      >
                        {activeVideo.title[locale]}
                      </div>

                      {activeVideo.caption?.[locale] ? (
                        <div className="mt-2 max-w-[82%] text-sm leading-6 text-white/75">
                          {activeVideo.caption[locale]}
                        </div>
                      ) : null}

                      {activeVideo.title[locale].length > 60 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCaption((v) => !v);
                          }}
                          className="mt-1 text-sm font-medium text-white/75"
                        >
                          {expandedCaption ? "свернуть" : "ещё"}
                        </button>
                      )}
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