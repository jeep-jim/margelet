import {
  Bookmark,
  ExternalLink,
  Heart,
  ImageIcon,
  Music4,
  FileText,
  Send,
} from "lucide-react";
import type { Locale, Video } from "../../types/app";
import { getResolvedTag, getTagLabel } from "./feed.utils";

function getMediaKind(video: Video) {
  return video.mediaKind || "none";
}

function getMediaBadge(video: Video) {
  const kind = getMediaKind(video);

  if (kind === "audio") {
    return {
      icon: <Music4 className="h-3.5 w-3.5" />,
      label: "Аудио",
    };
  }

  if (kind === "file") {
    return {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: "Файл",
    };
  }

  if (kind === "image") {
    return {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "Изображение",
    };
  }

  if (kind === "gif") {
    return {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "GIF",
    };
  }

  if (kind === "external_media") {
    return {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "Есть медиа",
    };
  }

  if (video.hasMediaInOriginal) {
    return {
      icon: <ImageIcon className="h-3.5 w-3.5" />,
      label: "Есть медиа",
    };
  }

  return null;
}

export function FeedTextCard({
  video,
  locale,
  onOpen,
}: {
  video: Video;
  locale: Locale;
  onOpen: () => void;
}) {
  const displayText =
    (video.caption?.[locale] || video.title?.[locale] || "").trim();

  const mediaBadge = getMediaBadge(video);
  const mediaKind = getMediaKind(video);

  const isPureText = mediaKind === "none";

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
            {getTagLabel(getResolvedTag(video))}
          </div>

          {mediaBadge ? (
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
              {mediaBadge.icon}
              <span className="truncate">{mediaBadge.label}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="text-[15px] leading-5 text-neutral-900">
        <div className="line-clamp-5 whitespace-pre-wrap break-words">
          {displayText}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-8 text-neutral-700">
            <button type="button">
              <Heart className="h-5 w-5" />
            </button>

            <button type="button">
              <Bookmark className="h-5 w-5" />
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
            <span>{isPureText ? "Читать" : "Открыть"}</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}