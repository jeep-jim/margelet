import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import type { IngestedPost } from "../../types/app";

export function FeedSourceAvatar({
  post,
  size = "md",
}: {
  post: IngestedPost;
  size?: "sm" | "md";
}) {
  const boxClass =
    size === "sm" ? "h-10 w-10 text-sm" : "h-11 w-11 text-sm";

  if (post.source.avatar) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full bg-neutral-200 ${boxClass}`}
      >
        <img
          src={post.source.avatar}
          alt={post.source.title}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-200 font-bold text-neutral-900 ${boxClass}`}
    >
      {String(post.source.title || "TG").slice(0, 2).toUpperCase()}
    </div>
  );
}

export function FeedSourceHeader({
  post,
  compact = false,
  onOpenCreator,
}: {
  post: IngestedPost;
  compact?: boolean;
  onOpenCreator: () => void;
}) {
  return (
    <button
      onClick={onOpenCreator}
      className={`flex min-w-0 flex-1 items-center gap-3 text-left ${compact ? "" : "px-4 pt-4 pb-3"}`}
      type="button"
    >
      <FeedSourceAvatar post={post} size="sm" />

      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="min-w-0 truncate text-[18px] font-semibold leading-tight text-neutral-950">
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
  );
}