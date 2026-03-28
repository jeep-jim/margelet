import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { PostMedia } from "../../types/app";
import { HORIZONTAL_SWIPE_DISTANCE } from "./feed.constants";

export function FeedMediaSlide({
  item,
  displayText,
  className = "",
  active = true,
  muted = true,
  videoRef,
}: {
  item: PostMedia;
  displayText: string;
  className?: string;
  active?: boolean;
  muted?: boolean;
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
}) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const attachVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      localVideoRef.current = node;
      if (videoRef) {
        videoRef.current = node;
      }
    },
    [videoRef]
  );

  useEffect(() => {
    if (item.type !== "video") return;

    const node = localVideoRef.current;
    if (!node) return;

    node.muted = muted;

    if (active) {
      const playPromise = node.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [active, muted, item.type, item.url]);

  if (item.type === "video") {
    return (
      <video
        ref={attachVideoRef}
        src={item.url}
        poster={item.poster || undefined}
        className={className || "absolute inset-0 h-full w-full object-cover"}
        muted={muted}
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <img
      src={item.url}
      alt={displayText}
      className={className || "absolute inset-0 h-full w-full object-cover"}
      referrerPolicy="no-referrer"
    />
  );
}

export function MediaDots({
  total,
  activeIndex,
  onSelect,
  light = false,
}: {
  total: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  light?: boolean;
}) {
  if (total <= 1) return null;

  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect?.(index);
            }}
            className={`h-2.5 rounded-full transition-all ${
              active
                ? light
                  ? "w-5 bg-white"
                  : "w-5 bg-neutral-950"
                : light
                  ? "w-2.5 bg-white/45"
                  : "w-2.5 bg-neutral-950/35"
            }`}
            aria-label={`Переключить медиа ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

export function FeedCarousel({
  items,
  displayText,
  aspectClass,
  activeIndex,
  onChange,
  controlsTone = "light",
  mediaActive = true,
  muted = true,
  videoRef,
}: {
  items: PostMedia[];
  displayText: string;
  aspectClass: string;
  activeIndex: number;
  onChange: (next: number) => void;
  controlsTone?: "light" | "dark";
  mediaActive?: boolean;
  muted?: boolean;
  videoRef?: MutableRefObject<HTMLVideoElement | null>;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;
  const current = items[activeIndex];

  return (
    <div
      className={`relative ${aspectClass} w-full overflow-hidden bg-neutral-200`}
      onTouchStart={(event) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartXRef.current;
        const endX = event.changedTouches[0]?.clientX ?? null;
        touchStartXRef.current = null;

        if (startX === null || endX === null) return;

        const delta = endX - startX;
        if (delta <= -HORIZONTAL_SWIPE_DISTANCE && canNext) {
          onChange(activeIndex + 1);
        }
        if (delta >= HORIZONTAL_SWIPE_DISTANCE && canPrev) {
          onChange(activeIndex - 1);
        }
      }}
    >
      <FeedMediaSlide
        item={current}
        displayText={displayText}
        className="absolute inset-0 h-full w-full object-cover"
        active={current.type === "video" ? mediaActive : true}
        muted={muted}
        videoRef={current.type === "video" ? videoRef : undefined}
      />

      {canPrev ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(activeIndex - 1);
          }}
          className={`absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light" ? "bg-black/35 text-white" : "bg-white/85 text-neutral-900"
          }`}
          aria-label="Предыдущее медиа"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : null}

      {canNext ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange(activeIndex + 1);
          }}
          className={`absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light" ? "bg-black/35 text-white" : "bg-white/85 text-neutral-900"
          }`}
          aria-label="Следующее медиа"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <MediaDots
        total={items.length}
        activeIndex={activeIndex}
        onSelect={onChange}
        light={controlsTone === "light"}
      />
    </div>
  );
}
