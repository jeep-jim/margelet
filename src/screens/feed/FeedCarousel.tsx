import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

type CarouselItem = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  url: string;
  poster?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
};

export function MediaDots({
  total,
  activeIndex,
  onSelect,
  light = false,
}: {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  light?: boolean;
}) {
  if (total <= 1) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => {
        const active = index === activeIndex;

        return (
          <button
            key={index}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(index);
            }}
            className={`pointer-events-auto h-2.5 rounded-full transition ${
              active
                ? light
                  ? "w-5 bg-white"
                  : "w-5 bg-neutral-900"
                : light
                  ? "w-2.5 bg-white/55"
                  : "w-2.5 bg-neutral-900/35"
            }`}
            aria-label={`media ${index + 1}`}
          />
        );
      })}
    </div>
  );
}

export function FeedCarousel({
  items,
  aspectClass,
  activeIndex = 0,
  onChange,
  controlsTone = "light",
  mediaActive = false,
  muted = true,
  videoRef,
}: {
  items: CarouselItem[];
  displayText?: string;
  aspectClass: string;
  activeIndex?: number;
  onChange?: (index: number) => void;
  controlsTone?: "light" | "dark";
  mediaActive?: boolean;
  muted?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const current =
    items[Math.min(activeIndex, Math.max(items.length - 1, 0))] || null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  useEffect(() => {
    const node = videoRef?.current;
    if (!node || current?.kind !== "video") return;

    node.muted = muted;

    if (mediaActive) {
      node.currentTime = 0;
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [current?.id, current?.kind, mediaActive, muted, videoRef]);

  const mediaNode = useMemo(() => {
    if (!current) return null;

    if (current.kind === "video") {
      return (
        <video
          ref={videoRef}
          src={current.url}
          poster={current.poster || undefined}
          className="h-full w-full object-contain"
          playsInline
          preload="metadata"
          muted={muted}
          controls={false}
        />
      );
    }

    if (current.kind === "image") {
      return (
        <img
          src={current.url}
          alt=""
          className="h-full w-full object-contain"
          referrerPolicy="no-referrer"
        />
      );
    }

    if (current.kind === "audio") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 px-4">
          <audio src={current.url} controls className="w-full max-w-[420px]" preload="metadata" />
        </div>
      );
    }

    if (current.kind === "file") {
      return (
        <div className="flex h-full w-full items-center justify-center bg-neutral-100 px-4">
          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
          >
            {current.fileName || "Открыть файл"}
          </a>
        </div>
      );
    }

    return null;
  }, [current, muted, videoRef]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-black ${aspectClass}`}
      onTouchStart={(event) => {
        touchStartXRef.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        const startX = touchStartXRef.current;
        const endX = event.changedTouches[0]?.clientX ?? null;
        touchStartXRef.current = null;

        if (startX === null || endX === null || !onChange) return;

        const delta = endX - startX;

        if (delta <= -48 && canNext) {
          onChange(activeIndex + 1);
        } else if (delta >= 48 && canPrev) {
          onChange(activeIndex - 1);
        }
      }}
    >
      {mediaNode}

      {canPrev ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange?.(activeIndex - 1);
          }}
          className={`absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light"
              ? "bg-black/35 text-white"
              : "bg-white/85 text-neutral-900"
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
            onChange?.(activeIndex + 1);
          }}
          className={`absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm ${
            controlsTone === "light"
              ? "bg-black/35 text-white"
              : "bg-white/85 text-neutral-900"
          }`}
          aria-label="Следующее медиа"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      ) : null}

      <MediaDots
        total={items.length}
        activeIndex={activeIndex}
        onSelect={(index) => onChange?.(index)}
        light={controlsTone === "light"}
      />
    </div>
  );
}