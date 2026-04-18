import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { normalizeMediaList } from "./feed.utils";

const FEED_MUTE_KEY = "margelet_feed_muted";
const FEED_MUTE_EVENT = "margelet:feed-mute-change";
const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";

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

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FeedMediaCard({
  locale,
  post,
  onOpen,
  mediaIndex,
  onChangeMediaIndex,
  isCardVisible = false,
  shouldLoadMedia = false,
}: FeedMediaCardProps) {
  const COPY = {
    en: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    ru: {
      mute: "Выключить звук",
      unmute: "Включить звук",
      play: "Воспроизвести",
      pause: "Пауза",
    },
    de: {
      mute: "Ton aus",
      unmute: "Ton an",
      play: "Abspielen",
      pause: "Pause",
    },
    es: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      play: "Reproducir",
      pause: "Pausa",
    },
    tr: {
      mute: "Sesi kapat",
      unmute: "Sesi aç",
      play: "Oynat",
      pause: "Duraklat",
    },
    fr: {
      mute: "Couper le son",
      unmute: "Activer le son",
      play: "Lire",
      pause: "Pause",
    },
    it: {
      mute: "Disattiva audio",
      unmute: "Attiva audio",
      play: "Riproduci",
      pause: "Pausa",
    },
    "pt-br": {
      mute: "Silenciar",
      unmute: "Ativar som",
      play: "Reproduzir",
      pause: "Pausar",
    },
    id: {
      mute: "Matikan suara",
      unmute: "Nyalakan suara",
      play: "Putar",
      pause: "Jeda",
    },
    pl: {
      mute: "Wycisz",
      unmute: "Włącz dźwięk",
      play: "Odtwórz",
      pause: "Pauza",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const [media] = useState(() => normalizeMediaList(post));

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [muted, setMuted] = useState(readGlobalMuted());
  const [forcedPaused, setForcedPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const activeItem =
    media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;

  const activeIsVideo = activeItem?.kind === "video";

  useEffect(() => {
    const syncMuted = (event: Event) => {
      const detail = (event as CustomEvent<{ muted?: boolean }>).detail;
      setMuted(
        typeof detail?.muted === "boolean" ? detail.muted : readGlobalMuted()
      );
    };

    const pauseAll = () => {
      setForcedPaused(true);
      const node = videoRef.current;
      if (!node) return;
      node.pause();
      setIsVideoPlaying(false);
    };

    window.addEventListener(FEED_MUTE_EVENT, syncMuted as EventListener);
    window.addEventListener(FEED_PAUSE_EVENT, pauseAll);

    return () => {
      window.removeEventListener(FEED_MUTE_EVENT, syncMuted as EventListener);
      window.removeEventListener(FEED_PAUSE_EVENT, pauseAll);
    };
  }, []);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || activeItem?.kind !== "video") {
      setCurrentTime(0);
      setDuration(0);
      setIsVideoPlaying(false);
      return;
    }

    const syncMeta = () => {
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const syncTime = () => {
      setCurrentTime(node.currentTime || 0);
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const onPlay = () => {
      setIsVideoPlaying(true);
    };

    const onPause = () => {
      setIsVideoPlaying(false);
    };

    node.addEventListener("loadedmetadata", syncMeta);
    node.addEventListener("timeupdate", syncTime);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    node.addEventListener("ended", onPause);

    syncMeta();
    syncTime();
    setIsVideoPlaying(!node.paused);

    return () => {
      node.removeEventListener("loadedmetadata", syncMeta);
      node.removeEventListener("timeupdate", syncTime);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("ended", onPause);
    };
  }, [activeItem?.id, activeItem?.kind]);

  useEffect(() => {
    setForcedPaused(false);
  }, [post.id, mediaIndex]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = muted;
  }, [muted, mediaIndex, post.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    if (activeItem?.kind !== "video") return;

    if (isCardVisible && shouldLoadMedia && !forcedPaused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [activeItem?.id, activeItem?.kind, isCardVisible, shouldLoadMedia, forcedPaused]);

  const toggleMuted = () => {
    writeGlobalMuted(!muted);
  };

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node) return;

    if (node.paused) {
      setForcedPaused(false);
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      setForcedPaused(true);
      node.pause();
    }
  };

  const progress =
    duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;

  if (!media.length) {
    return null;
  }

  if (!shouldLoadMedia) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-soft">
        <div className="absolute inset-0 animate-pulse bg-surface-soft" />
      </div>
    );
  }

  return (
    <div
      className="relative"
      onClick={() => {
        if (activeIsVideo) {
          togglePlay();
          return;
        }

        onOpen();
      }}
    >
      <FeedCarousel
        items={media}
        activeIndex={mediaIndex}
        onChange={onChangeMediaIndex}
        aspectClass="aspect-[4/5]"
        mediaActive={isCardVisible && !forcedPaused}
        muted={muted}
        videoRef={videoRef}
        fit="cover"
        enableFullscreen={false}
        mode="fixed"
        maxMediaHeightClass="max-h-[70vh]"
        backgroundClass="bg-black"
        nativeVideoControls={false}
        blockVideoClickPropagation
      />

      {activeIsVideo ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3">
            <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePlay();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
                  aria-label={isVideoPlaying ? copy.pause : copy.play}
                >
                  {isVideoPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleMuted();
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
                  aria-label={muted ? copy.unmute : copy.mute}
                >
                  {muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}