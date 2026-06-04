import { ChevronDown, Flame, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getTheme, type Theme } from "../../lib/theme";
import type { Locale } from "../../types/app";
import {
  clearGTranslate,
  getAutotranslit,
  requestGTranslate,
  setAutotranslit,
} from "../../lib/autotranslit";

export type FeedMediaMode = "all" | "text" | "photo" | "video" | "trends";

export type FeedScreenCopy = {
  subscriptionsHint: string;
  emptyTitle: string;
  emptyText: string;
  clearAll: string;
  modeAll: string;
  modeTrends: string;
  modeVideo: string;
  countriesTitle: string;
};


const AUTOTRANSLIT_LABEL: Record<Locale, string> = {
  ru: "Автоперевод Telegram-каналов",
  ua: "Автопереклад Telegram-каналів",
  us: "Autotranslate Telegram channels",
  in: "Telegram चैनलों का ऑटो-अनुवाद",
  ir: "ترجمه خودکار کانال‌های Telegram",
  tr: "Telegram kanallarını otomatik çevir",
  br: "Traduzir canais do Telegram automaticamente",
  kz: "Telegram арналарын автоаудару",
  uz: "Telegram kanallarini avtomatik tarjima qilish",
  ae: "ترجمة قنوات Telegram تلقائياً",
  eg: "ترجمة قنوات Telegram تلقائياً",
  pk: "Telegram چینلز کا خودکار ترجمہ",
  id: "Terjemahkan channel Telegram otomatis",
  mx: "Traducir canales de Telegram automáticamente",
  sa: "ترجمة قنوات Telegram تلقائياً",
  es: "Traducir canales de Telegram automáticamente",
  it: "Traduci automaticamente i canali Telegram",
  fr: "Traduire automatiquement les chaînes Telegram",
  de: "Telegram-Kanäle automatisch übersetzen",
  ar: "Traducir canales de Telegram automáticamente",
  co: "Traducir canales de Telegram automáticamente",
  za: "Autotranslate Telegram channels",
  ng: "Autotranslate Telegram channels",
  cn: "自动翻译 Telegram 频道",
  my: "Terjemah automatik saluran Telegram",
};

export const FEED_SCREEN_COPY: Record<Locale, FeedScreenCopy> = {
  us: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Show channels from other countries:",
  },
  ru: {
    subscriptionsHint:
      "Тут будут новые посты каналов, в которых включено уведомление",
    emptyTitle: "Ничего не найдено",
    emptyText: "Попробуй снять часть тегов или очистить поиск.",
    clearAll: "Очистить всё",
    modeAll: "Все",
    modeTrends: "Trends",
    modeVideo: "Видео",
    countriesTitle: "Показывать каналы авторов из других стран:",
  },
  ua: {
    subscriptionsHint:
      "Тут будуть нові пости каналів, у яких увімкнено сповіщення",
    emptyTitle: "Нічого не знайдено",
    emptyText: "Спробуй прибрати частину тегів або очистити пошук.",
    clearAll: "Очистити все",
    modeAll: "Усе",
    modeTrends: "Trends",
    modeVideo: "Відео",
    countriesTitle: "Показувати канали авторів з інших країн:",
  },
  in: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Show channels from other countries:",
  },
  ir: {
    subscriptionsHint:
      "پست‌های جدید کانال‌هایی که اعلانشان روشن است اینجا ظاهر می‌شوند",
    emptyTitle: "چیزی پیدا نشد",
    emptyText: "چند برچسب را بردار یا جستجو را پاک کن.",
    clearAll: "پاک کردن همه",
    modeAll: "همه",
    modeTrends: "Trends",
    modeVideo: "ویدیو",
    countriesTitle: "نمایش کانال‌های کشورهای دیگر:",
  },
  de: {
    subscriptionsHint:
      "Hier erscheinen neue Beiträge von Kanälen mit aktivierten Benachrichtigungen",
    emptyTitle: "Nichts gefunden",
    emptyText: "Versuche, einige Tags zu entfernen oder die Suche zu löschen.",
    clearAll: "Alles löschen",
    modeAll: "Alle",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Kanäle aus anderen Ländern anzeigen:",
  },
  es: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText: "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
    modeAll: "Todo",
    modeTrends: "Trends",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canales de autores de otros países:",
  },
  tr: {
    subscriptionsHint:
      "Bildirimleri açık olan kanalların yeni gönderileri burada görünecek",
    emptyTitle: "Hiçbir şey bulunamadı",
    emptyText: "Bazı etiketleri kaldırmayı veya aramayı temizlemeyi dene.",
    clearAll: "Hepsini temizle",
    modeAll: "Tümü",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Diğer ülkelerdeki kanalları göster:",
  },
  fr: {
    subscriptionsHint:
      "De nouvelles publications des chaînes avec notifications activées apparaîtront ici",
    emptyTitle: "Rien trouvé",
    emptyText: "Essaie de retirer certains tags ou d’effacer la recherche.",
    clearAll: "Tout effacer",
    modeAll: "Tout",
    modeTrends: "Trends",
    modeVideo: "Vidéo",
    countriesTitle: "Afficher les chaînes d’autres pays :",
  },
  it: {
    subscriptionsHint:
      "Qui appariranno nuovi post dai canali con notifiche attivate",
    emptyTitle: "Nessun risultato",
    emptyText: "Prova a rimuovere alcuni tag o a cancellare la ricerca.",
    clearAll: "Cancella tutto",
    modeAll: "Tutto",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Mostra canali di altri paesi:",
  },
  br: {
    subscriptionsHint:
      "Novos posts dos canais com notificações ativadas aparecerão aqui",
    emptyTitle: "Nada encontrado",
    emptyText: "Tente remover algumas tags ou limpar a busca.",
    clearAll: "Limpar tudo",
    modeAll: "Tudo",
    modeTrends: "Trends",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canais de outros países:",
  },
  kz: {
    subscriptionsHint:
      "Хабарландыру қосылған арналардың жаңа посттары осында шығады",
    emptyTitle: "Ештеңе табылмады",
    emptyText: "Бірнеше тегті алып таста немесе іздеуді тазала.",
    clearAll: "Барлығын тазалау",
    modeAll: "Барлығы",
    modeTrends: "Trends",
    modeVideo: "Видео",
    countriesTitle: "Басқа елдердің арналарын көрсету:",
  },
  uz: {
    subscriptionsHint:
      "Bildirishnomalari yoqilgan kanallarning yangi postlari shu yerda chiqadi",
    emptyTitle: "Hech narsa topilmadi",
    emptyText: "Ba’zi teglarni olib tashlang yoki qidiruvni tozalang.",
    clearAll: "Hammasini tozalash",
    modeAll: "Hammasi",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Boshqa mamlakatlardagi kanallarni ko‘rsatish:",
  },
  ae: {
    subscriptionsHint:
      "ستظهر هنا منشورات جديدة من القنوات التي تم تفعيل إشعاراتها",
    emptyTitle: "لم يتم العثور على شيء",
    emptyText: "جرّب إزالة بعض الوسوم أو مسح البحث.",
    clearAll: "مسح الكل",
    modeAll: "الكل",
    modeTrends: "Trends",
    modeVideo: "فيديو",
    countriesTitle: "إظهار قنوات من دول أخرى:",
  },
  eg: {
    subscriptionsHint:
      "ستظهر هنا منشورات جديدة من القنوات التي تم تفعيل إشعاراتها",
    emptyTitle: "لم يتم العثور على شيء",
    emptyText: "جرّب إزالة بعض الوسوم أو مسح البحث.",
    clearAll: "مسح الكل",
    modeAll: "الكل",
    modeTrends: "Trends",
    modeVideo: "فيديو",
    countriesTitle: "إظهار قنوات من دول أخرى:",
  },
  pk: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Show channels from other countries:",
  },
  id: {
    subscriptionsHint:
      "Postingan baru dari channel dengan notifikasi aktif akan muncul di sini",
    emptyTitle: "Tidak ada yang ditemukan",
    emptyText: "Coba hapus beberapa tag atau bersihkan pencarian.",
    clearAll: "Bersihkan semua",
    modeAll: "Semua",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Tampilkan channel dari negara lain:",
  },
  mx: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText: "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
    modeAll: "Todo",
    modeTrends: "Trends",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canales de autores de otros países:",
  },
  sa: {
    subscriptionsHint:
      "ستظهر هنا منشورات جديدة من القنوات التي تم تفعيل إشعاراتها",
    emptyTitle: "لم يتم العثور على شيء",
    emptyText: "جرّب إزالة بعض الوسوم أو مسح البحث.",
    clearAll: "مسح الكل",
    modeAll: "الكل",
    modeTrends: "Trends",
    modeVideo: "فيديو",
    countriesTitle: "إظهار قنوات من دول أخرى:",
  },
  ar: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText: "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
    modeAll: "Todo",
    modeTrends: "Trends",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canales de autores de otros países:",
  },
  co: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText: "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
    modeAll: "Todo",
    modeTrends: "Trends",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canales de autores de otros países:",
  },
  za: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Show channels from other countries:",
  },
  ng: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Show channels from other countries:",
  },
  cn: {
    subscriptionsHint: "已开启通知的频道新帖子会出现在这里",
    emptyTitle: "未找到内容",
    emptyText: "试着移除一些标签或清空搜索。",
    clearAll: "清除全部",
    modeAll: "全部",
    modeTrends: "Trends",
    modeVideo: "视频",
    countriesTitle: "显示来自其他国家的频道：",
  },
  my: {
    subscriptionsHint:
      "Post baharu daripada saluran dengan notifikasi aktif akan muncul di sini",
    emptyTitle: "Tiada apa ditemui",
    emptyText: "Cuba buang beberapa tag atau kosongkan carian.",
    clearAll: "Kosongkan semua",
    modeAll: "Semua",
    modeTrends: "Trends",
    modeVideo: "Video",
    countriesTitle: "Tunjukkan saluran dari negara lain:",
  },
};

function getMyCountryLabel(locale: Locale) {
  const labels: Record<Locale, string> = {
    ru: "мой",
    ua: "мій",
    us: "mine",
    in: "मेरा",
    ir: "من",
    tr: "benim",
    br: "meu",
    kz: "менің",
    uz: "meniki",
    ae: "لي",
    eg: "لي",
    pk: "میرا",
    id: "milikku",
    mx: "mío",
    sa: "لي",
    es: "mío",
    it: "mio",
    fr: "mien",
    de: "mein",
    ar: "mío",
    co: "mío",
    za: "mine",
    ng: "mine",
    cn: "我的",
    my: "milik saya",
  };
  return labels[locale] ?? labels.us;
}

function getMaxCountriesHint(locale: Locale) {
  const labels: Record<Locale, string> = {
    ru: "🌐 В ленту можно добавить до 5 стран",
    ua: "🌐 У стрічку можна додати до 5 країн",
    us: "🌐 You can add up to 5 countries to the feed",
    in: "🌐 फ़ीड में 5 देशों तक जोड़े जा सकते हैं",
    ir: "🌐 می‌توانید تا ۵ کشور به فید اضافه کنید",
    tr: "🌐 Akışa en fazla 5 ülke ekleyebilirsin",
    br: "🌐 Você pode adicionar até 5 países ao feed",
    kz: "🌐 Лентаға 5 елге дейін қосуға болады",
    uz: "🌐 Lentaga 5 tagacha mamlakat qo‘shish mumkin",
    ae: "🌐 يمكنك إضافة ما يصل إلى 5 دول إلى الخلاصة",
    eg: "🌐 يمكنك إضافة ما يصل إلى 5 دول إلى الخلاصة",
    pk: "🌐 فیڈ میں 5 ممالک تک شامل کیے جا سکتے ہیں",
    id: "🌐 Kamu bisa menambahkan hingga 5 negara ke feed",
    mx: "🌐 Puedes añadir hasta 5 países al feed",
    sa: "🌐 يمكنك إضافة ما يصل إلى 5 دول إلى الخلاصة",
    es: "🌐 Puedes añadir hasta 5 países al feed",
    it: "🌐 Puoi aggiungere fino a 5 paesi al feed",
    fr: "🌐 Tu peux ajouter jusqu’à 5 pays au flux",
    de: "🌐 Du kannst bis zu 5 Länder zum Feed hinzufügen",
    ar: "🌐 Puedes añadir hasta 5 países al feed",
    co: "🌐 Puedes añadir hasta 5 países al feed",
    za: "🌐 You can add up to 5 countries to the feed",
    ng: "🌐 You can add up to 5 countries to the feed",
    cn: "🌐 最多可向信息流添加 5 个国家",
    my: "🌐 Anda boleh menambah sehingga 5 negara ke suapan",
  };
  return labels[locale] ?? labels.us;
}

const LOCALE_SHORT: Record<Locale, string> = {
  ru: "RU",
  ua: "UA",
  us: "US",
  in: "IN",
  ir: "IR",
  tr: "TR",
  br: "BR",
  kz: "KZ",
  uz: "UZ",
  ae: "AE",
  eg: "EG",
  pk: "PK",
  id: "ID",
  mx: "MX",
  sa: "SA",
  es: "ES",
  it: "IT",
  fr: "FR",
  de: "DE",
  ar: "AR",
  co: "CO",
  za: "ZA",
  ng: "NG",
  cn: "CN",
  my: "MY",
};

const COUNTRY_LABELS: Record<string, { label: string; flag: string }> = {
  ru: { label: "Русский", flag: "🇷🇺" },
  ua: { label: "Українська", flag: "🇺🇦" },
  us: { label: "English", flag: "🇺🇸" },
  in: { label: "हिन्दी (Hindi)", flag: "🇮🇳" },
  ir: { label: "فارسی (Persian)", flag: "🇮🇷" },
  tr: { label: "Türkçe", flag: "🇹🇷" },
  br: { label: "Português (Brasil)", flag: "🇧🇷" },
  kz: { label: "Қазақша", flag: "🇰🇿" },
  uz: { label: "Oʻzbek", flag: "🇺🇿" },
  ae: { label: "العربية (UAE)", flag: "🇦🇪" },
  eg: { label: "العربية (Egypt)", flag: "🇪🇬" },
  pk: { label: "اردو (Urdu)", flag: "🇵🇰" },
  id: { label: "Bahasa Indonesia", flag: "🇮🇩" },
  mx: { label: "Español (México)", flag: "🇲🇽" },
  sa: { label: "العربية (Saudi Arabia)", flag: "🇸🇦" },
  es: { label: "Español", flag: "🇪🇸" },
  it: { label: "Italiano", flag: "🇮🇹" },
  fr: { label: "Français", flag: "🇫🇷" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  ar: { label: "Español (Argentina)", flag: "🇦🇷" },
  co: { label: "Español (Colombia)", flag: "🇨🇴" },
  za: { label: "English (South Africa)", flag: "🇿🇦" },
  ng: { label: "English (Nigeria)", flag: "🇳🇬" },
  cn: { label: "中文 (Chinese)", flag: "🇨🇳" },
  my: { label: "Bahasa Melayu", flag: "🇲🇾" },
};

function useThemeMode(): Theme {
  const [theme, setTheme] = useState<Theme>(() => getTheme());

  useEffect(() => {
    if (typeof document === "undefined") return;

    const syncTheme = () => {
      setTheme(getTheme());
    };

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

  return theme;
}

function getActiveClasses(isDark: boolean) {
  return isDark
    ? "border-white bg-white text-[#162231]"
    : "border-[#111111] bg-[#111111] text-white";
}

function getInactivePillClasses(isDark: boolean) {
  return isDark
    ? "border-[#23405d] bg-[#102033] text-white hover:bg-[#13263c]"
    : "border-soft bg-surface-soft text-secondary hover:bg-surface";
}

function getInactiveCountryClasses(isDark: boolean) {
  return isDark
    ? "border-[#23405d] bg-[#102033] text-white hover:bg-[#13263c]"
    : "border-soft bg-surface-soft text-primary hover:bg-surface";
}

function getDropdownShellClasses(isDark: boolean, open: boolean) {
  const base = isDark
    ? "absolute left-0 right-0 top-full z-[90] overflow-hidden rounded-b-[28px] border-x border-b border-[#22364f] bg-[#132338] text-white shadow-[0_18px_46px_rgba(0,0,0,0.36)] transition-all duration-200"
    : "absolute left-0 right-0 top-full z-[90] overflow-hidden rounded-b-[28px] border-x border-b border-soft bg-surface-soft text-primary shadow-[0_14px_34px_rgba(0,0,0,0.12)] transition-all duration-200";

  return `${base} ${
    open
      ? "max-h-[calc(100dvh-var(--app-header-offset)-86px)] translate-y-0 opacity-100"
      : "pointer-events-none max-h-0 -translate-y-2 border-transparent opacity-0 shadow-none"
  }`;
}

function getSwitchTrackClasses(
  isDark: boolean,
  checked: boolean,
  primary: boolean,
) {
  if (primary && checked) {
    return "border-[#2f6df6] bg-[#2f6df6]";
  }

  if (checked) {
    return isDark ? "border-white bg-white" : "border-[#111111] bg-[#111111]";
  }

  return isDark
    ? "border-[#31455e] bg-[#1b2a3b]"
    : "border-soft bg-surface-soft";
}

function getSwitchThumbClasses(
  isDark: boolean,
  checked: boolean,
  primary: boolean,
) {
  if (checked) {
    if (primary) return "left-[20px] bg-white";
    return isDark ? "left-[20px] bg-[#162231]" : "left-[20px] bg-white";
  }

  return isDark ? "left-[2px] bg-[#6f89a8]" : "left-[2px] bg-[#9aa4b2]";
}

function normalizeCountryList(value: string[]) {
  const result: string[] = [];

  for (const item of value) {
    const code = String(item || "")
      .trim()
      .toLowerCase();
    if (code && !result.includes(code)) result.push(code);
  }

  return result;
}

function getCountryShort(code: string) {
  const lower = code.toLowerCase();
  const matchedLocale = lower as Locale;
  return LOCALE_SHORT[matchedLocale] ?? lower.toUpperCase();
}

function getCountryMeta(code: string) {
  return (
    COUNTRY_LABELS[code] || {
      label: code.toUpperCase(),
      flag: "🌍",
    }
  );
}

export function SmartFeedBar({
  copy,
  mediaMode,
  onChangeMediaMode,
  locale,
  floating = false,
  visible = true,
  availableCountries,
  selectedCountries,
  favoriteCountries,
  onToggleCountry,
  onToggleFavoriteCountry,
}: {
  copy: FeedScreenCopy;
  mediaMode: FeedMediaMode;
  onChangeMediaMode: (next: FeedMediaMode) => void;
  locale: Locale;
  floating?: boolean;
  visible?: boolean;
  availableCountries: string[];
  selectedCountries: string[];
  favoriteCountries: string[];
  onToggleCountry: (country: string) => void;
  onToggleFavoriteCountry: (country: string) => void;
}) {
  const theme = useThemeMode();
  const isDark = theme === "dark";
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [countriesOpen, setCountriesOpen] = useState(false);
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const [autotranslitEnabled, setAutotranslitEnabled] = useState(() =>
    getAutotranslit(),
  );

  useEffect(() => {
    const sync = () => setAutotranslitEnabled(getAutotranslit());

    window.addEventListener("margelet-autotranslit-change", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("margelet-autotranslit-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);


  const toggleAutotranslit = () => {
    const next = !autotranslitEnabled;

    setAutotranslit(next);
    setAutotranslitEnabled(next);

    if (next) {
      window.setTimeout(() => {
        requestGTranslate(locale);
      }, 80);
      return;
    }

    clearGTranslate({ reload: true });
  };  

  useEffect(() => {
    if (!countriesOpen) return;
    if (typeof document === "undefined") return;

    const closeFromOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && shellRef.current?.contains(target)) return;
      setCountriesOpen(false);
      setCountryPickerOpen(false);
    };

    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCountriesOpen(false);
      setCountryPickerOpen(false);
    };

    document.addEventListener("pointerdown", closeFromOutside, true);
    document.addEventListener("keydown", closeFromEscape);

    return () => {
      document.removeEventListener("pointerdown", closeFromOutside, true);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [countriesOpen]);

  const baseCountry = String(locale).toLowerCase();
  const normalizedSelected = useMemo(() => {
    const next = normalizeCountryList(selectedCountries);
    return next.length ? next : [baseCountry];
  }, [baseCountry, selectedCountries]);

  const normalizedFavorites = useMemo(() => {
    const next = normalizeCountryList([baseCountry, ...favoriteCountries]);
    const extras = next
      .filter((country) => country !== baseCountry)
      .slice(0, 4);
    return [baseCountry, ...extras];
  }, [baseCountry, favoriteCountries]);

  const normalizedAvailable = useMemo(() => {
    const knownCountries = Object.keys(COUNTRY_LABELS);
    const fromFeed = normalizeCountryList(availableCountries);
    const ordered = [baseCountry, ...fromFeed, ...knownCountries];
    return normalizeCountryList(ordered);
  }, [availableCountries, baseCountry]);

  const activeCountry = normalizedSelected[0] || baseCountry;

  const favoriteExtras = useMemo(() => {
    return normalizedFavorites
      .filter((country) => country !== baseCountry)
      .slice(0, 4);
  }, [baseCountry, normalizedFavorites]);

  const quickCountries = normalizedFavorites;
  const favoriteOnlyRef = useRef<{ country: string; keep: string } | null>(
    null,
  );

  useEffect(() => {
    if (!countriesOpen) {
      setCountryPickerOpen(false);
    }
  }, [countriesOpen]);

  useEffect(() => {
    if (!visible) {
      setCountriesOpen(false);
      setCountryPickerOpen(false);
    }
  }, [visible]);

  const options: Array<{
    value: FeedMediaMode;
    label: string;
    mobileLabel?: string;
    icon?: React.ReactNode;
  }> = useMemo(
    () => [
      { value: "all", label: copy.modeAll, mobileLabel: "🎈" },
      {
        value: "video",
        label: copy.modeVideo,
        icon: <Play className="h-4 w-4 fill-current" />,
      },
      {
        value: "trends",
        label: copy.modeTrends,
        icon: <Flame className="h-4 w-4 fill-current text-orange-500" />,
      },
    ],
    [copy.modeAll, copy.modeTrends, copy.modeVideo],
  );

  const countryButtonLabel = getCountryShort(activeCountry);

  const activeClasses = getActiveClasses(isDark);
  const inactivePillClasses = getInactivePillClasses(isDark);
  const inactiveCountryClasses = getInactiveCountryClasses(isDark);
  const selectedSet = new Set([activeCountry]);
  const favoriteSet = new Set(normalizedFavorites);

  useEffect(() => {
    const pending = favoriteOnlyRef.current;
    if (!pending) return;

    const currentSelected = normalizeCountryList(selectedCountries);
    if (
      currentSelected.includes(pending.country) &&
      pending.country !== pending.keep
    ) {
      favoriteOnlyRef.current = null;
      onToggleCountry(pending.country);
      return;
    }

    favoriteOnlyRef.current = null;
  }, [onToggleCountry, selectedCountries]);

  const handleCountryClick = (country: string) => {
    const currentSelected = normalizeCountryList(selectedCountries);
    const currentActive = currentSelected[0] || baseCountry;

    if (country === currentActive && currentSelected.length <= 1) return;

    if (!currentSelected.includes(country)) {
      onToggleCountry(country);
    }

    for (const selectedCountry of currentSelected) {
      if (selectedCountry !== country) onToggleCountry(selectedCountry);
    }
  };

  const handleFavoriteCountryClick = (country: string) => {
    favoriteOnlyRef.current = { country, keep: activeCountry };
    onToggleFavoriteCountry(country);
  };

  return (
    <div
      ref={shellRef}
      className={
        `notranslate margelet-ui ${
          floating
          ? `fixed inset-x-0 ${countriesOpen ? "z-[120]" : "z-[70]"} transition-all duration-300 ease-out ${
              visible
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-3 opacity-0"
            }`
          : countriesOpen
            ? "relative z-[130]"
            : "relative z-[20]"
        }`
      }
      translate="no"
      style={floating ? { top: "var(--app-header-offset)" } : undefined}
      aria-hidden={floating ? !visible : undefined}
    >
      <div className="mx-auto w-full max-w-[570px]">
        <div className="relative">
          <div
            className={`border-b transition-colors ${
              isDark
                ? "border-[#22364f] bg-[#08111d] text-white"
                : "border-soft bg-surface text-primary"
            }`}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
                {options.map((option) => {
                  const active = mediaMode === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => onChangeMediaMode(option.value)}
                      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition sm:h-10 ${
                        active ? activeClasses : inactivePillClasses
                      } ${
                        option.value === "all"
                          ? "min-w-[42px] px-3 sm:min-w-[86px] sm:px-3.5"
                          : option.value === "trends"
                          ? "min-w-[85px] px-3 sm:min-w-[105px] sm:px-3.5"
                          : "min-w-[60px] px-3 sm:min-w-[88px] sm:px-3.5"
                      }`}
                      aria-pressed={active}
                      aria-label={option.label}
                    >
                      {option.value === "all" ? (
                        <>
                          <span className="text-[17px] leading-none sm:hidden">🎈</span>
                          <span className="hidden items-center gap-2 sm:inline-flex">
                            <span className="text-[17px] leading-none">🎈</span>
                            <span>{option.label}</span>
                          </span>
                        </>
                      ) : option.value === "trends" ? (
                        // Trends: всегда показываем иконку + текст, даже на мобилке
                        <span className="inline-flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </span>
                      ) : (
                        // Video: на мобилке только иконка, на десктопе иконка + текст
                        <>
                          <span className="sm:hidden">{option.icon}</span>
                          <span className="hidden items-center gap-2 sm:inline-flex">
                            {option.icon}
                            <span>{option.label}</span>
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCountriesOpen((prev) => !prev)}
                  className={`inline-flex h-10 min-w-[74px] items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
                    countriesOpen ? activeClasses : inactiveCountryClasses
                  }`}
                >
                  <span>{countryButtonLabel}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition ${
                      countriesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={getDropdownShellClasses(isDark, countriesOpen)}>
            <div
              className="max-h-[calc(100dvh-var(--app-header-offset)-96px)] overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:px-4"
              style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
            >
              <div
                className={`mb-3 text-sm font-medium ${
                  isDark ? "text-[#95a8bd]" : "text-secondary"
                }`}
              >
                {copy.countriesTitle}
              </div>

              <div className="space-y-2.5">
                {quickCountries.map((country) => {
                  const checked = selectedSet.has(country);
                  const isPrimary = country === baseCountry;
                  const canToggleOff = !checked;
                  const meta = getCountryMeta(country);

                  return (
                    <div
                      key={country}
                      className="flex items-center justify-between gap-3 rounded-2xl px-1 py-1"
                    >
                      <div
                        className={`min-w-0 text-[15px] font-medium ${
                          isDark ? "text-white" : "text-primary"
                        }`}
                      >
                        <span className="mr-3">{meta.flag}</span>
                        <span>{meta.label}</span>
                        {isPrimary ? (
                          <span className="ml-1 text-[#2f6df6]">
                            ({getMyCountryLabel(locale)})
                          </span>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!canToggleOff) return;
                          handleCountryClick(country);
                        }}
                        className={`relative inline-flex h-7 w-11 shrink-0 rounded-full border transition ${getSwitchTrackClasses(
                          isDark,
                          checked,
                          isPrimary,
                        )} ${!canToggleOff ? "cursor-not-allowed opacity-70" : ""}`}
                        aria-pressed={checked}
                        aria-label={`${meta.label} ${checked ? "enabled" : "disabled"}`}
                      >
                        <span
                          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${getSwitchThumbClasses(
                            isDark,
                            checked,
                            isPrimary,
                          )}`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div
                className={`mt-4 border-t pt-3 ${
                  isDark ? "border-[#22364f]" : "border-soft"
                }`}
              >
                <div className="pr-1 flex items-center justify-between gap-3">
                  <div
                    className={`min-w-0 text-[15px] font-medium ${
                      isDark ? "text-white" : "text-primary"
                    }`}
                  >
                    <span className="text-[#2f6df6]">
                      {getCountryShort(baseCountry)}
                    </span>
                    <span
                      className={isDark ? "text-[#95a8bd]" : "text-secondary"}
                    >
                      {" "}
                      → {AUTOTRANSLIT_LABEL[locale] || AUTOTRANSLIT_LABEL.us}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={toggleAutotranslit}
                    className={`relative inline-flex h-7 w-11 shrink-0 rounded-full border transition ${getSwitchTrackClasses(
                      isDark,
                      autotranslitEnabled,
                      true,
                    )}`}
                    aria-pressed={autotranslitEnabled}
                    aria-label="Toggle browser translation"
                  >
                    <span
                      className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${getSwitchThumbClasses(
                        isDark,
                        autotranslitEnabled,
                        true,
                      )}`}
                    />
                  </button>
                </div>
              </div>

              <div
                className={`mt-4 border-t pt-3 ${
                  isDark ? "border-[#22364f]" : "border-soft"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setCountryPickerOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium"
                  aria-expanded={countryPickerOpen}
                >
                  <span
                    className={`text-[13px] ${isDark ? "text-[#95a8bd]" : "text-secondary"}`}
                  >
                    {getMaxCountriesHint(locale)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition ${
                      countryPickerOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {countryPickerOpen ? (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {normalizedAvailable.map((country) => {
                      const isPrimary = country === baseCountry;
                      const checked = favoriteSet.has(country);
                      const meta = getCountryMeta(country);
                      const disabled =
                        isPrimary || (!checked && favoriteExtras.length >= 4);
                      const primaryChipClasses =
                        "border-[#2f6df6] bg-[#2f6df6] text-white";

                      return (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            if (isPrimary || disabled) return;
                            handleFavoriteCountryClick(country);
                          }}
                          className={`inline-flex h-8 items-center justify-center rounded-full border px-2 text-xs font-semibold uppercase transition ${
                            isPrimary
                              ? primaryChipClasses
                              : checked
                                ? activeClasses
                                : disabled
                                  ? isDark
                                    ? "cursor-not-allowed border-[#203449] bg-[#102033] text-[#5f7288]"
                                    : "cursor-not-allowed border-[#d2d9e3] bg-[#eef2f7] text-[#9aa4b2] opacity-70"
                                  : inactiveCountryClasses
                          }`}
                          title={meta.label}
                          aria-pressed={checked}
                        >
                          {getCountryShort(country).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}