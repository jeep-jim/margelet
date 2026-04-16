import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bell, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewerProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { normalizeMediaList } from "./feed.utils";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";

const MAX_EXPANDED_TEXT_HEIGHT = 260;
const FEED_MUTE_KEY = "margelet_feed_muted";
const SUB_KEY = "margelet_subscriptions";

function readGlobalMuted() {
  try {
    return localStorage.getItem(FEED_MUTE_KEY) !== "0";
  } catch {
    return false;
  }
}
function saveGlobalMuted(next: boolean) {
  try { localStorage.setItem(FEED_MUTE_KEY, next ? "1" : "0"); } catch {}
}
function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);
  const next = exists ? current.filter((h) => h !== handle) : [...current, handle];
  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}
function linkifyText(text: string) {
  return text;
}

export function FeedViewer({
  locale: _locale,
  activePost,
  expandedCaption: _expandedCaption,
  setExpandedCaption: _setExpandedCaption,
  isMuted,
  setIsMuted,
  isPlaying,
  setIsPlaying,
  viewerMediaIndex,
  setViewerMediaIndex,
  openSource,
  closeViewer,
  nextViewer,
  prevViewer,
}: ViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const centerTimerRef = useRef<number | null>(null);
  const [expandedText, setExpandedText] = useState(false);
  const [showCenterControl, setShowCenterControl] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const media = useMemo(() => (activePost ? normalizeMediaList(activePost) : []), [activePost]);
  const activeItem = media[Math.min(viewerMediaIndex, Math.max(media.length - 1, 0))] || null;

  useEffect(() => { setIsMuted(readGlobalMuted()); }, [setIsMuted]);
  useEffect(() => {
    if (!activePost) return;
    setSubscribed(getSubs().includes(activePost.source.handle));
    setExpandedText(false);
  }, [activePost]);
  if (!activePost) return null;

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
    setShowCenterControl(true);
    if (centerTimerRef.current) window.clearTimeout(centerTimerRef.current);
    centerTimerRef.current = window.setTimeout(() => setShowCenterControl(false), 500);
  };
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    saveGlobalMuted(next);
  };
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (wheelLockRef.current) return;
    const delta = event.deltaY;
    if (Math.abs(delta) < 28) return;
    wheelLockRef.current = true;
    delta > 0 ? nextViewer() : prevViewer();
    window.setTimeout(() => { wheelLockRef.current = false; }, 420);
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black" onWheel={handleWheel}
        onTouchStart={(e) => { touchStartYRef.current = e.touches[0]?.clientY ?? null; }}
        onTouchEnd={(e) => {
          const startY = touchStartYRef.current; const endY = e.changedTouches[0]?.clientY ?? null; touchStartYRef.current = null;
          if (startY === null || endY === null) return;
          const delta = endY - startY; if (delta <= -70) nextViewer(); else if (delta >= 70) prevViewer();
        }}>
        <div className="relative h-full w-full overflow-hidden bg-black">
          <div className="absolute inset-0 flex items-center justify-center bg-black" onClick={togglePlay}>
            <FeedCarousel
              key={`${activePost.id}-${viewerMediaIndex}-${activeItem?.id ?? "media"}`}
              items={media}
              aspectClass="h-full"
              activeIndex={viewerMediaIndex}
              onChange={setViewerMediaIndex}
              mediaActive={isPlaying}
              muted={isMuted}
              videoRef={videoRef}
              fit="contain"
              nativeVideoControls={false}
              blockVideoClickPropagation={false}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/72" />

          <div className="absolute left-4 top-4 z-30">
            <button onClick={closeViewer} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white" type="button">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute right-4 top-4 z-30 flex gap-2">
            <button type="button" onClick={() => {
              const next = toggleSub(activePost.source.handle);
              setSubscribed(next.includes(activePost.source.handle));
              window.dispatchEvent(new Event("storage"));
            }} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white">
              <Bell className={`h-5 w-5 ${subscribed ? "fill-current" : ""}`} />
            </button>
            <button type="button" onClick={toggleMute} className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white">
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          {showCenterControl ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="ml-1 h-8 w-8" />}
              </div>
            </div>
          ) : null}

          <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-10 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="w-full md:max-w-[380px]">
              <button type="button" onClick={() => { openSource(activePost.source.handle); closeViewer(); }} className="flex min-w-0 items-center gap-3 text-left">
                <FeedSourceAvatar post={activePost} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[18px] font-semibold">{activePost.source.title}</div>
                    {activePost.source.verified ? <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" /> : null}
                  </div>
                  <div className="text-sm opacity-80">@{activePost.source.handle}</div>
                </div>
              </button>

              {activePost.text ? (
                <div className="mt-3">
                  <div
                    role="button"
                    tabIndex={0}
                    className={`text-[15px] leading-6 text-white ${expandedText ? "overflow-y-auto" : "line-clamp-1"}`}
                    style={expandedText ? { maxHeight: `${MAX_EXPANDED_TEXT_HEIGHT}px` } : undefined}
                    onClick={() => setExpandedText((prev) => !prev)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpandedText((prev) => !prev);
                      }
                    }}
                  >
                    {linkifyText(activePost.text)}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
