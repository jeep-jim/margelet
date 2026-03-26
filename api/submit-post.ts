import { savePost, getPostByUrl } from "./lib/kv";
import { buildSubmittedPost, parseTelegramPostUrl } from "../src/lib/telegram";

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
      channel,
      tag,
      previewUrl,
      mediaType,
      videoUrl,
      channelVerified,
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

    const post = buildSubmittedPost(
      {
        url: parsed.normalizedUrl,
        title: title || "",
        channel: channel || parsed.sourceHandle,
        tag,
        previewUrl: previewUrl || null,
        mediaType,
        videoUrl: videoUrl || null,
        channelVerified: !!channelVerified,
      },
      {
        locale: "ru",
        messages: {
          newVideoFallback: "Новое видео",
          newVideoCaption: "",
          newChannel: "telegram",
          newLang: "RU",
        },
        enMessages: {
          newVideoFallback: "New video",
          newVideoCaption: "",
          newChannel: "telegram",
          newLang: "EN",
        },
      }
    );

    // Убираем служебный мусорный caption — лучше пусто, чем дублирование
    post.caption = {
      ru: "",
      en: "",
    };

    const saved = await savePost(post);

    return res.status(200).json({ post: saved });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}