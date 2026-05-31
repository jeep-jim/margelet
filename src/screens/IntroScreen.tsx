import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import type { SiteLocale } from "../lib/locales";
import { SITE_LOCALES } from "../lib/locales";
import { Button } from "../components/ui/Button";

type Props = {
  locale: SiteLocale;
  onChangeLocale: (locale: SiteLocale) => void;
  onFinish: () => void;
  compact?: boolean;
};

type IntroCopy = {
  chooseLanguage: string;
  slides: readonly {
    readonly title: string;
    readonly text: string;
  }[];
  next: string;
  enter: string;
};

const LANGUAGE_STORAGE_KEY = "margelet_locale";

const INTRO_COPY: Record<SiteLocale, IntroCopy> = {
  ru: {
    chooseLanguage: "🌎 Язык",
    slides: [
      {
        title: "Что обсуждают в Telegram прямо сейчас 💜",
        text: "Тренды раньше новостей",
      },
    ],
    next: "Далее",
    enter: "Показать",
  },

  ua: {
    chooseLanguage: "🌎 Мова",
    slides: [
      {
        title: "Ласкаво просимо до margeleT",
        text: "Глобальна стрічка свіжого контенту з Telegram.",
      },
    ],
    next: "Далі",
    enter: "Увійти",
  },

  us: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "What Telegram is talking about right now 💜",
        text: "Trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
  },

  in: {
    chooseLanguage: "🌎 भाषा",
    slides: [
      {
        title: "Telegram अभी किस बारे में बात कर रहा है 💜",
        text: "खबरों से पहले ट्रेंड्स",
      },
    ],
    next: "आगे",
    enter: "दिखाएँ",
  },

  ir: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "چه چیزی در Telegram بحث می‌شود 💜",
        text: "ترندها قبل از اخبار",
      },
    ],
    next: "بعدی",
    enter: "نمایش",
  },

  tr: {
    chooseLanguage: "🌎 Dil",
    slides: [
      {
        title: "Telegram şu anda ne konuşuyor 💜",
        text: "Haberlerden önce trendler",
      },
    ],
    next: "İleri",
    enter: "Göster",
  },

  br: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "O que o Telegram está falando agora 💜",
        text: "Tendências antes das notícias",
      },
    ],
    next: "Próximo",
    enter: "Mostrar",
  },

  kz: {
    chooseLanguage: "🌎 Тіл",
    slides: [
      {
        title: "Қазір Telegram не айтып жатыр 💜",
        text: "Жаңалықтардан бұрын трендтер",
      },
    ],
    next: "Әрі қарай",
    enter: "Көрсету",
  },

  uz: {
    chooseLanguage: "🌎 Til",
    slides: [
      {
        title: "Hozir Telegram nima haqida gapiryapti 💜",
        text: "Yangiliklardan oldin trendlar",
      },
    ],
    next: "Keyingi",
    enter: "Ko‘rsatish",
  },

  ae: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "ما الذي يتحدث عنه Telegram الآن 💜",
        text: "الاتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
  },

  eg: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "ما الذي يتحدث عنه Telegram الآن 💜",
        text: "الاتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
  },

  pk: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "Telegram اب کس بارے میں بات کر رہا ہے 💜",
        text: "خبروں سے پہلے رجحانات",
      },
    ],
    next: "آگے",
    enter: "دکھائیں",
  },

  id: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Apa yang sedang dibicarakan Telegram saat ini 💜",
        text: "Tren sebelum berita",
      },
    ],
    next: "Lanjut",
    enter: "Tampilkan",
  },

  mx: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "De qué está hablando Telegram ahora 💜",
        text: "Tendencias antes que las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
  },

  sa: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "ما الذي يتحدث عنه Telegram الآن 💜",
        text: "الاتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
  },

  es: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "De qué está hablando Telegram ahora 💜",
        text: "Tendencias antes que las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
  },

  it: {
    chooseLanguage: "🌎 Lingua",
    slides: [
      {
        title: "Di cosa sta parlando Telegram in questo momento 💜",
        text: "Tendenze prima delle notizie",
      },
    ],
    next: "Avanti",
    enter: "Mostra",
  },

  fr: {
    chooseLanguage: "🌎 Langue",
    slides: [
      {
        title: "De quoi Telegram parle-t-il en ce moment 💜",
        text: "Les tendances avant les nouvelles",
      },
    ],
    next: "Suivant",
    enter: "Afficher",
  },

  de: {
    chooseLanguage: "🌎 Sprache",
    slides: [
      {
        title: "Worüber spricht Telegram gerade 💜",
        text: "Trends vor den Nachrichten",
      },
    ],
    next: "Weiter",
    enter: "Anzeigen",
  },

  ar: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "De qué está hablando Telegram ahora 💜",
        text: "Tendencias antes que las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
  },

  co: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "De qué está hablando Telegram ahora 💜",
        text: "Tendencias antes que las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
  },

  za: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "What Telegram is talking about right now 💜",
        text: "Trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
  },

  ng: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "What Telegram is talking about right now 💜",
        text: "Trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
  },

  cn: {
    chooseLanguage: "🌎 语言",
    slides: [
      {
        title: "Telegram 现在在讨论什么 💜",
        text: "新闻之前的趋势",
      },
    ],
    next: "下一步",
    enter: "显示",
  },

  my: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Apa yang Telegram bincangkan sekarang 💜",
        text: "Trend sebelum berita",
      },
    ],
    next: "Seterusnya",
    enter: "Tunjukkan",
  },
};

function getSortedLocales() {
  const sorted = [...SITE_LOCALES].sort((a, b) =>
    a.nativeLabel.localeCompare(b.nativeLabel, undefined, {
      sensitivity: "base",
    })
  );

  const ruIndex = sorted.findIndex((item) => item.code === "ru");

  if (ruIndex === -1) return sorted;

  const [ru] = sorted.splice(ruIndex, 1);
  sorted.splice(Math.min(3, sorted.length), 0, ru);

  return sorted;
}

type IntroTrend = {
  word?: string;
  topic?: string;
  mentions: number;
  momentum?: number;
  change?: string;
};

const INTRO_FALLBACK_TRENDS: IntroTrend[] = [
  { topic: "Bitcoin ETF", mentions: 12500, momentum: 178 },
  { topic: "OpenAI", mentions: 7600, momentum: 68 },
  { topic: "Погода Москва сегодня", mentions: 9200, momentum: -9 },
  { topic: "Спартак", mentions: 6100, momentum: 42 },
  { topic: "Tesla", mentions: 214000, momentum: -214 },
  { topic: "NVIDIA", mentions: 6900, momentum: 84 },
  { topic: "Telegram Premium", mentions: 5300, momentum: 31 },
  { topic: "Маркетплейсы", mentions: 9300, momentum: 64 },
];

const INTRO_BAD_TOPICS = new Set([
  "max",
  "чтобы",
  "россии",
  "который",
  "время",
  "через",
  "больше",
  "после",
  "теперь",
  "подписаться",
  "даже",
  "года",
  "может",
  "будут",
  "могут",
  "сейчас",
  "просто",
]);

function getIntroTrendTitle(trend: IntroTrend) {
  return String(trend.topic || trend.word || "").trim();
}

function getIntroMomentum(trend: IntroTrend) {
  if (typeof trend.momentum === "number") return trend.momentum;
  const parsed = Number(String(trend.change || "0").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatIntroNumber(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}

function isGoodIntroTrend(trend: IntroTrend) {
  const title = getIntroTrendTitle(trend);
  if (!title) return false;

  const normalized = title.toLowerCase();
  if (INTRO_BAD_TOPICS.has(normalized)) return false;
  if (/^\d+$/.test(normalized)) return false;
  if (normalized.length < 3) return false;

  return true;
}

function IntroArrow({ up }: { up: boolean }) {
  return (
    <div
      className={[
        "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
        up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400",
      ].join(" ")}
    >
      {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
    </div>
  );
}

function TrendsPreview({ countryCode = "ru" }: { countryCode?: string }) {
  const [trends, setTrends] = useState<IntroTrend[]>(INTRO_FALLBACK_TRENDS);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        const next = Array.isArray(data?.trends)
          ? data.trends.filter(isGoodIntroTrend).slice(0, 40)
          : [];

        if (!cancelled && next.length >= 6) {
          setTrends(next);
          setOffset(0);
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
      }
    }

    fetchTrends();

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  useEffect(() => {
    if (trends.length <= 6) return;

    const timer = window.setInterval(() => {
      setOffset((prev) => (prev + 1) % trends.length);
    }, 2300);

    return () => window.clearInterval(timer);
  }, [trends.length]);

  const visible = Array.from({ length: Math.min(6, trends.length) }, (_, index) =>
    trends[(offset + index) % trends.length]
  );

  return (
    <div className="mx-auto w-full max-w-[330px]">
      <div className="border-y border-dashed border-[#5e7a99]/45 py-4">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={offset}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="space-y-3"
          >
            {visible.map((trend, index) => {
              const title = getIntroTrendTitle(trend);
              const momentum = getIntroMomentum(trend);
              const isUp = momentum >= 0;

              return (
                <div
                  key={`${title}-${offset}-${index}`}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 text-left"
                >
                  <div className="min-w-0 truncate text-[15px] font-black text-white">
                    {title}
                  </div>

                  <div
                    className={[
                      "text-right text-sm font-black",
                      isUp ? "text-emerald-400" : "text-red-400",
                    ].join(" ")}
                  >
                    {formatIntroNumber(trend.mentions)}
                  </div>

                  <IntroArrow up={isUp} />
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function IntroScreen({
  locale,
  onChangeLocale,
  onFinish,
  compact = false,
}: Props) {
  const intro = INTRO_COPY[locale] ?? INTRO_COPY.us;
  const pages = compact ? [intro.slides[0]] : intro.slides;
  const [index, setIndex] = React.useState(0);
  const isLast = index === pages.length - 1;
  const localeOptions = React.useMemo(() => getSortedLocales(), []);

  return (
    <div
      className="notranslate min-h-screen bg-[#17212b] px-4 text-white"
      translate="no"
    >
      <div
        className="flex min-h-screen items-start justify-center pt-4 sm:pt-6"
        style={{
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="w-full max-w-md">
          <div className="mb-5">
            <div className="grid grid-cols-[minmax(84px,0.75fr)_minmax(0,1.25fr)] items-center gap-3 rounded-full border border-[#2b3f53] bg-[#1f2c3a] p-2 pl-5">
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-white/90">
                {intro.chooseLanguage}
              </span>

              <div className="relative min-w-0">
                <select
                  value={locale}
                  onChange={(event) => {
                    const nextLocale = event.target.value as SiteLocale;
                    onChangeLocale(nextLocale);
                    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
                  }}
                  className="w-full appearance-none rounded-full border border-[#2b3f53] bg-[#223244] px-4 py-2 pr-10 text-sm font-semibold text-white outline-none"
                >
                  {localeOptions.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                      className="bg-[#1f2c3a] text-white"
                    >
                      {item.nativeLabel}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9fb0c0]" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="space-y-5">
              <div className="mx-auto max-w-[24rem] pt-1">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${locale}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full"
                  >
                    <div className="text-[clamp(2rem,8vw,3rem)] font-bold leading-tight text-white">
                      {pages[index].title}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <TrendsPreview countryCode={locale === "ru" ? "ru" : "us"} />

              <div className="mx-auto max-w-[22rem] text-base leading-7 text-[#9fb0c0]">
                {pages[index].text}
              </div>

              <div className="flex justify-center pt-1">
                <Button
                  className="min-w-[132px] rounded-2xl px-8 py-3 text-base"
                  onClick={() => {
                    if (isLast) {
                      onFinish();
                      return;
                    }

                    setIndex((prev) => prev + 1);
                  }}
                >
                  {isLast ? intro.enter : intro.next}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}