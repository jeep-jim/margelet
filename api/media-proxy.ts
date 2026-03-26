const ALLOWED_HOSTS = [
  "t.me",
  "telegram.me",
  "telegram.org",
  "telegra.ph",
  "telesco.pe",
];

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();

  return ALLOWED_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export default async function handler(req: any, res: any) {
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
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
        Accept: "*/*",
      },
    });

    if (!upstream.ok) {
      return res.status(upstream.status).send("Upstream fetch failed");
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const cacheControl =
      upstream.headers.get("cache-control") || "public, max-age=86400";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    res.setHeader("Access-Control-Allow-Origin", "*");

    const arrayBuffer = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error("media-proxy error", error);
    return res.status(500).send("Media proxy failed");
  }
}