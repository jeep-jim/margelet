// ⬇️ ВСТАВЬ ПОЛНОСТЬЮ

import { useEffect, useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";
import {
  buildSearchText,
  formatDate,
  formatRemaining,
  getContentTypeLabel,
  getPlanLabel,
  getPreviewUrl,
  getRoleLabel,
  getStatusLabel,
  getTagLabel,
} from "./admin.helpers";

type AdminPostsSectionProps = {
  posts: IngestedPost[];
  state: "idle" | "loading" | "ready" | "error";
  onDeletePost: (id: number) => Promise<void>;
  telegramUserId: string | null;
};

export function AdminPostsSection({
  posts,
  state,
  onDeletePost,
  telegramUserId,
}: AdminPostsSectionProps) {
  const [, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "pending" | "blocked"
  >("all");

  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingChannel, setDeletingChannel] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesQuery = q ? buildSearchText(post).includes(q) : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (post.status || "published") === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [posts, query, statusFilter]);

  const toggleExpanded = (id: number) => {
    setExpandedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить пост?")) return;

    try {
      setDeletingId(id);
      await onDeletePost(id);
    } finally {
      setDeletingId(null);
    }
  };

  // 🔥 УДАЛЕНИЕ КАНАЛА ЦЕЛИКОМ
  const handleDeleteChannel = async (handle: string) => {
    if (!telegramUserId) return;

    if (!window.confirm(`УДАЛИТЬ ВСЕ ПОСТЫ И КАНАЛ @${handle}?`)) return;

    try {
      setDeletingChannel(handle);

      // 1. удалить source (даже если он “битый”)
      await fetch("/api/admin-posts", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          handle,
        }),
      });

      // 2. удалить ВСЕ посты этого канала
      const channelPosts = posts.filter(
        (p) => p.source.handle === handle
      );

      for (const post of channelPosts) {
        await onDeletePost(post.id);
      }

    } finally {
      setDeletingChannel(null);
    }
  };

  return (
    <AdminSectionCard title="Посты" subtitle="Все посты, TTL, статусы и детали.">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск..."
        className="mb-4 w-full rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white"
      />

      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const handle = post.source.handle;
          const isDeleting = deletingId === post.id;
          const isDeletingChannelNow = deletingChannel === handle;

          return (
            <div key={post.id} className="rounded-2xl border border-white/10 p-3">

              <div className="text-lg font-semibold">
                {post.source.title}
              </div>
              <div className="text-sm text-white/50">
                @{handle}
              </div>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => handleDelete(post.id)}
                  className="bg-red-500 px-3 py-2 rounded"
                >
                  удалить пост
                </button>

                {/* 🔥 НОВАЯ КНОПКА */}
                <button
                  onClick={() => handleDeleteChannel(handle)}
                  disabled={isDeletingChannelNow}
                  className="bg-orange-500 px-3 py-2 rounded"
                >
                  {isDeletingChannelNow
                    ? "удаляю канал..."
                    : "удалить канал"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </AdminSectionCard>
  );
}