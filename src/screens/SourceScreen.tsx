import { Bell, ChevronDown, Star } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMessages } from "../lib/i18n";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import { FeedCard } from "./feed/FeedCard";
import { FeedViewer } from "./feed/FeedViewer";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import type { ViewerDirection } from "./feed/feed.types";
import type { Locale, IngestedPost } from "../types/app";

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
const SAVED_POST_IDS_FALLBACK: number[] = [];

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

function getPostIdFromUrl(postUrl: string) {
  return postUrl.split("/").filter(Boolean).pop() || "";
}

function hasVisualPost(post: IngestedPost) {
  return post.contentType === "video";
}

export function SourceScreen({
  locale,
  posts,
  sourceHandle,
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

  const viewerPosts = useMemo(() => {
    return sourcePosts.filter(hasVisualPost);
  }, [sourcePosts]);

  const source = sourcePosts[0];

  const [subscribed, setSubscribed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);

  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>({});

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);

  const [viewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
  const [videoProgress] = useState(0);

  const routeHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!source?.source.handle) return;
    setSubscribed(getSubs().includes(source.source.handle));
  }, [source?.source.handle]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sourceHandle]);

  const closeOpenedPost = useCallback(() => {
    setViewerIndex(null);
    setTextReaderPost(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");

    if (source?.source.handle) {
      routeHandledRef.current = null;
      window.history.replaceState({}, document.title, `/${source.source.handle}`);
    }
  }, [source?.source.handle]);  

  const openPostInsideSource = useCallback(
    (post: IngestedPost, updateUrl = true) => {
      if (updateUrl) {
        const postId = getPostIdFromUrl(post.postUrl);
        window.history.replaceState(
          {},
          document.title,
          `/${post.source.handle}/${postId}`
        );
        routeHandledRef.current = `${post.source.handle}/${postId}`;
      }

      setMenuPostId(null);
      setActionError("");
      setExpandedCaption(false);

      if (hasVisualPost(post)) {
        const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
        if (nextIndex === -1) return;

        setTextReaderPost(null);
        setViewerIndex(nextIndex);
        setViewerMediaIndex(0);
        setIsPlaying(true);
        return;
      }

      setViewerIndex(null);
      setViewerMediaIndex(0);
      setTextReaderPost(post);
    },
    [viewerPosts]
  );  

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerIndex((viewerIndex + 1) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");
  }, [viewerIndex, viewerPosts.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerIndex((viewerIndex - 1 + viewerPosts.length) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");
  }, [viewerIndex, viewerPosts.length]);

  useEffect(() => {
    if (!sourceHandle || sourcePosts.length === 0) return;

    const clean = window.location.pathname.replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);

    if (parts.length !== 2) return;
    if (parts[0] !== sourceHandle) return;

    const routeKey = `${parts[0]}/${parts[1]}`;
    if (routeHandledRef.current === routeKey) return;

    const matchedPost = sourcePosts.find(
      (post) => getPostIdFromUrl(post.postUrl) === parts[1]
    );

    if (!matchedPost) return;

    routeHandledRef.current = routeKey;
    openPostInsideSource(matchedPost, false);
  }, [openPostInsideSource, sourceHandle, sourcePosts]);

  if (!sourceHandle) {
    return null;
  }

  if (posts.length === 0) {
    return null;
  }

  if (!source) {
    return (
      <div className="min-h-screen bg-app pt-[76px] text-primary">
        <div className="mx-auto max-w-[570px] px-4 pb-10">
          <div className="text-lg font-semibold">{t.source.notFound}</div>
        </div>
      </div>
    );
  }  

  const totalMedia = sourcePosts.filter((post) => post.media.length > 0).length;
  const totalVideos = sourcePosts.filter((post) => post.contentType === "video").length;
  const activeViewerPost =
    viewerIndex === null ? null : viewerPosts[viewerIndex] || null;

  const openTelegramSource = () => {
    window.open(`https://t.me/${source.source.handle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-app pt-[76px] text-primary">
      <div className="mx-auto max-w-[570px] px-4 pb-10">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-soft bg-surface p-5">
          <button
            type="button"
            onClick={() => openSource(source.source.handle)}
            className="flex w-full min-w-0 items-start gap-4 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-soft text-xs font-bold text-primary">
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

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="inline-flex max-w-full items-center gap-1">
                <span className="truncate text-[18px] font-semibold leading-tight text-primary">
                  {source.source.title}
                </span>
                {source.source.verified ? (
                  <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="mt-1 truncate text-[14px] text-secondary">
                @{source.source.handle}
              </div>
            </div>
          </button>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.posts}
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourcePosts.length}</div>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.video}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalVideos}</div>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.media}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalMedia}</div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setInfoOpen((prev) => !prev)}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-soft bg-surface-soft px-4 text-[14px] font-medium text-primary"
            >
              <span>{t.feed.openChannel}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  infoOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setDonateOpen((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${donateOpen ? "border-transparent bg-accent text-accent-foreground" : "border-soft bg-surface-soft text-primary hover:bg-app"}`}
                aria-label="Поддержать канал"
                title="Поддержать канал"
              >
                <Star
                  className={`h-5 w-5 ${donateOpen ? "fill-current" : ""}`}
                />
              </button>

              <button
                onClick={() => {
                  const next = toggleSub(source.source.handle);
                  setSubscribed(next.includes(source.source.handle));
                  window.dispatchEvent(new Event("storage"));
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${subscribed ? "border-transparent bg-accent text-accent-foreground" : "border-soft bg-surface-soft text-secondary hover:bg-app"}`}
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
                  className={`h-5 w-5 ${subscribed ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          {infoOpen ? (
            <div className="mt-4 text-sm leading-7 text-secondary">
              <div className="max-w-none">
                В ленте показываются последние посты канала за 24 часа. Полная
                информация доступна в Telegram. Нажмите кнопку «Открыть канал»,
                чтобы перейти в источник.
              </div>

              <button
                onClick={openTelegramSource}
                className="mt-4 inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full border border-soft bg-surface-soft px-4 text-[13px] font-medium leading-none text-primary transition hover:bg-app sm:text-sm"
                type="button"
              >
                <span>{t.feed.openChannel}</span>
              </button>
            </div>
          ) : null}

          {donateOpen ? (
            <div className="mt-4 rounded-2xl bg-surface-soft px-4 py-3 text-sm leading-6 text-secondary">
              Скоро здесь появится возможность поддержать канал донатом.
            </div>
          ) : null}
        </section>

        <div className="-mx-4 overflow-hidden">
          {sourcePosts.map((post) => {
            const ownerTelegramId = post.addedBy?.telegramId ?? null;

            const isOwner =
              !!currentTelegramUserId &&
              !!ownerTelegramId &&
              currentTelegramUserId === ownerTelegramId;

            const isAdmin = currentTelegramUserId === "1372669404";

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
                onOpen={() => openPostInsideSource(post, true)}
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

      <FeedViewer
        locale={locale}
        activePost={activeViewerPost}
        viewerDirection={viewerDirection}
        expandedCaption={expandedCaption}
        setExpandedCaption={setExpandedCaption}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        copySuccessId={copySuccessId}
        menuPostId={menuPostId}
        setMenuPostId={setMenuPostId}
        actionError={actionError}
        videoProgress={videoProgress}
        viewerMediaIndex={viewerMediaIndex}
        setViewerMediaIndex={setViewerMediaIndex}
        likedPostIds={likedPostIds}
        savedPostIds={SAVED_POST_IDS_FALLBACK}
        onToggleLike={onToggleLike}
        onToggleSave={() => {}}
        onHidePost={onHidePost}
        onDeletePost={onDeletePost}
        currentTelegramUserId={currentTelegramUserId}
        openSource={openSource}
        closeViewer={closeOpenedPost}
        nextViewer={nextViewer}
        prevViewer={prevViewer}
        handleShare={async () => {}}
        setActionError={setActionError}
      />

      <FeedTextReaderModal
        post={textReaderPost}
        locale={locale}
        liked={!!textReaderPost && likedPostIds.includes(textReaderPost.id)}
        saved={false}
        onClose={closeOpenedPost}
        onToggleLike={onToggleLike}
        onToggleSave={() => {}}
      />
    </div>
  );
}