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

type OrderedMediaItem = {
  index: number;
  item: IngestedPost["media"][number];
};

function normalizeAssetUrl(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;

  if (v.startsWith("//")) return `https:${v}`;
  if (v.startsWith("http://")) return `https://${v.slice(7)}`;
  return v;
}

function toProxy(url?: string | null) {
  const normalized = normalizeAssetUrl(url);
  if (!normalized) return null;
  return `/api/media-proxy?url=${encodeURIComponent(normalized)}`;
}

function pickPrimaryUrl(url?: string | null) {
  return normalizeAssetUrl(url);
}

function buildHybridMediaUrl(url?: string | null) {
  const directUrl = pickPrimaryUrl(url);
  if (!directUrl) {
    return {
      directUrl: null,
      proxyUrl: null,
      preferredUrl: null,
    };
  }

  return {
    directUrl,
    proxyUrl: toProxy(directUrl),
    preferredUrl: directUrl,
  };
}

function decodeHtml(input: string) {
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#33;/g, "!")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/&#44;/g, ",")
    .replace(/&#58;/g, ":")
    .replace(/&#59;/g, ";")
    .replace(/&#63;/g, "?")
    .replace(/&#64;/g, "@")
    .replace(/&#91;/g, "[")
    .replace(/&#93;/g, "]")
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&#8209;/g, "-")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&#(\d+);/g, (_, code) => {
      const num = Number(code);
      return Number.isFinite(num) ? String.fromCharCode(num) : _;
    })
    .trim();
}

function extract(html: string, re: RegExp) {
  const match = html.match(re);
  return match?.[1] || null;
}

function extractAll(html: string, re: RegExp) {
  const out: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    out.push(match);
  }

  return out;
}

function parseDurationText(value?: string | null) {
  if (!value) return undefined;

  const raw = value.trim();
  if (!raw) return undefined;

  const parts = raw.split(":").map((item) => Number(item.trim()));
  if (parts.some((item) => !Number.isFinite(item))) return undefined;

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  return undefined;
}

function looksLikeAudioUrl(url?: string | null) {
  const v = String(url || "").toLowerCase();
  if (!v) return false;

  return (
    v.includes(".mp3") ||
    v.includes(".m4a") ||
    v.includes(".ogg") ||
    v.includes(".opus") ||
    v.includes(".wav") ||
    v.includes("audio") ||
    v.includes("voice")
  );
}

function detectGifFromChunk(chunk: string, videoUrl: string | null) {
  if (!videoUrl) return false;

  return (
    /tgme_widget_message_animation/i.test(chunk) ||
    /tgme_widget_message_gif/i.test(chunk) ||
    (/autoplay/i.test(chunk) && /loop/i.test(chunk) && /muted/i.test(chunk))
  );
}

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

async function fetchTelegramEmbedHtml(parsed: ParsedTelegramPostUrl) {
  const embedCandidates = [
    `https://t.me/${parsed.sourceHandle}/${parsed.postId}?embed=1&mode=tme`,
    `https://t.me/${parsed.sourceHandle}/${parsed.postId}?embed=1`,
  ];

  let lastError: unknown = null;

  for (const url of embedCandidates) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
          Referer: "https://t.me/",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        lastError = new Error(
          `Telegram embed fetch failed: ${response.status} ${text.slice(0, 180)}`
        );
        continue;
      }

      const html = await response.text();
      if (html && html.includes("tgme_widget_message")) {
        return html;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Failed to fetch Telegram embed");
}

function extractSourceTitle(html: string, fallbackHandle: string) {
  const raw =
    extract(
      html,
      /<div class="tgme_widget_message_author[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>/i
    ) ||
    extract(
      html,
      /<a[^>]+class="tgme_widget_message_author_name"[^>]*>([\s\S]*?)<\/a>/i
    ) ||
    extract(html, /<meta property="og:title" content="([^"]+)"/i);

  return decodeHtml(raw || fallbackHandle) || fallbackHandle;
}

function extractSourceAvatar(html: string) {
  const styleAvatar =
    extract(
      html,
      /class="tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/i
    ) ||
    extract(
      html,
      /class="tgme_widget_message_user_photo[^"]*"[^>]*style="[^"]*background-image:url\((&quot;|")?([^'")]+)(&quot;|")?\)/i
    );

  if (styleAvatar) {
    return normalizeAssetUrl(styleAvatar);
  }

  const imgAvatar = extract(
    html,
    /class="tgme_widget_message_user_photo[^"]*"[\s\S]*?<img[^>]+src="([^"]+)"/i
  );

  return normalizeAssetUrl(imgAvatar);
}

function extractTextHtml(html: string) {
  return (
    extract(
      html,
      /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ) || ""
  );
}

function extractLinks(rawTextHtml: string) {
  const links: Array<{ label: string | null; url: string }> = [];
  const linkRegex = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(rawTextHtml))) {
    const href = normalizeAssetUrl(match[1]);
    const label = decodeHtml(match[2] || "");
    if (!href) continue;

    links.push({
      label: label || null,
      url: href,
    });
  }

  return links;
}

function buildOrderedMedia(html: string) {
  const ordered: OrderedMediaItem[] = [];
  const seen = new Set<string>();

  const photoMatches = extractAll(
    html,
    /class="tgme_widget_message_(?:photo_wrap|grouped_wrap)[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)[^"]*"/gi
  );

  photoMatches.forEach((match) => {
    const hybrid = buildHybridMediaUrl(match[1]);
    if (!hybrid.preferredUrl) return;

    const key = `image:${hybrid.preferredUrl}`;
    if (seen.has(key)) return;
    seen.add(key);

    ordered.push({
      index: match.index || 0,
      item: {
        id: `image-${ordered.length + 1}`,
        kind: "image",
        url: hybrid.preferredUrl,
      },
    });
  });

  const videoMatches = extractAll(
    html,
    /<(?:video|source)[^>]+src="([^"]+)"[^>]*>/gi
  );

  videoMatches.forEach((match) => {
    const videoHybrid = buildHybridMediaUrl(match[1]);
    if (!videoHybrid.preferredUrl) return;

    const chunk = html.slice(
      Math.max(0, (match.index || 0) - 300),
      (match.index || 0) + 900
    );

    const posterHybrid = buildHybridMediaUrl(
      extract(chunk, /background-image:url\('([^']+)'\)/i) || null
    );

    const duration = parseDurationText(
      decodeHtml(
        extract(
          chunk,
          /class="tgme_widget_message_video_duration"[^>]*>([\s\S]*?)<\/(?:time|div)>/i
        ) || ""
      )
    );

    const isGif = detectGifFromChunk(chunk, videoHybrid.preferredUrl);
    const key = `${isGif ? "gif" : "video"}:${videoHybrid.preferredUrl}`;
    if (seen.has(key)) return;
    seen.add(key);

    ordered.push({
      index: match.index || 0,
      item: {
        id: `${isGif ? "gif" : "video"}-${ordered.length + 1}`,
        kind: "video",
        url: videoHybrid.preferredUrl,
        poster: posterHybrid.preferredUrl,
        duration,
        mimeType: isGif ? "image/gif" : "video/mp4",
      },
    });
  });

  const audioMatches = extractAll(
    html,
    /(?:<audio[^>]+src="([^"]+)"[^>]*>|<source[^>]+type="audio\/[^"]*"[^>]+src="([^"]+)"[^>]*>|data-audio="([^"]+)"|data-ogg="([^"]+)")/gi
  );

  audioMatches.forEach((match) => {
    const hybrid = buildHybridMediaUrl(
      match[1] || match[2] || match[3] || match[4] || ""
    );
    if (!hybrid.preferredUrl || !looksLikeAudioUrl(hybrid.preferredUrl)) return;

    const key = `audio:${hybrid.preferredUrl}`;
    if (seen.has(key)) return;
    seen.add(key);

    ordered.push({
      index: match.index || 0,
      item: {
        id: `audio-${ordered.length + 1}`,
        kind: "audio",
        url: hybrid.preferredUrl,
        mimeType: "audio/mpeg",
      },
    });
  });

  const docMatches = extractAll(
    html,
    /class="tgme_widget_message_document(?:_wrap)?[^"]*"[\s\S]{0,400}?href="([^"]+)"/gi
  );

  docMatches.forEach((match) => {
    const hybrid = buildHybridMediaUrl(match[1]);
    if (!hybrid.preferredUrl) return;

    const chunk = html.slice(
      Math.max(0, (match.index || 0) - 200),
      (match.index || 0) + 700
    );
    const fileName =
      decodeHtml(
        extract(
          chunk,
          /class="tgme_widget_message_document_name[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        ) || ""
      ) || null;

    if (looksLikeAudioUrl(hybrid.preferredUrl) || looksLikeAudioUrl(fileName)) {
      const key = `audio:${hybrid.preferredUrl}`;
      if (seen.has(key)) return;
      seen.add(key);

      ordered.push({
        index: match.index || 0,
        item: {
          id: `audio-${ordered.length + 1}`,
          kind: "audio",
          url: hybrid.preferredUrl,
          mimeType: "audio/mpeg",
          fileName,
        },
      });
      return;
    }

    const key = `file:${hybrid.preferredUrl}`;
    if (seen.has(key)) return;
    seen.add(key);

    ordered.push({
      index: match.index || 0,
      item: {
        id: `file-${ordered.length + 1}`,
        kind: "file",
        url: hybrid.preferredUrl,
        fileName,
      },
    });
  });

  ordered.sort((a, b) => a.index - b.index);

  return ordered.map((entry, index) => ({
    ...entry.item,
    id: entry.item.id || `${entry.item.kind}-${index + 1}`,
  }));
}

function resolveContentType(
  media: IngestedPost["media"]
): IngestedPost["contentType"] {
  if (!media.length) return "text";

  if (media.length === 1) {
    const first = media[0];

    if (first.kind === "audio") return "audio";
    if (first.kind === "file") return "file";
    if (first.kind === "image") return "image";
    if (first.kind === "video") {
      return first.mimeType?.includes("gif") ? "gif" : "video";
    }
  }

  const normalizedKinds = media.map((item) =>
    item.kind === "video" && item.mimeType?.includes("gif")
      ? "gif"
      : item.kind
  );

  const uniqueKinds = new Set(normalizedKinds);

  if (uniqueKinds.size === 1 && uniqueKinds.has("image")) {
    return "gallery";
  }

  return "mixed";
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

    const html = await fetchTelegramEmbedHtml(parsed);

    const rawTextHtml = extractTextHtml(html);
    const text = decodeHtml(rawTextHtml);
    const links = extractLinks(rawTextHtml);

    const sourceTitle = extractSourceTitle(html, parsed.sourceHandle);
    const sourceAvatar = extractSourceAvatar(html);

    const verified =
      /tgme_icon_verified/i.test(html) ||
      /verified-icon/i.test(html) ||
      /tgme_page_verified_badge/i.test(html);

    const media = buildOrderedMedia(html);
    const contentType = resolveContentType(media);

    return {
      source: {
        handle: parsed.sourceHandle,
        title: sourceTitle,
        avatar: sourceAvatar,
        verified,
      },
      text,
      links,
      contentType,
      media,
      hasMediaInOriginal: media.length > 0,
      fallbackReason: null,
    };
  } catch (error) {
    console.error("ingestTelegramPost error", error);
    return null;
  }
}