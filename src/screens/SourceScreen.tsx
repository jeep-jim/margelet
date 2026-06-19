import { Bell } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMessages } from "../lib/i18n";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import { FeedCard } from "./feed/FeedCard";
import { FeedViewer } from "./feed/FeedViewer";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import type { ViewerDirection } from "./feed/feed.types";
import type { Locale, IngestedPost } from "../types/app";

type Props = {
  locale: Locale;
  posts: IngestedPost[];
  sourceHandle: string | null;
  onBack: () => void;
  onOpenPost: (post: IngestedPost) => void;
  likedPostIds: number[];
  onToggleLike: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  onGlobalHidePosts: (ids: number[]) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
};

const SUB_KEY = "margelet_subscriptions";
const SAVED_POST_IDS_FALLBACK: number[] = [];

const EXPIRED_POST_COPY = {
  ru: { alt: "Пост скрыт", title: "Пост уже отжил своё", text: "Свежие посты живут в ленте margeleT 24 часа. Никому не интересны вчерашние новости, поэтому этот пост уже скрыт из живой ленты.", button: "Открыть свежую ленту" },
  us: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  en: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  ua: { alt: "Пост приховано", title: "Пост уже віджив своє", text: "Свіжі пости живуть у стрічці margeleT 24 години. Учорашні новини ховаються з живої стрічки, щоб зверху були нові сигнали.", button: "Відкрити свіжу стрічку" },
  br: { alt: "Post oculto", title: "Este post já cumpriu seu tempo", text: "Posts frescos vivem no feed do margeleT por 24 horas. As notícias de ontem saem do feed ao vivo para abrir espaço para novos sinais.", button: "Abrir feed fresco" },
  tr: { alt: "Gönderi gizlendi", title: "Bu gönderinin zamanı geçti", text: "Yeni gönderiler margeleT akışında 24 saat yaşar. Dünün haberleri canlı akıştan gizlenir, böylece yeni sinyaller öne çıkar.", button: "Güncel akışı aç" },
  in: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  ir: { alt: "پست پنهان شد", title: "زمان این پست تمام شده است", text: "پست‌های تازه در فید margeleT تا ۲۴ ساعت زنده می‌مانند. خبرهای دیروز از فید زنده پنهان می‌شوند تا سیگنال‌های تازه بالا بمانند.", button: "باز کردن فید تازه" },
  kz: { alt: "Пост жасырылды", title: "Бұл пост өз уақытын өткізді", text: "Жаңа посттар margeleT лентасында 24 сағат тұрады. Кешегі жаңалықтар тірі лентадан жасырылады, жаңа сигналдар жоғарыда қалады.", button: "Жаңа лентаны ашу" },
  uz: { alt: "Post yashirildi", title: "Bu post o‘z vaqtini o‘tab bo‘ldi", text: "Yangi postlar margeleT lentasida 24 soat yashaydi. Kechagi yangiliklar jonli lentadan yashiriladi, yangi signallar tepada qoladi.", button: "Yangi lentani ochish" },
  ae: { alt: "تم إخفاء المنشور", title: "انتهى وقت هذا المنشور", text: "تعيش المنشورات الجديدة في موجز margeleT لمدة 24 ساعة. يتم إخفاء أخبار الأمس من الموجز الحي لتبقى الإشارات الجديدة في الأعلى.", button: "افتح الموجز الجديد" },
  eg: { alt: "تم إخفاء المنشور", title: "انتهى وقت هذا المنشور", text: "المنشورات الجديدة بتعيش في موجز margeleT لمدة 24 ساعة. أخبار امبارح بتختفي من الموجز الحي عشان الإشارات الجديدة تفضل فوق.", button: "افتح الموجز الجديد" },
  ar: { alt: "تم إخفاء المنشور", title: "انتهى وقت هذا المنشور", text: "تعيش المنشورات الجديدة في موجز margeleT لمدة 24 ساعة. يتم إخفاء أخبار الأمس من الموجز الحي لتبقى الإشارات الجديدة في الأعلى.", button: "افتح الموجز الجديد" },
  pk: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  id: { alt: "Postingan disembunyikan", title: "Postingan ini sudah lewat masanya", text: "Postingan baru hidup di feed margeleT selama 24 jam. Berita kemarin disembunyikan dari feed live agar sinyal baru tetap di atas.", button: "Buka feed terbaru" },
  mx: { alt: "Post oculto", title: "Este post ya cumplió su momento", text: "Los posts frescos viven en el feed de margeleT durante 24 horas. Las noticias de ayer se ocultan del feed en vivo para que suban nuevas señales.", button: "Abrir feed fresco" },
  sa: { alt: "تم إخفاء المنشور", title: "انتهى وقت هذا المنشور", text: "تعيش المنشورات الجديدة في موجز margeleT لمدة 24 ساعة. يتم إخفاء أخبار الأمس من الموجز الحي لتبقى الإشارات الجديدة في الأعلى.", button: "افتح الموجز الجديد" },
  es: { alt: "Post oculto", title: "Este post ya cumplió su momento", text: "Los posts frescos viven en el feed de margeleT durante 24 horas. Las noticias de ayer se ocultan del feed en vivo para que suban nuevas señales.", button: "Abrir feed fresco" },
  it: { alt: "Post nascosto", title: "Questo post ha già fatto il suo tempo", text: "I post freschi vivono nel feed margeleT per 24 ore. Le notizie di ieri vengono nascoste dal feed live per lasciare spazio ai nuovi segnali.", button: "Apri il feed fresco" },
  fr: { alt: "Post masqué", title: "Ce post a déjà vécu son moment", text: "Les posts frais restent dans le flux margeleT pendant 24 heures. Les nouvelles d’hier sont masquées du flux en direct pour garder les nouveaux signaux en haut.", button: "Ouvrir le flux frais" },
  de: { alt: "Post ausgeblendet", title: "Dieser Post hat seine Zeit gehabt", text: "Frische Posts bleiben 24 Stunden im margeleT-Feed. Nachrichten von gestern werden aus dem Live-Feed ausgeblendet, damit neue Signale oben bleiben.", button: "Frischen Feed öffnen" },
  co: { alt: "Post oculto", title: "Este post ya cumplió su momento", text: "Los posts frescos viven en el feed de margeleT durante 24 horas. Las noticias de ayer se ocultan del feed en vivo para que suban nuevas señales.", button: "Abrir feed fresco" },
  za: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  ng: { alt: "Post hidden", title: "This post has lived its moment", text: "Fresh posts live in the margeleT feed for 24 hours. Yesterday’s news gets hidden from the live feed so new signals stay on top.", button: "Open fresh feed" },
  cn: { alt: "帖子已隐藏", title: "这条帖子已经过时了", text: "新帖子会在 margeleT 信息流中保留 24 小时。昨天的新闻会从实时信息流中隐藏，让新的信号保持在顶部。", button: "打开最新信息流" },
  my: { alt: "Siaran disembunyikan", title: "Siaran ini sudah tamat waktunya", text: "Siaran baharu hidup dalam feed margeleT selama 24 jam. Berita semalam disembunyikan daripada feed langsung supaya isyarat baharu kekal di atas.", button: "Buka feed baharu" },
} as const;

function getExpiredPostCopy(locale: Locale) {
  return EXPIRED_POST_COPY[locale as keyof typeof EXPIRED_POST_COPY] ?? EXPIRED_POST_COPY.us;
}


function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);
  const next = exists ? current.filter((h) => h !== handle) : [...current, handle];
  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

function getPostIdFromUrl(postUrl: string) {
  const match = String(postUrl || "").match(/\/([0-9]+)(?:\?single)?$/);
  return match?.[1] || "";
}

function normalizeSourceHandle(value: string | null | undefined) {
  return String(value || "").replace(/^@+/, "").trim().toLowerCase();
}

function replaceSourcePostPath(post: IngestedPost) {
  const postId = getPostIdFromUrl(post.postUrl);
  const handle = normalizeSourceHandle(post.source.handle);

  if (!handle || !postId) return;

  const routeKey = `${handle}/${postId}`;
  window.history.replaceState({}, document.title, `/${routeKey}`);
  return routeKey;
}

function hasVisualPost(post: IngestedPost) {
  return post.contentType === "video";
}

export function SourceScreen({
  locale,
  posts,
  sourceHandle,
  likedPostIds,
  onToggleLike: _onToggleLike,
  onHidePost,
  onDeletePost,
  onGlobalHidePosts,
  currentTelegramUserId,
  openSource,
}: Props) {
  const t = getMessages(locale);
  const expiredPostCopy = getExpiredPostCopy(locale);
  const sourcePosts = useMemo(() => {
    return posts
      .filter((post) => normalizeSourceHandle(post.source.handle) === normalizeSourceHandle(sourceHandle))
      .sort((a, b) => b.id - a.id);
  }, [posts, sourceHandle]);

  const viewerPosts = useMemo(() => {
    return sourcePosts.filter(hasVisualPost);
  }, [sourcePosts]);

  const source = sourcePosts[0];

  const [subscribed, setSubscribed] = useState(false);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>({});

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);

  const [viewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);
  const [videoProgress] = useState(0);

  const routeHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!source?.source.handle) return;
    setSubscribed(getSubs().includes(source.source.handle));
  }, [source?.source.handle]);

  useEffect(() => {
    if (!source?.source.handle) return;

    const syncSubscribed = () => {
      setSubscribed(getSubs().includes(source.source.handle));
    };

    window.addEventListener("storage", syncSubscribed);

    return () => {
      window.removeEventListener("storage", syncSubscribed);
    };
  }, [source?.source.handle]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sourceHandle]);

  const closeOpenedPost = useCallback(() => {
    setViewerIndex(null);
    setTextReaderPost(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");

    if (source?.source.handle) {
      routeHandledRef.current = null;
      window.history.replaceState({}, document.title, `/${normalizeSourceHandle(source.source.handle)}`);
    }
  }, [source?.source.handle]);  

  const openPostInsideSource = useCallback(
    (post: IngestedPost, updateUrl = true) => {
      if (updateUrl) {
        routeHandledRef.current = replaceSourcePostPath(post) || null;
      }

      setMenuPostId(null);
      setActionError("");
      setExpandedCaption(false);

      if (hasVisualPost(post)) {
        const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
        if (nextIndex === -1) return;

        setTextReaderPost(null);
        setViewerIndex(nextIndex);
        setViewerMediaIndex(0);
        setIsPlaying(true);
        return;
      }

      setViewerIndex(null);
      setViewerMediaIndex(0);
      setTextReaderPost(post);
    },
    [viewerPosts]
  );  

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    if (viewerIndex >= viewerPosts.length - 1) return;

    const nextPost = viewerPosts[viewerIndex + 1];
    if (nextPost) {
      routeHandledRef.current = replaceSourcePostPath(nextPost) || null;
    }

    setViewerIndex(viewerIndex + 1);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");
  }, [viewerIndex, viewerPosts]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    if (viewerIndex <= 0) return;

    const nextPost = viewerPosts[viewerIndex - 1];
    if (nextPost) {
      routeHandledRef.current = replaceSourcePostPath(nextPost) || null;
    }

    setViewerIndex(viewerIndex - 1);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setMenuPostId(null);
    setActionError("");
  }, [viewerIndex, viewerPosts]);

  useEffect(() => {
    if (!sourceHandle || sourcePosts.length === 0) return;

    const clean = window.location.pathname.replace(/\/+$/, "");
    const parts = clean.split("/").filter(Boolean);

    if (parts.length !== 2) return;
    if (normalizeSourceHandle(parts[0]) !== normalizeSourceHandle(sourceHandle)) return;

    const routeKey = `${parts[0]}/${parts[1]}`;
    if (routeHandledRef.current === routeKey) return;

    const matchedPost = sourcePosts.find(
      (post) => getPostIdFromUrl(post.postUrl) === parts[1]
    );

    if (!matchedPost) return;

    routeHandledRef.current = routeKey;
    openPostInsideSource(matchedPost, false);
  }, [openPostInsideSource, sourceHandle, sourcePosts]);

  if (!sourceHandle) {
    return null;
  }

  if (posts.length === 0) {
    return null;
  }

  if (!source) {
    return (
      <div className="min-h-screen bg-app text-primary px-4 pb-10" style={{ paddingTop: "calc(var(--app-header-offset) + 16px)" }}>
        <div className="mx-auto max-w-[570px]">
          <section className="overflow-hidden rounded-[28px] border border-soft bg-surface px-5 py-8 text-center shadow-soft">
            <img
              src="/no_searsh.png"
              alt={expiredPostCopy.alt}
              className="mx-auto h-28 w-28 object-contain"
              loading="eager"
              decoding="async"
              onError={(event) => {
                event.currentTarget.outerHTML =
                  '<div class="mx-auto grid h-28 w-28 place-items-center text-[76px] leading-none">🦆</div>';
              }}
            />

            <h1 className="mt-5 text-[26px] font-bold leading-tight text-primary">
              {expiredPostCopy.title}
            </h1>

            <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 text-secondary">
              {expiredPostCopy.text}
            </p>

            <button
              type="button"
              onClick={() => {
                window.history.pushState(null, "", "/");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-strong px-6 text-sm font-semibold text-strong-foreground"
            >
              {expiredPostCopy.button}
            </button>
          </section>
        </div>
      </div>
    );
  }  

  const totalMedia = sourcePosts.filter((post) => post.media.length > 0).length;
  const totalVideos = sourcePosts.filter((post) => post.contentType === "video").length;
  const activeViewerPost =
    viewerIndex === null ? null : viewerPosts[viewerIndex] || null;

  const openTelegramSource = () => {
    window.open(`https://t.me/${source.source.handle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-app text-primary" style={{ paddingTop: "calc(var(--app-header-offset) + 16px)" }}>
      <div className="mx-auto max-w-[570px] px-4 pb-10">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-soft bg-surface p-5">
          <button
            type="button"
            onClick={() => openSource(source.source.handle)}
            className="flex w-full min-w-0 items-start gap-4 text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-soft text-xs font-bold text-primary">
              {source.source.avatar ? (
                <img
                  src={source.source.avatar}
                  alt={source.source.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                String(source.source.title || "TG").slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="inline-flex max-w-full items-center gap-1">
                <span className="truncate text-[18px] font-semibold leading-tight text-primary">
                  {source.source.title}
                </span>
                {source.source.verified ? (
                  <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="mt-1 truncate text-[14px] text-secondary">
                @{source.source.handle}
              </div>
            </div>
          </button>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.posts}
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourcePosts.length}</div>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.video}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalVideos}</div>
            </div>

            <div className="rounded-2xl bg-surface-soft p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-secondary">
                {t.source.media}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalMedia}</div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={openTelegramSource}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-full border border-soft bg-surface-soft px-4 text-[14px] font-medium text-primary transition hover:bg-app"
            >
              <span>{t.feed.openChannel}</span>
            </button>

            <button
              onClick={() => {
                const next = toggleSub(source.source.handle);
                setSubscribed(next.includes(source.source.handle));
                window.dispatchEvent(new Event("storage"));
              }}
              className={`ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition ${
                subscribed
                  ? "border-transparent bg-accent text-accent-foreground"
                  : "border-soft bg-surface-soft text-secondary hover:bg-app"
              }`}
              type="button"
              aria-label={
                subscribed
                  ? t.source.disableNotifications
                  : t.source.enableNotifications
              }
              title={
                subscribed
                  ? t.source.disableNotifications
                  : t.source.enableNotifications
              }
            >
              <Bell className={`h-5 w-5 ${subscribed ? "fill-current" : ""}`} />
            </button>
          </div>
        </section>

        <div className="-mx-4 overflow-hidden">
          {sourcePosts.map((post) => {
            const ownerTelegramId = post.addedBy?.telegramId ?? null;

            const isOwner =
              !!currentTelegramUserId &&
              !!ownerTelegramId &&
              currentTelegramUserId === ownerTelegramId;

            const isAdmin = currentTelegramUserId === "1372669404";

            return (
              <FeedCard
                key={post.id}
                post={post}
                locale={locale}
                isOwner={isOwner}
                isAdmin={isAdmin}
                menuOpen={menuPostId === post.id}
                onToggleMenu={() =>
                  setMenuPostId((prev) => (prev === post.id ? null : post.id))
                }
                onDelete={() => {
                  void onDeletePost(post.id);
                }}
                onHide={() => onHidePost(post.id)}
                onOpen={() => openPostInsideSource(post, true)}
                onOpenCreator={() => openSource(post.source.handle)}
                mediaIndex={feedMediaIndexes[post.id] || 0}
                onChangeMediaIndex={(next: number) =>
                  setFeedMediaIndexes((prev) => ({
                    ...prev,
                    [post.id]: Math.max(0, next),
                  }))
                }
                liked={false}
                onToggleLike={() => {}}
                onShare={() => {}}
              />
            );
          })}
        </div>
      </div>

      <FeedViewer
        locale={locale}
        activePost={activeViewerPost}
        viewerDirection={viewerDirection}
        expandedCaption={expandedCaption}
        setExpandedCaption={setExpandedCaption}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        copySuccessId={copySuccessId}
        menuPostId={menuPostId}
        setMenuPostId={setMenuPostId}
        actionError={actionError}
        videoProgress={videoProgress}
        viewerMediaIndex={viewerMediaIndex}
        setViewerMediaIndex={setViewerMediaIndex}
        likedPostIds={likedPostIds}
        savedPostIds={SAVED_POST_IDS_FALLBACK}
        onToggleLike={() => {}}
        onToggleSave={() => {}}
        onHidePost={onHidePost}
        onDeletePost={onDeletePost}
        onGlobalHidePosts={onGlobalHidePosts}
        currentTelegramUserId={currentTelegramUserId}
        openSource={openSource}
        closeViewer={closeOpenedPost}
        nextViewer={nextViewer}
        prevViewer={prevViewer}
        handleShare={async () => {}}
        setActionError={setActionError}
      />

      <FeedTextReaderModal
        post={textReaderPost}
        locale={locale}
        liked={false}
        saved={false}
        onClose={closeOpenedPost}
        onToggleLike={() => {}}
        onToggleSave={() => {}}
      />
    </div>
  );
}