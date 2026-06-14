import { useEffect, useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";
import {
  buildSearchText,
  formatDate,
  formatRemaining,
  getContentTypeLabel,
  getPreviewUrl,
  getTagLabel,
} from "./admin.helpers";

type AdminPostsSectionProps = {
  posts: IngestedPost[];
  state: "idle" | "loading" | "ready" | "error";
  onDeletePost: (id: number) => Promise<void>;
  onDeleteMultiplePosts?: (ids: number[]) => Promise<void>;
  telegramUserId: string | null;
  countryCode: string;
};

export function AdminPostsSection({
  posts,
  state,
  onDeletePost,
  onDeleteMultiplePosts,
  telegramUserId,
  countryCode,
}: AdminPostsSectionProps) {
  const [, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);
  const [selectedPostIds, setSelectedPostIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((post) => (q ? buildSearchText(post).includes(q) : true));
  }, [posts, query]);

  const toggleExpanded = (id: number) => {
    setExpandedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelect = (id: number) => {
    setSelectedPostIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPostIds.size === filteredPosts.length) {
      setSelectedPostIds(new Set());
    } else {
      setSelectedPostIds(new Set(filteredPosts.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPostIds.size === 0) return;
    if (!window.confirm(`Удалить ${selectedPostIds.size} постов?`)) return;

    if (onDeleteMultiplePosts) {
      await onDeleteMultiplePosts(Array.from(selectedPostIds));
    } else {
      for (const id of selectedPostIds) {
        await onDeletePost(id);
      }
    }
    setSelectedPostIds(new Set());
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить пост?")) return;
    await onDeletePost(id);
    setSelectedPostIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const handleBlockChannel = async (handle: string) => {
    if (!telegramUserId) return;
    if (!window.confirm(`Заблокировать @${handle} навсегда и убрать его посты?`)) return;

    const channelPosts = posts.filter((post) => post.source.handle === handle);

    await fetch("/api/admin-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "posts",
        action: "bulk-delete-posts-and-sources",
        telegramUserId,
        countryCode,
        postIds: channelPosts.map((post) => post.id),
        sources: [{ handle, countryCode }],
      }),
    });

    for (const post of channelPosts) {
      await onDeletePost(post.id).catch(() => undefined);
    }
    setSelectedPostIds(new Set());
  };

  const isAllSelected = filteredPosts.length > 0 && selectedPostIds.size === filteredPosts.length;
  const isSomeSelected = selectedPostIds.size > 0;

  return (
    <AdminSectionCard
      title="🎈 Все посты"
      subtitle=""
      collapsible
      defaultCollapsed
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {filteredPosts.length} posts
        </div>
      }
      right={
        isSomeSelected ? (
          <button
            onClick={handleDeleteSelected}
            className="rounded-full bg-red-500/90 px-3 py-1.5 text-xs text-white transition hover:bg-red-600"
          >
            🗑️ Удалить выбранные ({selectedPostIds.size})
          </button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каналу, ссылке, пользователю, тексту..."
          className="flex-1 rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />
        
        {filteredPosts.length > 0 && (
          <button
            onClick={toggleSelectAll}
            className="rounded-full bg-white/10 px-4 py-3 text-sm text-white transition hover:bg-white/15"
          >
            {isAllSelected ? "Снять все" : "Выделить все"}
          </button>
        )}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {filteredPosts.map((post) => {
          const isExpanded = expandedPostIds.includes(post.id);
          const isSelected = selectedPostIds.has(post.id);
          const preview = getPreviewUrl(post);

          return (
            <div
              key={post.id}
              className={`w-full overflow-hidden rounded-[18px] border px-3 py-2 transition ${
                isSelected
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 bg-[#151722]"
              }`}
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(post.id)}
                  className="mt-3 h-4 w-4 shrink-0 rounded border-white/30 bg-transparent accent-blue-500"
                />
                
                <button
                  type="button"
                  onClick={() => toggleExpanded(post.id)}
                  className="flex flex-1 min-w-0 items-center justify-between gap-2 text-left"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-black/30">
                    {preview ? (
                      <img
                        src={preview}
                        alt={post.source.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-white/25">
                        no
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="truncate text-sm font-semibold text-white">
                      {post.source.title}
                    </div>
                    <div className="truncate text-xs text-white/55">
                      @{post.source.handle}
                    </div>
                  </div>

                  <div
                    className={`ml-1 shrink-0 text-white/60 transition ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▾
                  </div>
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-3 border-t border-white/10 pl-6 pt-3">
                  <div className="flex flex-wrap gap-1.5">
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      {getContentTypeLabel(post.contentType)}
                    </div>
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      {getTagLabel(post.tag)}
                    </div>
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      TTL {formatRemaining(post.expiresAt)}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/45">
                    <div>
                      <div className="uppercase tracking-[0.16em] text-white/30">
                        Created
                      </div>
                      <div className="mt-1 text-white/75">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase tracking-[0.16em] text-white/30">
                        TTL
                      </div>
                      <div className="mt-1 text-white/75">
                        {formatRemaining(post.expiresAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        void handleDelete(post.id);
                      }}
                      className="rounded-full bg-red-500/90 px-3 py-1.5 text-xs text-white"
                    >
                      delete
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void handleBlockChannel(post.source.handle);
                      }}
                      className="rounded-full bg-orange-500/90 px-3 py-1.5 text-xs text-white"
                    >
                      block channel
                    </button>

                    <a
                      href={post.postUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"
                    >
                      open
                    </a>
                  </div>

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="grid gap-2 text-xs text-white/75 md:grid-cols-2">
                      <div>ID: {post.id}</div>
                      <div className="break-all">URL: {post.postUrl}</div>
                      <div>TTL: {post.ttlHours} ч</div>
                      <div>Media count: {post.media.length}</div>
                      <div>Fallback: {post.fallbackReason || "—"}</div>
                      <div>
                        Updated:{" "}
                        {formatDate(post.mediaRefreshedAt || post.createdAt)}
                      </div>
                    </div>

                    {post.text ? (
                      <div className="mt-3 line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                        {post.text}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredPosts.length === 0 && state === "ready" ? (
          <div className="rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
            ничего не найдено
          </div>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}