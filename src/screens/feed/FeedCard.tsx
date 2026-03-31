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
  hasAudioLikeMedia,
  hasVisualMedia,
} from "./feed.utils";

export function FeedCard(props: FeedCardProps) {
  const {
    post,
    isOwner,
    isAdmin,
    menuOpen,
    onToggleMenu,
    onDelete,
    onHide,
    onOpen,
    onOpenCreator,
  } = props;

  const displayText = getDisplayText(post);
  const showVisualMedia = hasVisualMedia(post);
  const hasAudioOrFiles = hasAudioLikeMedia(post);

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
          <div className="mt-3">
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
                      <button type="button">
                        <Heart className="h-5 w-5" />
                      </button>

                      <button type="button">
                        <Send className="h-5 w-5" />
                      </button>
                    </div>

                    {expanded ? (
                      <button
                        type="button"
                        onClick={onOpen}
                        className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                      >
                        <span>Читать</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={expand}
                        className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                      >
                        <span>Ещё</span>
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
                  <button type="button">
                    <Heart className="h-5 w-5" />
                  </button>

                  <button type="button">
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5 text-[14px] font-medium text-neutral-800"
                >
                  <span>Открыть</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : hasAudioOrFiles ? (
        <FeedTextCard post={post} onOpen={onOpen} />
      ) : (
        <FeedTextCard post={post} onOpen={onOpen} />
      )}
    </article>
  );
}