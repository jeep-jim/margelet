import { del, list, put } from "@vercel/blob";

const SOURCES_PATH = "lite/sources.json";
const FEED_PATH = "lite/feed.json";

export type FeedFile<T = unknown> = {
  updatedAt: string;
  posts: T[];
};

export type SourcesFile<T = unknown> = {
  updatedAt: string;
  sources: T[];
};

type BlobListItem = {
  pathname: string;
  url: string;
  downloadUrl?: string;
};

async function readJsonFile<T>(pathname: string, fallback: T): Promise<T> {
  const result = await list({ prefix: pathname, limit: 10 });

  const blob =
    result.blobs.find((item: BlobListItem) => item.pathname === pathname) ??
    result.blobs[0];

  if (!blob) return fallback;

  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return fallback;
  }

  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(pathname: string, value: unknown) {
  await del(pathname).catch(() => undefined);

  const options = {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8",
    allowOverwrite: true,
  } as any;

  await put(pathname, JSON.stringify(value, null, 2), options);
}

export async function readSourcesFile<T = unknown>(): Promise<SourcesFile<T>> {
  return readJsonFile<SourcesFile<T>>(SOURCES_PATH, {
    updatedAt: new Date(0).toISOString(),
    sources: [],
  });
}

export async function writeSourcesFile<T = unknown>(sources: T[]) {
  await writeJsonFile(SOURCES_PATH, {
    updatedAt: new Date().toISOString(),
    sources,
  } satisfies SourcesFile<T>);
}

export async function readFeedFile<T = unknown>(): Promise<FeedFile<T>> {
  return readJsonFile<FeedFile<T>>(FEED_PATH, {
    updatedAt: new Date(0).toISOString(),
    posts: [],
  });
}

export async function writeFeedFile<T = unknown>(posts: T[]) {
  await writeJsonFile(FEED_PATH, {
    updatedAt: new Date().toISOString(),
    posts,
  } satisfies FeedFile<T>);
}

export async function clearFeedFile() {
  await del(FEED_PATH).catch(() => undefined);
}

export async function clearSourcesFile() {
  await del(SOURCES_PATH).catch(() => undefined);
}

export { FEED_PATH, SOURCES_PATH };