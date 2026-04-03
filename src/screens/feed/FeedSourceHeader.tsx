import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
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

export function FeedSourceAvatar({
  post,
  compact = false,
}: {
  post: IngestedPost;
  compact?: boolean;
}) {
  const sizeClass = compact ? "h-10 w-10" : "h-12 w-12";
  const textClass = compact ? "text-sm" : "text-base";

  return (
    <div
      className={`${sizeClass} overflow-hidden rounded-full bg-neutral-200 ${textClass} font-bold text-neutral-900`}
    >
      {post.source.avatar ? (
        <img
          src={post.source.avatar}
          alt={post.source.title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          onError={async (e) => {
            try {
              const res = await fetch(`/api/telegram-preview?url=https://t.me/${post.source.handle}`);
              const data = await res.json();

              if (data.avatar) {
                (e.currentTarget as HTMLImageElement).src = data.avatar;
              }
            } catch {}
          }}
        />        
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {String(post.source.title || "TG").slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

export function FeedSourceHeader({
  post,
  compact = false,
  onOpenCreator,
  showBell = false,
}: {
  post: IngestedPost;
  compact?: boolean;
  onOpenCreator: () => void;
  showBell?: boolean;
}) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setSubscribed(getSubs().includes(post.source.handle));
  }, [post.source.handle]);

  const titleClass = compact ? "text-sm" : "text-base";
  const handleClass = compact ? "text-xs" : "text-sm";
  const bellSize = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onOpenCreator}
        className="flex min-w-0 items-center gap-3 text-left"
        type="button"
      >
        <FeedSourceAvatar post={post} compact={compact} />

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`truncate font-semibold text-neutral-950 ${titleClass}`}>
              {post.source.title}
            </div>
            {post.source.verified ? (
              <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
            ) : null}
          </div>

          <div className={`truncate text-neutral-500 ${handleClass}`}>
            @{post.source.handle}
          </div>
        </div>
      </button>

      {showBell ? (
        <button
          onClick={() => {
            const next = toggleSub(post.source.handle);
            setSubscribed(next.includes(post.source.handle));
            window.dispatchEvent(new Event("storage"));
          }}
          className={`ml-1 flex shrink-0 items-center justify-center rounded-full bg-neutral-100 ${bellSize}`}
          type="button"
          aria-label={subscribed ? "Отключить уведомления" : "Включить уведомления"}
          title={subscribed ? "Отключить уведомления" : "Включить уведомления"}
        >
          <Bell
            className={`h-4 w-4 ${
              subscribed
                ? "fill-neutral-950 text-neutral-950"
                : "text-neutral-400"
            }`}
          />
        </button>
      ) : null}
    </div>
  );
}