import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

// Компонент предпросмотра трендов
function TrendsPreview({ countryCode = "ru" }: { countryCode?: string }) {
  const [trends, setTrends] = useState<Array<{ word: string; mentions: number; change: string; history: number[] }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        if (data.ok && data.trends) {
          setTrends(data.trends.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="h-48 w-full max-w-[360px] mx-auto rounded-2xl bg-[#1f2c3a] animate-pulse" />
    );
  }

  if (trends.length === 0) {
    return (
      <div className="h-48 w-full max-w-[360px] mx-auto rounded-2xl bg-[#1f2c3a] flex items-center justify-center text-[#9fb0c0] text-sm">
        No trends yet
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-gradient-to-br from-[#1f2c3a] to-[#17212b] p-4 border border-[#2b3f53]">
      <div className="text-xs font-semibold text-[#9fb0c0] mb-3">🔥 TOP TRENDS</div>
      <div className="space-y-2">
        {trends.map((trend, idx) => (
          <div key={trend.word} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#5e7a99]">#{idx + 1}</span>
              <span className="text-sm font-medium text-white">{trend.word}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-12 rounded-full bg-[#2b3f53] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#f97316]"
                  style={{ width: `${Math.min(100, trend.mentions / 30)}%` }}
                />
              </div>
              <span className="text-xs text-[#f97316]">{trend.change}</span>
            </div>
          </div>
        ))}
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
          {/* Блок с графиком трендов вместо картинки */}
          <div className="mb-4 flex justify-center">
            <TrendsPreview countryCode={locale === "ru" ? "ru" : "us"} />
          </div>

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
            <div className="space-y-4">
              <div className="mx-auto flex min-h-[116px] max-w-[24rem] items-center justify-center sm:min-h-[126px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${locale}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full"
                  >
                    <div className="mb-3 text-[clamp(1.9rem,8vw,3rem)] font-bold leading-tight text-white">
                      {pages[index].title}
                    </div>

                    <div className="mx-auto max-w-[22rem] text-base leading-7 text-[#9fb0c0]">
                      {pages[index].text}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex justify-center">
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