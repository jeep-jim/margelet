import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const POSTS_PER_CHUNK = 2000;
const FEED_PATH = "data/feed.json";
const SOURCES_PATH = "data/sources.json";
const FEED_CHUNKS_DIR = "data/feed/chunks";
const SOURCES_CHUNKS_DIR = "data/sources/chunks";

async function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function migrateFeed() {
  console.log("📖 Reading feed.json...");
  const feedRaw = await readFile(FEED_PATH, "utf-8");
  const feed = JSON.parse(feedRaw);
  const posts = feed.posts || [];
  
  console.log(`📊 Total posts: ${posts.length}`);
  
  const chunks: typeof posts[] = [];
  for (let i = 0; i < posts.length; i += POSTS_PER_CHUNK) {
    chunks.push(posts.slice(i, i + POSTS_PER_CHUNK));
  }
  
  console.log(`📦 Creating ${chunks.length} chunks (${POSTS_PER_CHUNK} posts each)`);
  
  await ensureDir(FEED_CHUNKS_DIR);
  
  for (let i = 0; i < chunks.length; i++) {
    const chunkNumber = (i + 1).toString().padStart(4, "0");
    const chunkPath = `${FEED_CHUNKS_DIR}/${chunkNumber}.json`;
    await writeFile(chunkPath, JSON.stringify(chunks[i], null, 2));
    console.log(`  ✅ Written ${chunkPath}`);
  }
  
  // Создаём индекс
  const index = {
    version: 1,
    updatedAt: feed.updatedAt,
    totalPosts: posts.length,
    chunkSize: POSTS_PER_CHUNK,
    chunks: chunks.length,
    chunksList: chunks.map((_, i) => ({
      number: i + 1,
      path: `/data/feed/chunks/${(i + 1).toString().padStart(4, "0")}.json`,
      postsCount: _.length
    }))
  };
  
  await writeFile(`${FEED_CHUNKS_DIR}/../index.json`, JSON.stringify(index, null, 2));
  console.log("  ✅ Written data/feed/index.json");
}

async function migrateSources() {
  console.log("\n📖 Reading sources.json...");
  const sourcesRaw = await readFile(SOURCES_PATH, "utf-8");
  const sourcesData = JSON.parse(sourcesRaw);
  const sources = sourcesData.sources || [];
  
  console.log(`📊 Total sources: ${sources.length}`);
  
  // Источники — в один чанк (их обычно мало, тысячи)
  await ensureDir(SOURCES_CHUNKS_DIR);
  
  const chunkPath = `${SOURCES_CHUNKS_DIR}/0001.json`;
  await writeFile(chunkPath, JSON.stringify(sources, null, 2));
  console.log(`  ✅ Written ${chunkPath}`);
  
  // Создаём индекс
  const index = {
    version: 1,
    updatedAt: sourcesData.updatedAt,
    totalSources: sources.length,
    chunkSize: sources.length,
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

async function main() {
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