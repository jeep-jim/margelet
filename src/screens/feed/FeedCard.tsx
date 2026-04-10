import { ExternalLink, Heart, MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedCardProps } from "./feed.types";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedMediaCard } from "./FeedMediaCard";
import { FeedSourceHeader } from "./FeedSourceHeader";
import { FeedTextCard } from "./FeedTextCard";
import { ExpandableFeedText } from "./ExpandableText";
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
    en: { read: "Read", more: "More", open: "Open" },
    ru: { read: "Читать", more: "Ещё", open: "Открыть" },
    de: { read: "Lesen", more: "Mehr", open: "Öffnen" },
    es: { read: "Leer", more: "Más", open: "Abrir" },
    tr: { read: "Oku", more: "Daha fazla", open: "Aç" },
    fr: { read: "Lire", more: "Plus", open: "Ouvrir" },
    it: { read: "Leggi", more: "Altro", open: "Apri" },
    "pt-br": { read: "Ler", more: "Mais", open: "Abrir" },
    id: { read: "Baca", more: "Lainnya", open: "Buka" },
    pl: { read: "Czytaj", more: "Więcej", open: "Otwórz" },
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
      <div className="px-4 pt-4 pr-14">
        <FeedSourceHeader post={post} compact onOpenCreator={onOpenCreator} />
      </div>

      <div className="absolute right-4 top-4 z-20">
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

          {displayText ? (
            <div className="px-4 py-3">
              <ExpandableFeedText text={displayText}>
                {({ expanded, expand }) => (
                  <div className="mt-4 flex items-center justify-between gap-3">
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

                    {expanded ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPostSafely();
                        }}
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                      >
                        <span>{copy.read}</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          expand();
                        }}
                        className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                      >
                        <span>{copy.more}</span>
                      </button>
                    )}
                  </div>
                )}
              </ExpandableFeedText>
            </div>
          ) : (
            <div className="px-4 py-3">
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
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                >
                  <span>{copy.open}</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
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