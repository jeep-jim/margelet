import { Bookmark, Heart, MoreVertical, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FeedCardProps } from "./feed.types";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedMediaCard } from "./FeedMediaCard";
import { FeedSourceHeader } from "./FeedSourceHeader";
import { FeedTextCard } from "./FeedTextCard";
import { ExpandableFeedText } from "./ExpandableText";
import { getDisplayText, normalizeMediaList } from "./feed.utils";

export function FeedCard(props: FeedCardProps) {
  const {
    video,
    locale,
    isOwner,
    isAdmin,
    menuOpen,
    onToggleMenu,
    onDelete,
    onHide,
    onOpen,
    onOpenCreator,
  } = props;

  const displayText = getDisplayText(video, locale);
  const mediaItems = normalizeMediaList(video);

  const mediaKind = video.mediaKind || "none";
  const hasStoredMedia = mediaItems.length > 0;

  const hasMediaByType =
    mediaKind === "image" ||
    mediaKind === "gif" ||
    mediaKind === "video" ||
    mediaKind === "audio" ||
    mediaKind === "file";

  const isExternalMedia = mediaKind === "external_media";

  const shouldUseMediaCard =
    !isExternalMedia && (hasMediaByType || hasStoredMedia);

  const cardRef = useRef<HTMLElement | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(
          entry.isIntersecting && entry.intersectionRatio >= 0.6
        );
      },
      {
        threshold: [0, 0.25, 0.6, 0.85, 1],
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <article
      ref={cardRef}
      className="overflow-hidden border-b border-neutral-200 bg-white"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <FeedSourceHeader video={video} compact onOpenCreator={onOpenCreator} />

        <div className="relative">
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

      {shouldUseMediaCard ? (
        <>
          <FeedMediaCard
            {...props}
            displayText={displayText}
            isCardVisible={isCardVisible}
          />

          {displayText ? (
            <div className="px-4 py-3">
              <ExpandableFeedText text={displayText} />

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-8 text-neutral-700">
                  <button
                    type="button"
                    className="flex items-center justify-center"
                    aria-label="Нравится"
                    title="Нравится"
                  >
                    <Heart className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center"
                    aria-label="Сохранить"
                    title="Сохранить"
                  >
                    <Bookmark className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    className="flex items-center justify-center"
                    aria-label="Поделиться"
                    title="Поделиться"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800"
                >
                  <span>Читать</span>
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <FeedTextCard video={video} locale={locale} onOpen={onOpen} />
      )}
    </article>
  );
}