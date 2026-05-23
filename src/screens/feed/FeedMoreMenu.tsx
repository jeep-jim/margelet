import { Bell, BellOff, Send, ThumbsDown, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../types/app";

type AnchorRect = {
  top: number;
  right: number;
};

function getSubs(): string[] {
  try {
    const raw = localStorage.getItem("margelet_subscriptions");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);
  const next = exists
    ? current.filter((h) => h !== handle)
    : [...current, handle];

  localStorage.setItem("margelet_subscriptions", JSON.stringify(next));
  return next;
}

export function FeedMoreMenu({
  locale,
  isOwner,
  isAdmin,
  onDelete,
  onHide,
  onOpenTelegram,
  onRequestClose,
  anchorRect,
  postId: _postId,
  sourceHandle,
}: {
  locale: Locale;
  isOwner: boolean;
  isAdmin: boolean;
  onDelete: () => void;
  onHide: () => void;
  onOpenTelegram: () => void;
  onRequestClose: () => void;
  anchorRect: AnchorRect | null;
  postId: number;
  sourceHandle: string;
}) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSubscribed(getSubs().includes(sourceHandle));
  }, [sourceHandle]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onRequestClose();
      }
    }

    function handleScrollClose() {
      onRequestClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollClose, { passive: true });
    window.addEventListener("wheel", handleScrollClose, { passive: true });
    window.addEventListener("touchmove", handleScrollClose, { passive: true });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollClose);
      window.removeEventListener("wheel", handleScrollClose);
      window.removeEventListener("touchmove", handleScrollClose);
    };
  }, [onRequestClose]);

  const COPY = {
    ru: {
      subscribeOn: "Включить уведомления",
      subscribeOff: "Отключить уведомления",
      openTelegram: "Открыть в Telegram",
      delete: "Удалить пост",
      deleteAdmin: "Удалить пост (admin)",
      hide: "Мне это не интересно!",
    },
    ua: {
      subscribeOn: "Увімкнути сповіщення",
      subscribeOff: "Вимкнути сповіщення",
      openTelegram: "Відкрити в Telegram",
      delete: "Видалити пост",
      deleteAdmin: "Видалити пост (admin)",
      hide: "Мені це не цікаво",
    },
    us: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
    },
    in: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
    },
    ir: {
      subscribeOn: "فعال کردن اعلان‌ها",
      subscribeOff: "غیرفعال کردن اعلان‌ها",
      openTelegram: "باز کردن در تلگرام",
      delete: "حذف پست",
      deleteAdmin: "حذف پست (admin)",
      hide: "علاقه‌ای ندارم",
    },
    tr: {
      subscribeOn: "Bildirimleri aç",
      subscribeOff: "Bildirimleri kapat",
      openTelegram: "Telegram’da aç",
      delete: "Gönderiyi sil",
      deleteAdmin: "Gönderiyi sil (admin)",
      hide: "İlgimi çekmiyor",
    },
    br: {
      subscribeOn: "Ativar notificações",
      subscribeOff: "Desativar notificações",
      openTelegram: "Abrir no Telegram",
      delete: "Excluir post",
      deleteAdmin: "Excluir post (admin)",
      hide: "Não me interessa",
    },
    kz: {
      subscribeOn: "Хабарландыруларды қосу",
      subscribeOff: "Хабарландыруларды өшіру",
      openTelegram: "Telegram-да ашу",
      delete: "Постты жою",
      deleteAdmin: "Постты жою (admin)",
      hide: "Маған қызық емес",
    },
    uz: {
      subscribeOn: "Bildirishnomalarni yoqish",
      subscribeOff: "Bildirishnomalarni o‘chirish",
      openTelegram: "Telegram’da ochish",
      delete: "Postni o‘chirish",
      deleteAdmin: "Postni o‘chirish (admin)",
      hide: "Menga qiziq emas",
    },
    ae: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
    },
    eg: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
    },
    pk: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
    },
    id: {
      subscribeOn: "Aktifkan notifikasi",
      subscribeOff: "Nonaktifkan notifikasi",
      openTelegram: "Buka di Telegram",
      delete: "Hapus postingan",
      deleteAdmin: "Hapus postingan (admin)",
      hide: "Saya tidak tertarik",
    },
    mx: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
    },
    sa: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
    },
    es: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
    },
    it: {
      subscribeOn: "Attiva notifiche",
      subscribeOff: "Disattiva notifiche",
      openTelegram: "Apri in Telegram",
      delete: "Elimina post",
      deleteAdmin: "Elimina post (admin)",
      hide: "Non mi interessa",
    },
    fr: {
      subscribeOn: "Activer les notifications",
      subscribeOff: "Désactiver les notifications",
      openTelegram: "Ouvrir dans Telegram",
      delete: "Supprimer le post",
      deleteAdmin: "Supprimer le post (admin)",
      hide: "Ça ne m’intéresse pas",
    },
    de: {
      subscribeOn: "Benachrichtigungen aktivieren",
      subscribeOff: "Benachrichtigungen deaktivieren",
      openTelegram: "In Telegram öffnen",
      delete: "Beitrag löschen",
      deleteAdmin: "Beitrag löschen (admin)",
      hide: "Nicht interessant",
    },
    ar: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
    },
    co: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
    },
    za: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
    },
    ng: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
    },
    cn: {
      subscribeOn: "开启通知",
      subscribeOff: "关闭通知",
      openTelegram: "在 Telegram 中打开",
      delete: "删除帖子",
      deleteAdmin: "删除帖子 (admin)",
      hide: "我不感兴趣",
    },
    my: {
      subscribeOn: "Aktifkan notifikasi",
      subscribeOff: "Nyahaktifkan notifikasi",
      openTelegram: "Buka di Telegram",
      delete: "Padam siaran",
      deleteAdmin: "Padam siaran (admin)",
      hide: "Saya tidak berminat",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.us;

  const position = useMemo(() => {
    return {
      top: Math.max(12, (anchorRect?.top ?? 72) + 8),
      right: Math.max(12, anchorRect?.right ?? 12),
      width: 286,
    };
  }, [anchorRect]);

  if (!mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onRequestClose} />

      <div
        ref={menuRef}
        className="fixed z-[99999] min-w-[286px] rounded-[22px] border border-soft bg-surface p-2 shadow-soft"
        style={{
          top: position.top,
          right: position.right,
          width: position.width,
        }}
      >
        <button
          type="button"
          onClick={() => {
            const next = toggleSub(sourceHandle);
            const isNowSubscribed = next.includes(sourceHandle);

            setSubscribed(isNowSubscribed);
            window.dispatchEvent(new Event("storage"));
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          {subscribed ? (
            <BellOff className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4 text-secondary" />
          )}
          <span>{subscribed ? copy.subscribeOff : copy.subscribeOn}</span>
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
            <ThumbsDown className="h-4 w-4" />
            <span>{copy.hide}</span>
          </button>
        )}
      </div>
    </>,
    document.body
  );
}