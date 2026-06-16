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
      className="select-none font-black leading-none tracking-[-0.08em] drop-shadow-[0_2px_0_rgba(0,0,0,.32)] active:scale-95"
      style={{
        fontSize: compact ? "26px" : "clamp(30px, 3.4vw, 38px)",
        fontWeight: 950,
      }}
      aria-label="Space story"
    >
      <span
        className={`${
          isLight
            ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]"
            : "bg-[linear-gradient(90deg,#28c8ff,#62a9ff,#ffffff)]"
        } bg-clip-text text-transparent`}
      >
        Space
      </span>
    </button>
  );
}
