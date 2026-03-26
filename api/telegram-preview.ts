function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMeta(html: string, key: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return null;
}

function extractVideoSrc(html: string) {
  const patterns = [
    /<video[^>]+src="([^"]+)"/i,
    /<video[^>]+src='([^']+)'/i,
    /<source[^>]+src="([^"]+)"/i,
    /<source[^>]+src='([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return null;
}

function extractPoster(html: string) {
  const patterns = [
    /<video[^>]+poster="([^"]+)"/i,
    /<video[^>]+poster='([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1]);
    }
  }

  return null;
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

function extractVerified(html: string) {
  return (
    /verified/i.test(html) &&
    /tgme_widget_message_owner/i.test(html)
  );
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

    const embedUrl = `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}embed=1`;

    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Telegram embed" });
    }

    const html = await response.text();

    const image =
      extractPoster(html) ||
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image") ||
      null;

    const video =
      extractVideoSrc(html) ||
      extractMeta(html, "og:video") ||
      extractMeta(html, "og:video:url") ||
      null;

    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      null;

    const verified = extractVerified(html);

    return res.status(200).json({
      image,
      video,
      title,
      verified,
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}