import { MoreVertical } from "lucide-react";
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
  const mediaExists = mediaItems.length > 0;
  const cardRef = useRef<HTMLElement | null>(null);
  const [isCardVisible, setIsCardVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsCardVisible(entry.isIntersecting && entry.intersectionRatio >= 0.6);
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

      {mediaExists ? (
        <FeedMediaCard
          {...props}
          displayText={displayText}
          isCardVisible={isCardVisible}
        />
      ) : (
        <FeedTextCard
          video={video}
          locale={locale}
          onOpen={onOpen}
        />
      )}

      {mediaExists ? (
        <div className="px-4 py-3">
          <ExpandableFeedText text={displayText} />
        </div>
      ) : null}
    </article>
  );
}
