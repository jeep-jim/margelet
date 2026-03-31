import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedMediaCardProps } from "./feed.types";
import { FeedCarousel } from "./FeedCarousel";
import { normalizeMediaList } from "./feed.utils";

function formatDuration(seconds?: number | null) {
  if (!seconds || !Number.isFinite(seconds)) return null;

  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FeedMediaCard({
  post,
  onOpen,
  mediaIndex,
  onChangeMediaIndex,
  isCardVisible = false,
}: FeedMediaCardProps) {
  const media = normalizeMediaList(post);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);

  const activeItem =
    media[Math.min(mediaIndex, Math.max(media.length - 1, 0))] || null;

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;
    node.muted = muted;
  }, [muted, mediaIndex, post.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (activeItem?.kind !== "video") return;

    if (isCardVisible) {
      node.currentTime = node.currentTime || 0;
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [isCardVisible, activeItem?.kind, mediaIndex, post.id]);

  const handleOpen = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    onOpen();
  };

  return (
    <div className="relative">
      <FeedCarousel
        items={media}
        displayText={post.text}
        aspectClass="aspect-[4/5]"
        activeIndex={mediaIndex}
        onChange={onChangeMediaIndex}
        controlsTone="light"
        mediaActive={isCardVisible}
        muted={muted}
        videoRef={videoRef}
      />

      {activeItem?.kind === "video" ? (
        <>
          {formatDuration(activeItem.duration) ? (
            <div className="absolute bottom-3 left-3 z-20 rounded-full bg-black/60 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
              {formatDuration(activeItem.duration)}
            </div>
          ) : null}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMuted((prev) => !prev);
            }}
            className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
            aria-label={muted ? "Включить звук" : "Выключить звук"}
          >
            {muted ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        </>
      ) : null}

      <button
        type="button"
        onClick={handleOpen}
        className="absolute inset-0 z-10"
        aria-label="Открыть пост"
      />
    </div>
  );
}