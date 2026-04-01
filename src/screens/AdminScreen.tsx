import { useEffect, useMemo, useState } from "react";
import type { IngestedPost, Locale } from "../types/app";

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

const ADMIN_TELEGRAM_ID = "1372669404";

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

export function AdminScreen({
  locale,
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

  const [analytics, setAnalytics] = useState<any>(null);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [savingGrant, setSavingGrant] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [targetTelegramUserId, setTargetTelegramUserId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [grantRole, setGrantRole] = useState<AccessRole>("channel_owner");
  const [grantPlan, setGrantPlan] = useState<AccessPlan>("free");
  const [durationDays, setDurationDays] = useState("30");
  const [grantNote, setGrantNote] = useState("");

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      if (!telegramUserId || !hasAdminAccess) return;

      try {
        setState("loading");

        const res = await fetch("/api/admin-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ telegramUserId }),
        });

        const data = await res.json();

        if (!cancelled) {
          setPosts(Array.isArray(data?.posts) ? data.posts : []);
          setState("ready");
        }
      } catch {
        if (!cancelled) {
          setState("error");
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
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
      .then(setAnalytics)
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

  const handleDelete = async (id: number) => {
    if (!window.confirm(locale === "en" ? "Delete post?" : "Удалить пост?")) return;

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
      window.alert(locale === "en" ? "Enter Telegram ID" : "Укажи Telegram ID");
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
    if (!window.confirm(locale === "en" ? "Delete access?" : "Удалить доступ?")) return;

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

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        {locale === "en" ? "Access denied" : "Нет доступа"}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4">
      <div className="max-w-6xl mx-auto">
        {state === "loading" && (
          <div className="mb-4 text-sm text-white/50">
            {locale === "en" ? "loading..." : "загрузка..."}
          </div>
        )}

        {state === "error" && (
          <div className="mb-4 text-sm text-red-400">
            {locale === "en" ? "load error" : "ошибка загрузки"}
          </div>
        )}

        <div className="mb-4 flex justify-between">
          <div>
            <div className="text-xl font-semibold">Admin</div>
            <div className="text-sm text-white/40">
              {locale === "en"
                ? "management + analytics + access"
                : "управление + аналитика + доступы"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-full"
          >
            {locale === "en" ? "back" : "назад"}
          </button>
        </div>

        {analytics && (
          <div className="mb-6 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="mb-2 text-lg font-semibold">Analytics</div>

            <div className="mb-2 text-sm">👁 Views: {analytics.views}</div>

            <div className="mb-2 text-sm">
              🌍 Countries:
              {Object.entries(analytics.countries || {}).map(([k, v]) => (
                <div key={k}>
                  {k}: {String(v)}
                </div>
              ))}
            </div>

            <div className="text-sm">
              📱 Devices:
              {Object.entries(analytics.devices || {}).map(([k, v]) => (
                <div key={k}>
                  {k}: {String(v)}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-4 text-lg font-semibold">
            {locale === "en" ? "Access management" : "Управление доступом"}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={targetTelegramUserId}
              onChange={(event) => setTargetTelegramUserId(event.target.value)}
              placeholder="Telegram ID"
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            />

            <input
              value={targetUsername}
              onChange={(event) => setTargetUsername(event.target.value)}
              placeholder="@username"
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            />

            <select
              value={grantRole}
              onChange={(event) => setGrantRole(event.target.value as AccessRole)}
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            >
              <option value="user">user</option>
              <option value="channel_owner">channel_owner</option>
              <option value="admin">admin</option>
            </select>

            <select
              value={grantPlan}
              onChange={(event) => setGrantPlan(event.target.value as AccessPlan)}
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            >
              <option value="free">free</option>
              <option value="pro_1m">pro_1m</option>
              <option value="pro_3m">pro_3m</option>
              <option value="pro_12m">pro_12m</option>
            </select>

            <input
              value={durationDays}
              onChange={(event) => setDurationDays(event.target.value)}
              placeholder={locale === "en" ? "duration days" : "срок в днях"}
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            />

            <input
              value={grantNote}
              onChange={(event) => setGrantNote(event.target.value)}
              placeholder={locale === "en" ? "note / barter / comment" : "заметка / бартер / комментарий"}
              className="rounded-xl bg-white/10 px-4 py-3 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              void handleSaveGrant();
            }}
            disabled={savingGrant}
            className="mt-4 rounded-full bg-white px-4 py-2 text-black disabled:opacity-60"
          >
            {savingGrant
              ? locale === "en"
                ? "saving..."
                : "сохраняю..."
              : locale === "en"
                ? "save access"
                : "сохранить доступ"}
          </button>

          <div className="mt-5">
            <div className="mb-2 text-sm text-white/50">
              {locale === "en" ? "current grants" : "текущие доступы"}
            </div>

            {grantsLoading ? (
              <div className="text-sm text-white/50">
                {locale === "en" ? "loading..." : "загрузка..."}
              </div>
            ) : grants.length === 0 ? (
              <div className="text-sm text-white/40">
                {locale === "en" ? "no grants yet" : "доступов пока нет"}
              </div>
            ) : (
              <div className="space-y-3">
                {grants.map((grant) => (
                  <div
                    key={grant.telegramUserId}
                    className="rounded-xl border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold">
                          {grant.username ? `@${grant.username}` : grant.telegramUserId}
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
                        {locale === "en" ? "remove" : "удалить"}
                      </button>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-2">
                      <div>role: {grant.role}</div>
                      <div>plan: {grant.plan}</div>
                      <div>
                        {locale === "en" ? "active:" : "активен:"}{" "}
                        {grant.isActive ? "yes" : "no"}
                      </div>
                      <div>
                        {locale === "en" ? "expires:" : "истекает:"}{" "}
                        {formatDate(grant.expiresAt)}
                      </div>
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

        <div className="mb-4 flex gap-2 flex-wrap">
          {["all", "published", "pending", "blocked"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1 rounded-full text-sm ${
                statusFilter === s ? "bg-white text-black" : "bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === "en" ? "search..." : "поиск..."}
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10"
        />

        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const status = post.status || "published";
            const isDeleting = deletingId === post.id;

            return (
              <div
                key={post.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{post.source.title}</div>
                    <div className="text-xs text-white/50">@{post.source.handle}</div>
                  </div>

                  <div className="text-xs px-2 py-1 rounded bg-white/10">
                    {status}
                  </div>
                </div>

                <div className="mt-2 text-xs text-white/60">
                  {post.addedBy.username || post.addedBy.telegramId || "—"}
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  {status === "pending" && (
                    <>
                      <button
                        onClick={() => {
                          void handleUpdateStatus(post.id, "published");
                        }}
                        className="px-3 py-1 bg-green-500 rounded"
                      >
                        approve
                      </button>

                      <button
                        onClick={() => {
                          void handleUpdateStatus(post.id, "blocked");
                        }}
                        className="px-3 py-1 bg-yellow-500 rounded"
                      >
                        reject
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      void handleDelete(post.id);
                    }}
                    disabled={isDeleting}
                    className="px-3 py-1 bg-red-500 rounded disabled:opacity-60"
                  >
                    {isDeleting
                      ? locale === "en"
                        ? "deleting..."
                        : "удаляю..."
                      : "delete"}
                  </button>

                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-white/10 rounded"
                  >
                    open
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}