import type { ContentTag, Locale, MediaType, Video } from "../types/app";

export type SubmitPayload = {
  url: string;
  title?: string;
  channel?: string;
  tag?: ContentTag;
  mediaType?: MediaType;
  previewUrl?: string | null;
  videoUrl?: string | null;
  channelVerified?: boolean;
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
  image: string | null;
  video: string | null;
  title: string | null;
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

const TELEGRAM_HOSTS = new Set(["t.me", "www.t.me", "telegram.me", "www.telegram.me"]);

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

export function buildHandle(source: string): string {
  const clean = source.replace(/^@/, "").trim().toLowerCase();
  return `@${clean || "telegram"}`;
}

export async function fetchTelegramPreview(url: string): Promise<TelegramPreview | null> {
  try {
    const res = await fetch(`/api/telegram-preview?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return await res.json();
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

  const sourceName = payload.channel?.trim() || parsed.sourceHandle;
  const handle = buildHandle(parsed.sourceHandle);
  const mediaType: MediaType =
    payload.mediaType ||
    (payload.videoUrl ? "video" : "image");

  const palettes = [
    "from-fuchsia-500 via-purple-600 to-indigo-700",
    "from-amber-400 via-orange-500 to-rose-600",
    "from-sky-400 via-cyan-500 to-teal-600",
    "from-emerald-500 via-teal-500 to-cyan-600",
    "from-rose-500 via-pink-500 to-orange-400",
  ];

  const titleRu =
    payload.title?.trim() ||
    (mediaType === "image" ? `Пост из ${handle}` : `Видео из ${handle}`);

  const titleEn =
    payload.title?.trim() ||
    (mediaType === "image" ? `Post from ${handle}` : `Video from ${handle}`);

  const captionRu =
    mediaType === "image"
      ? `Telegram-пост ${parsed.postId} с изображением из ${handle} добавлен в общую ленту MargeleT.`
      : `Telegram-пост ${parsed.postId} с видео из ${handle} добавлен в общую ленту MargeleT.`;

  const captionEn =
    mediaType === "image"
      ? `Telegram image post ${parsed.postId} from ${handle} was added to the shared MargeleT feed.`
      : `Telegram video post ${parsed.postId} from ${handle} was added to the shared MargeleT feed.`;

  return {
    id: Date.now(),
    mediaType,
    title: {
      ru: titleRu,
      en: titleEn,
    },
    caption: {
      ru: captionRu,
      en: captionEn,
    },
    channel: sourceName || options.messages.newChannel,
    avatar: buildAvatarLetters(sourceName || parsed.sourceHandle),
    handle,
    channelVerified: !!payload.channelVerified,
    views: "0",
    likes: 0,
    comments: 0,
    duration: mediaType === "video" ? "0:24" : "",
    lang: options.messages.newLang || "RU",
    postUrl: parsed.normalizedUrl,
    bg: palettes[Math.floor(Math.random() * palettes.length)],
    tag: payload.tag || "other",
    previewUrl: payload.previewUrl || null,
    videoUrl: payload.videoUrl || null,
  };
}