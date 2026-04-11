import { ExternalLink, Heart, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedCardProps } from "./feed.types";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedMediaCard } from "./FeedMediaCard";
import { FeedSourceHeader } from "./FeedSourceHeader";
import { FeedTextCard } from "./FeedTextCard";
import {
  getDisplayText,
  getResolvedTag,
  getTagLabel,
  hasAudioLikeMedia,
  hasVisualMedia,
} from "./feed.utils";

const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";
const TG_STORAGE_KEY = "margelet_tg_user";

function readTelegramUserId() {
  try {
    const raw = localStorage.getItem(TG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ? String(parsed.id) : null;
  } catch {
    return null;
  }
}

async function trackAction(params: {
  action: "view" | "open" | "like";
  postId: number;
  sourceHandle: string;
  telegramUserId?: string | null;
}) {
  try {
    const res = await fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-id": params.telegramUserId || "",
      },
      body: JSON.stringify({
        action: params.action,
        postId: params.postId,
        sourceHandle: params.sourceHandle,
        telegramUserId: params.telegramUserId || null,
      }),
    });

    return await res.json().catch(() => null);
  } catch {
    return null;
  }
}

export function FeedCard(props: FeedCardProps) {
  const {
    post,
    locale,
    isOwner,
    isAdmin,
    menuOpen,
    onToggleMenu,
    onDelete,
    onHide,
    onOpen,
    onOpenCreator,
    liked,
    onToggleLike,
  } = props;

  const COPY = {
    en: { read: "Read", open: "Open" },
    ru: { read: "Читать", open: "Открыть" },
    de: { read: "Lesen", open: "Öffnen" },
    es: { read: "Leer", open: "Abrir" },
    tr: { read: "Oku", open: "Aç" },
    fr: { read: "Lire", open: "Ouvrir" },
    it: { read: "Leggi", open: "Apri" },
    "pt-br": { read: "Ler", open: "Abrir" },
    id: { read: "Baca", open: "Buka" },
    pl: { read: "Czytaj", open: "Otwórz" },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const displayText = getDisplayText(post);
  const showVisualMedia = hasVisualMedia(post);
  const hasAudioOrFiles = hasAudioLikeMedia(post);
  const tagLabel = getTagLabel(getResolvedTag(post), locale);

  const cardRef = useRef<HTMLElement | null>(null);
  const viewTrackedRef = useRef(false);

  const [isCardVisible, setIsCardVisible] = useState(false);
  const [localLiked, setLocalLiked] = useState(liked);

  useEffect(() => {
    setLocalLiked(liked);
  }, [liked, post.id]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6);
      },
      { threshold: [0, 0.6, 1] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isCardVisible || viewTrackedRef.current) return;
    viewTrackedRef.current = true;

    const telegramUserId = readTelegramUserId();

    void trackAction({
      action: "view",
      postId: post.id,
      sourceHandle: post.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.liked === "boolean") {
        setLocalLiked(data.liked);
      }
    });
  }, [isCardVisible, post.id, post.source.handle]);

  const handleLikeClick = () => {
    const telegramUserId = readTelegramUserId();

    setLocalLiked((prev) => !prev);
    onToggleLike();

    if (!telegramUserId) return;

    void trackAction({
      action: "like",
      postId: post.id,
      sourceHandle: post.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.liked === "boolean") {
        setLocalLiked(data.liked);
      }
    });
  };

  const openPostSafely = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));

    const telegramUserId = readTelegramUserId();

    void trackAction({
      action: "open",
      postId: post.id,
      sourceHandle: post.source.handle,
      telegramUserId,
    }).then((data) => {
      if (typeof data?.liked === "boolean") {
        setLocalLiked(data.liked);
      }
    });

    onOpen();
  };

  return (
    <article
      ref={cardRef}
      className="relative overflow-hidden border-b border-neutral-200 bg-white"
    >
      <div className="px-4 pt-4 pr-12">
        <FeedSourceHeader post={post} compact onOpenCreator={onOpenCreator} />
      </div>

            <div className="absolute right-1 top-4 z-20">
        <div className="relative">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-700"
            onClick={(event) => {
              event.stopPropagation();
              onToggleMenu();
            }}
            type="button"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen ? (
            <FeedMoreMenu
              locale={locale}
              isOwner={isOwner}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onHide={onHide}
            />
          ) : null}
        </div>
      </div>

      {showVisualMedia ? (
        <>
          <div
            className="relative mt-3 cursor-pointer"
            onClick={openPostSafely}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openPostSafely();
              }
            }}
          >
            <div className="absolute left-3 top-3 z-20">
              <div className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                {tagLabel}
              </div>
            </div>

            <FeedMediaCard
              {...props}
              displayText={displayText}
              isCardVisible={isCardVisible}
            />
          </div>

          <div className="px-4 py-3">
            {displayText ? (
              <div
                className="mb-4 cursor-pointer whitespace-pre-wrap break-words text-[15px] leading-6 text-neutral-900"
                onClick={openPostSafely}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPostSafely();
                  }
                }}
              >
                <div className="line-clamp-3">{displayText}</div>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-8 text-neutral-700">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleLikeClick();
                  }}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      localLiked
                        ? "fill-neutral-950 text-neutral-950"
                        : "text-neutral-700"
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  openPostSafely();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800"
              >
                <span>{displayText ? copy.read : copy.open}</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      ) : hasAudioOrFiles ? (
        <FeedTextCard
          locale={locale}
          post={post}
          liked={localLiked}
          onToggleLike={handleLikeClick}
          onOpen={openPostSafely}
        />
      ) : (
        <FeedTextCard
          locale={locale}
          post={post}
          liked={localLiked}
          onToggleLike={handleLikeClick}
          onOpen={openPostSafely}
        />
      )}
    </article>
  );
}