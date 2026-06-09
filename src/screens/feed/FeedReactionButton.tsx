import { useEffect, useState } from "react";

type FeedReactionButtonProps = {
  active: boolean;
  onClick: () => void;
  compact?: boolean;
};

export function FeedReactionButton({
  active,
  onClick,
  compact = false,
}: FeedReactionButtonProps) {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    if (!burst) return;
    const timer = window.setTimeout(() => setBurst(false), 620);
    return () => window.clearTimeout(timer);
  }, [burst]);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        setBurst(true);
        onClick();
      }}
      className={[
        "relative inline-flex shrink-0 items-center justify-center rounded-full border transition duration-200 active:scale-95",
        compact ? "h-10 w-10" : "h-10 min-w-[58px] px-4",
        active
          ? "border-orange-300/70 bg-orange-400/18 text-orange-200 shadow-[0_0_20px_rgba(251,146,60,.22)]"
          : "border-soft bg-surface-soft text-secondary hover:border-orange-300/45 hover:text-orange-200",
      ].join(" ")}
      aria-pressed={active}
      aria-label={active ? "Убрать из Me" : "Добавить в Me"}
    >
      <span
        className={[
          "text-[17px] leading-none transition duration-200",
          active || burst ? "scale-110 saturate-150" : "grayscale opacity-80",
        ].join(" ")}
      >
        🔥
      </span>

      {burst ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="animate-[margelet-fire-burst_.62s_ease-out_forwards] text-2xl leading-none drop-shadow-[0_5px_16px_rgba(251,146,60,.65)]">
            🔥
          </span>
        </span>
      ) : null}
    </button>
  );
}
