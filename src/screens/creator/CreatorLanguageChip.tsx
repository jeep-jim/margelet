import { Globe } from "lucide-react";

export function CreatorLanguageChip({
  active,
  label,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-12 items-center gap-2 rounded-full px-4 transition ${
        active
          ? "bg-strong text-strong-foreground"
          : "border border-soft bg-surface text-secondary bg-surface-hover"
      }`}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
