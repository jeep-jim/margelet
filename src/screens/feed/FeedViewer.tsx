import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MoreVertical,
  Play,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ViewerProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { ViewerActionButton, ViewerMetric } from "./FeedViewerActions";
import { normalizeMediaList } from "./feed.utils";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";

export function FeedViewer({
  locale,
  activePost,
  viewerDirection,
  isMuted,
  setIsMuted,
  isPlaying,
  setIsPlaying,
  viewerMediaIndex,
  setViewerMediaIndex,
  closeViewer,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

  const activeMedia =
    media[Math.min(viewerMediaIndex, Math.max(media.length - 1, 0))] || null;

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

  if (!activePost) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={activePost.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="relative h-full w-full">
          {activeMedia ? (
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
          ) : null}

          <div className="absolute left-4 top-4 z-30 flex gap-2">
            <button
              onClick={closeViewer}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white"
            >
              <ArrowLeft />
            </button>
          </div>

          <div className="absolute bottom-6 left-4 right-4 text-white">
            <div className="flex items-center gap-3">
              <FeedSourceAvatar post={activePost} />

              <div>
                <div className="flex items-center gap-2">
                  {activePost.source.title}
                  {activePost.source.verified && (
                    <VerifiedBadge className="text-[#2AABEE]" />
                  )}
                </div>

                <div className="text-sm opacity-70">
                  @{activePost.source.handle}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              {activePost.text}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}