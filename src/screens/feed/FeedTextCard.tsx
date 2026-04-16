import { FileText, Music4, Play } from "lucide-react";
import type { Locale, IngestedPost } from "../../types/app";
import { getAudioMedia, getFileMedia } from "./feed.utils";

function getMediaBadge(post: IngestedPost, locale: Locale) {
  const audio = getAudioMedia(post);
  if (audio.length > 0) {
    return {
      icon: <Music4 className="h-3.5 w-3.5" />,
      label: locale === "ru" ? "Аудио" : "Audio",
    };
  }
  const files = getFileMedia(post);
  if (files.length > 0) {
    return {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: locale === "ru" ? "Файл" : "File",
    };
  }
  return null;
}

export function FeedTextCard({ locale, post, onOpen }: { locale: Locale; post: IngestedPost; onOpen: () => void }) {
  const copy = locale === "ru" ? "Читать" : "Read";
  const mediaBadge = getMediaBadge(post, locale);
  const text = (post.text || "").trim();

  return (
    <div className="px-4 pb-4 pt-3">
      {mediaBadge ? (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-secondary">
          {mediaBadge.icon}
          <span>{mediaBadge.label}</span>
        </div>
      ) : null}

      {text ? (
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <div className="line-clamp-4 text-[15px] leading-6 text-primary">{text}</div>
        </button>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        {post.tag ? (
          <div className="rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
            {post.tag}
          </div>
        ) : <div />}

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-primary transition hover:bg-white/15"
        >
          <Play className="h-4 w-4" />
          <span>{copy}</span>
        </button>
      </div>
    </div>
  );
}
