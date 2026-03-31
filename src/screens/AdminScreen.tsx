import { useEffect, useMemo, useState } from "react";
import type { IngestedPost, Locale } from "../types/app";

type AdminScreenProps = {
  locale: Locale;
  telegramUserId: string | null;
  onClose: () => void;
  onDeletePost: (id: number) => Promise<void>;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const ADMIN_TELEGRAM_ID = "1372669404";

function buildSearchText(post: IngestedPost) {
  return [
    post.source.title,
    post.source.handle,
    post.postUrl,
    post.addedBy.username || "",
    post.addedBy.telegramId || "",
    post.tag || "",
    post.text || "",
    post.billing.plan || "",
    post.status || "",
  ]
    .join(" ")
    .toLowerCase();
}

export function AdminScreen({
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "pending" | "blocked"
  >("all");

  const [analytics, setAnalytics] = useState<any>(null);

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  // 🔥 загрузка постов
  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      if (!telegramUserId || !hasAdminAccess) return;

      try {
        setState("loading");

        const res = await fetch("/api/admin-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramUserId }),
        });

        const data = await res.json();

        if (!cancelled) {
          setPosts(data.posts || []);
          setState("ready");
        }
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    loadPosts();

    return () => {
      cancelled = true;
    };
  }, [telegramUserId, hasAdminAccess]);

  // 🔥 загрузка аналитики
  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;

    fetch("/api/admin-analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telegramUserId }),
    })
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => {});
  }, [telegramUserId, hasAdminAccess]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesQuery = q
        ? buildSearchText(post).includes(q)
        : true;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : (post.status || "published") === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [posts, query, statusFilter]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить пост?")) return;

    await onDeletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateStatus = async (
    id: number,
    status: "published" | "blocked"
  ) => {
    await fetch("/api/admin-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, telegramUserId }),
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status } : p
      )
    );
  };

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Нет доступа
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-6xl mx-auto">

        {state === "loading" && (
          <div className="mb-4 text-sm text-white/50">
            loading...
          </div>
        )}

        {state === "error" && (
          <div className="mb-4 text-sm text-red-400">
            ошибка загрузки
          </div>
        )}

        {/* HEADER */}
        <div className="flex justify-between mb-4">
          <div>
            <div className="text-xl font-semibold">Admin</div>
            <div className="text-sm text-white/40">
              управление + аналитика
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-full"
          >
            назад
          </button>
        </div>

        {/* 🔥 ANALYTICS */}
        {analytics && (
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="text-lg font-semibold mb-2">Analytics</div>

            <div className="text-sm mb-2">
              👁 Views: {analytics.views}
            </div>

            <div className="text-sm mb-2">
              🌍 Countries:
              {Object.entries(analytics.countries || {}).map(([k, v]) => (
                <div key={k}>
                  {k}: {String(v)}
                  </div>
                )
              )}
            </div>

            <div className="text-sm">
              📱 Devices:
              {Object.entries(analytics.countries || {}).map(([k, v]) => (
                <div key={k}>
                  {k}: {String(v)}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* FILTER */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["all", "published", "pending", "blocked"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === s
                  ? "bg-white text-black"
                  : "bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* SEARCH */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="поиск..."
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10"
        />

        {/* LIST */}
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const status = post.status || "published";

            return (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">
                      {post.source.title}
                    </div>
                    <div className="text-xs text-white/50">
                      @{post.source.handle}
                    </div>
                  </div>

                  <div className="text-xs px-2 py-1 rounded bg-white/10">
                    {status}
                  </div>
                </div>

                <div className="text-xs mt-2 text-white/60">
                  {post.addedBy.username ||
                    post.addedBy.telegramId}
                </div>

                <div className="flex gap-2 mt-3 flex-wrap">

                  {status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            post.id,
                            "published"
                          )
                        }
                        className="px-3 py-1 bg-green-500 rounded"
                      >
                        approve
                      </button>

                      <button
                        onClick={() =>
                          handleUpdateStatus(
                            post.id,
                            "blocked"
                          )
                        }
                        className="px-3 py-1 bg-yellow-500 rounded"
                      >
                        reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-3 py-1 bg-red-500 rounded"
                  >
                    delete
                  </button>

                  <a
                    href={post.postUrl}
                    target="_blank"
                    className="px-3 py-1 bg-white/10 rounded"
                  >
                    open
                  </a>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}