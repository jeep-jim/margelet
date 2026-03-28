import type { ComponentType } from "react";

export function ViewerMetric({
  icon: Icon,
  value,
  active = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
      type="button"
    >
      <Icon
        className={`h-8 w-8 ${active ? "fill-current text-white" : "text-white"}`}
      />
      {value !== "" ? <span className="text-sm font-medium">{value}</span> : null}
    </button>
  );
}

export function ViewerActionButton({
  icon: Icon,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
      type="button"
    >
      <Icon className="h-8 w-8 text-white" />
      <span className="text-sm font-medium opacity-0">0</span>
    </button>
  );
}
