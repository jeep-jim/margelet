import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { messages } from "../lib/i18n";
import { SITE_LOCALES, type SiteLocale } from "../lib/locales";
import { Button } from "../components/ui/Button";

type Props = {
  locale: SiteLocale;
  onChangeLocale: (locale: SiteLocale) => void;
  onFinish: () => void;
};

const INTRO_FALLBACK = {
  ru: {
    slides: [
      {
        title: "Добро пожаловать в margeleT",
        text: "Глобальная лента настоящего контента из Telegram.",
      },
      {
        title: "Только оригинальные источники",
        text: "Каждый пост всегда связан со своим Telegram-каналом.",
      },
      {
        title: "Чисто и быстро",
        text: "Открывай, смотри и листай без лишнего шума.",
      },
      {
        title: "Выбирай свой язык",
        text: "Интерфейс и контент могут подстраиваться под выбранную страну.",
      },
    ],
    next: "Далее",
    enter: "Войти",
  },
  default: {
    slides: [
      {
        title: "Welcome to margeleT",
        text: "A global feed of real Telegram content.",
      },
      {
        title: "Only original sources",
        text: "Every post stays connected to its original Telegram channel.",
      },
      {
        title: "Clean and fast",
        text: "Open, watch and scroll without extra noise.",
      },
      {
        title: "Choose your language",
        text: "The interface and content can adapt to your selected market.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },
};

const LANGUAGE_STORAGE_KEY = "margelet_locale";

function getSortedLocales() {
  return [...SITE_LOCALES].sort((a, b) =>
    a.nativeLabel.localeCompare(b.nativeLabel, undefined, {
      sensitivity: "base",
    }),
  );
}

export function IntroScreen({ locale, onChangeLocale, onFinish }: Props) {
  const dict = messages[locale];
  const intro =
    dict.intro ?? (locale === "ru" ? INTRO_FALLBACK.ru : INTRO_FALLBACK.default);

  const pages = intro.slides;
  const [index, setIndex] = React.useState(0);
  const isLast = index === pages.length - 1;
  const localeOptions = React.useMemo(() => getSortedLocales(), []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-7">
            <div className="flex items-center justify-between rounded-full border border-white/15 bg-white/5 px-3 py-2.5 backdrop-blur-sm">
              <span className="truncate pr-3 text-sm font-medium text-white/90">
                {locale === "ru" ? "Выбрать язык" : "Choose language"}
              </span>

              <div className="relative shrink-0">
                <select
                  value={locale}
                  onChange={(event) => {
                    const nextLocale = event.target.value as SiteLocale;
                    onChangeLocale(nextLocale);
                    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
                  }}
                  className="appearance-none rounded-full border border-white/15 bg-white/5 px-4 py-2 pr-10 text-sm font-medium text-white outline-none"
                >
                  {localeOptions.map((item) => (
                    <option
                      key={item.code}
                      value={item.code}
                      className="bg-[#0f1017] text-white"
                    >
                      {item.nativeLabel}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-3 text-3xl font-bold">{pages[index].title}</div>
                  <div className="text-white/70">{pages[index].text}</div>
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-center gap-2">
                {pages.map((_, i: number) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i === index ? "bg-white" : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <div>
                <Button
                  className="rounded-2xl"
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