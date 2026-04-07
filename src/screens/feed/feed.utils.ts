import type { ContentTag, FeedTag, IngestedPost, Locale } from "../../types/app";
import { findTagByValue, getTagLabel as getSiteTagLabel } from "../../lib/tags";

export function getResolvedTag(post: IngestedPost): ContentTag {
  return post.tag || "other";
}

export function getTagLabel(tag: FeedTag, locale: Locale) {
  if (tag === "all") {
    const allLabels: Record<Locale, string> = {
      ru: "✨ Все темы",
      en: "✨ All topics",
      de: "✨ Alle Themen",
      es: "✨ Todos los temas",
      tr: "✨ Tüm konular",
      fr: "✨ Tous les thèmes",
      it: "✨ Tutti i temi",
      "pt-br": "✨ Todos os tópicos",
      id: "✨ Semua topik",
      pl: "✨ Wszystkie tematy",
    };

    return allLabels[locale] ?? allLabels.en;
  }

  const found = findTagByValue(tag);
  if (found) {
    return getSiteTagLabel(found, locale);
  }

  const fallback: Record<Locale, string> = {
    ru: "☝️ Другое",
    en: "☝️ Other",
    de: "☝️ Sonstiges",
    es: "☝️ Otro",
    tr: "☝️ Diğer",
    fr: "☝️ Autre",
    it: "☝️ Altro",
    "pt-br": "☝️ Outro",
    id: "☝️ Lainnya",
    pl: "☝️ Inne",
  };

  return fallback[locale] ?? fallback.en;
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