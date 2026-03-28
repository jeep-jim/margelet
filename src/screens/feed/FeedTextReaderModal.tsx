import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  FileText,
  Heart,
  ImageIcon,
  Music4,
  Send,
} from "lucide-react";
import { useMemo } from "react";
import type { Locale, Video } from "../../types/app";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { getDisplayText, normalizeMediaList } from "./feed.utils";

type MediaKind =
  | "none"
  | "image"
  | "video"
  | "gif"
  | "audio"
  | "file"
  | "external_media";

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

function getMediaKind(video: Video | null): MediaKind {
  if (!video) return "none";
  const kind = (video as any).mediaKind;
  if (
    kind === "image" ||
    kind === "video" ||
    kind === "gif" ||
    kind === "audio" ||
    kind === "file" ||
    kind === "external_media"
  ) {
    return kind;
  }

  const media = normalizeMediaList(video);
  if (media.some((item) => item.type === "video")) return "video";
  if (media.some((item) => item.type === "image")) return "image";
  return "none";
}

function getImageUrl(video: Video | null) {
  if (!video) return null;

  const media = normalizeMediaList(video);
  const firstImage = media.find((item) => item.type === "image");
  if (firstImage?.url) return firstImage.url;

  return (video as any).previewUrl || null;
}

function getGifVideoUrl(video: Video | null) {
  if (!video) return null;

  const anyVideo = video as any;
  if (typeof anyVideo.videoUrl === "string" && anyVideo.videoUrl) {
    return anyVideo.videoUrl;
  }

  const media = normalizeMediaList(video);
  const videoItem = media.find((item) => item.type === "video");
  return videoItem?.url || null;
}

function getAudioUrl(video: Video | null) {
  if (!video) return null;
  return (video as any).audio || (video as any).audioUrl || null;
}

function getFileUrl(video: Video | null) {
  if (!video) return null;
  return (video as any).file || (video as any).fileUrl || null;
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

function ReaderMediaBlock({ video }: { video: Video }) {
  const kind = getMediaKind(video);
  const imageUrl = getImageUrl(video);
  const gifVideoUrl = getGifVideoUrl(video);
  const audioUrl = getAudioUrl(video);
  const fileUrl = getFileUrl(video);

  if (kind === "image" && imageUrl) {
    return (
      <div className="mb-4 overflow-hidden rounded-3xl bg-neutral-100">
        <img
          src={imageUrl}
          alt={video.channel}
          className="h-auto w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
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

    if (imageUrl) {
      return (
        <div className="mb-4 overflow-hidden rounded-3xl bg-neutral-100">
          <img
            src={imageUrl}
            alt={video.channel}
            className="h-auto w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
  }

  if (kind === "audio") {
    return (
      <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
            <Music4 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-neutral-950">
              Аудио из поста Telegram
            </div>
            <div className="mt-1 text-sm text-neutral-500">
              Откройте в Telegram, чтобы прослушать оригинал.
            </div>

            {audioUrl ? (
              <audio className="mt-3 w-full" controls preload="none">
                <source src={audioUrl} />
              </audio>
            ) : null}
          </div>
        </div>
      </div>
    );
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

  if (!imageUrl && !(video as any).videoUrl && ((video as any).hasMediaInOriginal || false)) {
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