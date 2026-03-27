import type { ContentTag, Locale, MediaType, PostMedia, Video } from "../types/app";

export type SubmitPayload = {
  url: string;
  title?: string;
  caption?: string;
  channel?: string;
  avatar?: string | null;
  tag?: ContentTag;
  mediaType?: MediaType;
  previewUrl?: string | null;
  videoUrl?: string | null;
  channelVerified?: boolean;
  media?: PostMedia[] | null;
};

export type ParsedTelegramPostUrl = {
  originalUrl: string;
  normalizedUrl: string;
  host: string;
  sourceHandle: string;
  sourceUrl: string;
  postId: string;
};

export type TelegramPreview = {
  canonical?: string | null;
  image: string | null;
  video: string | null;
  poster?: string | null;
  title: string | null;
  caption: string | null;
  avatar: string | null;
  verified?: boolean;
};

type BuildPostOptions = {
  locale: Locale;
  messages: {
    newVideoFallback: string;
    newVideoCaption: string;
    newChannel: string;
    newLang: string;
  };
  enMessages: {
    newVideoFallback: string;
    newVideoCaption: string;
    newChannel: string;
    newLang: string;
  };
};

const TELEGRAM_HOSTS = new Set([
  "t.me",
  "www.t.me",
  "telegram.me",
  "www.telegram.me",
]);

const FALLBACK_PREVIEW_GRADIENTS = [
  "from-fuchsia-500 via-purple-600 to-indigo-700",
  "from-amber-400 via-orange-500 to-rose-600",
  "from-sky-400 via-cyan-500 to-teal-600",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-rose-500 via-pink-500 to-orange-400",
];

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

export function parseTelegramPostUrl(raw: string): ParsedTelegramPostUrl | null {
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

export function buildAvatarLetters(source: string): string {
  return (source || "TG")
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0] ?? "")
    .join("")
    .toUpperCase();
}

export function buildHandle(source: string) {
  const clean = source.replace(/^@/, "").trim().toLowerCase();
  return `@${clean || "telegram"}`;
}

function chooseFallbackGradient(seed: string) {
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % FALLBACK_PREVIEW_GRADIENTS.length;
  return FALLBACK_PREVIEW_GRADIENTS[index];
}

function sanitizeText(value?: string | null) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function sanitizeUrl(value?: string | null) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed;
}

function getDefaultDuration(mediaType: MediaType) {
  return mediaType === "video" ? "0:24" : "";
}

function normalizePostMediaItem(
  item: PostMedia | null | undefined,
  index: number
): PostMedia | null {
  if (!item || typeof item !== "object") return null;

  const type = item.type === "video" ? "video" : item.type === "image" ? "image" : null;
  const url = sanitizeUrl(item.url);
  const poster = sanitizeUrl(item.poster);

  if (!type || !url) return null;

  return {
    id: sanitizeText(item.id) || `${type}-${index + 1}`,
    type,
    url,
    poster: poster || null,
  };
}

function buildMediaFromLegacyFields(payload: SubmitPayload): PostMedia[] {
  const videoUrl = sanitizeUrl(payload.videoUrl);
  const previewUrl = sanitizeUrl(payload.previewUrl);

  if (videoUrl) {
    return [
      {
        id: "video-1",
        type: "video",
        url: videoUrl,
        poster: previewUrl || null,
      },
    ];
  }

  if (previewUrl) {
    return [
      {
        id: "image-1",
        type: "image",
        url: previewUrl,
        poster: null,
      },
    ];
  }

  return [];
}

function normalizePostMedia(payload: SubmitPayload): PostMedia[] {
  const explicitMedia = Array.isArray(payload.media)
    ? payload.media
        .map((item, index) => normalizePostMediaItem(item, index))
        .filter((item): item is PostMedia => !!item)
    : [];

  if (explicitMedia.length > 0) {
    return explicitMedia;
  }

  return buildMediaFromLegacyFields(payload);
}

function getPrimaryMedia(media: PostMedia[]) {
  return media[0] || null;
}

function getMediaTypeFromMedia(media: PostMedia[]): MediaType {
  const primary = getPrimaryMedia(media);
  if (!primary) return "text";
  return primary.type;
}

export async function fetchTelegramPreview(
  url: string
): Promise<TelegramPreview | null> {
  try {
    const normalizedUrl = normalizeTelegramUrl(url);

    if (!normalizedUrl) return null;

    const res = await fetch(
      `/api/telegram-preview?url=${encodeURIComponent(normalizedUrl)}`
    );

    if (!res.ok) return null;

    const data = await res.json();

    const image =
      typeof data?.image === "string" && data.image.trim()
        ? data.image.trim()
        : typeof data?.poster === "string" && data.poster.trim()
          ? data.poster.trim()
          : null;

    const video =
      typeof data?.video === "string" && data.video.trim()
        ? data.video.trim()
        : null;

    const title =
      typeof data?.title === "string" && data.title.trim()
        ? data.title.trim()
        : null;

    const caption =
      typeof data?.caption === "string" && data.caption.trim()
        ? data.caption.trim()
        : null;

    const avatar =
      typeof data?.avatar === "string" && data.avatar.trim()
        ? data.avatar.trim()
        : null;

    const canonical =
      typeof data?.canonical === "string" && data.canonical.trim()
        ? data.canonical.trim()
        : normalizedUrl;

    const poster =
      typeof data?.poster === "string" && data.poster.trim()
        ? data.poster.trim()
        : null;

    return {
      canonical,
      image,
      video,
      poster,
      title,
      caption,
      avatar,
      verified: !!data?.verified,
    };
  } catch {
    return null;
  }
}

export function buildSubmittedPost(
  payload: SubmitPayload,
  options: BuildPostOptions
): Video {
  const parsed = parseTelegramPostUrl(payload.url);

  if (!parsed) {
    throw new Error("INVALID_TELEGRAM_POST_URL");
  }

  const sourceName = sanitizeText(payload.channel) || parsed.sourceHandle;
  const handle = buildHandle(parsed.sourceHandle);
  const cleanTitle = sanitizeText(payload.title) || sourceName;
  const cleanCaption = sanitizeText(payload.caption);
  const cleanAvatar = sanitizeUrl(payload.avatar);
  const media = normalizePostMedia(payload);
  const primaryMedia = getPrimaryMedia(media);

  const mediaType: MediaType =
    payload.mediaType || getMediaTypeFromMedia(media);

  const cleanPreviewUrl =
    primaryMedia?.type === "image"
      ? primaryMedia.url
      : primaryMedia?.type === "video"
        ? primaryMedia.poster || null
        : sanitizeUrl(payload.previewUrl);

  const cleanVideoUrl =
    primaryMedia?.type === "video"
      ? primaryMedia.url
      : sanitizeUrl(payload.videoUrl);

  const titleRu = cleanTitle || options.messages.newVideoFallback || sourceName;
  const titleEn = cleanTitle || options.enMessages.newVideoFallback || sourceName;

  const captionRu = cleanCaption || "";
  const captionEn = cleanCaption || "";

  const avatar =
    cleanAvatar || buildAvatarLetters(sourceName || parsed.sourceHandle);

  return {
    id: Date.now(),
    mediaType,
    media,
    title: {
      ru: titleRu,
      en: titleEn,
    },
    caption: {
      ru: captionRu,
      en: captionEn,
    },
    channel: sourceName || options.messages.newChannel,
    avatar,
    handle,
    channelVerified: !!payload.channelVerified,
    views: "0",
    likes: 0,
    comments: 0,
    duration: getDefaultDuration(mediaType),
    lang: options.messages.newLang || "RU",
    postUrl: parsed.normalizedUrl,
    bg: chooseFallbackGradient(parsed.sourceHandle),
    tag: payload.tag || "other",
    previewUrl: cleanPreviewUrl,
    videoUrl: cleanVideoUrl,
  };
}
