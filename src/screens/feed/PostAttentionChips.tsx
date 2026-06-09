import type { IngestedPost, Locale } from "../../types/app";

const SCORE_BY_MEDIA: Record<string, number> = {
  video: 12,
  photo: 10,
  carousel: 12,
  text: 8,
  gif: 10,
};

function getScore(post: IngestedPost, searchQuery?: string) {
  const base = SCORE_BY_MEDIA[post.contentType] ?? (post.media?.length ? 10 : 8);
  const verifiedBoost = post.source?.verified ? 2 : 0;
  const searchBoost = searchQuery?.trim() ? 2 : 0;
  return Math.max(6, Math.min(20, base + verifiedBoost + searchBoost));
}

export function PostAttentionChips({
  post,
  searchQuery = "",
  locale: _locale = "us",
}: {
  post: IngestedPost;
  searchQuery?: string;
  locale?: Locale;
}) {
  const score = getScore(post, searchQuery);

  return (
    <div className="relative inline-flex max-w-full">
      <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1.5 text-[12px] font-semibold text-primary">
        <span className="text-emerald-400">↗</span>
        <span className="shrink-0 font-semibold">+{score}</span>
      </div>
    </div>
  );
}
