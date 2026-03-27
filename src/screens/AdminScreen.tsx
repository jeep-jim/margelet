import { useEffect, useMemo, useState } from "react";
import type { Locale, Video } from "../types/app";

type AdminScreenProps = {
  locale: Locale;
  telegramUserId: string | null;
  onClose: () => void;
  onDeletePost: (id: number) => Promise<void>;
};

type LoadState = "idle" | "loading" | "ready" | "error";

const ADMIN_TELEGRAM_ID = "1372669404";

function getLocalizedText(
  value: { ru: string; en: string } | undefined,
  locale: Locale
) {
  if (!value) return "";
  return locale === "en" ? value.en || value.ru || "" : value.ru || value.en || "";
}

function buildSearchText(post: Video) {
  return [
    post.channel,
    post.handle,
    post.postUrl,
    post.addedByUsername || "",
    post.addedByTelegramId || "",
    post.tag || "",
    post.title?.ru || "",
    post.title?.en || "",
    post.caption?.ru || "",
    post.caption?.en || "",
  ]
    .join(" ")
    .toLowerCase();
}

function isTelegramMediaUrl(url?: string | null) {
  if (!url) return false;
  return /telegram|t\.me|cdn/i.test(url);
}

export function AdminScreen({
  locale,
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<Video[]>([]);
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

    loadAdminPosts();

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
      withPreview: posts.filter((post) => !!post.previewUrl).length,
      withVideo: posts.filter((post) => post.mediaType === "video").length,
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
          searchPlaceholder: "Search by channel / handle / URL / who added",
          total: "Total",
          visible: "Found",
          withPreview: "With preview",
          withVideo: "Video",
          empty: "No posts found",
          source: "Source",
          addedBy: "Added by",
          link: "Open post",
          deletePost: "Delete post",
          deleting: "Deleting...",
          media: "Media",
          preview: "Preview",
          noPreview: "No preview",
          typeVideo: "Video",
          typeImage: "Image",
          handle: "Handle",
          tgId: "Telegram ID",
          yes: "Yes",
          no: "No",
          channelVerified: "Verified",
          postId: "Post ID",
          titleLabel: "Title",
          captionLabel: "Text",
          avatarLabel: "Avatar",
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
          searchPlaceholder: "Поиск по каналу / handle / ссылке / кто добавил",
          total: "Всего",
          visible: "Найдено",
          withPreview: "С превью",
          withVideo: "Видео",
          empty: "Посты не найдены",
          source: "Источник",
          addedBy: "Добавил",
          link: "Открыть пост",
          deletePost: "Удалить пост",
          deleting: "Удаляю...",
          media: "Медиа",
          preview: "Превью",
          noPreview: "Нет превью",
          typeVideo: "Видео",
          typeImage: "Фото",
          handle: "Handle",
          tgId: "Telegram ID",
          yes: "Да",
          no: "Нет",
          channelVerified: "Верифицирован",
          postId: "ID поста",
          titleLabel: "Заголовок",
          captionLabel: "Текст",
          avatarLabel: "Аватар",
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
      <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 sm:px-6">
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
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-4 sm:px-6 sm:py-6">
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
              {strings.withPreview}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.withPreview}</div>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/45">
              {strings.withVideo}
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.withVideo}</div>
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
            const title = getLocalizedText(post.title, locale);
            const caption = getLocalizedText(post.caption, locale);
            const preview = post.previewUrl;
            const avatar = post.avatar;
            const isDeleting = deletingId === post.id;
            const avatarLooksLikeUrl =
              typeof avatar === "string" && /^https?:\/\//i.test(avatar);

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5"
              >
                <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
                  <div className="relative border-b border-white/10 bg-[#0f1117] lg:border-b-0 lg:border-r">
                    <div className="aspect-[4/5] w-full overflow-hidden bg-black/20">
                      {preview ? (
                        post.mediaType === "video" ? (
                          <video
                            src={preview}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={preview}
                            alt={title || post.channel}
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/35">
                          {strings.noPreview}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/10 p-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        {strings.media}
                      </div>
                      <div className="mt-2 text-sm text-white/85">
                        {post.mediaType === "video"
                          ? strings.typeVideo
                          : strings.typeImage}
                      </div>

                      <div className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/40">
                        {strings.preview}
                      </div>
                      <div className="mt-2 break-all text-xs text-white/55">
                        {preview || strings.noPreview}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.source}
                          </div>

                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                              {avatarLooksLikeUrl ? (
                                <img
                                  src={avatar}
                                  alt={post.channel}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white/70">
                                  {String(avatar || "TG").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-base font-semibold text-white">
                                {post.channel}
                              </div>
                              <div className="mt-1 truncate text-sm text-white/55">
                                {post.handle}
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={isDeleting}
                          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 px-5 text-sm font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDeleting ? strings.deleting : strings.deletePost}
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.postId}
                          </div>
                          <div className="mt-2 break-all text-sm text-white/85">
                            {post.id}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.handle}
                          </div>
                          <div className="mt-2 break-all text-sm text-white/85">
                            {post.handle || "—"}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.channelVerified}
                          </div>
                          <div className="mt-2 text-sm text-white/85">
                            {post.channelVerified ? strings.yes : strings.no}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.addedBy}
                          </div>
                          <div className="mt-2 break-all text-sm text-white/85">
                            {post.addedByUsername ? `@${post.addedByUsername}` : "—"}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.tgId}
                          </div>
                          <div className="mt-2 break-all text-sm text-white/85">
                            {post.addedByTelegramId || "—"}
                          </div>
                        </div>

                        <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                          <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                            {strings.avatarLabel}
                          </div>
                          <div className="mt-2 break-all text-sm text-white/85">
                            {isTelegramMediaUrl(avatar) ? avatar : avatar || "—"}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                          {strings.titleLabel}
                        </div>
                        <div className="mt-2 text-sm leading-6 text-white/90">
                          {title || "—"}
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                          {strings.captionLabel}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/78">
                          {caption || "—"}
                        </div>
                      </div>

                      <div className="rounded-[20px] border border-white/10 bg-black/10 p-4">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                          {strings.link}
                        </div>
                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noreferrer noopener nofollow"
                          className="mt-2 block break-all text-sm text-[#8ab4ff] underline underline-offset-4"
                        >
                          {post.postUrl}
                        </a>
                      </div>
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