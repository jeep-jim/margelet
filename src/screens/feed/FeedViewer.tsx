import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ArrowLeft, Bookmark, Heart, MoreVertical, Play, Send, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ViewerProps } from "./feed.types";
import { ADMIN_TELEGRAM_IDS, DRAG_SWITCH_DISTANCE, DRAG_SWITCH_VELOCITY } from "./feed.constants";
import { FeedCarousel } from "./FeedCarousel";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { ViewerActionButton, ViewerMetric } from "./FeedViewerActions";
import { getDisplayText, normalizeMediaList } from "./feed.utils";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";

export function FeedViewer({
  locale,
  activeVideo,
  viewerDirection,
  expandedCaption,
  setExpandedCaption,
  isMuted,
  setIsMuted,
  isPlaying,
  setIsPlaying,
  copySuccessId,
  menuPostId,
  setMenuPostId,
  actionError,
  videoProgress,
  viewerMediaIndex,
  setViewerMediaIndex,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
  closeViewer,
  nextViewer,
  prevViewer,
  handleShare,
  setActionError,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionScrollRef = useRef<HTMLDivElement | null>(null);

  const activeVideoMedia = useMemo(() => {
    return activeVideo ? normalizeMediaList(activeVideo) : [];
  }, [activeVideo]);

  const activeViewerMedia =
    activeVideoMedia[Math.min(viewerMediaIndex, Math.max(activeVideoMedia.length - 1, 0))] || null;

  const activeLiked = activeVideo ? likedPostIds.includes(activeVideo.id) : false;
  const activeSaved = activeVideo ? savedPostIds.includes(activeVideo.id) : false;
  const activeDisplayText = activeVideo ? getDisplayText(activeVideo, locale) : "";

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
    }
  }, [activeViewerMedia?.type, setIsMuted, setIsPlaying]);

  useEffect(() => {
    if (!expandedCaption && captionScrollRef.current) {
      captionScrollRef.current.scrollTop = 0;
    }
  }, [expandedCaption, activeVideo?.id]);

  if (!activeVideo) {
    return null;
  }

  const handleMediaToggle = () => {
    if (!activeViewerMedia || activeViewerMedia.type !== "video") {
      return;
    }

    setIsPlaying((prev) => !prev);
  };

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

  const viewerVariants = {
    enter: (direction: "next" | "prev" | null) => ({
      y: direction === "next" ? "100%" : direction === "prev" ? "-100%" : 0,
      opacity: 1,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: "next" | "prev" | null) => ({
      y: direction === "next" ? "-18%" : direction === "prev" ? "18%" : 0,
      opacity: 0.72,
    }),
  };

  const activeIsOwner =
    !!currentTelegramUserId &&
    !!activeVideo.addedByTelegramId &&
    currentTelegramUserId === activeVideo.addedByTelegramId;

  const activeIsAdmin =
    !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

  return (
    <AnimatePresence initial={false} custom={viewerDirection}>
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
                    <FeedCarousel
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
                        <FeedMoreMenu
                          isOwner={activeIsOwner}
                          isAdmin={activeIsAdmin}
                          onDelete={() => {
                            void onDeletePost(activeVideo.id).catch((error: any) => {
                              setActionError(String(error?.message || "Не удалось удалить пост"));
                            });
                          }}
                          onHide={() => {
                            onHidePost(activeVideo.id);
                            closeViewer();
                          }}
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
                        active={activeLiked}
                        onClick={() => onToggleLike(activeVideo.id)}
                    />
                    <ViewerMetric
                        icon={Bookmark}
                        active={activeSaved}
                        onClick={() => onToggleSave(activeVideo.id)}
                    />
                    <ViewerActionButton
                      icon={Send}
                      onClick={() => {
                        void handleShare(activeVideo);
                      }}
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
                      <FeedSourceAvatar video={activeVideo} size="md" />

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

                    {activeDisplayText.length > 110 ? (
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
                    ) : null}

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
    </AnimatePresence>
  );
}
