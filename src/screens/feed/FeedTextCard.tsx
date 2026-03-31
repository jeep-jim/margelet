import {
  ExternalLink,
  Heart,
  ImageIcon,
  Music4,
  FileText,
  Send,
} from "lucide-react";
import type { IngestedPost } from "../../types/app";
import { getResolvedTag, getTagLabel } from "./feed.utils";

function getMediaBadge(post: IngestedPost) {
  if (post.contentType === "audio") {
    return { icon: <Music4 className="h-3.5 w-3.5" />, label: "Аудио" };
  }

  if (post.contentType === "file") {
    return { icon: <FileText className="h-3.5 w-3.5" />, label: "Файл" };
  }

  if (
    post.contentType === "image" ||
    post.contentType === "gif" ||
    post.contentType === "gallery" ||
    post.contentType === "mixed"
  ) {
    return { icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Медиа" };
  }

  if (post.hasMediaInOriginal) {
    return { icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Есть медиа" };
  }

  return null;
}

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

export function FeedTextCard({
  post,
  onOpen,
}: {
  post: IngestedPost;
  onOpen: () => void;
}) {
  const displayText = (post.text || "").trim();
  const mediaBadge = getMediaBadge(post);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
            {getTagLabel(getResolvedTag(post))}
          </div>

          {mediaBadge ? (
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
              {mediaBadge.icon}
              <span className="truncate">{mediaBadge.label}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="text-[15px] leading-6 text-neutral-900">
        <div className="line-clamp-5 whitespace-pre-wrap break-words">
          {linkifyText(displayText)}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-8 text-neutral-700">
            <button type="button">
              <Heart className="h-5 w-5" />
            </button>

            <button type="button">
              <Send className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800"
          >
            <span>Читать</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}