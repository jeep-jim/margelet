import { Bell, ChevronDown, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMessages } from "../lib/i18n";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import { FeedCard } from "./feed/FeedCard";
import type { Locale } from "../types/app";
import type { IngestedPost } from "../types/app";

type Props = {
  locale: Locale;
  posts: IngestedPost[];
  sourceHandle: string | null;
  onBack: () => void;
  onOpenPost: (post: IngestedPost) => void;
  likedPostIds: number[];
  onToggleLike: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
};

const SUB_KEY = "margelet_subscriptions";
const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);

  const next = exists ? current.filter((h) => h !== handle) : [...current, handle];

  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

export function SourceScreen({
  locale,
  posts,
  sourceHandle,
  onOpenPost,
  likedPostIds,
  onToggleLike,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
}: Props) {
  const t = getMessages(locale);

  const sourcePosts = useMemo(() => {
    return posts
      .filter((post) => post.source.handle === sourceHandle)
      .sort((a, b) => b.id - a.id);
  }, [posts, sourceHandle]);

  const source = sourcePosts[0];

  const [subscribed, setSubscribed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!source?.source.handle) return;
    setSubscribed(getSubs().includes(source.source.handle));
  }, [source?.source.handle]);

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 pt-[76px] text-neutral-950">
        <div className="mx-auto max-w-[570px] px-4 pb-10">
          <div className="text-lg font-semibold">{t.source.notFound}</div>
        </div>
      </div>
    );
  }

  const totalMedia = sourcePosts.filter((post) => post.media.length > 0).length;
  const totalVideos = sourcePosts.filter((post) => post.contentType === "video").length;

  const openTelegramSource = () => {
    window.open(`https://t.me/${source.source.handle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-[76px] text-neutral-950">
      <div className="mx-auto max-w-[570px] px-4 pb-10">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5">
          <button
            type="button"
            onClick={() => openSource(source.source.handle)}
            className="flex w-full min-w-0 items-start gap-4 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-bold text-neutral-900">
              {source.source.avatar ? (
                <img
                  src={source.source.avatar}
                  alt={source.source.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                String(source.source.title || "TG").slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1 pr-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <div className="min-w-0 flex-1 truncate whitespace-nowrap text-[18px] font-semibold leading-tight text-neutral-950">
                  {source.source.title}
                </div>

                {source.source.verified ? (
                  <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="mt-1 truncate text-[14px] text-neutral-500">
                @{source.source.handle}
              </div>
            </div>
          </button>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.posts}
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourcePosts.length}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.video}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalVideos}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.media}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalMedia}</div>
            </div>
          </div>

          <div className="mt-5 flex w-full items-center gap-3">
            <button
              onClick={openTelegramSource}
              className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-neutral-950 px-4 text-[13px] font-medium leading-none text-white sm:text-sm"
              type="button"
            >
              <span>{t.feed.openChannel}</span>
            </button>

            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-950"
              aria-label="Информация"
              title="Информация"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  infoOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDonateOpen((prev) => !prev)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-950"
                aria-label="Поддержать канал"
                title="Поддержать канал"
              >
                <Star className="h-5 w-5" />
              </button>

              <button
                onClick={() => {
                  const next = toggleSub(source.source.handle);
                  setSubscribed(next.includes(source.source.handle));
                  window.dispatchEvent(new Event("storage"));
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100"
                type="button"
                aria-label={
                  subscribed
                    ? t.source.disableNotifications
                    : t.source.enableNotifications
                }
                title={
                  subscribed
                    ? t.source.disableNotifications
                    : t.source.enableNotifications
                }
              >
                <Bell
                  className={`h-5 w-5 ${
                    subscribed
                      ? "fill-neutral-950 text-neutral-950"
                      : "text-neutral-400"
                  }`}
                />
              </button>
            </div>
          </div>

          {infoOpen ? (
            <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-700">
              В ленте показываются последние посты канала за 24 часа, полная
              информация доступ в Telegram нажмите кнопку "Открыть канал" чтобы
              перейти в источник.
            </div>
          ) : null}

          {donateOpen ? (
            <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-700">
              Скоро здесь появится возможность поддержать канал донатом.
            </div>
          ) : null}
        </section>

        <div className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white">
          {sourcePosts.map((post) => {
            const ownerTelegramId = post.addedBy?.telegramId ?? null;

            const isOwner =
              !!currentTelegramUserId &&
              !!ownerTelegramId &&
              currentTelegramUserId === ownerTelegramId;

            const isAdmin =
              !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

            return (
              <FeedCard
                key={post.id}
                post={post}
                locale={locale}
                isOwner={isOwner}
                isAdmin={isAdmin}
                menuOpen={menuPostId === post.id}
                onToggleMenu={() =>
                  setMenuPostId((prev) => (prev === post.id ? null : post.id))
                }
                onDelete={() => {
                  void onDeletePost(post.id);
                }}
                onHide={() => onHidePost(post.id)}
                onOpen={() => onOpenPost(post)}
                onOpenCreator={() => openSource(post.source.handle)}
                mediaIndex={feedMediaIndexes[post.id] || 0}
                onChangeMediaIndex={(next: number) =>
                  setFeedMediaIndexes((prev) => ({
                    ...prev,
                    [post.id]: Math.max(0, next),
                  }))
                }
                liked={likedPostIds.includes(post.id)}
                onToggleLike={() => onToggleLike(post.id)}
                onShare={() => {}}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}