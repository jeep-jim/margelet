import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { normalizeMediaList } from "./feed.utils";

const FEED_MUTE_KEY = "margelet_feed_muted";
const FEED_MUTE_EVENT = "margelet:feed-mute-change";
const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";

function formatDuration(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return null;

  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function readGlobalMuted() {
  try {
    return localStorage.getItem(FEED_MUTE_KEY) !== "0";
  } catch {
    return true;
  }
}

function writeGlobalMuted(value: boolean) {
  try {
    localStorage.setItem(FEED_MUTE_KEY, value ? "1" : "0");
  } catch {}

  window.dispatchEvent(
    new CustomEvent(FEED_MUTE_EVENT, {
      detail: { muted: value },
    })
  );
}

export function FeedMediaCard({
  post,
  onOpen,
  mediaIndex,
  onChangeMediaIndex,
  isCardVisible = false,
}: FeedMediaCardProps) {
  const [media, setMedia] = useState(() => normalizeMediaList(post));
  const [retryUsed, setRetryUsed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(readGlobalMuted());
  const [forcedPaused, setForcedPaused] = useState(false);
  const [measuredDuration, setMeasuredDuration] = useState<number | null>(null);

  const activeItem =
    media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;

  // 🔥 retry логика
  const tryRefreshMedia = async () => {
    if (retryUsed) return;
    if (!post.postUrl) return;

    setRetryUsed(true);

    try {
      const res = await fetch(
        `/api/telegram-preview?url=${encodeURIComponent(post.postUrl)}`
      );

      if (!res.ok) return;

      const data = await res.json();
      if (!data) return;

      const refreshed = normalizeMediaList({
        ...post,
        ...data,
      });

      if (refreshed?.length) {
        setMedia(refreshed);
      }
    } catch {
      // тихо
    }
  };

  useEffect(() => {
    const syncMuted = (event: Event) => {
      const detail = (event as CustomEvent<{ muted?: boolean }>).detail;
      setMuted(typeof detail?.muted === "boolean" ? detail.muted : readGlobalMuted());
    };

    const pauseAll = () => {
      setForcedPaused(true);
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    window.addEventListener(FEED_MUTE_EVENT, syncMuted as EventListener);
    window.addEventListener(FEED_PAUSE_EVENT, pauseAll);

    return () => {
      window.removeEventListener(FEED_MUTE_EVENT, syncMuted as EventListener);
      window.removeEventListener(FEED_PAUSE_EVENT, pauseAll);
    };
  }, []);

  useEffect(() => {
    setMeasuredDuration(null);

    const node = videoRef.current;
    if (!node || activeItem?.kind !== "video") return;

    const onLoaded = () => {
      if (Number.isFinite(node.duration)) {
        setMeasuredDuration(node.duration);
      }
    };

    node.addEventListener("loadedmetadata", onLoaded);
    onLoaded();

    return () => {
      node.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [activeItem?.id, activeItem?.kind]);

  useEffect(() => {
    if (!forcedPaused) return;
    if (!isCardVisible) return;
    if (activeItem?.kind !== "video") return;

    setForcedPaused(false);
  }, [forcedPaused, isCardVisible, activeItem?.kind, mediaIndex]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = muted;
  }, [muted, mediaIndex, post.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (activeItem?.kind !== "video") return;

    if (isCardVisible && !forcedPaused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isCardVisible, forcedPaused, activeItem?.kind, mediaIndex, post.id]);

  const handleOpen = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
    onOpen();
  };

  const durationToShow = activeItem?.duration ?? measuredDuration;

  return (
    <div className="relative" onClick={handleOpen}>
      <FeedCarousel
        items={media}
        aspectClass="aspect-[4/5]"
        activeIndex={mediaIndex}
        onChange={onChangeMediaIndex}
        controlsTone="light"
        mediaActive={isCardVisible && !forcedPaused}
        muted={muted}
        videoRef={videoRef}
        fit="cover"
        enableFullscreen={post.contentType !== "video"}
        onMediaError={tryRefreshMedia} // 🔥 ВАЖНО
      />

      {activeItem?.kind === "video" ? (
        <>
          {formatDuration(durationToShow) ? (
            <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
              {formatDuration(durationToShow)}
            </div>
          ) : null}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const next = !muted;
              setMuted(next);
              writeGlobalMuted(next);
            }}
            className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
            aria-label={muted ? "Включить звук" : "Выключить звук"}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        </>
      ) : null}
    </div>
  );
}