function clean(value?: string | null) {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
}

function normalizeUrl(value?: string | null) {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;

  if (v.startsWith("//")) return `https:${v}`;
  if (v.startsWith("http://")) return `https://${v.slice(7)}`;
  return v;
}

function toProxy(url?: string | null) {
  const n = normalizeUrl(url);
  if (!n) return null;
  return `/api/media-proxy?url=${encodeURIComponent(n)}`;
}

function parseUrl(raw: string) {
  const u = new URL(raw);
  const parts = u.pathname.split("/").filter(Boolean);
  if (parts.length !== 2) return null;

  const [handle, postId] = parts;
  return { handle, postId };
}

function extract(html: string, re: RegExp) {
  const m = html.match(re);
  return m?.[1] ? m[1] : null;
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

    const webUrl = `https://t.me/s/${parsed.handle}/${parsed.postId}`;

    const r = await fetch(webUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
      },
    });

    if (!r.ok) {
      return res.status(502).json({ error: "Failed to fetch Telegram" });
    }

    const html = await r.text();

    // TEXT
    const text =
      extract(html, /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/i) ||
      null;

    // TITLE
    const title =
      extract(html, /<meta property="og:title" content="([^"]+)"/i) ||
      parsed.handle;

    // IMAGE
    const image =
      extract(html, /<meta property="og:image" content="([^"]+)"/i);

    // VIDEO
    const video =
      extract(html, /<meta property="og:video" content="([^"]+)"/i);

    // POSTER
    const poster =
      extract(html, /<meta property="og:image" content="([^"]+)"/i);

    // AVATAR
    const avatar =
      extract(html, /<img[^>]+class="tgme_page_photo_image"[^>]+src="([^"]+)"/i);

    return res.status(200).json({
      canonical: raw,

      title: clean(title),
      caption: clean(text),

      image: toProxy(image),
      video: toProxy(video),
      poster: toProxy(poster),

      avatar: normalizeUrl(avatar),
      verified: false,

      hasMediaInOriginal: !!(image || video),
      mediaKind: video ? "video" : image ? "image" : "none",
    });
  } catch (e) {
    console.error("telegram-preview error", e);
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}