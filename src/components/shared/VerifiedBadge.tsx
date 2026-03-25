type Props = {
  className?: string;
};

export function VerifiedBadge({ className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      aria-label="Verified"
      title="Verified"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2.75 14.62 4l2.9-.21 1.94 2.16 2.73 1 .54 2.86 1.68 2.38-1 2.74.26 2.9-2.15 1.93-1 2.74-2.86.54L12 21.25 9.38 20l-2.9.21-1.94-2.16-2.73-1-.54-2.86L.59 11.8l1-2.74-.26-2.9L3.48 4.23l1-2.74 2.86-.54L12 2.75Z"
          fill="currentColor"
        />
        <path
          d="m8.7 12.2 2.1 2.1 4.5-4.7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}