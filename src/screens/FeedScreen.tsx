import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "../types/app";
import type { ContentTag, IngestedPost } from "../types/app";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
import {
  ADMIN_TELEGRAM_IDS,
  FEED_FILTER_STATE_EVENT,
  FEED_FILTER_TOGGLE_EVENT,
} from "./feed/feed.constants";
import type { ViewerDirection } from "./feed/feed.types";
import { buildShareUrl, getResolvedTag } from "./feed/feed.utils";

const SELECTED_TAGS_STORAGE_KEY = "margelet_feed_selected_tags";
const FEED_SEARCH_STORAGE_KEY = "margelet_feed_search";
const SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscriptions";

type SubscriptionBubble = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
};

type FeedScreenCopy = {
  subscriptionsHint: string;
  emptyTitle: string;
  emptyText: string;
  clearAll: string;
};

const FEED_SCREEN_COPY: Record<Locale, FeedScreenCopy> = {
  en: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
  },
  ru: {
    subscriptionsHint:
      "Здесь будут новые посты каналов, в которых включено уведомление",
    emptyTitle: "Ничего не найдено",
    emptyText: "Попробуй снять часть тегов или очистить поиск.",
    clearAll: "Очистить всё",
  },
  de: {
    subscriptionsHint:
      "Hier erscheinen neue Beiträge von Kanälen mit aktivierten Benachrichtigungen",
    emptyTitle: "Nichts gefunden",
    emptyText:
      "Versuche, einige Tags zu entfernen oder die Suche zu löschen.",
    clearAll: "Alles löschen",
  },
  es: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText:
      "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
  },
  tr: {
    subscriptionsHint:
      "Bildirimleri açık olan kanalların yeni gönderileri burada görünecek",
    emptyTitle: "Hiçbir şey bulunamadı",
    emptyText: "Bazı etiketleri kaldırmayı veya aramayı temizlemeyi dene.",
    clearAll: "Hepsini temizle",
  },
  fr: {
    subscriptionsHint:
      "Les nouvelles publications des chaînes avec notifications activées apparaîtront ici",
    emptyTitle: "Rien trouvé",
    emptyText:
      "Essaie de retirer certains tags ou d’effacer la recherche.",
    clearAll: "Tout effacer",
  },
  it: {
    subscriptionsHint:
      "Qui appariranno i nuovi post dei canali con notifiche attivate",
    emptyTitle: "Nessun risultato",
    emptyText: "Prova a rimuovere alcuni tag o a cancellare la ricerca.",
    clearAll: "Cancella tutto",
  },
  "pt-br": {
    subscriptionsHint:
      "Novos posts dos canais com notificações ativadas aparecerão aqui",
    emptyTitle: "Nada encontrado",
    emptyText: "Tente remover algumas tags ou limpar a busca.",
    clearAll: "Limpar tudo",
  },
  id: {
    subscriptionsHint:
      "Postingan baru dari kanal dengan notifikasi aktif akan muncul di sini",
    emptyTitle: "Tidak ada yang ditemukan",
    emptyText: "Coba hapus beberapa tag atau bersihkan pencarian.",
    clearAll: "Bersihkan semua",
  },
  pl: {
    subscriptionsHint:
      "Tutaj pojawią się nowe posty z kanałów z włączonymi powiadomieniami",
    emptyTitle: "Nic nie znaleziono",
    emptyText: "Spróbuj usunąć część tagów albo wyczyścić wyszukiwanie.",
    clearAll: "Wyczyść wszystko",
  },
};

function isGifPost(post: IngestedPost) {
  return (
    post.contentType === "gif" ||
    post.media.some((item) => item.mimeType?.includes("gif"))
  );
}

function isVideoViewerPost(post: IngestedPost) {
  if (isGifPost(post)) return false;
  return post.contentType === "video";
}

function readSelectedTagsFromStorage(): ContentTag[] {
  try {
    const raw = localStorage.getItem(SELECTED_TAGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ContentTag => typeof item === "string");
  } catch {
    localStorage.removeItem(SELECTED_TAGS_STORAGE_KEY);
    return [];
  }
}

function readSearchQueryFromStorage() {
  try {
    return localStorage.getItem(FEED_SEARCH_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function readSubscriptionsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string" && !!item.trim()
    );
  } catch {
    return [];
  }
}

function SubscriptionsHint({ text }: { text: string }) {
  return (
    <div className="mx-auto mb-4 mt-4 w-full max-w-[570px] px-4">
      <div className="flex items-center gap-4 rounded-[28px] border border-neutral-200 bg-white px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-neutral-950">
          <Bell className="h-5 w-5 text-neutral-950" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-950">{text}</div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionsBar({
  items,
  onOpen,
}: {
  items: SubscriptionBubble[];
  onOpen: (handle: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="mx-auto mb-4 mt-4 w-full max-w-[570px] px-4">
      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3">
          {items.map((item) => (
            <button
              key={item.handle}
              type="button"
              onClick={() => onOpen(item.handle)}
              className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 text-center"
            >
              <div className="rounded-full border-2 border-neutral-950 p-[2px]">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-200 text-xs font-bold text-neutral-800">
                      {item.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full truncate text-[11px] font-medium text-neutral-700">
                {item.title}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeedScreen({
  locale,
  posts,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
  isFeedLoading,
}: {
  locale: Locale;
  posts: IngestedPost[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
  isFeedLoading: boolean;
}) {  
  const copy = FEED_SCREEN_COPY[locale] ?? FEED_SCREEN_COPY.en;

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);
  const [viewerDirection, setViewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionHandles, setSubscriptionHandles] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>(
    {}
  );
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

useEffect(() => {
  setSelectedTags(readSelectedTagsFromStorage());
  setSearchQuery(readSearchQueryFromStorage());
  setSubscriptionHandles(readSubscriptionsFromStorage());
}, []);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_TAGS_STORAGE_KEY,
      JSON.stringify(selectedTags)
    );
  }, [selectedTags]);

  useEffect(() => {
    localStorage.setItem(FEED_SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleToggle = () => {
      setTagsOpen((prev) => !prev);
    };

    const syncSubscriptions = () => {
      setSubscriptionHandles(readSubscriptionsFromStorage());
    };

    window.addEventListener(
      FEED_FILTER_TOGGLE_EVENT,
      handleToggle as EventListener
    );
    window.addEventListener("focus", syncSubscriptions);
    window.addEventListener("storage", syncSubscriptions);

    return () => {
      window.removeEventListener(
        FEED_FILTER_TOGGLE_EVENT,
        handleToggle as EventListener
      );
      window.removeEventListener("focus", syncSubscriptions);
      window.removeEventListener("storage", syncSubscriptions);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FEED_FILTER_STATE_EVENT, {
        detail: tagsOpen,
      })
    );
  }, [tagsOpen]);

  const safePosts = useMemo(() => {
    return posts.filter(
      (post) =>
        !!post &&
        typeof post.id === "number" &&
        !!post.source &&
        typeof post.source.title === "string" &&
        typeof post.source.handle === "string" &&
        Array.isArray(post.media)
    );
  }, [posts]);

  const subscriptionBubbles = useMemo(() => {
    if (subscriptionHandles.length === 0) return [];

    const seen = new Set<string>();
    const result: SubscriptionBubble[] = [];

    for (const post of safePosts) {
      const handle = post.source.handle;
      if (!subscriptionHandles.includes(handle)) continue;
      if (seen.has(handle)) continue;

      seen.add(handle);
      result.push({
        handle,
        title: post.source.title,
        avatar: post.source.avatar,
        hasNew: true,
      });
    }

    return result;
  }, [safePosts, subscriptionHandles]);

  const visiblePosts = useMemo(() => {
    let list = [...safePosts];

    if (selectedTags.length > 0) {
      list = list.filter((post) => selectedTags.includes(getResolvedTag(post)));
    }

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((post) => {
        const haystack = [
          post.source.title,
          post.source.handle,
          post.text,
          post.postUrl,
          post.tag,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    list.sort((a, b) => b.id - a.id);
    return list;
  }, [safePosts, selectedTags, searchQuery]);

  const viewerPosts = useMemo(() => {
    return visiblePosts.filter((post) => isVideoViewerPost(post));
  }, [visiblePosts]);

  const activePost = useMemo(() => {
    if (viewerIndex === null) return null;
    return viewerPosts[viewerIndex] ?? null;
  }, [viewerIndex, viewerPosts]);

  const setFeedCardMediaIndex = useCallback((postId: number, nextIndex: number) => {
    setFeedMediaIndexes((prev) => ({
      ...prev,
      [postId]: Math.max(0, nextIndex),
    }));
  }, []);

  const openViewerByPost = useCallback(
    (post: IngestedPost) => {
      const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
      if (nextIndex === -1) return;

      setTextReaderPost(null);
      setViewerDirection(null);
      setViewerIndex(nextIndex);
      setViewerMediaIndex(0);
      setExpandedCaption(false);
      setIsPlaying(true);
      setCopySuccessId(null);
      setMenuPostId(null);
      setActionError("");
      setVideoProgress(0);
    },
    [viewerPosts]
  );

  const openTextReader = useCallback((post: IngestedPost) => {
    setViewerIndex(null);
    setTextReaderPost(post);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  }, []);

  const closeViewer = useCallback(() => {
    setViewerDirection(null);
    setViewerIndex(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("next");
    setViewerIndex((viewerIndex + 1) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("prev");
    setViewerIndex((viewerIndex - 1 + viewerPosts.length) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

  const handleShare = async (post: IngestedPost) => {
    const shareUrl = buildShareUrl(post);

    try {
      if (navigator.share) {
        await navigator.share({
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setCopySuccessId(post.id);
      window.setTimeout(() => {
        setCopySuccessId((prev) => (prev === post.id ? null : prev));
      }, 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccessId(post.id);
        window.setTimeout(() => {
          setCopySuccessId((prev) => (prev === post.id ? null : prev));
        }, 1600);
      } catch {
        //
      }
    }
  };

  const handleOpenPost = (post: IngestedPost) => {
    if (isVideoViewerPost(post)) {
      openViewerByPost(post);
      return;
    }

    openTextReader(post);
  };

  const toggleTag = (tag: ContentTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

const clearTags = () => {
  setSelectedTags([]);
};

const hasSubscriptions = subscriptionHandles.length > 0;
const hasBubbles = subscriptionBubbles.length > 0;

return (
  <div className="min-h-screen bg-neutral-50 pt-16 text-neutral-950">
    <FeedHeader
      locale={locale}
      selectedTags={selectedTags}
      toggleTag={toggleTag}
      clearTags={clearTags}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      tagsOpen={tagsOpen}
      setTagsOpen={setTagsOpen}
      resultsCount={visiblePosts.length}
    />

    {!tagsOpen && !hasSubscriptions ? (
      <SubscriptionsHint text={copy.subscriptionsHint} />
    ) : null}

    {!tagsOpen && hasSubscriptions && hasBubbles ? (
      <SubscriptionsBar
        items={subscriptionBubbles}
        onOpen={(handle) => openSource(handle)}
      />
    ) : null}

    {!tagsOpen && hasSubscriptions && !hasBubbles ? (
      <SubscriptionsHint text={copy.subscriptionsHint} />
    ) : null}      

      {actionError ? (
        <div className="mx-auto mb-3 w-full max-w-[570px] px-4">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        </div>
      ) : null}

      {!isFeedLoading && visiblePosts.length === 0 ? (
        <div className="mx-auto mt-2 w-full max-w-[570px] px-4">
          <div className="rounded-[28px] border border-neutral-200 bg-white px-5 py-8 text-center">
            <div className="text-lg font-semibold text-neutral-950">
              {copy.emptyTitle}
            </div>
            <div className="mt-2 text-sm leading-6 text-neutral-500">
              {copy.emptyText}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                clearTags();
              }}
              className="mt-4 rounded-full bg-neutral-950 px-4 py-2 text-sm text-white"
            >
              {copy.clearAll}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[570px]">
        {visiblePosts.map((post) => {
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
              onOpen={() => handleOpenPost(post)}
              onOpenCreator={() => openSource(post.source.handle)}
              mediaIndex={feedMediaIndexes[post.id] || 0}
              onChangeMediaIndex={(next: number) =>
                setFeedCardMediaIndex(post.id, next)
              }
              liked={likedPostIds.includes(post.id)}
              onToggleLike={() => onToggleLike(post.id)}
              onShare={() => {
                void handleShare(post);
              }}
            />
          );
        })}
      </div>

      <FeedViewer
        locale={locale}
        activePost={activePost}
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
        savedPostIds={savedPostIds}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onHidePost={onHidePost}
        onDeletePost={onDeletePost}
        currentTelegramUserId={currentTelegramUserId}
        openSource={openSource}
        closeViewer={closeViewer}
        nextViewer={nextViewer}
        prevViewer={prevViewer}
        handleShare={handleShare}
        setActionError={setActionError}
      />

      <FeedTextReaderModal
        post={textReaderPost}
        locale={locale}
        liked={!!textReaderPost && likedPostIds.includes(textReaderPost.id)}
        saved={!!textReaderPost && savedPostIds.includes(textReaderPost.id)}
        onClose={() => setTextReaderPost(null)}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onShare={handleShare}
      />
    </div>
  );
}