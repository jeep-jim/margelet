import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { messages } from "../lib/i18n";
import type { Locale } from "../types/app";
import { Button } from "../components/ui/Button";

type Props = {
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  onFinish: () => void;
};

export function IntroScreen({ locale, onChangeLocale, onFinish }: Props) {
  const t = messages[locale];

  const pages = [
    { title: t.intro1Title, text: t.intro1Text },
    { title: t.intro2Title, text: t.intro2Text },
    { title: t.intro3Title, text: t.intro3Text },
    { title: t.intro4Title, text: t.intro4Text },
  ];

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
              {pages.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
                />
              ))}
            </div>

            <div>
              <Button
                className="rounded-2xl"
                onClick={() => {
                  if (isLast) onFinish();
                  else setIndex((i) => i + 1);
                }}
              >
                {isLast ? t.enter : t.next}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}