import type { ContentTag, FeedTag, IngestedPost, Locale } from "../../types/app";
import {
  getPrimaryDisplayTag,
  getSecondaryDisplayTags,
  normalizeTagValues,
} from "../../lib/tag-utils";
import { findTagByValue, getTagLabel as getSiteTagLabel } from "../../lib/tags";

function getAllTopicsLabel(locale: Locale) {
  if (locale === "ru" || locale === "ua" || locale === "kz" || locale === "uz") {
    return "✨ Все темы";
  }

  if (locale === "mx" || locale === "es" || locale === "ar" || locale === "co") {
    return "✨ Todos los temas";
  }

  if (locale === "br") return "✨ Todos os tópicos";
  if (locale === "tr") return "✨ Tüm konular";
  if (locale === "fr") return "✨ Tous les thèmes";
  if (locale === "it") return "✨ Tutti i temi";
  if (locale === "de") return "✨ Alle Themen";
  if (locale === "id") return "✨ Semua topik";

  return "✨ All topics";
}

function getOtherLabel(locale: Locale) {
  if (locale === "ru" || locale === "ua" || locale === "kz" || locale === "uz") {
    return "☝️ Другое";
  }

  if (locale === "mx" || locale === "es" || locale === "ar" || locale === "co") {
    return "☝️ Otro";
  }

  if (locale === "br") return "☝️ Outro";
  if (locale === "tr") return "☝️ Diğer";
  if (locale === "fr") return "☝️ Autre";
  if (locale === "it") return "☝️ Altro";
  if (locale === "de") return "☝️ Sonstiges";
  if (locale === "id") return "☝️ Lainnya";

  return "☝️ Other";
}

export function getResolvedTags(post: IngestedPost): ContentTag[] {
  const normalized = normalizeTagValues(
    Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags
      : post.tag
        ? [post.tag]
        : ["other"]
  );

  if (normalized.length > 0) {
    return normalized as ContentTag[];
  }

  return ["other"];
}

export function getResolvedTag(post: IngestedPost): ContentTag {
  return getResolvedTags(post)[0] || "other";
}

export function getDisplayTagMeta(post: IngestedPost, locale: Locale) {
  const tags = getResolvedTags(post);

  return {
    primary: getPrimaryDisplayTag(tags, locale) || getTagLabel("other", locale),
    secondary: getSecondaryDisplayTags(tags, locale),
  };
}

export function getTagLabel(tag: FeedTag, locale: Locale) {
  if (tag === "all") {
    return getAllTopicsLabel(locale);
  }

  const found = findTagByValue(tag);
  if (found) {
    return getSiteTagLabel(found, locale);
  }

  return getOtherLabel(locale);
}

export function getDisplayText(post: IngestedPost) {
  return post.text || "";
}

export function buildShareUrl(post: IngestedPost) {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.margelet.space";

  const postId = post.postUrl.split("/").filter(Boolean).pop() || String(post.id);
  const handle = post.source.handle || "telegram";

  return `${origin}/${handle}/${postId}`;
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

export function getVisualMedia(post: IngestedPost) {
  return normalizeMediaList(post).filter(
    (item) => item.kind === "image" || item.kind === "video"
  );
}

export function getAudioMedia(post: IngestedPost) {
  return normalizeMediaList(post).filter((item) => item.kind === "audio");
}

export function getFileMedia(post: IngestedPost) {
  return normalizeMediaList(post).filter((item) => item.kind === "file");
}

export function hasVisualMedia(post: IngestedPost) {
  return getVisualMedia(post).length > 0;
}

export function hasAudioLikeMedia(post: IngestedPost) {
  return getAudioMedia(post).length > 0 || getFileMedia(post).length > 0;
}