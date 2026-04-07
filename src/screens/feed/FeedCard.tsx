import { ExternalLink, Heart, MoreVertical, Send } from "lucide-react";
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
    onShare,
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
  const [isCardVisible, setIsCardVisible] = useState(false);

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

  return (
    <article
      ref={cardRef}
      className="overflow-hidden border-b border-neutral-200 bg-white"
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-4">
        <FeedSourceHeader post={post} compact onOpenCreator={onOpenCreator} />

        <div className="relative shrink-0">
          <button
            className="rounded-full p-2 text-neutral-700"
            onClick={onToggleMenu}
            type="button"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen ? (
            <FeedMoreMenu
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
          <div className="relative mt-3">
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
                      <button type="button" onClick={onToggleLike}>
                        <Heart
                          className={`h-5 w-5 ${
                            liked
                              ? "fill-neutral-950 text-neutral-950"
                              : "text-neutral-700"
                          }`}
                        />
                      </button>

                      <button type="button" onClick={onShare}>
                        <Send className="h-5 w-5" />
                      </button>
                    </div>

                    {expanded ? (
                      <button
                        type="button"
                        onClick={onOpen}
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                      >
                        <span>{copy.read}</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={expand}
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
                  <button type="button" onClick={onToggleLike}>
                    <Heart
                      className={`h-5 w-5 ${
                        liked
                          ? "fill-neutral-950 text-neutral-950"
                          : "text-neutral-700"
                      }`}
                    />
                  </button>

                  <button type="button" onClick={onShare}>
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpen}
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
          liked={liked}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpen={onOpen}
        />
      ) : (
        <FeedTextCard
          locale={locale}
          post={post}
          liked={liked}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpen={onOpen}
        />
      )}
    </article>
  );
}