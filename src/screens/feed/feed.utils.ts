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
  return Array.isArray(post.media) ? post.media : [];
}