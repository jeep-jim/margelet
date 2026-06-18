import { readFile, writeFile, mkdir, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

interface Post {
  id?: number;
  expiresAt?: string;
  [key: string]: unknown;
}

interface FeedFile {
  updatedAt: string;
  posts: Post[];
}

interface Source {
  id: string;
  countryCode: string;
  handle: string;
  [key: string]: unknown;
}

interface SourcesFile {
  updatedAt: string;
  sources: Source[];
}

const POSTS_PER_CHUNK = 100;
const FEED_PATH = "data/feed.json";
const SOURCES_PATH = "data/sources.json";
const FEED_CHUNKS_DIR = "data/feed/chunks";
const SOURCES_CHUNKS_DIR = "data/sources/chunks";

async function ensureDir(dir: string): Promise<void> {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function cleanOldChunks(dir: string): Promise<void> {
  if (!existsSync(dir)) return;
  
  const files = await readdir(dir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      await unlink(`${dir}/${file}`);
      console.log(`  🗑️ Deleted old chunk: ${file}`);
    }
  }
}

function isExpiredPost(post: Post): boolean {
  if (!post.expiresAt) return false;
  const now = new Date();
  const expiresAt = new Date(post.expiresAt);
  return expiresAt < now;
}

async function migrateFeed(): Promise<void> {
  if (!existsSync(FEED_PATH)) {
    console.log("⚠️ feed.json not found, skipping feed migration");
    return;
  }

  console.log("📖 Reading feed.json...");
  const feedRaw = await readFile(FEED_PATH, "utf-8");
  const feed = JSON.parse(feedRaw) as FeedFile;
  let posts = feed.posts || [];
  
  const originalCount = posts.length;
  
  // Фильтруем устаревшие посты
  posts = posts.filter((post: Post) => !isExpiredPost(post));
  const expiredCount = originalCount - posts.length;
  
  console.log(`📊 Total posts: ${originalCount}, expired: ${expiredCount}, valid: ${posts.length}`);
  
  // Очищаем старые чанки
  await cleanOldChunks(FEED_CHUNKS_DIR);
  
  if (posts.length === 0) {
    console.log("⚠️ No valid posts found, skipping chunk creation");
    return;
  }
  
  const chunks: Post[][] = [];
  for (let i = 0; i < posts.length; i += POSTS_PER_CHUNK) {
    chunks.push(posts.slice(i, i + POSTS_PER_CHUNK));
  }
  
  console.log(`📦 Creating ${chunks.length} chunks (${POSTS_PER_CHUNK} posts each)`);
  
  await ensureDir(FEED_CHUNKS_DIR);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkNumber = (i + 1).toString().padStart(4, "0");
    const chunkPath = `${FEED_CHUNKS_DIR}/${chunkNumber}.json`;
    await writeFile(chunkPath, JSON.stringify(chunks[i], null, 2));
    console.log(`  ✅ Written ${chunkPath} (${chunks[i].length} posts)`);
  }
  
  // Создаём индекс
  const index = {
    version: 1,
    updatedAt: new Date().toISOString(),
    totalPosts: posts.length,
    chunkSize: POSTS_PER_CHUNK,
    chunks: chunks.length,
    chunksList: chunks.map((chunk, i) => ({
      number: i + 1,
      path: `/data/feed/chunks/${(i + 1).toString().padStart(4, "0")}.json`,
      postsCount: chunk.length
    }))
  };
  
  await writeFile(`${FEED_CHUNKS_DIR}/../index.json`, JSON.stringify(index, null, 2));
  console.log("  ✅ Written data/feed/index.json");
}

async function migrateSources(): Promise<void> {
  if (!existsSync(SOURCES_PATH)) {
    console.log("⚠️ sources.json not found, skipping sources migration");
    return;
  }

  console.log("\n📖 Reading sources.json...");
  const sourcesRaw = await readFile(SOURCES_PATH, "utf-8");
  const sourcesData = JSON.parse(sourcesRaw) as SourcesFile;
  const sources = sourcesData.sources || [];
  
  console.log(`📊 Total sources: ${sources.length}`);
  
  // Очищаем старые чанки
  await cleanOldChunks(SOURCES_CHUNKS_DIR);
  
  await ensureDir(SOURCES_CHUNKS_DIR);
  
  const chunkPath = `${SOURCES_CHUNKS_DIR}/0001.json`;
  await writeFile(chunkPath, JSON.stringify(sources, null, 2));
  console.log(`  ✅ Written ${chunkPath}`);
  
  // Создаём индекс
  const index = {
    version: 1,
    updatedAt: sourcesData.updatedAt,
    totalSources: sources.length,
    chunkSize: POSTS_PER_CHUNK,
    chunks: 1,
    chunksList: [
      {
        number: 1,
        path: "/data/sources/chunks/0001.json",
        sourcesCount: sources.length
      }
    ]
  };
  
  await writeFile(`${SOURCES_CHUNKS_DIR}/../index.json`, JSON.stringify(index, null, 2));
  console.log("  ✅ Written data/sources/index.json");
}

async function main(): Promise<void> {
  try {
    await migrateFeed();
    await migrateSources();
    console.log("\n🎉 Migration completed successfully!");
    console.log("\n⚠️  OLD FILES STILL EXIST: data/feed.json and data/sources.json");
    console.log("   Test everything, then remove them manually when ready.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();