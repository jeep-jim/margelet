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

  const toggle = () => {
    if (!collapsible) return;
    setCollapsed((prev) => !prev);
  };

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-5">
      <div
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onClick={toggle}
        onKeyDown={(event) => {
          if (!collapsible) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className={`flex items-start justify-between gap-3 ${
          collapsible ? "cursor-pointer select-none" : ""
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-lg font-semibold tracking-tight text-white">
              {title}
            </div>
          </div>          

          {subtitle ? (
            <div className="mt-1 text-sm text-white/45">{subtitle}</div>
          ) : null}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          {badge ? <div>{badge}</div> : null}
          {right}
        </div>
      </div>

      {!collapsed ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}