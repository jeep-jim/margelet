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

function clean(value?: string | null) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

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

async function fetchTelegramPostHtml(parsed: ParsedTelegramPostUrl) {
  const webUrl = `https://t.me/s/${parsed.sourceHandle}/${parsed.postId}`;

  const response = await fetch(webUrl, {
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
    throw new Error(
      `Telegram fetch failed: ${response.status} ${text.slice(0, 180)}`
    );
  }

  return response.text();
}

function extractWidgetPhotoUrls(html: string) {
  const styleUrls = extractAll(
    html,
    /tgme_widget_message_photo_wrap[^>]+style="[^"]*background-image:url\('([^']+)'\)/gi
  );

  const groupedStyleUrls = extractAll(
    html,
    /tgme_widget_message_grouped_wrap[^>]+style="[^"]*background-image:url\('([^']+)'\)/gi
  );

  const imgUrls = extractAll(
    html,
    /<img[^>]+src="([^"]+)"[^>]*>/gi
  );

  const candidates = [...styleUrls, ...groupedStyleUrls, ...imgUrls]
    .map((value) => normalizeAssetUrl(value))
    .filter(Boolean) as string[];

  const filtered = candidates.filter((url) => {
    const lower = url.toLowerCase();

    if (lower.includes("/i/userpic/")) return false;
    if (lower.includes("tgme_page_photo")) return false;
    if (lower.includes("emoji")) return false;

    return true;
  });

  return Array.from(new Set(filtered));
}

function extractWidgetVideoUrl(html: string) {
  const sourceUrl =
    extract(html, /<source[^>]+src="([^"]+)"[^>]*>/i) ||
    extract(html, /<video[^>]+src="([^"]+)"[^>]*>/i) ||
    extract(html, /tgme_widget_message_video_player[^>]+src="([^"]+)"/i);

  return normalizeAssetUrl(sourceUrl);
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

    const html = await fetchTelegramPostHtml(parsed);

    const rawTextHtml =
      extract(
        html,
        /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i
      ) || "";

    const title =
      clean(extract(html, /<meta property="og:title" content="([^"]+)"/i)) ||
      parsed.sourceHandle;

    const ogImage = clean(
      extract(html, /<meta property="og:image" content="([^"]+)"/i)
    );

    const avatar = clean(
      extract(
        html,
        /<img[^>]+class="tgme_page_photo_image"[^>]+src="([^"]+)"/i
      )
    );

    const verified =
      /tgme_icon_verified/i.test(html) ||
      /verified-icon/i.test(html) ||
      /<span[^>]+class="tgme_page_verified_badge"/i.test(html);

    const text = decodeHtml(rawTextHtml);
    const links = extractLinks(rawTextHtml);

    const widgetVideo = extractWidgetVideoUrl(html);
    const widgetPhotos = extractWidgetPhotoUrls(html);

    let media: IngestedPost["media"] = [];
    let contentType: IngestedPost["contentType"] = "text";

    if (widgetVideo) {
      media = [
        {
          id: "video-1",
          kind: "video",
          url: toProxy(widgetVideo) || widgetVideo,
          poster: toProxy(ogImage) || null,
        },
      ];
      contentType = "video";
    } else if (widgetPhotos.length > 1) {
      media = widgetPhotos.map((photo, index) => ({
        id: `image-${index + 1}`,
        kind: "image",
        url: toProxy(photo) || photo,
      }));
      contentType = "gallery";
    } else if (widgetPhotos.length === 1) {
      media = [
        {
          id: "image-1",
          kind: "image",
          url: toProxy(widgetPhotos[0]) || widgetPhotos[0],
        },
      ];
      contentType = "image";
    }

    return {
      source: {
        handle: parsed.sourceHandle,
        title,
        avatar: normalizeAssetUrl(avatar),
        verified,
      },
      text,
      links,
      contentType,
      media,
      hasMediaInOriginal: !!(widgetVideo || widgetPhotos.length > 0),
      fallbackReason: null,
    };
  } catch (error) {
    console.error("ingestTelegramPost error", error);
    return null;
  }
}