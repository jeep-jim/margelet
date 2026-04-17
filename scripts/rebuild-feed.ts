import { rebuildFeedFromSources } from "../api/lib/sources";

type Args = {
  countryCode: string | null;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    countryCode: null,
  };

  for (const entry of argv) {
    if (entry.startsWith("--country=")) {
      const value = entry.slice("--country=".length).trim().toLowerCase();
      args.countryCode = value || null;
    }
  }

  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const result = await rebuildFeedFromSources({
    countryCode: (args.countryCode as any) || null,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        updatedAt: result.updatedAt,
        sourcesChecked: result.sourcesChecked,
        importedPosts: result.importedPosts,
        totalPosts: result.posts.length,
        countryCode: args.countryCode,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("rebuild-feed failed", error);
  process.exit(1);
});
