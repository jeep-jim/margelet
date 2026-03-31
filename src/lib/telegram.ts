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
  const out: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    if (match[1]) {
      out.push(match[1]);
    }
  }

  return out;
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

function extractWidgetPhotoUrls(html: string) {
  const photoWraps = extractAll(
    html,
    /class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/gi
  );

  const groupedWraps = extractAll(
    html,
    /class="tgme_widget_message_grouped_wrap[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/gi
  );

  const urls = [...photoWraps, ...groupedWraps]
    .map((value) => normalizeAssetUrl(value))
    .filter(Boolean) as string[];

  return Array.from(new Set(urls));
}

function extractWidgetVideoUrl(html: string) {
  const sourceUrl =
    extract(html, /<source[^>]+src="([^"]+)"[^>]*>/i) ||
    extract(html, /<video[^>]+src="([^"]+)"[^>]*>/i);

  return normalizeAssetUrl(sourceUrl);
}

function extractVideoPoster(html: string) {
  const stylePoster =
    extract(
      html,
      /class="tgme_widget_message_video_thumb[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/i
    ) ||
    extract(
      html,
      /class="tgme_widget_message_video_player[^"]*"[^>]*style="[^"]*background-image:url\('([^']+)'\)/i
    );

  return normalizeAssetUrl(stylePoster);
}

function detectGif(html: string, videoUrl: string | null) {
  if (!videoUrl) return false;

  return (
    /tgme_widget_message_animation/i.test(html) ||
    /tgme_widget_message_gif/i.test(html) ||
    /\.mp4(\?|$)/i.test(videoUrl)
  );
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

    const videoUrl = extractWidgetVideoUrl(html);
    const videoPoster = extractVideoPoster(html);
    const photoUrls = extractWidgetPhotoUrls(html);

    let media: IngestedPost["media"] = [];
    let contentType: IngestedPost["contentType"] = "text";

    if (videoUrl) {
      const isGif = detectGif(html, videoUrl);

      media = [
        {
          id: isGif ? "gif-1" : "video-1",
          kind: "video",
          url: toProxy(videoUrl) || videoUrl,
          poster: toProxy(videoPoster) || null,
        },
      ];

      contentType = isGif ? "gif" : "video";
    } else if (photoUrls.length > 1) {
      media = photoUrls.map((photo, index) => ({
        id: `image-${index + 1}`,
        kind: "image",
        url: toProxy(photo) || photo,
      }));
      contentType = "gallery";
    } else if (photoUrls.length === 1) {
      media = [
        {
          id: "image-1",
          kind: "image",
          url: toProxy(photoUrls[0]) || photoUrls[0],
        },
      ];
      contentType = "image";
    }

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
      hasMediaInOriginal: !!(videoUrl || photoUrls.length > 0),
      fallbackReason: null,
    };
  } catch (error) {
    console.error("ingestTelegramPost error", error);
    return null;
  }
}