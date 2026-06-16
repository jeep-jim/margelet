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
      className="select-none px-2 py-1 font-black leading-[1.12] tracking-[-0.075em] active:scale-95"
      style={{
        fontSize: compact ? "30px" : "clamp(36px, 4vw, 46px)",
        fontWeight: 950,
      }}
      aria-label="Space story"
    >
      <span
        className={`${
          isLight
            ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]"
            : "bg-[linear-gradient(90deg,#34caff,#6aa8ff,#ffffff)]"
        } bg-clip-text text-transparent`}
      >
        Space
      </span>
    </button>
  );
}
