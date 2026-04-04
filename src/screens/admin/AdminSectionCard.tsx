import type { ReactNode } from "react";

type AdminSectionCardProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function AdminSectionCard({
  title,
  subtitle,
  right,
  children,
}: AdminSectionCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-white/45">{subtitle}</div>
          ) : null}
        </div>

        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {children}
    </div>
  );
}