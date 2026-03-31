import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  FileText,
  Heart,
  Send,
  Music4,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { FeedCarousel } from "./FeedCarousel";
import { normalizeMediaList } from "./feed.utils";

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.|t\.me\/)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href =
      part.startsWith("http")
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
    <div className="space-y-4 text-[16px] leading-7 text-neutral-900">
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

function AudioList({
  items,
}: {
  items: Array<{
    id: string;
    url: string;
    fileName?: string | null;
  }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || `${item.url}-${index}`}
          className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
              <Music4 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-950">
                {item.fileName?.trim() || `Аудио ${index + 1}`}
              </div>

              <div className="mt-1 text-sm text-neutral-500">
                Аудио из поста Telegram
              </div>
            </div>
          </div>

          <audio
            src={item.url}
            controls
            preload="metadata"
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}

function FileList({
  items,
}: {
  items: Array<{
    id: string;
    url: string;
    fileName?: string | null;
  }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || `${item.url}-${index}`}
          className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-950">
                {item.fileName?.trim() || `Файл ${index + 1}`}
              </div>

              <div className="mt-1 text-sm text-neutral-500">
                Вложение из поста Telegram
              </div>

              <a
                href={item.url}
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
      ))}
    </div>
  );
}

export function FeedTextReaderModal({
  post,
  locale: _locale,
  liked,
  onClose,
  onToggleLike,
  onToggleSave: _onToggleSave,
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
  const media = useMemo(() => (post ? normalizeMediaList(post) : []), [post]);
  const [mediaIndex, setMediaIndex] = useState(0);

  const visualMedia = media.filter(
    (item) => item.kind === "image" || item.kind === "video"
  );

  const audioMedia = media.filter((item) => item.kind === "audio");
  const fileMedia = media.filter((item) => item.kind === "file");

  return (
    <AnimatePresence>
      {post ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[32px] bg-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
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

              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
              >
                <Bell className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4">
              <button
                type="button"
                onClick={() => window.location.assign(`/${post.source.handle}`)}
                className="mb-4 flex items-center gap-3 text-left"
              >
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
              </button>

              {visualMedia.length > 0 ? (
                <div className="mb-4">
                  <FeedCarousel
                    items={visualMedia}
                    aspectClass="aspect-[4/5]"
                    activeIndex={Math.min(mediaIndex, Math.max(visualMedia.length - 1, 0))}
                    onChange={setMediaIndex}
                    controlsTone="dark"
                    fit="contain"
                    enableFullscreen
                  />
                </div>
              ) : null}

              <AudioList items={audioMedia} />

              <FileList items={fileMedia} />

              {text ? <RichTextBlock text={text} /> : null}
            </div>

            <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-8 text-neutral-700">
                  <button type="button" onClick={() => onToggleLike(post.id)}>
                    <Heart
                      className={`h-5 w-5 ${liked ? "fill-current text-neutral-950" : ""}`}
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

                <button
                  type="button"
                  onClick={() => {
                    window.open(post.postUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white"
                >
                  <span>Открыть в Telegram</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}