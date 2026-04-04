import type { IngestedPost } from "../../types/app";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";

export function buildSearchText(post: IngestedPost) {
  return [
    post.source.title,
    post.source.handle,
    post.postUrl,
    post.addedBy.username || "",
    post.addedBy.telegramId || "",
    post.tag || "",
    post.text || "",
    post.billing.plan || "",
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

export function getPlanLabel(plan?: string) {
  switch (plan) {
    case "free":
      return "Бесплатно";
    case "pro_1m":
      return "PRO 1 мес";
    case "pro_3m":
      return "PRO 3 мес";
    case "pro_12m":
      return "PRO 12 мес";
    default:
      return plan || "—";
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
  return ADMIN_TAG_OPTIONS.find((item) => item.value === tag)?.label || tag || "—";
}