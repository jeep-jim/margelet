import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { IngestedPost } from "./contracts.js";

const FEED_CHUNKS_DIR = "data/feed/chunks";
const FEED_INDEX_PATH = "data/feed/index.json";
const POSTS_PER_CHUNK = 2000;

export type FeedChunkIndex = {
  version: number;
  updatedAt: string;
  totalPosts: number;
  chunkSize: number;
  chunks: number;
  chunksList: {
    number: number;
    path: string;
    postsCount: number;
  }[];
};

async function readJsonFile<T>(relativePath: string, fallback: T): Promise<T> {
  try {
    const absolutePath = path.join(process.cwd(), relativePath);
    const raw = await readFile(absolutePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJsonFile(relativePath: string, data: unknown) {
  const absolutePath = path.join(process.cwd(), relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readFeedChunkIndex(): Promise<FeedChunkIndex> {
  return readJsonFile(FEED_INDEX_PATH, {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    totalPosts: 0,
    chunkSize: POSTS_PER_CHUNK,
    chunks: 0,
    chunksList: [],
  });
}

export async function readAllFeedPosts(): Promise<IngestedPost[]> {
  const index = await readFeedChunkIndex();
  if (index.chunks === 0) return [];
  
  const allPosts: IngestedPost[] = [];
  for (const chunk of index.chunksList) {
    const posts = await readJsonFile<IngestedPost[]>(
      `data/feed/chunks/${chunk.number.toString().padStart(4, "0")}.json`,
      []
    );
    allPosts.push(...posts);
  }
  return allPosts;
}

export async function writeFeedPosts(posts: IngestedPost[], updatedAt: string) {
  const chunks: IngestedPost[][] = [];
  for (let i = 0; i < posts.length; i += POSTS_PER_CHUNK) {
    chunks.push(posts.slice(i, i + POSTS_PER_CHUNK));
  }
  
  await mkdir(path.join(process.cwd(), FEED_CHUNKS_DIR), { recursive: true });
  
  const chunksList = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunkNumber = (i + 1).toString().padStart(4, "0");
    const chunkPath = `${FEED_CHUNKS_DIR}/${chunkNumber}.json`;
    await writeJsonFile(chunkPath, chunks[i]);
    chunksList.push({
      number: i + 1,
      path: `/data/feed/chunks/${chunkNumber}.json`,
      postsCount: chunks[i].length,
    });
  }
  
  const index: FeedChunkIndex = {
    version: 1,
    updatedAt,
    totalPosts: posts.length,
    chunkSize: POSTS_PER_CHUNK,
    chunks: chunks.length,
    chunksList,
  };
  
  await writeJsonFile(FEED_INDEX_PATH, index);
}

export async function addPostToFeed(post: IngestedPost): Promise<void> {
  const index = await readFeedChunkIndex();
  const allPosts = await readAllFeedPosts();
  allPosts.unshift(post); // новый пост в начало
  
  await writeFeedPosts(allPosts, new Date().toISOString());
}