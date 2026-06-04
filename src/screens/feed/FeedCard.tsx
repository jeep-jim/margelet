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
  hasAudioLikeMedia,
  hasVisualMedia,
} from "./feed.utils";
import { PostAttentionChips } from "./PostAttentionChips";

const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";


type FeedCardRuntimeProps = FeedCardProps & {
  searchQuery?: string;
};

export function FeedCard(props: FeedCardRuntimeProps) {
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
    searchQuery = "",
  } = props;

  const COPY = {
    ru: { read: "Читать", more: "Ещё", open: "Открыть" },
    ua: { read: "Читати", more: "Ще", open: "Відкрити" },
    us: { read: "Read", more: "More", open: "Open" },
    in: { read: "पढ़ें", more: "और", open: "खोलें" },
    ir: { read: "خواندن", more: "بیشتر", open: "باز کردن" },
    tr: { read: "Oku", more: "Daha fazla", open: "Aç" },
    br: { read: "Ler", more: "Mais", open: "Abrir" },
    kz: { read: "Оқу", more: "Тағы", open: "Ашу" },
    uz: { read: "O‘qish", more: "Yana", open: "Ochish" },
    ae: { read: "قراءة", more: "المزيد", open: "فتح" },
    eg: { read: "قراءة", more: "المزيد", open: "فتح" },
    pk: { read: "پڑھیں", more: "مزید", open: "کھولیں" },
    id: { read: "Baca", more: "Lainnya", open: "Buka" },
    mx: { read: "Leer", more: "Más", open: "Abrir" },
    sa: { read: "قراءة", more: "المزيد", open: "فتح" },
    es: { read: "Leer", more: "Más", open: "Abrir" },
    it: { read: "Leggi", more: "Altro", open: "Apri" },
    fr: { read: "Lire", more: "Plus", open: "Ouvrir" },
    de: { read: "Lesen", more: "Mehr", open: "Öffnen" },
    ar: { read: "Leer", more: "Más", open: "Abrir" },
    co: { read: "Leer", more: "Más", open: "Abrir" },
    za: { read: "Read", more: "More", open: "Open" },
    ng: { read: "Read", more: "More", open: "Open" },
    cn: { read: "阅读", more: "更多", open: "打开" },
    my: { read: "Baca", more: "Lagi", open: "Buka" },
  } as const;

  const copy = COPY[locale] ?? COPY.us;

  const displayText = getDisplayText(post);
  const showVisualMedia = hasVisualMedia(post);
  const hasAudioOrFiles = hasAudioLikeMedia(post);

  const cardRef = useRef<HTMLElement | null>(null);
  const seenReportedRef = useRef(false);

  const [isCardVisible, setIsCardVisible] = useState(false);
  const [shouldLoadMedia, setShouldLoadMedia] = useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
        setIsCardVisible(visible);

        if (visible && !seenReportedRef.current) {
          seenReportedRef.current = true;

          window.dispatchEvent(
            new CustomEvent("margelet-feed-post-seen", {
              detail: { id: post.id },
            }),
          );
        }        
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
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
  }, [onSeen]);

  const openPostSafely = () => {
    window.dispatchEvent(new Event(FEED_PAUSE_EVENT));
    onOpen();
  };

  return (
    <article
      ref={cardRef}
      className="relative border-b border-soft bg-surface"
    >
      <div className="px-4 pt-4 pr-12">
        <FeedSourceHeader post={post} compact onOpenCreator={onOpenCreator} />
      </div>

      <div className="absolute right-1 top-4 z-1">
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
                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <PostAttentionChips post={post} searchQuery={searchQuery} locale={locale} />
                    </div>

                    {expanded ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPostSafely();
                        }}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
                        className="inline-flex shrink-0 items-center rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <PostAttentionChips post={post} searchQuery={searchQuery} locale={locale} />
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openPostSafely();
                  }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[14px] font-medium text-primary"
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
          searchQuery={searchQuery}
        />
      ) : (
        <FeedTextCard
          locale={locale}
          post={post}
          liked={false}
          onToggleLike={() => {}}
          onOpen={openPostSafely}
          searchQuery={searchQuery}
        />
      )}
    </article>
  );
}