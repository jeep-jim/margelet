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
        title: "Добро пожаловать в margeleT",
        text: "Глобальная лента свежего контента из Telegram.",
      },
      {
        title: "Только открытые источники",
        text: "Каждый пост ведёт в оригинальный Telegram-канал.",
      },
      {
        title: "Чисто и быстро",
        text: "Открывай, смотри и листай без лишнего шума.",
      },
      {
        title: "Выбирай свой язык",
        text: "Интерфейс и контент подстраиваются под выбранную страну.",
      },
    ],
    next: "Далее",
    enter: "Войти",
  },

  uk: {
    chooseLanguage: "🌎 Мова",
    slides: [
      {
        title: "Ласкаво просимо до margeleT",
        text: "Глобальна стрічка свіжого контенту з Telegram.",
      },
      {
        title: "Тільки відкриті джерела",
        text: "Кожен пост веде до оригінального Telegram-каналу.",
      },
      {
        title: "Чисто і швидко",
        text: "Відкривай, дивись і гортай без зайвого шуму.",
      },
      {
        title: "Обирай свою мову",
        text: "Інтерфейс і контент адаптуються до вибраної країни.",
      },
    ],
    next: "Далі",
    enter: "Увійти",
  },

  en: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Welcome to margeleT",
        text: "A global feed of fresh content from Telegram.",
      },
      {
        title: "Only original sources",
        text: "Every post leads to the original Telegram channel.",
      },
      {
        title: "Clean and fast",
        text: "Open, watch and scroll without extra noise.",
      },
      {
        title: "Choose your language",
        text: "The interface and content adapt to your selected country.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },

  in: {
    chooseLanguage: "🌎 भाषा",
    slides: [
      {
        title: "margeleT में आपका स्वागत है",
        text: "Telegram के ताज़ा कंटेंट की ग्लोबल फ़ीड।",
      },
      {
        title: "सिर्फ मूल स्रोत",
        text: "हर पोस्ट अपने मूल Telegram चैनल तक ले जाती है।",
      },
      {
        title: "साफ़ और तेज़",
        text: "खोलें, देखें और बिना शोर के स्क्रोल करें।",
      },
      {
        title: "अपनी भाषा चुनें",
        text: "इंटरफ़ेस और कंटेंट चुने हुए देश के अनुसार बदलते हैं।",
      },
    ],
    next: "आगे",
    enter: "प्रवेश",
  },

  fa: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "به margeleT خوش آمدید",
        text: "فید جهانی محتوای تازه از Telegram.",
      },
      {
        title: "فقط منابع اصلی",
        text: "هر پست به کانال اصلی Telegram می‌رسد.",
      },
      {
        title: "تمیز و سریع",
        text: "باز کن، ببین و بدون شلوغی اسکرول کن.",
      },
      {
        title: "زبانت را انتخاب کن",
        text: "رابط و محتوا با کشور انتخابی هماهنگ می‌شوند.",
      },
    ],
    next: "بعدی",
    enter: "ورود",
  },

  tr: {
    chooseLanguage: "🌎 Dil",
    slides: [
      {
        title: "margeleT'e hoş geldin",
        text: "Telegram'dan taze içeriklerin küresel akışı.",
      },
      {
        title: "Sadece orijinal kaynaklar",
        text: "Her gönderi orijinal Telegram kanalına götürür.",
      },
      {
        title: "Temiz ve hızlı",
        text: "Aç, izle ve ekstra gürültü olmadan kaydır.",
      },
      {
        title: "Dilini seç",
        text: "Arayüz ve içerik seçtiğin ülkeye uyum sağlar.",
      },
    ],
    next: "İleri",
    enter: "Giriş",
  },

  "pt-br": {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Bem-vindo ao margeleT",
        text: "Um feed global de conteúdo novo do Telegram.",
      },
      {
        title: "Só fontes originais",
        text: "Cada post leva ao canal original no Telegram.",
      },
      {
        title: "Limpo e rápido",
        text: "Abra, assista e role sem ruído extra.",
      },
      {
        title: "Escolha seu idioma",
        text: "Interface e conteúdo se adaptam ao país escolhido.",
      },
    ],
    next: "Próximo",
    enter: "Entrar",
  },

  kk: {
    chooseLanguage: "🌎 Тіл",
    slides: [
      {
        title: "margeleT-ке қош келдіңіз",
        text: "Telegram-дағы жаңа контенттің жаһандық лентасы.",
      },
      {
        title: "Тек түпнұсқа дереккөздер",
        text: "Әр пост түпнұсқа Telegram-каналға апарады.",
      },
      {
        title: "Таза әрі жылдам",
        text: "Аш, көр және артық шуылсыз айналдыр.",
      },
      {
        title: "Тіліңізді таңдаңыз",
        text: "Интерфейс пен контент таңдалған елге бейімделеді.",
      },
    ],
    next: "Әрі қарай",
    enter: "Кіру",
  },

  uz: {
    chooseLanguage: "🌎 Til",
    slides: [
      {
        title: "margeleT’ga xush kelibsiz",
        text: "Telegram’dan yangi kontentning global lentasi.",
      },
      {
        title: "Faqat asl manbalar",
        text: "Har bir post asl Telegram-kanalga olib boradi.",
      },
      {
        title: "Toza va tez",
        text: "Och, ko‘r va ortiqcha shovqinsiz varaqlang.",
      },
      {
        title: "Tilingizni tanlang",
        text: "Interfeys va kontent tanlangan mamlakatga moslashadi.",
      },
    ],
    next: "Keyingi",
    enter: "Kirish",
  },

  ae: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "مرحباً بك في margeleT",
        text: "خلاصة عالمية لمحتوى جديد من Telegram.",
      },
      {
        title: "مصادر أصلية فقط",
        text: "كل منشور يقود إلى قناة Telegram الأصلية.",
      },
      {
        title: "نظيف وسريع",
        text: "افتح وشاهد وتصفح بلا ضوضاء زائدة.",
      },
      {
        title: "اختر لغتك",
        text: "الواجهة والمحتوى يتكيفان مع البلد المختار.",
      },
    ],
    next: "التالي",
    enter: "دخول",
  },

  eg: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "أهلاً بك في margeleT",
        text: "خلاصة عالمية لمحتوى جديد من Telegram.",
      },
      {
        title: "مصادر أصلية فقط",
        text: "كل منشور يوصلك لقناة Telegram الأصلية.",
      },
      {
        title: "بسيط وسريع",
        text: "افتح وشاهد وتصفح من غير زحمة.",
      },
      {
        title: "اختر لغتك",
        text: "الواجهة والمحتوى يتغيران حسب البلد المختار.",
      },
    ],
    next: "التالي",
    enter: "دخول",
  },

  pk: {
    chooseLanguage: "🌎 زبان",
    slides: [
      {
        title: "margeleT میں خوش آمدید",
        text: "Telegram کے تازہ مواد کی عالمی فیڈ۔",
      },
      {
        title: "صرف اصل ذرائع",
        text: "ہر پوسٹ اصل Telegram چینل تک لے جاتی ہے۔",
      },
      {
        title: "صاف اور تیز",
        text: "کھولیں، دیکھیں اور بغیر شور کے اسکرول کریں۔",
      },
      {
        title: "اپنی زبان چنیں",
        text: "انٹرفیس اور مواد منتخب ملک کے مطابق بدلتے ہیں۔",
      },
    ],
    next: "آگے",
    enter: "داخل ہوں",
  },

  id: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Selamat datang di margeleT",
        text: "Feed global konten segar dari Telegram.",
      },
      {
        title: "Hanya sumber asli",
        text: "Setiap posting mengarah ke channel Telegram asli.",
      },
      {
        title: "Bersih dan cepat",
        text: "Buka, tonton, dan gulir tanpa gangguan berlebih.",
      },
      {
        title: "Pilih bahasamu",
        text: "Antarmuka dan konten menyesuaikan negara pilihanmu.",
      },
    ],
    next: "Lanjut",
    enter: "Masuk",
  },

  mx: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Bienvenido a margeleT",
        text: "Un feed global de contenido fresco de Telegram.",
      },
      {
        title: "Solo fuentes originales",
        text: "Cada publicación lleva al canal original de Telegram.",
      },
      {
        title: "Limpio y rápido",
        text: "Abre, mira y desliza sin ruido extra.",
      },
      {
        title: "Elige tu idioma",
        text: "La interfaz y el contenido se adaptan al país elegido.",
      },
    ],
    next: "Siguiente",
    enter: "Entrar",
  },

  sa: {
    chooseLanguage: "🌎 اللغة",
    slides: [
      {
        title: "مرحباً بك في margeleT",
        text: "خلاصة عالمية لمحتوى جديد من Telegram.",
      },
      {
        title: "مصادر أصلية فقط",
        text: "كل منشور يقود إلى قناة Telegram الأصلية.",
      },
      {
        title: "نظيف وسريع",
        text: "افتح وشاهد وتصفح بلا ضوضاء زائدة.",
      },
      {
        title: "اختر لغتك",
        text: "الواجهة والمحتوى يتكيفان مع البلد المختار.",
      },
    ],
    next: "التالي",
    enter: "دخول",
  },

  es: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Bienvenido a margeleT",
        text: "Un feed global de contenido fresco de Telegram.",
      },
      {
        title: "Solo fuentes originales",
        text: "Cada publicación lleva al canal original de Telegram.",
      },
      {
        title: "Limpio y rápido",
        text: "Abre, mira y desliza sin ruido extra.",
      },
      {
        title: "Elige tu idioma",
        text: "La interfaz y el contenido se adaptan al país elegido.",
      },
    ],
    next: "Siguiente",
    enter: "Entrar",
  },

  it: {
    chooseLanguage: "🌎 Lingua",
    slides: [
      {
        title: "Benvenuto su margeleT",
        text: "Un feed globale di contenuti freschi da Telegram.",
      },
      {
        title: "Solo fonti originali",
        text: "Ogni post porta al canale Telegram originale.",
      },
      {
        title: "Pulito e veloce",
        text: "Apri, guarda e scorri senza rumore inutile.",
      },
      {
        title: "Scegli la tua lingua",
        text: "Interfaccia e contenuti si adattano al paese scelto.",
      },
    ],
    next: "Avanti",
    enter: "Entra",
  },

  fr: {
    chooseLanguage: "🌎 Langue",
    slides: [
      {
        title: "Bienvenue sur margeleT",
        text: "Un flux mondial de contenu frais depuis Telegram.",
      },
      {
        title: "Sources originales seulement",
        text: "Chaque post mène au canal Telegram d’origine.",
      },
      {
        title: "Clair et rapide",
        text: "Ouvre, regarde et fais défiler sans bruit inutile.",
      },
      {
        title: "Choisis ta langue",
        text: "L’interface et le contenu s’adaptent au pays choisi.",
      },
    ],
    next: "Suivant",
    enter: "Entrer",
  },

  de: {
    chooseLanguage: "🌎 Sprache",
    slides: [
      {
        title: "Willkommen bei margeleT",
        text: "Ein globaler Feed mit frischen Inhalten aus Telegram.",
      },
      {
        title: "Nur Originalquellen",
        text: "Jeder Beitrag führt zum ursprünglichen Telegram-Kanal.",
      },
      {
        title: "Sauber und schnell",
        text: "Öffnen, ansehen und ohne unnötigen Lärm scrollen.",
      },
      {
        title: "Wähle deine Sprache",
        text: "Interface und Inhalte passen sich dem gewählten Land an.",
      },
    ],
    next: "Weiter",
    enter: "Starten",
  },

  ar: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Bienvenido a margeleT",
        text: "Un feed global de contenido fresco de Telegram.",
      },
      {
        title: "Solo fuentes originales",
        text: "Cada publicación lleva al canal original de Telegram.",
      },
      {
        title: "Limpio y rápido",
        text: "Abre, mira y desliza sin ruido extra.",
      },
      {
        title: "Elige tu idioma",
        text: "La interfaz y el contenido se adaptan al país elegido.",
      },
    ],
    next: "Siguiente",
    enter: "Entrar",
  },

  co: {
    chooseLanguage: "🌎 Idioma",
    slides: [
      {
        title: "Bienvenido a margeleT",
        text: "Un feed global de contenido fresco de Telegram.",
      },
      {
        title: "Solo fuentes originales",
        text: "Cada publicación lleva al canal original de Telegram.",
      },
      {
        title: "Limpio y rápido",
        text: "Abre, mira y desliza sin ruido extra.",
      },
      {
        title: "Elige tu idioma",
        text: "La interfaz y el contenido se adaptan al país elegido.",
      },
    ],
    next: "Siguiente",
    enter: "Entrar",
  },

  za: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Welcome to margeleT",
        text: "A global feed of fresh content from Telegram.",
      },
      {
        title: "Only original sources",
        text: "Every post leads to the original Telegram channel.",
      },
      {
        title: "Clean and fast",
        text: "Open, watch and scroll without extra noise.",
      },
      {
        title: "Choose your language",
        text: "The interface and content adapt to your selected country.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },

  ng: {
    chooseLanguage: "🌎 Language",
    slides: [
      {
        title: "Welcome to margeleT",
        text: "A global feed of fresh content from Telegram.",
      },
      {
        title: "Only original sources",
        text: "Every post leads to the original Telegram channel.",
      },
      {
        title: "Clean and fast",
        text: "Open, watch and scroll without extra noise.",
      },
      {
        title: "Choose your language",
        text: "The interface and content adapt to your selected country.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },

  zh: {
    chooseLanguage: "🌎 语言",
    slides: [
      {
        title: "欢迎来到 margeleT",
        text: "来自 Telegram 的全球新鲜内容流。",
      },
      {
        title: "只保留原始来源",
        text: "每条内容都会指向原始 Telegram 频道。",
      },
      {
        title: "简洁快速",
        text: "打开、观看、滑动，没有多余干扰。",
      },
      {
        title: "选择你的语言",
        text: "界面和内容会适配你选择的国家。",
      },
    ],
    next: "下一步",
    enter: "进入",
  },

  ms: {
    chooseLanguage: "🌎 Bahasa",
    slides: [
      {
        title: "Selamat datang ke margeleT",
        text: "Suapan global kandungan segar daripada Telegram.",
      },
      {
        title: "Hanya sumber asal",
        text: "Setiap siaran membawa ke saluran Telegram asal.",
      },
      {
        title: "Bersih dan pantas",
        text: "Buka, tonton dan tatal tanpa gangguan berlebihan.",
      },
      {
        title: "Pilih bahasa anda",
        text: "Antara muka dan kandungan menyesuaikan negara pilihan anda.",
      },
    ],
    next: "Seterusnya",
    enter: "Masuk",
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
    <div
      className="notranslate min-h-screen bg-[#17212b] px-4 text-white"
      translate="no"
    >
      <div
        className="flex min-h-screen items-start justify-center pt-4 sm:pt-6"
        style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="w-full max-w-md">
          <div className="mb-4 flex justify-center">
            <img
              src="/hero.webp"
              alt="margeleT"
              className="h-auto w-full max-w-[360px] sm:max-w-[400px] opacity-90"
            />
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

              <div className="flex justify-center gap-2">
                {pages.map((_, i: number) => (
                  <div
                    key={i}
                    className={`h-2 w-2 rounded-full ${
                      i === index ? "bg-white" : "bg-[#516679]"
                    }`}
                  />
                ))}
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
