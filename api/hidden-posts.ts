import type { VercelRequest, VercelResponse } from "@vercel/node";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

const GITHUB_TOKEN = String(
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  process.env.MARGELET_GITHUB_TOKEN ||
  ""
).trim();

const GITHUB_OWNER = String(process.env.GITHUB_OWNER || "jeep-jim").trim();
const GITHUB_REPO = String(process.env.GITHUB_REPO || "margelet").trim();
const GITHUB_BRANCH = String(process.env.GITHUB_BRANCH || "main").trim();
const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || "").trim();
const ADMIN_TELEGRAM_USERNAME = String(process.env.ADMIN_TELEGRAM_USERNAME || "")
  .trim()
  .replace(/^@+/, "")
  .toLowerCase();

const HIDDEN_POSTS_PATH = "data/moderation/hidden-posts.json";
const DEFAULT_HIDE_TTL_DAYS = 5;

type HiddenPostEntry = {
  postId: number;
  hiddenAt: string;
  expiresAt: string;
  hiddenByTelegramId: string | null;
  hiddenByUsername: string | null;
  reason: string | null;
};

type HiddenPostsFile = {
  version: 1;
  updatedAt: string;
  ttlDays: number;
  hiddenPosts: HiddenPostEntry[];
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asPostId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function normalizeUsername(value: unknown) {
  return asString(value).replace(/^@+/, "").toLowerCase();
}

function isOwner(body: Record<string, unknown>) {
  const telegramId = asString(body.telegramId) || asString(body.telegramUserId);
  const username = normalizeUsername(body.username) || normalizeUsername(body.telegramUsername);

  const hasEnv = Boolean(ADMIN_TELEGRAM_ID || ADMIN_TELEGRAM_USERNAME);
  if (!hasEnv) return Boolean(telegramId || username);

  return Boolean(
    (ADMIN_TELEGRAM_ID && telegramId === ADMIN_TELEGRAM_ID) ||
    (ADMIN_TELEGRAM_USERNAME && username === ADMIN_TELEGRAM_USERNAME)
  );
}

function headers() {
  if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN");
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function rawHeaders() {
  return { ...headers(), Accept: "application/vnd.github.raw+json" };
}

function apiUrl(apiPath: string) {
  return `https://api.github.com${apiPath}`;
}

function isLocalMode() {
  return process.env.MARGELET_STORAGE_MODE === "local" || !GITHUB_TOKEN;
}

function emptyFile(): HiddenPostsFile {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    ttlDays: DEFAULT_HIDE_TTL_DAYS,
    hiddenPosts: [],
  };
}

function stringify(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function cleanFile(file: HiddenPostsFile) {
  const now = Date.now();
  const latest = new Map<number, HiddenPostEntry>();

  for (const entry of Array.isArray(file.hiddenPosts) ? file.hiddenPosts : []) {
    const postId = asPostId(entry.postId);
    if (!postId) continue;

    const expiresAtMs = Date.parse(String(entry.expiresAt || ""));
    if (Number.isFinite(expiresAtMs) && expiresAtMs <= now) continue;

    const prev = latest.get(postId);
    if (!prev || Date.parse(entry.hiddenAt || "") > Date.parse(prev.hiddenAt || "")) {
      latest.set(postId, { ...entry, postId });
    }
  }

  return {
    version: 1 as const,
    updatedAt: file.updatedAt || new Date().toISOString(),
    ttlDays: Number(file.ttlDays || DEFAULT_HIDE_TTL_DAYS),
    hiddenPosts: Array.from(latest.values()).sort(
      (a, b) => Date.parse(b.hiddenAt || "") - Date.parse(a.hiddenAt || "")
    ),
  };
}

async function readLocalFile(): Promise<HiddenPostsFile> {
  try {
    const absolute = path.join(process.cwd(), HIDDEN_POSTS_PATH);
    const raw = await readFile(absolute, "utf8");
    return cleanFile(JSON.parse(raw));
  } catch {
    return emptyFile();
  }
}

async function writeLocalFile(file: HiddenPostsFile) {
  const absolute = path.join(process.cwd(), HIDDEN_POSTS_PATH);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, stringify(file), "utf8");
}

async function readRemoteFile(): Promise<HiddenPostsFile> {
  if (isLocalMode()) return readLocalFile();

  const response = await fetch(
    apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${HIDDEN_POSTS_PATH}?ref=${encodeURIComponent(GITHUB_BRANCH)}`),
    { headers: rawHeaders() }
  );

  if (response.status === 404) return emptyFile();
  if (!response.ok) throw new Error(`Hidden posts read failed: ${response.status}`);

  const raw = await response.text();
  if (!raw.trim()) return emptyFile();
  return cleanFile(JSON.parse(raw));
}

async function getBranchHead() {
  const response = await fetch(
    apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${encodeURIComponent(GITHUB_BRANCH)}`),
    { headers: headers() }
  );
  if (!response.ok) throw new Error(`Read branch failed: ${response.status}`);
  const data = (await response.json()) as { object?: { sha?: string } };
  if (!data.object?.sha) throw new Error("Missing branch sha");
  return data.object.sha;
}

async function getCommitTreeSha(commitSha: string) {
  const response = await fetch(apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits/${commitSha}`), {
    headers: headers(),
  });
  if (!response.ok) throw new Error(`Read commit failed: ${response.status}`);
  const data = (await response.json()) as { tree?: { sha?: string } };
  if (!data.tree?.sha) throw new Error("Missing tree sha");
  return data.tree.sha;
}

async function writeRemoteFile(file: HiddenPostsFile, message: string) {
  if (isLocalMode()) {
    await writeLocalFile(file);
    return;
  }

  const headSha = await getBranchHead();
  const baseTreeSha = await getCommitTreeSha(headSha);

  const treeResponse = await fetch(apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: [
        {
          path: HIDDEN_POSTS_PATH,
          mode: "100644",
          type: "blob",
          content: stringify(file),
        },
      ],
    }),
  });
  if (!treeResponse.ok) throw new Error(`Create tree failed: ${treeResponse.status}`);
  const treeData = (await treeResponse.json()) as { sha?: string };
  if (!treeData.sha) throw new Error("Missing new tree sha");

  const commitResponse = await fetch(apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message, tree: treeData.sha, parents: [headSha] }),
  });
  if (!commitResponse.ok) throw new Error(`Create commit failed: ${commitResponse.status}`);
  const commitData = (await commitResponse.json()) as { sha?: string };
  if (!commitData.sha) throw new Error("Missing commit sha");

  const refResponse = await fetch(
    apiUrl(`/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(GITHUB_BRANCH)}`),
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ sha: commitData.sha }),
    }
  );
  if (!refResponse.ok) throw new Error(`Update ref failed: ${refResponse.status}`);
}

function addHiddenPosts(file: HiddenPostsFile, ids: number[], body: Record<string, unknown>) {
  const now = new Date();
  const ttlDays = Number(file.ttlDays || DEFAULT_HIDE_TTL_DAYS);
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const existing = new Map(cleanFile(file).hiddenPosts.map((entry) => [entry.postId, entry]));

  for (const postId of ids) {
    existing.set(postId, {
      postId,
      hiddenAt: now.toISOString(),
      expiresAt,
      hiddenByTelegramId: asString(body.telegramId) || asString(body.telegramUserId) || null,
      hiddenByUsername: normalizeUsername(body.username) || normalizeUsername(body.telegramUsername) || null,
      reason: asString(body.reason) || null,
    });
  }

  return cleanFile({
    version: 1,
    updatedAt: now.toISOString(),
    ttlDays,
    hiddenPosts: Array.from(existing.values()),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    if (req.method === "GET") {
      const file = await readRemoteFile();
      return res.status(200).json({
        ok: true,
        updatedAt: file.updatedAt,
        ttlDays: file.ttlDays,
        ids: file.hiddenPosts.map((entry) => entry.postId),
        hiddenPosts: file.hiddenPosts,
      });
    }

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = (req.body || {}) as Record<string, unknown>;
    if (!isOwner(body)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const rawIds = Array.isArray(body.postIds) ? body.postIds : [body.postId ?? body.id];
    const ids = Array.from(new Set(rawIds.map(asPostId).filter((id): id is number => Boolean(id))));

    if (!ids.length) {
      return res.status(400).json({ error: "postIds required" });
    }

    const current = await readRemoteFile();
    const next = addHiddenPosts(current, ids, body);
    await writeRemoteFile(next, `moderation: hide ${ids.length} post${ids.length === 1 ? "" : "s"}`);

    return res.status(200).json({
      ok: true,
      hidden: ids.length,
      ids: next.hiddenPosts.map((entry) => entry.postId),
      updatedAt: next.updatedAt,
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "hidden posts failed",
    });
  }
}
