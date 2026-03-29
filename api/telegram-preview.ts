function normalizeUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://")) return `https://${raw.slice(7)}`;
  return raw;
}

function cleanText(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function stripTags(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isAvatarUrl(url?: string | null) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;

  return (
    v.includes("userpic") ||
    v.includes("tgme_page_photo") ||
    v.includes("channel_photo") ||
    v.includes("profile_photo") ||
    v.includes("avatar")
  );
}

function isVideo(url: string) {
  return url.includes(".mp4") || url.includes("video");
}

function isGif(url: string) {
  return url.includes(".gif") || url.includes("animation");
}

function isImage(url: string) {
  return (
    url.includes(".jpg") ||
    url.includes(".jpeg") ||
    url.includes(".png") ||
    url.includes(".webp")
  );
}

function isAudio(url: string) {
  return (
    url.includes(".mp3") ||
    url.includes(".ogg") ||
    url.includes(".m4a") ||
    url.includes("audio")
  );
}

function isFile(url: string) {
  return (
    url.includes(".pdf") ||
    url.includes(".zip") ||
    url.includes(".doc") ||
    url.includes(".xls") ||
    url.includes("document")
  );
}

function extractMessageBlock(html: string, id: string) {
  const marker = `data-post="${id}"`;
  const start = html.indexOf(marker);
  if (start === -1) return "";

  const widgetStart = html.lastIndexOf("tgme_widget_message", start);
  if (widgetStart === -1) return "";

  return html.slice(widgetStart, start + 5000);
}

function extractText(html: string) {
  const match = html.match(
    /tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i
  );
  if (!match?.[1]) return null;
  return cleanText(stripTags(match[1]));
}

function extractChannel(html: string) {
  const match = html.match(
    /tgme_widget_message_owner_name[^>]*>([\s\S]*?)<\/a>/i
  );
  if (!match?.[1]) return null;
  return cleanText(stripTags(match[1]));
}

function extractAvatar(html: string) {
  const match = html.match(/tgme_widget_message_user_photo[^>]*>/i);
  if (!match) return null;

  const style = match[0].match(/url\(([^)]+)\)/i);
  const url = normalizeUrl(style?.[1]?.replace(/['"]/g, ""));

  return isAvatarUrl(url) ? url : null;
}

function extractMedia(html: string) {
  const urls = [...html.matchAll(/https?:\/\/[^\s"']+/g)].map((m) =>
    normalizeUrl(m[0])
  );

  let image: string | null = null;
  let video: string | null = null;
  let audio: string | null = null;
  let file: string | null = null;
  let mediaKind: any = "none";

  for (const url of urls) {
    if (!url || isAvatarUrl(url)) continue;

    if (isGif(url)) {
      image = url;
      mediaKind = "gif";
      break;
    }

    if (isVideo(url)) {
      video = url;
      mediaKind = "video";
      break;
    }

    if (isAudio(url)) {
      audio = url;
      mediaKind = "audio";
      break;
    }

    if (isFile(url)) {
      file = url;
      mediaKind = "file";
      break;
    }

    if (isImage(url)) {
      image = url;
      mediaKind = "image";
    }
  }

  const hasMediaInOriginal =
    mediaKind !== "none" ||
    html.includes("tgme_widget_message_video") ||
    html.includes("tgme_widget_message_photo") ||
    html.includes("tgme_widget_message_audio") ||
    html.includes("tgme_widget_message_document");

  if (mediaKind === "none" && hasMediaInOriginal) {
    mediaKind = "external_media";
  }

  return {
    image,
    video,
    audio,
    file,
    mediaKind,
    hasMediaInOriginal,
  };
}

function isTelegramPostUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host !== "t.me" && host !== "telegram.me") return false;

    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts.length === 2;
  } catch {
    return false;
  }
}

function parseTelegramPostUrl(url: string) {
  const parsed = new URL(url);
  const parts = parsed.pathname.split("/").filter(Boolean);

  if (parts.length !== 2) return null;

  return {
    handle: parts[0],
    postId: parts[1],
  };
}

export default async function handler(req: any, res: any) {
  try {
    const rawUrl = req.query?.url;

    if (!rawUrl || !isTelegramPostUrl(rawUrl)) {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const parsed = parseTelegramPostUrl(rawUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Parse error" });
    }

    const webUrl = `https://t.me/s/${parsed.handle}/${parsed.postId}`;

    const response = await fetch(webUrl);
    const html = await response.text();

    const block = extractMessageBlock(
      html,
      `${parsed.handle}/${parsed.postId}`
    );

    const text = extractText(block);
    const channel = extractChannel(block) || parsed.handle;
    const avatar = extractAvatar(block);
    const media = extractMedia(block);

    return res.status(200).json({
      title: channel,
      caption: text,
      channel,
      avatar,
      image: media.image,
      video: media.video,
      audio: media.audio,
      file: media.file,
      mediaKind: media.mediaKind,
      hasMediaInOriginal: media.hasMediaInOriginal,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "fail" });
  }
}