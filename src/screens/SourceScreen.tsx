import {
  ArrowLeft,
  Bell,
  MoreVertical,
  Play,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getMessages } from "../lib/i18n";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import { getTagLabel } from "./feed/feed.utils";
import type { Locale } from "../types/app";
import type { IngestedPost } from "../types/app";

type Props = {
  locale: Locale;
  posts: IngestedPost[];
  sourceHandle: string | null;
  onBack: () => void;
  onOpenPost: (post: IngestedPost) => void;
};

const SUB_KEY = "margelet_subscriptions";

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

  const next = exists
    ? current.filter((h) => h !== handle)
    : [...current, handle];

  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

function getPreview(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    null
  );
}

function SourceTile({
  post,
  locale,
  onOpen,
}: {
  post: IngestedPost;
  locale: Locale;
  onOpen: () => void;
}) {
  const preview = getPreview(post);

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
      type="button"
    >
      {preview ? (
        <img
          src={preview}
          alt={post.text || post.source.title}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-200" />
      )}

      <div className="absolute inset-0 bg-black/10" />

      {post.contentType === "video" ? (
        <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
          <Play className="h-7 w-7 text-white" />
        </div>
      ) : null}

      <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
        {getTagLabel(post.tag, locale)}
      </div>
    </button>
  );
}

export function SourceScreen({
  locale,
  posts,
  sourceHandle,
  onBack,
  onOpenPost,
}: Props) {
  const t = getMessages(locale);
  const sourcePosts = posts.filter((post) => post.source.handle === sourceHandle);
  const source = sourcePosts[0];
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!source?.source.handle) return;
    setSubscribed(getSubs().includes(source.source.handle));
  }, [source?.source.handle]);

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
        <div className="mx-auto max-w-[570px]">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.common.back}
            </button>
          </div>

          <div className="text-lg font-semibold">{t.source.notFound}</div>
        </div>
      </div>
    );
  }

  const totalMedia = sourcePosts.filter((post) => post.media.length > 0).length;
  const totalVideos = sourcePosts.filter((post) => post.contentType === "video").length;

  const openTelegramSource = () => {
    window.open(`https://t.me/${source.source.handle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
      <div className="mx-auto max-w-[570px]">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-neutral-700"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.common.back}
          </button>

          <button className="rounded-full p-2 text-neutral-500" type="button">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-xs font-bold text-neutral-900">
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

            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-[18px] font-semibold leading-tight text-neutral-950">
                  {source.source.title}
                </div>
                {source.source.verified ? (
                  <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="mt-1 truncate text-[14px] text-neutral-500">
                @{source.source.handle}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.posts}
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourcePosts.length}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.video}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalVideos}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {t.source.media}
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalMedia}</div>
            </div>
          </div>

          <div className="mt-5 flex w-full items-center justify-between gap-3">
            <button
              onClick={openTelegramSource}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              type="button"
            >
              <span>{t.feed.openChannel}</span>
              <ExternalLink className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                const next = toggleSub(source.source.handle);
                setSubscribed(next.includes(source.source.handle));
                window.dispatchEvent(new Event("storage"));
              }}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100"
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
              <Bell
                className={`h-5 w-5 ${
                  subscribed
                    ? "fill-neutral-950 text-neutral-950"
                    : "text-neutral-400"
                }`}
              />
            </button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sourcePosts.map((post) => (
            <SourceTile
              key={post.id}
              post={post}
              locale={locale}
              onOpen={() => onOpenPost(post)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}