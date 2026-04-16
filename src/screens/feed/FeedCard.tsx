import { ExternalLink, MoreVertical } from "lucide-react";
import { useState } from "react";
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
  } = props;

  const copy = {
    en: { read: "Read", more: "More", open: "Open" },
    ru: { read: "Читать", more: "Ещё", open: "Открыть" },
  }[locale as "en" | "ru"] ?? { read: "Read", more: "More", open: "Open" };

  const displayText = getDisplayText(post);
  const showVisualMedia = hasVisualMedia(post);
  const hasAudioOrFiles = hasAudioLikeMedia(post);
  const tagLabel = getTagLabel(getResolvedTag(post), locale);
  const [menuAnchorRect, setMenuAnchorRect] = useState<{ top: number; right: number } | null>(null);

  const openPostSafely = () => onOpen();

  return (
    <article className="relative overflow-hidden border-b border-soft bg-surface">
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
              setMenuAnchorRect({ top: rect.bottom, right: window.innerWidth - rect.right });
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
              onOpenTelegram={() => window.open(post.postUrl, "_blank", "noopener,noreferrer")}
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
            <FeedMediaCard {...props} displayText={displayText} />
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

                    {!expanded ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          expand();
                        }}
                        className="rounded-full bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary transition hover:bg-surface-hover"
                      >
                        {copy.more}
                      </button>
                    ) : null}
                  </div>
                )}
              </ExpandableFeedText>
            </div>
          ) : (
            <div className="px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
                  {tagLabel}
                </div>

                <button
                  type="button"
                  onClick={openPostSafely}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-3 py-2 text-[12px] font-medium text-primary transition hover:bg-surface-hover"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>{copy.open}</span>
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <FeedTextCard locale={locale} post={post} onOpen={openPostSafely} />
      )}

      {hasAudioOrFiles && !showVisualMedia ? null : null}
    </article>
  );
}
