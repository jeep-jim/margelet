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
  ]
    .join(" ")
    .toLowerCase();
}

export function AdminScreen({
  locale,
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [errorText, setErrorText] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  useEffect(() => {
    let cancelled = false;

    async function loadAdminPosts() {
      if (!telegramUserId || !hasAdminAccess) {
        setPosts([]);
        setState("ready");
        return;
      }

      try {
        setState("loading");
        setErrorText("");

        const res = await fetch("/api/admin-posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegramUserId,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load admin posts");
        }

        if (!cancelled) {
          setPosts(Array.isArray(data?.posts) ? data.posts : []);
          setState("ready");
        }
      } catch (error: any) {
        if (!cancelled) {
          setState("error");
          setErrorText(
            error?.message ||
              (locale === "en"
                ? "Failed to load admin posts"
                : "Не удалось загрузить посты для админки")
          );
        }
      }
    }

    void loadAdminPosts();

    return () => {
      cancelled = true;
    };
  }, [telegramUserId, hasAdminAccess, locale]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;

    return posts.filter((post) => buildSearchText(post).includes(q));
  }, [posts, query]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      visible: filteredPosts.length,
      withMedia: posts.filter((post) => post.media.length > 0).length,
      video: posts.filter((post) => post.contentType === "video").length,
    };
  }, [posts, filteredPosts]);

  const strings =
    locale === "en"
      ? {
          title: "Admin",
          subtitle: "Hidden moderation panel",
          back: "Back",
          accessDenied: "Access denied",
          accessDeniedText:
            "This page is available only for the allowed Telegram account.",
          loading: "Loading posts...",
          error: "Error",
          searchPlaceholder: "Search by source / handle / URL / who added",
          total: "Total",
          visible: "Found",
          withMedia: "With media",
          withVideo: "Video",
          empty: "No posts found",
          deletePost: "Delete post",
          deleting: "Deleting...",
          source: "Source",
          type: "Type",
          addedBy: "Added by",
          expiresAt: "Expires",
          open: "Open Telegram",
        }
      : {
          title: "Admin",
          subtitle: "Скрытая панель модерации",
          back: "Назад",
          accessDenied: "Доступ запрещён",
          accessDeniedText:
            "Эта страница доступна только для разрешённого Telegram аккаунта.",
          loading: "Загружаю посты...",
          error: "Ошибка",
          searchPlaceholder: "Поиск по источнику / handle / ссылке / кто добавил",
          total: "Всего",
          visible: "Найдено",
          withMedia: "С медиа",
          withVideo: "Видео",
          empty: "Посты не найдены",
          deletePost: "Удалить пост",
          deleting: "Удаляю...",
          source: "Источник",
          type: "Тип",
          addedBy: "Добавил",
          expiresAt: "Истекает",
          open: "Открыть Telegram",
        };

  const handleDelete = async (id: number) => {
    const ok = window.confirm(
      locale === "en"
        ? "Delete this post permanently?"
        : "Удалить этот пост навсегда?"
    );

    if (!ok) return;

    try {
      setDeletingId(id);
      await onDeletePost(id);
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (error: any) {
      window.alert(
        error?.message ||
          (locale === "en"
            ? "Failed to delete post"
            : "Не удалось удалить пост")
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[22px] font-semibold">{strings.title}</div>
              <div className="text-sm text-white/50">{strings.subtitle}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
            >
              {strings.back}
            </button>
          </div>

          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5">
            <div className="text-lg font-semibold text-red-200">
              {strings.accessDenied}
            </div>
            <div className="mt-2 text-sm leading-6 text-red-100/80">
              {strings.accessDeniedText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-4 text-white sm:px-6 sm:py-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[24px] font-semibold tracking-tight">
              {strings.title}
            </div>
            <div className="mt-1 text-sm text-white/50">{strings.subtitle}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 text-sm font-medium text-white/85 transition hover:bg-white/10"
          >
            {strings.back}
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:grid-cols-4">
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {strings.total}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.total}</div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {strings.visible}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.visible}</div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {strings.withMedia}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.withMedia}</div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {strings.withVideo}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.video}</div>
          </div>
        </div>

        <div className="mb-4 rounded-[24px] border border-white/10 bg-white/5 p-3 sm:mb-6 sm:p-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.searchPlaceholder}
            className="h-12 w-full rounded-[16px] border border-white/10 bg-[#11131a] px-4 text-sm text-white outline-none placeholder:text-white/35"
          />
        </div>

        {state === "loading" && (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            {strings.loading}
          </div>
        )}

        {state === "error" && (
          <div className="rounded-[24px] border border-red-500/20 bg-red-500/10 p-5">
            <div className="text-sm font-medium text-red-200">{strings.error}</div>
            <div className="mt-2 text-sm text-red-100/80">{errorText}</div>
          </div>
        )}

        {state === "ready" && filteredPosts.length === 0 && (
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 text-sm text-white/70">
            {strings.empty}
          </div>
        )}

        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const preview =
              post.media.find((item) => item.kind === "image")?.url ||
              post.media.find((item) => item.kind === "video")?.poster ||
              post.source.avatar ||
              null;

            const isDeleting = deletingId === post.id;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5"
              >
                <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="relative border-b border-white/10 bg-[#0f1117] lg:border-b-0 lg:border-r">
                    <div className="aspect-[4/5] w-full overflow-hidden bg-black/20">
                      {preview ? (
                        <img
                          src={preview}
                          alt={post.source.title}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-white/35">
                          no preview
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold">
                          {post.source.title}
                        </div>
                        <div className="truncate text-sm text-white/50">
                          @{post.source.handle}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(post.id);
                        }}
                        disabled={isDeleting}
                        className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                      >
                        {isDeleting ? strings.deleting : strings.deletePost}
                      </button>
                    </div>

                    <div className="grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                      <div>
                        <span className="text-white/45">{strings.type}: </span>
                        {post.contentType}
                      </div>
                      <div>
                        <span className="text-white/45">{strings.addedBy}: </span>
                        {post.addedBy.username || post.addedBy.telegramId || "—"}
                      </div>
                      <div>
                        <span className="text-white/45">{strings.expiresAt}: </span>
                        {new Date(post.expiresAt).toLocaleString()}
                      </div>
                      <div>
                        <span className="text-white/45">plan: </span>
                        {post.billing.plan}
                      </div>
                    </div>

                    {post.text ? (
                      <div className="mt-4 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-6 text-white/85">
                        {post.text}
                      </div>
                    ) : null}

                    <div className="mt-4">
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
                      >
                        {strings.open}
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}