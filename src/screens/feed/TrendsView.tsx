import { ArrowLeft, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { IngestedPost, Locale } from "../../types/app";
import {
  buildCategories,
  buildLivePostTrends,
  buildLiveSearchTrend,
  CountryDistributionBlock,
  findTrendByTopic,
  formatNumber,
  getCountryLabel,
  getTopic,
  getTrendCategory,
  getTrendsCopy,
  normalizeTopic,
  readFollowedTopics,
  refreshAutotranslit,
  TrendDetail,
  trendMatchesCategory,
  TrendRow,
  type TrendItem,
  writeFollowedTopics,
} from "./trends/trends.shared";

export function TrendsView({
  countryCode = "ru",
  locale = "ru",
  posts = [],
  initialTopic,
  onOpenSource,
  isPro = false,
}: {
  countryCode?: string;
  locale?: Locale;
  posts?: IngestedPost[];
  initialTopic?: string;
  onOpenSource?: (handle: string) => void;
  isPro?: boolean;
}) {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [openedTopic, setOpenedTopic] = useState<string | null>(null);
  const [activeTrend, setActiveTrend] = useState<TrendItem | null>(null);
  const [followedTopics, setFollowedTopics] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readFollowedTopics(),
  );
  const copy = getTrendsCopy(locale);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.trends) && data.trends.length) {
          const next = data.trends.map((item: TrendItem) => ({
            ...item,
            category: item.category || getTrendCategory(getTopic(item)),
            categories: Array.isArray(item.categories) ? item.categories : [],
          }));
          setTrends(next);
        } else {
          setTrends([]);
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
        setTrends([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [countryCode]);

  useEffect(() => {
    writeFollowedTopics(followedTopics);
  }, [followedTopics]);

  const categories = useMemo(
    () => buildCategories(locale, copy),
    [locale, copy],
  );
  const visibleCategories = categoriesExpanded
    ? categories
    : categories.slice(0, 5);

  const fallbackLivePostTrends = useMemo(
    () => (trends.length ? [] : buildLivePostTrends(posts)),
    [trends.length, posts],
  );

  const categoryTrends = useMemo(() => {
    const rawQuery = query.trim();
    const normalizedQuery = rawQuery.toLowerCase();

    const livePostTrends = fallbackLivePostTrends;

    let list =
      selectedCategory === "followed"
        ? trends.filter((item) =>
            followedTopics.includes(normalizeTopic(getTopic(item))),
          )
        : selectedCategory === "all"
          ? trends.length
            ? trends
            : livePostTrends
          : trends.filter((item) => trendMatchesCategory(item, selectedCategory));

    if (!list.length && selectedCategory !== "followed") {
      list = livePostTrends.filter((item) => trendMatchesCategory(item, selectedCategory));
    }

    const seen = new Set<string>();
    list = list.filter((item) => {
      const key = normalizeTopic(getTopic(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (normalizedQuery) {
      list = list.filter((item) =>
        [
          getTopic(item),
          item.category,
          ...(item.topSources || []).map((source) => source.title),
          ...(item.signals || []),
          ...(item.examples || []).map((example) => example.text),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      );

      const liveTrend = buildLiveSearchTrend(posts, rawQuery, countryCode);
      const liveKey = liveTrend ? normalizeTopic(getTopic(liveTrend)) : "";

      if (liveTrend && !list.some((item) => normalizeTopic(getTopic(item)) === liveKey)) {
        list = [liveTrend, ...list];
      }
    }

    return list.slice(0, 20);
  }, [trends, selectedCategory, query, followedTopics, posts, countryCode, fallbackLivePostTrends]);

  const searchModeTrends = useMemo(() => {
    const rawQuery = query.trim();
    const normalizedQuery = rawQuery.toLowerCase();
    const livePostTrends = fallbackLivePostTrends;
    let list = trends.length ? trends : livePostTrends;

    const seen = new Set<string>();
    list = list.filter((item) => {
      const key = normalizeTopic(getTopic(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (normalizedQuery) {
      list = list.filter((item) =>
        [
          getTopic(item),
          item.category,
          ...(item.topSources || []).map((source) => source.title),
          ...(item.signals || []),
          ...(item.examples || []).map((example) => example.text),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      );

      const liveTrend = buildLiveSearchTrend(posts, rawQuery, countryCode);
      const liveKey = liveTrend ? normalizeTopic(getTopic(liveTrend)) : "";

      if (liveTrend && !list.some((item) => normalizeTopic(getTopic(item)) === liveKey)) {
        list = [liveTrend, ...list];
      }
    }

    return list.slice(0, normalizedQuery ? 20 : 10);
  }, [trends, query, posts, countryCode, fallbackLivePostTrends]);

  useEffect(() => {
    if (!searchMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [searchMode]);

  useEffect(() => {
    refreshAutotranslit(locale);
  }, [openedTopic, activeTrend, searchMode, selectedCategory, locale]);

  useEffect(() => {
    if (!initialTopic || !trends.length) return;

    const nextTrend = findTrendByTopic(trends, initialTopic);
    if (!nextTrend) return;

    setActiveTrend(nextTrend);
    setOpenedTopic(getTopic(nextTrend));
    setQuery("");
    setSelectedCategory("all");
  }, [initialTopic, trends]);

  const toggleFollow = (topic: string) => {
    const key = normalizeTopic(topic);
    setFollowedTopics((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-secondary">
        {copy.loading}
      </div>
    );
  }

  if (activeTrend) {
    const topic = getTopic(activeTrend);
    const followed = followedTopics.includes(normalizeTopic(topic));

    return (
      <TrendDetail
        trend={activeTrend}
        followed={followed}
        onBack={() => setActiveTrend(null)}
        onToggleFollow={() => toggleFollow(topic)}
        onOpenSource={onOpenSource}
        copy={copy}
        countryCode={countryCode}
        locale={locale}
        isPro={isPro}
      />
    );
  }

  if (searchMode) {
    return (
      <div className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-app px-4 pb-[calc(120px+env(safe-area-inset-bottom))] pt-[max(14px,env(safe-area-inset-top))]">
        <div className="mx-auto w-full max-w-[570px]">
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchMode(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-soft bg-surface text-primary transition hover:bg-surface-soft"
              aria-label={copy.back}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <form
              className="relative min-w-0 flex-1"
              onSubmit={(event) => event.preventDefault()}
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-2xl border border-soft bg-surface py-3 pl-11 pr-12 text-base text-primary outline-none placeholder:text-secondary focus:border-[color:var(--border-strong)]"
              />
              {query.trim() ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
                  aria-label={copy.clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </form>
          </div>

          {query.trim() && searchModeTrends[0]?.countries?.length ? (
            <CountryDistributionBlock
              trend={searchModeTrends[0]}
              countryCode={countryCode}
              copy={copy}
              locale={locale}
              className="mb-2"
              isPro={isPro}
            />
          ) : (
            <div className="mb-3 rounded-[24px] border border-soft bg-surface-soft/70 px-4 py-3 text-sm leading-relaxed text-secondary">
              {query.trim() ? (
                <div className="flex items-center justify-between gap-3">
                  <span>
                    {formatNumber(searchModeTrends[0]?.mentions || 0)} {copy.mentions}
                  </span>
                  <span className="font-black text-emerald-500">
                    {getCountryLabel(countryCode, locale)}
                  </span>
                </div>
              ) : (
                copy.discussingNow
              )}
            </div>
          )}

          <section className="space-y-3">
            {searchModeTrends.map((trend) => {
              const topic = getTopic(trend);
              const followed = followedTopics.includes(normalizeTopic(topic));

              return (
                <TrendRow
                  key={`search-${trend.category || "all"}-${topic}`}
                  trend={trend}
                  opened={openedTopic === topic}
                  followed={followed}
                  onToggle={() =>
                    setOpenedTopic((current) => (current === topic ? null : topic))
                  }
                  onOpenDetail={() => {
                    setSearchMode(false);
                    setActiveTrend(trend);
                  }}
                  onToggleFollow={() => toggleFollow(topic)}
                  copy={copy}
                />
              );
            })}
          </section>

          {!searchModeTrends.length ? (
            <div className="rounded-[26px] border border-soft bg-surface px-5 py-8 text-center text-sm text-secondary">
              {copy.noSignals}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[570px] px-4 pb-36 pt-3">
      <form
        className="relative mb-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />

        <input
          value={query}
          onFocus={() => setSearchMode(true)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full rounded-2xl border border-soft bg-surface py-3 pl-11 pr-12 text-sm text-primary outline-none placeholder:text-secondary focus:border-[color:var(--border-strong)]"
        />

        {query.trim() ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
            aria-label={copy.clearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      <div className="mb-4">
        <div className="grid grid-cols-6 gap-2">
          {visibleCategories.map((category) => {
            const active = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.value);
                  setOpenedTopic(null);
                }}
                className="min-w-0 text-center"
              >
                <div
                  className={[
                    "mx-auto grid h-11 w-11 place-items-center rounded-full border text-lg font-black shadow-sm transition",
                    active
                      ? "border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-app)]"
                      : "border-soft bg-surface text-primary hover:bg-surface-soft",
                  ].join(" ")}
                >
                  {category.emoji}
                </div>
                <div
                  className={[
                    "mt-1 truncate text-[10px] font-semibold leading-tight",
                    active ? "text-primary" : "text-secondary",
                  ].join(" ")}
                >
                  {category.label}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCategoriesExpanded((prev) => !prev)}
            className="min-w-0 text-center"
          >
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-soft bg-surface text-primary shadow-sm transition hover:bg-surface-soft">
              <ChevronDown
                className={[
                  "h-5 w-5 transition-transform",
                  categoriesExpanded ? "rotate-180" : "",
                ].join(" ")}
              />
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold leading-tight text-secondary">
              {categoriesExpanded ? copy.hide : copy.more}
            </div>
          </button>
        </div>
      </div>

      <div className="mb-3">
        {(() => {
          const activeCategory =
            categories.find((item) => item.value === selectedCategory) ||
            categories[0];
          const totalMentions = categoryTrends.reduce(
            (sum, item) => sum + item.mentions,
            0,
          );
          const title =
            selectedCategory === "all"
              ? copy.discussingNow
              : selectedCategory === "followed"
                ? copy.interests
                : `${activeCategory.label} +${formatNumber(totalMentions)} ${copy.today}`;

          return (
            <h2 className="text-xl font-black text-primary">
              {activeCategory.emoji} {title}
            </h2>
          );
        })()}
      </div>

      <section className="space-y-3">
        {categoryTrends.map((trend) => {
          const topic = getTopic(trend);
          const followed = followedTopics.includes(normalizeTopic(topic));

          return (
            <TrendRow
              key={`${trend.category || "all"}-${topic}`}
              trend={trend}
              opened={openedTopic === topic}
              followed={followed}
              onToggle={() =>
                setOpenedTopic((current) => (current === topic ? null : topic))
              }
              onOpenDetail={() => setActiveTrend(trend)}
              onToggleFollow={() => toggleFollow(topic)}
              copy={copy}
            />
          );
        })}
      </section> 

      {!categoryTrends.length ? (
        <div className="rounded-[26px] border border-soft bg-surface px-5 py-8 text-center text-sm text-secondary">
          {copy.noSignals}
        </div>
      ) : null}

      <button className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-32px)] max-w-[538px] -translate-x-1/2 rounded-2xl border border-soft bg-surface/95 px-5 py-4 text-base font-black text-primary shadow-soft backdrop-blur transition hover:bg-surface-soft">
        {copy.fullAccess}
      </button>
    </div>
  );
}
