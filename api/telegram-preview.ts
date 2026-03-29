function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value: string) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

function cleanText(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeUrl(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (raw.startsWith("//")) return `https:${raw}`;
  if (raw.startsWith("http://")) return `https://${raw.slice("http://".length)}`;
  return raw;
}

function readMetaProperty(html: string, key: string) {
  const escaped = escapeRegExp(key);
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return cleanText(decodeHtml(match[1]));
    }
  }

  return null;
}

function extractCanonicalLink(html: string) {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i
  );
  return cleanText(match?.[1] || null);
}

function extractMessageBlockByDataPost(html: string, dataPost: string) {
  const marker = `data-post="${dataPost}"`;
  const start = html.indexOf(marker);

  if (start === -1) return "";

  const widgetStart = html.lastIndexOf('<div class="tgme_widget_message', start);
  if (widgetStart === -1) return "";

  let depth = 0;
  let i = widgetStart;

  while (i < html.length) {
    const nextOpen = html.indexOf("<div", i);
    const nextClose = html.indexOf("</div>", i);

    if (nextClose === -1) break;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth += 1;
      i = nextOpen + 4;
      continue;
    }

    depth -= 1;
    i = nextClose + 6;

    if (depth <= 0) {
      return html.slice(widgetStart, i);
    }
  }

  return html.slice(widgetStart);
}

function extractMessageTextFromMessageBlock(html: string) {
  if (!html) return null;

  const patterns = [
    /<div[^>]+class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class='[^']*tgme_widget_message_text[^']*'[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const text = cleanText(stripTags(match[1]));
      if (text) return text;
    }
  }

  return null;
}

function extractAuthorNameFromMessageBlock(msgHtml: string, pageHtml: string) {
  const patterns = [
    /<a[^>]+class="[^"]*tgme_widget_message_owner_name[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
    /<div[^>]+class="[^"]*tgme_widget_message_author[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]+class="[^"]*tgme_widget_message_from_author[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = msgHtml.match(pattern);
    if (match?.[1]) {
      const text = cleanText(stripTags(match[1]));
      if (text) return text;
    }
  }

  return (
    readMetaProperty(pageHtml, "og:title") ||
    readMetaProperty(pageHtml, "twitter:title") ||
    null
  );
}

function extractVerifiedFromMessageBlock(msgHtml: string, pageHtml: string) {
  const hay = `${msgHtml}\n${pageHtml}`.toLowerCase();

  return (
    hay.includes("tgme_widget_message_owner_verified") ||
    hay.includes("tgme_widget_message_owner_badge") ||
    hay.includes("tgme_widget_message_owner_verified_icon") ||
    hay.includes("verified-icon") ||
    hay.includes("icon-verified")
  );
}

function pickAttr(tagHtml: string, names: string[]) {
  for (const name of names) {
    const pattern = new RegExp(
      `\\b${escapeRegExp(name)}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`,
      "i"
    );

    const match = tagHtml.match(pattern);
    if (!match) continue;

    const value = match[2] || match[3] || match[4] || "";
    const normalized = normalizeUrl(decodeHtml(value));

    if (normalized) return normalized;
  }

  return null;
}

function pickBgUrlFromStyle(tagHtml: string) {
  const match = tagHtml.match(/background-image\s*:\s*url\(([^)]+)\)/i);
  if (!match) return null;

  const value = String(match[1] || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  return normalizeUrl(value);
}

function isUserpicUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;

  return (
    v.includes("t.me/i/userpic/") ||
    v.includes("/userpic/") ||
    (v.includes("userpic") && v.includes("t.me"))
  );
}

function isLikelyAvatarUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;

  return (
    isUserpicUrl(v) ||
    v.includes("tgme_page_photo") ||
    v.includes("channel_photo") ||
    v.includes("profile_photo") ||
    v.includes("avatar")
  );
}

function isLikelyTelegramImageUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;
  if (isLikelyAvatarUrl(v)) return false;

  return (
    v.includes(".jpg") ||
    v.includes(".jpeg") ||
    v.includes(".png") ||
    v.includes(".webp") ||
    v.includes("/file/")
  );
}

function isLikelyTelegramVideoUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;
  if (isLikelyAvatarUrl(v)) return false;

  return v.includes(".mp4") || v.includes(".webm") || v.includes("video");
}

function isLikelyTelegramAudioUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;
  if (isLikelyAvatarUrl(v)) return false;

  return (
    v.includes(".mp3") ||
    v.includes(".m4a") ||
    v.includes(".ogg") ||
    v.includes(".opus") ||
    v.includes("audio")
  );
}

function isLikelyTelegramFileUrl(url: string) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;
  if (isLikelyAvatarUrl(v)) return false;

  return (
    v.includes(".pdf") ||
    v.includes(".zip") ||
    v.includes(".rar") ||
    v.includes(".7z") ||
    v.includes(".doc") ||
    v.includes(".docx") ||
    v.includes(".xls") ||
    v.includes(".xlsx") ||
    v.includes(".ppt") ||
    v.includes(".pptx") ||
    v.includes(".txt") ||
    v.includes(".csv") ||
    v.includes(".apk") ||
    v.includes("document")
  );
}

function looksLikeGifUrl(url: string) {
  const v = String(url || "").toLowerCase();
  return v.includes(".gif") || v.includes("gif") || v.includes("animation");
}

function hasTooLargeMediaGate(msgHtml: string) {
  const text = stripTags(msgHtml || "").toLowerCase();
  const hay = String(msgHtml || "").toLowerCase();

  return (
    text.includes("media is too big") ||
    hay.includes("tgme_widget_message_error") ||
    hay.includes("tgme_widget_message_default_error")
  );
}

function extractAuthorAvatarFromMessageBlock(msgHtml: string, pageHtml: string) {
  const userPhotoTag =
    msgHtml.match(/<a[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*>/i)?.[0] ||
    msgHtml.match(/<i[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*>/i)?.[0] ||
    msgHtml.match(/<div[^>]*class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]*>/i)?.[0] ||
    "";

  if (userPhotoTag) {
    const bg = pickBgUrlFromStyle(userPhotoTag);
    if (bg && isLikelyAvatarUrl(bg)) return bg;

    const src = pickAttr(userPhotoTag, ["src", "data-src"]);
    if (src && isLikelyAvatarUrl(src)) return src;
  }

  const pagePatterns = [
    /<img[^>]+class="[^"]*tgme_page_photo_image[^"]*"[^>]+src="([^"]+)"/i,
    /<img[^>]+src="([^"]+)"[^>]+class="[^"]*tgme_page_photo_image[^"]*"/i,
    /<a[^>]+class="[^"]*tgme_channel_info_header_link[^"]*"[^>]*>\s*<i[^>]+style="[^"]*background-image:url\(([^)]+)\)/i,
  ];

  for (const pattern of pagePatterns) {
    const match = pageHtml.match(pattern);
    if (match?.[1]) {
      const avatar = normalizeUrl(match[1].replace(/^['"]|['"]$/g, ""));
      if (avatar && isLikelyAvatarUrl(avatar)) return avatar;
    }
  }

  return null;
}

function extractMessageMediaFromMessageBlock(msgHtml: string) {
  const result: {
    image: string | null;
    video: string | null;
    poster: string | null;
    audio: string | null;
    file: string | null;
    hasMediaInOriginal: boolean;
    mediaKind:
      | "none"
      | "image"
      | "video"
      | "gif"
      | "audio"
      | "file"
      | "external_media";
  } = {
    image: null,
    video: null,
    poster: null,
    audio: null,
    file: null,
    hasMediaInOriginal: false,
    mediaKind: "none",
  };

  if (!msgHtml) {
    return result;
  }

  const tooLarge = hasTooLargeMediaGate(msgHtml);

  const hasPhotoWrap = /tgme_widget_message_photo_wrap/i.test(msgHtml);
  const hasVideoWrap =
    /tgme_widget_message_video_player/i.test(msgHtml) ||
    /tgme_widget_message_video_wrap/i.test(msgHtml) ||
    /tgme_widget_message_roundvideo/i.test(msgHtml);
  const hasAnimationWrap = /tgme_widget_message_animation/i.test(msgHtml);
  const hasAudioWrap =
    /tgme_widget_message_voice_player/i.test(msgHtml) ||
    /tgme_widget_message_audio/i.test(msgHtml);
  const hasFileWrap =
    /tgme_widget_message_document_wrap/i.test(msgHtml) ||
    /tgme_widget_message_document/i.test(msgHtml);

  if (hasPhotoWrap || hasVideoWrap || hasAnimationWrap || hasAudioWrap || hasFileWrap || tooLarge) {
    result.hasMediaInOriginal = true;
  }

  if (tooLarge) {
    result.mediaKind = "external_media";
    return result;
  }

  const animationBlocks =
    msgHtml.match(
      /<(a|div)\b[^>]*class="[^"]*tgme_widget_message_animation[^"]*"[^>]*>/gi
    ) ?? [];

  for (const tag of animationBlocks) {
    const bg = pickBgUrlFromStyle(tag);
    const poster = normalizeUrl(bg || pickAttr(tag, ["data-poster", "poster"]));
    const href = pickAttr(tag, ["href", "data-src", "src"]);

    if (poster && !isLikelyAvatarUrl(poster)) {
      result.image = poster;
      result.poster = poster;
      result.hasMediaInOriginal = true;
      result.mediaKind = "gif";
      break;
    }

    if (href && isLikelyTelegramImageUrl(href) && !isLikelyAvatarUrl(href)) {
      result.image = href;
      result.hasMediaInOriginal = true;
      result.mediaKind = "gif";
      break;
    }
  }

  if (result.mediaKind === "none") {
    const videoPlayers =
      msgHtml.match(
        /<(a|div)\b[^>]*class="[^"]*(tgme_widget_message_video_player|tgme_widget_message_video_wrap|tgme_widget_message_roundvideo)[^"]*"[^>]*>/gi
      ) ?? [];

    for (const tag of videoPlayers) {
      const href = pickAttr(tag, ["data-video", "href", "data-src", "src"]);
      const posterFromStyle = pickBgUrlFromStyle(tag);
      const poster = normalizeUrl(
        posterFromStyle || pickAttr(tag, ["data-poster", "poster"])
      );
      const video = normalizeUrl(href);

      if (video && isLikelyTelegramVideoUrl(video)) {
        result.video = video;

        if (poster && !isLikelyAvatarUrl(poster)) {
          result.poster = poster;
        }

        result.hasMediaInOriginal = true;
        result.mediaKind = "video";
        break;
      }
    }
  }

  if (result.mediaKind === "none") {
    const videoTagRe = /<video\b[^>]*>/gi;
    const videoTags = msgHtml.match(videoTagRe) ?? [];

    for (const tag of videoTags) {
      const src = pickAttr(tag, ["src", "data-src"]);
      const poster = pickAttr(tag, ["poster", "data-poster"]);
      const url = normalizeUrl(src);
      const p = normalizeUrl(poster);

      if (url && isLikelyTelegramVideoUrl(url) && !looksLikeGifUrl(url)) {
        result.video = url;

        if (p && !isLikelyAvatarUrl(p)) {
          result.poster = p;
        }

        result.hasMediaInOriginal = true;
        result.mediaKind = "video";
        break;
      }
    }
  }

  const audioTags = msgHtml.match(/<audio\b[^>]*>/gi) ?? [];
  for (const tag of audioTags) {
    const src = pickAttr(tag, ["src", "data-src"]);
    if (src && isLikelyTelegramAudioUrl(src)) {
      result.audio = src;
      result.hasMediaInOriginal = true;
      if (result.mediaKind === "none") {
        result.mediaKind = "audio";
      }
      break;
    }
  }

  if (!result.audio) {
    const audioWraps =
      msgHtml.match(
        /<(a|div)\b[^>]*class="[^"]*(tgme_widget_message_voice_player|tgme_widget_message_audio)[^"]*"[^>]*>/gi
      ) ?? [];

    for (const tag of audioWraps) {
      const src = pickAttr(tag, ["href", "data-audio", "data-src", "src"]);
      if (src && isLikelyTelegramAudioUrl(src)) {
        result.audio = src;
        result.hasMediaInOriginal = true;
        if (result.mediaKind === "none") {
          result.mediaKind = "audio";
        }
        break;
      }
    }
  }

  if (result.mediaKind === "none") {
    const photoWrapRe =
      /<a\b[^>]*class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]*>/gi;
    const photoWraps = msgHtml.match(photoWrapRe) ?? [];

    for (const tag of photoWraps) {
      const bg = pickBgUrlFromStyle(tag);
      const href = pickAttr(tag, ["href", "data-href", "data-src", "src"]);
      const url = normalizeUrl(bg || href);

      if (!url) continue;
      if (isLikelyAvatarUrl(url)) continue;
      if (!isLikelyTelegramImageUrl(url)) continue;

      result.image = url;
      result.hasMediaInOriginal = true;
      result.mediaKind = looksLikeGifUrl(url) ? "gif" : "image";
      break;
    }
  }

  if (result.mediaKind === "none" && !result.image) {
    const imgTagRe = /<img\b[^>]*>/gi;
    const imgTags = msgHtml.match(imgTagRe) ?? [];

    for (const tag of imgTags) {
      const src = pickAttr(tag, ["src", "data-src"]);
      if (!src) continue;
      if (isLikelyAvatarUrl(src)) continue;
      if (!isLikelyTelegramImageUrl(src)) continue;

      result.image = src;
      result.hasMediaInOriginal = true;
      result.mediaKind = looksLikeGifUrl(src) ? "gif" : "image";
      break;
    }
  }

  const documentLinks =
    msgHtml.match(/<a\b[^>]*href="[^"]+"[^>]*>/gi) ?? [];

  for (const tag of documentLinks) {
    const href = pickAttr(tag, ["href", "data-src", "src"]);
    if (!href) continue;

    if (isLikelyTelegramFileUrl(href)) {
      result.file = href;
      result.hasMediaInOriginal = true;
      if (result.mediaKind === "none") {
        result.mediaKind = "file";
      }
      break;
    }
  }

  if (result.mediaKind === "none" && result.hasMediaInOriginal) {
    result.mediaKind = "external_media";
  }

  return result;
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

  const [sourceHandle, postId] = parts;

  if (!/^[A-Za-z0-9_]{4,}$/.test(sourceHandle)) return null;
  if (!/^\d+$/.test(postId)) return null;

  return { sourceHandle, postId };
}

function toSafeProxyUrl(url?: string | null) {
  const normalized = normalizeUrl(url);
  if (!normalized) return null;
  if (isLikelyAvatarUrl(normalized)) return null;
  return `/api/media-proxy?url=${encodeURIComponent(normalized)}`;
}

export default async function handler(req: any, res: any) {
  try {
    const rawUrl = req.query?.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }

    if (!isTelegramPostUrl(rawUrl)) {
      return res.status(400).json({ error: "Invalid Telegram post url" });
    }

    const parsed = parseTelegramPostUrl(rawUrl);

    if (!parsed) {
      return res.status(400).json({ error: "Failed to parse Telegram post url" });
    }

    const webUrl = `https://t.me/s/${encodeURIComponent(parsed.sourceHandle)}/${encodeURIComponent(parsed.postId)}`;

    const response = await fetch(webUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Telegram web page" });
    }

    const html = await response.text();

    if (!html) {
      return res.status(502).json({ error: "Empty Telegram page" });
    }

    const canonical =
      extractCanonicalLink(html) ||
      `https://t.me/${parsed.sourceHandle}/${parsed.postId}`;

    const msgHtml =
      extractMessageBlockByDataPost(html, `${parsed.sourceHandle}/${parsed.postId}`) || "";

    const media = extractMessageMediaFromMessageBlock(msgHtml);

    const title =
      extractAuthorNameFromMessageBlock(msgHtml, html) ||
      parsed.sourceHandle;

    const caption =
      extractMessageTextFromMessageBlock(msgHtml) ||
      null;

    const avatar =
      extractAuthorAvatarFromMessageBlock(msgHtml, html) ||
      null;

    const verified = extractVerifiedFromMessageBlock(msgHtml, html);
    const mediaTooLarge = hasTooLargeMediaGate(msgHtml);

    return res.status(200).json({
      canonical,
      image: toSafeProxyUrl(media.image),
      video: toSafeProxyUrl(media.video),
      poster: toSafeProxyUrl(media.poster),
      audio: toSafeProxyUrl(media.audio),
      file: toSafeProxyUrl(media.file),
      title: cleanText(title),
      caption: cleanText(caption),
      avatar: normalizeUrl(avatar) || null,
      verified,
      mediaTooLarge,
      hasMediaInOriginal: media.hasMediaInOriginal,
      mediaKind: media.mediaKind,
    });
  } catch (error) {
    console.error("telegram-preview api error", error);
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}