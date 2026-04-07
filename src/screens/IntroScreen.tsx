import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { SiteLocale } from "../lib/locales";
import { SITE_LOCALES } from "../lib/locales";
import { Button } from "../components/ui/Button";

type Props = {
  locale: SiteLocale;
  onChangeLocale: (locale: SiteLocale) => void;
  onFinish: () => void;
};

type IntroSlide = {
  title: string;
  text: string;
};

type IntroCopy = {
  slides: IntroSlide[];
  next: string;
  enter: string;
  chooseLanguage: string;
};

const LANGUAGE_STORAGE_KEY = "margelet_locale";

const INTRO_COPY: Record<SiteLocale, IntroCopy> = {
  en: {
    chooseLanguage: "Choose language",
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
        text: "The interface and content automatically adapt to your selected country.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },

  ru: {
    chooseLanguage: "Выбрать язык",
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
        text: "Интерфейс и контент автоматически подстраиваются под выбранную страну.",
      },
    ],
    next: "Далее",
    enter: "Войти",
  },

  de: {
    chooseLanguage: "Sprache wählen",
    slides: [
      {
        title: "Willkommen bei margeleT",
        text: "Ein globaler Feed mit echtem Telegram-Content.",
      },
      {
        title: "Nur originale Quellen",
        text: "Jeder Beitrag bleibt immer mit seinem ursprünglichen Telegram-Kanal verbunden.",
      },
      {
        title: "Sauber und schnell",
        text: "Öffnen, ansehen und scrollen — ohne unnötigen Lärm.",
      },
      {
        title: "Wähle deine Sprache",
        text: "Interface und Inhalte passen sich automatisch deinem ausgewählten Land an.",
      },
    ],
    next: "Weiter",
    enter: "Betreten",
  },

  es: {
    chooseLanguage: "Elegir idioma",
    slides: [
      {
        title: "Bienvenido a margeleT",
        text: "Un feed global de contenido real de Telegram.",
      },
      {
        title: "Solo fuentes originales",
        text: "Cada publicación siempre permanece conectada a su canal original de Telegram.",
      },
      {
        title: "Limpio y rápido",
        text: "Abre, mira y desliza sin ruido extra.",
      },
      {
        title: "Elige tu idioma",
        text: "La interfaz y el contenido se adaptan automáticamente a tu país seleccionado.",
      },
    ],
    next: "Siguiente",
    enter: "Entrar",
  },

  tr: {
    chooseLanguage: "Dil seç",
    slides: [
      {
        title: "margeleT'e hoş geldin",
        text: "Gerçek Telegram içeriğinin küresel akışı.",
      },
      {
        title: "Sadece orijinal kaynaklar",
        text: "Her gönderi her zaman kendi orijinal Telegram kanalına bağlı kalır.",
      },
      {
        title: "Temiz ve hızlı",
        text: "Ekstra gürültü olmadan aç, izle ve kaydır.",
      },
      {
        title: "Dilini seç",
        text: "Arayüz ve içerik seçtiğin ülkeye otomatik olarak uyum sağlar.",
      },
    ],
    next: "İleri",
    enter: "Giriş",
  },

  fr: {
    chooseLanguage: "Choisir la langue",
    slides: [
      {
        title: "Bienvenue dans margeleT",
        text: "Un flux mondial de vrai contenu Telegram.",
      },
      {
        title: "Uniquement des sources originales",
        text: "Chaque publication reste toujours liée à son canal Telegram d’origine.",
      },
      {
        title: "Propre et rapide",
        text: "Ouvre, regarde et fais défiler sans bruit inutile.",
      },
      {
        title: "Choisis ta langue",
        text: "L’interface et le contenu s’adaptent automatiquement au pays sélectionné.",
      },
    ],
    next: "Suivant",
    enter: "Entrer",
  },

  it: {
    chooseLanguage: "Scegli lingua",
    slides: [
      {
        title: "Benvenuto in margeleT",
        text: "Un feed globale di vero contenuto Telegram.",
      },
      {
        title: "Solo fonti originali",
        text: "Ogni post resta sempre collegato al suo canale Telegram originale.",
      },
      {
        title: "Pulito e veloce",
        text: "Apri, guarda e scorri senza rumore inutile.",
      },
      {
        title: "Scegli la tua lingua",
        text: "L’interfaccia e i contenuti si adattano automaticamente al paese selezionato.",
      },
    ],
    next: "Avanti",
    enter: "Entra",
  },

  "pt-br": {
    chooseLanguage: "Escolher idioma",
    slides: [
      {
        title: "Bem-vindo ao margeleT",
        text: "Um feed global de conteúdo real do Telegram.",
      },
      {
        title: "Somente fontes originais",
        text: "Cada post permanece sempre conectado ao seu canal original do Telegram.",
      },
      {
        title: "Limpo e rápido",
        text: "Abra, assista e deslize sem ruído extra.",
      },
      {
        title: "Escolha seu idioma",
        text: "A interface e o conteúdo se adaptam automaticamente ao país selecionado.",
      },
    ],
    next: "Próximo",
    enter: "Entrar",
  },

  id: {
    chooseLanguage: "Pilih bahasa",
    slides: [
      {
        title: "Selamat datang di margeleT",
        text: "Feed global dari konten Telegram yang nyata.",
      },
      {
        title: "Hanya sumber asli",
        text: "Setiap postingan selalu tetap terhubung ke kanal Telegram aslinya.",
      },
      {
        title: "Bersih dan cepat",
        text: "Buka, tonton, dan gulir tanpa gangguan berlebih.",
      },
      {
        title: "Pilih bahasamu",
        text: "Antarmuka dan konten otomatis menyesuaikan dengan negara yang kamu pilih.",
      },
    ],
    next: "Lanjut",
    enter: "Masuk",
  },

  pl: {
    chooseLanguage: "Wybierz język",
    slides: [
      {
        title: "Witamy w margeleT",
        text: "Globalny feed prawdziwych treści z Telegrama.",
      },
      {
        title: "Tylko oryginalne źródła",
        text: "Każdy post zawsze pozostaje połączony ze swoim oryginalnym kanałem Telegram.",
      },
      {
        title: "Czysto i szybko",
        text: "Otwieraj, oglądaj i przewijaj bez zbędnego szumu.",
      },
      {
        title: "Wybierz swój język",
        text: "Interfejs i treści automatycznie dostosowują się do wybranego kraju.",
      },
    ],
    next: "Dalej",
    enter: "Wejdź",
  },
};

function getSortedLocales() {
  const sorted = [...SITE_LOCALES].sort((a, b) =>
    a.nativeLabel.localeCompare(b.nativeLabel, undefined, {
      sensitivity: "base",
    }),
  );

  const ruIndex = sorted.findIndex((item) => item.code === "ru");

  if (ruIndex === -1) return sorted;

  const [ru] = sorted.splice(ruIndex, 1);
  sorted.splice(Math.min(3, sorted.length), 0, ru);

  return sorted;
}

export function IntroScreen({ locale, onChangeLocale, onFinish }: Props) {
  const intro = INTRO_COPY[locale] ?? INTRO_COPY.en;
  const pages = intro.slides;
  const [index, setIndex] = React.useState(0);
  const isLast = index === pages.length - 1;
  const localeOptions = React.useMemo(() => getSortedLocales(), []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 text-white">
      <div className="flex min-h-screen items-center justify-center py-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex justify-center">
            <img
              src="/hero.webp"
              alt="margeleT"
              className="h-auto w-full max-w-[420px] opacity-90"
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between rounded-full border border-white/15 bg-white/5 py-2 pl-6 pr-3 backdrop-blur-sm">
              <span className="truncate pr-4 text-sm font-medium text-white/90">
                {intro.chooseLanguage}
              </span>

              <div className="relative shrink-0">
                <select
                  value={locale}
                  onChange={(event) => {
                    const nextLocale = event.target.value as SiteLocale;
                    onChangeLocale(nextLocale);
                    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
                  }}
                  className="appearance-none rounded-full bg-white/5 px-4 py-2 pr-10 text-sm font-medium text-white outline-none"
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
            <div className="space-y-4">
              <div className="mx-auto flex min-h-[110px] max-w-[24rem] items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${locale}-${index}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="w-full"
                  >
                    <div className="mb-3 text-3xl font-bold leading-tight">
                      {pages[index].title}
                    </div>

                    <div className="mx-auto max-w-[22rem] text-base leading-7 text-white/70">
                      {pages[index].text}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

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