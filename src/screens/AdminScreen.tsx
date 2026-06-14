import { useEffect, useMemo, useState } from "react";
import type { IngestedPost, Locale } from "../types/app";
import { type CountryCode, SEO_LOCALE_META } from "../../api/lib/contracts";

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
type FeedIndexCountryStats = Record<string, { posts?: number }>;

type SourceSummary = {
  total: number;
  active: number;
  countsByCountry: Partial<Record<CountryCode, number>>;
  activeCountsByCountry: Partial<Record<CountryCode, number>>;
};

const ADMIN_TELEGRAM_ID = "1372669404";
const ADMIN_COUNTRY_STORAGE_KEY = "margelet_admin_selected_country";
const REBUILD_MINUTE = 17;
const REBUILD_HOURS = Array.from({ length: 24 }, (_, index) => index);

function getNextRebuildDate(now: Date) {
  for (const hour of REBUILD_HOURS) {
    const candidate = new Date(now);
    candidate.setHours(hour, REBUILD_MINUTE, 0, 0);

    if (candidate.getTime() > now.getTime()) {
      return candidate;
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(REBUILD_HOURS[0], REBUILD_MINUTE, 0, 0);
  return tomorrow;
}

function formatShortTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(date: Date) {
  return date.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(target: Date, now: Date) {
  const diff = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function parseIsoMs(value?: string | null) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function getLatestSourceActivityByCountry(
  sources: TrustedSource[],
  countryCode: CountryCode
) {
  const countrySources = sources.filter((source) => source.countryCode === countryCode);

  let latestMs = 0;

  for (const source of countrySources) {
    const checkedMs = parseIsoMs(source.lastCheckedAt) ?? 0;
    const importedMs = parseIsoMs(source.lastImportedAt) ?? 0;
    latestMs = Math.max(latestMs, checkedMs, importedMs);
  }

  return latestMs > 0 ? new Date(latestMs) : null;
}

export function AdminScreen({
  locale: _locale,
  telegramUserId,
  onDeletePost,
}: AdminScreenProps) {
  const [posts, setPosts] = useState<IngestedPost[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [sources, setSources] = useState<TrustedSource[]>([]);
  const [sourceSummary, setSourceSummary] = useState<SourceSummary>({
    total: 0,
    active: 0,
    countsByCountry: {},
    activeCountsByCountry: {},
  });
  const [rebuildLoading, setRebuildLoading] = useState(false);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => new Date());
  const [countryStatsOpen, setCountryStatsOpen] = useState(false);
  const [feedIndexCountries, setFeedIndexCountries] = useState<FeedIndexCountryStats>({});

  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(() => {
    try {
      const saved = localStorage.getItem(ADMIN_COUNTRY_STORAGE_KEY);
      if (saved) return saved as CountryCode;
    } catch {
      //
    }

    return "ru";
  });  

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_COUNTRY_STORAGE_KEY, selectedCountryCode);
    } catch {
      //
    }
  }, [selectedCountryCode]);

  useEffect(() => {
    const timer = setInterval(() => {
      setClockNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isLocalhost = window.location.hostname === "localhost";

  const hasAdminAccess =
    isLocalhost || telegramUserId === ADMIN_TELEGRAM_ID;  

  const loadPosts = async () => {
    if (!telegramUserId || !hasAdminAccess) return;

    const readPosts = (payload: any): IngestedPost[] => {
      if (Array.isArray(payload?.posts)) return payload.posts;
      if (Array.isArray(payload?.items)) return payload.items;
      return [];
    };

    try {
      setState("loading");

      const indexRes = await fetch(`/feeds/index.json?v=${Date.now()}`, {
        cache: "no-store",
      });

      const indexData = await indexRes.json().catch(() => null);
      const countryInfo = indexData?.countries?.[selectedCountryCode];

      if (countryInfo?.path) {
        const directRes = await fetch(`${countryInfo.path}?v=${Date.now()}`, {
          cache: "no-store",
        });

        const directData = await directRes.json().catch(() => null);
        let nextPosts = readPosts(directData);

        if (countryInfo.mode === "chunked" && Number(countryInfo.chunks || 0) > 0) {
          const chunkPosts = await Promise.all(
            Array.from({ length: Number(countryInfo.chunks) }, async (_, index) => {
              const chunkPath = `/feeds/${selectedCountryCode}/${index + 1}.json`;
              const chunkRes = await fetch(`${chunkPath}?v=${Date.now()}`, {
                cache: "no-store",
              });

              if (!chunkRes.ok) return [];

              const chunkData = await chunkRes.json().catch(() => null);
              return readPosts(chunkData);
            })
          );

          nextPosts = chunkPosts.flat();
        }

        setPosts(
          nextPosts.sort(
            (a, b) =>
              Date.parse(String(b.createdAt || "")) -
              Date.parse(String(a.createdAt || ""))
          )
        );

        setState("ready");
        return;
      }

      setPosts([]);
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

      if (data?.sourceSummary && typeof data.sourceSummary === "object") {
        setSourceSummary({
          total: Number(data.sourceSummary.total || 0),
          active: Number(data.sourceSummary.active || 0),
          countsByCountry: data.sourceSummary.countsByCountry || {},
          activeCountsByCountry: data.sourceSummary.activeCountsByCountry || {},
        });
      }
    } catch {
      //
    }
  };

  const loadFeedIndex = async () => {
    try {
      const res = await fetch(`/feeds/index.json?v=${Date.now()}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);
      setFeedIndexCountries(
        data?.countries && typeof data.countries === "object" ? data.countries : {}
      );
    } catch {
      setFeedIndexCountries({});
    }
  };

  const refreshEverything = async () => {
    await Promise.all([loadPosts(), loadSources(), loadFeedIndex()]);
  };

  useEffect(() => {
    if (!telegramUserId || !hasAdminAccess) return;
    void refreshEverything();
  }, [telegramUserId, hasAdminAccess, selectedCountryCode]);

  const sourceCountsByCountry = useMemo(
    () => sourceSummary.countsByCountry || {},
    [sourceSummary.countsByCountry]
  );

  // Создаём фиксированный список стран из contracts.ts
  const countryFeedStats = useMemo(() => {
    // Берём все страны из SEO_LOCALE_META (это наш единый источник)
    const allCountryCodes = Object.keys(SEO_LOCALE_META) as CountryCode[];
    
    return allCountryCodes.map((code) => {
      const countrySources = sources.filter((source) => source.countryCode === code);
      const activeSources = countrySources.filter((source) => source.status === "active").length;
      const postsCount = Number(feedIndexCountries[code]?.posts || 0);
      
      return {
        code,
        label: code.toUpperCase(),
        sourcesCount: countrySources.length,
        activeSources,
        postsCount,
      };
    }).sort((a, b) => b.postsCount - a.postsCount || b.sourcesCount - a.sourcesCount);
  }, [sourceSummary, feedIndexCountries]); 

  const nextRebuildDate = useMemo(() => getNextRebuildDate(clockNow), [clockNow]);
  const nextRebuildLabel = useMemo(() => formatShortTime(nextRebuildDate), [nextRebuildDate]);
  const nextRebuildDateTimeLabel = useMemo(() => formatDateTime(nextRebuildDate), [nextRebuildDate]);
  const nextRebuildCountdown = useMemo(
    () => formatCountdown(nextRebuildDate, clockNow),
    [nextRebuildDate, clockNow]
  );

  const latestCountryActivity = useMemo(
    () => getLatestSourceActivityByCountry(sources, selectedCountryCode),
    [sources, selectedCountryCode]
  );

  const latestCountryActivityLabel = useMemo(
    () => (latestCountryActivity ? formatDateTime(latestCountryActivity) : "—"),
    [latestCountryActivity]
  );

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
        throw new Error(data?.error || "Не удалось обновить сейчас");
      }

      await refreshEverything();

      setRebuildMessage(
        `Обновлено: +${data?.importedPosts || 0} постов · ${data?.sourcesChecked || 0} каналов · refresh ${data?.refreshedPosts || 0}`
      );
    } catch (error: unknown) {
      setRebuildMessage(
        error instanceof Error ? error.message : "Не удалось обновить сейчас"
      );
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
    <div className="min-h-screen bg-[#0a0a0f] px-3 py-4 text-white sm:px-4 sm:py-5 pb-28">
      <div className="mx-auto max-w-7xl">
        {state === "loading" ? (
          <div className="mb-4 text-sm text-white/50">загрузка...</div>
        ) : null}

        {state === "error" ? (
          <div className="mb-4 text-sm text-red-400">ошибка загрузки</div>
        ) : null}

        <div className="mb-4 rounded-[30px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[30px] font-semibold leading-none tracking-tight">
                {posts.length} пост
              </div>

              <div className="mt-2 text-sm text-white/80">
                обновится в {nextRebuildLabel}
              </div>

              <div className="mt-1 text-sm text-white/55">
                через {nextRebuildCountdown} · {nextRebuildDateTimeLabel}
              </div>

              <div className="mt-1 text-xs text-white/40">
                последнее авто-обновление страны: {latestCountryActivityLabel}
              </div>
            </div>

            <details className="absolute right-6 top-6 z-20">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full bg-red-500/30 text-lg shadow-lg shadow-red-500/20 transition hover:scale-105 [&::-webkit-details-marker]:hidden">
                💥
              </summary>

              <div className="absolute right-0 mt-3 w-[260px] rounded-3xl border border-red-500/25 bg-[#171016] p-4 shadow-2xl">
                <div className="mb-3 text-sm font-semibold text-red-100">
                  Экстренное управление
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void handleRebuildNow();
                    }}
                    disabled={rebuildLoading}
                    className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                  >
                    {rebuildLoading ? "обновляю..." : "обновить сейчас"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.removeItem("margelet_tg_user");
                      window.location.reload();
                    }}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
                  >
                    выйти
                  </button>
                </div>
              </div>
            </details>                    
          </div>
        </div>

        {rebuildMessage ? (
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
            {rebuildMessage}
          </div>
        ) : null}

        {countryFeedStats.length > 0 ? (
          <div className="mb-4 rounded-[24px] border border-white/10 bg-white/[0.035] px-4 py-3">
            <button
              type="button"
              onClick={() => setCountryStatsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Посты по странам</div>
                <div className="mt-1 text-xs text-white/45">
                </div>
              </div>
              <div className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                {countryFeedStats.length} стран
              </div>
            </button>

            <div
              className={`mt-3 gap-2 ${
                countryStatsOpen
                  ? "flex flex-wrap"
                  : "flex max-h-[36px] flex-nowrap overflow-hidden"
              }`}
            >              
              {(countryStatsOpen ? countryFeedStats : countryFeedStats.slice(0, 10)).map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setSelectedCountryCode(item.code)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${
                    item.code === selectedCountryCode
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                  }`}
                  title={`${item.label}: ${item.postsCount} постов · ${item.sourcesCount} каналов`}
                >
                  {item.code.toUpperCase()} · {item.postsCount}
                </button>
              ))}

              {countryFeedStats.length > 10 ? (
                <button
                  type="button"
                  onClick={() => setCountryStatsOpen((prev) => !prev)}
                  className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/55 transition hover:bg-white/10 hover:text-white"
                >
                  {countryStatsOpen ? "свернуть" : `ещё ${countryFeedStats.length - 10}`}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 sm:space-y-4">
          <AdminCountriesSection
            selectedCountryCode={selectedCountryCode}
            onSelectCountry={setSelectedCountryCode}
            counts={sourceCountsByCountry}
          />
          <div id="admin-channels">
            <AdminSourcesSection
              telegramUserId={telegramUserId}
              countryCode={selectedCountryCode}
              sources={sources}
              onSourcesReload={loadSources}
            />
          </div>

          <div id="admin-bulk">
            <AdminBulkImportSection
              telegramUserId={telegramUserId}
              countryCode={selectedCountryCode}
              onImported={refreshEverything}
            />
          </div>

          <div id="admin-posts">
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

      {/* 🔥 ЛИПКАЯ НАВИГАЦИЯ */}
      <div className="fixed bottom-4 left-3 right-3 z-50 flex items-center justify-between rounded-full border border-white/10 bg-black/75 px-3 py-2 shadow-2xl backdrop-blur sm:left-1/2 sm:right-auto sm:w-[360px] sm:-translate-x-1/2">
        {[
          ["🌍", "admin-channels"],
          ["➕", "admin-bulk"],
          ["🎈", "admin-posts"],
        ].map(([label, id]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              document.getElementById(id)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-base transition hover:bg-white/20 active:scale-95"
          >
            {label}
          </button>
        ))}
      </div>      
    </div>
  );
}