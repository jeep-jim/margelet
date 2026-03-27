import { savePost, getPostByUrl } from "./lib/kv.js";
import { buildSubmittedPost, parseTelegramPostUrl } from "../src/lib/telegram.js";
import type { PostMedia } from "../src/types/app";

function asCleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeMediaItem(raw: any, index: number): PostMedia | null {
  if (!raw || typeof raw !== "object") return null;

  const type = raw.type === "video" ? "video" : raw.type === "image" ? "image" : null;
  const url = asCleanString(raw.url);
  const poster = asCleanString(raw.poster);

  if (!type || !url) return null;

  return {
    id: asCleanString(raw.id) || `${type}-${index + 1}`,
    type,
    url,
    poster: poster || null,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const {
      url,
      title,
      caption,
      channel,
      avatar,
      tag,
      previewUrl,
      mediaType,
      videoUrl,
      channelVerified,
      addedByTelegramId,
      addedByUsername,
      media,
    } = body;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }

    const parsed = parseTelegramPostUrl(url);

    if (!parsed) {
      return res.status(400).json({ error: "Invalid Telegram post URL" });
    }

    const existing = await getPostByUrl(parsed.normalizedUrl);

    if (existing) {
      return res.status(200).json({ post: existing, duplicated: true });
    }

    const cleanTitle =
      asCleanString(title) ||
      asCleanString(channel) ||
      parsed.sourceHandle ||
      "Telegram";

    const cleanCaption = asCleanString(caption) || "";

    const cleanChannel = asCleanString(channel) || parsed.sourceHandle;

    const cleanAvatar = asCleanString(avatar);

    const cleanPreviewUrl = asCleanString(previewUrl);

    const cleanVideoUrl = asCleanString(videoUrl);

    const normalizedMedia = Array.isArray(media)
      ? media
          .map((item, index) => normalizeMediaItem(item, index))
          .filter((item): item is PostMedia => !!item)
      : [];

    const finalMedia =
      normalizedMedia.length > 0
        ? normalizedMedia
        : cleanVideoUrl
          ? [
              {
                id: "video-1",
                type: "video" as const,
                url: cleanVideoUrl,
                poster: cleanPreviewUrl || null,
              },
            ]
          : cleanPreviewUrl
            ? [
                {
                  id: "image-1",
                  type: "image" as const,
                  url: cleanPreviewUrl,
                  poster: null,
                },
              ]
            : [];

    const resolvedMediaType =
      finalMedia[0]?.type ||
      (mediaType === "video" || mediaType === "image" || mediaType === "text"
        ? mediaType
        : "text");

    const post = buildSubmittedPost(
      {
        url: parsed.normalizedUrl,
        title: cleanTitle,
        caption: cleanCaption,
        channel: cleanChannel,
        avatar: cleanAvatar,
        tag,
        media: finalMedia,
        previewUrl: cleanPreviewUrl,
        mediaType: resolvedMediaType,
        videoUrl: cleanVideoUrl,
        channelVerified: !!channelVerified,
      },
      {
        locale: "ru",
        messages: {
          newVideoFallback: cleanTitle,
          newVideoCaption: cleanCaption,
          newChannel: "telegram",
          newLang: "RU",
        },
        enMessages: {
          newVideoFallback: cleanTitle,
          newVideoCaption: cleanCaption,
          newChannel: "telegram",
          newLang: "EN",
        },
      }
    );

    if (cleanAvatar) {
      post.avatar = cleanAvatar;
    }

    post.media = finalMedia;
    post.previewUrl =
      finalMedia[0]?.type === "image"
        ? finalMedia[0].url
        : finalMedia[0]?.type === "video"
          ? finalMedia[0].poster || null
          : null;
    post.videoUrl =
      finalMedia[0]?.type === "video"
        ? finalMedia[0].url
        : null;
    post.mediaType = resolvedMediaType;

    post.title = {
      ru: cleanTitle,
      en: cleanTitle,
    };

    post.caption = {
      ru: cleanCaption,
      en: cleanCaption,
    };

    post.channel = cleanChannel;
    post.handle = `@${cleanChannel.replace(/^@/, "").trim().toLowerCase()}`;
    post.addedByTelegramId = asCleanString(addedByTelegramId);
    post.addedByUsername = asCleanString(addedByUsername);

    const saved = await savePost(post);

    return res.status(200).json({ post: saved });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}
