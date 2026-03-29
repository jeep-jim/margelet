import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { getResolvedTag, getTagLabel, normalizeMediaList } from "./feed.utils";

function isBlockedPreviewUrl(url?: string | null) {
  const value = String(url || "").toLowerCase();
  if (!value) return true;

  return (
    value.includes("userpic") ||
    value.includes("/avatar") ||
    value.includes("tgme_page_photo") ||
    value.includes("channel_photo") ||
    value.includes("profile_photo")
  );
}

function getFallbackLabel(mediaKind?: string | null) {
  switch (mediaKind) {
    case "video":
      return "Видео доступно в Telegram";
    case "gif":
      return "GIF доступен в Telegram";
    case "audio":
      return "Аудио доступно в Telegram";
    case "file":
      return "Файл доступен в Telegram";
    case "external_media":
      return "Медиа доступно в Telegram";
    case "image":
      return "Изображение доступно в Telegram";
    default:
      return "Контент доступен в Telegram";
  }
}

function getMediaItemUrl(item: unknown): string {
  if (!item || typeof item !== "object") return "";

  const record = item as Record<string, unknown>;

  const candidates = [
    record.src,
    record.url,
    record.image,
    record.poster,
    record.video,
    record.audio,
    record.file,
    record.preview,
    record.thumbnail,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return "";
}

export function FeedMediaCard({
  video,
  displayText,
  mediaIndex,
  onChangeMediaIndex,
  onOpen,
  isCardVisible,
}: FeedMediaCardProps & { isCardVisible: boolean }) {
  const rawMediaItems = normalizeMediaList(video);

  const mediaItems = rawMediaItems.filter((item) => {
    const src = getMediaItemUrl(item);
    if (!src) return false;
    if (isBlockedPreviewUrl(src)) return false;
    return true;
  });

  const hasMediaInOriginal = Boolean(video?.hasMediaInOriginal);
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
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-full bg-black/8 px-3 py-1 text-[11px] font-medium text-neutral-700">
              {getTagLabel(getResolvedTag(video))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-neutral-900">
              {getFallbackLabel(video?.mediaKind)}
            </div>

            {displayText || video?.channel ? (
              <div className="line-clamp-3 text-sm leading-5 text-neutral-600">
                {displayText || video.channel}
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

  const safeIndex = Math.min(Math.max(mediaIndex, 0), mediaItems.length - 1);
  const activeItem = mediaItems[safeIndex] as Record<string, unknown> | undefined;
  const activeType =
    typeof activeItem?.type === "string" ? activeItem.type : undefined;

  return (
    <button
      onClick={onOpen}
      className="relative mt-3 block w-full overflow-hidden bg-neutral-100 text-left"
      type="button"
    >
      <FeedCarousel
        items={mediaItems}
        displayText={displayText || video.channel}
        aspectClass="aspect-[9/10.2] sm:aspect-[9/9.8]"
        activeIndex={safeIndex}
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
          {safeIndex + 1}/{mediaItems.length}
        </div>
      ) : null}

      {activeType === "video" && video.duration ? (
        <div className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {video.duration}
        </div>
      ) : null}
    </button>
  );
}