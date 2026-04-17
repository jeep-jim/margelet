import { useEffect, useMemo, useState } from "react";
import type { IngestedPost, Locale } from "../types/app";
import { COUNTRIES, type CountryCode } from "./admin/admin.countries";
import { AdminBulkImportSection } from "./admin/AdminBulkImportSection";
import { AdminCountriesSection } from "./admin/AdminCountriesSection";
import { AdminPostsSection } from "./admin/AdminPostsSection";
import { AdminSourcesSection } from "./admin/AdminSourcesSection";
import type { TrustedSource } from "./admin/admin.types";

type AdminScreenProps = {
  locale: Locale;
  telegramUserId: string | null;
  onClose: () => void;
  onDeletePost: (id: number) => Promise<void>;
};

type LoadState = "idle" | "loading" | "ready" | "error";
const ADMIN_TELEGRAM_ID = "1372669404";

export function AdminScreen({
  locale: _locale,
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);

  const ADMIN_COUNTRY_STORAGE_KEY = "margelet_admin_selected_country";

  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_COUNTRY_STORAGE_KEY) as CountryCode | null;
      if (saved && COUNTRIES.some((item) => item.code === saved && item.enabled)) {
        return saved;
      }
    } catch {
      //
    }

    const firstEnabled = COUNTRIES.find((item) => item.enabled);
    return firstEnabled?.code || "ru";
  });

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_COUNTRY_STORAGE_KEY, selectedCountryCode);
    } catch {
      //
    }
  }, [selectedCountryCode]);

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  const loadPosts = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      setState("loading");

      const res = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "posts",
          countryCode: selectedCountryCode,
        }),
      });

      const data = await res.json().catch(() => null);
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  const loadSources = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      const res = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "sources",
        }),
      });

      const data = await res.json().catch(() => null);
      setSources(Array.isArray(data?.sources) ? data.sources : []);
    } catch {
      //
    }
  };

  const refreshEverything = async () => {
    await Promise.all([loadPosts(), loadSources()]);
  };

  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;
    void refreshEverything();
  }, [telegramUserId, hasAdminAccess, selectedCountryCode]);

  const stats = useMemo(() => {
    const countrySources = sources.filter((source) => source.countryCode === selectedCountryCode);

    return {
      total: posts.length,
      pending: posts.filter((post) => (post.status || "published") === "pending").length,
      blocked: posts.filter((post) => (post.status || "published") === "blocked").length,
      published: posts.filter((post) => (post.status || "published") === "published").length,
      sources: countrySources.length,
      activeSources: countrySources.filter((source) => source.status === "active").length,
    };
  }, [posts, sources, selectedCountryCode]);

  const sourceCountsByCountry = useMemo(() => {
    const counts: Partial<Record<CountryCode, number>> = {};

    for (const source of sources) {
      counts[source.countryCode] = (counts[source.countryCode] || 0) + 1;
    }

    return counts;
  }, [sources]);

  const handleDeletePost = async (id: number) => {
    await onDeletePost(id);
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  const handleRebuildNow = async () => {
    if (!telegramUserId) return;

    try {
      setRebuildLoading(true);
      setRebuildMessage(null);

      const res = await fetch("/api/admin-rebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          countryCode: selectedCountryCode,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "rebuild failed");
      }

      await refreshEverything();
      setRebuildMessage(
        `Обновлено: +${data?.importedPosts || 0} постов · ${data?.sourcesChecked || 0} sources`
      );
    } catch (error: any) {
      setRebuildMessage(error?.message || "Не удалось обновить сейчас");
    } finally {
      setRebuildLoading(false);
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
    <div className="min-h-screen bg-[#0a0a0f] px-3 py-4 text-white sm:px-4 sm:py-5">
      <div className="mx-auto max-w-7xl">
        {state === "loading" && <div className="mb-4 text-sm text-white/50">загрузка...</div>}
        {state === "error" && <div className="mb-4 text-sm text-red-400">ошибка загрузки</div>}

        <div className="mb-4 flex flex-col gap-3 rounded-[30px] border border-white/10 bg-white/[0.045] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
          <div>
            <div className="text-[28px] font-semibold tracking-tight">Admin</div>
            <div className="mt-1 text-sm text-white/45">
              country-first control center · каналы · посты · импорт
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleRebuildNow();
              }}
              disabled={rebuildLoading}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
            >
              {rebuildLoading ? "обновляю..." : "обновить сейчас"}
            </button>
            <button
              onClick={onClose}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
            >
              назад
            </button>
          </div>
        </div>

        {rebuildMessage ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            {rebuildMessage}
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-6">
          {[
            { label: "Посты", value: stats.total },
            { label: "Опубликовано", value: stats.published },
            { label: "На проверке", value: stats.pending },
            { label: "Заблокировано", value: stats.blocked },
            { label: "Channels", value: stats.sources },
            { label: "Active", value: stats.activeSources },
          ].map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">{item.label}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <AdminCountriesSection
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={setSelectedCountryCode}
            counts={sourceCountsByCountry}
            postsCount={posts.length}
          />

          <AdminSourcesSection
            telegramUserId={telegramUserId}
            countryCode={selectedCountryCode}
            sources={sources}
            onSourcesReload={loadSources}
          />

          <AdminBulkImportSection
            telegramUserId={telegramUserId}
            countryCode={selectedCountryCode}
            onImported={loadPosts}
          />

          <AdminPostsSection
            posts={posts}
            state={state}
            onDeletePost={handleDeletePost}
            telegramUserId={telegramUserId}
            countryCode={selectedCountryCode}
          />
        </div>
      </div>
    </div>
  );
}
