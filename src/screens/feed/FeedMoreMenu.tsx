import { Bell, EyeOff, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../../types/app";

type AnchorRect = {
  top: number;
  right: number;
};

export function FeedMoreMenu({
  locale,
  isOwner,
  isAdmin,
  onDelete,
  onHide,
  onOpenTelegram,
  onToggleSubscribe,
  onRequestClose,
  anchorRect,
}: {
  locale: Locale;
  isOwner: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onHide: () => void;
  onOpenTelegram: () => void;
  onToggleSubscribe: () => void;
  onRequestClose: () => void;
  anchorRect: AnchorRect | null;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onRequestClose();
      }
    }

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      onRequestClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onRequestClose]);

  const COPY = {
    en: {
      subscribe: "Enable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Hide this post",
    },
    ru: {
      subscribe: "Включить уведомления",
      openTelegram: "Открыть в Telegram",
      delete: "Удалить пост",
      deleteAdmin: "Удалить пост (admin)",
      hide: "Не показывать",
    },
    de: {
      subscribe: "Benachrichtigungen aktivieren",
      openTelegram: "In Telegram öffnen",
      delete: "Beitrag löschen",
      deleteAdmin: "Beitrag löschen (admin)",
      hide: "Diesen Beitrag ausblenden",
    },
    es: {
      subscribe: "Activar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "Ocultar esta publicación",
    },
    tr: {
      subscribe: "Bildirimleri aç",
      openTelegram: "Telegram’da aç",
      delete: "Gönderiyi sil",
      deleteAdmin: "Gönderiyi sil (admin)",
      hide: "Bu gönderiyi gizle",
    },
    fr: {
      subscribe: "Activer les notifications",
      openTelegram: "Ouvrir dans Telegram",
      delete: "Supprimer le post",
      deleteAdmin: "Supprimer le post (admin)",
      hide: "Masquer ce post",
    },
    it: {
      subscribe: "Attiva notifiche",
      openTelegram: "Apri in Telegram",
      delete: "Elimina post",
      deleteAdmin: "Elimina post (admin)",
      hide: "Nascondi questo post",
    },
    "pt-br": {
      subscribe: "Ativar notificações",
      openTelegram: "Abrir no Telegram",
      delete: "Excluir post",
      deleteAdmin: "Excluir post (admin)",
      hide: "Ocultar este post",
    },
    id: {
      subscribe: "Aktifkan notifikasi",
      openTelegram: "Buka di Telegram",
      delete: "Hapus postingan",
      deleteAdmin: "Hapus postingan (admin)",
      hide: "Sembunyikan postingan ini",
    },
    pl: {
      subscribe: "Włącz powiadomienia",
      openTelegram: "Otwórz w Telegramie",
      delete: "Usuń post",
      deleteAdmin: "Usuń post (admin)",
      hide: "Ukryj ten post",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const position = useMemo(() => {
    const width = 248;
    const rightGap = 12;
    const top = (anchorRect?.top ?? 72) + 10;

    return {
      top,
      right: rightGap,
      width,
    };
  }, [anchorRect]);

  if (!mounted) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onRequestClose} />

      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[248px] rounded-[22px] border border-soft bg-surface p-2 shadow-soft"
        style={{
          top: position.top,
          right: position.right,
          width: position.width,
        }}
      >
        <button
          type="button"
          onClick={() => {
            onToggleSubscribe();
            onRequestClose();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          <Bell className="h-4 w-4" />
          <span>{copy.subscribe}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenTelegram();
            onRequestClose();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          <Send className="h-4 w-4" />
          <span>{copy.openTelegram}</span>
        </button>

        <div className="my-2 h-px bg-[color:var(--border-soft)]/70" />

        {isOwner || isAdmin ? (
          <button
            type="button"
            onClick={() => {
              onDelete();
              onRequestClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-rose-400 transition hover:bg-surface-soft"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isAdmin && !isOwner ? copy.deleteAdmin : copy.delete}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              onHide();
              onRequestClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
          >
            <EyeOff className="h-4 w-4" />
            <span>{copy.hide}</span>
          </button>
        )}
      </div>
    </>
  );
}