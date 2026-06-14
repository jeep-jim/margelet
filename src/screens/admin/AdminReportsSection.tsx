import { AlertTriangle, Ban, CheckCircle2, Pause, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";

const MODERATION_REPORTS_STORAGE_KEY = "margelet_local_moderation_reports_v1";
const MODERATION_REPORTS_QUEUE_KEY = "margelet_pending_moderation_reports_v1";
const MODERATION_REPORTS_LAST_FLUSH_KEY = "margelet_moderation_reports_last_flush_v1";
const MODERATION_REPORTS_EVENT = "margelet:moderation-reports-updated";

type ModerationReport = {
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

type Scope = { post: boolean; channel: boolean };

function readLocalReports(): ModerationReport[] {
  try {
    const raw = localStorage.getItem(MODERATION_REPORTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is ModerationReport => item && typeof item.id === "string" && item.status === "open")
      .sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
  } catch {
    return [];
  }
}

function writeLocalReports(reports: ModerationReport[]) {
  localStorage.setItem(MODERATION_REPORTS_STORAGE_KEY, JSON.stringify(reports.slice(0, 300)));
  window.dispatchEvent(new Event(MODERATION_REPORTS_EVENT));
}

function readQueuedReports(): ModerationReport[] {
  try {
    const raw = localStorage.getItem(MODERATION_REPORTS_QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function clearQueuedReports() {
  localStorage.setItem(MODERATION_REPORTS_QUEUE_KEY, "[]");
  localStorage.setItem(MODERATION_REPORTS_LAST_FLUSH_KEY, String(Date.now()));
}

function formatReason(reason: string) {
  const labels: Record<string, string> = {
    spam: "Спам",
    adult: "18+",
    scam: "Мошенничество",
    violence: "Жесть / насилие",
    channel: "Канал",
    other: "Другое",
  };

  return labels[reason] || reason;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getPostImage(post: IngestedPost | null) {
  if (!post) return null;
  return post.media?.find((item) => item.kind === "image")?.url || post.media?.find((item) => item.kind === "video")?.poster || null;
}

function getPostPreview(post: IngestedPost | null) {
  if (!post) return "Пост уже отжил своё или исчез из текущей ленты. Жалобу всё равно можно закрыть или заблокировать канал.";
  return String(post.text || "Пост из Telegram").trim() || "Пост из Telegram";
}

function mergeReports(serverReports: ModerationReport[], localReports: ModerationReport[]) {
  const map = new Map<string, ModerationReport>();
  for (const report of [...serverReports, ...localReports]) {
    if (report.status !== "open") continue;
    const key = report.id || `${report.postId || "source"}:${report.sourceHandle || ""}:${report.reason}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, report);
      continue;
    }

    map.set(key, {
      ...existing,
      count: Math.max(Number(existing.count || 1), Number(report.count || 1)),
      updatedAt:
        Date.parse(report.updatedAt || report.createdAt) > Date.parse(existing.updatedAt || existing.createdAt)
          ? report.updatedAt
          : existing.updatedAt,
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)
  );
}

export function AdminReportsSection({
  telegramUserId,
  posts,
  onDeletePost,
}: {
  telegramUserId: string | null;
  posts: IngestedPost[];
  onDeletePost: (id: number) => Promise<void>;
}) {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [scopes, setScopes] = useState<Record<string, Scope>>({});

  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const localReports = readLocalReports();

    try {
      if (telegramUserId) {
        const queued = readQueuedReports();
        if (queued.length) {
          const pushResponse = await fetch("/api/admin-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entity: "reports",
              action: "bulk-create",
              telegramUserId,
              reports: queued.map((report) => ({
                postId: report.postId,
                sourceHandle: report.sourceHandle,
                sourceTitle: report.sourceTitle,
                sourceCountryCode: report.sourceCountryCode,
                reason: report.reason,
              })),
            }),
          });

          if (pushResponse.ok) clearQueuedReports();
        }
      }

      if (!telegramUserId) {
        setReports(localReports);
        return;
      }

      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "reports",
          action: "list",
          telegramUserId,
        }),
      });

      const data = await response.json().catch(() => null);
      const serverReports = Array.isArray(data?.reports) ? data.reports : [];
      setReports(mergeReports(serverReports, readLocalReports()));
    } catch {
      setReports(localReports);
      setMessage("Не удалось получить жалобы с сервера, показываю локальные.");
    } finally {
      setLoading(false);
    }
  }, [telegramUserId]);

  const resolveReport = async (reportId: string) => {
    const nextLocal = readLocalReports().filter((report) => report.id !== reportId);
    writeLocalReports(nextLocal);
    setReports((prev) => prev.filter((report) => report.id !== reportId));

    if (!telegramUserId) return;

    try {
      await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "reports",
          action: "resolve",
          reportId,
          telegramUserId,
        }),
      });
      await loadReports();
    } catch {
      setMessage("Локально закрыто, сервер проверить не удалось.");
    }
  };

  const updateSourceStatus = async (report: ModerationReport, status: "paused" | "blocked") => {
    if (!telegramUserId || !report.sourceHandle) return;

    const response = await fetch("/api/admin-posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "sources",
        action: "update",
        source: {
          handle: report.sourceHandle,
          countryCode: report.sourceCountryCode || "ru",
          title: report.sourceTitle || report.sourceHandle,
          status,
          note: status === "blocked" ? "blocked by report" : "paused by report",
        },
        telegramUserId,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Не удалось обновить канал");
  };

  const applyReportAction = async (report: ModerationReport, forced?: Partial<Scope>) => {
    const scope = { ...(scopes[report.id] || { post: true, channel: false }), ...(forced || {}) };
    setMessage(null);

    try {
      if (scope.post && report.postId) {
        await onDeletePost(report.postId);
      }

      if (scope.channel) {
        await updateSourceStatus(report, "blocked");
      }

      await resolveReport(report.id);
      setMessage("Готово: действие применено.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось применить действие");
    }
  };

  useEffect(() => {
    const reload = () => {
      void loadReports();
    };

    reload();
    window.addEventListener(MODERATION_REPORTS_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener(MODERATION_REPORTS_EVENT, reload);
      window.removeEventListener("storage", reload);
    };
  }, [loadReports]);

  return (
    <AdminSectionCard
      title="🚨 Жалобы"
      right={reports.length ? `${reports.length} открыто` : loading ? "загрузка" : "0 жалоб"}
    >
      <div className="space-y-3">
        {message ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {message}
          </div>
        ) : null}

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/55">
            Жалоб пока нет. Если люди начнут жаловаться из ленты, они появятся здесь и в мигалке поверх сайта.
          </div>
        ) : null}

        {reports.map((report) => {
          const post = report.postId ? postById.get(report.postId) || null : null;
          const image = getPostImage(post);
          const open = Boolean(openIds[report.id]);
          const scope = { ...(scopes[report.id] || { post: true, channel: false }) };

          return (
            <div key={report.id} className="overflow-hidden rounded-[22px] border border-rose-400/20 bg-rose-500/8">
              <button
                type="button"
                onClick={() => setOpenIds((prev) => ({ ...prev, [report.id]: !prev[report.id] }))}
                className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-black text-white">
                    <AlertTriangle className="h-4 w-4 text-rose-300" />
                    <span>{formatReason(report.reason)}</span>
                    <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-100">
                      ×{report.count || 1}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs text-white/55">
                    {report.sourceTitle || report.sourceHandle || "Без источника"}
                    {report.sourceCountryCode ? ` · ${report.sourceCountryCode.toUpperCase()}` : ""}
                    {report.postId ? ` · post ${report.postId}` : ""}
                  </div>
                </div>
                <span className={`text-white/55 transition ${open ? "rotate-180" : ""}`}>⌄</span>
              </button>

              {open ? (
                <div className="space-y-3 border-t border-white/10 p-3">
                  <div className="flex gap-3 rounded-2xl bg-black/16 p-3">
                    {image ? (
                      <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/8 text-3xl">🐤</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white/55">
                        {report.sourceTitle || report.sourceHandle || post?.source?.title || "Telegram"}
                      </div>
                      <div className="mt-1 line-clamp-3 text-sm font-bold leading-5 text-white/88">
                        {getPostPreview(post)}
                      </div>
                      <div className="mt-2 text-[11px] text-white/38">{formatDate(report.updatedAt)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-sm font-bold text-white/80">
                      <input
                        type="checkbox"
                        checked={scope.post}
                        onChange={(event) =>
                          setScopes((prev) => ({
                            ...prev,
                            [report.id]: { ...scope, post: event.target.checked },
                          }))
                        }
                      />
                      ✅ пост
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-sm font-bold text-white/80">
                      <input
                        type="checkbox"
                        checked={scope.channel}
                        onChange={(event) =>
                          setScopes((prev) => ({
                            ...prev,
                            [report.id]: { ...scope, channel: event.target.checked },
                          }))
                        }
                      />
                      ✅ канал
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => void applyReportAction(report, { post: true, channel: false })}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white"
                    >
                      <Trash2 className="h-4 w-4" /> удалить
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateSourceStatus(report, "blocked").then(() => resolveReport(report.id)).catch((error) => setMessage(error instanceof Error ? error.message : "Не удалось заблокировать"))}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-2 text-xs font-black text-white"
                    >
                      <Ban className="h-4 w-4" /> блок
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateSourceStatus(report, "paused").then(() => resolveReport(report.id)).catch((error) => setMessage(error instanceof Error ? error.message : "Не удалось поставить паузу"))}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white"
                    >
                      <Pause className="h-4 w-4" /> пауза
                    </button>
                    <button
                      type="button"
                      onClick={() => void resolveReport(report.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-black text-emerald-100"
                    >
                      <CheckCircle2 className="h-4 w-4" /> закрыть
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void applyReportAction(report)}
                    className="w-full rounded-2xl bg-white px-3 py-2 text-sm font-black text-black"
                  >
                    Применить выбранное
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => void loadReports()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Обновить жалобы
        </button>
      </div>
    </AdminSectionCard>
  );
}
