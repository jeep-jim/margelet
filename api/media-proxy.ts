export const config = {
  runtime: "edge",
};

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

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUrl = searchParams.get("url");

    if (!rawUrl) {
      return new Response("Missing url", { status: 400 });
    }

    const target = new URL(rawUrl);

    if (!isAllowedHost(target.hostname)) {
      return new Response("Disallowed host", { status: 400 });
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        Accept: "*/*",
      },
    });

    if (!upstream.ok) {
      return new Response("Upstream fetch failed", {
        status: upstream.status,
      });
    }

    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    const buffer = await upstream.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          "public, max-age=172800, stale-while-revalidate=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("media-proxy error", error);
    return new Response("Media proxy failed", { status: 500 });
  }
}