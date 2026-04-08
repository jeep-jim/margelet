import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

type HybridMediaProps = {
  item: CarouselItem;
  fit: "cover" | "contain";
  muted: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  mode: "fixed" | "adaptive";
  maxMediaHeightClass: string;
  nativeVideoControls: boolean;
  blockVideoClickPropagation: boolean;
  onMediaError?: () => void;
};

function HybridMedia({
  item,
  fit,
  muted,
  videoRef,
  mode,
  maxMediaHeightClass,
  nativeVideoControls,
  blockVideoClickPropagation,
  onMediaError,
}: HybridMediaProps) {
  const mediaClass =
    mode === "adaptive"
      ? `block h-auto w-auto max-w-full ${maxMediaHeightClass} ${
          fit === "cover" ? "object-cover" : "object-contain"
        }`
      : `h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`;

  if (item.kind === "video") {
    return (
      <video
        ref={videoRef}
        src={item.url}
        poster={item.poster || undefined}
        className={mediaClass}
        playsInline
        preload="metadata"
        muted={muted}
        controls={nativeVideoControls}
        onClick={
          blockVideoClickPropagation
            ? (event) => event.stopPropagation()
            : undefined
        }
        onError={onMediaError}
      />
    );
  }

  if (item.kind === "image") {
    return (
      <img
        src={item.url}
        alt=""
        className={mediaClass}
        referrerPolicy="no-referrer"
        onError={onMediaError}
      />
    );
  }

  if (item.kind === "audio") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 px-4 py-8">
        <audio
          src={item.url}
          controls
          className="w-full max-w-[420px]"
          preload="metadata"
          onError={onMediaError}
        />
      </div>
    );
  }

  if (item.kind === "file") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-neutral-100 px-4 py-8">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
        >
          {item.fileName || "Открыть файл"}
        </a>
      </div>
    );
  }

  return null;
}

export function MediaDots({
  total,
  activeIndex,
  onSelect,
}: {
  total: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  if (total <= 1) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 flex -translate-x-1/2 items-center gap-1.5">
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
            className={`pointer-events-auto h-2.5 rounded-full border border-black/20 transition ${
              active ? "w-5 bg-white" : "w-2.5 bg-white/50"
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
  fit = "cover",
  enableFullscreen = false,
  mode = "fixed",
  maxMediaHeightClass = "max-h-[70vh]",
  backgroundClass = "bg-black",
  nativeVideoControls = false,
  blockVideoClickPropagation = true,
  onMediaError,
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
  fit?: "cover" | "contain";
  enableFullscreen?: boolean;
  mode?: "fixed" | "adaptive";
  maxMediaHeightClass?: string;
  backgroundClass?: string;
  nativeVideoControls?: boolean;
  blockVideoClickPropagation?: boolean;
  onMediaError?: () => void;
}) {
  const touchStartXRef = useRef<number | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(activeIndex);

  const current =
    items[Math.min(activeIndex, Math.max(items.length - 1, 0))] || null;

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < items.length - 1;

  useEffect(() => {
    const node = videoRef?.current;
    if (!node || current?.kind !== "video") return;

    node.muted = muted;

    if (mediaActive) {
      const promise = node.play();
      if (promise && typeof promise.catch === "function") {
        promise.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [current?.id, current?.kind, mediaActive, muted, videoRef]);

  useEffect(() => {
    if (!fullscreenOpen) return;
    setFullscreenIndex(activeIndex);
  }, [activeIndex, fullscreenOpen]);

  const fullscreenItem =
    items[Math.min(fullscreenIndex, Math.max(items.length - 1, 0))] || null;

  const rootClass =
    mode === "adaptive"
      ? `relative flex w-full max-w-full items-start justify-center overflow-hidden ${backgroundClass}`
      : `relative w-full overflow-hidden ${backgroundClass} ${aspectClass}`;

  const clickAreaClass =
    mode === "adaptive"
      ? enableFullscreen
        ? "flex w-full max-w-full items-start justify-center overflow-hidden cursor-zoom-in"
        : "flex w-full max-w-full items-start justify-center overflow-hidden"
      : enableFullscreen
        ? "h-full w-full cursor-zoom-in"
        : "h-full w-full";

  return (
    <>
      <div
        className={rootClass}
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
        <div
          className={clickAreaClass}
          onClick={(event) => {
            if (!enableFullscreen) return;
            if (current?.kind === "video") return;
            event.stopPropagation();
            setFullscreenIndex(activeIndex);
            setFullscreenOpen(true);
          }}
        >
          {current ? (
            <HybridMedia
              item={current}
              fit={fit}
              muted={muted}
              videoRef={videoRef}
              mode={mode}
              maxMediaHeightClass={maxMediaHeightClass}
              nativeVideoControls={nativeVideoControls}
              blockVideoClickPropagation={blockVideoClickPropagation}
              onMediaError={onMediaError}
            />
          ) : null}
        </div>

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
        />
      </div>

      {enableFullscreen && fullscreenOpen && fullscreenItem ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setFullscreenOpen(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setFullscreenOpen(false);
            }}
            className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>

          {fullscreenIndex > 0 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenIndex((prev) => Math.max(0, prev - 1));
              }}
              className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
              aria-label="Предыдущее медиа"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}

          {fullscreenIndex < items.length - 1 ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setFullscreenIndex((prev) =>
                  Math.min(items.length - 1, prev + 1)
                );
              }}
              className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm"
              aria-label="Следующее медиа"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}

          <div
            className="flex max-h-full max-w-full items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <HybridMedia
              item={fullscreenItem}
              fit="contain"
              muted={muted}
              mode="adaptive"
              maxMediaHeightClass="max-h-[88vh]"
              nativeVideoControls={false}
              blockVideoClickPropagation={false}
              onMediaError={onMediaError}
            />
          </div>

          <MediaDots
            total={items.length}
            activeIndex={fullscreenIndex}
            onSelect={setFullscreenIndex}
          />
        </div>
      ) : null}
    </>
  );
}