import { useEffect, useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";
import {
  buildSearchText,
  formatDate,
  formatRemaining,
  getContentTypeLabel,
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
  countryCode: string;
};

export function AdminPostsSection({
  posts,
  state,
  onDeletePost,
  telegramUserId,
  countryCode,
}: AdminPostsSectionProps) {
  const [, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "pending" | "blocked"
  >("all");
  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);

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
    await onDeletePost(id);
  };

  const handleDeleteChannel = async (handle: string) => {
    if (!telegramUserId) return;
    if (!window.confirm(`Удалить канал @${handle} и все его посты?`)) return;

    await fetch("/api/admin-posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "sources",
        telegramUserId,
        handle,
        countryCode,
      }),
    });

    const channelPosts = posts.filter((post) => post.source.handle === handle);

    for (const post of channelPosts) {
      await onDeletePost(post.id);
    }
  };

  return (
    <AdminSectionCard
      title="🎈 Посты"
      subtitle="Список постов по стране."
      collapsible
      defaultCollapsed
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {filteredPosts.length} posts
        </div>
      }
    >
      <div className="mb-3 flex flex-wrap gap-2">
        {[
          { value: "all", label: "Все" },
          { value: "published", label: "Опубликованные" },
          { value: "pending", label: "На проверке" },
          { value: "blocked", label: "Заблокированные" },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() =>
              setStatusFilter(item.value as "all" | "published" | "pending" | "blocked")
            }
            className={`rounded-full px-4 py-2 text-sm transition ${
              statusFilter === item.value
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск по каналу, ссылке, пользователю, тексту..."
        className="mb-4 w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filteredPosts.map((post) => {
          const status = post.status || "published";
          const isExpanded = expandedPostIds.includes(post.id);
          const preview = getPreviewUrl(post);

          return (
            <div
              key={post.id}
              className="rounded-3xl border border-white/10 bg-[#12131a] p-3"
            >
              <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-black/30">
                  {preview ? (
                    <img
                      src={preview}
                      alt={post.source.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-white/25">
                      no preview
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {post.source.title}
                      </div>
                      <div className="truncate text-xs text-white/45">@{post.source.handle}</div>
                    </div>

                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      {getStatusLabel(status)}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      {getContentTypeLabel(post.contentType)}
                    </div>
                    <div className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/75">
                      {getTagLabel(post.tag)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/45">
                <div>
                  <div className="uppercase tracking-[0.16em] text-white/30">Created</div>
                  <div className="mt-1 text-white/75">{formatDate(post.createdAt)}</div>
                </div>
                <div>
                  <div className="uppercase tracking-[0.16em] text-white/30">TTL</div>
                  <div className="mt-1 text-white/75">{formatRemaining(post.expiresAt)}</div>
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
                    void handleDeleteChannel(post.source.handle);
                  }}
                  className="rounded-full bg-orange-500/90 px-3 py-1.5 text-xs text-white"
                >
                  delete channel
                </button>

                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"
                >
                  open
                </a>

                <button
                  type="button"
                  onClick={() => toggleExpanded(post.id)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"
                >
                  {isExpanded ? "hide" : "details"}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-2 text-xs text-white/75 md:grid-cols-2">
                    <div>ID: {post.id}</div>
                    <div>URL: {post.postUrl}</div>
                    <div>Статус: {getStatusLabel(status)}</div>
                    <div>Роль: {getRoleLabel(post.role)}</div>
                    <div>TTL: {post.ttlHours} ч</div>
                    <div>Media count: {post.media.length}</div>
                    <div>Fallback: {post.fallbackReason || "—"}</div>
                    <div>Updated: {formatDate(post.mediaRefreshedAt || post.createdAt)}</div>
                  </div>

                  {post.text ? (
                    <div className="mt-3 line-clamp-6 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                      {post.text}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredPosts.length === 0 && state === "ready" ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
            ничего не найдено
          </div>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}
