import { useEffect, useMemo, useState } from "react";
import type { ContentTag, IngestedPost, Locale } from "../types/app";

type AdminScreenProps = {
  locale: Locale;
  telegramUserId: string | null;
  onClose: () => void;
  onDeletePost: (id: number) => Promise<void>;
};

type LoadState = "idle" | "loading" | "ready" | "error";
type AccessRole = "user" | "channel_owner" | "admin";
type AccessPlan = "free" | "pro_1m" | "pro_3m" | "pro_12m";

type AccessGrant = {
  telegramUserId: string;
  username: string | null;
  role: AccessRole;
  plan: AccessPlan;
  note: string | null;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

type AnalyticsResponse = {
  views: number;
  countries: Record<string, string>;
  devices: Record<string, string>;
  today: number;
  last7: number;
  last30: number;
  days: Record<string, string>;
};

type BulkResultItem = {
  url: string;
  status: "ok" | "error";
  error?: string;
};

const ADMIN_TELEGRAM_ID = "1372669404";

const BULK_TAG_OPTIONS: Array<{ value: ContentTag; label: string }> = [
  { value: "other", label: "Другое" },
  { value: "news", label: "Новости" },
  { value: "memes", label: "Мемы" },
  { value: "technology", label: "Технологии" },
  { value: "business", label: "Бизнес" },
  { value: "education", label: "Образование" },
  { value: "music", label: "Музыка" },
  { value: "sports", label: "Спорт" },
  { value: "people", label: "Люди" },
  { value: "animals", label: "Животные" },
  { value: "creativity", label: "Творчество" },
  { value: "finance", label: "Финансы" },
  { value: "travel", label: "Путешествия" },
  { value: "food", label: "Еда" },
];

function buildSearchText(post: IngestedPost) {
  return [
    post.source.title,
    post.source.handle,
    post.postUrl,
    post.addedBy.username || "",
    post.addedBy.telegramId || "",
    post.tag || "",
    post.text || "",
    post.billing.plan || "",
    post.status || "",
  ]
    .join(" ")
    .toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return "—";

  return new Date(ms).toLocaleString();
}

function getStatusLabel(status?: string) {
  switch (status) {
    case "published":
      return "Опубликован";
    case "pending":
      return "На проверке";
    case "blocked":
      return "Заблокирован";
    default:
      return "Опубликован";
  }
}

function getPlanLabel(plan?: string) {
  switch (plan) {
    case "free":
      return "Бесплатно";
    case "pro_1m":
      return "PRO 1 мес";
    case "pro_3m":
      return "PRO 3 мес";
    case "pro_12m":
      return "PRO 12 мес";
    default:
      return plan || "—";
  }
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "user":
      return "Пользователь";
    case "channel_owner":
      return "Владелец канала";
    case "admin":
      return "Админ";
    default:
      return role || "—";
  }
}

function getPreviewUrl(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    post.source.avatar ||
    null
  );
}

function getContentTypeLabel(type?: string) {
  switch (type) {
    case "text":
      return "Текст";
    case "image":
      return "Изображение";
    case "gallery":
      return "Галерея";
    case "gif":
      return "GIF";
    case "video":
      return "Видео";
    case "audio":
      return "Аудио";
    case "file":
      return "Файл";
    case "mixed":
      return "Смешанный";
    case "external_media":
      return "Внешнее медиа";
    default:
      return type || "—";
  }
}

function normalizeBulkError(message: string) {
  const value = String(message || "").trim();

  if (!value) return "ошибка";

  if (value === "Invalid Telegram post URL") {
    return "невалидная ссылка";
  }

  if (value === "Failed to ingest Telegram post") {
    return "не удалось забрать пост";
  }

  if (value === "Daily limit reached") {
    return "дневной лимит";
  }

  return value;
}

export function AdminScreen({
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<LoadState>("idle");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "pending" | "blocked"
  >("all");

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [savingGrant, setSavingGrant] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedPostIds, setExpandedPostIds] = useState<number[]>([]);

  const [targetTelegramUserId, setTargetTelegramUserId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [grantRole, setGrantRole] = useState<AccessRole>("channel_owner");
  const [grantPlan, setGrantPlan] = useState<AccessPlan>("free");
  const [durationDays, setDurationDays] = useState("30");
  const [grantNote, setGrantNote] = useState("");

  const [bulkText, setBulkText] = useState("");
  const [bulkTag, setBulkTag] = useState<ContentTag>("other");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResultItem[]>([]);

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  const loadPosts = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      setState("loading");

      const res = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId }),
      });

      const data = await res.json();
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;
    void loadPosts();
  }, [telegramUserId, hasAdminAccess]);

  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;

    fetch("/api/admin-analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ telegramUserId }),
    })
      .then((r) => r.json())
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }, [telegramUserId, hasAdminAccess]);

  const loadGrants = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      setGrantsLoading(true);

      const res = await fetch("/api/admin-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId }),
      });

      const data = await res.json().catch(() => null);
      setGrants(Array.isArray(data?.grants) ? data.grants : []);
    } catch {
      //
    } finally {
      setGrantsLoading(false);
    }
  };

  useEffect(() => {
    void loadGrants();
  }, [telegramUserId, hasAdminAccess]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesQuery = q ? buildSearchText(post).includes(q) : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (post.status || "published") === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [posts, query, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: posts.length,
      pending: posts.filter((post) => (post.status || "published") === "pending")
        .length,
      blocked: posts.filter((post) => (post.status || "published") === "blocked")
        .length,
      published: posts.filter(
        (post) => (post.status || "published") === "published"
      ).length,
    };
  }, [posts]);

  const sortedCountries = useMemo(() => {
    return Object.entries(analytics?.countries || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const sortedDevices = useMemo(() => {
    return Object.entries(analytics?.devices || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const toggleExpanded = (id: number) => {
    setExpandedPostIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Удалить пост?")) return;

    try {
      setDeletingId(id);
      await onDeletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (
    id: number,
    status: "published" | "blocked"
  ) => {
    await fetch("/api/admin-posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, telegramUserId }),
    });

    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  };

  const handleSaveGrant = async () => {
    if (!telegramUserId) return;
    if (!targetTelegramUserId.trim()) {
      window.alert("Укажи Telegram ID");
      return;
    }

    try {
      setSavingGrant(true);

      const res = await fetch("/api/admin-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          targetTelegramUserId: targetTelegramUserId.trim(),
          username: targetUsername.trim() || null,
          role: grantRole,
          plan: grantPlan,
          durationDays: durationDays.trim() || null,
          note: grantNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "save grant failed");
      }

      setTargetTelegramUserId("");
      setTargetUsername("");
      setGrantRole("channel_owner");
      setGrantPlan("free");
      setDurationDays("30");
      setGrantNote("");

      await loadGrants();
    } catch (error: any) {
      window.alert(error?.message || "Не удалось сохранить доступ");
    } finally {
      setSavingGrant(false);
    }
  };

  const handleDeleteGrant = async (targetId: string) => {
    if (!telegramUserId) return;
    if (!window.confirm("Удалить доступ?")) return;

    try {
      const res = await fetch("/api/admin-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          targetTelegramUserId: targetId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "delete grant failed");
      }

      setGrants((prev) =>
        prev.filter((item) => item.telegramUserId !== targetId)
      );
    } catch (error: any) {
      window.alert(error?.message || "Не удалось удалить доступ");
    }
  };

  const handleBulkSubmit = async () => {
    if (!telegramUserId) return;

    const urls = bulkText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      window.alert("Вставь хотя бы одну ссылку");
      return;
    }

    try {
      setBulkLoading(true);
      setBulkResult([]);

      const results: BulkResultItem[] = [];

      for (const url of urls) {
        try {
          const res = await fetch("/api/submit-post", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              tag: bulkTag,
              role: "admin",
              plan: "pro_12m",
              addedByTelegramId: telegramUserId,
              addedByUsername: "admin",
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            results.push({
              url,
              status: "error",
              error: normalizeBulkError(data?.error || "ошибка"),
            });
          } else {
            results.push({
              url,
              status: "ok",
            });
          }
        } catch (error: any) {
          results.push({
            url,
            status: "error",
            error: normalizeBulkError(error?.message || "ошибка сети"),
          });
        }
      }

      setBulkResult(results);
      await loadPosts();
    } finally {
      setBulkLoading(false);
    }
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        Нет доступа
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-3 py-4 text-white sm:px-4">
      <div className="mx-auto max-w-6xl">
        {state === "loading" && (
          <div className="mb-4 text-sm text-white/50">загрузка...</div>
        )}

        {state === "error" && (
          <div className="mb-4 text-sm text-red-400">ошибка загрузки</div>
        )}

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[26px] font-semibold tracking-tight">Admin</div>
            <div className="text-sm text-white/45">
              управление · аналитика · доступы
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
          >
            назад
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Всего
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.total}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Опубликовано
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.published}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              На проверке
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.pending}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40">
              Заблокировано
            </div>
            <div className="mt-2 text-2xl font-semibold">{stats.blocked}</div>
          </div>
        </div>

        {analytics ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-lg font-semibold">Аналитика</div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">Сегодня</div>
                <div className="mt-1 text-2xl font-semibold">
                  {analytics.today || 0}
                </div>
              </div>

              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">7 дней</div>
                <div className="mt-1 text-2xl font-semibold">
                  {analytics.last7 || 0}
                </div>
              </div>

              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">30 дней</div>
                <div className="mt-1 text-2xl font-semibold">
                  {analytics.last30 || 0}
                </div>
              </div>

              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">Всего</div>
                <div className="mt-1 text-2xl font-semibold">
                  {analytics.views || 0}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">Страны</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sortedCountries.length > 0 ? (
                    sortedCountries.map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-full bg-white/10 px-3 py-1 text-sm"
                      >
                        {k}: {String(v)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-white/35">пока пусто</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-black/20 p-3">
                <div className="text-sm text-white/50">Устройства</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sortedDevices.length > 0 ? (
                    sortedDevices.map(([k, v]) => (
                      <div
                        key={k}
                        className="rounded-full bg-white/10 px-3 py-1 text-sm"
                      >
                        {k}: {String(v)}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-white/35">пока пусто</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3 text-xs leading-6 text-white/35">
              Это реальные, но приблизительные данные MVP. Твои просмотры не
              считаются, если ты заходишь под своим Telegram ID администратора.
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 text-lg font-semibold">Управление доступом</div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={targetTelegramUserId}
              onChange={(event) => setTargetTelegramUserId(event.target.value)}
              placeholder="Telegram ID"
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />

            <input
              value={targetUsername}
              onChange={(event) => setTargetUsername(event.target.value)}
              placeholder="@username"
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />

            <select
              value={grantRole}
              onChange={(event) => setGrantRole(event.target.value as AccessRole)}
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
            >
              <option value="user">Пользователь</option>
              <option value="channel_owner">Владелец канала</option>
              <option value="admin">Админ</option>
            </select>

            <select
              value={grantPlan}
              onChange={(event) => setGrantPlan(event.target.value as AccessPlan)}
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
            >
              <option value="free">Бесплатно</option>
              <option value="pro_1m">PRO 1 мес</option>
              <option value="pro_3m">PRO 3 мес</option>
              <option value="pro_12m">PRO 12 мес</option>
            </select>

            <input
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
              placeholder="Срок в днях"
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />

            <input
              value={grantNote}
              onChange={(event) => setGrantNote(event.target.value)}
              placeholder="Заметка / бартер / комментарий"
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSaveGrant();
            }}
            disabled={savingGrant}
            className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
          >
            {savingGrant ? "сохраняю..." : "сохранить доступ"}
          </button>

          <div className="mt-5">
            <div className="mb-2 text-sm text-white/45">Текущие доступы</div>

            {grantsLoading ? (
              <div className="text-sm text-white/45">загрузка...</div>
            ) : grants.length === 0 ? (
              <div className="text-sm text-white/35">доступов пока нет</div>
            ) : (
              <div className="space-y-3">
                {grants.map((grant) => (
                  <div
                    key={grant.telegramUserId}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {grant.username
                            ? `@${grant.username}`
                            : grant.telegramUserId}
                        </div>
                        <div className="mt-1 text-xs text-white/50">
                          ID: {grant.telegramUserId}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteGrant(grant.telegramUserId);
                        }}
                        className="rounded-full bg-red-500 px-3 py-1 text-sm"
                      >
                        удалить
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-2">
                      <div>Роль: {getRoleLabel(grant.role)}</div>
                      <div>Тариф: {getPlanLabel(grant.plan)}</div>
                      <div>Активен: {grant.isActive ? "да" : "нет"}</div>
                      <div>Истекает: {formatDate(grant.expiresAt)}</div>
                    </div>

                    {grant.note ? (
                      <div className="mt-3 text-sm text-white/70">{grant.note}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 text-lg font-semibold">Массовый импорт постов</div>

          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={`https://t.me/channel_one/1
https://t.me/channel_two/2
https://t.me/channel_three/3`}
            className="h-36 w-full rounded-xl border border-white/10 bg-[#1a1b24] p-4 text-sm text-white outline-none placeholder:text-white/35"
          />

          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <select
              value={bulkTag}
              onChange={(event) => setBulkTag(event.target.value as ContentTag)}
              className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
            >
              {BULK_TAG_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                void handleBulkSubmit();
              }}
              disabled={bulkLoading}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
            >
              {bulkLoading ? "загружаю..." : "загрузить пачку"}
            </button>
          </div>

          {bulkResult.length > 0 ? (
            <div className="mt-4 space-y-2">
              {bulkResult.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    item.status === "ok"
                      ? "bg-green-500/15 text-green-300"
                      : "bg-red-500/15 text-red-300"
                  }`}
                >
                  <div>
                    {item.status === "ok" ? "✅" : "❌"} {item.url}
                  </div>
                  {item.error ? (
                    <div className="mt-1 text-xs opacity-80">{item.error}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { value: "all", label: "Все" },
            { value: "published", label: "Опубликованные" },
            { value: "pending", label: "На проверке" },
            { value: "blocked", label: "Заблокированные" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value as any)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                statusFilter === item.value
                  ? "bg-white text-black"
                  : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по каналу, ссылке, пользователю, тексту..."
          className="mb-4 w-full rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const status = post.status || "published";
            const isDeleting = deletingId === post.id;
            const isExpanded = expandedPostIds.includes(post.id);
            const preview = getPreviewUrl(post);

            return (
              <div
                key={post.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/30">
                    {preview ? (
                      <img
                        src={preview}
                        alt={post.source.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] text-white/25">
                        нет
                        <br />
                        превью
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-[18px] font-semibold">
                          {post.source.title}
                        </div>
                        <div className="truncate text-sm text-white/50">
                          @{post.source.handle}
                        </div>
                      </div>

                      <div className="shrink-0 rounded-xl bg-white/10 px-3 py-2 text-xs">
                        {getStatusLabel(status)}
                      </div>
                    </div>

                    <div className="mt-2 grid gap-1 text-xs text-white/60 sm:grid-cols-2">
                      <div>
                        Добавил: {post.addedBy.username || post.addedBy.telegramId || "—"}
                      </div>
                      <div>Тип: {getContentTypeLabel(post.contentType)}</div>
                      <div>Тег: {post.tag || "—"}</div>
                      <div>Тариф: {getPlanLabel(post.billing.plan)}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          void handleUpdateStatus(post.id, "published");
                        }}
                        className="rounded-xl bg-green-600 px-3 py-2 text-sm"
                      >
                        Одобрить
                      </button>

                      <button
                        onClick={() => {
                          void handleUpdateStatus(post.id, "blocked");
                        }}
                        className="rounded-xl bg-yellow-600 px-3 py-2 text-sm"
                      >
                        Заблокировать
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      void handleDelete(post.id);
                    }}
                    disabled={isDeleting}
                    className="rounded-xl bg-red-500 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {isDeleting ? "Удаляю..." : "Удалить"}
                  </button>

                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                  >
                    Открыть
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleExpanded(post.id)}
                    className="rounded-xl bg-white/10 px-3 py-2 text-sm"
                  >
                    {isExpanded ? "Скрыть детали" : "Детали"}
                  </button>
                </div>

                {isExpanded ? (
                  <div className="mt-3 rounded-xl bg-black/20 p-3">
                    <div className="grid gap-2 text-sm text-white/75 md:grid-cols-2">
                      <div>ID поста: {post.id}</div>
                      <div>Media: {post.media.length}</div>
                      <div>Создан: {formatDate(post.createdAt)}</div>
                      <div>Истекает: {formatDate(post.expiresAt)}</div>
                      <div>Источник: {post.postUrl}</div>
                      <div>Fallback: {post.fallbackReason || "—"}</div>
                    </div>

                    {post.text ? (
                      <div className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-white/5 p-3 text-sm leading-6 text-white/85">
                        {post.text}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}