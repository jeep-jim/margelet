import { savePost, getPostByUrl } from "./lib/kv.js";
import { buildSubmittedPost, parseTelegramPostUrl } from "../src/lib/telegram.js";

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
      typeof title === "string" && title.trim()
        ? title.trim()
        : channel || parsed.sourceHandle || "Telegram";

    const cleanCaption =
      typeof caption === "string" && caption.trim()
        ? caption.trim()
        : "";

    const cleanChannel =
      typeof channel === "string" && channel.trim()
        ? channel.trim()
        : parsed.sourceHandle;

    const cleanAvatar =
      typeof avatar === "string" && avatar.trim()
        ? avatar.trim()
        : null;

    const cleanPreviewUrl =
      typeof previewUrl === "string" && previewUrl.trim()
        ? previewUrl.trim()
        : null;

    const cleanVideoUrl =
      typeof videoUrl === "string" && videoUrl.trim()
        ? videoUrl.trim()
        : null;

    const resolvedMediaType =
      cleanVideoUrl
        ? "video"
        : cleanPreviewUrl
          ? "image"
          : "text";

    const post = buildSubmittedPost(
      {
        url: parsed.normalizedUrl,
        title: cleanTitle,
        caption: cleanCaption,
        channel: cleanChannel,
        avatar: cleanAvatar,
        tag,
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

    post.previewUrl = cleanPreviewUrl;
    post.videoUrl = cleanVideoUrl;
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
    post.addedByTelegramId =
      typeof addedByTelegramId === "string" && addedByTelegramId.trim()
        ? addedByTelegramId.trim()
        : null;
    post.addedByUsername =
      typeof addedByUsername === "string" && addedByUsername.trim()
        ? addedByUsername.trim()
        : null;

    const saved = await savePost(post);

    return res.status(200).json({ post: saved });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}