import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const media = useMemo(() => normalizeMediaList(post), [post]);
  const activeItem = media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;
  const activeIsVideo = activeItem?.kind === "video";

  const [muted, setMuted] = useState(readGlobalMuted());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [forcedPaused, setForcedPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const handleMuteChange = (event: Event) => {
      const detail = (event as CustomEvent<{ muted?: boolean }>).detail;
      if (typeof detail?.muted === "boolean") {
        setMuted(detail.muted);
      }
    };

    const handlePauseAll = () => {
      setForcedPaused(true);
      const node = videoRef.current;
      if (node) {
        node.pause();
      }
      setIsVideoPlaying(false);
    };

    window.addEventListener(FEED_MUTE_EVENT, handleMuteChange as EventListener);
    window.addEventListener(FEED_PAUSE_EVENT, handlePauseAll);

    return () => {
      window.removeEventListener(FEED_MUTE_EVENT, handleMuteChange as EventListener);
      window.removeEventListener(FEED_PAUSE_EVENT, handlePauseAll);
    };
  }, []);

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
    if (!node || activeItem?.kind !== "video") {
      setCurrentTime(0);
      setDuration(0);
      setIsVideoPlaying(false);
      return;
    }

    const syncTime = () => {
      setCurrentTime(node.currentTime || 0);
      setDuration(node.duration || 0);
    };

    const onPlay = () => {
      setIsVideoPlaying(true);
      syncTime();
    };

    const onPause = () => {
      setIsVideoPlaying(false);
      syncTime();
    };

    node.addEventListener("timeupdate", syncTime);
    node.addEventListener("loadedmetadata", syncTime);
    node.addEventListener("durationchange", syncTime);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    node.addEventListener("ended", onPause);

    syncTime();

    return () => {
      node.removeEventListener("timeupdate", syncTime);
      node.removeEventListener("loadedmetadata", syncTime);
      node.removeEventListener("durationchange", syncTime);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("ended", onPause);
    };
  }, [activeItem?.id, activeItem?.kind]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || activeItem?.kind !== "video") return;

    if (isCardVisible && !forcedPaused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isCardVisible, forcedPaused, activeItem?.kind, mediaIndex, post.id]);

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node || !activeIsVideo) return;

    if (node.paused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      setForcedPaused(false);
      setIsVideoPlaying(true);
    } else {
      node.pause();
      setForcedPaused(true);
      setIsVideoPlaying(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    writeGlobalMuted(next);
  };

  return (
    <div className="relative">
      <div
        className="cursor-pointer"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      >
        <FeedCarousel
          items={media}
          aspectClass="aspect-[4/5]"
          activeIndex={mediaIndex}
          onChange={onChangeMediaIndex}
          controlsTone="light"
          mediaActive={isCardVisible && !forcedPaused}
          muted={muted}
          videoRef={videoRef}
          fit={activeIsVideo ? "cover" : "contain"}
          mode={activeIsVideo ? "fixed" : "adaptive"}
          maxMediaHeightClass={activeIsVideo ? "max-h-[520px]" : "max-h-[460px]"}
          backgroundClass={activeIsVideo ? "bg-black" : "bg-white"}
          enableFullscreen={false}
          nativeVideoControls={false}
          blockVideoClickPropagation={false}
        />
      </div>

      {activeIsVideo ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-2 pt-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  togglePlay();
                }}
                className="pointer-events-auto relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
                aria-label={isVideoPlaying ? copy.pause : copy.play}
              >
                {isVideoPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width:
                        duration > 0
                          ? `${Math.min(100, (currentTime / duration) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-white/90">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleMute();
                }}
                className="pointer-events-auto relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
                aria-label={muted ? copy.unmute : copy.mute}
              >
                {muted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}