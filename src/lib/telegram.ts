import type { IngestedPost } from "../types/app";

export type ParsedTelegramPostUrl = {
  originalUrl: string;
  normalizedUrl: string;
  host: string;
  sourceHandle: string;
  sourceUrl: string;
  postId: string;
};

const TELEGRAM_HOSTS = new Set([
  "t.me",
  "www.t.me",
  "telegram.me",
  "www.telegram.me",
]);

export function normalizeTelegramUrl(raw: string): string {
  const trimmed = raw.trim();

  if (!trimmed) return "";

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  const url = new URL(withProtocol);
  url.hash = "";

  return url.toString();
}

export function parseTelegramPostUrl(
  raw: string
): ParsedTelegramPostUrl | null {
  if (!raw.trim()) return null;

  try {
    const normalizedUrl = normalizeTelegramUrl(raw);
    const url = new URL(normalizedUrl);

    if (!TELEGRAM_HOSTS.has(url.hostname)) return null;

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 2) return null;

    const [sourceHandle, postId] = parts;

    if (!/^[A-Za-z0-9_]{4,}$/.test(sourceHandle)) return null;
    if (!/^\d+$/.test(postId)) return null;

    return {
      originalUrl: raw,
      normalizedUrl,
      host: url.hostname,
      sourceHandle,
      sourceUrl: `https://t.me/${sourceHandle}`,
      postId,
    };
  } catch {
    return null;
  }
}

export async function ingestTelegramPost(
  url: string
): Promise<{
  source: {
    handle: string;
    title: string;
    avatar: string | null;
    verified: boolean;
  };
  text: string;
  links: Array<{ label: string | null; url: string }>;
  contentType: IngestedPost["contentType"];
  media: IngestedPost["media"];
  hasMediaInOriginal: boolean;
  fallbackReason: IngestedPost["fallbackReason"];
} | null> {
  try {
    const parsed = parseTelegramPostUrl(url);
    if (!parsed) return null;

    const res = await fetch(
      `/api/telegram-preview?url=${encodeURIComponent(parsed.normalizedUrl)}`
    );

    if (!res.ok) return null;

    const data = await res.json();

    const text =
      typeof data?.caption === "string" ? data.caption.trim() : "";

    const image =
      typeof data?.image === "string" && data.image.trim()
        ? data.image.trim()
        : null;

    const video =
      typeof data?.video === "string" && data.video.trim()
        ? data.video.trim()
        : null;

    const poster =
      typeof data?.poster === "string" && data.poster.trim()
        ? data.poster.trim()
        : null;

    const avatar =
      typeof data?.avatar === "string" && data.avatar.trim()
        ? data.avatar.trim()
        : null;

    const title =
      typeof data?.title === "string" && data.title.trim()
        ? data.title.trim()
        : parsed.sourceHandle;

    let media: IngestedPost["media"] = [];
    let contentType: IngestedPost["contentType"] = "text";

    if (video) {
      media = [
        {
          id: "video-1",
          kind: "video",
          url: video,
          poster: poster || image || null,
        },
      ];
      contentType = "video";
    } else if (image) {
      media = [
        {
          id: "image-1",
          kind: "image",
          url: image,
        },
      ];
      contentType = "image";
    }

    return {
      source: {
        handle: parsed.sourceHandle,
        title,
        avatar,
        verified: !!data?.verified,
      },

      text,
      links: [],

      contentType,
      media,

      hasMediaInOriginal: !!(video || image),
      fallbackReason: null,
    };
  } catch {
    return null;
  }
}