import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Pause,
  RefreshCw,
  Trash2,
} from "lucide-react";
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

function normalizeHandle(handle?: string | null) {
  return String(handle || "")
    .replace(/^@+/, "")
    .trim();
}

function getPostImage(post: IngestedPost | null) {
  if (!post) return null;
  return post.media?.find((item) => item.kind === "image")?.url || post.media?.find((item) => item.kind === "video")?.poster || null;
}

function getPostPreview(post: IngestedPost | null) {
  if (!post) return "Пост уже отжил своё или исчез из текущей ленты. Жалобу всё равно можно закрыть, удалить следы или заблокировать канал.";
  return String(post.text || "Пост из Telegram").trim() || "Пост из Telegram";
}

function getPostUrl(report: ModerationReport, post: IngestedPost | null) {
  const anyPost = post as any;
  const directUrl =
    anyPost?.postUrl ||
    anyPost?.url ||
    anyPost?.permalink ||
    anyPost?.link ||
    anyPost?.source?.postUrl ||
    null;

  if (directUrl) return String(directUrl);

  const handle = normalizeHandle(report.sourceHandle || anyPost?.source?.handle || anyPost?.sourceHandle);
  const postId = report.postId || anyPost?.id;

  if (handle && postId) return `/${handle}/${postId}`;
  if (handle) return `https://t.me/${handle}`;
  return null;
}

function getSourceUrl(report: ModerationReport, post: IngestedPost | null) {
  const anyPost = post as any;
  const directUrl = anyPost?.source?.url || anyPost?.sourceUrl || null;
  if (directUrl) return String(directUrl);

  const handle = normalizeHandle(report.sourceHandle || anyPost?.source?.handle || anyPost?.sourceHandle);
  return handle ? `https://t.me/${handle}` : null;
}

function getSourceTitle(report: ModerationReport, post: IngestedPost | null) {
  const anyPost = post as any;
  return (
    report.sourceTitle ||
    anyPost?.source?.title ||
    anyPost?.sourceTitle ||
    report.sourceHandle ||
    "Telegram"
  );
}

function getSourceHandle(report: ModerationReport, post: IngestedPost | null) {
  const anyPost = post as any;
  return normalizeHandle(report.sourceHandle || anyPost?.source?.handle || anyPost?.sourceHandle);
}

function getSourceAvatar(_report: ModerationReport, post: IngestedPost | null) {
  const anyPost = post as any;
  return (
    anyPost?.source?.avatar ||
    anyPost?.source?.avatarUrl ||
    anyPost?.sourceAvatar ||
    anyPost?.avatar ||
    null
  );
}

function openUrl(url: string | null) {
  if (!url) return;
  window.open(url, "_blank", "noopener,noreferrer");
}

function mergeReports(
  serverReports: ModerationReport[],
  localReports: ModerationReport[]
) {
  const serverIds = new Set(
    serverReports.map((report) => report.id)
  );

  const validLocalReports = localReports.filter((report) => {
    if (!report.id) return false;

    return serverIds.has(report.id);
  });

  const map = new Map<string, ModerationReport>();

  for (const report of [
    ...serverReports,
    ...validLocalReports,
  ]) {
    if (report.status !== "open") continue;

    const key =
      report.id ||
      `${report.postId}:${report.sourceHandle}:${report.reason}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, report);

      continue;
    }

    map.set(key, {
      ...existing,

      count: Math.max(
        Number(existing.count || 1),

        Number(report.count || 1)
      ),

      updatedAt:
        Date.parse(
          report.updatedAt ||
            report.createdAt
        ) >
        Date.parse(
          existing.updatedAt ||
            existing.createdAt
        )
          ? report.updatedAt
          : existing.updatedAt,
    });
  }

  return [...map.values()].sort(
    (a, b) =>
      Date.parse(
        b.updatedAt ||
          b.createdAt
      ) -
      Date.parse(
        a.updatedAt ||
          a.createdAt
      )
  );
}

export function AdminReportsSection({
  telegramUserId,
  posts,
}: {
  telegramUserId: string | null;
  posts: IngestedPost[];
  onDeletePost?: (id: number) => Promise<void>;
}) {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [scope, setScope] = useState<Scope>({ post: true, channel: false });
  const [applying, setApplying] = useState(false);

  const postById = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const openReports = reports.filter((report) => report.status === "open");
  const selectedReportIds = openReports.filter((report) => selectedIds[report.id]).map((report) => report.id);
  const selectedCount = selectedReportIds.length;
  const allSelected = openReports.length > 0 && selectedCount === openReports.length;

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
      const serverReports =
        Array.isArray(data?.reports)

          ? data.reports

          : [];

      localStorage.setItem(
        MODERATION_REPORTS_STORAGE_KEY,

        JSON.stringify(serverReports)
      );

      setReports(
        mergeReports(
          serverReports,

          readLocalReports()
        )
      );

      setReports(mergeReports(serverReports, readLocalReports()));
    } catch {
      setReports(localReports);
      setMessage("Не удалось получить жалобы с сервера, показываю локальные.");
    } finally {
      setLoading(false);
    }
  }, [telegramUserId]);

  const toggleSelect = (reportId: string) => {
    setSelectedIds((prev) => ({ ...prev, [reportId]: !prev[reportId] }));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds({});
      return;
    }

    const next: Record<string, boolean> = {};
    for (const report of openReports) next[report.id] = true;
    setSelectedIds(next);
  };

  const applyBulkAction = async (moderationAction: "delete" | "block" | "pause" | "close") => {
    if (!telegramUserId) {
      setMessage("Нужна авторизация администратора.");
      return;
    }

    if (!selectedReportIds.length) {
      setMessage("Сначала выбери жалобы.");
      return;
    }

    setApplying(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "reports",
          action: "bulk-apply",
          telegramUserId,
          reportIds: selectedReportIds,
          moderationAction,
          scope:
            moderationAction === "delete"
              ? scope
              : moderationAction === "block" || moderationAction === "pause"
                ? { post: false, channel: true }
                : { post: false, channel: false },
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Не удалось применить действие");

      setSelectedIds({});
      setOpenIds({});
      setReports(Array.isArray(data?.reports) ? mergeReports(data.reports, readLocalReports()) : []);
      setMessage(
        moderationAction === "delete"
          ? `Готово: обработано ${selectedReportIds.length} жалоб.`
          : moderationAction === "block"
            ? `Готово: каналы отправлены в блок.`
            : moderationAction === "pause"
              ? `Готово: каналы поставлены на паузу.`
              : `Готово: жалобы закрыты.`
      );
      window.dispatchEvent(new Event(MODERATION_REPORTS_EVENT));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось применить действие");
    } finally {
      setApplying(false);
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
        <button
          type="button"
          onClick={() => setSectionOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/10"
        >
          <span>{reports.length ? `Открытые жалобы · ${reports.length}` : "Жалоб пока нет"}</span>
          <ChevronDown className={`h-4 w-4 text-white/55 transition ${sectionOpen ? "rotate-180" : ""}`} />
        </button>

        {sectionOpen ? (
          <>
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

            {reports.length > 0 ? (
              <div className="sticky top-2 z-20 rounded-[24px] border border-white/10 bg-[#101620]/95 p-3 shadow-2xl shadow-black/35 backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-black transition hover:bg-white/90"
                    >
                      {allSelected ? "Снять всё" : "Выделить всё"}
                    </button>
                    <span className="rounded-full bg-white/8 px-3 py-2 text-xs font-black text-white/70">
                      выбрано: {selectedCount}
                    </span>
                    <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-xs font-black text-white/80">
                      <input
                        type="checkbox"
                        checked={scope.post}
                        onChange={(event) => setScope((prev) => ({ ...prev, post: event.target.checked }))}
                      />
                      пост
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white/8 px-3 py-2 text-xs font-black text-white/80">
                      <input
                        type="checkbox"
                        checked={scope.channel}
                        onChange={(event) => setScope((prev) => ({ ...prev, channel: event.target.checked }))}
                      />
                      канал
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
                    <button
                      type="button"
                      disabled={!selectedCount || applying}
                      onClick={() => void applyBulkAction("delete")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" /> удалить
                    </button>
                    <button
                      type="button"
                      disabled={!selectedCount || applying}
                      onClick={() => void applyBulkAction("block")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Ban className="h-4 w-4" /> блок
                    </button>
                    <button
                      type="button"
                      disabled={!selectedCount || applying}
                      onClick={() => void applyBulkAction("pause")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Pause className="h-4 w-4" /> пауза
                    </button>
                    <button
                      type="button"
                      disabled={!selectedCount || applying}
                      onClick={() => void applyBulkAction("close")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 px-3 py-2 text-xs font-black text-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <CheckCircle2 className="h-4 w-4" /> закрыть
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {reports.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {reports.map((report) => {
                  const post = report.postId ? postById.get(report.postId) || null : null;
                  const image = getPostImage(post);
                  const avatar = getSourceAvatar(report, post);
                  const sourceTitle = getSourceTitle(report, post);
                  const sourceHandle = getSourceHandle(report, post);
                  const postUrl = getPostUrl(report, post);
                  const sourceUrl = getSourceUrl(report, post);
                  const open = Boolean(openIds[report.id]);
                  const selected = Boolean(selectedIds[report.id]);

                  return (
                    <div
                      key={report.id}
                      className={`overflow-hidden rounded-[22px] border bg-rose-500/8 transition ${
                        selected ? "border-sky-300/70 ring-2 ring-sky-400/20" : "border-rose-400/25"
                      }`}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setOpenIds((prev) => ({ ...prev, [report.id]: !prev[report.id] }))}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setOpenIds((prev) => ({ ...prev, [report.id]: !prev[report.id] }));
                          }
                        }}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleSelect(report.id);
                            }}
                            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm font-black transition ${
                              selected
                                ? "border-sky-300 bg-sky-500 text-white"
                                : "border-white/10 bg-white/8 text-white/65 hover:bg-white/15"
                            }`}
                            title="Выбрать жалобу"
                          >
                            {selected ? "✓" : ""}
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openUrl(sourceUrl);
                            }}
                            className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-sm font-black text-white"
                            title={sourceHandle ? `@${sourceHandle}` : sourceTitle}
                          >
                            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" loading="lazy" /> : sourceTitle.slice(0, 1)}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-black text-white">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" />
                              <span className="truncate">{formatReason(report.reason)}</span>
                              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs text-rose-100">
                                ×{report.count || 1}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/55">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openUrl(sourceUrl);
                                }}
                                className="max-w-[190px] truncate font-bold text-white/75 hover:text-white"
                              >
                                {sourceTitle}
                              </button>
                              {sourceHandle ? <span>@{sourceHandle}</span> : null}
                              {report.sourceCountryCode ? <span>{report.sourceCountryCode.toUpperCase()}</span> : null}
                            </div>
                          </div>
                        </div>

                        <ChevronDown className={`h-4 w-4 shrink-0 text-white/55 transition ${open ? "rotate-180" : ""}`} />
                      </div>

                      {open ? (
                        <div className="border-t border-white/10 p-3">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openUrl(postUrl)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") openUrl(postUrl);
                            }}
                            className="flex cursor-pointer gap-3 rounded-2xl bg-black/18 p-3 transition hover:bg-black/25"
                          >
                            {image ? (
                              <img src={image} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" loading="lazy" />
                            ) : (
                              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-white/8 text-4xl">🐤</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {avatar ? (
                                  <img src={avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" loading="lazy" />
                                ) : null}
                                <div className="min-w-0">
                                  <div className="truncate text-xs font-black text-white/75">{sourceTitle}</div>
                                  {sourceHandle ? <div className="truncate text-[11px] text-white/45">@{sourceHandle}</div> : null}
                                </div>
                              </div>
                              <div className="mt-2 line-clamp-4 text-sm font-bold leading-5 text-white/90">
                                {getPostPreview(post)}
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/38">
                                <span>{formatDate(report.updatedAt)}</span>
                                {postUrl ? (
                                  <span className="inline-flex items-center gap-1 text-sky-200">
                                    открыть пост <ExternalLink className="h-3 w-3" />
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => void loadReports()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Обновить жалобы
            </button>
          </>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}
