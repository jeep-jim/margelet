import { cleanupFeedPosts, rebuildFeedFromSources } from "../api/lib/sources.ts";
import { readFeedFile, writeFeedFile } from "../api/lib/github-store.ts";
import type { IngestedPost } from "../api/lib/contracts.ts";

type Args = {
  countryCode: string | null;
  cleanupOnly: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    countryCode: null,
    cleanupOnly: false,
  };

  for (const entry of argv) {
    if (entry.startsWith("--country=")) {
      const value = entry.slice("--country=".length).trim().toLowerCase();
      args.countryCode = value || null;
      continue;
    }

    if (entry === "--cleanup-only") {
      args.cleanupOnly = true;
    }
  }

  return args;
}

async function runCleanupOnly() {
  const feedFile = await readFeedFile<IngestedPost>();
  const currentPosts = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  const cleanedPosts = cleanupFeedPosts(currentPosts);

  await writeFeedFile(cleanedPosts);

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "cleanup-only",
        before: currentPosts.length,
        after: cleanedPosts.length,
        removed: Math.max(0, currentPosts.length - cleanedPosts.length),
      },
      null,
      2
    )
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.cleanupOnly) {
    await runCleanupOnly();
    return;
  }

  const result = await rebuildFeedFromSources({
    countryCode: (args.countryCode as never) || null,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "rebuild",
        updatedAt: result.updatedAt,
        countryCode: args.countryCode,
        sourcesChecked: result.sourcesChecked,
        sourcesWithNewPosts: result.sourcesWithNewPosts,
        importedPosts: result.importedPosts,
        importBudgetUsed: result.importBudgetUsed,
        importBudgetRemaining: result.importBudgetRemaining,
        removedPosts: result.removedPosts,
        existingFreshPostsCount: result.existingFreshPostsCount,
        totalPosts: result.posts.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
