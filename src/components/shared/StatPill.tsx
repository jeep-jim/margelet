import type { ComponentType } from "react";

type Props = {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
};

export function StatPill({ icon: Icon, value, label }: Props) {
  return (
    <div className="flex min-w-[72px] flex-col items-center gap-1 rounded-2xl border border-white/12 bg-black/35 px-3 py-3 text-white backdrop-blur-md">
      <Icon className="h-4 w-4" />
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/55">{label}</div>
    </div>
  );
}