import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
const GITHUB_OWNER = String(process.env.GITHUB_OWNER || "jeep-jim").trim();
const GITHUB_REPO = String(process.env.GITHUB_REPO || "margelet").trim();
const GITHUB_BRANCH = String(process.env.GITHUB_BRANCH || "main").trim();

const SOURCES_PATH = "data/sources.json";
const LEGACY_FEED_PATH = "data/feed.json";
const LEGACY_PUBLIC_FEED_PATH = "public/feed.json";
const FEEDS_INDEX_PATH = "data/feeds/index.json";
const PUBLIC_FEEDS_INDEX_PATH = "public/feeds/index.json";
const FEEDS_ROOT = "data/feeds";
const PUBLIC_FEEDS_ROOT = "public/feeds";
const FEED_STORAGE_VERSION = 2;
const FEED_CHUNK_POST_LIMIT = Math.max(
  50,
  Number(process.env.MARGELET_FEED_CHUNK_POST_LIMIT || 250)
);
const DEFAULT_FEED_COUNTRY = String(
  process.env.MARGELET_DEFAULT_FEED_COUNTRY || "en"
)
  .trim()
  .toLowerCase();

export type FeedFile<T = unknown> = {
  updatedAt: string;
  posts: T[];
};

export type SourcesFile<T = unknown> = {
  updatedAt: string;
  sources: T[];
};

export type FeedCountryChunkMeta = {
  id: number;
  path: string;
  posts: number;
};

export type FeedCountrySingleFile<T = unknown> = {
  version: number;
  countryCode: string;
  updatedAt: string;
  mode: "single";
  totalPosts: number;
  items: T[];
};

export type FeedCountryChunkedFile = {
  version: number;
  countryCode: string;
  updatedAt: string;
  mode: "chunked";
  totalPosts: number;
  chunks: FeedCountryChunkMeta[];
};

export type FeedCountryFile<T = unknown> = FeedCountrySingleFile<T> | FeedCountryChunkedFile;

export type FeedChunkFile<T = unknown> = {
  version: number;
  countryCode: string;
  chunkId: number;
  updatedAt: string;
  items: T[];
};

export type FeedIndexCountryEntry = {
  code: string;
  updatedAt: string;
  totalPosts: number;
  chunkCount: number;
  mode: "single" | "chunked";
  path: string;
};

export type FeedIndexFile = {
  version: number;
  updatedAt: string;
  totalPosts: number;
  countries: Record<string, FeedIndexCountryEntry>;
};

type RepoFileResponse = {
  sha: string;
  content?: string;
};

type CommitFile = {
  path: string;
  content: string;
};

function getRepoRoot() {
  return process.cwd();
}

function getAbsolutePath(relativePath: string) {
  return path.join(getRepoRoot(), relativePath);
}

function isLocalFileMode() {
  return (
    process.env.MARGELET_STORAGE_MODE === "local" ||
    process.env.GITHUB_ACTIONS === "true"
  );
}

function getApiUrl(apiPath: string) {
  return `https://api.github.com${apiPath}`;
}

function getHeaders() {
  if (!GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubFetch(apiPath: string, init?: RequestInit) {
  return fetch(getApiUrl(apiPath), {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init?.headers || {}),
    },
  });
}

function decodeBase64Utf8(input: string) {
  return Buffer.from(input.replace(/\n/g, ""), "base64").toString("utf8");
}

function stringify(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || DEFAULT_FEED_COUNTRY;
}

function buildCountryFeedDataPath(countryCode: string) {
  return `${FEEDS_ROOT}/${countryCode}.json`;
}

function buildCountryFeedPublicPath(countryCode: string) {
  return `${PUBLIC_FEEDS_ROOT}/${countryCode}.json`;
}

function buildCountryChunkDataPath(countryCode: string, chunkId: number) {
  return `${FEEDS_ROOT}/${countryCode}/${chunkId}.json`;
}

function buildCountryChunkPublicPath(countryCode: string, chunkId: number) {
  return `${PUBLIC_FEEDS_ROOT}/${countryCode}/${chunkId}.json`;
}

async function readLocalJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    const absolutePath = getAbsolutePath(relativePath);
    const raw = await readFile(absolutePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeLocalJsonFile(relativePath: string, payload: unknown) {
  const absolutePath = getAbsolutePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, stringify(payload), "utf8");
}

async function readRepoJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  if (isLocalFileMode() || !GITHUB_TOKEN) {
    return readLocalJsonFile(relativePath, fallback);
  }

  try {
    const response = await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${relativePath}?ref=${encodeURIComponent(
        GITHUB_BRANCH
      )}`
    );

    if (response.status === 404) {
      return fallback;
    }

    if (!response.ok) {
      throw new Error(`GitHub read failed: ${response.status}`);
    }

    const data = (await response.json()) as RepoFileResponse;
    if (!data.content) {
      return fallback;
    }

    return JSON.parse(decodeBase64Utf8(data.content)) as T;
  } catch {
    return fallback;
  }
}

async function getBranchHead() {
  const response = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${encodeURIComponent(GITHUB_BRANCH)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to read branch head: ${response.status}`);
  }

  const data = (await response.json()) as { object?: { sha?: string } };
  const sha = data.object?.sha;
  if (!sha) {
    throw new Error("Missing branch head sha");
  }

  return sha;
}

async function getCommitTreeSha(commitSha: string) {
  const response = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${commitSha}`
  );

  if (!response.ok) {
    throw new Error(`Failed to read commit: ${response.status}`);
  }

  const data = (await response.json()) as { tree?: { sha?: string } };
  const sha = data.tree?.sha;
  if (!sha) {
    throw new Error("Missing tree sha");
  }

  return sha;
}

async function commitFiles(files: CommitFile[], message: string) {
  const headSha = await getBranchHead();
  const baseTreeSha = await getCommitTreeSha(headSha);

  const treeResponse = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: files.map((file) => ({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content,
      })),
    }),
  });

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.status}`);
  }

  const treeData = (await treeResponse.json()) as { sha?: string };
  if (!treeData.sha) {
    throw new Error("Missing new tree sha");
  }

  const commitResponse = await githubFetch(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message,
      tree: treeData.sha,
      parents: [headSha],
    }),
  });

  if (!commitResponse.ok) {
    throw new Error(`Failed to create commit: ${commitResponse.status}`);
  }

  const commitData = (await commitResponse.json()) as { sha?: string };
  if (!commitData.sha) {
    throw new Error("Missing commit sha");
  }

  const refResponse = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(GITHUB_BRANCH)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ sha: commitData.sha }),
    }
  );

  if (!refResponse.ok) {
    throw new Error(`Failed to update branch ref: ${refResponse.status}`);
  }
}

async function persistFiles(files: CommitFile[], message: string) {
  if (isLocalFileMode() || !GITHUB_TOKEN) {
    for (const file of files) {
      await writeLocalJsonFile(file.path, JSON.parse(file.content));
    }
    return;
  }

  await commitFiles(files, message);
}

function splitIntoChunks<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildEmptyFeedIndex(updatedAt = new Date(0).toISOString()): FeedIndexFile {
  return {
    version: FEED_STORAGE_VERSION,
    updatedAt,
    totalPosts: 0,
    countries: {},
  };
}

async function readFeedCountryDescriptor<T = unknown>(countryCode: string) {
  return readRepoJsonFile<FeedCountryFile<T> | null>(buildCountryFeedDataPath(countryCode), null);
}

async function readFeedChunkFile<T = unknown>(countryCode: string, chunkId: number) {
  return readRepoJsonFile<FeedChunkFile<T> | null>(buildCountryChunkDataPath(countryCode, chunkId), null);
}

function sortPostsNewestFirst<T>(items: T[], getCreatedAt: (item: T) => string, getKey: (item: T) => string) {
  return [...items].sort((a, b) => {
    const aDate = Date.parse(getCreatedAt(a));
    const bDate = Date.parse(getCreatedAt(b));
    const safeA = Number.isFinite(aDate) ? aDate : 0;
    const safeB = Number.isFinite(bDate) ? bDate : 0;

    if (safeA !== safeB) {
      return safeB - safeA;
    }

    return getKey(b).localeCompare(getKey(a));
  });
}

export async function readSourcesFile<T = unknown>(): Promise<SourcesFile<T>> {
  return readRepoJsonFile<SourcesFile<T>>(SOURCES_PATH, {
    updatedAt: new Date(0).toISOString(),
    sources: [],
  });
}

export async function writeSourcesFile<T = unknown>(sources: T[]) {
  const payload = {
    updatedAt: new Date().toISOString(),
    sources,
  } satisfies SourcesFile<T>;

  await persistFiles(
    [{ path: SOURCES_PATH, content: stringify(payload) }],
    `Update sources.json (${sources.length})`
  );
}

export async function readFeedIndexFile(): Promise<FeedIndexFile> {
  const next = await readRepoJsonFile<FeedIndexFile | null>(FEEDS_INDEX_PATH, null);

  if (!next || typeof next !== "object" || typeof next.countries !== "object") {
    return buildEmptyFeedIndex();
  }

  return {
    version: typeof next.version === "number" ? next.version : FEED_STORAGE_VERSION,
    updatedAt: typeof next.updatedAt === "string" ? next.updatedAt : new Date(0).toISOString(),
    totalPosts: typeof next.totalPosts === "number" ? next.totalPosts : 0,
    countries: next.countries || {},
  };
}

export async function readFeedCountryPosts<T = unknown>(countryCode: string): Promise<T[]> {
  const normalizedCountry = normalizeCountryCode(countryCode);
  const descriptor = await readFeedCountryDescriptor<T>(normalizedCountry);

  if (!descriptor || typeof descriptor !== "object") {
    return [];
  }

  if (descriptor.mode === "single") {
    return Array.isArray(descriptor.items) ? descriptor.items : [];
  }

  const chunks = Array.isArray(descriptor.chunks) ? descriptor.chunks : [];
  const loaded = await Promise.all(
    chunks.map((chunk) => readFeedChunkFile<T>(normalizedCountry, Number(chunk.id || 0)))
  );

  return loaded.flatMap((chunk) => (Array.isArray(chunk?.items) ? chunk.items : []));
}

export async function readFeedFile<T extends { createdAt?: string; postUrl?: string } = never>(): Promise<FeedFile<T>> {
  const index = await readFeedIndexFile();
  const countryCodes = Object.keys(index.countries).sort((a, b) => a.localeCompare(b));
  const perCountry = await Promise.all(countryCodes.map((countryCode) => readFeedCountryPosts<T>(countryCode)));
  const posts = perCountry.flat();

  const sorted = sortPostsNewestFirst(
    posts,
    (item) => String(item?.createdAt || ""),
    (item) => String(item?.postUrl || "")
  );

  return {
    updatedAt: index.updatedAt,
    posts: sorted,
  };
}

export async function writeFeedSnapshots<T extends { createdAt?: string; postUrl?: string; sourceCountryCode?: string | null }>(posts: T[]) {
  const updatedAt = new Date().toISOString();
  const normalizedPosts = sortPostsNewestFirst(
    posts,
    (item) => String(item?.createdAt || ""),
    (item) => String(item?.postUrl || "")
  );

  const grouped = new Map<string, T[]>();

  for (const post of normalizedPosts) {
    const countryCode = normalizeCountryCode(post?.sourceCountryCode);
    const current = grouped.get(countryCode) || [];
    current.push(post);
    grouped.set(countryCode, current);
  }

  const files: CommitFile[] = [];
  const countries: Record<string, FeedIndexCountryEntry> = {};

  for (const countryCode of Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b))) {
    const countryPosts = grouped.get(countryCode) || [];
    const chunks = splitIntoChunks(countryPosts, FEED_CHUNK_POST_LIMIT);

    if (chunks.length <= 1) {
      const payload: FeedCountrySingleFile<T> = {
        version: FEED_STORAGE_VERSION,
        countryCode,
        updatedAt,
        mode: "single",
        totalPosts: countryPosts.length,
        items: countryPosts,
      };

      files.push(
        { path: buildCountryFeedDataPath(countryCode), content: stringify(payload) },
        { path: buildCountryFeedPublicPath(countryCode), content: stringify(payload) }
      );

      countries[countryCode] = {
        code: countryCode,
        updatedAt,
        totalPosts: countryPosts.length,
        chunkCount: 1,
        mode: "single",
        path: `/feeds/${countryCode}.json`,
      };

      continue;
    }

    const chunkMeta: FeedCountryChunkMeta[] = chunks.map((items, index) => ({
      id: index + 1,
      path: `/feeds/${countryCode}/${index + 1}.json`,
      posts: items.length,
    }));

    const descriptor: FeedCountryChunkedFile = {
      version: FEED_STORAGE_VERSION,
      countryCode,
      updatedAt,
      mode: "chunked",
      totalPosts: countryPosts.length,
      chunks: chunkMeta,
    };

    files.push(
      { path: buildCountryFeedDataPath(countryCode), content: stringify(descriptor) },
      { path: buildCountryFeedPublicPath(countryCode), content: stringify(descriptor) }
    );

    chunkMeta.forEach((chunk, index) => {
      const payload: FeedChunkFile<T> = {
        version: FEED_STORAGE_VERSION,
        countryCode,
        chunkId: chunk.id,
        updatedAt,
        items: chunks[index],
      };

      files.push(
        { path: buildCountryChunkDataPath(countryCode, chunk.id), content: stringify(payload) },
        { path: buildCountryChunkPublicPath(countryCode, chunk.id), content: stringify(payload) }
      );
    });

    countries[countryCode] = {
      code: countryCode,
      updatedAt,
      totalPosts: countryPosts.length,
      chunkCount: chunkMeta.length,
      mode: "chunked",
      path: `/feeds/${countryCode}.json`,
    };
  }

  const indexPayload: FeedIndexFile = {
    version: FEED_STORAGE_VERSION,
    updatedAt,
    totalPosts: normalizedPosts.length,
    countries,
  };

  const legacyPayload: FeedFile<T> = {
    updatedAt,
    posts: normalizedPosts,
  };

  files.push(
    { path: FEEDS_INDEX_PATH, content: stringify(indexPayload) },
    { path: PUBLIC_FEEDS_INDEX_PATH, content: stringify(indexPayload) },
    { path: LEGACY_FEED_PATH, content: stringify(legacyPayload) },
    { path: LEGACY_PUBLIC_FEED_PATH, content: stringify(legacyPayload) }
  );

  await persistFiles(files, `Update feed snapshots (${normalizedPosts.length})`);

  return indexPayload;
}

export async function writeFeedFile<T extends { createdAt?: string; postUrl?: string; sourceCountryCode?: string | null }>(posts: T[]) {
  await writeFeedSnapshots(posts);
}

export async function clearFeedFile() {
  await writeFeedSnapshots([] as Array<{ createdAt?: string; postUrl?: string; sourceCountryCode?: string | null }>);
}

export async function clearSourcesFile() {
  await writeSourcesFile([]);
}

export {
  DEFAULT_FEED_COUNTRY,
  FEED_CHUNK_POST_LIMIT,
  FEEDS_INDEX_PATH,
  FEEDS_ROOT,
  LEGACY_FEED_PATH as FEED_PATH,
  LEGACY_PUBLIC_FEED_PATH as PUBLIC_FEED_PATH,
  PUBLIC_FEEDS_ROOT,
  SOURCES_PATH,
};
