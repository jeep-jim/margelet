import { useCallback, useMemo, useState } from "react";
import type { ContentTag, FeedTag, IngestedPost } from "../types/app";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
import { ADMIN_TELEGRAM_IDS } from "./feed/feed.constants";
import type { FeedMode, ViewerDirection } from "./feed/feed.types";
import {
  getResolvedTag,
  getDisplayText,
  buildShareUrl,
} from "./feed/feed.utils";

function isRealVideoPost(post: IngestedPost) {
  return post.contentType === "video" || post.media.some((item) => item.kind === "video");
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
}: {
  locale: "ru" | "en";
  posts: IngestedPost[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);
  const [viewerDirection, setViewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [feedMode, setFeedMode] = useState<FeedMode>("new");
  const [activeTag, setActiveTag] = useState<FeedTag>("all");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>({});
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

  const preferredTags = useMemo(() => {
    const source = posts.filter(
      (post) => likedPostIds.includes(post.id) || savedPostIds.includes(post.id)
    );

    const counts = new Map<ContentTag, number>();

    source.forEach((post) => {
      const tag = getResolvedTag(post);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [posts, likedPostIds, savedPostIds]);

  const visiblePosts = useMemo(() => {
    let list = [...posts];

    if (activeTag !== "all") {
      list = list.filter((post) => getResolvedTag(post) === activeTag);
    }

    if (feedMode === "new") {
      list.sort((a, b) => b.id - a.id);
      return list;
    }

    if (feedMode === "trending") {
      list.sort((a, b) => {
        const aScore =
          (likedPostIds.includes(a.id) ? 2 : 0) +
          (savedPostIds.includes(a.id) ? 3 : 0) +
          a.media.length;

        const bScore =
          (likedPostIds.includes(b.id) ? 2 : 0) +
          (savedPostIds.includes(b.id) ? 3 : 0) +
          b.media.length;

        return bScore - aScore;
      });

      return list;
    }

    list.sort((a, b) => {
      const aTag = getResolvedTag(a);
      const bTag = getResolvedTag(b);

      const aScore =
        (likedPostIds.includes(a.id) ? 6 : 0) +
        (savedPostIds.includes(a.id) ? 8 : 0) +
        (preferredTags.includes(aTag) ? 4 : 0) +
        a.media.length;

      const bScore =
        (likedPostIds.includes(b.id) ? 6 : 0) +
        (savedPostIds.includes(b.id) ? 8 : 0) +
        (preferredTags.includes(bTag) ? 4 : 0) +
        b.media.length;

      return bScore - aScore;
    });

    return list;
  }, [posts, activeTag, feedMode, likedPostIds, savedPostIds, preferredTags]);

  const viewerPosts = useMemo(() => {
    return visiblePosts.filter((post) => isRealVideoPost(post));
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
      setIsMuted(true);
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
    setIsMuted(true);
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
    setIsMuted(true);
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
    setIsMuted(true);
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
          title: post.source.title,
          text: getDisplayText(post),
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

  return (
    <div className="min-h-screen bg-neutral-50 pt-16 text-neutral-950">
      <FeedHeader
        feedMode={feedMode}
        setFeedMode={setFeedMode}
        activeTag={activeTag}
        setActiveTag={setActiveTag}
        tagsOpen={tagsOpen}
        setTagsOpen={setTagsOpen}
      />

      {actionError ? (
        <div className="mx-auto mb-3 w-full max-w-[720px] px-4">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[720px]">
        {visiblePosts.map((post) => {
          const isOwner =
            !!currentTelegramUserId &&
            !!post.addedBy.telegramId &&
            currentTelegramUserId === post.addedBy.telegramId;

          const isAdmin =
            !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

          const shouldOpenViewer = isRealVideoPost(post);

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
              onOpen={() => {
                if (shouldOpenViewer) {
                  openViewerByPost(post);
                } else {
                  openTextReader(post);
                }
              }}
              onOpenCreator={() => openSource(post.source.handle)}
              mediaIndex={feedMediaIndexes[post.id] || 0}
              onChangeMediaIndex={(next: number) => setFeedCardMediaIndex(post.id, next)}
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