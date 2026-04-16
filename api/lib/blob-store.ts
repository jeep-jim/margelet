const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
const GITHUB_OWNER = String(process.env.GITHUB_OWNER || "jeep-jim").trim();
const GITHUB_REPO = String(process.env.GITHUB_REPO || "margelet").trim();
const GITHUB_BRANCH = String(process.env.GITHUB_BRANCH || "main").trim();

const SOURCES_PATH = "data/sources.json";
const FEED_PATH = "data/feed.json";
const PUBLIC_FEED_PATH = "public/feed.json";

export type FeedFile<T = unknown> = {
  updatedAt: string;
  posts: T[];
};

export type SourcesFile<T = unknown> = {
  updatedAt: string;
  sources: T[];
};

type RepoFileResponse = {
  sha: string;
  content?: string;
  encoding?: string;
};

type CommitFile = {
  path: string;
  content: string;
};

function getApiUrl(path: string) {
  return `https://api.github.com${path}`;
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

async function githubFetch(path: string, init?: RequestInit) {
  const response = await fetch(getApiUrl(path), {
    ...init,
    headers: {
      ...getHeaders(),
      ...(init?.headers || {}),
    },
  });

  return response;
}

function decodeBase64Utf8(input: string) {
  return Buffer.from(input.replace(/\n/g, ""), "base64").toString("utf8");
}

async function readRepoJsonFile<T>(pathname: string, fallback: T): Promise<T> {
  try {
    const response = await githubFetch(
      `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${pathname}?ref=${encodeURIComponent(
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

  const treeResponse = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees`,
    {
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
    }
  );

  if (!treeResponse.ok) {
    throw new Error(`Failed to create tree: ${treeResponse.status}`);
  }

  const treeData = (await treeResponse.json()) as { sha?: string };

  if (!treeData.sha) {
    throw new Error("Missing new tree sha");
  }

  const commitResponse = await githubFetch(
    `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [headSha],
      }),
    }
  );

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

function stringify(value: unknown) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function readSourcesFile<T = unknown>(): Promise<SourcesFile<T>> {
  return readRepoJsonFile<SourcesFile<T>>(SOURCES_PATH, {
    updatedAt: new Date(0).toISOString(),
    sources: [],
  });
}

export async function writeSourcesFile<T = unknown>(sources: T[]) {
  const payload = {
    updatedAt: new Date().toISOString(),
    sources,
  } satisfies SourcesFile<T>;

  await commitFiles(
    [{ path: SOURCES_PATH, content: stringify(payload) }],
    `Update sources.json (${sources.length})`
  );
}

export async function readFeedFile<T = unknown>(): Promise<FeedFile<T>> {
  return readRepoJsonFile<FeedFile<T>>(FEED_PATH, {
    updatedAt: new Date(0).toISOString(),
    posts: [],
  });
}

export async function writeFeedFile<T = unknown>(posts: T[]) {
  const payload = {
    updatedAt: new Date().toISOString(),
    posts,
  } satisfies FeedFile<T>;

  await commitFiles(
    [
      { path: FEED_PATH, content: stringify(payload) },
      { path: PUBLIC_FEED_PATH, content: stringify(payload) },
    ],
    `Update feed.json (${posts.length})`
  );
}

export async function clearFeedFile() {
  await writeFeedFile([]);
}

export async function clearSourcesFile() {
  await writeSourcesFile([]);
}

export { FEED_PATH, PUBLIC_FEED_PATH, SOURCES_PATH };