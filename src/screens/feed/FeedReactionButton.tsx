import { useEffect, useMemo, useRef, useState } from "react";

export type FeedReactionEmoji = "👍" | "❤️" | "🔥" | "😂" | "😮" | "😥" | "🤢" | "👎";

type FeedReactionButtonProps = {
  active: boolean;
  onClick: () => void;
  compact?: boolean;
  postId?: number;
  pickerAlign?: "left" | "center";
  pickerClassName?: string;
};

export const FEED_REACTIONS: { emoji: FeedReactionEmoji; label: string; score: number }[] = [
  { emoji: "👍", label: "Нравится", score: 1 },
  { emoji: "❤️", label: "Люблю", score: 2 },
  { emoji: "🔥", label: "Горячее", score: 3 },
  { emoji: "😂", label: "Смешно", score: 1 },
  { emoji: "😮", label: "Удивило", score: 2 },
  { emoji: "😥", label: "Грустно", score: 1 },
  { emoji: "🤢", label: "Мерзость", score: -5 },
  { emoji: "👎", label: "Не нравится", score: -2 },
];

const DEFAULT_REACTION: FeedReactionEmoji = "🔥";
const LAST_REACTION_KEY = "margelet_last_reaction_v2";
const POST_REACTION_KEY = "margelet_post_reactions_v1";

function isReactionEmoji(value: unknown): value is FeedReactionEmoji {
  return typeof value === "string" && FEED_REACTIONS.some((item) => item.emoji === value);
}

function readReactionMap(): Record<string, FeedReactionEmoji> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(POST_REACTION_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next: Record<string, FeedReactionEmoji> = {};
    Object.entries(parsed).forEach(([key, value]) => {
      if (isReactionEmoji(value)) next[key] = value;
    });
    return next;
  } catch {
    return {};
  }
}

function writePostReaction(postId: number | undefined, reaction: FeedReactionEmoji) {
  if (typeof window === "undefined" || !postId) return;
  try {
    const map = readReactionMap();
    map[String(postId)] = reaction;
    window.localStorage.setItem(POST_REACTION_KEY, JSON.stringify(map));
    window.dispatchEvent(
      new CustomEvent("margelet:post-reaction", {
        detail: { postId, reaction, score: FEED_REACTIONS.find((item) => item.emoji === reaction)?.score ?? 0 },
      })
    );
  } catch {
    // ignore
  }
}

function readStoredReaction(postId?: number): FeedReactionEmoji {
  if (typeof window === "undefined") return DEFAULT_REACTION;

  if (postId) {
    const map = readReactionMap();
    const ownReaction = map[String(postId)];
    if (isReactionEmoji(ownReaction)) return ownReaction;
  }

  try {
    const raw = window.localStorage.getItem(LAST_REACTION_KEY);
    return isReactionEmoji(raw) ? raw : DEFAULT_REACTION;
  } catch {
    return DEFAULT_REACTION;
  }
}

export function readLocalReactionScore(postId: number): number {
  const reaction = readReactionMap()[String(postId)];
  if (!reaction) return 0;
  return FEED_REACTIONS.find((item) => item.emoji === reaction)?.score ?? 0;
}

export function FeedReactionButton({
  active,
  onClick,
  compact = false,
  postId,
  pickerAlign = "left",
  pickerClassName = "",
}: FeedReactionButtonProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [burstReaction, setBurstReaction] = useState<FeedReactionEmoji | null>(null);
  const [reaction, setReaction] = useState<FeedReactionEmoji>(() => readStoredReaction(postId));

  useEffect(() => {
    setReaction(readStoredReaction(postId));
  }, [postId, active]);

  useEffect(() => {
    if (!pickerOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setPickerOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [pickerOpen]);

  useEffect(() => {
    if (!burstReaction) return;
    const timer = window.setTimeout(() => setBurstReaction(null), 720);
    return () => window.clearTimeout(timer);
  }, [burstReaction]);

  const selectedLabel = useMemo(() => {
    return FEED_REACTIONS.find((item) => item.emoji === reaction)?.label || "Реакция";
  }, [reaction]);

  const chooseReaction = (next: FeedReactionEmoji) => {
    setReaction(next);
    setBurstReaction(next);
    setPickerOpen(false);

    try {
      window.localStorage.setItem(LAST_REACTION_KEY, next);
    } catch {
      // ignore
    }

    writePostReaction(postId, next);
    onClick();
  };

  return (
    <div ref={rootRef} className="relative inline-flex shrink-0">
      {pickerOpen ? (
        <div
          className={[
            "absolute bottom-[calc(100%+10px)] z-[90] flex max-w-[calc(100vw-20px)] items-center gap-1 overflow-x-auto rounded-full border border-white/12 bg-[#0b1622]/96 px-2 py-1.5 shadow-[0_16px_42px_rgba(0,0,0,.45)] backdrop-blur-xl",
            pickerAlign === "center" ? "left-[22%] -translate-x-1/2" : "left-0",
            pickerClassName,
          ].join(" ")}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {FEED_REACTIONS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                chooseReaction(item.emoji);
              }}
              className="grid h-9 w-9 place-items-center rounded-full text-[19px] transition duration-150 hover:scale-125 hover:bg-white/10 active:scale-110"
              title={`${item.label} (${item.score > 0 ? "+" : ""}${item.score})`}
              aria-label={item.label}
            >
              {item.emoji}
            </button>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setPickerOpen((prev) => !prev);
        }}
        className={[
          "relative inline-flex shrink-0 items-center justify-center rounded-full transition duration-200 active:scale-95",
          compact ? "h-10 w-10" : "h-10 min-w-[58px] px-4",
          active
            ? "bg-orange-400/18 text-orange-200 shadow-[0_0_22px_rgba(251,146,60,.26)]"
            : "bg-surface-soft text-secondary hover:bg-orange-400/10 hover:text-orange-200",
        ].join(" ")}
        aria-pressed={active}
        aria-label={`Выбрать реакцию: ${selectedLabel}`}
        title="Выбрать реакцию"
      >
        <span
          className={[
            "text-[17px] leading-none transition duration-200",
            active
              ? "scale-110 saturate-150 drop-shadow-[0_0_10px_rgba(251,146,60,.75)]"
              : "grayscale opacity-85",
          ].join(" ")}
        >
          {reaction}
        </span>

        {burstReaction ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="absolute animate-[margelet-fire-burst_.72s_ease-out_forwards] text-2xl leading-none drop-shadow-[0_5px_16px_rgba(251,146,60,.65)]">
              {burstReaction}
            </span>
          </span>
        ) : null}
      </button>
    </div>
  );
}
