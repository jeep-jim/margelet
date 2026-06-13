import { AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminSectionCard } from "./AdminSectionCard";

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

export function AdminReportsSection({ telegramUserId }: { telegramUserId: string | null }) {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadReports = async () => {
    if (!telegramUserId) return;

    try {
      setLoading(true);
      setMessage(null);

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
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось загрузить жалобы");
      }

      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить жалобы");
    } finally {
      setLoading(false);
    }
  };

  const resolveReport = async (reportId: string) => {
    if (!telegramUserId) return;

    try {
      setMessage(null);
      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "reports",
          action: "resolve",
          reportId,
          telegramUserId,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "Не удалось закрыть жалобу");
      }

      setReports(Array.isArray(data?.reports) ? data.reports : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось закрыть жалобу");
    }
  };

  useEffect(() => {
    void loadReports();
  }, [telegramUserId]);

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
          const postHref = report.sourceHandle && report.postId
            ? `/${report.sourceHandle}/${report.postId}`
            : null;

          return (
            <div
              key={report.id}
              className="rounded-[22px] border border-rose-400/20 bg-rose-500/8 p-3"
            >
              <div className="flex items-start justify-between gap-3">
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
                  {report.message ? (
                    <div className="mt-2 text-xs leading-5 text-white/70">{report.message}</div>
                  ) : null}
                  <div className="mt-2 text-[11px] text-white/38">{formatDate(report.updatedAt)}</div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {postHref ? (
                    <a
                      href={postHref}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-white/70 transition hover:bg-white/12 hover:text-white"
                      title="Открыть пост"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void resolveReport(report.id)}
                    className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500/15 text-emerald-200 transition hover:bg-emerald-500/25"
                    title="Закрыть жалобу"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          type="button"
          onClick={() => void loadReports()}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          Обновить жалобы
        </button>
      </div>
    </AdminSectionCard>
  );
}
