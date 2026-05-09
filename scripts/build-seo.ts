import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_LOCALES, type SiteLocale } from "../src/lib/locales";
import { SITE_TAG_GROUPS, type SiteTag, type SiteTagGroup } from "../src/lib/tags";

type FeedSource = {
  title?: string;
  handle?: string;
  verified?: boolean;
};

type FeedPost = {
  id?: string | number;
  postUrl?: string;
  source?: FeedSource;
  sourceId?: string;
  sourceCountryCode?: string;
  contentType?: string;
  text?: string;
  createdAt?: string;
  tag?: string;
  tags?: string[];
};

type FeedChunkIndex = {
  countryCode?: string;
  updatedAt?: string;
  totalPosts?: number;
  chunks?: number | Array<{ id: number; path: string; posts: number }>;
  items?: FeedPost[];
};

type SeoPage = {
  country: SiteLocale;
  countryName: string;
  kind: "country" | "parent-tag" | "child-tag";
  urlPath: string;
  filePath: string;
  title: string;
  description: string;
  h1: string;
  updatedAt: string;
  parentTag?: SiteTagGroup;
  childTag?: SiteTag;
  posts: FeedPost[];
  topSources: Array<{ title: string; handle: string; count: number }>;
  keywords: Array<{ value: string; count: number }>;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const FEED_DIR_CANDIDATES = [
  path.join(PUBLIC_DIR, "feeds"),
  path.join(ROOT, "data", "feeds"),
  path.join(ROOT, "dist", "feeds"),
];
const COUNTRY_DIR = path.join(PUBLIC_DIR, "country");
const SEO_DIR = path.join(PUBLIC_DIR, "seo");
const SITEMAPS_DIR = path.join(PUBLIC_DIR, "sitemaps");

const SITE_ORIGIN = process.env.MARGELET_SITE_ORIGIN ?? "https://www.margelet.space";
const MAX_POSTS_PER_PAGE = 50;
const MAX_KEYWORDS = 18;
const MAX_TOP_SOURCES = 12;

const SEO_LOCALE_META: Record<SiteLocale, { htmlLang: string; hreflang: string; countryCode: string }> = {
  ru: { htmlLang: "ru", hreflang: "ru-RU", countryCode: "RU" },
  uk: { htmlLang: "uk", hreflang: "uk-UA", countryCode: "UA" },
  en: { htmlLang: "en", hreflang: "en-US", countryCode: "US" },
  in: { htmlLang: "hi", hreflang: "hi-IN", countryCode: "IN" },
  fa: { htmlLang: "fa", hreflang: "fa-IR", countryCode: "IR" },
  tr: { htmlLang: "tr", hreflang: "tr-TR", countryCode: "TR" },
  "pt-br": { htmlLang: "pt-BR", hreflang: "pt-BR", countryCode: "BR" },
  kk: { htmlLang: "kk", hreflang: "kk-KZ", countryCode: "KZ" },
  uz: { htmlLang: "uz", hreflang: "uz-UZ", countryCode: "UZ" },
  ae: { htmlLang: "ar", hreflang: "ar-AE", countryCode: "AE" },
  eg: { htmlLang: "ar", hreflang: "ar-EG", countryCode: "EG" },
  pk: { htmlLang: "ur", hreflang: "ur-PK", countryCode: "PK" },
  id: { htmlLang: "id", hreflang: "id-ID", countryCode: "ID" },
  mx: { htmlLang: "es", hreflang: "es-MX", countryCode: "MX" },
  sa: { htmlLang: "ar", hreflang: "ar-SA", countryCode: "SA" },
  es: { htmlLang: "es", hreflang: "es-ES", countryCode: "ES" },
  it: { htmlLang: "it", hreflang: "it-IT", countryCode: "IT" },
  fr: { htmlLang: "fr", hreflang: "fr-FR", countryCode: "FR" },
  de: { htmlLang: "de", hreflang: "de-DE", countryCode: "DE" },
  ar: { htmlLang: "es", hreflang: "es-AR", countryCode: "AR" },
  co: { htmlLang: "es", hreflang: "es-CO", countryCode: "CO" },
  za: { htmlLang: "en", hreflang: "en-ZA", countryCode: "ZA" },
  ng: { htmlLang: "en", hreflang: "en-NG", countryCode: "NG" },
  zh: { htmlLang: "zh", hreflang: "zh-CN", countryCode: "CN" },
  ms: { htmlLang: "ms", hreflang: "ms-MY", countryCode: "MY" },
};

function getSeoLocaleMeta(locale: SiteLocale) {
  return SEO_LOCALE_META[locale] ?? { htmlLang: locale, hreflang: locale, countryCode: locale.toUpperCase() };
}

const WORD_STOPLIST = new Set([
  "the", "and", "for", "from", "with", "this", "that", "you", "your", "are", "was", "were", "will", "have", "has", "had",
  "или", "это", "как", "что", "для", "при", "над", "под", "его", "она", "они", "уже", "ещё", "еще", "будет", "можно", "после", "сейчас", "если", "чтобы",
  "новости", "читать", "подробнее", "telegram", "телеграм", "канал", "канала", "канале", "пост", "поста",
]);

function readJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function cleanDir(dir: string) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(dir, { recursive: true });
}

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function stripEmoji(label: string) {
  return label.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();
}

function getTagName(tag: SiteTag, locale: SiteLocale = "en") {
  return stripEmoji(tag.labels[locale] ?? tag.labels.en ?? tag.value);
}

function getCountryName(locale: SiteLocale) {
  return SITE_LOCALES.find((item) => item.code === locale)?.label ?? locale.toUpperCase();
}

function slugForChild(parent: SiteTagGroup, child: SiteTag) {
  const prefix = `${parent.value}_`;
  return child.value.startsWith(prefix) ? child.value.slice(prefix.length) : child.value;
}

function normalizeText(text: string) {
  return text.replace(/https?:\/\/\S+/g, " ").replace(/[\n\r\t]+/g, " ").trim();
}

function excerpt(text: string, max = 220) {
  const normalized = normalizeText(text);
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trim()}…`;
}

function postMatchesTag(post: FeedPost, tagValue: string, group?: SiteTagGroup) {
  const values = new Set<string>();
  if (post.tag) values.add(post.tag);
  for (const tag of post.tags ?? []) values.add(tag);

  if (values.has(tagValue)) return true;
  if (group?.value === tagValue) {
    return group.children.some((child) => values.has(child.value));
  }
  return false;
}

type CountryFeedEntry = {
  country: SiteLocale;
  feedsDir: string;
  indexPath: string;
};

function discoverCountryFeeds() {
  const entries = new Map<string, CountryFeedEntry>();

  for (const feedsDir of FEED_DIR_CANDIDATES) {
    if (!existsSync(feedsDir)) continue;

    for (const name of readdirSync(feedsDir)) {
      if (!name.endsWith(".json") || name === "index.json") continue;

      const country = name.replace(/\.json$/, "") as SiteLocale;
      if (!SITE_LOCALES.some((item) => item.code === country)) continue;
      if (entries.has(country)) continue;

      entries.set(country, {
        country,
        feedsDir,
        indexPath: path.join(feedsDir, name),
      });
    }
  }

  return Array.from(entries.values()).sort((a, b) => {
    const aIndex = SITE_LOCALES.findIndex((item) => item.code === a.country);
    const bIndex = SITE_LOCALES.findIndex((item) => item.code === b.country);
    return aIndex - bIndex;
  });
}

function resolveChunkPath(feedsDir: string, chunkPath: string) {
  const clean = chunkPath.replace(/^\//, "");
  const afterFeeds = clean.startsWith("feeds/") ? clean.slice("feeds/".length) : clean;
  return path.join(feedsDir, afterFeeds);
}

function isFeedPostArray(value: unknown): value is FeedPost[] {
  return Array.isArray(value);
}

function normalizePostsPayload(payload: unknown): FeedPost[] {
  if (isFeedPostArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const objectPayload = payload as { posts?: unknown; items?: unknown };
    if (isFeedPostArray(objectPayload.posts)) return objectPayload.posts;
    if (isFeedPostArray(objectPayload.items)) return objectPayload.items;
  }
  return [];
}

function loadCountryPosts(entry: CountryFeedEntry): FeedPost[] {
  const index = readJson<FeedChunkIndex | { posts?: FeedPost[] } | FeedPost[]>(entry.indexPath);
  if (!index) return [];

  const directPosts = normalizePostsPayload(index);
  if (directPosts.length > 0) {
    return directPosts.sort(sortPostsNewestFirst);
  }

  const chunkIndex = index as FeedChunkIndex;
  const posts: FeedPost[] = [];
  const chunks = Array.isArray(chunkIndex.chunks) ? chunkIndex.chunks : [];

  for (const chunk of chunks) {
    const localChunkPath = resolveChunkPath(entry.feedsDir, chunk.path);
    posts.push(...normalizePostsPayload(readJson<unknown>(localChunkPath)));
  }

  return posts.sort(sortPostsNewestFirst);
}

function sortPostsNewestFirst(a: FeedPost, b: FeedPost) {
  const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
  const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
  return bTime - aTime;
}

function topSources(posts: FeedPost[]) {
  const map = new Map<string, { title: string; handle: string; count: number }>();
  for (const post of posts) {
    const title = post.source?.title?.trim() || post.source?.handle?.trim() || "Telegram source";
    const handle = post.source?.handle?.trim() || post.sourceId || title;
    const key = handle.toLowerCase();
    const current = map.get(key) ?? { title, handle, count: 0 };
    current.count += 1;
    map.set(key, current);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, MAX_TOP_SOURCES);
}

function extractKeywords(posts: FeedPost[]) {
  const map = new Map<string, number>();
  for (const post of posts.slice(0, MAX_POSTS_PER_PAGE)) {
    const words = normalizeText(post.text ?? "")
      .toLowerCase()
      .match(/[\p{L}\p{N}][\p{L}\p{N}-]{3,}/gu) ?? [];

    for (const word of words) {
      if (WORD_STOPLIST.has(word)) continue;
      map.set(word, (map.get(word) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, MAX_KEYWORDS);
}

function latestUpdatedAt(posts: FeedPost[]) {
  const newest = posts.reduce((max, post) => {
    const time = post.createdAt ? Date.parse(post.createdAt) : 0;
    return Math.max(max, Number.isFinite(time) ? time : 0);
  }, 0);
  return new Date(newest || Date.now()).toISOString();
}

function buildPageHtml(page: SeoPage, siblingLinks: string[]) {
  const canonical = `${SITE_ORIGIN}${page.urlPath}`;
  const liveUrl = page.parentTag
    ? `/${page.country}?tag=${encodeURIComponent(page.childTag?.value ?? page.parentTag.value)}`
    : `/${page.country}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.title,
    description: page.description,
    url: canonical,
    dateModified: page.updatedAt,
    isPartOf: { "@type": "WebSite", name: "margeleT", url: SITE_ORIGIN },
  };

  const postsHtml = page.posts.slice(0, MAX_POSTS_PER_PAGE).map((post) => {
    const sourceTitle = post.source?.title || post.source?.handle || "Telegram source";
    const handle = post.source?.handle ? `@${post.source.handle}` : "Telegram";
    const text = excerpt(post.text ?? "", 260);
    const created = post.createdAt ? new Date(post.createdAt).toISOString() : page.updatedAt;
    const postUrl = post.postUrl || "https://t.me/";
    return `<article class="post">
      <p class="source"><strong>${escapeHtml(sourceTitle)}</strong> <span>${escapeHtml(handle)}</span></p>
      <p>${escapeHtml(text)}</p>
      <p class="meta"><time datetime="${escapeHtml(created)}">${escapeHtml(new Date(created).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }))}</time> · <a href="${escapeHtml(postUrl)}" rel="nofollow noopener">Open original Telegram post</a></p>
    </article>`;
  }).join("\n");

  const topSourcesHtml = page.topSources.map((source) => {
    const href = source.handle.startsWith("@") ? `https://t.me/${source.handle.slice(1)}` : `https://t.me/${source.handle}`;
    return `<li><a href="${escapeHtml(href)}" rel="nofollow noopener">${escapeHtml(source.title)}</a> <span>${escapeHtml(source.count)} posts</span></li>`;
  }).join("\n");

  const keywordsHtml = page.keywords.map((keyword) => `<li>${escapeHtml(keyword.value)}</li>`).join("\n");
  const linksHtml = siblingLinks.map((href) => `<a href="${escapeHtml(href)}">${escapeHtml(href.replace(/^\/country\//, ""))}</a>`).join("\n");
  const hreflangLinks = [
    ...SITE_LOCALES.map((locale) => {
      const localizedUrlPath = page.urlPath.replace(/^\/country\/[^/]+/, `/country/${locale.code}`);
      const meta = getSeoLocaleMeta(locale.code);
      return `<link rel="alternate" hreflang="${escapeHtml(meta.hreflang)}" href="${escapeHtml(SITE_ORIGIN + localizedUrlPath)}" />`;
    }),
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(SITE_ORIGIN + "/country/en")}" />`,
  ].join("\n");
  const localeMeta = getSeoLocaleMeta(page.country);
  const ogImage = `${SITE_ORIGIN}/hero.webp`;

  return `<!doctype html>
<html lang="${escapeHtml(localeMeta.htmlLang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(page.title)}</title>
  <meta name="description" content="${escapeHtml(page.description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  ${hreflangLinks}
  <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="margeleT" />
  <meta property="og:title" content="${escapeHtml(page.title)}" />
  <meta property="og:description" content="${escapeHtml(page.description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:locale" content="${escapeHtml(localeMeta.hreflang.replace("-", "_"))}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(page.title)}" />
  <meta name="twitter:description" content="${escapeHtml(page.description)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body{margin:0;background:#101c29;color:#f7fbff;font-family:Inter,Arial,sans-serif;line-height:1.55}main{max-width:920px;margin:0 auto;padding:32px 18px 56px}.brand{font-weight:800;font-size:28px;margin-bottom:26px}.card,.post{background:#172635;border:1px solid #294158;border-radius:22px;padding:18px;margin:14px 0}.muted,.meta,.source span{color:#a9bed2}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}a{color:#b9dcff}.pill{display:inline-block;border:1px solid #31506b;border-radius:999px;padding:7px 11px;margin:4px}.source{margin-top:0}h1{font-size:34px;line-height:1.15;margin:0 0 12px}h2{margin-top:30px}ul{padding-left:20px}.links a{display:inline-block;margin:4px 8px 4px 0}.open{display:inline-block;margin-top:14px;background:#fff;color:#101c29;text-decoration:none;border-radius:999px;padding:11px 16px;font-weight:700}
  </style>
</head>
<body>
  <main>
    <div class="brand">margeleT</div>
    <section class="card">
      <p class="muted">Fresh Telegram trend snapshot · Updated <time datetime="${escapeHtml(page.updatedAt)}">${escapeHtml(new Date(page.updatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short" }))}</time></p>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <a class="open" href="${escapeHtml(liveUrl)}">Open live margeleT feed</a>
    </section>

    <section>
      <h2>Fresh posts</h2>
      ${postsHtml || `<p class="muted">No fresh posts in this trend snapshot yet.</p>`}
    </section>

    <section class="grid">
      <div class="card">
        <h2>Top Telegram sources</h2>
        <ul>${topSourcesHtml || `<li>No sources yet</li>`}</ul>
      </div>
      <div class="card">
        <h2>Current keywords</h2>
        <ul>${keywordsHtml || `<li>Fresh Telegram trends</li>`}</ul>
      </div>
    </section>

    <section class="card links">
      <h2>More margeleT trend pages</h2>
      ${linksHtml}
    </section>
  </main>
</body>
</html>`;
}

function writeJson(filePath: string, value: unknown) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeHtml(filePath: string, html: string) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, html, "utf8");
}

function sitemapXml(urls: Array<{ loc: string; lastmod: string }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escapeHtml(SITE_ORIGIN + url.loc)}</loc><lastmod>${escapeHtml(url.lastmod)}</lastmod><changefreq>hourly</changefreq><priority>0.7</priority></url>`).join("\n")}\n</urlset>\n`;
}

function sitemapIndexXml(files: string[]) {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${files.map((file) => `  <sitemap><loc>${escapeHtml(SITE_ORIGIN + file)}</loc><lastmod>${escapeHtml(now)}</lastmod></sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

function main() {
  const countryFeedEntries = discoverCountryFeeds();
  if (countryFeedEntries.length === 0) {
    throw new Error(`No country feeds found in: ${FEED_DIR_CANDIDATES.join(", ")}`);
  }

  cleanDir(COUNTRY_DIR);
  cleanDir(SEO_DIR);
  cleanDir(SITEMAPS_DIR);

  const allUrls: Array<{ loc: string; lastmod: string }> = [];
  const sitemapFiles: string[] = [];

  for (const feedEntry of countryFeedEntries) {
    const country = feedEntry.country;
    const countryName = getCountryName(country);
    const allPosts = loadCountryPosts(feedEntry);
    const updatedAt = latestUpdatedAt(allPosts);
    const countryUrls: Array<{ loc: string; lastmod: string }> = [];
    const siblingLinks = [`/country/${country}`];

    for (const group of SITE_TAG_GROUPS.slice(0, 12)) {
      siblingLinks.push(`/country/${country}/tag/${group.value}`);
    }

    const countryPage: SeoPage = {
      country,
      countryName,
      kind: "country",
      urlPath: `/country/${country}`,
      filePath: path.join(COUNTRY_DIR, country, "index.html"),
      title: `Fresh Telegram trends in ${countryName} | margeleT`,
      description: `Fresh Telegram posts, sources, channels and live topics from ${countryName}. Updated automatically by margeleT trend snapshots.`,
      h1: `Fresh Telegram trends in ${countryName}`,
      updatedAt,
      posts: allPosts.slice(0, MAX_POSTS_PER_PAGE),
      topSources: topSources(allPosts),
      keywords: extractKeywords(allPosts),
    };

    writeHtml(countryPage.filePath, buildPageHtml(countryPage, siblingLinks));
    writeJson(path.join(SEO_DIR, country, "index.json"), countryPage);
    countryUrls.push({ loc: countryPage.urlPath, lastmod: countryPage.updatedAt });

    for (const group of SITE_TAG_GROUPS) {
      const parentPosts = allPosts.filter((post) => postMatchesTag(post, group.value, group));
      const parentName = getTagName(group, country);
      const parentPage: SeoPage = {
        country,
        countryName,
        kind: "parent-tag",
        urlPath: `/country/${country}/tag/${group.value}`,
        filePath: path.join(COUNTRY_DIR, country, "tag", group.value, "index.html"),
        title: `${parentName} Telegram trends in ${countryName} | margeleT`,
        description: `Fresh ${parentName} Telegram posts, channels, keywords and sources from ${countryName}. Updated automatically by margeleT.`,
        h1: `${parentName} Telegram trends in ${countryName}`,
        updatedAt: latestUpdatedAt(parentPosts),
        parentTag: group,
        posts: parentPosts.slice(0, MAX_POSTS_PER_PAGE),
        topSources: topSources(parentPosts),
        keywords: extractKeywords(parentPosts),
      };

      const parentSiblingLinks = [countryPage.urlPath, ...group.children.map((child) => `/country/${country}/tag/${group.value}/${slugForChild(group, child)}`)];
      writeHtml(parentPage.filePath, buildPageHtml(parentPage, parentSiblingLinks));
      writeJson(path.join(SEO_DIR, country, `${group.value}.json`), parentPage);
      countryUrls.push({ loc: parentPage.urlPath, lastmod: parentPage.updatedAt });

      for (const child of group.children) {
        const childSlug = slugForChild(group, child);
        const childPosts = allPosts.filter((post) => postMatchesTag(post, child.value));
        const childName = getTagName(child, country);
        const childPage: SeoPage = {
          country,
          countryName,
          kind: "child-tag",
          urlPath: `/country/${country}/tag/${group.value}/${childSlug}`,
          filePath: path.join(COUNTRY_DIR, country, "tag", group.value, childSlug, "index.html"),
          title: `${childName} Telegram trends in ${countryName} | margeleT`,
          description: `Fresh ${childName} Telegram posts, sources and keywords from ${countryName}. Updated automatically by margeleT trend snapshots.`,
          h1: `${childName} Telegram trends in ${countryName}`,
          updatedAt: latestUpdatedAt(childPosts),
          parentTag: group,
          childTag: child,
          posts: childPosts.slice(0, MAX_POSTS_PER_PAGE),
          topSources: topSources(childPosts),
          keywords: extractKeywords(childPosts),
        };

        writeHtml(childPage.filePath, buildPageHtml(childPage, [countryPage.urlPath, parentPage.urlPath]));
        writeJson(path.join(SEO_DIR, country, group.value, `${childSlug}.json`), childPage);
        countryUrls.push({ loc: childPage.urlPath, lastmod: childPage.updatedAt });
      }
    }

    const sitemapPath = `/sitemaps/tags-${country}.xml`;
    writeFileSync(path.join(PUBLIC_DIR, sitemapPath), sitemapXml(countryUrls), "utf8");
    sitemapFiles.push(sitemapPath);
    allUrls.push(...countryUrls);
  }

  writeFileSync(path.join(SITEMAPS_DIR, "countries.xml"), sitemapXml(allUrls.filter((url) => /^\/country\/[^/]+$/.test(url.loc))), "utf8");
  writeFileSync(path.join(PUBLIC_DIR, "sitemap.xml"), sitemapIndexXml(["/sitemaps/countries.xml", ...sitemapFiles]), "utf8");

  console.log(`SEO built: ${allUrls.length} stable pages for ${countryFeedEntries.length} countries`);
}

main();
