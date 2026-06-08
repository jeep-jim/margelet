import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  MoreVertical,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ViewerProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { normalizeMediaList } from "./feed.utils";
import { ADMIN_TELEGRAM_IDS } from "./feed.constants";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { getAutotranslit, getCountryLanguage, requestGTranslate } from "../../lib/autotranslit";

const MAX_EXPANDED_TEXT_HEIGHT = 260;
const FEED_MUTE_KEY = "margelet_feed_muted";
const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";
const SUB_KEY = "margelet_subscriptions";

const COPY = {
  us: {
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
  ua: {
    play: "Відтворити",
    pause: "Пауза",
    mute: "Вимкнути звук",
    unmute: "Увімкнути звук",
  },
  in: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
  },
  ir: {
    play: "پخش",
    pause: "توقف",
    mute: "بی‌صدا",
    unmute: "با صدا",
  },
  tr: {
    play: "Oynat",
    pause: "Duraklat",
    mute: "Sesi kapat",
    unmute: "Sesi aç",
  },
  br: {
    play: "Reproduzir",
    pause: "Pausar",
    mute: "Silenciar",
    unmute: "Ativar som",
  },
  kz: {
    play: "Ойнату",
    pause: "Пауза",
    mute: "Дыбысты өшіру",
    unmute: "Дыбысты қосу",
  },
  uz: {
    play: "Ijro etish",
    pause: "Pauza",
    mute: "Ovozni o‘chirish",
    unmute: "Ovozni yoqish",
  },
  ae: {
    play: "تشغيل",
    pause: "إيقاف",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
  },
  eg: {
    play: "تشغيل",
    pause: "إيقاف",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
  },
  pk: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
  },
  id: {
    play: "Putar",
    pause: "Jeda",
    mute: "Matikan suara",
    unmute: "Nyalakan suara",
  },
  mx: {
    play: "Reproducir",
    pause: "Pausa",
    mute: "Silenciar",
    unmute: "Activar sonido",
  },
  sa: {
    play: "تشغيل",
    pause: "إيقاف",
    mute: "كتم الصوت",
    unmute: "تشغيل الصوت",
  },
  es: {
    play: "Reproducir",
    pause: "Pausa",
    mute: "Silenciar",
    unmute: "Activar sonido",
  },
  it: {
    play: "Riproduci",
    pause: "Pausa",
    mute: "Disattiva audio",
    unmute: "Attiva audio",
  },
  fr: {
    play: "Lire",
    pause: "Pause",
    mute: "Couper le son",
    unmute: "Activer le son",
  },
  de: {
    play: "Abspielen",
    pause: "Pause",
    mute: "Ton aus",
    unmute: "Ton an",
  },
  ar: {
    play: "Reproducir",
    pause: "Pausa",
    mute: "Silenciar",
    unmute: "Activar sonido",
  },
  co: {
    play: "Reproducir",
    pause: "Pausa",
    mute: "Silenciar",
    unmute: "Activar sonido",
  },
  za: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
  },
  ng: {
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
  },
  cn: {
    play: "播放",
    pause: "暂停",
    mute: "静音",
    unmute: "开启声音",
  },
  my: {
    play: "Main",
    pause: "Jeda",
    mute: "Bisu",
    unmute: "Buka suara",
  },
} as const;

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

function unlockTranslatePath(target: HTMLElement | null) {
  if (typeof document === "undefined" || !target) return () => {};

  const touched: Array<{
    element: HTMLElement;
    hadNoTranslate: boolean;
    prevTranslate: string | null;
  }> = [];

  const remember = (element: HTMLElement) => {
    if (touched.some((item) => item.element === element)) return;
    touched.push({
      element,
      hadNoTranslate: element.classList.contains("notranslate"),
      prevTranslate: element.getAttribute("translate"),
    });
  };

  let node: HTMLElement | null = target;

  while (node && node !== document.body && node !== document.documentElement) {
    remember(node);
    node.classList.remove("notranslate");
    node.setAttribute("translate", "yes");
    node = node.parentElement;
  }

  target.querySelectorAll<HTMLElement>("*").forEach((element) => {
    remember(element);
    element.classList.remove("notranslate");
    element.setAttribute("translate", "yes");
  });

  target.classList.add("margelet-translatable");
  target.setAttribute("translate", "yes");

  return () => {
    touched.forEach(({ element, hadNoTranslate, prevTranslate }) => {
      if (hadNoTranslate) {
        element.classList.add("notranslate");
      } else {
        element.classList.remove("notranslate");
      }

      if (prevTranslate === null) {
        element.removeAttribute("translate");
      } else {
        element.setAttribute("translate", prevTranslate);
      }
    });
  };
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
  menuPostId,
  setMenuPostId,
  actionError: _actionError,
  videoProgress: _videoProgress,
  viewerMediaIndex,
  setViewerMediaIndex,
  likedPostIds: _likedPostIds,
  savedPostIds: _savedPostIds,
  onToggleLike: _onToggleLike,
  onToggleSave: _onToggleSave,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource: _openSource,
  closeViewer,
  nextViewer,
  prevViewer,
  setActionError: _setActionError,
}: ViewerProps) {
  const copy = COPY[locale] ?? COPY.us;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const captionTranslateCleanupRef = useRef<(() => void) | null>(null);
  const wheelLockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);
  const centerTimerRef = useRef<number | null>(null);
  const autoplayWantedRef = useRef(isPlaying);

  const [expandedText, setExpandedText] = useState(false);
  const [showCenterControl, setShowCenterControl] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; right: number } | null>(null);

  const media = useMemo(() => {
    return activePost ? normalizeMediaList(activePost) : [];
  }, [activePost]);

  const activeItem =
    media[Math.min(viewerMediaIndex, Math.max(media.length - 1, 0))] || null;
  const activeIsVideo = activeItem?.kind === "video";

  useEffect(() => {
    captionTranslateCleanupRef.current?.();
    captionTranslateCleanupRef.current = null;

    if (!activePost || !getAutotranslit()) return;

    captionTranslateCleanupRef.current = unlockTranslatePath(captionRef.current);

    const timers = [160, 520, 1100, 1800].map((delay) =>
      window.setTimeout(() => {
        captionTranslateCleanupRef.current?.();
        captionTranslateCleanupRef.current = unlockTranslatePath(captionRef.current);
        (window as any).__MARGELET_PROTECT_TRANSLATE_UI__?.(document);
        captionTranslateCleanupRef.current?.();
        captionTranslateCleanupRef.current = unlockTranslatePath(captionRef.current);
        requestGTranslate(locale);
      }, delay),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      captionTranslateCleanupRef.current?.();
      captionTranslateCleanupRef.current = null;
    };
  }, [activePost?.id, activePost?.text, locale, viewerMediaIndex]);

  useEffect(() => {
    autoplayWantedRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!activePost) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      captionTranslateCleanupRef.current?.();
      captionTranslateCleanupRef.current = null;
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
    setMenuPostId(null);
    setMenuAnchorRect(null);
  }, [activePost?.id, activePost?.source.handle, viewerMediaIndex, setMenuPostId]);

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
  const ownerTelegramId = activePost.addedBy?.telegramId ?? null;
  const isOwner =
    !!currentTelegramUserId &&
    !!ownerTelegramId &&
    currentTelegramUserId === ownerTelegramId;
  const isAdmin =
    !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);
  const isMenuOpen = menuPostId === activePost.id;


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

  const handleSubscribeClick = () => {
    const next = toggleSub(activePost.source.handle);

    setSubscribed(next.includes(activePost.source.handle));
    window.dispatchEvent(new Event("storage"));
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

          <div
            className="notranslate absolute left-4 z-30"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <button
              onClick={closeViewer}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          <div
            className="notranslate absolute right-4 z-30 flex items-center gap-2"
            style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleSubscribeClick();
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
              aria-label={subscribed ? "Отключить уведомления" : "Включить уведомления"}
            >
              <Bell
                className={`h-5 w-5 ${
                  subscribed ? "fill-current text-white" : "text-white"
                }`}
              />
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                setMenuAnchorRect({
                  top: rect.bottom,
                  right: window.innerWidth - rect.right,
                });
                setMenuPostId((prev) => (prev === activePost.id ? null : activePost.id));
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white"
              aria-label="Меню"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isMenuOpen ? (
              <FeedMoreMenu
                locale={locale}
                isOwner={isOwner}
                isAdmin={isAdmin}
                onDelete={() => {
                  void onDeletePost(activePost.id);
                  closeViewer();
                }}
                onHide={() => {
                  onHidePost(activePost.id);
                  closeViewer();
                }}
                onOpenTelegram={() => {
                  window.open(activePost.postUrl, "_blank", "noopener,noreferrer");
                }}
                onRequestClose={() => {
                  setMenuPostId(null);
                  setMenuAnchorRect(null);
                }}
                anchorRect={menuAnchorRect}
                postId={activePost.id}
                sourceHandle={activePost.source.handle}
              />
            ) : null}
          </div>

          {showCenterControl ? (
            <div className="notranslate pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
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
            className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pt-10 text-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onTouchEnd={(event) => event.stopPropagation()}
          >
            <div className="w-full md:max-w-[380px]">
              <div className="flex items-end justify-between gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activePost) {
                      _openSource(activePost.source.handle);
                      closeViewer();
                    }
                  }}
                  className="notranslate flex min-w-0 items-center gap-3 text-left"
                >
                  <FeedSourceAvatar post={activePost} />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-[18px] font-semibold">
                        {activePost.source.title}
                      </div>

                      {activePost.source.verified ? (
                        <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" />
                      ) : null}
                    </div>

                    <div className="text-sm opacity-80">
                      @{activePost.source.handle}
                    </div>
                  </div>
                </button>
              </div>

              {activePost.text ? (
                <div className="mt-3">
                  <div
                    ref={captionRef}
                    key={`${activePost.id}-${locale}-${viewerMediaIndex}`}
                    role={canToggleText ? "button" : undefined}
                    tabIndex={canToggleText ? 0 : undefined}
                    className={`margelet-translatable text-[15px] leading-6 text-white ${
                      expandedText ? "overflow-y-auto" : "line-clamp-1"
                    } ${canToggleText ? "cursor-pointer" : ""}`}
                    lang={getCountryLanguage(activePost.sourceCountryCode)}
                    translate="yes"
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
              <div className="notranslate mt-3 flex items-center gap-3">
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