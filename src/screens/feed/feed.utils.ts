import type { ContentTag, FeedTag, Locale, PostMedia, Video } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";

export function getResolvedTag(video: Video): ContentTag {
  return video.tag || "other";
}

export function getTagLabel(tag: FeedTag) {
  return TAG_OPTIONS.find((item) => item.value === tag)?.label || "Все";
}

// 🔥 ФИКС: нормальная проверка аватарки
export function isAvatarUrl(value?: string | null) {
  const v = String(value || "").toLowerCase();
  if (!v) return false;

  return (
    v.includes("userpic") ||
    v.includes("tgme_page_photo") ||
    v.includes("channel_photo") ||
    v.includes("profile_photo") ||
    v.includes("avatar")
  );
}

export function getDisplayText(video: Video, locale: Locale) {
  const caption = video.caption?.[locale]?.trim();
  const title = video.title?.[locale]?.trim();
  return caption || title || "";
}

export function buildShareUrl(video: Video) {
  return video.postUrl || `${window.location.origin}/${String(video.handle || video.channel || "telegram").replace(/^@/, "").trim().toLowerCase()}/${video.id}`;
}

export function normalizeMediaList(video: Video): PostMedia[] {
  if (Array.isArray(video.media) && video.media.length > 0) {
    return video.media.filter(
      (item): item is PostMedia =>
        !!item &&
        (item.type === "image" || item.type === "video") &&
        typeof item.url === "string" &&
        !!item.url.trim() &&
        !isAvatarUrl(item.url) // 🔥 ВАЖНО
    );
  }

  if (video.videoUrl && !isAvatarUrl(video.videoUrl)) {
    return [
      {
        id: "video-1",
        type: "video",
        url: video.videoUrl,
        poster:
          video.previewUrl && !isAvatarUrl(video.previewUrl)
            ? video.previewUrl
            : null,
      },
    ];
  }

  if (video.previewUrl && !isAvatarUrl(video.previewUrl)) {
    return [
      {
        id: "image-1",
        type: "image",
        url: video.previewUrl,
        poster: null,
      },
    ];
  }

  return [];
}

export function parseDurationToSeconds(duration?: string) {
  if (!duration) return 0;

  const parts = duration.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part))) return 0;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return 0;
}