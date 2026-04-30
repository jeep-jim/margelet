import { ChevronDown, ExternalLink, MoreVertical } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedCardProps } from "./feed.types";
import { FeedMoreMenu } from "./FeedMoreMenu";
import { FeedMediaCard } from "./FeedMediaCard";
import { FeedSourceHeader } from "./FeedSourceHeader";
import { FeedTagMenu } from "./FeedTagMenu";
import { FeedTextCard } from "./FeedTextCard";
import { ExpandableFeedText } from "./ExpandableText";
import {
  getDisplayTagMeta,
  getDisplayText,
  hasAudioLikeMedia,
  hasVisualMedia,
} from "./feed.utils";

const FEED_PAUSE_EVENT = "margelet:pause-feed-videos";

function TagChips({
  primaryTag,
  secondaryTags,
  locale,
}: {
  primaryTag: string;
  secondaryTags: string[];
  locale: FeedCardProps["locale"];
}) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const allTags = useMemo(() => [primaryTag, ...secondaryTags], [primaryTag, secondaryTags]);
  const extraCount = Math.max(0, allTags.length - 1);
  const isExpandable = extraCount > 0;

  const TITLE = {
    ru: "Теги канала",
    uk: "Теги каналу",
    en: "Channel tags",
    in: "Channel tags",
    fa: "برچسب‌های کانال",
    tr: "Kanal etiketleri",
    "pt-br": "Tags do canal",
    kk: "Арна тегтері",
    uz: "Kanal teglari",
    ae: "وسوم القناة",
    eg: "وسوم القناة",
    pk: "Channel tags",
    id: "Tag channel",
    mx: "Etiquetas del canal",
    sa: "وسوم القناة",
    es: "Etiquetas del canal",
    it: "Tag del canale",
    fr: "Tags de la chaîne",
    de: "Kanal-Tags",
    ar: "Etiquetas del canal",
    co: "Etiquetas del canal",
    za: "Channel tags",
    ng: "Channel tags",
    zh: "频道标签",
    ms: "Tag saluran",
  } as const;

  const menuTitle = TITLE[locale] ?? TITLE.en;

  if (!isExpandable) {
    return (
      <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[11px] font-medium text-primary">
        <span className="truncate">{primaryTag}</span>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();

          if (isOpen) {
            setIsOpen(false);
            return;
          }

          const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
          setAnchorRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
          });
          setIsOpen(true);
        }}
        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[11px] font-medium text-primary transition hover:bg-app"
      >
        <span className="truncate">{primaryTag}</span>
        <span className="shrink-0 text-secondary">+{extraCount}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-secondary" />
      </button>

      {isOpen ? (
        <FeedTagMenu
          tags={allTags}
          anchorRect={anchorRect}
          onRequestClose={() => setIsOpen(false)}
          title={menuTitle}
        />
      ) : null}
    </>
  );
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
  } = props;

  const COPY = {
    ru: { read: "Читать", more: "Ещё", open: "Открыть" },
    uk: { read: "Читати", more: "Ще", open: "Відкрити" },
    en: { read: "Read", more: "More", open: "Open" },
    in: { read: "पढ़ें", more: "और", open: "खोलें" },
    fa: { read: "خواندن", more: "بیشتر", open: "باز کردن" },
    tr: { read: "Oku", more: "Daha fazla", open: "Aç" },
    "pt-br": { read: "Ler", more: "Mais", open: "Abrir" },
    kk: { read: "Оқу", more: "Тағы", open: "Ашу" },
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
    zh: { read: "阅读", more: "更多", open: "打开" },
    ms: { read: "Baca", more: "Lagi", open: "Buka" },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const displayText = getDisplayText(post);
  const showVisualMedia = hasVisualMedia(post);
  const hasAudioOrFiles = hasAudioLikeMedia(post);
  const { primary: primaryTag, secondary: secondaryTags } = getDisplayTagMeta(post, locale);

  const cardRef = useRef<HTMLElement | null>(null);

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
                      <TagChips primaryTag={primaryTag} secondaryTags={secondaryTags} locale={locale} />
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
                  <TagChips primaryTag={primaryTag} secondaryTags={secondaryTags} locale={locale} />
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