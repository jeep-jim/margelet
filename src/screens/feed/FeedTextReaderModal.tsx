import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  ExternalLink,
  FileText,
  Heart,
  ImageIcon,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { MediaDots } from "./FeedCarousel";

const HORIZONTAL_SWIPE_DISTANCE = 48;

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.)/i.test(part);

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
    <div className="space-y-4 text-[16px] leading-6 text-neutral-900">
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

function ReaderImageCarousel({
  items,
  alt,
}: {
  items: IngestedPost["media"];
  alt: string;
}) {
  const images = items.filter((item) => item.kind === "image");
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [items]);

  if (images.length === 0) return null;

  const current = images[Math.min(activeIndex, images.length - 1)];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < images.length - 1;

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

      {images.length > 1 ? (
        <>
          <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            {activeIndex + 1}/{images.length}
          </div>

          <MediaDots
            total={images.length}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            light
          />
        </>
      ) : null}
    </div>
  );
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

function ReaderMediaBlock({ post }: { post: IngestedPost }) {
  const imageItems = post.media.filter((item) => item.kind === "image");
  const videoItem = post.media.find((item) => item.kind === "video");
  const audioItem = post.media.find((item) => item.kind === "audio");
  const fileItem = post.media.find((item) => item.kind === "file");

  if (imageItems.length > 0) {
    return <ReaderImageCarousel items={imageItems} alt={post.source.title} />;
  }

  if (videoItem) {
    return (
      <div className="mb-4 overflow-hidden rounded-3xl bg-black">
        <video
          src={videoItem.url}
          poster={videoItem.poster || undefined}
          className="h-auto w-full"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  if (audioItem) {
    return (
      <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
        <audio src={audioItem.url} controls className="w-full" preload="metadata" />
      </div>
    );
  }

  if (fileItem) {
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

            <a
              href={fileItem.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              <span>Открыть файл</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (post.hasMediaInOriginal) {
    return (
      <MediaNotice icon={<ImageIcon className="h-5 w-5 text-neutral-500" />}>
        В этом посте есть медиа в Telegram. Здесь показываем только текст.
      </MediaNotice>
    );
  }

  return null;
}

export function FeedTextReaderModal({
  post,
  locale: _locale,
  liked,
  saved,
  onClose,
  onToggleLike,
  onToggleSave,
  onShare,
}: {
  post: IngestedPost | null;
  locale: "ru" | "en";
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onShare: (post: IngestedPost) => Promise<void>;
}) {
  const text = post?.text || "";

  return (
    <AnimatePresence>
      {post ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] w-full max-w-[720px] overflow-hidden rounded-t-[32px] bg-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-semibold text-neutral-900">
                Пост из Telegram
              </div>

              <div className="w-10" />
            </div>

            <div className="max-h-[calc(92vh-68px)] overflow-y-auto px-4 pb-8 pt-4">
              <div className="mb-4 flex items-center gap-3">
                <FeedSourceAvatar post={post} size="md" />

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="truncate text-[18px] font-semibold text-neutral-950">
                      {post.source.title}
                    </div>
                    {post.source.verified ? (
                      <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                    ) : null}
                  </div>

                  <div className="truncate text-sm text-neutral-500">
                    @{post.source.handle}
                  </div>
                </div>
              </div>

              <ReaderMediaBlock post={post} />

              {text ? <RichTextBlock text={text} /> : null}

              <div className="mt-6 flex items-center gap-8 text-neutral-700">
                <button type="button" onClick={() => onToggleLike(post.id)}>
                  <Heart
                    className={`h-5 w-5 ${liked ? "fill-current text-neutral-950" : ""}`}
                  />
                </button>

                <button type="button" onClick={() => onToggleSave(post.id)}>
                  <Bookmark
                    className={`h-5 w-5 ${saved ? "fill-current text-neutral-950" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void onShare(post);
                  }}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}