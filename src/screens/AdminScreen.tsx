import { useEffect, useMemo, useState } from "react";
import type { IngestedPost, Locale } from "../types/app";
import { COUNTRIES, type CountryCode } from "./admin/admin.countries";
import { AdminAccessSection } from "./admin/AdminAccessSection";
import { AdminAnalyticsSection } from "./admin/AdminAnalyticsSection";
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

const ADMIN_TELEGRAM_ID = "1372669404";

export function AdminScreen({
  locale: _locale,
  telegramUserId,
  onClose,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [state, setState] = useState<LoadState>("idle");

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [grants, setGrants] = useState<AccessGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [sources, setSources] = useState<TrustedSource[]>([]);

  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(() => {
    const firstEnabled = COUNTRIES.find((item) => item.enabled);
    return firstEnabled?.code || "ru";
  });

  const hasAdminAccess = telegramUserId === ADMIN_TELEGRAM_ID;

  const loadPosts = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      setState("loading");

      const res = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId, entity: "posts" }),
      });

      const data = await res.json().catch(() => null);
      setPosts(Array.isArray(data?.posts) ? data.posts : []);
      setState("ready");
    } catch {
      setState("error");
    }
  };

  const loadAnalytics = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      const res = await fetch("/api/admin-analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ telegramUserId }),
      });

      const data = await res.json().catch(() => null);
      setAnalytics(data || null);
    } catch {
      //
    }
  };

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

  const loadSources = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    try {
      const res = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramUserId, entity: "sources" }),
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
    void loadAnalytics();
    void loadGrants();
    void loadSources();
  }, [telegramUserId, hasAdminAccess]);

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
              управление · аналитика · источники · доступы
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
          <AdminAnalyticsSection analytics={analytics} />

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
            onImported={loadPosts}
          />

          <AdminPostsSection
            posts={posts}
            state={state}
            onDeletePost={handleDeletePost}
            telegramUserId={telegramUserId}
          />

          <AdminAccessSection
            telegramUserId={telegramUserId}
            grants={grants}
            grantsLoading={grantsLoading}
            onGrantsReload={loadGrants}
          />
        </div>
      </div>
    </div>
  );
}