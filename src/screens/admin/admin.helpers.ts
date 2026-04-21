import type { IngestedPost } from "../../types/app";
import {
  getPrimaryDisplayTag,
  getSecondaryDisplayTags,
  normalizeTagValues,
  resolveTagLabel,
} from "../../lib/tag-utils";

export function buildSearchText(post: IngestedPost) {
  const normalizedTags = normalizeTagValues(
    Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags
      : post.tag
        ? [post.tag]
        : []
  );

  return [
    post.source.title,
    post.source.handle,
    post.postUrl,
    post.addedBy.username || "",
    post.addedBy.telegramId || "",
    post.tag || "",
    ...normalizedTags,
    post.text || "",
    post.status || "",
  ]
    .join(" ")
    .toLowerCase();
}

export function formatDate(value?: string | null) {
  if (!value) return "—";

  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return "—";

  return new Date(ms).toLocaleString();
}

export function formatRemaining(value?: string | null) {
  if (!value) return "—";

  const diff = Date.parse(value) - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return "00:00:00";

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

export function getStatusLabel(status?: string) {
  switch (status) {
    case "published":
      return "Опубликован";
    case "pending":
      return "На проверке";
    case "blocked":
      return "Заблокирован";
    default:
      return "Опубликован";
  }
}

export function getRoleLabel(role?: string) {
  switch (role) {
    case "user":
      return "Пользователь";
    case "channel_owner":
      return "Владелец канала";
    case "admin":
      return "Админ";
    default:
      return role || "—";
  }
}

export function getPreviewUrl(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    post.source.avatar ||
    null
  );
}

export function getContentTypeLabel(type?: string) {
  switch (type) {
    case "text":
      return "Текст";
    case "image":
      return "Изображение";
    case "gallery":
      return "Галерея";
    case "gif":
      return "GIF";
    case "video":
      return "Видео";
    case "audio":
      return "Аудио";
    case "file":
      return "Файл";
    case "mixed":
      return "Смешанный";
    case "external_media":
      return "Внешнее медиа";
    default:
      return type || "—";
  }
}

export function getTagLabel(tag?: string) {
  if (!tag) return "—";
  return resolveTagLabel(tag, "ru") || tag || "—";
}

export function getPrimaryTagLabel(tags?: string[]) {
  return getPrimaryDisplayTag(tags, "ru") || "—";
}

export function getSecondaryTagLabels(tags?: string[]) {
  return getSecondaryDisplayTags(tags, "ru");
}