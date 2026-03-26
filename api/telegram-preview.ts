export default async function handler(req: any, res: any) {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }

    const embedUrl = `${url}${url.includes("?") ? "&" : "?"}embed=1`;

    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Failed to fetch Telegram embed" });
    }

    const html = await response.text();

    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const videoMatch = html.match(/<meta property="og:video" content="([^"]+)"/i);
    const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);

    return res.status(200).json({
      image: imageMatch?.[1] || null,
      video: videoMatch?.[1] || null,
      title: titleMatch?.[1] || null,
    });
  } catch {
    return res.status(500).json({ error: "Failed to fetch preview" });
  }
}