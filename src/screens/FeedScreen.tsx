import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContentTag, FeedTag, Video } from "../types/app";
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
  parseDurationToSeconds,
  normalizeMediaList,
} from "./feed/feed.utils";

function isRealVideoPost(video: Video) {
  return video.mediaKind === "video";
}

export function FeedScreen({
  locale,
  videos,
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
  videos: Video[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (channel: string) => void;
}) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderVideo, setTextReaderVideo] = useState<Video | null>(null);
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
    const source = videos.filter(
      (video) =>
        likedPostIds.includes(video.id) || savedPostIds.includes(video.id)
    );

    const counts = new Map<ContentTag, number>();

    source.forEach((video) => {
      const tag = getResolvedTag(video);
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [videos, likedPostIds, savedPostIds]);

  const visibleVideos = useMemo(() => {
    let list = [...videos];

    if (activeTag !== "all") {
      list = list.filter((video) => getResolvedTag(video) === activeTag);
    }

    if (feedMode === "new") {
      list.sort((a, b) => b.id - a.id);
      return list;
    }

    if (feedMode === "trending") {
      list.sort((a, b) => b.likes - a.likes);
      return list;
    }

    list.sort((a, b) => {
      const aTag = getResolvedTag(a);
      const bTag = getResolvedTag(b);

      const aScore =
        a.likes * 1.2 +
        (likedPostIds.includes(a.id) ? 6 : 0) +
        (savedPostIds.includes(a.id) ? 8 : 0) +
        (preferredTags.includes(aTag) ? 4 : 0);

      const bScore =
        b.likes * 1.2 +
        (likedPostIds.includes(b.id) ? 6 : 0) +
        (savedPostIds.includes(b.id) ? 8 : 0) +
        (preferredTags.includes(bTag) ? 4 : 0);

      return bScore - aScore;
    });

    return list;
  }, [videos, activeTag, feedMode, likedPostIds, savedPostIds, preferredTags]);

  const viewerVideos = useMemo(() => {
    return visibleVideos.filter((video) => isRealVideoPost(video));
  }, [visibleVideos]);

  const activeVideo = useMemo(() => {
    if (viewerIndex === null) return null;
    return viewerVideos[viewerIndex] ?? null;
  }, [viewerIndex, viewerVideos]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const activeVideoMedia = useMemo(() => {
    return activeVideo ? normalizeMediaList(activeVideo) : [];
  }, [activeVideo]);

  const activeViewerMedia =
    activeVideoMedia[Math.min(viewerMediaIndex, Math.max(activeVideoMedia.length - 1, 0))] ||
    null;

  const setFeedCardMediaIndex = useCallback((videoId: number, nextIndex: number) => {
    setFeedMediaIndexes((prev) => ({
      ...prev,
      [videoId]: Math.max(0, nextIndex),
    }));
  }, []);

  const openViewerByVideo = useCallback(
    (video: Video) => {
      const nextIndex = viewerVideos.findIndex((item) => item.id === video.id);
      if (nextIndex === -1) return;

      setTextReaderVideo(null);
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
    [viewerVideos]
  );

  const openTextReader = useCallback((video: Video) => {
    setViewerIndex(null);
    setTextReaderVideo(video);
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
    if (viewerIndex === null || viewerVideos.length === 0) return;
    setViewerDirection("next");
    setViewerIndex((viewerIndex + 1) % viewerVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerVideos.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerVideos.length === 0) return;
    setViewerDirection("prev");
    setViewerIndex((viewerIndex - 1 + viewerVideos.length) % viewerVideos.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsMuted(true);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerVideos.length]);

  const handleShare = async (video: Video) => {
    const shareUrl = buildShareUrl(video);

    try {
      if (navigator.share) {
        await navigator.share({
          title: video.channel,
          text: getDisplayText(video, locale),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setCopySuccessId(video.id);
      window.setTimeout(() => {
        setCopySuccessId((prev) => (prev === video.id ? null : prev));
      }, 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccessId(video.id);
        window.setTimeout(() => {
          setCopySuccessId((prev) => (prev === video.id ? null : prev));
        }, 1600);
      } catch {
        // ignore
      }
    }
  };

  const handleDelete = async (video: Video) => {
    try {
      setActionError("");
      await onDeletePost(video.id);
      setMenuPostId(null);

      if (activeVideo?.id === video.id) {
        closeViewer();
      }
      if (textReaderVideo?.id === video.id) {
        setTextReaderVideo(null);
      }
    } catch (error: any) {
      setActionError(String(error?.message || "Не удалось удалить пост"));
    }
  };

  const handleHide = (video: Video) => {
    setActionError("");
    onHidePost(video.id);
    setMenuPostId(null);

    if (activeVideo?.id === video.id) {
      closeViewer();
    }
    if (textReaderVideo?.id === video.id) {
      setTextReaderVideo(null);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, activeVideo?.id, viewerMediaIndex]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activeViewerMedia || activeViewerMedia.type !== "video") return;

    if (isPlaying) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  }, [isPlaying, activeVideo?.id, viewerMediaIndex, activeViewerMedia?.type]);

  useEffect(() => {
    if (activeViewerMedia?.type !== "video") {
      setIsPlaying(true);
      setIsMuted(true);
      setVideoProgress(0);
    }
  }, [activeViewerMedia?.type]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !activeViewerMedia || activeViewerMedia.type !== "video") {
      setVideoProgress(0);
      return;
    }

    const updateProgress = () => {
      const duration =
        Number.isFinite(node.duration) && node.duration > 0
          ? node.duration
          : parseDurationToSeconds(activeVideo?.duration);

      const currentTime =
        Number.isFinite(node.currentTime) && node.currentTime >= 0
          ? node.currentTime
          : 0;

      setVideoProgress(duration > 0 ? Math.min(currentTime / duration, 1) : 0);
    };

    const handleLoadedMetadata = () => updateProgress();
    const handleTimeUpdate = () => updateProgress();
    const handleEnded = () => {
      setVideoProgress(1);
    };

    updateProgress();

    node.addEventListener("loadedmetadata", handleLoadedMetadata);
    node.addEventListener("timeupdate", handleTimeUpdate);
    node.addEventListener("ended", handleEnded);

    return () => {
      node.removeEventListener("loadedmetadata", handleLoadedMetadata);
      node.removeEventListener("timeupdate", handleTimeUpdate);
      node.removeEventListener("ended", handleEnded);
    };
  }, [activeVideo?.id, activeVideo?.duration, activeViewerMedia?.url, activeViewerMedia?.type]);

  useEffect(() => {
    const hasOverlay = viewerIndex !== null || !!textReaderVideo;
    if (!hasOverlay) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [viewerIndex, textReaderVideo]);

  useEffect(() => {
    if (viewerIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        nextViewer();
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        prevViewer();
        return;
      }

      if (event.key === "ArrowRight" && activeVideoMedia.length > 1) {
        event.preventDefault();
        setViewerMediaIndex((prev) =>
          Math.min(prev + 1, activeVideoMedia.length - 1)
        );
        return;
      }

      if (event.key === "ArrowLeft" && activeVideoMedia.length > 1) {
        event.preventDefault();
        setViewerMediaIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [viewerIndex, closeViewer, nextViewer, prevViewer, activeVideoMedia.length]);

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
        {visibleVideos.map((video) => {
          const isOwner =
            !!currentTelegramUserId &&
            !!video.addedByTelegramId &&
            currentTelegramUserId === video.addedByTelegramId;

          const isAdmin =
            !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

          const shouldOpenViewer = isRealVideoPost(video);

          return (
            <FeedCard
              key={video.id}
              video={video}
              locale={locale}
              isOwner={isOwner}
              isAdmin={isAdmin}
              menuOpen={menuPostId === video.id}
              onToggleMenu={() =>
                setMenuPostId((prev) => (prev === video.id ? null : video.id))
              }
              onDelete={() => {
                void handleDelete(video);
              }}
              onHide={() => handleHide(video)}
              onOpen={() => {
                if (shouldOpenViewer) {
                  openViewerByVideo(video);
                } else {
                  openTextReader(video);
                }
              }}
              onOpenCreator={() => openSource(video.channel)}
              mediaIndex={feedMediaIndexes[video.id] || 0}
              onChangeMediaIndex={(next: number) => setFeedCardMediaIndex(video.id, next)}
            />
          );
        })}
      </div>

      <FeedViewer
        locale={locale}
        activeVideo={activeVideo}
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
        video={textReaderVideo}
        locale={locale}
        liked={!!textReaderVideo && likedPostIds.includes(textReaderVideo.id)}
        saved={!!textReaderVideo && savedPostIds.includes(textReaderVideo.id)}
        onClose={() => setTextReaderVideo(null)}
        onToggleLike={onToggleLike}
        onToggleSave={onToggleSave}
        onShare={handleShare}
      />
    </div>
  );
}