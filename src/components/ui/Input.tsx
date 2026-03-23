import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`w-full border border-white/10 bg-black/30 outline-none ${className}`}
      {...props}
    />
  );
}