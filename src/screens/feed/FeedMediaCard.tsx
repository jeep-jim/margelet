import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { getResolvedTag, getTagLabel, normalizeMediaList } from "./feed.utils";

export function FeedMediaCard({
  video,
  displayText,
  mediaIndex,
  onChangeMediaIndex,
  onOpen,
  isCardVisible,
}: FeedMediaCardProps & { isCardVisible: boolean }) {
  const mediaItems = normalizeMediaList(video);

  return (
    <button
      onClick={onOpen}
      className="relative mt-3 block w-full bg-neutral-100 text-left"
      type="button"
    >
      <FeedCarousel
        items={mediaItems}
        displayText={displayText || video.channel}
        aspectClass="aspect-[9/10.2] sm:aspect-[9/9.8]"
        activeIndex={Math.min(mediaIndex, mediaItems.length - 1)}
        onChange={onChangeMediaIndex}
        controlsTone="light"
        mediaActive={isCardVisible}
        muted
      />

      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
        {getTagLabel(getResolvedTag(video))}
      </div>

      {mediaItems.length > 1 ? (
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {Math.min(mediaIndex, mediaItems.length - 1) + 1}/{mediaItems.length}
        </div>
      ) : null}

      {mediaItems[mediaIndex]?.type === "video" && video.duration ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {video.duration}
        </div>
      ) : null}
    </button>
  );
}
