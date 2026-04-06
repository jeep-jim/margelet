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
      }),
    });

    const channelPosts = posts.filter((post) => post.source.handle === handle);

    for (const post of channelPosts) {
      await onDeletePost(post.id);
    }
  };

  return (
    <AdminSectionCard title="Посты" subtitle="Все посты, TTL, статусы и детали.">
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
                : "bg-white/10 text-white"
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
        className="mb-4 w-full rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
      />

      <div className="space-y-3">
        {filteredPosts.map((post) => {
          const status = post.status || "published";
          const isExpanded = expandedPostIds.includes(post.id);
          const preview = getPreviewUrl(post);

          return (
            <div
              key={post.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/30">
                  {preview ? (
                    <img
                      src={preview}
                      alt={post.source.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-white/25">
                      нет
                      <br />
                      превью
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[18px] font-semibold">
                        {post.source.title}
                      </div>
                      <div className="truncate text-sm text-white/50">
                        @{post.source.handle}
                      </div>
                    </div>

                    <div className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs">
                      {getStatusLabel(status)}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-1 text-xs text-white/60 sm:grid-cols-2">
                    <div>
                      Добавил: {post.addedBy.username || post.addedBy.telegramId || "—"}
                    </div>
                    <div>Тип: {getContentTypeLabel(post.contentType)}</div>
                    <div>Тег: {getTagLabel(post.tag)}</div>
                    <div>Тариф: {getPlanLabel(post.billing.plan)}</div>
                    <div>Создан: {formatDate(post.createdAt)}</div>
                    <div>Истекает: {formatDate(post.expiresAt)}</div>
                    <div>Удалится через: {formatRemaining(post.expiresAt)}</div>
                    <div>
                      Обновлён медиа: {formatDate(post.mediaRefreshedAt || post.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    void handleDelete(post.id);
                  }}
                  className="rounded-xl bg-red-500 px-3 py-2 text-sm"
                >
                  Удалить
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteChannel(post.source.handle);
                  }}
                  className="rounded-xl bg-orange-500 px-3 py-2 text-sm text-white"
                >
                  Удалить канал
                </button>

                <a
                  href={post.postUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                >
                  Открыть
                </a>

                <button
                  type="button"
                  onClick={() => toggleExpanded(post.id)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                >
                  {isExpanded ? "Скрыть детали" : "Детали"}
                </button>
              </div>

              {isExpanded ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="grid gap-2 text-sm text-white/75 md:grid-cols-2">
                    <div>ID: {post.id}</div>
                    <div>URL: {post.postUrl}</div>
                    <div>Статус: {getStatusLabel(status)}</div>
                    <div>План: {getPlanLabel(post.billing.plan)}</div>
                    <div>Роль: {getRoleLabel(post.role)}</div>
                    <div>TTL: {post.ttlHours} ч</div>
                    <div>Media count: {post.media.length}</div>
                    <div>Fallback: {post.fallbackReason || "—"}</div>
                  </div>

                  {post.text ? (
                    <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">
                      {post.text}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}

        {filteredPosts.length === 0 && state === "ready" ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/35">
            ничего не найдено
          </div>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}