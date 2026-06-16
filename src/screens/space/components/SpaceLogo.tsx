type Props = {
  isLight: boolean;
  compact?: boolean;
  onClick?: () => void;
};

export function SpaceLogo({ isLight, compact, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`select-none font-black leading-none tracking-[-0.08em] active:scale-95 ${compact ? "text-[24px] sm:text-[26px]" : "text-[30px] sm:text-[32px]"}`}
      aria-label="Space story"
    >
      <span
        className={`${
          isLight
            ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]"
            : "bg-[linear-gradient(90deg,#2ec3ff,#57a6ff,#ffffff)]"
        } bg-clip-text text-transparent`}
      >
        Space
      </span>
    </button>
  );
}
