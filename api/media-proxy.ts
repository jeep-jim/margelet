import type { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_HOSTS = [
  "t.me",
  "telegram.me",
  "telegram.org",
  "telegra.ph",
  "telesco.pe",
  "cdn1.telesco.pe",
  "cdn2.telesco.pe",
  "cdn3.telesco.pe",
  "cdn4.telesco.pe",
];

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();

  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const rawUrl = req.query?.url;

    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).send("Missing url");
    }

    const target = new URL(rawUrl);

    if (!isAllowedHost(target.hostname)) {
      return res.status(400).send("Disallowed host");
    }

    const upstream = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8,video/*;q=0.9",
        "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
        Referer: "https://t.me/",
        Origin: "https://t.me",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      console.error("media-proxy upstream failed", {
        url: target.toString(),
        status: upstream.status,
        body: text.slice(0, 300),
      });

      return res.status(upstream.status).send("Upstream fetch failed");
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    const cacheControl =
      upstream.headers.get("cache-control") ||
      "public, max-age=172800, stale-while-revalidate=86400";

    const arrayBuffer = await upstream.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("media-proxy error", error);
    return res.status(500).send("Media proxy failed");
  }
}