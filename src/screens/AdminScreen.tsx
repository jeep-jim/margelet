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
          countryCode: selectedCountryCode,
        }),
      });

      const data = await res.json().catch(() => null);
      setSources(Array.isArray(data?.sources) ? data.sources : []);
    } catch {
      //
    }
  };  

  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;

    void loadPosts();
    void loadSources();
  }, [telegramUserId, hasAdminAccess, selectedCountryCode]);



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
              управление · источники · посты
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

        <div className="space-y-4">
          <AdminCountriesSection
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={setSelectedCountryCode}
            counts={sourceCountsByCountry}
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
          />

        </div>
      </div>
    </div>
  );
}