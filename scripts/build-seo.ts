import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { SEO_LOCALE_META, type CountryCode, type IngestedPost } from "../api/lib/contracts.js";

const SITE_ORIGIN = "https://www.margelet.space";
const PUBLIC_DIR = "public";
const COUNTRY_DIR = path.join(PUBLIC_DIR, "country");
const POST_DIR = path.join(PUBLIC_DIR, "post");
const SITEMAPS_DIR = path.join(PUBLIC_DIR, "sitemaps");
const MAX_POSTS_PER_COUNTRY_PAGE = 36;
const MAX_POSTS_PER_TAG_PAGE = 32;
const MAX_RELATED_POSTS = 8;
const MAX_TAG_LINKS = 64;

const COUNTRY_NAMES: Record<string, string> = {
  ru: "Russia",
  ua: "Ukraine",
  us: "United States",
  in: "India",
  ir: "Iran",
  tr: "Turkey",
  br: "Brazil",
  kz: "Kazakhstan",
  uz: "Uzbekistan",
  ae: "United Arab Emirates",
  eg: "Egypt",
  pk: "Pakistan",
  id: "Indonesia",
  mx: "Mexico",
  sa: "Saudi Arabia",
  es: "Spain",
  it: "Italy",
  fr: "France",
  de: "Germany",
  ar: "Argentina",
  co: "Colombia",
  za: "South Africa",
  ng: "Nigeria",
  cn: "China",
  my: "Malaysia",
};

type FeedIndexFile = {
  version?: number;
  updatedAt?: string;
  countries?: Record<string, { code: string; posts: number; chunks: number; mode: "single" | "chunked"; path: string; updatedAt: string }>;
};

type CountrySingleFile = {
  countryCode: string;
  updatedAt: string;
  totalPosts: number;
  chunks: 1;
  items: IngestedPost[];
};

type CountryChunkedFile = {
  countryCode: string;
  updatedAt: string;
  totalPosts: number;
  chunks: Array<{ id: number; path: string; posts: number }>;
};

type CountryFeedFile = CountrySingleFile | CountryChunkedFile;

type UrlEntry = {
  loc: string;
  lastmod?: string | null;
  changefreq?: "hourly" | "daily" | "weekly";
  priority?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value: unknown) {
  return escapeHtml(value);
}

function truncate(value: unknown, max = 220) {
  const normalized = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function slugSegment(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "all";
}

function getCountryName(countryCode: string) {
  return COUNTRY_NAMES[countryCode] || countryCode.toUpperCase();
}

function formatDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}

function isoDate(value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeCountryCode(value: unknown) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "ru";
  if (raw === "en") return "us";
  if (raw === "zh") return "cn";
  if (raw === "fa") return "ir";
  if (raw === "kk") return "kz";
  if (raw === "ms") return "my";
  if (raw === "pt-br") return "br";
  return raw;
}

function normalizeTag(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getPostTags(post: IngestedPost) {
  const tags = new Set<string>();
  if (post.tag) tags.add(normalizeTag(post.tag));
  if (Array.isArray(post.tags)) {
    post.tags.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (normalized) tags.add(normalized);
    });
  }
  return Array.from(tags).filter(Boolean);
}

function getTagPath(countryCode: string, tag: string) {
  const normalized = normalizeTag(tag);
  if (!normalized) return `/country/${countryCode}`;

  if (!normalized.includes("_")) {
    return `/country/${countryCode}/tag/${slugSegment(normalized)}`;
  }

  const [parent, ...rest] = normalized.split("_");
  const child = rest.join("_") || "all";
  return `/country/${countryCode}/tag/${slugSegment(parent)}/${slugSegment(child)}`;
}

function getPostPermalink(post: IngestedPost) {
  return `/post/${encodeURIComponent(String(post.id))}`;
}

function getLiveFeedPath(countryCode: string) {
  return `/${countryCode}`;
}

function getSourcePath(handle?: string | null) {
  const clean = String(handle || "").replace(/^@+/, "").trim();
  return clean ? `/${encodeURIComponent(clean)}` : "/";
}

function getTelegramPostIdFromUrl(postUrl?: string | null) {
  const match = String(postUrl || "").match(/\/([0-9]+)(?:\?single)?$/);
  return match?.[1] || "";
}

function getSourcePostPath(post: IngestedPost) {
  const handle = String(post.source?.handle || "").replace(/^@+/, "").trim();
  const postId = getTelegramPostIdFromUrl(post.postUrl);

  if (handle && postId) {
    return `/${encodeURIComponent(handle)}/${encodeURIComponent(postId)}`;
  }

  return getSourcePath(handle);
}

function getPostTitle(post: IngestedPost) {
  const text = truncate(post.text, 74);
  if (text) return text;

  const source = post.source?.title || post.source?.handle || "Telegram post";
  const kind = post.contentType || (post.media?.[0]?.kind ?? "post");
  return `${source} ${kind} snapshot`;
}

function getPrimaryTagLabel(post: IngestedPost) {
  const tag = getPostTags(post)[0] || post.tag || "telegram";
  return tagTitle(tag).toLowerCase();
}

function getSourceTitle(post: IngestedPost) {
  return post.source?.title || post.source?.handle || "Telegram source";
}

function getSeoPostHeadline(post: IngestedPost) {
  return getPostTitle(post);
}

function getSeoPostTitle(post: IngestedPost) {
  const countryCode = normalizeCountryCode(post.sourceCountryCode);
  const countryName = getCountryName(countryCode);
  const sourceTitle = getSourceTitle(post);
  const topic = getPrimaryTagLabel(post);
  return `${truncate(getSeoPostHeadline(post), 86)} — ${sourceTitle}, ${countryName} ${topic} | margeleT`;
}

function getSeoPostDescription(post: IngestedPost) {
  const countryCode = normalizeCountryCode(post.sourceCountryCode);
  const countryName = getCountryName(countryCode);
  const sourceTitle = getSourceTitle(post);
  const tags = getPostTags(post).slice(0, 4).map((tag) => tag.replace(/_/g, " ")).join(", ");
  const body = truncate(post.text || `Fresh Telegram post from ${sourceTitle}.`, 185);
  return `Fresh Telegram snapshot from ${sourceTitle} in ${countryName}. ${body}${tags ? ` Topics: ${tags}.` : ""}`;
}

function getKeywordsContent(post: IngestedPost) {
  const countryCode = normalizeCountryCode(post.sourceCountryCode);
  const values = [
    "margeleT",
    "Telegram",
    getCountryName(countryCode),
    getSourceTitle(post),
    ...(post.source?.handle ? [post.source.handle] : []),
    ...getPostTags(post).map((tag) => tag.replace(/_/g, " ")),
  ];

  return Array.from(new Set(values.filter(Boolean))).join(", ");
}

function getFirstImage(post: IngestedPost) {
  const media = Array.isArray(post.media) ? post.media : [];
  const image = media.find((item) => item.kind === "image" && item.url)?.url;
  if (image) return image;

  const poster = media.find((item) => item.kind === "video" && item.poster)?.poster;
  return poster || null;
}


function getSourceAuthorSchema(post: IngestedPost) {
  const sourceTitle = getSourceTitle(post);
  const handle = post.source?.handle || "";
  return {
    "@type": "Organization",
    name: sourceTitle,
    url: handle ? `${SITE_ORIGIN}${getSourcePath(handle)}` : SITE_ORIGIN,
    logo: post.source?.avatar || `${SITE_ORIGIN}/icon-512.png`,
  };
}

function getPostSchemaText(post: IngestedPost) {
  const text = String(post.text || "").replace(/\s+/g, " " ).trim();
  return truncate(text || getSeoPostDescription(post), 3000);
}

function getPostVideoSchema(post: IngestedPost, fallbackImage?: string | null) {
  const video = Array.isArray(post.media)
    ? post.media.find((item) => item.kind === "video" && item.url)
    : null;

  if (!video?.url) return undefined;

  return {
    "@type": "VideoObject",
    name: getSeoPostHeadline(post),
    description: getSeoPostDescription(post),
    thumbnailUrl: video.poster || fallbackImage || `${SITE_ORIGIN}/icon-512.png`,
    uploadDate: isoDate(post.createdAt),
    contentUrl: video.url,
  };
}

function renderVerifiedMark(verified?: boolean) {
  if (!verified) return "";

  return `<span class="verified-badge" title="Verified" aria-label="Verified">
    <svg width="14" height="14" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="tg_v_grad_seo" x1="74.8279" y1="-10.5043" x2="74.8279" y2="161.383" gradientUnits="userSpaceOnUse">
          <stop stop-color="#5ABEF7" />
          <stop offset="1" stop-color="#0096FF" />
        </linearGradient>
        <mask id="tg_v_mask_seo">
          <rect width="150" height="150" fill="black" />
          <path d="M37.1506 10.7746C38.8073 1.29262 49.8359 -3.16301 57.6144 2.50705L68.0031 10.0793C72.4989 13.3565 78.5816 13.4103 83.134 10.2121L93.6525 2.82151C101.529 -2.71218 112.478 1.93572 113.969 11.4455L115.96 24.1457C116.822 29.642 121.085 33.9811 126.566 34.9387L139.23 37.1506C148.712 38.8072 153.168 49.8359 147.497 57.6145L139.925 68.0031C136.648 72.499 136.595 78.5817 139.793 83.134L147.183 93.6526C152.716 101.529 148.069 112.478 138.559 113.969L125.859 115.96C120.362 116.822 116.024 121.085 115.067 126.566L112.854 139.23C111.197 148.712 100.168 153.168 92.3898 147.497L82.0021 139.925C77.5063 136.648 71.4226 136.595 66.8703 139.793L56.3517 147.183C48.4754 152.716 37.5261 148.069 36.0348 138.559L34.0438 125.859C33.1816 120.362 28.9184 116.024 23.437 115.067L10.7738 112.854C1.29185 111.197 -3.16378 100.168 2.50628 92.3898L10.0786 82.0021C13.3557 77.5063 13.4096 71.4226 10.2113 66.8703L2.82074 56.3517C-2.71295 48.4754 1.93495 37.5261 11.4447 36.0348L24.1449 34.0438C29.6412 33.1816 33.9803 28.9184 34.9379 23.437L37.1506 10.7746Z" fill="white" />
        </mask>
      </defs>
      <rect width="150" height="150" fill="url(#tg_v_grad_seo)" mask="url(#tg_v_mask_seo)" />
      <path d="M63.6244 96.3518C61.2894 96.3518 59.0921 95.4431 57.4374 93.7886L46.182 82.5331C42.7679 79.1191 42.7679 73.5841 46.182 70.1698C49.5963 66.7558 55.1313 66.7558 58.5453 70.1698L63.6244 75.2489L91.4548 47.4185C94.8691 44.0045 100.404 44.0045 103.818 47.4185C107.232 50.8328 107.232 56.3678 103.818 59.7821L69.8114 93.7886C68.1569 95.4431 65.9594 96.3518 63.6244 96.3518Z" fill="white" />
    </svg>
  </span>`;
}

function renderSourceHeader(post: IngestedPost) {
  const sourceTitle = post.source?.title || post.source?.handle || "Telegram source";
  const handle = post.source?.handle || "";
  const avatar = post.source?.avatar || null;

  return `<p class="source">
        ${avatar ? `<img class="source-avatar" src="${escapeHtml(avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ""}
        <span class="source-main">
          <span class="source-title-row"><strong class="source-title">${escapeHtml(sourceTitle)}</strong>${renderVerifiedMark(Boolean(post.source?.verified))}</span>
          ${handle ? `<span>@${escapeHtml(handle)}</span>` : ""}
        </span>
      </p>`;
}

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function readCountryPosts(countryCode: string): Promise<{ posts: IngestedPost[]; updatedAt: string }> {
  const countryPath = path.join("data", "feeds", `${countryCode}.json`);
  const manifest = await readJson<CountryFeedFile>(countryPath);
  if (!manifest) return { posts: [], updatedAt: new Date(0).toISOString() };

  if ("items" in manifest && Array.isArray(manifest.items)) {
    return {
      posts: manifest.items,
      updatedAt: manifest.updatedAt || new Date().toISOString(),
    };
  }

  if (!Array.isArray(manifest.chunks)) {
    return { posts: [], updatedAt: manifest.updatedAt || new Date().toISOString() };
  }

  const chunks = await Promise.all(
    manifest.chunks.map(async (chunk) => {
      const relative = String(chunk.path || "").replace(/^\/+/, "");
      const chunkPath = path.join("data", relative);
      const payload = await readJson<{ posts?: IngestedPost[] }>(chunkPath);
      return Array.isArray(payload?.posts) ? payload.posts : [];
    })
  );

  return {
    posts: chunks.flat(),
    updatedAt: manifest.updatedAt || new Date().toISOString(),
  };
}

function uniquePosts(posts: IngestedPost[]) {
  const seen = new Set<string>();
  const out: IngestedPost[] = [];

  for (const post of posts) {
    const key = String(post.id || post.postUrl || "");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(post);
  }

  return out;
}

function sortPosts(posts: IngestedPost[]) {
  return [...posts].sort((a, b) => {
    const bMs = Date.parse(b.createdAt || "") || 0;
    const aMs = Date.parse(a.createdAt || "") || 0;
    return bMs - aMs;
  });
}

function baseHead(params: {
  lang: string;
  title: string;
  description: string;
  canonicalPath: string;
  updatedAt: string;
  image?: string | null;
  keywords?: string | null;
  ogType?: "website" | "article";
  structuredData: unknown;
  alternates?: string;
}) {
  const canonicalUrl = `${SITE_ORIGIN}${params.canonicalPath}`;
  const image = params.image || `${SITE_ORIGIN}/hero.webp`;
  const ogType = params.ogType || "website";

  return `<!doctype html>
<html lang="${escapeHtml(params.lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(params.title)}</title>
  <meta name="description" content="${escapeHtml(params.description)}" />
  ${params.keywords ? `<meta name="keywords" content="${escapeHtml(params.keywords)}" />` : ""}
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  ${params.alternates || ""}
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <meta property="og:type" content="${escapeHtml(ogType)}" />
  <meta property="og:site_name" content="margeleT" />
  <meta property="og:title" content="${escapeHtml(params.title)}" />
  <meta property="og:description" content="${escapeHtml(params.description)}" />
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:updated_time" content="${escapeHtml(isoDate(params.updatedAt))}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(params.title)}" />
  <meta name="twitter:description" content="${escapeHtml(params.description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <script type="application/ld+json">${JSON.stringify(params.structuredData)}</script>
  <style>
    :root{color-scheme:dark}html,body{width:100%;max-width:100%;overflow-x:hidden}*,*::before,*::after{box-sizing:border-box}body{margin:0;background:#101c29;color:#f7fbff;font-family:Inter,Arial,sans-serif;line-height:1.55}main{width:100%;max-width:920px;margin:0 auto;padding:32px 18px 56px;overflow-x:hidden}.brand{font-weight:800;font-size:28px;margin-bottom:26px}.card,.post{width:100%;max-width:100%;min-width:0;overflow:hidden;background:#172635;border:1px solid #294158;border-radius:22px;padding:18px;margin:14px 0}.muted,.meta,.source span{color:#a9bed2}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}a{color:#b9dcff;overflow-wrap:anywhere;word-break:break-word;max-width:100%}.pill{display:inline-block;border:1px solid #31506b;border-radius:999px;padding:7px 11px;margin:4px}.source{margin-top:0;display:flex;align-items:center;gap:9px;min-width:0}.source-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;background:#0b1520;border:1px solid #31506b;flex:0 0 auto}.source-main{min-width:0;max-width:100%;overflow:hidden}.source-title-row{display:flex;align-items:center;gap:5px;min-width:0;max-width:100%;overflow:hidden}.source-title{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.verified-badge{display:inline-flex;width:14px;height:14px;align-items:center;justify-content:center;line-height:0;flex:0 0 auto}.verified-badge svg{display:block;width:14px;height:14px;max-width:14px!important;min-width:14px!important}.post-link{display:block;color:inherit;text-decoration:none}.post-link:hover h3,.post-link:hover p{text-decoration:none}.post h3{font-size:18px;margin:0 0 8px}.post img:not(.source-avatar){display:block;width:100%;max-width:100%;height:auto;border-radius:16px;margin:10px 0;background:#0b1520}h1{font-size:34px;line-height:1.15;margin:0 0 12px;overflow-wrap:anywhere}h2{margin-top:30px}p,h1,h2,h3,strong,span,div{overflow-wrap:anywhere}.post p{max-width:100%;min-width:0}.post>p:not(.source):not(.meta):not(.notice){word-break:break-word}.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px;max-width:100%;min-width:0}ul{padding-left:20px}.links a{display:inline-block;margin:4px 8px 4px 0}.open{display:inline-block;background:#fff;color:#101c29;text-decoration:none;border-radius:999px;padding:11px 16px;font-weight:700}.secondary-open{display:inline-block;border:1px solid #31506b;color:#d7ecff;text-decoration:none;border-radius:999px;padding:10px 15px;font-weight:700}.notice{border-left:3px solid #6eb6ff;padding-left:12px}.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.kbd{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#d7ecff}.small{font-size:14px}.tag-row{margin:10px 0}.tag-row a{text-decoration:none}.telegram-link{color:#ffd9a6}@media(max-width:520px){html,body{overflow-x:hidden}main{width:100%;max-width:100vw;padding:18px 12px 40px}.brand{font-size:25px;margin-bottom:18px}.card,.post{border-radius:18px;padding:14px;margin:12px 0}h1{font-size:25px;line-height:1.14;letter-spacing:-.02em}.post h3{font-size:17px}.post img:not(.source-avatar){width:100%;height:auto}.actions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}.open,.secondary-open{width:100%;max-width:100%;box-sizing:border-box;text-align:center;padding:11px 12px;white-space:normal}.source-avatar{width:30px;height:30px}.source-title{max-width:100%;white-space:normal}.source{align-items:flex-start}.source-main span{word-break:break-word}.post>p:not(.source):not(.meta):not(.notice){font-size:15px;line-height:1.48}.notice{font-size:14px;line-height:1.45}.pill{max-width:100%}}
  .post .source-avatar{display:block!important;width:32px!important;height:32px!important;max-width:32px!important;min-width:32px!important;border-radius:50%!important;object-fit:cover!important;margin:0!important}.post .source{display:flex!important;align-items:center!important;gap:9px!important}.post .source-main{display:block!important;min-width:0!important;overflow:hidden!important}.post .source-title-row{display:flex!important;align-items:center!important;gap:5px!important;min-width:0!important;max-width:100%!important;overflow:hidden!important}.post .source-title{font-size:15px!important;line-height:1.2!important}.post .source-main span{display:block}@media(max-width:520px){.post .source-avatar{width:30px!important;height:30px!important;max-width:30px!important;min-width:30px!important}.post .source{align-items:flex-start!important}.post .source-title-row{display:flex!important}.post .source-main span{font-size:14px;line-height:1.25}.post .source-title{font-size:14px!important;white-space:normal!important}}.post,.card,.actions,.notice,.tag-row{max-width:100%;min-width:0}.post *{max-width:100%}.post .source-avatar{max-width:30px!important}</style>
</head>`;
}

function countryAlternates(pathBuilder: (countryCode: string) => string) {
  return Object.entries(SEO_LOCALE_META)
    .map(([, meta]) => {
      const href = `${SITE_ORIGIN}${pathBuilder(meta.countryCode)}`;
      return `<link rel="alternate" hreflang="${escapeHtml(meta.hreflang)}" href="${escapeHtml(href)}" />`;
    })
    .concat(`<link rel="alternate" hreflang="x-default" href="${SITE_ORIGIN}${pathBuilder("us")}" />`)
    .join("\n  ");
}

function renderPostSummary(post: IngestedPost) {
  const title = getPostTitle(post);
  const text = truncate(post.text, 260);
  const image = getFirstImage(post);
  const permalink = getPostPermalink(post);
  return `<article class="post">
      <a class="post-link" href="${escapeHtml(permalink)}">
        ${renderSourceHeader(post)}
        ${image ? `<img src="${escapeHtml(image)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ""}
        <h3>${escapeHtml(title)}</h3>
        ${text ? `<p>${escapeHtml(text)}</p>` : ""}
      </a>
      <p class="meta"><time datetime="${escapeHtml(isoDate(post.createdAt))}">${escapeHtml(formatDate(post.createdAt))}</time> · <a href="${escapeHtml(permalink)}">View post on margeleT</a></p>
    </article>`;
}

function tagTitle(tag: string) {
  return normalizeTag(tag)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function collectTopSources(posts: IngestedPost[]) {
  const map = new Map<string, { title: string; handle: string; count: number; countryCode: string }>();

  for (const post of posts) {
    const handle = post.source?.handle || "";
    if (!handle) continue;
    const key = handle.toLowerCase();
    const item = map.get(key) || {
      title: post.source?.title || handle,
      handle,
      count: 0,
      countryCode: normalizeCountryCode(post.sourceCountryCode),
    };
    item.count += 1;
    map.set(key, item);
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12);
}

function collectKeywords(posts: IngestedPost[]) {
  const stop = new Set([
    "https", "http", "www", "com", "t", "me", "the", "and", "for", "with", "you", "your", "это", "как", "что", "или", "для", "уже", "все", "всё", "при", "над", "под", "они", "она", "его", "это", "этот", "сейчас", "будет", "так", "uma", "para", "que", "com", "por", "как", "где", "когда"
  ]);
  const counts = new Map<string, number>();

  for (const post of posts) {
    const words = String(post.text || "")
      .toLowerCase()
      .replace(/https?:\/\/\S+/g, " ")
      .split(/[^\p{L}\p{N}_-]+/u)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && !stop.has(word));

    for (const word of words) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([word]) => word);
}

function renderCountryPage(params: {
  countryCode: string;
  posts: IngestedPost[];
  updatedAt: string;
  tag?: string | null;
}) {
  const { countryCode, posts, updatedAt, tag } = params;
  const countryName = getCountryName(countryCode);
  const meta = SEO_LOCALE_META[countryCode as CountryCode];
  const htmlLang = meta?.htmlLang || "en";
  const canonicalPath = tag ? getTagPath(countryCode, tag) : `/country/${countryCode}`;
  const tagLabel = tag ? tagTitle(tag) : null;
  const title = tagLabel
    ? `Fresh ${tagLabel} Telegram trends in ${countryName} | margeleT`
    : `Fresh Telegram trends in ${countryName} | margeleT`;
  const description = tagLabel
    ? `Fresh ${tagLabel} Telegram posts, sources, channels and live topics from ${countryName}. Updated automatically by margeleT trend snapshots.`
    : `Fresh Telegram posts, sources, channels and live topics from ${countryName}. Updated automatically by margeleT trend snapshots.`;
  const topSources = collectTopSources(posts);
  const keywords = collectKeywords(posts);
  const tags = Array.from(new Set(posts.flatMap(getPostTags))).slice(0, MAX_TAG_LINKS);

  const head = baseHead({
    lang: htmlLang,
    title,
    description,
    canonicalPath,
    updatedAt,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: `${SITE_ORIGIN}${canonicalPath}`,
      dateModified: updatedAt,
      isPartOf: { "@type": "WebSite", name: "margeleT", url: SITE_ORIGIN },
      hasPart: posts.slice(0, MAX_POSTS_PER_COUNTRY_PAGE).map((post) => {
        const image = getFirstImage(post);
        return {
          "@type": "SocialMediaPosting",
          headline: getPostTitle(post),
          text: getPostSchemaText(post),
          image: image ? [image] : [`${SITE_ORIGIN}/icon-512.png`],
          url: `${SITE_ORIGIN}${getPostPermalink(post)}`,
          mainEntityOfPage: `${SITE_ORIGIN}${getPostPermalink(post)}`,
          datePublished: isoDate(post.createdAt),
          author: getSourceAuthorSchema(post),
          publisher: {
            "@type": "Organization",
            name: "margeleT",
            url: SITE_ORIGIN,
            logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/icon-512.png` },
          },
        };
      }),
    },
    alternates: tag
      ? ""
      : countryAlternates((code) => `/country/${code}`),
  });

  return `${head}
<body>
  <main>
    <div class="brand"><a href="/" style="color:inherit;text-decoration:none">margeleT</a></div>
    <section class="card">
      <p class="muted">Fresh Telegram trend snapshot · Updated <time datetime="${escapeHtml(updatedAt)}">${escapeHtml(formatDate(updatedAt))}</time></p>
      <h1>${escapeHtml(tagLabel ? `Fresh ${tagLabel} Telegram trends in ${countryName}` : `Fresh Telegram trends in ${countryName}`)}</h1>
      <p>${escapeHtml(description)}</p>
      <a class="open" href="${escapeHtml(getLiveFeedPath(countryCode))}">Open live margeleT feed</a>
      ${tag ? `<a class="secondary-open" href="/country/${escapeHtml(countryCode)}">All ${escapeHtml(countryName)} trends</a>` : ""}
    </section>

    <section>
      <h2>Fresh posts</h2>
      ${posts.slice(0, tag ? MAX_POSTS_PER_TAG_PAGE : MAX_POSTS_PER_COUNTRY_PAGE).map(renderPostSummary).join("\n") || `<p class="muted">No fresh posts in this snapshot yet.</p>`}
    </section>

    <section class="two">
      <div class="card">
        <h2>Top Telegram sources</h2>
        <ul>${topSources.map((source) => `<li><a href="${escapeHtml(getSourcePath(source.handle))}">${escapeHtml(source.title)}</a> <span class="muted">${escapeHtml(String(source.count))} posts</span></li>`).join("\n")}</ul>
      </div>
      <div class="card">
        <h2>Current keywords</h2>
        <ul>${keywords.map((word) => `<li>${escapeHtml(word)}</li>`).join("\n")}</ul>
      </div>
    </section>

    <section class="card links">
      <h2>More margeleT trend pages</h2>
      ${tags.map((item) => `<a href="${escapeHtml(getTagPath(countryCode, item))}">${escapeHtml(countryCode)} / ${escapeHtml(item.replace(/_/g, " / "))}</a>`).join("\n")}
    </section>
  </main>
</body>
</html>
`;
}

function renderPostPage(params: {
  post: IngestedPost;
  relatedPosts: IngestedPost[];
}) {
  const { post, relatedPosts } = params;
  const countryCode = normalizeCountryCode(post.sourceCountryCode);
  const countryName = getCountryName(countryCode);
  const title = getSeoPostTitle(post);
  const headline = getSeoPostHeadline(post);
  const sourceTitle = getSourceTitle(post);
  const handle = post.source?.handle || "";
  const description = getSeoPostDescription(post);
  const image = getFirstImage(post);
  const canonicalPath = getPostPermalink(post);
  const tags = getPostTags(post);

  const head = baseHead({
    lang: SEO_LOCALE_META[countryCode as CountryCode]?.htmlLang || "en",
    title,
    description,
    canonicalPath,
    updatedAt: post.createdAt,
    image,
    keywords: getKeywordsContent(post),
    ogType: "article",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": `${SITE_ORIGIN}/#website`,
          name: "margeleT",
          url: SITE_ORIGIN,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "margeleT", item: SITE_ORIGIN },
            { "@type": "ListItem", position: 2, name: countryName, item: `${SITE_ORIGIN}${getLiveFeedPath(countryCode)}` },
            { "@type": "ListItem", position: 3, name: sourceTitle, item: handle ? `${SITE_ORIGIN}${getSourcePath(handle)}` : SITE_ORIGIN },
          ],
        },
        {
          "@type": ["Article", "SocialMediaPosting"],
          headline,
          description,
          articleBody: truncate(post.text, 1200),
          text: getPostSchemaText(post),
          keywords: getKeywordsContent(post),
          url: `${SITE_ORIGIN}${canonicalPath}`,
          mainEntityOfPage: `${SITE_ORIGIN}${canonicalPath}`,
          datePublished: isoDate(post.createdAt),
          dateModified: isoDate(post.mediaRefreshedAt || post.createdAt),
          image: image ? [image] : [`${SITE_ORIGIN}/icon-512.png`],
          video: getPostVideoSchema(post, image),
          inLanguage: SEO_LOCALE_META[countryCode as CountryCode]?.htmlLang || "en",
          about: tags.map((tag) => ({ "@type": "Thing", name: tag.replace(/_/g, " ") })),
          author: getSourceAuthorSchema(post),
          publisher: {
            "@type": "Organization",
            name: "margeleT",
            url: SITE_ORIGIN,
            logo: { "@type": "ImageObject", url: `${SITE_ORIGIN}/icon-512.png` },
          },
          isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
          sameAs: post.postUrl || undefined,
        },
      ],
    },
  });

  const postText = String(post.text || "").trim();
  const media = Array.isArray(post.media) ? post.media : [];
  const mediaHtml = media
    .slice(0, 4)
    .map((item) => {
      if (item.kind === "image" && item.url) {
        return `<img src="${escapeHtml(item.url)}" alt="" loading="lazy" referrerpolicy="no-referrer" />`;
      }

      if (item.kind === "video") {
        const poster = item.poster || image;
        return `<div class="card small"><strong>Video in original post</strong>${poster ? `<img src="${escapeHtml(poster)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ""}<p class="muted">Video media is loaded in the live margeleT feed or in the original Telegram post.</p></div>`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  return `${head}
<body>
  <main>
    <div class="brand"><a href="/" style="color:inherit;text-decoration:none">margeleT</a></div>
    <article class="post">
      ${renderSourceHeader(post)}
      <h1>${escapeHtml(headline)}</h1>
      ${postText ? `<p>${escapeHtml(postText)}</p>` : `<p class="muted">This Telegram post snapshot has media or a short update without extracted text.</p>`}
      ${mediaHtml}
      <p class="meta"><time datetime="${escapeHtml(isoDate(post.createdAt))}">${escapeHtml(formatDate(post.createdAt))}</time> · ${escapeHtml(countryName)}</p>
      <div class="tag-row">
        ${tags.map((tag) => `<a class="pill" href="${escapeHtml(getTagPath(countryCode, tag))}">${escapeHtml(tag.replace(/_/g, " / "))}</a>`).join("\n")}
      </div>
      <p class="notice muted">Fresh margeleT snapshot · ${escapeHtml(countryName)} · ${escapeHtml(sourceTitle)}${tags.length ? ` · ${escapeHtml(tags.slice(0, 3).map((tag) => tag.replace(/_/g, " / ")).join(" · "))}` : ""}. This page keeps context and source links for search engines and AI assistants.</p>
      <div class="actions">
        <a class="open" href="${escapeHtml(getLiveFeedPath(countryCode))}">Open live margeleT feed</a>
        ${handle ? `<a class="secondary-open" href="${escapeHtml(getSourcePostPath(post))}">Open this post in margeleT feed</a>` : ""}
        ${post.postUrl ? `<a class="secondary-open telegram-link" href="${escapeHtml(post.postUrl)}" rel="nofollow noopener" target="_blank">Open original Telegram post</a>` : ""}
      </div>
    </article>

    <section>
      <h2>Related margeleT posts</h2>
      ${relatedPosts.slice(0, MAX_RELATED_POSTS).map(renderPostSummary).join("\n") || `<p class="muted">No related posts in the current snapshot.</p>`}
    </section>
  </main>
</body>
</html>
`;
}

async function writeHtml(relativePath: string, html: string) {
  const fullPath = path.join(PUBLIC_DIR, relativePath, "index.html");
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, html, "utf8");
}

function sitemapXml(entries: UrlEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}${entry.changefreq ? `
    <changefreq>${entry.changefreq}</changefreq>` : ""}${entry.priority ? `
    <priority>${entry.priority}</priority>` : ""}
  </url>`)
  .join("\n")}
</urlset>
`;
}

function sitemapIndex(entries: UrlEntry[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => `  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `
    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ""}
  </sitemap>`)
  .join("\n")}
</sitemapindex>
`;
}

async function writeSitemap(name: string, entries: UrlEntry[]) {
  await mkdir(SITEMAPS_DIR, { recursive: true });
  await writeFile(path.join(SITEMAPS_DIR, name), sitemapXml(entries), "utf8");
}

function getRelatedPosts(post: IngestedPost, posts: IngestedPost[]) {
  const tags = new Set(getPostTags(post));
  const handle = String(post.source?.handle || "").toLowerCase();

  return posts
    .filter((item) => item.id !== post.id)
    .map((item) => {
      let score = 0;
      if (String(item.source?.handle || "").toLowerCase() === handle) score += 5;
      for (const tag of getPostTags(item)) {
        if (tags.has(tag)) score += 2;
      }
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (Date.parse(b.item.createdAt || "") || 0) - (Date.parse(a.item.createdAt || "") || 0))
    .map(({ item }) => item);
}

async function main() {
  await mkdir(PUBLIC_DIR, { recursive: true });

  // margeleT SEO is a fresh snapshot, not an infinite archive.
  // Rebuild generated static pages from current feed data on every run.
  await rm(COUNTRY_DIR, { recursive: true, force: true });
  await rm(POST_DIR, { recursive: true, force: true });
  await rm(SITEMAPS_DIR, { recursive: true, force: true });

  await mkdir(COUNTRY_DIR, { recursive: true });
  await mkdir(POST_DIR, { recursive: true });
  await mkdir(SITEMAPS_DIR, { recursive: true });

  const index = await readJson<FeedIndexFile>(path.join("data", "feeds", "index.json"));
  const countryCodes = Object.keys(index?.countries || {}).sort();
  const allPostsByCountry = new Map<string, IngestedPost[]>();
  const updatedByCountry = new Map<string, string>();
  const allPosts: IngestedPost[] = [];

  for (const countryCode of countryCodes) {
    const { posts, updatedAt } = await readCountryPosts(countryCode);
    const cleanPosts = sortPosts(uniquePosts(posts)).filter((post) => post && typeof post.id === "number");
    if (!cleanPosts.length) continue;
    allPostsByCountry.set(countryCode, cleanPosts);
    updatedByCountry.set(countryCode, updatedAt);
    allPosts.push(...cleanPosts);
  }

  const uniqueAllPosts = uniquePosts(allPosts);
  const countrySitemap: UrlEntry[] = [];
  const sitemapEntries: UrlEntry[] = [];
  const sitemapFiles: UrlEntry[] = [];

  for (const [countryCode, posts] of allPostsByCountry.entries()) {
    const updatedAt = updatedByCountry.get(countryCode) || new Date().toISOString();
    const countryPath = `/country/${countryCode}`;
    await writeHtml(`country/${countryCode}`, renderCountryPage({ countryCode, posts, updatedAt }));
    countrySitemap.push({ loc: `${SITE_ORIGIN}${countryPath}`, lastmod: updatedAt, changefreq: "daily", priority: "0.9" });

    const byTag = new Map<string, IngestedPost[]>();
    for (const post of posts) {
      for (const tag of getPostTags(post)) {
        const list = byTag.get(tag) || [];
        list.push(post);
        byTag.set(tag, list);
      }
    }

    const tagSitemap: UrlEntry[] = [];
    for (const [tag, taggedPosts] of Array.from(byTag.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      if (!taggedPosts.length) continue;
      const tagPath = getTagPath(countryCode, tag);
      await writeHtml(tagPath.replace(/^\//, ""), renderCountryPage({ countryCode, posts: sortPosts(taggedPosts), updatedAt, tag }));
      tagSitemap.push({ loc: `${SITE_ORIGIN}${tagPath}`, lastmod: updatedAt, changefreq: "daily", priority: "0.72" });
    }

    const tagSitemapName = `tags-${countryCode}.xml`;
    await writeSitemap(tagSitemapName, tagSitemap);
    sitemapFiles.push({ loc: `${SITE_ORIGIN}/sitemaps/${tagSitemapName}`, lastmod: updatedAt });

    const postSitemap: UrlEntry[] = [];
    for (const post of posts) {
      await writeHtml(getPostPermalink(post).replace(/^\//, ""), renderPostPage({ post, relatedPosts: getRelatedPosts(post, posts) }));
      postSitemap.push({ loc: `${SITE_ORIGIN}${getPostPermalink(post)}`, lastmod: isoDate(post.mediaRefreshedAt || post.createdAt), changefreq: "weekly", priority: "0.62" });
    }

    const postSitemapName = `posts-${countryCode}.xml`;
    await writeSitemap(postSitemapName, postSitemap);
    sitemapFiles.push({ loc: `${SITE_ORIGIN}/sitemaps/${postSitemapName}`, lastmod: updatedAt });
  }

  await writeSitemap("countries.xml", countrySitemap);
  sitemapFiles.unshift({ loc: `${SITE_ORIGIN}/sitemaps/countries.xml`, lastmod: new Date().toISOString() });

  sitemapEntries.push({ loc: `${SITE_ORIGIN}/`, lastmod: new Date().toISOString(), changefreq: "daily", priority: "1.0" });
  sitemapEntries.push(...countrySitemap);
  for (const post of uniqueAllPosts.slice(0, 5000)) {
    sitemapEntries.push({ loc: `${SITE_ORIGIN}${getPostPermalink(post)}`, lastmod: isoDate(post.mediaRefreshedAt || post.createdAt), changefreq: "weekly", priority: "0.62" });
  }

  await writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapIndex(sitemapFiles), "utf8");
  await writeSitemap("main.xml", sitemapEntries);

  sitemapFiles.push({ loc: `${SITE_ORIGIN}/sitemaps/main.xml`, lastmod: new Date().toISOString() });
  await writeFile(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapIndex(sitemapFiles), "utf8");

  

  console.log("SEO snapshot rebuilt", {
    countries: allPostsByCountry.size,
    posts: uniqueAllPosts.length,
    sitemaps: sitemapFiles.length,
    postPermalinks: true,
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
