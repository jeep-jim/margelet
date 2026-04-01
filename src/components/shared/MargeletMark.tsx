type Props = {
  className?: string;
  colorClassName?: string;
};

export function MargeletMark({
  className = "h-5 w-5",
  colorClassName = "text-neutral-950",
}: Props) {
  return (
    <svg
      viewBox="0 0 240 215"
      aria-hidden="true"
      className={`${className} ${colorClassName}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M215.025 0C234.222 -6.65057e-08 246.22 20.8334 236.622 37.5L204.309 93.6075L131.456 75.5362C121.746 73.128 114.937 84.9515 121.873 92.1778L173.91 146.392L141.597 202.5C131.998 219.167 108.002 219.167 98.4031 202.5L3.37807 37.5C-6.22012 20.8335 5.77782 0.000351823 24.9745 0H215.025Z"
        transform="matrix(-1 0 0 1 240 0)"
        fill="currentColor"
      />
    </svg>
  );
}