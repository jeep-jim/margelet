import { useState, type ReactNode } from "react";

type AdminSectionCardProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  badge?: ReactNode;
};

export function AdminSectionCard({
  title,
  subtitle,
  right,
  children,
  collapsible = false,
  defaultCollapsed = false,
  badge,
}: AdminSectionCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-white">{title}</div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>
          {subtitle ? <div className="mt-1 text-sm text-white/45">{subtitle}</div> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {right ? <div>{right}</div> : null}
          {collapsible ? (
            <button
              type="button"
              onClick={() => setCollapsed((prev) => !prev)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10"
            >
              {collapsed ? "Развернуть" : "Свернуть"}
            </button>
          ) : null}
        </div>
      </div>

      {!collapsed ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
