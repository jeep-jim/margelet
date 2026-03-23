import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Badge({ children, className = "", ...props }: Props) {
  return (
    <div className={`inline-flex items-center ${className}`} {...props}>
      {children}
    </div>
  );
}