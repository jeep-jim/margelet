import { ArrowLeft, Menu, Moon, Plus, Sun, Trash2, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MargeletMark } from "../../components/shared/MargeletMark";
import type { Locale } from "../../types/app";

const SPACE_MESSAGES_STORAGE_KEY = "margelet_space_messages_v1";
const SPACE_THREADS_STORAGE_KEY = "margelet_space_threads_v1";
const SPACE_ACTIVE_THREAD_STORAGE_KEY = "margelet_space_active_thread_v1";
const MARGELET_THEME_STORAGE_KEY = "margelet_theme";

type SpaceTheme = "dark" | "light";

function readSpaceTheme(): SpaceTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function applySpaceTheme(theme: SpaceTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(MARGELET_THEME_STORAGE_KEY, theme);
}

type SpaceMessage = {
  role: "user" | "space";
  text: string;
};

type SpaceThread = {
  id: string;
  title: string;
  messages: SpaceMessage[];
  updatedAt: number;
};

type SpaceTelegramUser = {
  first_name?: string;
  username?: string;
  photo_url?: string;
};

function readSpaceTelegramUser(): SpaceTelegramUser | null {
  try {
    const raw = localStorage.getItem("margelet_tg_user");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpaceTelegramUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function createSpaceThread(title = "New Space"): SpaceThread {
  return {
    id: `space-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    messages: [],
    updatedAt: Date.now(),
  };
}

function getSpaceThreadTitle(text: string) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New Space";
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean;
}

function readSpaceThreadsFromStorage(): SpaceThread[] {
  try {
    const raw = localStorage.getItem(SPACE_THREADS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .filter(
          (thread): thread is SpaceThread =>
            thread &&
            typeof thread.id === "string" &&
            typeof thread.title === "string" &&
            typeof thread.updatedAt === "number" &&
            Array.isArray(thread.messages),
        )
        .map((thread) => ({
          ...thread,
          messages: thread.messages
            .filter(
              (message): message is SpaceMessage =>
                message &&
                (message.role === "user" || message.role === "space") &&
                typeof message.text === "string",
            )
            .slice(-80),
        }))
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 40);
    }

    const legacyRaw = localStorage.getItem(SPACE_MESSAGES_STORAGE_KEY);
    const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : [];
    if (!Array.isArray(legacyParsed) || legacyParsed.length === 0) return [];

    return [
      {
        ...createSpaceThread(
          getSpaceThreadTitle(String(legacyParsed[0]?.text || "Space")),
        ),
        messages: legacyParsed
          .filter(
            (message): message is SpaceMessage =>
              message &&
              (message.role === "user" || message.role === "space") &&
              typeof message.text === "string",
          )
          .slice(-80),
      },
    ];
  } catch {
    return [];
  }
}

function writeSpaceThreadsToStorage(threads: SpaceThread[]) {
  try {
    localStorage.setItem(
      SPACE_THREADS_STORAGE_KEY,
      JSON.stringify(threads.slice(0, 40)),
    );
  } catch {
    // Space history stays local and never touches the server.
  }
}

type SpaceCopy = {
  title: string;
  subtitle: string;
  placeholder: string;
  emptyHint: string;
  backLabel: string;
  userPrefix: string;
  botAnswer: string;
  examples: string[];
  deleteConfirm?: string;
};

const SPACE_COPY: Record<Locale, SpaceCopy> = {
  ru: {
    title: "margeleT Space",
    subtitle: "Глобальный поиск по живому Telegram",
    placeholder: "Найти, что говорят сейчас...",
    emptyHint:
      "Пиши как человеку: страна, тема, источник или событие. Space будет искать смысл в потоке Telegram.",
    backLabel: "Закрыть Space",
    userPrefix: "Ты",
    botAnswer:
      "Space просыпается. Скоро я буду собирать ответ по постам, странам и каналам margeleT.",
    examples: [
      "Что обсуждают в Индии?",
      "Что пишут про AI в Германии?",
      "Что сейчас в Telegram России?",
    ],
  },
  us: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Find what people are saying now...",
    emptyHint:
      "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer:
      "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: [
      "What is being discussed in India?",
      "What is written about AI in Germany?",
      "What is happening in Telegram now?",
    ],
  },
  ua: {
    title: "margeleT Space",
    subtitle: "Глобальний пошук у живому Telegram",
    placeholder: "Знайти, що говорять зараз...",
    emptyHint:
      "Пиши як людині: країна, тема, джерело або подія. Space шукатиме сенс у потоці Telegram.",
    backLabel: "Закрити Space",
    userPrefix: "Ти",
    botAnswer:
      "Space прокидається. Скоро я збиратиму відповіді з постів, країн і каналів margeleT.",
    examples: [
      "Що обговорюють в Індії?",
      "Що пишуть про AI у Німеччині?",
      "Що зараз у Telegram?",
    ],
  },
  in: {
    title: "margeleT Space",
    subtitle: "लाइव Telegram में वैश्विक खोज",
    placeholder: "अभी लोग क्या कह रहे हैं, खोजें...",
    emptyHint:
      "साधारण भाषा में लिखो: देश, विषय, स्रोत या घटना। Space Telegram प्रवाह में अर्थ खोजेगा।",
    backLabel: "Space बंद करें",
    userPrefix: "आप",
    botAnswer:
      "Space जाग रहा है। जल्द ही मैं margeleT पोस्ट, देशों और चैनलों से उत्तर बनाऊँगा।",
    examples: [
      "भारत में क्या चर्चा हो रही है?",
      "जर्मनी में AI के बारे में क्या लिखा जा रहा है?",
      "Telegram में अभी क्या हो रहा है?",
    ],
  },
  ir: {
    title: "margeleT Space",
    subtitle: "جستجوی جهانی در Telegram زنده",
    placeholder: "پیدا کن الان چه می‌گویند...",
    emptyHint:
      "طبیعی بنویس: کشور، موضوع، منبع یا رویداد. Space معنا را در جریان Telegram پیدا می‌کند.",
    backLabel: "بستن Space",
    userPrefix: "تو",
    botAnswer:
      "Space در حال بیدار شدن است. به‌زودی از پست‌ها، کشورها و کانال‌های margeleT پاسخ می‌سازم.",
    examples: [
      "در هند درباره چه چیزی حرف می‌زنند؟",
      "در آلمان درباره AI چه می‌نویسند؟",
      "الان در Telegram چه خبر است؟",
    ],
  },
  tr: {
    title: "margeleT Space",
    subtitle: "Canlı Telegram içinde küresel arama",
    placeholder: "Şu anda ne konuşuluyor, bul...",
    emptyHint:
      "Doğal yaz: ülke, konu, kaynak veya olay. Space Telegram akışındaki anlamı arayacak.",
    backLabel: "Space'i kapat",
    userPrefix: "Sen",
    botAnswer:
      "Space uyanıyor. Yakında margeleT gönderileri, ülkeleri ve kanallarından cevaplar kuracağım.",
    examples: [
      "Hindistan'da ne konuşuluyor?",
      "Almanya'da AI hakkında ne yazıyorlar?",
      "Telegram'da şu anda ne oluyor?",
    ],
  },
  br: {
    title: "margeleT Space",
    subtitle: "Busca global no Telegram ao vivo",
    placeholder: "Encontrar o que estão dizendo agora...",
    emptyHint:
      "Escreva naturalmente: país, tema, fonte ou evento. O Space vai buscar sentido no fluxo do Telegram.",
    backLabel: "Fechar Space",
    userPrefix: "Você",
    botAnswer:
      "O Space está acordando. Em breve vou montar respostas com posts, países e canais do margeleT.",
    examples: [
      "O que estão discutindo na Índia?",
      "O que escrevem sobre AI na Alemanha?",
      "O que está acontecendo no Telegram agora?",
    ],
  },
  kz: {
    title: "margeleT Space",
    subtitle: "Тірі Telegram ішіндегі ғаламдық іздеу",
    placeholder: "Қазір не айтып жатқанын табу...",
    emptyHint:
      "Адамша жаз: ел, тақырып, дереккөз немесе оқиға. Space Telegram ағымынан мағына іздейді.",
    backLabel: "Space жабу",
    userPrefix: "Сен",
    botAnswer:
      "Space оянып жатыр. Жақында margeleT посттары, елдері және арналары бойынша жауап құрастырамын.",
    examples: [
      "Үндістанда не талқыланып жатыр?",
      "Германияда AI туралы не жазып жатыр?",
      "Қазір Telegram-да не бар?",
    ],
  },
  uz: {
    title: "margeleT Space",
    subtitle: "Jonli Telegram bo‘yicha global qidiruv",
    placeholder: "Hozir nima deyishayotganini topish...",
    emptyHint:
      "Oddiy yozing: mamlakat, mavzu, manba yoki voqea. Space Telegram oqimidan ma’no izlaydi.",
    backLabel: "Space ni yopish",
    userPrefix: "Siz",
    botAnswer:
      "Space uyg‘onmoqda. Tez orada margeleT postlari, mamlakatlari va kanallaridan javoblar tuzaman.",
    examples: [
      "Hindistonda nima muhokama qilinyapti?",
      "Germaniyada AI haqida nima yozishyapti?",
      "Telegramda hozir nima bo‘lyapti?",
    ],
  },
  ae: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "ابحث عمّا يقولونه الآن...",
    emptyHint:
      "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer:
      "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: [
      "ماذا يناقشون في الهند؟",
      "ماذا يكتبون عن AI في ألمانيا؟",
      "ماذا يحدث في Telegram الآن؟",
    ],
  },
  eg: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "ابحث عمّا يقولونه الآن...",
    emptyHint:
      "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer:
      "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: [
      "ماذا يناقشون في الهند؟",
      "ماذا يكتبون عن AI في ألمانيا؟",
      "ماذا يحدث في Telegram الآن؟",
    ],
  },
  pk: {
    title: "margeleT Space",
    subtitle: "لائیو Telegram میں عالمی تلاش",
    placeholder: "ابھی لوگ کیا کہہ رہے ہیں، تلاش کریں...",
    emptyHint:
      "قدرتی انداز میں لکھیں: ملک، موضوع، ذریعہ یا واقعہ۔ Space Telegram کے بہاؤ میں معنی تلاش کرے گا۔",
    backLabel: "Space بند کریں",
    userPrefix: "آپ",
    botAnswer:
      "Space جاگ رہا ہے۔ جلد ہی میں margeleT پوسٹس، ممالک اور چینلز سے جواب بناؤں گا۔",
    examples: [
      "بھارت میں کیا بحث ہو رہی ہے؟",
      "جرمنی میں AI کے بارے میں کیا لکھا جا رہا ہے؟",
      "Telegram میں ابھی کیا ہو رہا ہے؟",
    ],
  },
  id: {
    title: "margeleT Space",
    subtitle: "Pencarian global di Telegram langsung",
    placeholder: "Cari apa yang sedang dibicarakan sekarang...",
    emptyHint:
      "Tulis natural: negara, topik, sumber, atau peristiwa. Space akan mencari makna di aliran Telegram.",
    backLabel: "Tutup Space",
    userPrefix: "Kamu",
    botAnswer:
      "Space sedang bangun. Segera aku akan membuat jawaban dari postingan, negara, dan channel margeleT.",
    examples: [
      "Apa yang dibahas di India?",
      "Apa yang ditulis tentang AI di Jerman?",
      "Apa yang terjadi di Telegram sekarang?",
    ],
  },
  mx: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Encontrar lo que dicen ahora...",
    emptyHint:
      "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer:
      "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: [
      "¿Qué se discute en India?",
      "¿Qué escriben sobre AI en Alemania?",
      "¿Qué pasa ahora en Telegram?",
    ],
  },
  sa: {
    title: "margeleT Space",
    subtitle: "بحث عالمي داخل Telegram الحي",
    placeholder: "ابحث عمّا يقولونه الآن...",
    emptyHint:
      "اكتب بشكل طبيعي: دولة أو موضوع أو مصدر أو حدث. سيبحث Space عن المعنى داخل تدفق Telegram.",
    backLabel: "إغلاق Space",
    userPrefix: "أنت",
    botAnswer:
      "Space يستيقظ الآن. قريباً سأبني إجابات من منشورات ودول وقنوات margeleT.",
    examples: [
      "ماذا يناقشون في الهند؟",
      "ماذا يكتبون عن AI في ألمانيا؟",
      "ماذا يحدث في Telegram الآن؟",
    ],
  },
  es: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Encontrar lo que dicen ahora...",
    emptyHint:
      "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer:
      "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: [
      "¿Qué se discute en India?",
      "¿Qué escriben sobre AI en Alemania?",
      "¿Qué pasa ahora en Telegram?",
    ],
  },
  it: {
    title: "margeleT Space",
    subtitle: "Ricerca globale nel Telegram vivo",
    placeholder: "Trova cosa stanno dicendo ora...",
    emptyHint:
      "Scrivi in modo naturale: paese, tema, fonte o evento. Space cercherà il senso nel flusso Telegram.",
    backLabel: "Chiudi Space",
    userPrefix: "Tu",
    botAnswer:
      "Space si sta svegliando. Presto costruirò risposte dai post, paesi e canali margeleT.",
    examples: [
      "Di cosa si parla in India?",
      "Cosa scrivono sull'AI in Germania?",
      "Cosa succede ora su Telegram?",
    ],
  },
  fr: {
    title: "margeleT Space",
    subtitle: "Recherche globale dans le Telegram vivant",
    placeholder: "Trouver ce qu’ils disent maintenant...",
    emptyHint:
      "Écris naturellement : pays, sujet, source ou événement. Space cherchera le sens dans le flux Telegram.",
    backLabel: "Fermer Space",
    userPrefix: "Toi",
    botAnswer:
      "Space se réveille. Bientôt je construirai des réponses depuis les posts, pays et chaînes margeleT.",
    examples: [
      "Que discute-t-on en Inde ?",
      "Que dit-on sur l'AI en Allemagne ?",
      "Que se passe-t-il sur Telegram maintenant ?",
    ],
  },
  de: {
    title: "margeleT Space",
    subtitle: "Globale Suche im lebenden Telegram",
    placeholder: "Finden, was gerade gesagt wird...",
    emptyHint:
      "Schreib natürlich: Land, Thema, Quelle oder Ereignis. Space sucht Bedeutung im Telegram-Strom.",
    backLabel: "Space schließen",
    userPrefix: "Du",
    botAnswer:
      "Space wacht auf. Bald baue ich Antworten aus margeleT-Posts, Ländern und Kanälen.",
    examples: [
      "Was wird in Indien diskutiert?",
      "Was schreibt man über AI in Deutschland?",
      "Was passiert gerade in Telegram?",
    ],
  },
  ar: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Encontrar lo que dicen ahora...",
    emptyHint:
      "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer:
      "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: [
      "¿Qué se discute en India?",
      "¿Qué escriben sobre AI en Alemania?",
      "¿Qué pasa ahora en Telegram?",
    ],
  },
  co: {
    title: "margeleT Space",
    subtitle: "Búsqueda global en Telegram en vivo",
    placeholder: "Encontrar lo que dicen ahora...",
    emptyHint:
      "Escribe natural: país, tema, fuente o evento. Space buscará sentido dentro del flujo de Telegram.",
    backLabel: "Cerrar Space",
    userPrefix: "Tú",
    botAnswer:
      "Space está despertando. Pronto construiré respuestas desde posts, países y canales de margeleT.",
    examples: [
      "¿Qué se discute en India?",
      "¿Qué escriben sobre AI en Alemania?",
      "¿Qué pasa ahora en Telegram?",
    ],
  },
  za: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Find what people are saying now...",
    emptyHint:
      "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer:
      "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: [
      "What is being discussed in India?",
      "What is written about AI in Germany?",
      "What is happening in Telegram now?",
    ],
  },
  ng: {
    title: "margeleT Space",
    subtitle: "Global search across live Telegram",
    placeholder: "Find what people are saying now...",
    emptyHint:
      "Write naturally: a country, topic, source, or event. Space will search for meaning inside Telegram flow.",
    backLabel: "Close Space",
    userPrefix: "You",
    botAnswer:
      "Space is waking up. Soon I will build answers from margeleT posts, countries, and channels.",
    examples: [
      "What is being discussed in India?",
      "What is written about AI in Germany?",
      "What is happening in Telegram now?",
    ],
  },
  cn: {
    title: "margeleT Space",
    subtitle: "实时 Telegram 的全球搜索",
    placeholder: "查找现在大家在说什么...",
    emptyHint:
      "像和人聊天一样输入：国家、主题、来源或事件。Space 会在 Telegram 信息流里寻找意义。",
    backLabel: "关闭 Space",
    userPrefix: "你",
    botAnswer:
      "Space 正在醒来。很快我会根据 margeleT 的帖子、国家和频道生成答案。",
    examples: [
      "印度正在讨论什么？",
      "德国关于 AI 写了什么？",
      "Telegram 现在发生了什么？",
    ],
  },
  my: {
    title: "margeleT Space",
    subtitle: "Carian global dalam Telegram langsung",
    placeholder: "Cari apa yang orang katakan sekarang...",
    emptyHint:
      "Tulis secara semula jadi: negara, topik, sumber atau peristiwa. Space akan mencari makna dalam aliran Telegram.",
    backLabel: "Tutup Space",
    userPrefix: "Anda",
    botAnswer:
      "Space sedang bangun. Tidak lama lagi saya akan bina jawapan daripada post, negara dan saluran margeleT.",
    examples: [
      "Apa yang dibincangkan di India?",
      "Apa yang ditulis tentang AI di Jerman?",
      "Apa yang berlaku di Telegram sekarang?",
    ],
  },
};

export function SpaceOverlay({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const copy = SPACE_COPY[locale] ?? SPACE_COPY.us;
  const [value, setValue] = useState("");
  const [threads, setThreads] = useState<SpaceThread[]>(() =>
    readSpaceThreadsFromStorage(),
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SPACE_ACTIVE_THREAD_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });
  const [chatsMenuOpen, setChatsMenuOpen] = useState(false);
  const [telegramUser, setTelegramUser] = useState<SpaceTelegramUser | null>(
    () => readSpaceTelegramUser(),
  );
  const [theme, setTheme] = useState<SpaceTheme>(() => readSpaceTheme());
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const [keyboardBottom, setKeyboardBottom] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

  const activeThread = useMemo(() => {
    if (!threads.length) return null;
    return (
      threads.find((thread) => thread.id === activeThreadId) ||
      threads[0] ||
      null
    );
  }, [activeThreadId, threads]);

  const messages = activeThread?.messages || [];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!window.visualViewport) return;

    const syncKeyboard = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const bottom = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardBottom(bottom);
    };

    syncKeyboard();
    window.visualViewport.addEventListener("resize", syncKeyboard);
    window.visualViewport.addEventListener("scroll", syncKeyboard);

    return () => {
      window.visualViewport?.removeEventListener("resize", syncKeyboard);
      window.visualViewport?.removeEventListener("scroll", syncKeyboard);
    };
  }, []);

  useEffect(() => {
    writeSpaceThreadsToStorage(threads);
  }, [threads]);

  useEffect(() => {
    const syncTelegramUser = () => setTelegramUser(readSpaceTelegramUser());
    window.addEventListener("storage", syncTelegramUser);
    window.addEventListener("focus", syncTelegramUser);
    return () => {
      window.removeEventListener("storage", syncTelegramUser);
      window.removeEventListener("focus", syncTelegramUser);
    };
  }, []);

  useEffect(() => {
    const syncTheme = () => setTheme(readSpaceTheme());
    syncTheme();

    const root = document.documentElement;
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("storage", syncTheme);
    window.addEventListener("focus", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("focus", syncTheme);
    };
  }, []);

  useEffect(() => {
    try {
      if (activeThread?.id) {
        localStorage.setItem(SPACE_ACTIVE_THREAD_STORAGE_KEY, activeThread.id);
      }
    } catch {
      //
    }
  }, [activeThread?.id]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, activeThread?.id]);

  const createNewChat = () => {
    const next = createSpaceThread(copy.title);
    setThreads((prev) => [next, ...prev].slice(0, 40));
    setActiveThreadId(next.id);
    setValue("");
    setChatsMenuOpen(false);
  };

  const deleteThread = (threadId: string) => {
    const confirmed = window.confirm(
      copy.deleteConfirm ||
        (locale === "ru"
          ? "Удалить этот Space-чат? История хранится только на этом устройстве."
          : "Delete this Space chat? The history is stored only on this device."),
    );

    if (!confirmed) return;

    setThreads((prev) => {
      const next = prev.filter((thread) => thread.id !== threadId);
      if (activeThreadId === threadId) {
        setActiveThreadId(next[0]?.id || null);
      }
      return next;
    });
  };

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setChatsMenuOpen(false);
  };

  const send = (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    setThreads((prev) => {
      const now = Date.now();
      let current = activeThread;

      if (!current) {
        current = createSpaceThread(getSpaceThreadTitle(clean));
      }

      const updatedThread: SpaceThread = {
        ...current,
        title:
          current.messages.length === 0 ||
          current.title === copy.title ||
          current.title === "New Space"
            ? getSpaceThreadTitle(clean)
            : current.title,
        updatedAt: now,
        messages: [
          ...current.messages,
          {
            role: "user" as const,
            text: clean,
          },
          {
            role: "space" as const,
            text: copy.botAnswer,
          },
        ].slice(-80),
      };

      setActiveThreadId(updatedThread.id);

      return [
        updatedThread,
        ...prev.filter((thread) => thread.id !== updatedThread.id),
      ].slice(0, 40);
    });

    setValue("");
    setChatsMenuOpen(false);
    window.setTimeout(() => inputRef.current?.blur(), 0);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    send(value);
  };

  const submitFromButton = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    send(value);
  };

  const isLight = theme === "light";

  const toggleTheme = () => {
    const next: SpaceTheme = isLight ? "dark" : "light";
    applySpaceTheme(next);
    setTheme(next);
  };

  const renderThreadList = (compact = false) => (
    <div className={compact ? "space-y-2" : "space-y-2"}>
      <button
        type="button"
        onClick={createNewChat}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black transition hover:scale-[1.01] active:scale-[.99] ${isLight ? "bg-[#4b8ddd] text-white" : "bg-[#eef3f8] text-[#07111d]"}`}
      >
        <Plus className="h-4 w-4" />
        New Space
      </button>

      <div className="space-y-2">
        {threads.length === 0 ? (
          <div
            className={`rounded-[22px] px-4 py-3 text-xs font-semibold leading-5 ${isLight ? "bg-[#eef4fb] text-[#5e7085]" : "bg-white/7 text-white/42"}`}
          >
            Space history will stay only on this device.
          </div>
        ) : null}

        {threads.map((thread) => {
          const active = activeThread?.id === thread.id;

          return (
            <div
              key={thread.id}
              className={[
                "group flex items-center gap-2 rounded-[22px] px-4 py-3 transition",
                active
                  ? isLight
                    ? "bg-[#e5edf6]"
                    : "bg-white/13"
                  : isLight
                    ? "bg-[#eef4fb] hover:bg-[#e5edf6]"
                    : "bg-white/6 hover:bg-white/10",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => openThread(thread.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div
                  className={`truncate text-sm font-semibold ${isLight ? "text-[#172537]" : "text-[#eef3f8]/86"}`}
                >
                  {thread.title}
                </div>
              </button>

              <button
                type="button"
                onClick={() => deleteThread(thread.id)}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 ${isLight ? "text-[#5e7085] hover:bg-[#dbe6f1] hover:text-[#172537]" : "text-white/42 hover:bg-white/10 hover:text-white"}`}
                aria-label="Delete Space chat"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] overflow-hidden ${isLight ? "bg-[#eef4fb] text-[#08111d]" : "bg-[#02060d] text-white"}`}
    >
      <style>{`
        .margelet-space-bg {
          background:
            radial-gradient(ellipse at 50% -18%, rgba(18, 64, 112, .26), transparent 48%),
            radial-gradient(ellipse at 24% 30%, rgba(8, 43, 79, .16), transparent 38%),
            radial-gradient(ellipse at 76% 84%, rgba(3, 38, 55, .18), transparent 42%),
            linear-gradient(180deg, #041225 0%, #020711 55%, #01050c 100%);
        }

        .margelet-space-bg-light {
          background:
            radial-gradient(ellipse at 50% -18%, rgba(89, 160, 255, .32), transparent 48%),
            radial-gradient(ellipse at 26% 28%, rgba(76, 139, 213, .16), transparent 38%),
            radial-gradient(ellipse at 78% 82%, rgba(107, 179, 255, .18), transparent 42%),
            linear-gradient(180deg, #f5f9ff 0%, #edf4fb 56%, #e8f0f8 100%);
        }

        .margelet-space-stars::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-repeat: no-repeat;
          background-image:
            radial-gradient(circle at 7% 12%, rgba(255,255,255,.44) 0 1px, transparent 1.9px),
            radial-gradient(circle at 16% 88%, rgba(118,184,255,.27) 0 1px, transparent 1.8px),
            radial-gradient(circle at 34% 29%, rgba(255,255,255,.32) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 57% 67%, rgba(139,207,255,.25) 0 1px, transparent 1.8px),
            radial-gradient(circle at 84% 18%, rgba(255,255,255,.38) 0 .9px, transparent 1.8px),
            radial-gradient(circle at 12% 73%, rgba(255,255,255,.20) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 72% 42%, rgba(99,169,232,.20) 0 1px, transparent 1.8px),
            radial-gradient(circle at 48% 92%, rgba(255,255,255,.20) 0 .8px, transparent 1.6px),
            radial-gradient(circle at 93% 84%, rgba(117,194,255,.18) 0 .8px, transparent 1.6px);
          opacity: .46;
        }

        .margelet-space-stars::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 20% 16%, rgba(37, 112, 181, .10), transparent 34%),
            radial-gradient(ellipse at 82% 78%, rgba(11, 77, 99, .13), transparent 40%);
          opacity: .85;
        }

        @keyframes margeletSpaceMessageIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes margeletSpaceTitleFlow {
          0% { background-position: 12% 38%; filter: brightness(1); }
          18% { background-position: 82% 22%; filter: brightness(1.06); }
          36% { background-position: 58% 86%; filter: brightness(1.02); }
          54% { background-position: 18% 72%; filter: brightness(1.08); }
          72% { background-position: 92% 58%; filter: brightness(1.03); }
          100% { background-position: 12% 38%; filter: brightness(1); }
        }

        .margelet-space-title-gradient {
          background-size: 340% 340%;
          animation: margeletSpaceTitleFlow 14s cubic-bezier(.55,.05,.25,.95) infinite;
        }

        .margelet-space-title-dark {
          background-image: linear-gradient(92deg, #f8fbff 0%, #9cc9ff 35%, #ffffff 62%, #6e9dff 100%);
        }

        .margelet-space-title-light {
          background-image: linear-gradient(92deg, #07111d 0%, #356fb4 34%, #07111d 62%, #5aa9ff 100%);
        }

        .margelet-space-message {
          animation: margeletSpaceMessageIn .22s ease-out both;
        }
      `}</style>

      <div
        className={`${isLight ? "margelet-space-bg-light" : "margelet-space-bg"} margelet-space-stars absolute inset-0`}
      />

      <header
        className={`absolute left-0 right-0 top-0 z-30 border-b backdrop-blur-2xl ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/88" : "border-white/8 bg-[#132233]/72"}`}
      >
        <div className="mx-auto grid h-16 w-full max-w-[720px] grid-cols-[56px_1fr_96px] items-center px-2 sm:px-4">
          <button
            type="button"
            onClick={onClose}
            className={`grid h-11 w-11 place-items-center rounded-full transition ${isLight ? "text-[#172537] hover:bg-[#e6eef7]" : "text-[#eef3f8]/86 hover:bg-white/10"}`}
            aria-label={copy.backLabel}
            title={copy.backLabel}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-center text-[23px] font-black leading-none tracking-tight">
            <span className={isLight ? "text-[#07111d]" : "text-white"}>
              margeleT
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`grid h-10 w-10 place-items-center rounded-full transition ${isLight ? "text-[#5e7085] hover:bg-[#e6eef7]" : "text-[#b8cbe0] hover:bg-white/10"}`}
              aria-label="Toggle theme"
              title="Toggle theme"
            >
              {isLight ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("margelet:open-creator"));
                onClose();
              }}
              className={`grid h-11 w-11 place-items-center rounded-full transition ${isLight ? "text-[#5e7085] hover:bg-[#e6eef7]" : "text-[#eef3f8]/82 hover:bg-white/10"}`}
              aria-label="Profile"
              title="Open profile"
            >
              {telegramUser?.photo_url ? (
                <img
                  src={telegramUser.photo_url}
                  alt={
                    telegramUser.first_name ||
                    telegramUser.username ||
                    "Profile"
                  }
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setTelegramUser((prev) =>
                      prev ? { ...prev, photo_url: "" } : prev,
                    )
                  }
                />
              ) : (
                <User className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-[720px] flex-col px-4 pt-20 sm:px-6"
        onPointerDown={() => {
          if (chatsMenuOpen) setChatsMenuOpen(false);
        }}
      >
        <div
          ref={messagesRef}
          className="min-h-0 flex-1 overflow-y-auto pb-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {messages.length === 0 ? (
            <div
              className={`flex min-h-full flex-col items-center justify-center text-center transition duration-300 ${
                inputFocused || keyboardBottom > 40
                  ? "-translate-y-16 scale-[.94] sm:translate-y-0 sm:scale-100"
                  : "translate-y-0 scale-100"
              }`}
              style={{
                paddingBottom:
                  keyboardBottom > 40
                    ? `calc(7.5rem + ${Math.min(keyboardBottom, 120)}px)`
                    : "13rem",
              }}
            >
              <div
                className={`margelet-space-title-gradient bg-clip-text text-[64px] font-black leading-none tracking-tight text-transparent sm:text-[92px] ${
                  isLight ? "margelet-space-title-light" : "margelet-space-title-dark"
                }`}
              >
                Space
              </div>
              <div
                className={`mt-4 max-w-[620px] text-lg font-semibold sm:text-2xl ${isLight ? "text-[#243245]/80" : "text-white/78"}`}
              >
                {copy.subtitle}
              </div>
              <div
                className={`mt-5 max-w-[560px] text-sm leading-6 sm:text-base sm:leading-7 ${isLight ? "text-[#52657a]" : "text-white/52"}`}
              >
                {copy.emptyHint}
              </div>
            </div>
          ) : (
            <div className="space-y-3 pb-28">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`margelet-space-message flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-2.5 text-sm leading-5 backdrop-blur-xl ${
                      message.role === "user"
                        ? isLight
                          ? "rounded-[24px] rounded-tr-[7px] bg-[#c8e9ff] text-[#07111d]"
                          : "rounded-[24px] rounded-tr-[7px] bg-[#e8eef5] text-[#07111d] shadow-2xl"
                        : isLight
                          ? "rounded-[24px] rounded-tl-[7px] bg-[#4b8ed8] text-white"
                          : "rounded-[24px] rounded-tl-[7px] bg-[#203146]/92 text-[#eef3f8]/86 shadow-2xl"
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          onPointerDown={(event) => event.stopPropagation()}
          className="fixed inset-x-0 z-20 mx-auto w-full max-w-[720px] px-4 sm:px-6 transition-[top,bottom,transform] duration-300 ease-out"
          style={
            messages.length === 0 && keyboardBottom <= 40
              ? {
                  top: "min(calc(50% + 100px), calc(100dvh - 92px))",
                  bottom: "auto",
                  transform: "translateY(-50%)",
                }
              : {
                  top: "auto",
                  bottom: `calc(${keyboardBottom}px + max(14px, env(safe-area-inset-bottom)))`,
                  transform: "translateY(0)",
                }
          }
        >
          {chatsMenuOpen ? (
            <div
              className={`absolute bottom-[calc(100%+12px)] left-4 right-4 z-30 max-h-[52dvh] overflow-y-auto rounded-[30px] border p-3 backdrop-blur-2xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/96" : "border-white/10 bg-[#071321]/94 shadow-[0_22px_90px_rgba(0,0,0,.58)]"}`}
            >
              {renderThreadList(true)}
            </div>
          ) : null}

          <div
            className={`flex min-h-[54px] items-center gap-2 rounded-full border p-1.5 backdrop-blur-2xl ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/94" : "border-white/12 bg-white/10 shadow-[0_18px_70px_rgba(0,0,0,.35)]"}`}
          >
            <button
              type="button"
              onClick={() => setChatsMenuOpen((prev) => !prev)}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${isLight ? "text-[#5e7085] hover:bg-[#e6eef7]" : "text-[#eef3f8]/76 hover:bg-white/8 hover:text-[#eef3f8]"}`}
              aria-label="Space chats"
              title="Space chats"
            >
              <Menu className="h-5 w-5" />
            </button>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={copy.placeholder}
              className={`min-w-0 flex-1 bg-transparent pl-1 pr-2 text-[15px] font-semibold outline-none ${isLight ? "text-[#07111d] placeholder:text-[#5e7085]/62" : "text-white placeholder:text-white/40"}`}
              enterKeyHint="send"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <button
              type="button"
              onPointerDown={submitFromButton}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition hover:scale-[1.04] active:scale-[.98] disabled:opacity-45 ${isLight ? "text-[#5e7085]" : "text-[#eef3f8]"}`}
              disabled={!value.trim()}
              aria-label="Send"
            >
              <MargeletMark
                className="h-5 w-5"
                colorClassName={isLight ? "text-[#5e7085]" : "text-[#eef3f8]"}
              />
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
