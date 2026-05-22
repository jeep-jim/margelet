import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
const GITHUB_OWNER = String(process.env.GITHUB_OWNER || "jeep-jim").trim();
const GITHUB_REPO = String(process.env.GITHUB_REPO || "margelet").trim();
const GITHUB_BRANCH = String(process.env.GITHUB_BRANCH || "main").trim();

const SOURCES_PATH = "data/sources.json";
const FEED_PATH = "data/feed.json";
const PUBLIC_FEED_PATH = "public/feed.json";
const FEEDS_INDEX_PATH = "data/feeds/index.json";
const PUBLIC_FEEDS_INDEX_PATH = "public/feeds/index.json";
const COUNTRY_CHUNK_SIZE = 2000;

export type FeedFile<T = unknown> = {
  updatedAt: string;
  posts: T[];
};

export type SourcesFile<T = unknown> = {
  updatedAt: string;
  sources: T[];
};

export type FeedChunkRef = {
  id: number;
  path: string;
  posts: number;
};

export type FeedCountryIndexEntry = {
  code: string;
  posts: number;
  chunks: number;
  mode: "single" | "chunked";
  path: string;
  updatedAt: string;
};

export type FeedIndexFile = {
  version: 1;
  updatedAt: string;
  countries: Record<string, FeedCountryIndexEntry>;
};

export type CountryFeedSingleFile<T = unknown> = {
  countryCode: string;
  updatedAt: string;
  totalPosts: number;
  chunks: 1;
  items: T[];
};

export type CountryFeedChunkedFile = {
  countryCode: string;
  updatedAt: string;
  totalPosts: number;
  chunks: FeedChunkRef[];
};

export type CountryFeedFile<T = unknown> = CountryFeedSingleFile<T> | CountryFeedChunkedFile;

type RepoFileResponse = {
  sha: string;
  content?: string;
};

type CommitFile = {
  path: string;
  content: string;
};

type WriteFeedFileOptions = {
  allowEmpty?: boolean;
  reason?: string;
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

function normalizeCountryCode(value: unknown) {
  return String(value || "").trim().toLowerCase();
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
  if (isLocalFileMode()) {
    for (const file of files) {
      await writeLocalJsonFile(file.path, JSON.parse(file.content));
    }
    return;
  }

  if (!GITHUB_TOKEN) {
    throw new Error("Missing GITHUB_TOKEN for persistent writes");
  }

  await commitFiles(files, message);
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function getPostCountryCode(post: unknown) {
  if (!post || typeof post !== "object") {
    return "";
  }

  const value = (post as { sourceCountryCode?: unknown }).sourceCountryCode;
  return normalizeCountryCode(value);
}

function parseCreatedAtMs(value: unknown) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function normalizeHandle(value: unknown) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function getFeedPostSourceKey(post: unknown) {
  if (!post || typeof post !== "object") {
    return "";
  }

  const record = post as {
    sourceCountryCode?: unknown;
    source?: { handle?: unknown } | null;
  };

  const country = normalizeCountryCode(record.sourceCountryCode) || "xx";
  const handle = normalizeHandle(record.source?.handle || "");
  if (!handle) {
    return "";
  }

  return `${country}:${handle}`;
}

function normalizeFeedPostOrder<T>(posts: T[]) {
  const grouped = new Map<string, T[]>();
  let fallbackIndex = 0;

  for (const post of [...posts].sort((a, b) => {
    const aMs =
      a && typeof a === "object"
        ? parseCreatedAtMs((a as { createdAt?: unknown }).createdAt)
        : 0;
    const bMs =
      b && typeof b === "object"
        ? parseCreatedAtMs((b as { createdAt?: unknown }).createdAt)
        : 0;

    return bMs - aMs;
  })) {
    const key = getFeedPostSourceKey(post) || `__single__:${fallbackIndex++}`;

    const list = grouped.get(key) || [];
    list.push(post);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.values()).sort((a, b) => {
    const aTop =
      a[0] && typeof a[0] === "object"
        ? parseCreatedAtMs((a[0] as { createdAt?: unknown }).createdAt)
        : 0;
    const bTop =
      b[0] && typeof b[0] === "object"
        ? parseCreatedAtMs((b[0] as { createdAt?: unknown }).createdAt)
        : 0;

    return bTop - aTop;
  });

  const result: T[] = [];
  let added = true;

  while (added) {
    added = false;

    for (const group of groups) {
      const next = group.shift();
      if (!next) continue;
      result.push(next);
      added = true;
    }
  }

  return result;
}

function buildCountryFeedFiles<T>(posts: T[], updatedAt: string) {
  const byCountry = new Map<string, T[]>();

  for (const post of posts) {
    const countryCode = getPostCountryCode(post);
    if (!countryCode) {
      continue;
    }

    const existing = byCountry.get(countryCode) || [];
    existing.push(post);
    byCountry.set(countryCode, existing);
  }

  const countries: Record<string, FeedCountryIndexEntry> = {};
  const files: CommitFile[] = [];

  for (const [countryCode, rawCountryPosts] of Array.from(byCountry.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const countryPosts = normalizeFeedPostOrder(rawCountryPosts);

    if (countryPosts.length <= COUNTRY_CHUNK_SIZE) {      
      const singlePayload: CountryFeedSingleFile<T> = {
        countryCode,
        updatedAt,
        totalPosts: countryPosts.length,
        chunks: 1,
        items: countryPosts,
      };

      files.push(
        {
          path: `data/feeds/${countryCode}.json`,
          content: stringify(singlePayload),
        },
        {
          path: `public/feeds/${countryCode}.json`,
          content: stringify(singlePayload),
        }
      );

      countries[countryCode] = {
        code: countryCode,
        posts: countryPosts.length,
        chunks: 1,
        mode: "single",
        path: `/feeds/${countryCode}.json`,
        updatedAt,
      };

      continue;
    }

    const countryChunks = chunkItems(countryPosts, COUNTRY_CHUNK_SIZE);
    const refs: FeedChunkRef[] = [];

    countryChunks.forEach((chunkPosts, index) => {
      const chunkId = index + 1;
      const chunkPayload: FeedFile<T> = {
        updatedAt,
        posts: chunkPosts,
      };

      refs.push({
        id: chunkId,
        path: `/feeds/${countryCode}/${chunkId}.json`,
        posts: chunkPosts.length,
      });

      files.push(
        {
          path: `data/feeds/${countryCode}/${chunkId}.json`,
          content: stringify(chunkPayload),
        },
        {
          path: `public/feeds/${countryCode}/${chunkId}.json`,
          content: stringify(chunkPayload),
        }
      );
    });

    const manifest: CountryFeedChunkedFile = {
      countryCode,
      updatedAt,
      totalPosts: countryPosts.length,
      chunks: refs,
    };

    files.push(
      {
        path: `data/feeds/${countryCode}.json`,
        content: stringify(manifest),
      },
      {
        path: `public/feeds/${countryCode}.json`,
        content: stringify(manifest),
      }
    );

    countries[countryCode] = {
      code: countryCode,
      posts: countryPosts.length,
      chunks: refs.length,
      mode: "chunked",
      path: `/feeds/${countryCode}.json`,
      updatedAt,
    };
  }

  const indexPayload: FeedIndexFile = {
    version: 1,
    updatedAt,
    countries,
  };

  files.push(
    {
      path: FEEDS_INDEX_PATH,
      content: stringify(indexPayload),
    },
    {
      path: PUBLIC_FEEDS_INDEX_PATH,
      content: stringify(indexPayload),
    }
  );

  return {
    index: indexPayload,
    files,
  };
}


function normalizeFeedSnapshotRelativePath(value: unknown) {
  const raw = String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\\/g, "/");

  if (!raw || raw === "index.json") {
    return FEEDS_INDEX_PATH;
  }

  if (raw === "feed.json") {
    return FEED_PATH;
  }

  if (raw.includes("..")) {
    return null;
  }

  if (/^[a-z0-9-]+\.json$/i.test(raw)) {
    return `data/feeds/${raw.toLowerCase()}`;
  }

  if (/^[a-z0-9-]+\/[0-9]+\.json$/i.test(raw)) {
    return `data/feeds/${raw.toLowerCase()}`;
  }

  return null;
}

export async function readFeedSnapshotByPath<T = unknown>(rawPath: string): Promise<T | null> {
  const relativePath = normalizeFeedSnapshotRelativePath(rawPath);
  if (!relativePath) {
    return null;
  }

  return readRepoJsonFile<T | null>(relativePath, null);
}

export async function readSourcesFile<T = unknown>(): Promise<SourcesFile<T>> {
  return readRepoJsonFile<SourcesFile<T>>(SOURCES_PATH, {
    updatedAt: new Date(0).toISOString(),
    sources: [],
  });
}

export async function writeSourcesFile(data: any) {
  const absolutePath = getAbsolutePath(SOURCES_PATH);

  const safeData =
    data && Array.isArray(data) ? data : null;

  if (!safeData) {
    console.error("[writeSourcesFile] BLOCKED empty overwrite");
    return;
  }

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(
    absolutePath,
    stringify({
      updatedAt: new Date().toISOString(),
      sources: safeData,
    }),
    "utf8"
  );
}

export async function readFeedFile<T = unknown>(): Promise<FeedFile<T>> {
  return readRepoJsonFile<FeedFile<T>>(FEED_PATH, {
    updatedAt: new Date(0).toISOString(),
    posts: [],
  });
}

export async function readFeedIndexFile(): Promise<FeedIndexFile> {
  return readRepoJsonFile<FeedIndexFile>(FEEDS_INDEX_PATH, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    countries: {},
  });
}

export async function readFeedCountryFile<T = unknown>(
  countryCode: string
): Promise<CountryFeedFile<T> | null> {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) {
    return null;
  }

  return readRepoJsonFile<CountryFeedFile<T> | null>(`data/feeds/${normalized}.json`, null);
}

export async function readFeedCountryPosts<T = unknown>(countryCode: string): Promise<T[]> {
  const normalized = normalizeCountryCode(countryCode);
  if (!normalized) {
    return [];
  }

  const manifest = await readFeedCountryFile<T>(normalized);
  if (!manifest) {
    return [];
  }

  if ("items" in manifest && Array.isArray(manifest.items)) {
    return manifest.items;
  }

  if (!Array.isArray(manifest.chunks)) {
    return [];
  }

  const chunks = await Promise.all(
    manifest.chunks.map((chunk) =>
      readRepoJsonFile<FeedFile<T> | null>(`data${chunk.path}`, null)
    )
  );

  return chunks.flatMap((chunk) => (chunk && Array.isArray(chunk.posts) ? chunk.posts : []));
}

export async function readAllCountryFeedPosts<T = unknown>(): Promise<T[]> {
  const index = await readFeedIndexFile();
  const countryCodes = Object.keys(index.countries || {})
    .map((code) => normalizeCountryCode(code))
    .filter(Boolean);

  if (!countryCodes.length) {
    return [];
  }

  const countryPosts = await Promise.all(
    countryCodes.map((countryCode) => readFeedCountryPosts<T>(countryCode))
  );

  return countryPosts.flat();
}

export async function writeFeedFile<T = unknown>(
  posts: T[],
  options: WriteFeedFileOptions = {}
) {
  const updatedAt = new Date().toISOString();
  const orderedPosts = normalizeFeedPostOrder(posts);

  if (orderedPosts.length === 0 && !options.allowEmpty) {
    const previous = await readFeedFile<T>();
    const previousCount = Array.isArray(previous.posts) ? previous.posts.length : 0;

    if (previousCount > 0 || process.env.GITHUB_ACTIONS === "true") {
      throw new Error(
        `Refusing to write empty feed snapshot. previousPosts=${previousCount}, reason=${options.reason || "not_provided"}`
      );
    }
  }

  const payload: FeedFile<T> = {
    updatedAt,
    posts: orderedPosts,
  };

  const snapshot = buildCountryFeedFiles(orderedPosts, updatedAt);

  if (orderedPosts.length > 0 && Object.keys(snapshot.index.countries || {}).length === 0) {
    throw new Error(
      `Refusing to write feed index with zero countries. posts=${orderedPosts.length}, reason=${options.reason || "not_provided"}`
    );
  }

  await persistFiles(
    [
      { path: FEED_PATH, content: stringify(payload) },
      { path: PUBLIC_FEED_PATH, content: stringify(payload) },
      ...snapshot.files,
    ],    
    `Update feed snapshots (${posts.length})`
  );
}

export async function clearFeedFile() {
  await writeFeedFile([], { allowEmpty: true, reason: "clearFeedFile" });
}

export async function clearSourcesFile() {
  await writeSourcesFile([]);
}

export {
  FEED_PATH,
  FEEDS_INDEX_PATH,
  PUBLIC_FEED_PATH,
  PUBLIC_FEEDS_INDEX_PATH,
  SOURCES_PATH,
};
