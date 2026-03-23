import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "default" | "outline" | "secondary";
type ButtonSize = "default" | "sm" | "icon";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center transition disabled:pointer-events-none disabled:opacity-50";

  const variants: Record<ButtonVariant, string> = {
    default: "bg-white text-black hover:bg-white/90",
    outline: "border border-white/15 bg-transparent text-white hover:bg-white/10",
    secondary: "bg-white text-black hover:bg-white/90",
  };

  const sizes: Record<ButtonSize, string> = {
    default: "h-10 px-4 py-2 rounded-xl",
    sm: "h-9 px-3 py-2 rounded-xl text-sm",
    icon: "h-10 w-10 rounded-full",
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}