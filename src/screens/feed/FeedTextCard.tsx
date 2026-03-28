import { ExternalLink } from "lucide-react";
import type { Locale, Video } from "../../types/app";
import { getResolvedTag, getTagLabel } from "./feed.utils";

export function FeedTextCard({
  video,
  locale,
  onOpen,
}: {
  video: Video;
  locale: Locale;
  onOpen: () => void;
}) {
  const displayText = (video.caption?.[locale] || video.title?.[locale] || "").trim();

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
          {getTagLabel(getResolvedTag(video))}
        </div>
      </div>

      <div className="text-[15px] leading-7 text-neutral-900">
        <div className="line-clamp-5 whitespace-pre-wrap break-words">
          {displayText}
        </div>

        <div className="mt-3 flex justify-end">
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
