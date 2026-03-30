import { deletePostById, getPostById } from "./lib/kv.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const id =
      typeof body.id === "number"
        ? body.id
        : Number(String(body.id || "").trim());

    const telegramUserId =
      typeof body.telegramUserId === "string"
        ? body.telegramUserId.trim()
        : "";

    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Missing id" });
    }

    if (!telegramUserId) {
      return res.status(400).json({ error: "Missing telegramUserId" });
    }

    const post = await getPostById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const isAdmin = ADMIN_TELEGRAM_IDS.has(telegramUserId);
    const isOwner =
      !!post.addedBy.telegramId && post.addedBy.telegramId === telegramUserId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await deletePostById(id);

    return res.status(200).json({
      ok: true,
      deletedId: id,
      deletedBy: isAdmin ? "admin" : "owner",
    });
  } catch (error) {
    console.error("delete-post api error", error);
    return res.status(500).json({ error: "Failed to delete post" });
  }
}