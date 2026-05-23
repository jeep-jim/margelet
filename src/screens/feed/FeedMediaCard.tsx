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

function stopEvent(event: {
  stopPropagation: () => void;
  preventDefault?: () => void;
}) {
  event.stopPropagation();
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
    ru: {
      mute: "Выключить звук",
      unmute: "Включить звук",
      play: "Воспроизвести",
      pause: "Пауза",
    },
    ua: {
      mute: "Вимкнути звук",
      unmute: "Увімкнути звук",
      play: "Відтворити",
      pause: "Пауза",
    },
    us: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    in: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    ir: {
      mute: "بی‌صدا",
      unmute: "با صدا",
      play: "پخش",
      pause: "توقف",
    },
    tr: {
      mute: "Sesi kapat",
      unmute: "Sesi aç",
      play: "Oynat",
      pause: "Duraklat",
    },
    br: {
      mute: "Silenciar",
      unmute: "Ativar som",
      play: "Reproduzir",
      pause: "Pausar",
    },
    kz: {
      mute: "Дыбысты өшіру",
      unmute: "Дыбысты қосу",
      play: "Ойнату",
      pause: "Пауза",
    },
    uz: {
      mute: "Ovozni o‘chirish",
      unmute: "Ovozni yoqish",
      play: "Ijro etish",
      pause: "Pauza",
    },
    ae: {
      mute: "كتم الصوت",
      unmute: "تشغيل الصوت",
      play: "تشغيل",
      pause: "إيقاف",
    },
    eg: {
      mute: "كتم الصوت",
      unmute: "تشغيل الصوت",
      play: "تشغيل",
      pause: "إيقاف",
    },
    pk: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    id: {
      mute: "Matikan suara",
      unmute: "Nyalakan suara",
      play: "Putar",
      pause: "Jeda",
    },
    mx: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      play: "Reproducir",
      pause: "Pausa",
    },
    sa: {
      mute: "كتم الصوت",
      unmute: "تشغيل الصوت",
      play: "تشغيل",
      pause: "إيقاف",
    },
    es: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      play: "Reproducir",
      pause: "Pausa",
    },
    it: {
      mute: "Disattiva audio",
      unmute: "Attiva audio",
      play: "Riproduci",
      pause: "Pausa",
    },
    fr: {
      mute: "Couper le son",
      unmute: "Activer le son",
      play: "Lire",
      pause: "Pause",
    },
    de: {
      mute: "Ton aus",
      unmute: "Ton an",
      play: "Abspielen",
      pause: "Pause",
    },
    ar: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      play: "Reproducir",
      pause: "Pausa",
    },
    co: {
      mute: "Silenciar",
      unmute: "Activar sonido",
      play: "Reproducir",
      pause: "Pausa",
    },
    za: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    ng: { mute: "Mute", unmute: "Unmute", play: "Play", pause: "Pause" },
    cn: {
      mute: "静音",
      unmute: "开启声音",
      play: "播放",
      pause: "暂停",
    },
    my: {
      mute: "Bisu",
      unmute: "Buka suara",
      play: "Main",
      pause: "Jeda",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.us;
  const media = useMemo(() => normalizeMediaList(post), [post]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [muted, setMuted] = useState(readGlobalMuted());
  const [forcedPaused, setForcedPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isWideVideo, setIsWideVideo] = useState(false);

  const activeItem =
    media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;

  const activeIsVideo = activeItem?.kind === "video";
  const activeIsWideVideo = activeIsVideo && isWideVideo;

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
      setIsWideVideo(false);
      return;
    }

    const syncMeta = () => {
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
      setIsWideVideo(
        Number(node.videoWidth) > 0 &&
          Number(node.videoHeight) > 0 &&
          node.videoWidth > node.videoHeight
      );
    };

    const syncTime = () => {
      if (!isSeeking) {
        setCurrentTime(node.currentTime || 0);
      }
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const onPlay = () => {
      setIsVideoPlaying(true);
      syncTime();
    };

    const onPause = () => {
      setIsVideoPlaying(false);
      syncTime();
    };

    const onLoadedData = () => {
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
      setCurrentTime(node.currentTime || 0);
    };

    node.addEventListener("loadedmetadata", syncMeta);
    node.addEventListener("loadeddata", onLoadedData);
    node.addEventListener("durationchange", syncMeta);
    node.addEventListener("timeupdate", syncTime);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    node.addEventListener("ended", onPause);

    syncMeta();
    syncTime();
    setIsVideoPlaying(!node.paused);

    return () => {
      node.removeEventListener("loadedmetadata", syncMeta);
      node.removeEventListener("loadeddata", onLoadedData);
      node.removeEventListener("durationchange", syncMeta);
      node.removeEventListener("timeupdate", syncTime);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("ended", onPause);
    };
  }, [activeItem?.id, activeItem?.kind, isSeeking]);

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
    if (!node || activeItem?.kind !== "video") return;

    if (!shouldLoadMedia) {
      node.pause();
      setIsVideoPlaying(false);
      return;
    }

    if (isCardVisible && !forcedPaused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise
          .then(() => {
            setIsVideoPlaying(true);
            setCurrentTime(node.currentTime || 0);
            setDuration(Number.isFinite(node.duration) ? node.duration : 0);
          })
          .catch(() => {});
      } else {
        setIsVideoPlaying(!node.paused);
        setCurrentTime(node.currentTime || 0);
        setDuration(Number.isFinite(node.duration) ? node.duration : 0);
      }
    } else {
      node.pause();
    }
  }, [
    isCardVisible,
    forcedPaused,
    activeItem?.kind,
    mediaIndex,
    post.id,
    shouldLoadMedia,
  ]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || activeItem?.kind !== "video") return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const tick = () => {
      if (!node) return;

      if (!isSeeking) {
        setCurrentTime(node.currentTime || 0);
      }
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
      setIsVideoPlaying(!node.paused && !node.ended);

      if (!node.paused && !node.ended) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (shouldLoadMedia && isCardVisible && !forcedPaused) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    activeItem?.id,
    activeItem?.kind,
    shouldLoadMedia,
    isCardVisible,
    forcedPaused,
    isSeeking,
  ]);

  const handleOpen = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
    onOpen();
  };

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node || !activeIsVideo) return;

    if (node.paused) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise
          .then(() => {
            setForcedPaused(false);
            setIsVideoPlaying(true);
            setCurrentTime(node.currentTime || 0);
            setDuration(Number.isFinite(node.duration) ? node.duration : 0);
          })
          .catch(() => {});
      } else {
        setForcedPaused(false);
        setIsVideoPlaying(true);
      }
    } else {
      node.pause();
      setForcedPaused(true);
      setIsVideoPlaying(false);
    }
  };

  const seekTo = (value: number) => {
    const node = videoRef.current;
    if (!node) return;

    const next = Number.isFinite(value) ? value : 0;
    node.currentTime = next;
    setCurrentTime(next);
  };

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
        fit={activeIsVideo || activeIsWideVideo ? "contain" : "contain"}
        mode={activeIsVideo ? "adaptive" : "adaptive"}
        maxMediaHeightClass={activeIsVideo ? "max-h-[520px]" : "max-h-[460px]"}
        backgroundClass={activeIsVideo ? "bg-black" : "bg-surface"}
        
        enableFullscreen={!activeIsVideo}
        nativeVideoControls={false}
        blockVideoClickPropagation={false}
      />

      {activeIsVideo ? (
        <>
          <button
            type="button"
            onClick={handleOpen}
            className="absolute inset-x-0 top-0 bottom-[58px] z-10"
            aria-label="Open video post"
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-2 pt-8">
            <div
              className="pointer-events-auto flex items-center gap-3"
              onClick={stopEvent}
              onMouseDown={stopEvent}
              onTouchStart={stopEvent}
              onTouchMove={stopEvent}
              onTouchEnd={stopEvent}
              onPointerDown={stopEvent}
              onPointerMove={stopEvent}
              onPointerUp={stopEvent}
            >
              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  togglePlay();
                }}
                className="relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
                aria-label={isVideoPlaying ? copy.pause : copy.play}
              >
                {isVideoPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="ml-0.5 h-5 w-5" />
                )}
              </button>

              <div className="min-w-[72px] text-[12px] font-medium text-white">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(currentTime, duration || 0)}
                onInput={(event) => {
                  event.stopPropagation();
                  seekTo(Number((event.target as HTMLInputElement).value));
                }}
                onChange={(event) => {
                  event.stopPropagation();
                  seekTo(Number(event.target.value));
                }}
                onMouseDown={(event) => {
                  setIsSeeking(true);
                  event.stopPropagation();
                }}
                onMouseUp={(event) => {
                  setIsSeeking(false);
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  setIsSeeking(true);
                  event.stopPropagation();
                }}
                onTouchEnd={(event) => {
                  setIsSeeking(false);
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  setIsSeeking(true);
                  event.stopPropagation();
                }}
                onPointerUp={(event) => {
                  setIsSeeking(false);
                  event.stopPropagation();
                }}
                className="relative z-50 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
              />

              <button
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  const next = !muted;
                  setMuted(next);
                  writeGlobalMuted(next);
                }}
                className="relative z-50 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
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
        </>
      ) : null}
    </div>
  );
}