import { Bell, BellOff, CheckSquare, Flag, Send, ThumbsDown, Trash2, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "../../types/app";

type AnchorRect = {
  top: number;
  right: number;
};

const MODERATION_REPORTS_STORAGE_KEY = "margelet_local_moderation_reports_v1";
const MODERATION_REPORTS_EVENT = "margelet:moderation-reports-updated";
const MODERATION_REPORTS_QUEUE_KEY = "margelet_pending_moderation_reports_v1";
const MODERATION_REPORTS_LAST_FLUSH_KEY = "margelet_moderation_reports_last_flush_v1";

type LocalModerationReport = {
  id: string;
  postId: number | null;
  sourceHandle: string | null;
  sourceTitle: string | null;
  sourceCountryCode: string | null;
  reason: string;
  message: string | null;
  count: number;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
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


function readLocalReports(): LocalModerationReport[] {
  try {
    const raw = localStorage.getItem(MODERATION_REPORTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalReports(reports: LocalModerationReport[]) {
  localStorage.setItem(MODERATION_REPORTS_STORAGE_KEY, JSON.stringify(reports.slice(0, 300)));
  window.dispatchEvent(new Event(MODERATION_REPORTS_EVENT));
}


function readQueuedReports(): LocalModerationReport[] {
  try {
    const raw = localStorage.getItem(MODERATION_REPORTS_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueuedReports(reports: LocalModerationReport[]) {
  localStorage.setItem(MODERATION_REPORTS_QUEUE_KEY, JSON.stringify(reports.slice(0, 200)));
}

function queueReportForServer(report: LocalModerationReport) {
  const current = readQueuedReports();
  const exists = current.some((item) => item.id === report.id);
  writeQueuedReports(exists ? current : [report, ...current]);
}

let moderationFlushTimer: number | null = null;

function scheduleModerationReportsFlush() {
  if (typeof window === "undefined") return;
  if (moderationFlushTimer !== null) return;

  moderationFlushTimer = window.setTimeout(() => {
    moderationFlushTimer = null;
    void flushModerationReportsQueue(false);
  }, 45000);
}

async function flushModerationReportsQueue(force: boolean) {
  if (typeof window === "undefined") return;
  const queued = readQueuedReports();
  if (!queued.length) return;

  const now = Date.now();
  const lastFlush = Number(localStorage.getItem(MODERATION_REPORTS_LAST_FLUSH_KEY) || 0);
  if (!force && now - lastFlush < 10 * 60 * 1000) {
    scheduleModerationReportsFlush();
    return;
  }

  try {
    const response = await fetch("/api/admin-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "reports",
        action: "bulk-create",
        reports: queued.map((report) => ({
          postId: report.postId,
          sourceHandle: report.sourceHandle,
          sourceTitle: report.sourceTitle,
          sourceCountryCode: report.sourceCountryCode,
          reason: report.reason,
        })),
      }),
      keepalive: true,
    });

    if (!response.ok) return;
    localStorage.setItem(MODERATION_REPORTS_LAST_FLUSH_KEY, String(now));
    writeQueuedReports([]);
  } catch {
    scheduleModerationReportsFlush();
  }
}

function addLocalReport({
  postId,
  sourceHandle,
  reason,
}: {
  postId: number | null;
  sourceHandle: string;
  reason: string;
}) {
  const now = new Date().toISOString();
  const normalizedReason = reason.trim().toLowerCase() || "other";
  const normalizedHandle = sourceHandle.replace(/^@+/, "").toLowerCase();
  const reportKey = `${postId || "source"}:${normalizedHandle}:${normalizedReason}`;
  const current = readLocalReports();
  const existingIndex = current.findIndex((item) => item.id === reportKey);

  if (existingIndex >= 0) {
    const next = [...current];
    next[existingIndex] = {
      ...next[existingIndex],
      count: (next[existingIndex].count || 1) + 1,
      status: "open",
      updatedAt: now,
    };
    writeLocalReports(next);
    queueReportForServer(next[existingIndex]);
    scheduleModerationReportsFlush();
    return;
  }

  const report: LocalModerationReport = {
    id: reportKey,
    postId,
    sourceHandle: normalizedHandle || null,
    sourceTitle: null,
    sourceCountryCode: null,
    reason: normalizedReason,
    message: null,
    count: 1,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };

  writeLocalReports([
    report,
    ...current,
  ]);
  queueReportForServer(report);
  scheduleModerationReportsFlush();
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
  postId,
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
  const [reportScope, setReportScope] = useState<"post" | "source" | null>(null);
  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    scheduleModerationReportsFlush();

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushModerationReportsQueue(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
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
      share: "Поделиться",
      reportPost: "Пожаловаться на пост",
      reportSource: "Пожаловаться на канал",
      selectAdmin: "Выбрать для модерации",
    },
    ua: {
      subscribeOn: "Увімкнути сповіщення",
      subscribeOff: "Вимкнути сповіщення",
      openTelegram: "Відкрити в Telegram",
      delete: "Видалити пост",
      deleteAdmin: "Видалити пост (admin)",
      hide: "Мені це не цікаво",
      share: "Поділитися",
    },
    us: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
      share: "Share",
    },
    in: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
      share: "Share",
    },
    ir: {
      subscribeOn: "فعال کردن اعلان‌ها",
      subscribeOff: "غیرفعال کردن اعلان‌ها",
      openTelegram: "باز کردن در تلگرام",
      delete: "حذف پست",
      deleteAdmin: "حذف پست (admin)",
      hide: "علاقه‌ای ندارم",
      share: "اشتراک‌گذاری",
    },
    tr: {
      subscribeOn: "Bildirimleri aç",
      subscribeOff: "Bildirimleri kapat",
      openTelegram: "Telegram’da aç",
      delete: "Gönderiyi sil",
      deleteAdmin: "Gönderiyi sil (admin)",
      hide: "İlgimi çekmiyor",
      share: "Paylaş",
    },
    br: {
      subscribeOn: "Ativar notificações",
      subscribeOff: "Desativar notificações",
      openTelegram: "Abrir no Telegram",
      delete: "Excluir post",
      deleteAdmin: "Excluir post (admin)",
      hide: "Não me interessa",
      share: "Compartilhar",
    },
    kz: {
      subscribeOn: "Хабарландыруларды қосу",
      subscribeOff: "Хабарландыруларды өшіру",
      openTelegram: "Telegram-да ашу",
      delete: "Постты жою",
      deleteAdmin: "Постты жою (admin)",
      hide: "Маған қызық емес",
      share: "Бөлісу",
    },
    uz: {
      subscribeOn: "Bildirishnomalarni yoqish",
      subscribeOff: "Bildirishnomalarni o‘chirish",
      openTelegram: "Telegram’da ochish",
      delete: "Postni o‘chirish",
      deleteAdmin: "Postni o‘chirish (admin)",
      hide: "Menga qiziq emas",
      share: "Ulashish",
    },
    ae: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
      share: "مشاركة",
    },
    eg: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
      share: "مشاركة",
    },
    pk: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
      share: "Share",
    },
    id: {
      subscribeOn: "Aktifkan notifikasi",
      subscribeOff: "Nonaktifkan notifikasi",
      openTelegram: "Buka di Telegram",
      delete: "Hapus postingan",
      deleteAdmin: "Hapus postingan (admin)",
      hide: "Saya tidak tertarik",
      share: "Bagikan",
    },
    mx: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
      share: "Compartir",
    },
    sa: {
      subscribeOn: "تفعيل الإشعارات",
      subscribeOff: "إيقاف الإشعارات",
      openTelegram: "فتح في Telegram",
      delete: "حذف المنشور",
      deleteAdmin: "حذف المنشور (admin)",
      hide: "غير مهتم",
      share: "مشاركة",
    },
    es: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
      share: "Compartir",
    },
    it: {
      subscribeOn: "Attiva notifiche",
      subscribeOff: "Disattiva notifiche",
      openTelegram: "Apri in Telegram",
      delete: "Elimina post",
      deleteAdmin: "Elimina post (admin)",
      hide: "Non mi interessa",
      share: "Condividi",
    },
    fr: {
      subscribeOn: "Activer les notifications",
      subscribeOff: "Désactiver les notifications",
      openTelegram: "Ouvrir dans Telegram",
      delete: "Supprimer le post",
      deleteAdmin: "Supprimer le post (admin)",
      hide: "Ça ne m’intéresse pas",
      share: "Partager",
    },
    de: {
      subscribeOn: "Benachrichtigungen aktivieren",
      subscribeOff: "Benachrichtigungen deaktivieren",
      openTelegram: "In Telegram öffnen",
      delete: "Beitrag löschen",
      deleteAdmin: "Beitrag löschen (admin)",
      hide: "Nicht interessant",
      share: "Teilen",
    },
    ar: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
      share: "Compartir",
    },
    co: {
      subscribeOn: "Activar notificaciones",
      subscribeOff: "Desactivar notificaciones",
      openTelegram: "Abrir en Telegram",
      delete: "Eliminar publicación",
      deleteAdmin: "Eliminar publicación (admin)",
      hide: "No me interesa",
      share: "Compartir",
    },
    za: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
      share: "Share",
    },
    ng: {
      subscribeOn: "Enable notifications",
      subscribeOff: "Disable notifications",
      openTelegram: "Open in Telegram",
      delete: "Delete post",
      deleteAdmin: "Delete post (admin)",
      hide: "Not interested",
      share: "Share",
    },
    cn: {
      subscribeOn: "开启通知",
      subscribeOff: "关闭通知",
      openTelegram: "在 Telegram 中打开",
      delete: "删除帖子",
      deleteAdmin: "删除帖子 (admin)",
      hide: "我不感兴趣",
      share: "分享",
    },
    my: {
      subscribeOn: "Aktifkan notifikasi",
      subscribeOff: "Nyahaktifkan notifikasi",
      openTelegram: "Buka di Telegram",
      delete: "Padam siaran",
      deleteAdmin: "Padam siaran (admin)",
      hide: "Saya tidak berminat",
      share: "Kongsi",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.us;

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/${sourceHandle}/${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: "margeleT",
        text: "Посмотрите этот пост в margeleT",
        url: shareUrl,
      }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        alert(copy.share + " — ссылка скопирована");
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(copy.share + " — ссылка скопирована");
    }
  };


  const reportCopy = (() => {
    if (locale === "ru") {
      return {
        reportPost: "Пожаловаться на пост",
        reportSource: "Пожаловаться на канал",
        selectAdmin: "Выбрать для модерации",
        sent: "Жалоба сохранена",
        failed: "Не удалось сохранить жалобу",
        chooseTitle: "Что случилось?",
        send: "Отправить жалобу",
        cancel: "Отмена",
        reasons: [
          ["adult", "18+ / порно"],
          ["scam", "Мошенничество"],
          ["spam", "Спам"],
          ["violence", "Жесть / насилие"],
          ["other", "Другое"],
        ] as Array<[string, string]>,
      };
    }

    return {
      reportPost: "Report post",
      reportSource: "Report channel",
      selectAdmin: "Select for moderation",
      sent: "Report saved",
      failed: "Could not save report",
      chooseTitle: "What happened?",
      send: "Send report",
      cancel: "Cancel",
      reasons: [
        ["adult", "18+ / adult"],
        ["scam", "Scam"],
        ["spam", "Spam"],
        ["violence", "Violence"],
        ["other", "Other"],
      ] as Array<[string, string]>,
    };
  })();

  const openReportModal = (scope: "post" | "source") => {
    setSelectedReportReasons([]);
    setReportScope(scope);
  };

  const submitReport = () => {
    const reasons = selectedReportReasons.length ? selectedReportReasons : ["other"];

    for (const reason of reasons) {
      addLocalReport({
        postId: reportScope === "post" ? postId : null,
        sourceHandle,
        reason,
      });
    }

    setReportScope(null);
    setSelectedReportReasons([]);
    onRequestClose();
  };

  const toggleReportReason = (reason: string) => {
    setSelectedReportReasons((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason]
    );
  };

  const toggleModerationSelection = () => {
    window.dispatchEvent(
      new CustomEvent("margelet:toggle-moderation-post", {
        detail: { postId, sourceHandle },
      })
    );
  };

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

        {/* 🔥 НОВАЯ КНОПКА ПОДЕЛИТЬСЯ */}
        <button
          type="button"
          onClick={() => {
            handleShare();
            onRequestClose();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          <Share2 className="h-4 w-4" />
          <span>{copy.share}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            openReportModal("post");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          <Flag className="h-4 w-4" />
          <span>{reportCopy.reportPost}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            openReportModal("source");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-primary transition hover:bg-surface-soft"
        >
          <Flag className="h-4 w-4" />
          <span>{reportCopy.reportSource}</span>
        </button>

        <div className="my-2 h-px bg-[color:var(--border-soft)]/70" />

        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              toggleModerationSelection();
              onRequestClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-sky-300 transition hover:bg-surface-soft"
          >
            <CheckSquare className="h-4 w-4" />
            <span>{reportCopy.selectAdmin}</span>
          </button>
        ) : null}

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

      {reportScope ? (
        <div className="fixed inset-0 z-[100000] grid place-items-center bg-black/45 px-4 backdrop-blur-sm" onClick={() => setReportScope(null)}>
          <div
            className="w-full max-w-[360px] rounded-[26px] border border-soft bg-surface p-4 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-base font-black text-primary">{reportCopy.chooseTitle}</div>
              <button
                type="button"
                onClick={() => setReportScope(null)}
                className="grid h-9 w-9 place-items-center rounded-full bg-surface-soft text-secondary"
                aria-label={reportCopy.cancel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {reportCopy.reasons.map(([reason, label]) => {
                const checked = selectedReportReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReportReason(reason)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      checked ? "bg-rose-500 text-white" : "bg-surface-soft text-primary hover:bg-surface"
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`grid h-5 w-5 place-items-center rounded-md border ${checked ? "border-white bg-white text-rose-500" : "border-soft text-transparent"}`}>
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={submitReport}
              className="mt-4 w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-black text-white transition hover:bg-rose-400"
            >
              {reportCopy.send}
            </button>
          </div>
        </div>
      ) : null}
    </>,
    document.body
  );
}