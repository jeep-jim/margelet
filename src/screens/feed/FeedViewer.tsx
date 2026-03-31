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

const MAX_EXPANDED_TEXT_HEIGHT = 260;
const FEED_MUTE_KEY = "margelet_feed_muted";
const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";

function readGlobalMuted() {
  try {
    return localStorage.getItem(FEED_MUTE_KEY) !== "0";
  } catch {
    return false;
  }
}

function writeGlobalMuted(value: boolean) {
  try {
    localStorage.setItem(FEED_MUTE_KEY, value ? "1" : "0");
  } catch {
    //
  }
}

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.|t\.me\/)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href =
      part.startsWith("http") ? part : part.startsWith("t.me/") ? `https://${part}` : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[#5ea1ff] underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {part}
      </a>
    );
  });
}

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
  nextViewer,
  prevViewer,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const [expandedText, setExpandedText] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showCenterControl, setShowCenterControl] = useState(false);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

  useEffect(() => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
  }, [activePost?.id]);

  useEffect(() => {
    setExpandedText(false);
    setProgress(0);
    setShowCenterControl(false);
  }, [activePost?.id]);

  useEffect(() => {
    setIsMuted(readGlobalMuted());
  }, [activePost?.id, setIsMuted]);

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
    writeGlobalMuted(isMuted);
  }, [isMuted, viewerMediaIndex, activePost?.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    node.currentTime = 0;

    if (isPlaying) {
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isPlaying, viewerMediaIndex, activePost?.id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!activePost) return;

      if (event.key === "Escape") {
        closeViewer();
      } else if (event.key === "ArrowDown") {
        nextViewer();
      } else if (event.key === "ArrowUp") {
        prevViewer();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePost, closeViewer, nextViewer, prevViewer]);

  if (!activePost || activePost.contentType !== "video") {
    return null;
  }

  const liked = likedPostIds.includes(activePost.id);

  const pulseCenterControl = () => {
    setShowCenterControl(true);
    window.clearTimeout((pulseCenterControl as unknown as { timer?: number }).timer);
    (pulseCenterControl as unknown as { timer?: number }).timer = window.setTimeout(() => {
      setShowCenterControl(false);
    }, 650);
  };

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

    pulseCenterControl();
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) return;

    const delta = event.deltaY;
    if (Math.abs(delta) < 28) return;

    wheelLockRef.current = true;

    if (delta > 0) {
      nextViewer();
    } else {
      prevViewer();
    }

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 420);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-black"
        onWheel={handleWheel}
        onTouchStart={(event) => {
          touchStartYRef.current = event.touches[0]?.clientY ?? null;
        }}
        onTouchEnd={(event) => {
          const startY = touchStartYRef.current;
          const endY = event.changedTouches[0]?.clientY ?? null;
          touchStartYRef.current = null;

          if (startY === null || endY === null) return;

          const delta = endY - startY;

          if (delta <= -70) {
            nextViewer();
          } else if (delta >= 70) {
            prevViewer();
          }
        }}
      >
        <div className="relative h-full w-full overflow-hidden bg-black">
          <div
            className="absolute inset-0 flex items-center justify-center bg-black"
            onClick={togglePlay}
          >
            <FeedCarousel
              items={media}
              aspectClass="h-full"
              activeIndex={viewerMediaIndex}
              onChange={setViewerMediaIndex}
              mediaActive
              muted={isMuted}
              videoRef={videoRef}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/72" />

          <div className="absolute left-4 top-4 z-30">
            <button
              onClick={closeViewer}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute right-4 top-4 z-30">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>

          {showCenterControl ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="ml-1 h-8 w-8" />
                )}
              </div>
            </div>
          ) : null}

          <div className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-6 text-white">
            <button
              type="button"
              onClick={() => {
                setIsMuted((prev) => !prev);
              }}
            >
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
                  className={`text-[15px] leading-6 text-white ${
                    expandedText ? "overflow-y-auto" : "line-clamp-3"
                  }`}
                  style={
                    expandedText
                      ? { maxHeight: `${MAX_EXPANDED_TEXT_HEIGHT}px` }
                      : undefined
                  }
                  onWheel={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  onTouchEnd={(event) => event.stopPropagation()}
                >
                  {linkifyText(activePost.text)}
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

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}