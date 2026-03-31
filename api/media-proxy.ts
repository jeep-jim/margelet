const DEFAULT_MAX_PROXY_BYTES = 30 * 1024 * 1024; // 30 MB

type EnvMap = Record<string, string | undefined>;

const env: EnvMap =
  (
    globalThis as typeof globalThis & {
      process?: { env?: EnvMap };
    }
  ).process?.env ?? {};

function getMaxProxyBytes() {
  const raw = String(env.MEDIA_PROXY_MAX_BYTES || "").trim();
  const value = Number(raw);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return DEFAULT_MAX_PROXY_BYTES;
}

function asSingleString(value: unknown): string {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeTargetUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const withProtocol =
      value.startsWith("http://") || value.startsWith("https://")
        ? value
        : `https://${value}`;

    const url = new URL(withProtocol);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function setCors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Type, Content-Length, Accept-Ranges, Content-Range");
}

function setNoStore(res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
}

function copyHeaderIfPresent(from: Headers, to: any, name: string) {
  const value = from.get(name);
  if (value) {
    to.setHeader(name, value);
  }
}

function sendJson(res: any, status: number, payload: Record<string, unknown>) {
  res.status(status).json(payload);
}

export default async function handler(req: any, res: any) {
  setCors(res);
  setNoStore(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const rawUrl = asSingleString(req.query?.url);
  const targetUrl = normalizeTargetUrl(rawUrl);

  if (!targetUrl) {
    return sendJson(res, 400, { error: "Missing or invalid url" });
  }

  const maxProxyBytes = getMaxProxyBytes();

  try {
    const requestHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
      Accept: "*/*",
      Referer: "https://t.me/",
    };

    const incomingRange = asSingleString(req.headers?.range);
    if (incomingRange) {
      requestHeaders.Range = incomingRange;
    }

    let upstreamHead: Response | null = null;
    let contentLength: number | null = null;
    let contentType: string | null = null;

    try {
      upstreamHead = await fetch(targetUrl, {
        method: "HEAD",
        headers: requestHeaders,
        redirect: "follow",
      });

      if (upstreamHead.ok) {
        const rawLength = upstreamHead.headers.get("content-length");
        const parsedLength = rawLength ? Number(rawLength) : NaN;
        contentLength = Number.isFinite(parsedLength) ? parsedLength : null;
        contentType = upstreamHead.headers.get("content-type");
      }
    } catch {
      upstreamHead = null;
    }

    if (contentLength !== null && contentLength > maxProxyBytes) {
      return sendJson(res, 413, {
        error: "File too large for proxy",
        code: "FILE_TOO_LARGE",
        maxProxyBytes,
        contentLength,
      });
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: requestHeaders,
      redirect: "follow",
    });

    if (!upstream.ok) {
      return sendJson(res, upstream.status, {
        error: "Upstream request failed",
        status: upstream.status,
      });
    }

    const upstreamLengthHeader = upstream.headers.get("content-length");
    const upstreamLength = upstreamLengthHeader ? Number(upstreamLengthHeader) : NaN;
    const finalContentLength =
      contentLength ??
      (Number.isFinite(upstreamLength) ? upstreamLength : null);

    if (finalContentLength !== null && finalContentLength > maxProxyBytes) {
      return sendJson(res, 413, {
        error: "File too large for proxy",
        code: "FILE_TOO_LARGE",
        maxProxyBytes,
        contentLength: finalContentLength,
      });
    }

    res.status(upstream.status);

    if (contentType || upstream.headers.get("content-type")) {
      res.setHeader(
        "Content-Type",
        contentType || upstream.headers.get("content-type") || "application/octet-stream"
      );
    }

    if (finalContentLength !== null) {
      res.setHeader("Content-Length", String(finalContentLength));
    }

    copyHeaderIfPresent(upstream.headers, res, "accept-ranges");
    copyHeaderIfPresent(upstream.headers, res, "content-range");
    copyHeaderIfPresent(upstream.headers, res, "last-modified");
    copyHeaderIfPresent(upstream.headers, res, "etag");

    if (req.method === "HEAD") {
      return res.end();
    }

    if (!upstream.body) {
      return res.end();
    }

    const reader = upstream.body.getReader();
    let sentBytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;
      if (!value) continue;

      sentBytes += value.byteLength;

      if (sentBytes > maxProxyBytes) {
        try {
          reader.cancel();
        } catch {
          //
        }

        if (!res.headersSent) {
          return sendJson(res, 413, {
            error: "File too large for proxy",
            code: "FILE_TOO_LARGE",
            maxProxyBytes,
            contentLength: sentBytes,
          });
        }

        res.destroy();
        return;
      }

      const canContinue = res.write(Buffer.from(value));

      if (!canContinue) {
        await new Promise<void>((resolve) => {
          res.once("drain", resolve);
        });
      }
    }

    return res.end();
  } catch (error) {
    console.error("media-proxy error", error);
    return sendJson(res, 500, { error: "Failed to proxy media" });
  }
}