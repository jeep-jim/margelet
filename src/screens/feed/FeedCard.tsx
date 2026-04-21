import { ExternalLink, MoreVertical } from "lucide-react";
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
    onSeen,
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
  const seenTimerRef = useRef<number | null>(null);
  const seenReportedRef = useRef(false);

  const [isCardVisible, setIsCardVisible] = useState(false);
  const [shouldLoadMedia, setShouldLoadMedia] = useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6);
      },
      { threshold: [0, 0.6, 1] }
    );

    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadMedia(true);
          preloadObserver.disconnect();
        }
      },
      {
        rootMargin: "900px 0px",
        threshold: 0,
      }
    );

    visibilityObserver.observe(node);
    preloadObserver.observe(node);

    return () => {
      visibilityObserver.disconnect();
      preloadObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    seenReportedRef.current = false;
    if (seenTimerRef.current) {
      window.clearTimeout(seenTimerRef.current);
      seenTimerRef.current = null;
    }
  }, [post.id]);

  useEffect(() => {
    if (!onSeen || seenReportedRef.current || !isCardVisible) {
      if (seenTimerRef.current) {
        window.clearTimeout(seenTimerRef.current);
        seenTimerRef.current = null;
      }
      return;
    }

    seenTimerRef.current = window.setTimeout(() => {
      seenReportedRef.current = true;
      onSeen();
      seenTimerRef.current = null;
    }, 1200);

    return () => {
      if (seenTimerRef.current) {
        window.clearTimeout(seenTimerRef.current);
        seenTimerRef.current = null;
      }
    };
  }, [isCardVisible, onSeen]);

  const openPostSafely = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
    onOpen();
  };

  return (
    <article
      ref={cardRef}
      className="relative overflow-hidden border-b border-soft bg-surface"
    >
      <div className="px-4 pt-4 pr-12">
        <FeedSourceHeader post={post} compact onOpenCreator={onOpenCreator} />
      </div>

      <div className="absolute right-1 top-4 z-20">
        <div className="relative">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft"
            onClick={(event) => {
              event.stopPropagation();

              const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
              setMenuAnchorRect({
                top: rect.bottom,
                right: window.innerWidth - rect.right,
              });

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
              onOpenTelegram={() => {
                window.open(post.postUrl, "_blank", "noopener,noreferrer");
              }}
              onRequestClose={onToggleMenu}
              anchorRect={menuAnchorRect}
              postId={post.id}
              sourceHandle={post.source.handle}
            />
          ) : null}
        </div>
      </div>

      {showVisualMedia ? (
        <>
          <div className="relative mt-3">
            <FeedMediaCard
              {...props}
              displayText={displayText}
              isCardVisible={isCardVisible}
              shouldLoadMedia={shouldLoadMedia}
            />
          </div>

          {displayText ? (
            <div className="px-4 py-3">
              <ExpandableFeedText text={displayText}>
                {({ expanded, expand }) => (
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="relative z-10 flex items-center gap-2">
                      <div className="pointer-events-none rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
                        {tagLabel}
                      </div>
                    </div>

                    {expanded ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPostSafely();
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
                        className="inline-flex items-center rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
                <div className="relative z-10 flex items-center gap-2">
                  <div className="pointer-events-none rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
                    {tagLabel}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openPostSafely();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
          liked={false}
          onToggleLike={() => {}}
          onOpen={openPostSafely}
        />
      ) : (
        <FeedTextCard
          locale={locale}
          post={post}
          liked={false}
          onToggleLike={() => {}}
          onOpen={openPostSafely}
        />
      )}
    </article>
  );
}