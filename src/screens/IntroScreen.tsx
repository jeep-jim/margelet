import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";
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
  sources: string;
};

const LANGUAGE_STORAGE_KEY = "margelet_locale";

const INTRO_COPY: Record<SiteLocale, IntroCopy> = {
  ru: {
    chooseLanguage: "🌎 Язык",
    slides: [
      {
        title: "Где сейчас внимание людей 👀",
        text: "margeleT — это индекс внимания и тренды раньше новостей",
      },
    ],
    next: "Далее",
    enter: "Показать",
    sources: "источников",
  },

  ua: {
    chooseLanguage: "🌎 Мова",
    slides: [
      {
        title: "Де зараз увага людей 👀",
        text: "margeleT — це індекс уваги і тренди раніше за новини",
      },
    ],
    next: "Далі",
    enter: "Показати",
    sources: "джерел",
  },

  us: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Where people's attention is now 👀",
        text: "margeleT is an attention index and trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
    sources: "sources",
  },

  in: {
    chooseLanguage: "🌎 भाषा",
    slides: [
      {
        title: "लोगों का ध्यान अभी कहाँ है 👀",
        text: "margeleT ध्यान का इंडेक्स है और खबरों से पहले ट्रेंड दिखाता है",
      },
    ],
    next: "आगे",
    enter: "दिखाएँ",
    sources: "स्रोत",
  },

  ir: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "توجه مردم الان کجاست 👀",
        text: "margeleT شاخص توجه است و روندها را قبل از خبرها نشان می‌دهد",
      },
    ],
    next: "بعدی",
    enter: "نمایش",
    sources: "منبع",
  },

  tr: {
    chooseLanguage: "🌎 Dil",
    slides: [
      {
        title: "İnsanların dikkati şimdi nerede 👀",
        text: "margeleT bir dikkat endeksi ve haberlerden önce trendlerdir",
      },
    ],
    next: "İleri",
    enter: "Göster",
    sources: "kaynak",
  },

  br: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Onde está a atenção das pessoas agora 👀",
        text: "margeleT é um índice de atenção e tendências antes das notícias",
      },
    ],
    next: "Próximo",
    enter: "Mostrar",
    sources: "fontes",
  },

  kz: {
    chooseLanguage: "🌎 Тіл",
    slides: [
      {
        title: "Адамдардың назары қазір қайда 👀",
        text: "margeleT — назар индексі және жаңалықтардан бұрынғы трендтер",
      },
    ],
    next: "Әрі қарай",
    enter: "Көрсету",
    sources: "дереккөз",
  },

  uz: {
    chooseLanguage: "🌎 Til",
    slides: [
      {
        title: "Odamlar eʼtibori hozir qayerda 👀",
        text: "margeleT — eʼtibor indeksi va yangiliklardan oldingi trendlar",
      },
    ],
    next: "Keyingi",
    enter: "Ko‘rsatish",
    sources: "manba",
  },

  ae: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "أين انتباه الناس الآن 👀",
        text: "margeleT هو مؤشر للانتباه واتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
    sources: "مصدر",
  },

  eg: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "أين انتباه الناس الآن 👀",
        text: "margeleT هو مؤشر للانتباه واتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
    sources: "مصدر",
  },

  pk: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "لوگوں کی توجہ ابھی کہاں ہے 👀",
        text: "margeleT توجہ کا انڈیکس ہے اور خبروں سے پہلے رجحانات دکھاتا ہے",
      },
    ],
    next: "آگے",
    enter: "دکھائیں",
    sources: "ذرائع",
  },

  id: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Perhatian orang sedang ke mana 👀",
        text: "margeleT adalah indeks perhatian dan tren sebelum berita",
      },
    ],
    next: "Lanjut",
    enter: "Tampilkan",
    sources: "sumber",
  },

  mx: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Dónde está la atención de la gente ahora 👀",
        text: "margeleT es un índice de atención y tendencias antes de las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
    sources: "fuentes",
  },

  sa: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "أين انتباه الناس الآن 👀",
        text: "margeleT هو مؤشر للانتباه واتجاهات قبل الأخبار",
      },
    ],
    next: "التالي",
    enter: "عرض",
    sources: "مصدر",
  },

  es: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Dónde está la atención de la gente ahora 👀",
        text: "margeleT es un índice de atención y tendencias antes de las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
    sources: "fuentes",
  },

  it: {
    chooseLanguage: "🌎 Lingua",
    slides: [
      {
        title: "Dov'è ora l'attenzione delle persone 👀",
        text: "margeleT è un indice dell'attenzione e trend prima delle notizie",
      },
    ],
    next: "Avanti",
    enter: "Mostra",
    sources: "fonti",
  },

  fr: {
    chooseLanguage: "🌎 Langue",
    slides: [
      {
        title: "Où est l'attention des gens maintenant 👀",
        text: "margeleT est un indice d'attention et des tendances avant l'actualité",
      },
    ],
    next: "Suivant",
    enter: "Afficher",
    sources: "sources",
  },

  de: {
    chooseLanguage: "🌎 Sprache",
    slides: [
      {
        title: "Wo ist die Aufmerksamkeit der Menschen jetzt 👀",
        text: "margeleT ist ein Aufmerksamkeitsindex und Trends vor den Nachrichten",
      },
    ],
    next: "Weiter",
    enter: "Anzeigen",
    sources: "Quellen",
  },

  ar: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Dónde está la atención de la gente ahora 👀",
        text: "margeleT es un índice de atención y tendencias antes de las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
    sources: "fuentes",
  },

  co: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Dónde está la atención de la gente ahora 👀",
        text: "margeleT es un índice de atención y tendencias antes de las noticias",
      },
    ],
    next: "Siguiente",
    enter: "Mostrar",
    sources: "fuentes",
  },

  za: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Where people's attention is now 👀",
        text: "margeleT is an attention index and trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
    sources: "sources",
  },

  ng: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Where people's attention is now 👀",
        text: "margeleT is an attention index and trends before the news",
      },
    ],
    next: "Next",
    enter: "Show",
    sources: "sources",
  },

  cn: {
    chooseLanguage: "🌎 语言",
    slides: [
      {
        title: "人们现在的注意力在哪里 👀",
        text: "margeleT 是注意力指数，也是新闻之前的趋势",
      },
    ],
    next: "下一步",
    enter: "显示",
    sources: "来源",
  },

  my: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Di mana perhatian orang sekarang 👀",
        text: "margeleT ialah indeks perhatian dan trend sebelum berita",
      },
    ],
    next: "Seterusnya",
    enter: "Tunjukkan",
    sources: "sumber",
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

type IntroTrendSource = {
  id?: string;
  title?: string;
  username?: string;
  avatarUrl?: string;
  mentions?: number;
};

type IntroTrend = {
  word?: string;
  topic?: string;
  mentions: number;
  momentum?: number;
  change?: string;
  sourceCount?: number;
  topSources?: IntroTrendSource[];
};

const INTRO_FALLBACK_TRENDS: IntroTrend[] = [
  { topic: "Погода Москва сегодня", mentions: 25000, momentum: 178, sourceCount: 35, topSources: [] },
  { topic: "NVIDIA", mentions: 6900, momentum: 84, sourceCount: 18, topSources: [] },
  { topic: "ChatGPT", mentions: 7600, momentum: 68, sourceCount: 21, topSources: [] },
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
  "other",
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

function getIntroSources(trend: IntroTrend) {
  return Array.isArray(trend.topSources)
    ? trend.topSources
        .filter((source) => String(source?.title || "").trim())
        .slice(0, 6)
    : [];
}

function getSourceInitial(title: string) {
  return title.trim().charAt(0).toUpperCase() || "T";
}

function truncateSourceTitle(title: string) {
  const clean = title.trim();
  if (clean.length <= 11) return clean;
  return `${clean.slice(0, 10)}…`;
}

function SourceAvatar({ source }: { source: IntroTrendSource }) {
  const title = String(source.title || source.username || "Telegram").trim();
  const avatarUrl = String(source.avatarUrl || "").trim();

  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto grid h-[46px] w-[46px] place-items-center overflow-hidden rounded-full border-2 border-white bg-[#223244] shadow-[0_0_0_2px_rgba(94,122,153,0.45)]">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-black text-white">{getSourceInitial(title)}</span>
        )}
      </div>

      <div className="mt-2 max-w-[58px] truncate text-[10px] font-bold leading-none text-[#8fb1d2]">
        {truncateSourceTitle(title)}
      </div>
    </div>
  );
}

function TrendAttentionPreview({
  trend,
  sourceLabel,
}: {
  trend: IntroTrend;
  sourceLabel: string;
}) {
  const title = getIntroTrendTitle(trend);
  const mentions = Math.max(0, Number(trend.mentions) || 0);
  const sourceCount = Math.max(
    Number(trend.sourceCount) || 0,
    Array.isArray(trend.topSources) ? trend.topSources.length : 0
  );
  const sources = getIntroSources(trend);
  const isUp = getIntroMomentum(trend) >= 0;

  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      className="w-full"
    >
      <div className="grid grid-cols-[minmax(0,auto)_1fr_auto_auto] items-center gap-3">
        <div className="min-w-0 truncate text-left text-[17px] font-black text-white">
          {title}
        </div>

        <div className="h-px min-w-[24px] border-t border-dashed border-[#5e7a99]/75" />

        <div className="text-right text-[15px] font-black text-emerald-400">
          {formatIntroNumber(mentions)}
        </div>

        <TrendingUp
          className={[
            "h-5 w-5",
            isUp ? "text-emerald-400" : "text-emerald-400",
          ].join(" ")}
        />
      </div>

      <div className="pt-8 text-center text-[27px] font-black leading-none text-[#6f86a0]">
        +{sourceCount} {sourceLabel}
      </div>

      <div className="pt-7">
        {sources.length > 0 ? (
          <div className="grid grid-cols-6 items-start gap-3">
            {sources.map((source, index) => (
              <SourceAvatar
                key={`${source.id || source.username || source.title || index}-${index}`}
                source={source}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 items-start gap-3 opacity-0">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-[58px]" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TrendsPreview({
  countryCode = "ru",
  sourceLabel,
}: {
  countryCode?: string;
  sourceLabel: string;
}) {
  const [trends, setTrends] = useState<IntroTrend[]>(INTRO_FALLBACK_TRENDS);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        const next = Array.isArray(data?.trends)
          ? data.trends
              .filter(isGoodIntroTrend)
              .filter((trend: IntroTrend) => getIntroSources(trend).length > 0)
              .slice(0, 20)
          : [];

        if (!cancelled && next.length > 0) {
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
    if (trends.length <= 1) return;

    const timer = window.setInterval(() => {
      setOffset((prev) => (prev + 1) % trends.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [trends.length]);

  const trend = trends[offset % trends.length] || INTRO_FALLBACK_TRENDS[0];

  return (
    <div className="mx-auto w-full max-w-[330px]">
      <div className="border-y border-dashed border-[#5e7a99]/55 py-8">
        <AnimatePresence mode="wait" initial={false}>
          <TrendAttentionPreview
            key={`${getIntroTrendTitle(trend)}-${offset}`}
            trend={trend}
            sourceLabel={sourceLabel}
          />
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

              <TrendsPreview
                countryCode={locale === "ru" ? "ru" : "us"}
                sourceLabel={intro.sources}
              />

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
