import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  await mkdir("public", { recursive: true });
  await writeFile(
    "public/sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://www.margelet.space/</loc></url>
</urlset>
`,
    "utf-8"
  );
  console.log("SEO trend pages disabled: wrote minimal sitemap.xml");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
