import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Heart,
  ImageIcon,
  Pause,
  Play,
  Send,
} from "lucide-react";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale, MediaKind, PostMedia, Video } from "../../types/app";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { getDisplayText, normalizeMediaList } from "./feed.utils";

const HORIZONTAL_SWIPE_DISTANCE = 48;

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = urlRegex.test(part);
    urlRegex.lastIndex = 0;

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href = part.startsWith("http") ? part : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[#2563eb] underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {part}
      </a>
    );
  });
}

function RichTextBlock({ text }: { text: string }) {
  const paragraphs = useMemo(() => {
    return text
      .replace(/\r/g, "")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
  }, [text]);

  return (
    <div className="space-y-4 text-[16px] leading-5 text-neutral-900">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");

        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {linkifyText(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function getResolvedMediaKind(video: Video | null): MediaKind {
  if (!video) return "none";
  if (video.mediaKind) return video.mediaKind;

  const media = normalizeMediaList(video);
  if (media.some((item) => item.type === "video")) return "video";
  if (media.some((item) => item.type === "image")) return "image";

  return "none";
}

function getImageItems(video: Video | null): PostMedia[] {
  if (!video) return [];

  const media = normalizeMediaList(video);
  const imageItems = media.filter((item) => item.type === "image");

  if (imageItems.length > 0) {
    return imageItems;
  }

  if (video.previewUrl) {
    return [
      {
        id: "image-1",
        type: "image",
        url: video.previewUrl,
        poster: null,
      },
    ];
  }

  return [];
}

function getGifVideoUrl(video: Video | null) {
  if (!video) return null;

  if (video.videoUrl) {
    return video.videoUrl;
  }

  const media = normalizeMediaList(video);
  const videoItem = media.find((item) => item.type === "video");
  return videoItem?.url || null;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function MediaNotice({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 inline-flex max-w-full items-start gap-2 rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-600">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <span>{children}</span>
    </div>
  );
}

function MediaDots({
  total,
  activeIndex,
  onSelect,
}: {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-2.5 rounded-full transition-all ${
              active ? "w-5 bg-white" : "w-2.5 bg-white/45"
            }`}
            aria-label={`Переключить фото ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

function ReaderImageCarousel({ items, alt }: { items: PostMedia[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  if (items.length === 0) return null;

  const current = items[Math.min(activeIndex, items.length - 1)];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  return (
    <div
      className="relative mb-4 overflow-hidden rounded-3xl bg-neutral-100"
      onTouchStart={(event) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartXRef.current;
        const endX = event.changedTouches[0]?.clientX ?? null;
        touchStartXRef.current = null;

        if (startX === null || endX === null) return;

        const delta = endX - startX;

        if (delta <= -HORIZONTAL_SWIPE_DISTANCE && canNext) {
          setActiveIndex((prev) => prev + 1);
        }

        if (delta >= HORIZONTAL_SWIPE_DISTANCE && canPrev) {
          setActiveIndex((prev) => prev - 1);
        }
      }}
    >
      <img
        src={current.url}
        alt={alt}
        className="h-auto w-full object-cover"
        referrerPolicy="no-referrer"
      />

      {items.length > 1 ? (
        <>
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {activeIndex + 1}/{items.length}
          </div>

          {canPrev ? (
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => prev - 1)}
              className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          {canNext ? (
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => prev + 1)}
              className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}

          <MediaDots
            total={items.length}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </>
      ) : null}
    </div>
  );
}

function ReaderAudioBlock({ audioUrl }: { audioUrl: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const node = audioRef.current;
    if (!node) return;

    const handleLoadedMetadata = () => {
      setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Number.isFinite(node.currentTime) ? node.currentTime : 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    node.addEventListener("loadedmetadata", handleLoadedMetadata);
    node.addEventListener("timeupdate", handleTimeUpdate);
    node.addEventListener("ended", handleEnded);
    node.addEventListener("pause", handlePause);
    node.addEventListener("play", handlePlay);

    return () => {
      node.removeEventListener("loadedmetadata", handleLoadedMetadata);
      node.removeEventListener("timeupdate", handleTimeUpdate);
      node.removeEventListener("ended", handleEnded);
      node.removeEventListener("pause", handlePause);
      node.removeEventListener("play", handlePlay);
    };
  }, [audioUrl]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioUrl]);

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => {
            const node = audioRef.current;
            if (!node || !audioUrl) return;

            if (node.paused) {
              void node.play().catch(() => {});
            } else {
              node.pause();
            }
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white"
          aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-neutral-950">
            Аудио из поста Telegram
          </div>
          <div className="mt-1 text-sm text-neutral-500">
            {audioUrl
              ? "Можно прослушать прямо здесь или открыть оригинал в Telegram."
              : "Откройте в Telegram, чтобы прослушать оригинал."}
          </div>

          {audioUrl ? (
            <>
              <audio ref={audioRef} preload="metadata">
                <source src={audioUrl} />
              </audio>

              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-neutral-900 transition-[width] duration-100"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ReaderMediaBlock({ video }: { video: Video }) {
  const kind = getResolvedMediaKind(video);
  const imageItems = getImageItems(video);
  const gifVideoUrl = getGifVideoUrl(video);
  const audioUrl = video.audio || null;
  const fileUrl = video.file || null;

  if (kind === "image" && imageItems.length > 0) {
    return <ReaderImageCarousel items={imageItems} alt={video.channel} />;
  }

  if (kind === "gif") {
    if (gifVideoUrl) {
      return (
        <div className="mb-4 overflow-hidden rounded-3xl bg-neutral-100">
          <video
            src={gifVideoUrl}
            className="h-auto w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        </div>
      );
    }

    if (imageItems.length > 0) {
      return <ReaderImageCarousel items={imageItems} alt={video.channel} />;
    }
  }

  if (kind === "audio") {
    return <ReaderAudioBlock audioUrl={audioUrl} />;
  }

  if (kind === "file") {
    return (
      <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-950">
              Вложение из поста Telegram
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Файл доступен в оригинальном посте.
            </div>

            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
              >
                <span>Открыть файл</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "external_media") {
    return (
      <MediaNotice icon={<ImageIcon className="h-5 w-5 text-neutral-500" />}>
        В этом посте есть медиа в Telegram. Здесь показываем только текст.
      </MediaNotice>
    );
  }

  if (
    imageItems.length === 0 &&
    !video.videoUrl &&
    (video.hasMediaInOriginal || false)
  ) {
    return (
      <MediaNotice icon={<ImageIcon className="h-5 w-5 text-neutral-500" />}>
        В этом посте есть медиа в Telegram. Здесь показываем только текст.
      </MediaNotice>
    );
  }

  return null;
}

export function FeedTextReaderModal({
  video,
  locale,
  liked,
  saved,
  onClose,
  onToggleLike,
  onToggleSave,
  onShare,
}: {
  video: Video | null;
  locale: Locale;
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onShare: (video: Video) => Promise<void>;
}) {
  const text = video ? getDisplayText(video, locale) : "";

  return (
    <AnimatePresence>
      {video ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-[2px]"
        >
          <div className="mx-auto flex h-full w-full max-w-[720px] flex-col bg-white">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <a
                href={video.postUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              >
                <span className="text-white">Открыть в Telegram</span>
                <Send className="h-4 w-4 text-white" />
              </a>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 pt-5">
              <div className="mb-5 flex items-center gap-3">
                <FeedSourceAvatar video={video} size="md" />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[20px] font-semibold leading-tight text-neutral-950">
                      {video.channel}
                    </div>
                    {video.channelVerified ? (
                      <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                    ) : null}
                  </div>
                  <div className="truncate text-sm text-neutral-500">{video.handle}</div>
                </div>
              </div>

              <ReaderMediaBlock video={video} />

              {text ? <RichTextBlock text={text} /> : null}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white/96 px-4 py-3 backdrop-blur">
              <div className="mx-auto flex w-full max-w-[720px] items-center justify-between">
                <button
                  onClick={() => onToggleLike(video.id)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-neutral-900"
                  type="button"
                >
                  <Heart className={`h-5 w-5 ${liked ? "fill-current text-neutral-950" : ""}`} />
                </button>

                <button
                  onClick={() => onToggleSave(video.id)}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-neutral-900"
                  type="button"
                >
                  <Bookmark
                    className={`h-5 w-5 ${saved ? "fill-current text-neutral-950" : ""}`}
                  />
                  <span className="text-sm font-medium">Сохранить</span>
                </button>

                <button
                  onClick={() => {
                    void onShare(video);
                  }}
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-neutral-900"
                  type="button"
                >
                  <Send className="h-5 w-5" />
                  <span className="text-sm font-medium">Поделиться</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}