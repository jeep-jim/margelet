import type { ComponentType } from "react";

export function ViewerMetric({
  icon: Icon,
  active = false,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center text-white"
      type="button"
    >
      <Icon
        className={`h-8 w-8 ${active ? "fill-current text-white" : "text-white"}`}
      />
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
      className="flex items-center justify-center text-white"
      type="button"
    >
      <Icon className="h-8 w-8 text-white" />
    </button>
  );
}