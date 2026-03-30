import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { getResolvedTag, getTagLabel, normalizeMediaList } from "./feed.utils";

function getFallbackLabel() {
  return "Медиа доступно в Telegram";
}

export function FeedMediaCard({
  post,
  displayText,
  mediaIndex,
  onChangeMediaIndex,
  onOpen,
  isCardVisible,
}: FeedMediaCardProps & { isCardVisible: boolean }) {
  const mediaItems = normalizeMediaList(post);

  const hasMediaInOriginal = Boolean(post.hasMediaInOriginal);
  const hasValidMedia = mediaItems.length > 0;
  const shouldShowFallback = hasMediaInOriginal && !hasValidMedia;

  if (shouldShowFallback) {
    return (
      <button
        onClick={onOpen}
        className="relative mt-3 block w-full overflow-hidden bg-neutral-100 text-left"
        type="button"
      >
        <div className="flex aspect-[9/10.2] w-full flex-col justify-between p-4 sm:aspect-[9/9.8]">
          <div className="rounded-full bg-black/8 px-3 py-1 text-[11px] font-medium text-neutral-700">
            {getTagLabel(getResolvedTag(post))}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-900">
              {getFallbackLabel()}
            </div>

            {displayText ? (
              <div className="line-clamp-3 text-sm leading-5 text-neutral-600">
                {displayText}
              </div>
            ) : null}
          </div>
        </div>
      </button>
    );
  }

  if (!hasValidMedia) {
    return null;
  }

  const safeIndex = Math.min(
    Math.max(mediaIndex, 0),
    mediaItems.length - 1
  );

  return (
    <button
      onClick={onOpen}
      className="relative mt-3 block w-full overflow-hidden bg-neutral-100 text-left"
      type="button"
    >
      <FeedCarousel
        items={mediaItems}
        displayText={displayText || post.source.title}
        aspectClass="aspect-[9/10.2] sm:aspect-[9/9.8]"
        activeIndex={safeIndex}
        onChange={onChangeMediaIndex}
        controlsTone="light"
        mediaActive={isCardVisible}
        muted
      />

      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
        {getTagLabel(getResolvedTag(post))}
      </div>

      {mediaItems.length > 1 ? (
        <div className="pointer-events-none absolute left-3 top-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {safeIndex + 1}/{mediaItems.length}
        </div>
      ) : null}
    </button>
  );
}