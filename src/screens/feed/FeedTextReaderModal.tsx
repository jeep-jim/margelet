import {
  ArrowLeft,
  Bell,
  ExternalLink,
  Heart,
  Send,
  Bookmark,
} from "lucide-react";
import { useEffect, useState } from "react";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import type { IngestedPost } from "../../types/app";

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

export function FeedTextReaderModal({
  post,
  locale: _locale,
  liked,
  saved,
  onClose,
  onToggleLike,
  onToggleSave,
  onShare,
}: {
  post: IngestedPost | null;
  locale: "ru" | "en";
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onShare: (post: IngestedPost) => Promise<void>;
}) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!post) return;
    setSubscribed(getSubs().includes(post.source.handle));
  }, [post]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
      <div className="mx-auto flex h-full w-full max-w-[720px] items-start justify-center px-0 pt-16 sm:px-4 sm:pt-20">
        <div className="flex h-[calc(100vh-64px)] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:h-[calc(100vh-96px)] sm:rounded-[28px]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="text-sm font-medium text-neutral-950">Пост из Telegram</div>

            <button
              onClick={() => {
                const next = toggleSub(post.source.handle);
                setSubscribed(next.includes(post.source.handle));
                window.dispatchEvent(new Event("storage"));
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
              type="button"
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

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
            <button
              type="button"
              onClick={() => window.location.assign(`/${post.source.handle}`)}
              className="mb-4 flex items-center gap-3 text-left"
            >
              <FeedSourceAvatar post={post} />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-[18px] font-semibold text-neutral-950">
                    {post.source.title}
                  </div>
                  {post.source.verified ? (
                    <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                  ) : null}
                </div>

                <div className="truncate text-sm text-neutral-500">
                  @{post.source.handle}
                </div>
              </div>
            </button>

            {post.media.length > 0 ? (
              <div className="space-y-4">
                {post.media.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50"
                  >
                    {item.kind === "image" ? (
                      <img
                        src={item.url}
                        alt={post.text || post.source.title}
                        className="w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : item.kind === "video" ? (
                      <div className="bg-neutral-100">
                        <video
                          src={item.url}
                          poster={item.poster || undefined}
                          controls
                          className="w-full"
                        />
                      </div>
                    ) : item.kind === "audio" || item.kind === "file" ? (
                      <div className="p-4">
                        <div className="text-sm font-medium text-neutral-950">
                          {item.fileName || "Вложение"}
                        </div>
                        <div className="mt-1 text-sm text-neutral-500">
                          Вложение из поста Telegram
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
                        >
                          <span className="text-white">Открыть файл</span>
                          <ExternalLink className="h-4 w-4 text-white" />
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {post.text ? (
              <div className="mt-6 whitespace-pre-wrap break-words text-[16px] leading-8 text-neutral-950">
                {post.text}
              </div>
            ) : null}
          </div>

          <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-6 text-neutral-700">
                <button type="button" onClick={() => onToggleLike(post.id)}>
                  <Heart
                    className={`h-6 w-6 ${
                      liked
                        ? "fill-neutral-950 text-neutral-950"
                        : "text-neutral-700"
                    }`}
                  />
                </button>

                <button type="button" onClick={() => void onShare(post)}>
                  <Send className="h-6 w-6" />
                </button>

                <button type="button" onClick={() => onToggleSave(post.id)}>
                  <Bookmark
                    className={`h-6 w-6 ${
                      saved
                        ? "fill-neutral-950 text-neutral-950"
                        : "text-neutral-700"
                    }`}
                  />
                </button>
              </div>

              <a
                href={post.postUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
              >
                <span className="text-white">Открыть в Telegram</span>
                <ExternalLink className="h-4 w-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}