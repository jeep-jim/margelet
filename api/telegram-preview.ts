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

function parsePreview(html: string, fallbackTitle: string) {
  const textHtml =
    extract(html, /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i) ||
    extract(html, /<div class="tgme_widget_message_subtitle_text[^>]*>([\s\S]*?)<\/div>/i) ||
    null;

  const title =
    extract(html, /<meta property="og:title" content="([^"]+)"/i) ||
    extract(html, /<meta name="twitter:title" content="([^"]+)"/i) ||
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

  const avatar =
    extract(html, /<img[^>]+class="tgme_page_photo_image"[^>]+src="([^"]+)"/i) ||
    extract(html, /<img[^>]+class="tgme_channel_info_header_photo_image"[^>]+src="([^"]+)"/i) ||
    extract(html, /<img[^>]+src="([^"]+)"[^>]+class="tgme_page_photo_image"/i) ||
    extract(html, /<img[^>]+src="([^"]+)"[^>]+class="tgme_channel_info_header_photo_image"/i) ||
    null;

  return {
    title: clean(title),
    caption: stripTags(textHtml),
    image: normalizeUrl(image),
    video: normalizeUrl(video),
    poster: normalizeUrl(image),
    avatar: normalizeUrl(avatar),
  };
}

export default async function handler(req: any, res: any) {
  try {
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

    let html = "";
    let preview: {
      title: string | null;
      caption: string | null;
      image: string | null;
      video: string | null;
      poster: string | null;
      avatar: string | null;
    } | null = null;

    try {
      html = await fetchHtml(publicUrl);
      preview = parsePreview(html, parsed.handle);
    } catch {
      preview = null;
    }

    const needsFallback =
      !preview ||
      (!preview.image && !preview.video) ||
      !preview.avatar;

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
          avatar: fallbackPreview.avatar || preview?.avatar || null,
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
      avatar: preview?.avatar || null,
      verified: false,
      hasMediaInOriginal: !!(preview?.image || preview?.video),
      mediaKind: preview?.video ? "video" : preview?.image ? "image" : "none",
    });
  } catch (e) {
    console.error("telegram-preview error", e);
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}