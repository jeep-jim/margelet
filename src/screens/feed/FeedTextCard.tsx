import type { FeedTextCardProps } from "./feed.types";
import { ExpandableTextPostText } from "./ExpandableText";
import { getResolvedTag, getTagLabel } from "./feed.utils";

export function FeedTextCard({
  video,
  locale,
  onOpen,
}: Pick<FeedTextCardProps, "video" | "locale" | "onOpen">) {
  const displayText = (video.caption?.[locale] || video.title?.[locale] || "").trim();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="block w-full px-4 pt-3 text-left"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
          {getTagLabel(getResolvedTag(video))}
        </div>
      </div>

      <ExpandableTextPostText text={displayText} />
    </button>
  );
}
