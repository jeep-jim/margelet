import { ChevronDown, FileText, Image as ImageIcon, Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTheme, type Theme } from "../../lib/theme";
import type { Locale } from "../../types/app";

export type FeedMediaMode = "all" | "text" | "photo" | "video";

export type FeedScreenCopy = {
  subscriptionsHint: string;
  emptyTitle: string;
  emptyText: string;
  clearAll: string;
  modeAll: string;
  modeText: string;
  modePhoto: string;
  modeVideo: string;
  countriesTitle: string;
};

export const FEED_SCREEN_COPY: Record<Locale, FeedScreenCopy> = {
  en: {
    subscriptionsHint:
      "New posts from channels with notifications enabled will appear here",
    emptyTitle: "Nothing found",
    emptyText: "Try removing some tags or clearing the search.",
    clearAll: "Clear all",
    modeAll: "All",
    modeText: "Text",
    modePhoto: "Photo",
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
    modeText: "Текст",
    modePhoto: "Фото",
    modeVideo: "Видео",
    countriesTitle: "Показывать каналы авторов из других стран:",
  },
  de: {
    subscriptionsHint:
      "Hier erscheinen neue Beiträge von Kanälen mit aktivierten Benachrichtigungen",
    emptyTitle: "Nichts gefunden",
    emptyText:
      "Versuche, einige Tags zu entfernen oder die Suche zu löschen.",
    clearAll: "Alles löschen",
    modeAll: "Alle",
    modeText: "Text",
    modePhoto: "Fotos",
    modeVideo: "Video",
    countriesTitle: "Kanäle aus anderen Ländern anzeigen:",
  },
  es: {
    subscriptionsHint:
      "Aquí aparecerán nuevas publicaciones de canales con notificaciones activadas",
    emptyTitle: "No se encontró nada",
    emptyText:
      "Prueba quitando algunas etiquetas o limpiando la búsqueda.",
    clearAll: "Borrar todo",
    modeAll: "Todo",
    modeText: "Texto",
    modePhoto: "Foto",
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
    modeText: "Metin",
    modePhoto: "Foto",
    modeVideo: "Video",
    countriesTitle: "Diğer ülkelerdeki kanalları göster:",
  },
  fr: {
    subscriptionsHint:
      "De nouvelles publications des chaînes avec notifications activées apparaîtront ici",
    emptyTitle: "Rien trouvé",
    emptyText:
      "Essaie de retirer certains tags ou d’effacer la recherche.",
    clearAll: "Tout effacer",
    modeAll: "Tout",
    modeText: "Texte",
    modePhoto: "Photo",
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
    modeText: "Testo",
    modePhoto: "Foto",
    modeVideo: "Video",
    countriesTitle: "Mostra canali di altri paesi:",
  },
  "pt-br": {
    subscriptionsHint:
      "Novos posts dos canais com notificações ativadas aparecerão aqui",
    emptyTitle: "Nada encontrado",
    emptyText: "Tente remover algumas tags ou limpar a busca.",
    clearAll: "Limpar tudo",
    modeAll: "Tudo",
    modeText: "Texto",
    modePhoto: "Foto",
    modeVideo: "Vídeo",
    countriesTitle: "Mostrar canais de outros países:",
  },
  id: {
    subscriptionsHint:
      "Postingan baru dari channel dengan notifikasi aktif akan muncul di sini",
    emptyTitle: "Tidak ada yang ditemukan",
    emptyText: "Coba hapus beberapa tag atau bersihkan pencarian.",
    clearAll: "Bersihkan semua",
    modeAll: "Semua",
    modeText: "Teks",
    modePhoto: "Foto",
    modeVideo: "Video",
    countriesTitle: "Tampilkan channel dari negara lain:",
  },
  pl: {
    subscriptionsHint:
      "Nowe posty z kanałów z włączonymi powiadomieniami pojawią się tutaj",
    emptyTitle: "Nic nie znaleziono",
    emptyText: "Spróbuj usunąć część tagów albo wyczyścić wyszukiwanie.",
    clearAll: "Wyczyść wszystko",
    modeAll: "Wszystko",
    modeText: "Tekst",
    modePhoto: "Zdjęcia",
    modeVideo: "Wideo",
    countriesTitle: "Pokaż kanały z innych krajów:",
  },
};

const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  de: "DE",
  es: "ES",
  tr: "TR",
  fr: "FR",
  it: "IT",
  "pt-br": "BR",
  id: "ID",
  pl: "PL",
};

const COUNTRY_LABELS: Record<string, { label: string; flag: string }> = {
  ru: { label: "Русский", flag: "🇷🇺" },
  en: { label: "English", flag: "🇬🇧" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  es: { label: "Español", flag: "🇪🇸" },
  tr: { label: "Türkçe", flag: "🇹🇷" },
  fr: { label: "Français", flag: "🇫🇷" },
  it: { label: "Italiano", flag: "🇮🇹" },
  "pt-br": { label: "Português (Brasil)", flag: "🇧🇷" },
  id: { label: "Bahasa Indonesia", flag: "🇮🇩" },
  pl: { label: "Polski", flag: "🇵🇱" },
  kz: { label: "KZ", flag: "🇰🇿" },
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
    ? "absolute left-0 right-0 top-full z-[120] overflow-hidden rounded-b-[28px] border-x border-b border-[#22364f] bg-[#132338] text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-200"    
    : "absolute left-0 right-0 top-full z-[120] overflow-hidden rounded-b-[28px] border-x border-b border-soft bg-surface-soft text-primary shadow-[0_12px_30px_rgba(0,0,0,0.10)] transition-all duration-200";

  return `${base} ${
    open
      ? "max-h-[420px] translate-y-0 opacity-100"
      : "pointer-events-none max-h-0 -translate-y-2 border-transparent opacity-0 shadow-none"
  }`;
}

function getSwitchTrackClasses(
  isDark: boolean,
  checked: boolean,
  primary: boolean
) {
  if (primary) {
    return "border-[#2f6df6] bg-[#2f6df6]";
  }

  if (checked) {
    return isDark
      ? "border-white bg-white"
      : "border-[#111111] bg-[#111111]";
  }

  return isDark
    ? "border-[#31455e] bg-[#1b2a3b]"
    : "border-soft bg-surface-soft";
}

function getSwitchThumbClasses(
  isDark: boolean,
  checked: boolean,
  primary: boolean
) {
  if (primary) {
    return "left-[20px] bg-white";
  }

  if (checked) {
    return isDark ? "left-[20px] bg-[#162231]" : "left-[20px] bg-white";
  }

  return isDark ? "left-[2px] bg-[#6f89a8]" : "left-[2px] bg-[#9aa4b2]";
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
  onToggleCountry, 
}: {
  copy: FeedScreenCopy;
  mediaMode: FeedMediaMode;
  onChangeMediaMode: (next: FeedMediaMode) => void;
  locale: Locale;
  floating?: boolean;
  visible?: boolean;
  availableCountries: string[];
  selectedCountries: string[];
  onToggleCountry: (country: string) => void;
}) {
  const theme = useThemeMode();
  const isDark = theme === "dark";
  const [countriesOpen, setCountriesOpen] = useState(false);

  useEffect(() => {
    if (!countriesOpen) return;

    const handleClose = () => {
        setCountriesOpen(false);
    };

    window.addEventListener("scroll", handleClose, { passive: true });
    window.addEventListener("touchmove", handleClose, { passive: true });
    window.addEventListener("wheel", handleClose, { passive: true });

    return () => {
        window.removeEventListener("scroll", handleClose);
        window.removeEventListener("touchmove", handleClose);
        window.removeEventListener("wheel", handleClose);
    };
    }, [countriesOpen]);

    useEffect(() => {
    if (!visible) {
        setCountriesOpen(false);
    }
    }, [visible]);

  const options: Array<{
    value: FeedMediaMode;
    label: string;
    mobileLabel?: string;
    icon?: React.ReactNode;
  }> = useMemo(
    () => [
      { value: "all", label: copy.modeAll, mobileLabel: copy.modeAll },
      {
        value: "text",
        label: copy.modeText,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        value: "photo",
        label: copy.modePhoto,
        icon: <ImageIcon className="h-4 w-4" />,
      },
      {
        value: "video",
        label: copy.modeVideo,
        icon: <Play className="h-4 w-4 fill-current" />,
      },
    ],
    [copy.modeAll, copy.modePhoto, copy.modeText, copy.modeVideo]
  );

  const baseCountry = String(locale).toLowerCase();
  const extraCount = selectedCountries.filter((item) => item !== baseCountry).length;
  const countryButtonLabel =
    extraCount > 0
      ? `${LOCALE_SHORT[locale] ?? String(locale).toUpperCase()} +${extraCount}`
      : LOCALE_SHORT[locale] ?? String(locale).toUpperCase();

  const activeClasses = getActiveClasses(isDark);
  const inactivePillClasses = getInactivePillClasses(isDark);
  const inactiveCountryClasses = getInactiveCountryClasses(isDark);

  return (
    <div
      className={
        floating
          ? `fixed inset-x-0 z-[55] transition-all duration-300 ease-out ${
              visible
                ? "translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-3 opacity-0"
            }`
          : "relative z-[2]"
      }
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
                      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-full border px-3 text-sm font-medium transition sm:h-10 sm:px-3.5 ${
                        active ? activeClasses : inactivePillClasses
                      } ${
                        option.value === "all"
                          ? "min-w-[62px] sm:min-w-[72px]"
                          : "min-w-[40px] sm:min-w-[88px]"
                      }`}
                      aria-pressed={active}
                    >
                      {option.value === "all" ? (
                        <span className="truncate">{option.mobileLabel ?? option.label}</span>
                      ) : (
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
                  className={`inline-flex h-10 min-w-[76px] items-center justify-center gap-2 rounded-full border px-3.5 text-sm font-medium transition ${
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
            <div className="px-4 pb-4 pt-4 sm:px-4">
              <div
                className={`mb-3 text-sm font-medium ${
                  isDark ? "text-[#95a8bd]" : "text-secondary"
                }`}
              >
                {copy.countriesTitle}
              </div>

              <div className="space-y-2.5">
                {availableCountries.map((country) => {
                  const checked = selectedCountries.includes(country);
                  const isPrimary = country === baseCountry;

                  const meta = COUNTRY_LABELS[country] || {
                    label: country.toUpperCase(),
                    flag: "🌍",
                  };

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
                          <span className="ml-1 text-[#2f6df6]">(мой)</span>
                        ) : null}
                      </div>                      

                      <button
                        type="button"
                        onClick={() => {
                          if (isPrimary) return;
                          onToggleCountry(country);
                        }}
                        className={`relative inline-flex h-7 w-11 shrink-0 rounded-full border transition ${getSwitchTrackClasses(
                          isDark,
                          checked,
                          isPrimary
                        )} ${isPrimary ? "cursor-default" : ""}`}
                        aria-pressed={checked}
                        aria-label={`${meta.label} ${checked ? "enabled" : "disabled"}`}
                      >
                        <span
                          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${getSwitchThumbClasses(
                            isDark,
                            checked,
                            isPrimary
                          )}`}
                        />
                      </button>                      
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
