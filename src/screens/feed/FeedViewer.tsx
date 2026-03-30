import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import type { ViewerProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { normalizeMediaList } from "./feed.utils";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";

export function FeedViewer({
  activePost,
  isMuted,
  viewerMediaIndex,
  setViewerMediaIndex,
  closeViewer,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

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
          {media.length > 0 ? (
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
              type="button"
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
                  {activePost.source.verified ? (
                    <VerifiedBadge className="text-[#2AABEE]" />
                  ) : null}
                </div>

                <div className="text-sm opacity-70">
                  @{activePost.source.handle}
                </div>
              </div>
            </div>

            <div className="mt-3 text-sm">{activePost.text}</div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}