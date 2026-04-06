import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { messages } from "../lib/i18n";
import type { SiteLocale } from "../lib/locales";
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

export function IntroScreen({ locale, onChangeLocale, onFinish }: Props) {
  const dict = messages[locale];
  const intro =
    dict.intro ?? (locale === "ru" ? INTRO_FALLBACK.ru : INTRO_FALLBACK.default);

  const pages = intro.slides;
  const [index, setIndex] = React.useState(0);
  const isLast = index === pages.length - 1;

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 text-white">
      <div className="flex min-h-screen items-center justify-center">
        <div className="relative w-full max-w-md text-center">
          <div className="absolute right-0 top-[-64px]">
            <button
              onClick={() => onChangeLocale(locale === "ru" ? "en" : "ru")}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
            >
              {locale.toUpperCase()}
            </button>
          </div>

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
  );
}