import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Heart,
  Pause,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewerProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { normalizeMediaList } from "./feed.utils";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";

export function FeedViewer({
  activePost,
  isMuted,
  setIsMuted,
  isPlaying,
  setIsPlaying,
  viewerMediaIndex,
  setViewerMediaIndex,
  likedPostIds,
  onToggleLike,
  handleShare,
  closeViewer,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [expandedText, setExpandedText] = useState(false);
  const [progress, setProgress] = useState(0);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

  useEffect(() => {
    setExpandedText(false);
    setProgress(0);
  }, [activePost?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const node = videoRef.current;
      if (!node) return;

      const duration = node.duration || 0;
      const current = node.currentTime || 0;

      if (duration > 0) {
        setProgress((current / duration) * 100);
      } else {
        setProgress(0);
      }

      setIsPlaying(!node.paused);
    }, 200);

    return () => window.clearInterval(interval);
  }, [setIsPlaying]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = isMuted;
  }, [isMuted, viewerMediaIndex, activePost?.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (isPlaying) {
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isPlaying, viewerMediaIndex, activePost?.id]);

  if (!activePost || activePost.contentType !== "video") {
    return null;
  }

  const liked = likedPostIds.includes(activePost.id);

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node) return;

    if (node.paused) {
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
      setIsPlaying(true);
    } else {
      node.pause();
      setIsPlaying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key={activePost.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="relative h-full w-full overflow-hidden">
          {media.length > 0 ? (
            <div className="absolute inset-0" onClick={togglePlay}>
              <FeedCarousel
                items={media}
                displayText={activePost.text}
                aspectClass="h-full"
                activeIndex={viewerMediaIndex}
                onChange={setViewerMediaIndex}
                mediaActive
                muted={isMuted}
                videoRef={videoRef}
              />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />

          <div className="absolute left-4 top-4 z-30">
            <button
              onClick={closeViewer}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute right-4 top-4 z-30">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            >
              {isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="ml-1 h-8 w-8" />
              )}
            </button>
          </div>

          <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-6 text-white">
            <button type="button" onClick={() => setIsMuted((prev) => !prev)}>
              {isMuted ? (
                <VolumeX className="h-7 w-7" />
              ) : (
                <Volume2 className="h-7 w-7" />
              )}
            </button>

            <button type="button" onClick={() => onToggleLike(activePost.id)}>
              <Heart className={`h-7 w-7 ${liked ? "fill-current" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => {
                void handleShare(activePost);
              }}
            >
              <Send className="h-7 w-7" />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-6 pt-10 text-white">
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center gap-3">
              <FeedSourceAvatar post={activePost} />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[18px] font-semibold">
                    {activePost.source.title}
                  </div>
                  {activePost.source.verified ? (
                    <VerifiedBadge className="text-[#2AABEE]" />
                  ) : null}
                </div>

                <div className="text-sm opacity-80">
                  @{activePost.source.handle}
                </div>
              </div>
            </div>

            {activePost.text ? (
              <div className="mt-3 max-w-[82%]">
                <div
                  className={`whitespace-pre-wrap text-[15px] leading-6 text-white ${
                    expandedText ? "" : "line-clamp-3"
                  }`}
                >
                  {activePost.text}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedText((prev) => !prev)}
                  className="mt-2 text-sm font-medium text-white/90"
                >
                  {expandedText ? "Скрыть" : "Ещё"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}