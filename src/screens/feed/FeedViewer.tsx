import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Heart,
  Pause,
  Play,
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
const SUB_KEY = "margelet_subscriptions";
const TG_STORAGE_KEY = "margelet_tg_user";

const COPY = {
  en: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
  },
  ru: {
    play: "Воспроизвести",
    pause: "Пауза",
    mute: "Выключить звук",
    unmute: "Включить звук",
  },
  de: {
    play: "Abspielen",
    pause: "Pause",
    mute: "Ton aus",
    unmute: "Ton an",
  },
  es: {
    play: "Reproducir",
    pause: "Pausa",
    mute: "Silenciar",
    unmute: "Activar sonido",
  },
  tr: {
    play: "Oynat",
    pause: "Duraklat",
    mute: "Sesi kapat",
    unmute: "Sesi aç",
  },
  fr: {
    play: "Lire",
    pause: "Pause",
    mute: "Couper le son",
    unmute: "Activer le son",
  },
  it: {
    play: "Riproduci",
    pause: "Pausa",
    mute: "Disattiva audio",
    unmute: "Attiva audio",
  },
  "pt-br": {
    play: "Reproduzir",
    pause: "Pausar",
    mute: "Silenciar",
    unmute: "Ativar som",
  },
  id: {
    play: "Putar",
    pause: "Jeda",
    mute: "Matikan suara",
    unmute: "Nyalakan suara",
  },
  pl: {
    play: "Odtwórz",
    pause: "Pauza",
    mute: "Wycisz",
    unmute: "Włącz dźwięk",
  },
} as const;

function readTelegramUserId() {
  try {
    const raw = localStorage.getItem(TG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
}

async function trackAction(params: {
  action: "open" | "like" | "subscribe";
  postId: number;
  sourceHandle: string;
  telegramUserId?: string | null;
}) {
  try {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-id": params.telegramUserId || "",
      },
      body: JSON.stringify({
        action: params.action,
        postId: params.postId,
        sourceHandle: params.sourceHandle,
        telegramUserId: params.telegramUserId || null,
      }),
    });

    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

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

function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);

  const next = exists
    ? current.filter((h) => h !== handle)
    : [...current, handle];

  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.|t\.me\/)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href = part.startsWith("http")
      ? part
      : part.startsWith("t.me/")
        ? `https://${part}`
        : `https://${part}`;

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

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FeedViewer({
  locale,
  activePost,
  viewerDirection: _viewerDirection,
  expandedCaption: _expandedCaption,
  setExpandedCaption: _setExpandedCaption,
  isMuted,
  setIsMuted,
  isPlaying,
  setIsPlaying,
  copySuccessId: _copySuccessId,
  menuPostId: _menuPostId,
  setMenuPostId: _setMenuPostId,
  actionError: _actionError,
  videoProgress: _videoProgress,
  viewerMediaIndex,
  setViewerMediaIndex,
  likedPostIds,
  savedPostIds: _savedPostIds,
  onToggleLike,
  onToggleSave: _onToggleSave,
  onHidePost: _onHidePost,
  onDeletePost: _onDeletePost,
  currentTelegramUserId: _currentTelegramUserId,
  openSource: _openSource,
  closeViewer,
  nextViewer,
  prevViewer,
  handleShare: _handleShare,
  setActionError: _setActionError,
}: ViewerProps) {
  const copy = COPY[locale] ?? COPY.en;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const centerTimerRef = useRef<number | null>(null);
  const autoplayWantedRef = useRef(isPlaying);

  const [expandedText, setExpandedText] = useState(false);
  const [showCenterControl, setShowCenterControl] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [localLiked, setLocalLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

  const activeItem =
    media[Math.min(viewerMediaIndex, Math.max(media.length - 1, 0))] || null;
  const activeIsVideo = activeItem?.kind === "video";

  useEffect(() => {
    autoplayWantedRef.current = isPlaying;
  }, [isPlaying]);

    useEffect(() => {
    if (!activePost) return;
    setLocalLiked(likedPostIds.includes(activePost.id));
  }, [activePost?.id, likedPostIds]);

  useEffect(() => {
    if (!activePost) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [activePost]);

  useEffect(() => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
  }, [activePost?.id]);

  useEffect(() => {
    if (!activePost) return;

    setExpandedText(false);
    setShowCenterControl(false);
    setSubscribed(getSubs().includes(activePost.source.handle));
    setCurrentTime(0);
    setDuration(0);

    const telegramUserId = readTelegramUserId();

    void trackAction({
      action: "open",
      postId: activePost.id,
      sourceHandle: activePost.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.subscribed === "boolean") {
        setSubscribed(data.subscribed);
      }
    });
  }, [activePost?.id, activePost?.source.handle, viewerMediaIndex]);  

  useEffect(() => {
    setIsMuted(readGlobalMuted());
  }, [activePost?.id, setIsMuted]);

  useEffect(() => {
    return () => {
      if (centerTimerRef.current) {
        window.clearTimeout(centerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const node = videoRef.current;

    if (!node || activeItem?.kind !== "video") {
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    const syncMeta = () => {
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const syncTime = () => {
      setCurrentTime(node.currentTime || 0);
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const onLoadedMetadata = () => {
      syncMeta();
      syncTime();
    };

    const onDurationChange = () => {
      syncMeta();
      syncTime();
    };

    const onTimeUpdate = () => {
      syncTime();
    };

    const onPlay = () => {
      setIsPlaying(true);
      syncTime();
    };

    const onPause = () => {
      setIsPlaying(false);
      syncTime();
    };

    node.addEventListener("loadedmetadata", onLoadedMetadata);
    node.addEventListener("durationchange", onDurationChange);
    node.addEventListener("timeupdate", onTimeUpdate);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    node.addEventListener("ended", onPause);

    node.load();

    const playIfNeeded = () => {
      if (!autoplayWantedRef.current) return;
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    };

    if (node.readyState >= 1) {
      syncMeta();
      syncTime();
      playIfNeeded();
    } else {
      const handleCanPlay = () => {
        syncMeta();
        syncTime();
        playIfNeeded();
      };

      node.addEventListener("canplay", handleCanPlay, { once: true });

      return () => {
        node.removeEventListener("loadedmetadata", onLoadedMetadata);
        node.removeEventListener("durationchange", onDurationChange);
        node.removeEventListener("timeupdate", onTimeUpdate);
        node.removeEventListener("play", onPlay);
        node.removeEventListener("pause", onPause);
        node.removeEventListener("ended", onPause);
        node.removeEventListener("canplay", handleCanPlay);
      };
    }

    return () => {
      node.removeEventListener("loadedmetadata", onLoadedMetadata);
      node.removeEventListener("durationchange", onDurationChange);
      node.removeEventListener("timeupdate", onTimeUpdate);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
      node.removeEventListener("ended", onPause);
    };
  }, [activePost?.id, viewerMediaIndex, activeItem?.id, activeItem?.kind, setIsPlaying]);  

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = isMuted;
    writeGlobalMuted(isMuted);
  }, [isMuted, viewerMediaIndex, activePost?.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activeIsVideo) return;

    if (isPlaying) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isPlaying, activeIsVideo, activeItem?.id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!activePost) return;

      if (event.key === "Escape") {
        closeViewer();
      } else if (event.key === "ArrowDown") {
        nextViewer();
      } else if (event.key === "ArrowUp") {
        prevViewer();
      } else if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activePost, closeViewer, nextViewer, prevViewer]);

  if (!activePost || activePost.contentType !== "video") {
    return null;
  }

  const canToggleText = (activePost.text || "").length > 60;

  const pulseCenterControl = () => {
    setShowCenterControl(true);
    if (centerTimerRef.current) {
      window.clearTimeout(centerTimerRef.current);
    }
    centerTimerRef.current = window.setTimeout(() => {
      setShowCenterControl(false);
    }, 650);
  };

  const togglePlay = () => {
    const node = videoRef.current;
    if (!node || !activeIsVideo) return;

    if (node.paused) {
      autoplayWantedRef.current = true;
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
      setIsPlaying(true);
      pulseCenterControl();
    } else {
      autoplayWantedRef.current = false;
      node.pause();
      setIsPlaying(false);
      setShowCenterControl(true);
    }
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

  const handleLikeClick = () => {
    const telegramUserId = readTelegramUserId();

    setLocalLiked((prev) => !prev);
    onToggleLike(activePost.id);

    if (!telegramUserId) return;

    void trackAction({
      action: "like",
      postId: activePost.id,
      sourceHandle: activePost.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.liked === "boolean") {
        setLocalLiked(data.liked);
      }
    });
  };

  const handleSubscribeClick = () => {
    const telegramUserId = readTelegramUserId();
    const next = toggleSub(activePost.source.handle);

    setSubscribed(next.includes(activePost.source.handle));
    window.dispatchEvent(new Event("storage"));

    if (!telegramUserId) return;

    void trackAction({
      action: "subscribe",
      postId: activePost.id,
      sourceHandle: activePost.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.subscribed === "boolean") {
        setSubscribed(data.subscribed);
      }
    });
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
              onClick={handleSubscribeClick}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
            >
              <Bell
                className={`h-5 w-5 ${
                  subscribed ? "fill-current text-white" : "text-white"
                }`}
              />
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

          <div
            className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-10 text-white"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            <div className="w-full md:max-w-[380px]">
              <div className="flex items-end justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
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

                <button
                  type="button"
                  onClick={handleLikeClick}
                  className="mb-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-sm"
                >
                  <Heart className={`h-6 w-6 ${localLiked ? "fill-current" : ""}`} />
                </button>
              </div>

              {activePost.text ? (
                <div className="mt-3">
                  <div
                    role={canToggleText ? "button" : undefined}
                    tabIndex={canToggleText ? 0 : undefined}
                    className={`text-[15px] leading-6 text-white ${
                      expandedText ? "overflow-y-auto" : "line-clamp-1"
                    } ${canToggleText ? "cursor-pointer" : ""}`}
                    style={
                      expandedText
                        ? { maxHeight: `${MAX_EXPANDED_TEXT_HEIGHT}px` }
                        : undefined
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!canToggleText) return;
                      setExpandedText((prev) => !prev);
                    }}
                    onKeyDown={(event) => {
                      if (!canToggleText) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setExpandedText((prev) => !prev);
                      }
                    }}
                    onWheel={(event) => event.stopPropagation()}
                    onTouchStart={(event) => event.stopPropagation()}
                    onTouchMove={(event) => event.stopPropagation()}
                    onTouchEnd={(event) => event.stopPropagation()}
                  >
                    {linkifyText(activePost.text)}
                  </div>
                </div>
              ) : null}
            </div>

            {activeIsVideo ? (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    togglePlay();
                  }}
                  className="pointer-events-auto relative z-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
                  aria-label={isPlaying ? copy.pause : copy.play}
                >
                  {isPlaying ? (
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
                  onChange={(event) => {
                    event.stopPropagation();
                    const node = videoRef.current;
                    if (!node) return;

                    const next = Number(event.target.value);
                    node.currentTime = next;
                    setCurrentTime(next);
                  }}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                  }}
                  className="pointer-events-auto relative z-50 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/30 accent-white"
                />

                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const next = !isMuted;
                    setIsMuted(next);
                    writeGlobalMuted(next);
                  }}
                  className="pointer-events-auto relative z-50 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm touch-manipulation"
                  aria-label={isMuted ? copy.unmute : copy.mute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            ) : null}            
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}