type LogoProps = {
  size?: number
  className?: string
}

export default function Logo({ size = 120, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="margeleT logo mark"
      role="img"
    >
      {/* TL triangle (0..100, 0..100) */}
      <path d="M0 0H100L0 100V0Z" fill="#FFA3CE" />

      {/* TR rounded block (100..200, 0..100) with outer radius 50 */}
      <path
        d="M100 0H150A50 50 0 0 1 200 50V100H100V0Z"
        fill="#BE95FA"
      />

      {/* BR triangle (100..200, 100..200) */}
      <path d="M200 100V200H100L200 100Z" fill="#66D492" />

      {/* BL circle fits exactly inside (0..100, 100..200) */}
      <circle cx="50" cy="150" r="50" fill="#E5C289" />
    </svg>
  )
}