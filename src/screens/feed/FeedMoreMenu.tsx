import { Bell, BellOff, EyeOff, Send, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../types/app";

type AnchorRect = { top: number; right: number };

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
  const next = exists ? current.filter((h) => h !== handle) : [...current, handle];
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

  useEffect(() => setMounted(true), []);
  useEffect(() => setSubscribed(getSubs().includes(sourceHandle)), [sourceHandle]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onRequestClose();
    }
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && !menuRef.current?.contains(target)) onRequestClose();
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

  const copy = useMemo(() => {
    const map = {
      en: { tg: "Open in Telegram", hide: "Hide post", del: "Delete post", on: "Enable notifications", off: "Disable notifications" },
      ru: { tg: "Открыть в Telegram", hide: "Скрыть пост", del: "Удалить пост", on: "Включить уведомления", off: "Отключить уведомления" },
    } as const;
    return map[locale as "en" | "ru"] ?? map.en;
  }, [locale]);

  if (!mounted || !anchorRect) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[70] min-w-[220px] overflow-hidden rounded-[22px] border border-soft bg-surface shadow-2xl"
      style={{ top: anchorRect.top + 8, right: anchorRect.right }}
    >
      <button
        type="button"
        onClick={() => {
          const next = toggleSub(sourceHandle);
          setSubscribed(next.includes(sourceHandle));
          window.dispatchEvent(new Event("storage"));
          onRequestClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-primary transition hover:bg-surface-soft"
      >
        {subscribed ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        <span>{subscribed ? copy.off : copy.on}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onOpenTelegram();
          onRequestClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-primary transition hover:bg-surface-soft"
      >
        <Send className="h-4 w-4" />
        <span>{copy.tg}</span>
      </button>

      <button
        type="button"
        onClick={() => {
          onHide();
          onRequestClose();
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-primary transition hover:bg-surface-soft"
      >
        <EyeOff className="h-4 w-4" />
        <span>{copy.hide}</span>
      </button>

      {(isOwner || isAdmin) ? (
        <button
          type="button"
          onClick={() => {
            onDelete();
            onRequestClose();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-400 transition hover:bg-surface-soft"
        >
          <Trash2 className="h-4 w-4" />
          <span>{copy.del}</span>
        </button>
      ) : null}
    </div>,
    document.body,
  );
}
