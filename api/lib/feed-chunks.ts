import { readFile, writeFile, mkdir, readdir, unlink, stat } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import type { IngestedPost } from "./contracts.js";

const FEED_CHUNKS_DIR = "data/feed/chunks";
const FEED_INDEX_PATH = "data/feed/index.json";
const POSTS_PER_CHUNK = 500;
const CHUNK_MAX_AGE_DAYS = 30;

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

function isExpiredPost(post: IngestedPost): boolean {
  if (!post.expiresAt) return false;
  const now = new Date();
  const expiresAt = new Date(post.expiresAt);
  return expiresAt < now;
}

async function cleanupEmptyChunks(): Promise<void> {
  if (!existsSync(FEED_CHUNKS_DIR)) return;

  const files = await readdir(FEED_CHUNKS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const chunkPath = path.join(FEED_CHUNKS_DIR, file);
      const chunk = await readJsonFile<IngestedPost[]>(chunkPath, []);
      if (chunk.length === 0) {
        await unlink(chunkPath);
        console.log(`  🗑️ Deleted empty chunk: ${file}`);
      }
    }
  }
}

async function cleanupOldChunks(): Promise<void> {
  if (!existsSync(FEED_CHUNKS_DIR)) return;
  
  const now = Date.now();
  const maxAgeMs = CHUNK_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  
  const files = await readdir(FEED_CHUNKS_DIR);
  for (const file of files) {
    if (file.endsWith('.json')) {
      const chunkPath = path.join(FEED_CHUNKS_DIR, file);
      const stats = await stat(chunkPath);
      const fileAge = now - stats.mtimeMs;
      
      if (fileAge > maxAgeMs) {
        await unlink(chunkPath);
        console.log(`  🗑️ Deleted old chunk (${Math.round(fileAge / (24 * 60 * 60 * 1000))} days): ${file}`);
      }
    }
  }
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
    const chunkPath = `data/feed/chunks/${chunk.number.toString().padStart(4, "0")}.json`;
    const posts = await readJsonFile<IngestedPost[]>(chunkPath, []);
    const validPosts = posts.filter(post => !isExpiredPost(post));
    allPosts.push(...validPosts);
  }
  return allPosts;
}

export async function writeFeedPosts(posts: IngestedPost[], updatedAt: string) {
  const validPosts = posts.filter(post => !isExpiredPost(post));
  
  const chunks: IngestedPost[][] = [];
  for (let i = 0; i < validPosts.length; i += POSTS_PER_CHUNK) {
    chunks.push(validPosts.slice(i, i + POSTS_PER_CHUNK));
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
  
  await cleanupEmptyChunks();
  await cleanupOldChunks();
  
  const index: FeedChunkIndex = {
    version: 1,
    updatedAt,
    totalPosts: validPosts.length,
    chunkSize: POSTS_PER_CHUNK,
    chunks: chunks.length,
    chunksList,
  };
  
  await writeJsonFile(FEED_INDEX_PATH, index);
}

export async function addPostToFeed(post: IngestedPost): Promise<void> {
  const allPosts = await readAllFeedPosts();
  allPosts.unshift(post);
  await writeFeedPosts(allPosts, new Date().toISOString());
}