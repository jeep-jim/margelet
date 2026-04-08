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

  const [media, setMedia] = useState(() => normalizeMediaList(post));
  const [retryUsed, setRetryUsed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(readGlobalMuted());
  const [forcedPaused, setForcedPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const activeItem =
    media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;

  const activeIsVideo = activeItem?.kind === "video";

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
      //
    }
  };

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

    const syncPlaying = () => {
      setIsVideoPlaying(!node.paused);
    };

    node.addEventListener("loadedmetadata", syncMeta);
    node.addEventListener("timeupdate", syncTime);
    node.addEventListener("play", syncPlaying);
    node.addEventListener("pause", syncPlaying);
    node.addEventListener("ended", syncPlaying);

    syncMeta();
    syncTime();
    syncPlaying();

    return () => {
      node.removeEventListener("loadedmetadata", syncMeta);
      node.removeEventListener("timeupdate", syncTime);
      node.removeEventListener("play", syncPlaying);
      node.removeEventListener("pause", syncPlaying);
      node.removeEventListener("ended", syncPlaying);
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
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isCardVisible, forcedPaused, activeItem?.kind, mediaIndex, post.id]);

  const handleOpen = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
    onOpen();
  };

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node || !activeIsVideo) return;

    if (node.paused) {
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
      setIsVideoPlaying(true);
      setForcedPaused(false);
    } else {
      node.pause();
      setIsVideoPlaying(false);
      setForcedPaused(true);
    }
  };

  return (
    <div className="relative">
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
        enableFullscreen={!activeIsVideo}
        nativeVideoControls={false}
        blockVideoClickPropagation={false}
        onMediaError={tryRefreshMedia}
      />

      {activeIsVideo ? (
        <div
          className="absolute inset-x-0 top-0 bottom-[58px] z-10 cursor-pointer"
          onClick={handleOpen}
          aria-hidden="true"
        />
      ) : null}

      {activeIsVideo ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            togglePlay();
          }}
          className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
          aria-label={isVideoPlaying ? copy.pause : copy.play}
        >
          {isVideoPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="ml-0.5 h-5 w-5" />
          )}
        </button>
      ) : null}

      {activeIsVideo ? (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-2 pt-8">
          <div className="flex items-center gap-3">
            <div className="min-w-[72px] text-[12px] font-medium text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => {
                event.stopPropagation();
                const node = videoRef.current;
                if (!node) return;
                const next = Number(event.target.value);
                node.currentTime = next;
                setCurrentTime(next);
              }}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onTouchStart={(event) => event.stopPropagation()}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
            />

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const next = !muted;
                setMuted(next);
                writeGlobalMuted(next);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
              aria-label={muted ? copy.unmute : copy.mute}
            >
              {muted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}