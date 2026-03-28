import { EyeOff, Trash2 } from "lucide-react";

export function FeedMoreMenu({
  isOwner,
  isAdmin,
  onDelete,
  onHide,
}: {
  isOwner: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onHide: () => void;
}) {
  return (
    <div className="absolute right-0 top-12 z-40 min-w-[220px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
      {isOwner || isAdmin ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isAdmin && !isOwner ? "Удалить пост (admin)" : "Удалить пост"}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onHide}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neutral-800 transition hover:bg-neutral-100"
        >
          <EyeOff className="h-4 w-4" />
          <span>Не показывать мне этот пост</span>
        </button>
      )}
    </div>
  );
}
