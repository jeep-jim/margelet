import type { ComponentType } from "react";

export function CreatorTopIconButton({
  active,
  onClick,
  icon: Icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${
        active
          ? "bg-strong text-strong-foreground"
          : "border border-soft bg-surface text-secondary bg-surface-hover"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
