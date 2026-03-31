import type { ContentTag, FeedTag, IngestedPost } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";

export function getResolvedTag(post: IngestedPost): ContentTag {
  return post.tag || "other";
}

export function getTagLabel(tag: FeedTag) {
  return TAG_OPTIONS.find((item) => item.value === tag)?.label || "Все";
}

export function getDisplayText(post: IngestedPost) {
  return post.text || "";
}

export function buildShareUrl(post: IngestedPost) {
  return post.postUrl;
}

export function normalizeMediaList(post: IngestedPost) {
  if (!Array.isArray(post.media)) {
    return [];
  }

  return post.media.map((item, index) => ({
    id: item.id || `${item.kind}-${index + 1}`,
    kind: item.kind,
    url: item.url,
    poster: item.poster ?? null,
    mimeType: item.mimeType ?? null,
    fileName: item.fileName ?? null,
    width: item.width,
    height: item.height,
    duration: item.duration,
  }));
}