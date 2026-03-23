import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "", ...props }: Props) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}