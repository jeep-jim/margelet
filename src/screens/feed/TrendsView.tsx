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
  currentTelegramUserId = null,
}: {
  countryCode?: string;
  locale?: Locale;
  posts?: IngestedPost[];
  initialTopic?: string;
  onOpenSource?: (handle: string) => void;
  isPro?: boolean;
  currentTelegramUserId?: string | null;
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
  const [proModalOpen, setProModalOpen] = useState(false);
  const [hasPaidPro, setHasPaidPro] = useState(false);
  const [followedTopics, setFollowedTopics] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readFollowedTopics(),
  );
  const copy = getTrendsCopy(locale);
  const effectiveIsPro = isPro || hasPaidPro;


  useEffect(() => {
    const open = () => setProModalOpen(true);
    window.addEventListener("margelet:open-pro-plans", open);
    return () => window.removeEventListener("margelet:open-pro-plans", open);
  }, []);

  useEffect(() => {
    if (isPro) {
      setHasPaidPro(true);
      return;
    }

    if (!currentTelegramUserId) {
      setHasPaidPro(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/telegram-webhook?ownerTelegramId=${encodeURIComponent(currentTelegramUserId)}&includeCanceled=1`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const now = Date.now();
        const active = items.some((item: any) =>
          item?.plan === "pro" &&
          item?.status === "active" &&
          (!item?.endsAt || Date.parse(String(item.endsAt)) > now),
        );
        setHasPaidPro(active);
      })
      .catch(() => {
        if (!cancelled) setHasPaidPro(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentTelegramUserId, isPro]);

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

  useEffect(() => {
    if (!categories.some((category) => category.value === selectedCategory)) {
      setSelectedCategory("all");
    }
  }, [categories, selectedCategory]);

  const activeCategory = useMemo(
    () =>
      categories.find((category) => category.value === selectedCategory) ||
      categories.find((category) => category.value === "all") ||
      categories[0],
    [categories, selectedCategory],
  );

  const visibleCategories = useMemo(() => {
    if (categoriesExpanded) return categories;

    const base = categories.slice(0, 5);
    if (!activeCategory) return base;
    if (base.some((category) => category.value === activeCategory.value)) return base;

    return [...base.slice(0, 4), activeCategory];
  }, [categories, categoriesExpanded, activeCategory]);

  const selectCategory = (value: string) => {
    setSelectedCategory(value);
    setOpenedTopic(null);
    setActiveTrend(null);
    setQuery("");
    setSearchMode(false);
  };

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
  }, [openedTopic, activeTrend, searchMode, selectedCategory, categoryTrends, searchModeTrends, locale]);

  useEffect(() => {
    const syncTranslate = () => refreshAutotranslit(locale, 40);
    window.addEventListener("margelet-autotranslit-change", syncTranslate);
    return () => window.removeEventListener("margelet-autotranslit-change", syncTranslate);
  }, [locale]);

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
        isPro={effectiveIsPro}
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
              isPro={effectiveIsPro}
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
                data-trend-category={category.value}
                aria-pressed={active}
                onPointerDown={(event) => {
                  event.preventDefault();
                  selectCategory(category.value);
                }}
                onClick={() => selectCategory(category.value)}
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

      <div className="mb-3" key={`trend-category-title-${selectedCategory}`}>
        {(() => {
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
            <h2 className="text-xl font-black text-primary" translate="yes">
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

      {!effectiveIsPro ? (
        <button
          type="button"
          onClick={() => setProModalOpen(true)}
          className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-32px)] max-w-[538px] -translate-x-1/2 rounded-2xl border border-soft bg-surface/95 px-5 py-4 text-base font-black text-primary shadow-soft backdrop-blur transition hover:bg-surface-soft"
        >
          {copy.fullAccess}
        </button>
      ) : null}

      <ProPlansModal
        open={proModalOpen}
        onClose={() => setProModalOpen(false)}
        telegramUserId={currentTelegramUserId}
        locale={locale}
      />
    </div>
  );
}

const PRO_PLANS = [
  { months: 1, stars: 2500 },
  { months: 3, stars: 6500 },
  { months: 12, stars: 22000 },
];

type ProModalCopy = {
  title: string;
  description: string;
  month1: string;
  month3: string;
  month12: string;
  note1: string;
  note3: string;
  note12: string;
  loginAlert: string;
  botNote: string;
};

const PRO_MODAL_COPY: Record<Locale, ProModalCopy> = {
  ru: { title: "🔓 margeleT PRO", description: "Все источники, все страны, полный поиск по сигналам и отчёты за 24 часа.", month1: "1 месяц", month3: "3 месяца", month12: "12 месяцев", note1: "Полный доступ к сигналам", note3: "Выгоднее для проверки гипотез", note12: "Максимальная экономия", loginAlert: "Войдите через Telegram, чтобы купить PRO доступ.", botNote: "Оплата откроется в Telegram-боте margeleT. После оплаты доступ включится автоматически." },
  ua: { title: "🔓 margeleT PRO", description: "Усі джерела, усі країни, повний пошук за сигналами та звіти за 24 години.", month1: "1 місяць", month3: "3 місяці", month12: "12 місяців", note1: "Повний доступ до сигналів", note3: "Вигідніше для перевірки гіпотез", note12: "Максимальна економія", loginAlert: "Увійдіть через Telegram, щоб купити PRO-доступ.", botNote: "Оплата відкриється в Telegram-боті margeleT. Після оплати доступ увімкнеться автоматично." },
  us: { title: "🔓 margeleT PRO", description: "All sources, all countries, full signal search and 24-hour reports.", month1: "1 month", month3: "3 months", month12: "12 months", note1: "Full access to signals", note3: "Better for testing hypotheses", note12: "Maximum savings", loginAlert: "Sign in with Telegram to buy PRO access.", botNote: "Payment opens in the margeleT Telegram bot. Access turns on automatically after payment." },
  in: { title: "🔓 margeleT PRO", description: "सभी स्रोत, सभी देश, पूरा सिग्नल खोज और 24 घंटे की रिपोर्ट।", month1: "1 महीना", month3: "3 महीने", month12: "12 महीने", note1: "सिग्नल का पूरा access", note3: "हाइपोथीसिस टेस्ट के लिए बेहतर", note12: "सबसे ज़्यादा बचत", loginAlert: "PRO access खरीदने के लिए Telegram से sign in करें।", botNote: "Payment margeleT Telegram bot में खुलेगी। Payment के बाद access अपने आप चालू होगा।" },
  ir: { title: "🔓 margeleT PRO", description: "همه منابع، همه کشورها، جست‌وجوی کامل سیگنال‌ها و گزارش‌های ۲۴ ساعته.", month1: "۱ ماه", month3: "۳ ماه", month12: "۱۲ ماه", note1: "دسترسی کامل به سیگنال‌ها", note3: "بهتر برای آزمون فرضیه‌ها", note12: "بیشترین صرفه‌جویی", loginAlert: "برای خرید دسترسی PRO با Telegram وارد شوید.", botNote: "پرداخت در ربات Telegram مرجلت باز می‌شود. پس از پرداخت، دسترسی خودکار فعال می‌شود." },
  tr: { title: "🔓 margeleT PRO", description: "Tüm kaynaklar, tüm ülkeler, tam sinyal araması ve 24 saatlik raporlar.", month1: "1 ay", month3: "3 ay", month12: "12 ay", note1: "Sinyallere tam erişim", note3: "Hipotezleri test etmek için daha uygun", note12: "Maksimum tasarruf", loginAlert: "PRO erişimi almak için Telegram ile giriş yapın.", botNote: "Ödeme margeleT Telegram botunda açılır. Ödeme sonrası erişim otomatik açılır." },
  br: { title: "🔓 margeleT PRO", description: "Todas as fontes, todos os países, busca completa de sinais e relatórios de 24 horas.", month1: "1 mês", month3: "3 meses", month12: "12 meses", note1: "Acesso completo aos sinais", note3: "Melhor para testar hipóteses", note12: "Máxima economia", loginAlert: "Entre pelo Telegram para comprar o acesso PRO.", botNote: "O pagamento abrirá no bot do Telegram da margeleT. Após pagar, o acesso será ativado automaticamente." },
  kz: { title: "🔓 margeleT PRO", description: "Барлық дереккөздер, барлық елдер, сигналдар бойынша толық іздеу және 24 сағаттық есептер.", month1: "1 ай", month3: "3 ай", month12: "12 ай", note1: "Сигналдарға толық қолжетімділік", note3: "Гипотезаларды тексеруге тиімді", note12: "Ең үлкен үнем", loginAlert: "PRO қолжетімділігін алу үшін Telegram арқылы кіріңіз.", botNote: "Төлем margeleT Telegram ботында ашылады. Төлемнен кейін қолжетімділік автоматты қосылады." },
  uz: { title: "🔓 margeleT PRO", description: "Barcha manbalar, barcha mamlakatlar, signallar bo‘yicha to‘liq qidiruv va 24 soatlik hisobotlar.", month1: "1 oy", month3: "3 oy", month12: "12 oy", note1: "Signallarga to‘liq kirish", note3: "Gipotezalarni tekshirish uchun qulay", note12: "Eng katta tejam", loginAlert: "PRO kirish sotib olish uchun Telegram orqali kiring.", botNote: "To‘lov margeleT Telegram botida ochiladi. To‘lovdan keyin kirish avtomatik yoqiladi." },
  ae: { title: "🔓 margeleT PRO", description: "كل المصادر، كل الدول، بحث كامل في الإشارات وتقارير 24 ساعة.", month1: "شهر واحد", month3: "3 أشهر", month12: "12 شهرًا", note1: "وصول كامل إلى الإشارات", note3: "أفضل لاختبار الفرضيات", note12: "أكبر توفير", loginAlert: "سجّل الدخول عبر Telegram لشراء وصول PRO.", botNote: "سيُفتح الدفع في بوت margeleT على Telegram. بعد الدفع سيتم تفعيل الوصول تلقائيًا." },
  eg: { title: "🔓 margeleT PRO", description: "كل المصادر، كل الدول، بحث كامل في الإشارات وتقارير 24 ساعة.", month1: "شهر واحد", month3: "3 شهور", month12: "12 شهر", note1: "وصول كامل للإشارات", note3: "أفضل لاختبار الفرضيات", note12: "أكبر توفير", loginAlert: "سجّل الدخول عبر Telegram لشراء وصول PRO.", botNote: "الدفع هيفتح في بوت margeleT على Telegram. بعد الدفع الوصول هيتفعل تلقائيًا." },
  pk: { title: "🔓 margeleT PRO", description: "تمام ذرائع، تمام ممالک، سگنلز کی مکمل تلاش اور 24 گھنٹے کی رپورٹس۔", month1: "1 ماہ", month3: "3 ماہ", month12: "12 ماہ", note1: "سگنلز تک مکمل رسائی", note3: "فرضیات جانچنے کے لیے بہتر", note12: "زیادہ سے زیادہ بچت", loginAlert: "PRO access خریدنے کے لیے Telegram سے سائن ان کریں۔", botNote: "ادائیگی margeleT Telegram bot میں کھلے گی۔ ادائیگی کے بعد رسائی خودکار فعال ہو جائے گی۔" },
  id: { title: "🔓 margeleT PRO", description: "Semua sumber, semua negara, pencarian sinyal penuh, dan laporan 24 jam.", month1: "1 bulan", month3: "3 bulan", month12: "12 bulan", note1: "Akses penuh ke sinyal", note3: "Lebih baik untuk menguji hipotesis", note12: "Hemat maksimal", loginAlert: "Masuk lewat Telegram untuk membeli akses PRO.", botNote: "Pembayaran akan dibuka di bot Telegram margeleT. Setelah pembayaran, akses aktif otomatis." },
  mx: { title: "🔓 margeleT PRO", description: "Todas las fuentes, todos los países, búsqueda completa de señales e informes de 24 horas.", month1: "1 mes", month3: "3 meses", month12: "12 meses", note1: "Acceso completo a señales", note3: "Mejor para probar hipótesis", note12: "Máximo ahorro", loginAlert: "Inicia sesión con Telegram para comprar acceso PRO.", botNote: "El pago se abrirá en el bot de Telegram de margeleT. Después del pago, el acceso se activará automáticamente." },
  sa: { title: "🔓 margeleT PRO", description: "كل المصادر، كل الدول، بحث كامل في الإشارات وتقارير 24 ساعة.", month1: "شهر واحد", month3: "3 أشهر", month12: "12 شهرًا", note1: "وصول كامل إلى الإشارات", note3: "أفضل لاختبار الفرضيات", note12: "أكبر توفير", loginAlert: "سجّل الدخول عبر Telegram لشراء وصول PRO.", botNote: "سيُفتح الدفع في بوت margeleT على Telegram. بعد الدفع سيتم تفعيل الوصول تلقائيًا." },
  es: { title: "🔓 margeleT PRO", description: "Todas las fuentes, todos los países, búsqueda completa de señales e informes de 24 horas.", month1: "1 mes", month3: "3 meses", month12: "12 meses", note1: "Acceso completo a señales", note3: "Mejor para probar hipótesis", note12: "Máximo ahorro", loginAlert: "Inicia sesión con Telegram para comprar acceso PRO.", botNote: "El pago se abrirá en el bot de Telegram de margeleT. Después del pago, el acceso se activará automáticamente." },
  it: { title: "🔓 margeleT PRO", description: "Tutte le fonti, tutti i Paesi, ricerca completa dei segnali e report di 24 ore.", month1: "1 mese", month3: "3 mesi", month12: "12 mesi", note1: "Accesso completo ai segnali", note3: "Meglio per testare ipotesi", note12: "Massimo risparmio", loginAlert: "Accedi con Telegram per acquistare PRO.", botNote: "Il pagamento si aprirà nel bot Telegram di margeleT. Dopo il pagamento l’accesso si attiverà automaticamente." },
  fr: { title: "🔓 margeleT PRO", description: "Toutes les sources, tous les pays, recherche complète de signaux et rapports sur 24 heures.", month1: "1 mois", month3: "3 mois", month12: "12 mois", note1: "Accès complet aux signaux", note3: "Mieux pour tester des hypothèses", note12: "Économie maximale", loginAlert: "Connectez-vous via Telegram pour acheter l’accès PRO.", botNote: "Le paiement s’ouvrira dans le bot Telegram margeleT. Après paiement, l’accès sera activé automatiquement." },
  de: { title: "🔓 margeleT PRO", description: "Alle Quellen, alle Länder, vollständige Signalsuche und 24-Stunden-Berichte.", month1: "1 Monat", month3: "3 Monate", month12: "12 Monate", note1: "Voller Zugriff auf Signale", note3: "Besser zum Testen von Hypothesen", note12: "Maximale Ersparnis", loginAlert: "Melde dich mit Telegram an, um PRO zu kaufen.", botNote: "Die Zahlung öffnet sich im margeleT Telegram-Bot. Nach der Zahlung wird der Zugriff automatisch aktiviert." },
  ar: { title: "🔓 margeleT PRO", description: "كل المصادر، كل الدول، بحث كامل في الإشارات وتقارير 24 ساعة.", month1: "شهر واحد", month3: "3 أشهر", month12: "12 شهرًا", note1: "وصول كامل إلى الإشارات", note3: "أفضل لاختبار الفرضيات", note12: "أكبر توفير", loginAlert: "سجّل الدخول عبر Telegram لشراء وصول PRO.", botNote: "سيُفتح الدفع في بوت margeleT على Telegram. بعد الدفع سيتم تفعيل الوصول تلقائيًا." },
  co: { title: "🔓 margeleT PRO", description: "Todas las fuentes, todos los países, búsqueda completa de señales e informes de 24 horas.", month1: "1 mes", month3: "3 meses", month12: "12 meses", note1: "Acceso completo a señales", note3: "Mejor para probar hipótesis", note12: "Máximo ahorro", loginAlert: "Inicia sesión con Telegram para comprar acceso PRO.", botNote: "El pago se abrirá en el bot de Telegram de margeleT. Después del pago, el acceso se activará automáticamente." },
  za: { title: "🔓 margeleT PRO", description: "All sources, all countries, full signal search and 24-hour reports.", month1: "1 month", month3: "3 months", month12: "12 months", note1: "Full access to signals", note3: "Better for testing hypotheses", note12: "Maximum savings", loginAlert: "Sign in with Telegram to buy PRO access.", botNote: "Payment opens in the margeleT Telegram bot. Access turns on automatically after payment." },
  ng: { title: "🔓 margeleT PRO", description: "All sources, all countries, full signal search and 24-hour reports.", month1: "1 month", month3: "3 months", month12: "12 months", note1: "Full access to signals", note3: "Better for testing hypotheses", note12: "Maximum savings", loginAlert: "Sign in with Telegram to buy PRO access.", botNote: "Payment opens in the margeleT Telegram bot. Access turns on automatically after payment." },
  cn: { title: "🔓 margeleT PRO", description: "所有来源、所有国家、完整信号搜索和 24 小时报告。", month1: "1 个月", month3: "3 个月", month12: "12 个月", note1: "完整访问信号", note3: "更适合验证假设", note12: "最大节省", loginAlert: "请通过 Telegram 登录以购买 PRO 访问。", botNote: "付款将在 margeleT Telegram 机器人中打开。付款后访问权限会自动开启。" },
  my: { title: "🔓 margeleT PRO", description: "Semua sumber, semua negara, carian isyarat penuh dan laporan 24 jam.", month1: "1 bulan", month3: "3 bulan", month12: "12 bulan", note1: "Akses penuh kepada isyarat", note3: "Lebih baik untuk menguji hipotesis", note12: "Penjimatan maksimum", loginAlert: "Log masuk melalui Telegram untuk membeli akses PRO.", botNote: "Pembayaran akan dibuka dalam bot Telegram margeleT. Selepas pembayaran, akses diaktifkan secara automatik." },
};

function buildProBotUrl(telegramUserId: string, months: number) {
  return `https://t.me/margeleT_space_bot?start=${encodeURIComponent(`pro_${telegramUserId}_${months}`)}`;
}

function ProPlansModal({
  open,
  onClose,
  telegramUserId,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  telegramUserId?: string | null;
  locale: Locale;
}) {
  const modalCopy = PRO_MODAL_COPY[locale] || PRO_MODAL_COPY.us;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 px-4 pb-4 pt-16 backdrop-blur-sm sm:items-center sm:pb-16">
      <div className="w-full max-w-[520px] rounded-[30px] border border-soft bg-surface p-4 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-black text-primary">{modalCopy.title}</div>
            <div className="mt-1 text-sm leading-relaxed text-secondary">
              {modalCopy.description}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-soft bg-surface-soft text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          {PRO_PLANS.map((plan) => {
            const href = telegramUserId ? buildProBotUrl(telegramUserId, plan.months) : "#";

            return (
              <a
                key={plan.months}
                href={href}
                onClick={(event) => {
                  if (!telegramUserId) {
                    event.preventDefault();
                    alert(modalCopy.loginAlert);
                  }
                }}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-soft bg-surface-soft px-4 py-4 text-left no-underline transition hover:bg-app"
              >
                <div className="min-w-0">
                  <div className="text-sm font-black text-primary">{plan.months === 1 ? modalCopy.month1 : plan.months === 3 ? modalCopy.month3 : modalCopy.month12}</div>
                  <div className="mt-1 text-xs text-secondary">{plan.months === 1 ? modalCopy.note1 : plan.months === 3 ? modalCopy.note3 : modalCopy.note12}</div>
                </div>

                <div className="shrink-0 rounded-2xl bg-emerald-500 px-3 py-2 text-sm font-black text-white">
                  {plan.stars.toLocaleString("ru-RU")} Stars ⭐
                </div>
              </a>
            );
          })}
        </div>

        <div className="mt-4 rounded-2xl border border-soft bg-app px-4 py-3 text-xs leading-relaxed text-secondary">
          {modalCopy.botNote}
        </div>
      </div>
    </div>
  );
}
