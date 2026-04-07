import { EyeOff, Trash2 } from "lucide-react";
import type { Locale } from "../../types/app";

export function FeedMoreMenu({
  locale,
  isOwner,
  isAdmin,
  onDelete,
  onHide,
}: {
  locale: Locale;
  isOwner: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onHide: () => void;
}) {
  const COPY = {
    en: {
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Hide this post",
    },
    ru: {
      delete: "Удалить пост",
      deleteAdmin: "Удалить пост (admin)",
      hide: "Скрыть этот пост",
    },
    de: {
      delete: "Beitrag löschen",
      deleteAdmin: "Beitrag löschen (admin)",
      hide: "Diesen Beitrag ausblenden",
    },
    es: {
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "Ocultar esta publicación",
    },
    tr: {
      delete: "Gönderiyi sil",
      deleteAdmin: "Gönderiyi sil (admin)",
      hide: "Bu gönderiyi gizle",
    },
    fr: {
      delete: "Supprimer le post",
      deleteAdmin: "Supprimer le post (admin)",
      hide: "Masquer ce post",
    },
    it: {
      delete: "Elimina post",
      deleteAdmin: "Elimina post (admin)",
      hide: "Nascondi questo post",
    },
    "pt-br": {
      delete: "Excluir post",
      deleteAdmin: "Excluir post (admin)",
      hide: "Ocultar este post",
    },
    id: {
      delete: "Hapus postingan",
      deleteAdmin: "Hapus postingan (admin)",
      hide: "Sembunyikan postingan ini",
    },
    pl: {
      delete: "Usuń post",
      deleteAdmin: "Usuń post (admin)",
      hide: "Ukryj ten post",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  return (
    <div className="absolute right-0 top-12 z-40 min-w-[220px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl">
      {isOwner || isAdmin ? (
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-600 transition hover:bg-rose-50"
        >
          <Trash2 className="h-4 w-4" />
          <span>{isAdmin && !isOwner ? copy.deleteAdmin : copy.delete}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onHide}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neutral-800 transition hover:bg-neutral-100"
        >
          <EyeOff className="h-4 w-4" />
          <span>{copy.hide}</span>
        </button>
      )}
    </div>
  );
}