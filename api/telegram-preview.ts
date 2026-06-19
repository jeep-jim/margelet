import { readFile } from "node:fs/promises";
import path from "node:path";

function clean(value?: string | null) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;

  const decoded = v.replace(/&amp;/g, "&");

  if (decoded.startsWith("//")) return `https:${decoded}`;
  if (decoded.startsWith("http://")) return `https://${decoded.slice(7)}`;
  return decoded;
}

function parseUrl(raw: string) {
  const u = new URL(raw);
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const handle = parts[0];
  const postId = parts[1];
  const isSingle =
    u.searchParams.has("single") ||
    u.search.includes("single");

  return { handle, postId, isSingle };
}

function extract(html: string, re: RegExp) {
  const m = html.match(re);
  return m?.[1] ? m[1] : null;
}

function stripTags(html?: string | null) {
  if (!html) return null;
  return clean(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
  );
}

async function fetchHtml(url: string) {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
      Referer: "https://t.me/",
    },
    redirect: "follow",
  });

  if (!r.ok) {
    throw new Error(`Failed to fetch ${url}: ${r.status}`);
  }

  return r.text();
}

function extractAvatar(html: string) {
  const candidates = [
    extract(
      html,
      /<div[^>]+class="tgme_widget_message_user"[\s\S]*?<img[^>]+src="([^"]+)"/i
    ),
    extract(
      html,
      /<div[^>]+class="tgme_widget_message_user"[\s\S]*?<img[^>]+srcset="([^"\s,]+)[^"]*"/i
    ),
    extract(
      html,
      /<i[^>]+class="[^"]*tgme_widget_message_user_photo[^"]*"[^>]+style="[^"]*background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)/i
    ),
    extract(
      html,
      /<i[^>]+style="[^"]*background-image\s*:\s*url\(['"]?([^'")]+)['"]?\)[^"]*"[^>]+class="[^"]*tgme_widget_message_user_photo[^"]*"/i
    ),
    extract(
      html,
      /<img[^>]+class="tgme_page_photo_image"[^>]+src="([^"]+)"/i
    ),
    extract(
      html,
      /<img[^>]+class="tgme_channel_info_header_photo_image"[^>]+src="([^"]+)"/i
    ),
    extract(
      html,
      /<img[^>]+src="([^"]+)"[^>]+class="tgme_page_photo_image"/i
    ),
    extract(
      html,
      /<img[^>]+src="([^"]+)"[^>]+class="tgme_channel_info_header_photo_image"/i
    ),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}


function isTelegramGeneratedDataAvatar(url?: string | null) {
  const value = String(url || "").trim().toLowerCase();
  return value.startsWith("data:image/svg+xml");
}

function parsePreview(html: string, fallbackTitle: string) {
  const textHtml =
    extract(html, /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i) ||
    extract(html, /<div class="tgme_widget_message_subtitle_text[^>]*>([\s\S]*?)<\/div>/i) ||
    null;

  const title =
    extract(html, /<meta property="og:title" content="([^"]+)"/i) ||
    extract(html, /<meta name="twitter:title" content="([^"]+)"/i) ||
    extract(html, /<div[^>]+class="tgme_widget_message_author[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    fallbackTitle;

  const image =
    extract(html, /<meta property="og:image" content="([^"]+)"/i) ||
    extract(html, /<meta name="twitter:image" content="([^"]+)"/i) ||
    null;

  const video =
    extract(html, /<meta property="og:video" content="([^"]+)"/i) ||
    extract(html, /<meta property="og:video:url" content="([^"]+)"/i) ||
    extract(html, /<meta name="twitter:player:stream" content="([^"]+)"/i) ||
    null;

  const avatar = extractAvatar(html);

  return {
    title: stripTags(title) || clean(title),
    caption: stripTags(textHtml),
    image: normalizeUrl(image),
    video: normalizeUrl(video),
    poster: normalizeUrl(image),
    avatar,
  };
}



type ShareMediaItem = {
  kind?: string;
  url?: string;
  poster?: string;
  width?: number;
  height?: number;
};

type ShareFeedPost = {
  id: number;
  text?: string;
  postUrl?: string;
  createdAt?: string;
  sourceCountryCode?: string;
  source?: {
    handle?: string;
    title?: string;
    avatar?: string | null;
    verified?: boolean;
  };
  media?: ShareMediaItem[];
};

const SHARE_SITE_ORIGIN = "https://www.margelet.space";
const SHARE_DEFAULT_IMAGE = `${SHARE_SITE_ORIGIN}/icon-512.png`;

function shareEscapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shareTruncate(value: unknown, max: number) {
  const text = String(value ?? "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
}

function shareNormalizeHandle(value: unknown) {
  return String(value ?? "").replace(/^@+/, "").trim().toLowerCase();
}

function shareGetPostIdFromUrl(value: unknown) {
  const match = String(value ?? "").match(/\/([0-9]+)(?:\?single)?$/);
  return match?.[1] || "";
}

function shareAbsoluteUrl(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return `${SHARE_SITE_ORIGIN}${raw}`;
  return raw;
}

function shareGetPreviewImage(post: ShareFeedPost) {
  const media = Array.isArray(post.media) ? post.media : [];

  for (const item of media) {
    if (item?.kind === "image" && item.url) return shareAbsoluteUrl(item.url);
    if (item?.poster) return shareAbsoluteUrl(item.poster);
  }

  for (const item of media) {
    if (item?.url && item.kind !== "video") return shareAbsoluteUrl(item.url);
  }

  return post.source?.avatar ? shareAbsoluteUrl(post.source.avatar) : SHARE_DEFAULT_IMAGE;
}

async function shareReadJson<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(process.cwd(), relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function shareReadAllPosts(): Promise<ShareFeedPost[]> {
  const index = await shareReadJson<{
    chunksList?: Array<{ number?: number; path?: string }>;
  }>("data/feed/index.json", { chunksList: [] });

  const chunks = Array.isArray(index.chunksList) ? index.chunksList : [];

  if (chunks.length > 0) {
    const posts: ShareFeedPost[] = [];

    for (const chunk of chunks.slice(0, 150)) {
      const number = Number(chunk.number || 0);
      const chunkPath =
        typeof chunk.path === "string" && chunk.path
          ? chunk.path.replace(/^\/+/, "")
          : `data/feed/chunks/${String(number).padStart(4, "0")}.json`;

      const chunkPosts = await shareReadJson<ShareFeedPost[]>(chunkPath, []);
      if (Array.isArray(chunkPosts)) posts.push(...chunkPosts);
    }

    return posts;
  }

  const feed = await shareReadJson<{ posts?: ShareFeedPost[] }>("data/feed.json", { posts: [] });
  return Array.isArray(feed.posts) ? feed.posts : [];
}

function shareRenderHtml(post: ShareFeedPost, handle: string, telegramPostId: string) {
  const sourceTitle = post.source?.title || post.source?.handle || handle || "Telegram";
  const country = String(post.sourceCountryCode || "").toUpperCase() || "Telegram";
  const text = shareTruncate(post.text, 180);
  const titleText = text || `${sourceTitle}: Telegram post`;
  const title = `${titleText} — margeleT`;
  const description = [
    text ? `📰 ${text}` : "📰 Telegram post in margeleT",
    `👤 ${sourceTitle}`,
    `🌍 ${country}`,
  ].join(" · ");
  const image = shareGetPreviewImage(post);
  const canonical = `${SHARE_SITE_ORIGIN}/${encodeURIComponent(handle)}/${encodeURIComponent(telegramPostId)}`;
  const appPath = `/post/${encodeURIComponent(String(post.id))}`;

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${shareEscapeHtml(title)}</title>
  <meta name="description" content="${shareEscapeHtml(description)}" />
  <link rel="canonical" href="${shareEscapeHtml(canonical)}" />

  <meta property="og:site_name" content="margeleT" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${shareEscapeHtml(canonical)}" />
  <meta property="og:title" content="${shareEscapeHtml(title)}" />
  <meta property="og:description" content="${shareEscapeHtml(description)}" />
  <meta property="og:image" content="${shareEscapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${shareEscapeHtml(image)}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${shareEscapeHtml(title)}" />
  <meta name="twitter:description" content="${shareEscapeHtml(description)}" />
  <meta name="twitter:image" content="${shareEscapeHtml(image)}" />

  <script>
    if (!/bot|crawl|spider|telegrambot|twitterbot|facebookexternalhit|whatsapp|vkshare|slackbot/i.test(navigator.userAgent || "")) {
      window.location.replace(${JSON.stringify(appPath)});
    }
  </script>
</head>
<body style="margin:0;background:#0f1d2a;color:white;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <main style="max-width:640px;margin:40px auto;padding:20px">
    <h1>${shareEscapeHtml(titleText)}</h1>
    <p>${shareEscapeHtml(description)}</p>
    ${image ? `<img src="${shareEscapeHtml(image)}" alt="" style="max-width:100%;border-radius:20px" />` : ""}
    <p><a style="color:#7dd3fc" href="${shareEscapeHtml(appPath)}">Открыть пост в margeleT</a></p>
  </main>
</body>
</html>`;
}

async function handleShareOg(req: any, res: any) {
  const handle = shareNormalizeHandle(req.query?.handle);
  const telegramPostId = String(req.query?.postId || "").trim();

  if (!handle || !telegramPostId) {
    return res.status(404).send("Not found");
  }

  const posts = await shareReadAllPosts();
  const post = posts.find((item) => {
    return shareNormalizeHandle(item.source?.handle) === handle && shareGetPostIdFromUrl(item.postUrl) === telegramPostId;
  });

  if (!post) {
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return res
      .status(200)
      .send(`<!doctype html><html><head><title>margeleT</title><script>window.location.replace("/${encodeURIComponent(handle)}")</script></head><body></body></html>`);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return res.status(200).send(shareRenderHtml(post, handle, telegramPostId));
}

export default async function handler(req: any, res: any) {
  try {
    if (req.query?.og === "1" || (req.query?.handle && req.query?.postId)) {
      return handleShareOg(req, res);
    }

    const raw = req.query?.url;

    if (!raw || typeof raw !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }

    const parsed = parseUrl(raw);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid Telegram URL" });
    }

    const canonical = `https://t.me/${parsed.handle}/${parsed.postId}${parsed.isSingle ? "?single" : ""}`;
    const publicUrl = `https://t.me/s/${parsed.handle}/${parsed.postId}${parsed.isSingle ? "?single" : ""}`;
    const directUrl = canonical;

    let preview: {
      title: string | null;
      caption: string | null;
      image: string | null;
      video: string | null;
      poster: string | null;
      avatar: string | null;
    } | null = null;

    try {
      const html = await fetchHtml(publicUrl);
      preview = parsePreview(html, parsed.handle);
    } catch {
      preview = null;
    }

    const needsFallback =
      !preview ||
      (!preview.image && !preview.video) ||
      !preview.avatar || isTelegramGeneratedDataAvatar(preview.avatar);

    if (needsFallback) {
      try {
        const fallbackHtml = await fetchHtml(directUrl);
        const fallbackPreview = parsePreview(fallbackHtml, parsed.handle);

        preview = {
          title: fallbackPreview.title || preview?.title || parsed.handle,
          caption: fallbackPreview.caption || preview?.caption || null,
          image: fallbackPreview.image || preview?.image || null,
          video: fallbackPreview.video || preview?.video || null,
          poster: fallbackPreview.poster || preview?.poster || null,
          avatar:
            fallbackPreview.avatar && !isTelegramGeneratedDataAvatar(fallbackPreview.avatar)
              ? fallbackPreview.avatar
              : preview?.avatar && !isTelegramGeneratedDataAvatar(preview.avatar)
                ? preview.avatar
                : null,              
        };
      } catch {
        if (!preview) {
          preview = {
            title: parsed.handle,
            caption: null,
            image: null,
            video: null,
            poster: null,
            avatar: null,
          };
        }
      }
    }

    return res.status(200).json({
      canonical,
      title: preview?.title || parsed.handle,
      caption: preview?.caption || null,
      image: preview?.image || null,
      video: preview?.video || null,
      poster: preview?.poster || null,
      avatar: !isTelegramGeneratedDataAvatar(preview?.avatar) ? preview?.avatar || null : null,
      verified: false,
      hasMediaInOriginal: !!(preview?.image || preview?.video),
      mediaKind: preview?.video ? "video" : preview?.image ? "image" : "none",
    });
  } catch (e) {
    console.error("telegram-preview error", e);
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}