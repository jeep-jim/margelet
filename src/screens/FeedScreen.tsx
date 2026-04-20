import {
  Bell,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Play,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "../types/app";
import type { ContentTag, IngestedPost } from "../types/app";
import { FeedCard } from "./feed/FeedCard";
import { FeedHeader } from "./feed/FeedHeader";
import { FeedTextReaderModal } from "./feed/FeedTextReaderModal";
import { FeedViewer } from "./feed/FeedViewer";
import {
  ADMIN_TELEGRAM_IDS,
  FEED_FILTER_STATE_EVENT,
  FEED_FILTER_TOGGLE_EVENT,
} from "./feed/feed.constants";
import type { ViewerDirection } from "./feed/feed.types";
import { buildShareUrl, getResolvedTags } from "./feed/feed.utils";

const SELECTED_TAGS_STORAGE_KEY = "margelet_feed_selected_tags";
const FEED_SEARCH_STORAGE_KEY = "margelet_feed_search";
const SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscriptions";
const SEEN_SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscription_seen_posts";
const FEED_SETTINGS_STORAGE_KEY = "margelet_feed_settings_v1";

type FeedMediaMode = "all" | "text" | "photo" | "video";

type FeedSettings = {
  mediaMode: FeedMediaMode;
  countries: string[];
  demoteSeen: boolean;
};

type SubscriptionBubble = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
  latestPostId: number;
};

type FeedScreenCopy = {
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

const FEED_SCREEN_COPY: Record<Locale, FeedScreenCopy> = {
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

function isGifPost(post: IngestedPost) {
  return (
    post.contentType === "gif" ||
    post.media.some((item) => item.mimeType?.includes("gif"))
  );
}

function isVideoViewerPost(post: IngestedPost) {
  if (isGifPost(post)) return false;
  return post.contentType === "video";
}

function normalizeCountryCode(value: string | null | undefined, locale: Locale) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw) return raw;
  return String(locale).toLowerCase();
}

function detectPostMediaMode(
  post: IngestedPost
): Exclude<FeedMediaMode, "all"> | "mixed" {
  const hasVideo =
    post.media.some((item) => item.kind === "video") ||
    post.contentType === "video";
  const hasImage =
    post.media.some((item) => item.kind === "image") ||
    post.contentType === "image" ||
    post.contentType === "gallery" ||
    post.contentType === "gif";

  if (hasVideo) return "video";
  if (hasImage) return "photo";
  if (post.contentType === "text" || post.media.length === 0) return "text";
  return "mixed";
}

function readSelectedTagsFromStorage(): ContentTag[] {
  try {
    const raw = localStorage.getItem(SELECTED_TAGS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item): item is ContentTag => typeof item === "string");
  } catch {
    localStorage.removeItem(SELECTED_TAGS_STORAGE_KEY);
    return [];
  }
}

function readSearchQueryFromStorage() {
  try {
    return localStorage.getItem(FEED_SEARCH_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function readSubscriptionsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is string => typeof item === "string" && !!item.trim()
    );
  } catch {
    return [];
  }
}

function readSeenSubscriptionsFromStorage(): Record<string, number> {
  try {
    const raw = localStorage.getItem(SEEN_SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    const result: Record<string, number> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (
        typeof key === "string" &&
        typeof value === "number" &&
        Number.isFinite(value)
      ) {
        result[key] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

function readFeedSettingsFromStorage(locale: Locale): FeedSettings {
  const fallbackCountry = String(locale).toLowerCase();

  try {
    const raw = localStorage.getItem(FEED_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        mediaMode: "all",
        countries: [fallbackCountry],
        demoteSeen: true,
      };
    }

    const parsed = JSON.parse(raw) as Partial<FeedSettings>;
    const mediaMode: FeedMediaMode =
      parsed?.mediaMode === "text" ||
      parsed?.mediaMode === "photo" ||
      parsed?.mediaMode === "video"
        ? parsed.mediaMode
        : "all";

    const countries = Array.isArray(parsed?.countries)
      ? parsed.countries
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      : [fallbackCountry];

    return {
      mediaMode,
      countries: countries.length ? countries : [fallbackCountry],
      demoteSeen: parsed?.demoteSeen !== false,
    };
  } catch {
    return {
      mediaMode: "all",
      countries: [fallbackCountry],
      demoteSeen: true,
    };
  }
}

function writeSeenSubscriptionsToStorage(value: Record<string, number>) {
  try {
    localStorage.setItem(
      SEEN_SUBSCRIPTIONS_STORAGE_KEY,
      JSON.stringify(value)
    );
    window.dispatchEvent(new Event("storage"));
  } catch {
    //
  }
}

function writeFeedSettingsToStorage(value: FeedSettings) {
  try {
    localStorage.setItem(FEED_SETTINGS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    //
  }
}

function SubscriptionsHint({ text }: { text: string }) {
  return (
    <div className="mx-auto mb-4 mt-4 w-full max-w-[570px] px-4">
      <div className="flex items-center gap-4 rounded-[28px] border border-soft bg-surface px-4 py-4 shadow-soft">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-soft">
          <Bell className="h-5 w-5 text-primary" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold text-primary">{text}</div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionsBar({
  items,
  onOpen,
}: {
  items: SubscriptionBubble[];
  onOpen: (handle: string) => void;
}) {
  if (!items.length) return null;

  return (
    <div className="mb-4 mt-4 w-full">
      <div className="mx-auto w-full max-w-[570px]">
        <div className="overflow-x-auto pl-4 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2.5">
            {items.map((item) => (
              <button
                key={item.handle}
                type="button"
                onClick={() => onOpen(item.handle)}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1 text-center"
              >
                <div
                  className={`rounded-full border-2 p-[2px] ${
                    item.hasNew
                      ? "border-[color:var(--text-primary)]"
                      : "border-soft"
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-surface">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-surface-soft text-xs font-bold text-primary">
                        {item.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full truncate text-[11px] font-medium text-secondary">
                  {item.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartFeedBar({
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
  const [countriesOpen, setCountriesOpen] = useState(false);

  useEffect(() => {
    if (!countriesOpen) return;

    const closeDropdown = () => {
      setCountriesOpen(false);
    };

    window.addEventListener("scroll", closeDropdown, { passive: true });
    window.addEventListener("wheel", closeDropdown, { passive: true });
    window.addEventListener("touchmove", closeDropdown, { passive: true });
    window.addEventListener("resize", closeDropdown);

    return () => {
      window.removeEventListener("scroll", closeDropdown);
      window.removeEventListener("wheel", closeDropdown);
      window.removeEventListener("touchmove", closeDropdown);
      window.removeEventListener("resize", closeDropdown);
    };
  }, [countriesOpen]);

  useEffect(() => {
    if (!visible && countriesOpen) {
      setCountriesOpen(false);
    }
  }, [visible, countriesOpen]);

  const options: Array<{
    value: FeedMediaMode;
    label: string;
    mobileLabel?: string;
    icon?: React.ReactNode;
  }> = [
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
  ];

  const baseCountry = String(locale).toLowerCase();
  const extraCount = selectedCountries.filter((item) => item !== baseCountry).length;
  const countryButtonLabel =
    extraCount > 0
      ? `${LOCALE_SHORT[locale] ?? String(locale).toUpperCase()} +${extraCount}`
      : LOCALE_SHORT[locale] ?? String(locale).toUpperCase();

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
          <div className="border-b border-soft bg-surface text-primary transition-colors dark:border-[#22364f] dark:bg-[#08111d] dark:text-white">
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
                        active
                          ? "border-transparent bg-[#111111] text-white dark:border-white dark:bg-white dark:text-[#162231]"
                          : "border-soft bg-surface-soft text-secondary hover:bg-surface dark:border-[#23405d] dark:bg-[#102033] dark:text-white dark:hover:bg-[#13263c]"
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
                    countriesOpen
                      ? "border-transparent bg-[#111111] text-white dark:border-white dark:bg-white dark:text-[#162231]"
                      : "border-soft bg-surface-soft text-primary hover:bg-surface dark:border-[#23405d] dark:bg-[#102033] dark:text-white dark:hover:bg-[#13263c]"
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

          <div
            className={`absolute left-0 right-0 top-full overflow-hidden rounded-b-[28px] border-x border-b border-soft bg-surface text-primary shadow-soft transition-all duration-200 dark:border-[#22364f] dark:bg-[#132338] dark:text-white dark:shadow-[0_16px_40px_rgba(0,0,0,0.28)] ${
              countriesOpen
                ? "pointer-events-auto max-h-[420px] opacity-100"
                : "pointer-events-none max-h-0 border-transparent opacity-0 shadow-none"
            }`}
          >
            <div className="px-4 pb-4 pt-4 sm:px-4">
              <div className="mb-3 text-sm font-medium text-secondary dark:text-[#95a8bd]">
                {copy.countriesTitle}
              </div>

              <div className="space-y-2.5">
                {availableCountries.map((country) => {
                  const checked = selectedCountries.includes(country);
                  const meta = COUNTRY_LABELS[country] || {
                    label: country.toUpperCase(),
                    flag: "🌍",
                  };

                  return (
                    <div
                      key={country}
                      className="flex items-center justify-between gap-3 rounded-2xl px-1 py-1"
                    >
                      <div className="min-w-0 text-[15px] font-medium text-primary dark:text-white">
                        <span className="mr-3">{meta.flag}</span>
                        <span>{meta.label}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleCountry(country)}
                        className={`relative inline-flex h-7 w-11 shrink-0 rounded-full border transition ${
                          checked
                            ? "border-transparent bg-[#111111] dark:border-white dark:bg-white"
                            : "border-soft bg-surface-soft dark:border-[#31455e] dark:bg-[#1b2a3b]"
                        }`}
                        aria-pressed={checked}
                        aria-label={`${meta.label} ${checked ? "enabled" : "disabled"}`}
                      >
                        <span
                          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${
                            checked
                              ? "left-[20px] bg-white dark:bg-[#1b2a3b]"
                              : "left-[2px] bg-secondary/70 dark:bg-[#6f89a8]"
                          }`}
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

export function FeedScreen({
  locale,
  posts,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onHidePost,
  onDeletePost,
  currentTelegramUserId,
  openSource,
  isFeedLoading,
}: {
  locale: Locale;
  posts: IngestedPost[];
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onHidePost: (id: number) => void;
  onDeletePost: (id: number) => Promise<void>;
  currentTelegramUserId: string | null;
  openSource: (handle: string) => void;
  isFeedLoading: boolean;
}) {
  const copy = FEED_SCREEN_COPY[locale] ?? FEED_SCREEN_COPY.en;

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [textReaderPost, setTextReaderPost] = useState<IngestedPost | null>(null);
  const [viewerDirection, setViewerDirection] = useState<ViewerDirection>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subscriptionHandles, setSubscriptionHandles] = useState<string[]>([]);
  const [seenSubscriptionPosts, setSeenSubscriptionPosts] = useState<
    Record<string, number>
  >({});
  const [feedSettings, setFeedSettings] = useState<FeedSettings>(() =>
    readFeedSettingsFromStorage(locale)
  );
  const [showFloatingSmartBar, setShowFloatingSmartBar] = useState(false);
  const lastScrollYRef = useRef(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [copySuccessId, setCopySuccessId] = useState<number | null>(null);
  const [menuPostId, setMenuPostId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");
  const [videoProgress, setVideoProgress] = useState(0);
  const [feedMediaIndexes, setFeedMediaIndexes] = useState<Record<number, number>>(
    {}
  );
  const [viewerMediaIndex, setViewerMediaIndex] = useState(0);

  useEffect(() => {
    setSelectedTags(readSelectedTagsFromStorage());
    setSearchQuery(readSearchQueryFromStorage());
    setSubscriptionHandles(readSubscriptionsFromStorage());
    setSeenSubscriptionPosts(readSeenSubscriptionsFromStorage());
    setFeedSettings(readFeedSettingsFromStorage(locale));
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(
      SELECTED_TAGS_STORAGE_KEY,
      JSON.stringify(selectedTags)
    );
  }, [selectedTags]);

  useEffect(() => {
    localStorage.setItem(FEED_SEARCH_STORAGE_KEY, searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    writeFeedSettingsToStorage(feedSettings);
  }, [feedSettings]);

  useEffect(() => {
    const localeCountry = String(locale).toLowerCase();

    setFeedSettings((prev) => {
      if (prev.countries.length === 1 && prev.countries[0] === localeCountry) {
        return prev;
      }

      return {
        ...prev,
        countries: [localeCountry],
      };
    });
  }, [locale]);

  useEffect(() => {
    const handleToggle = () => {
      setTagsOpen((prev) => !prev);
    };

    const syncSubscriptions = () => {
      setSubscriptionHandles(readSubscriptionsFromStorage());
      setSeenSubscriptionPosts(readSeenSubscriptionsFromStorage());
    };

    window.addEventListener(
      FEED_FILTER_TOGGLE_EVENT,
      handleToggle as EventListener
    );
    window.addEventListener("focus", syncSubscriptions);
    window.addEventListener("storage", syncSubscriptions);

    return () => {
      window.removeEventListener(
        FEED_FILTER_TOGGLE_EVENT,
        handleToggle as EventListener
      );
      window.removeEventListener("focus", syncSubscriptions);
      window.removeEventListener("storage", syncSubscriptions);
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(FEED_FILTER_STATE_EVENT, {
        detail: tagsOpen,
      })
    );
  }, [tagsOpen]);

  useEffect(() => {
    if (tagsOpen) {
      setShowFloatingSmartBar(false);
      return;
    }

    const TOP_HIDE_OFFSET = 140;
    const DELTA = 6;

    const handleScroll = () => {
      const currentY = window.scrollY || 0;
      const prevY = lastScrollYRef.current;

      if (currentY <= TOP_HIDE_OFFSET) {
        setShowFloatingSmartBar(false);
        lastScrollYRef.current = currentY;
        return;
      }

      if (currentY < prevY - DELTA) {
        setShowFloatingSmartBar(true);
      } else if (currentY > prevY + DELTA) {
        setShowFloatingSmartBar(false);
      }

      lastScrollYRef.current = currentY;
    };

    lastScrollYRef.current = window.scrollY || 0;
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tagsOpen]);

  const safePosts = useMemo(() => {
    return posts.filter(
      (post) =>
        !!post &&
        typeof post.id === "number" &&
        !!post.source &&
        typeof post.source.title === "string" &&
        typeof post.source.handle === "string" &&
        Array.isArray(post.media)
    );
  }, [posts]);

  const availableCountryOptions = useMemo(() => {
    const currentCountry = String(locale).toLowerCase();
    const set = new Set<string>([currentCountry]);

    for (const post of safePosts) {
      const code = normalizeCountryCode(post.sourceCountryCode, locale);
      if (code) set.add(code);
    }

    return Array.from(set);
  }, [safePosts, locale]);

  const subscriptionBubbles = useMemo(() => {
    if (subscriptionHandles.length === 0) return [];

    const latestByHandle = new Map<
      string,
      {
        handle: string;
        title: string;
        avatar: string | null;
        latestPostId: number;
        hasNew: boolean;
      }
    >();

    for (const post of safePosts) {
      const handle = post.source.handle;
      if (!subscriptionHandles.includes(handle)) continue;

      const existing = latestByHandle.get(handle);

      if (!existing || post.id > existing.latestPostId) {
        const latestPostId = post.id;

        latestByHandle.set(handle, {
          handle,
          title: post.source.title,
          avatar: post.source.avatar,
          latestPostId,
          hasNew: latestPostId > (seenSubscriptionPosts[handle] ?? 0),
        });
      }
    }

    return Array.from(latestByHandle.values()).sort((a, b) => {
      if (a.hasNew !== b.hasNew) {
        return a.hasNew ? -1 : 1;
      }

      return b.latestPostId - a.latestPostId;
    });
  }, [safePosts, subscriptionHandles, seenSubscriptionPosts]);

  const visiblePosts = useMemo(() => {
    let list = [...safePosts];

    const selectedCountries = feedSettings.countries.map((item) => item.toLowerCase());
    if (selectedCountries.length > 0) {
      list = list.filter((post) =>
        selectedCountries.includes(
          normalizeCountryCode(post.sourceCountryCode, locale)
        )
      );
    }

    if (feedSettings.mediaMode !== "all") {
      list = list.filter((post) => {
        const detectedMode = detectPostMediaMode(post);
        if (feedSettings.mediaMode === "text") return detectedMode === "text";
        if (feedSettings.mediaMode === "photo") return detectedMode === "photo";
        if (feedSettings.mediaMode === "video") return detectedMode === "video";
        return true;
      });
    }

    if (selectedTags.length > 0) {
      list = list.filter((post) => {
        const postTags = getResolvedTags(post);
        return postTags.some((tag) => selectedTags.includes(tag));
      });
    }

    const q = searchQuery.trim().toLowerCase();

    if (q) {
      list = list.filter((post) => {
        const haystack = [
          post.source.title,
          post.source.handle,
          post.text,
          post.postUrl,
          post.tag,
          ...getResolvedTags(post),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    }

    return list;
  }, [safePosts, feedSettings, selectedTags, searchQuery, locale]);

  const viewerPosts = useMemo(() => {
    return visiblePosts.filter((post) => isVideoViewerPost(post));
  }, [visiblePosts]);

  const activePost = useMemo(() => {
    if (viewerIndex === null) return null;
    return viewerPosts[viewerIndex] ?? null;
  }, [viewerIndex, viewerPosts]);

  const setFeedCardMediaIndex = useCallback((postId: number, nextIndex: number) => {
    setFeedMediaIndexes((prev) => ({
      ...prev,
      [postId]: Math.max(0, nextIndex),
    }));
  }, []);

  const openViewerByPost = useCallback(
    (post: IngestedPost) => {
      const nextIndex = viewerPosts.findIndex((item) => item.id === post.id);
      if (nextIndex === -1) return;

      setTextReaderPost(null);
      setViewerDirection(null);
      setViewerIndex(nextIndex);
      setViewerMediaIndex(0);
      setExpandedCaption(false);
      setIsPlaying(true);
      setCopySuccessId(null);
      setMenuPostId(null);
      setActionError("");
      setVideoProgress(0);
    },
    [viewerPosts]
  );

  const openTextReader = useCallback((post: IngestedPost) => {
    setViewerIndex(null);
    setTextReaderPost(post);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
  }, []);

  const closeViewer = useCallback(() => {
    setViewerDirection(null);
    setViewerIndex(null);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, []);

  const nextViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("next");
    setViewerIndex((viewerIndex + 1) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

  const prevViewer = useCallback(() => {
    if (viewerIndex === null || viewerPosts.length === 0) return;
    setViewerDirection("prev");
    setViewerIndex((viewerIndex - 1 + viewerPosts.length) % viewerPosts.length);
    setViewerMediaIndex(0);
    setExpandedCaption(false);
    setIsPlaying(true);
    setCopySuccessId(null);
    setMenuPostId(null);
    setActionError("");
    setVideoProgress(0);
  }, [viewerIndex, viewerPosts.length]);

  const handleShare = async (post: IngestedPost) => {
    const shareUrl = buildShareUrl(post);

    try {
      if (navigator.share) {
        await navigator.share({
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      setCopySuccessId(post.id);
      window.setTimeout(() => {
        setCopySuccessId((prev) => (prev === post.id ? null : prev));
      }, 1600);
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopySuccessId(post.id);
        window.setTimeout(() => {
          setCopySuccessId((prev) => (prev === post.id ? null : prev));
        }, 1600);
      } catch {
        //
      }
    }
  };

  const handleOpenPost = (post: IngestedPost) => {
    if (isVideoViewerPost(post)) {
      openViewerByPost(post);
      return;
    }

    openTextReader(post);
  };

  const toggleTag = (tag: ContentTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((item) => item !== tag)
        : [...prev, tag]
    );
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const hasSubscriptions = subscriptionHandles.length > 0;
  const hasBubbles = subscriptionBubbles.length > 0;

  return (
    <div className="min-h-screen bg-app pt-16 text-primary" style={{ paddingTop: "var(--app-header-offset)" }}>
      <FeedHeader
        locale={locale}
        selectedTags={selectedTags}
        toggleTag={toggleTag}
        clearTags={clearTags}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tagsOpen={tagsOpen}
        setTagsOpen={setTagsOpen}
        resultsCount={visiblePosts.length}
      />

      {!tagsOpen ? (
        <SmartFeedBar
          copy={copy}
          mediaMode={feedSettings.mediaMode}
          onChangeMediaMode={(next) =>
            setFeedSettings((prev) => ({
              ...prev,
              mediaMode: next,
            }))
          }
          locale={locale}
          floating
          visible={showFloatingSmartBar}
          availableCountries={availableCountryOptions}
          selectedCountries={feedSettings.countries}
          onToggleCountry={(country) =>
            setFeedSettings((prev) => {
              const exists = prev.countries.includes(country);

              const nextCountries = exists
                ? prev.countries.filter((item) => item !== country)
                : [...prev.countries, country];

              return {
                ...prev,
                countries: nextCountries.length ? nextCountries : [country],
              };
            })
          }
        />
      ) : null}

      {!tagsOpen && !hasSubscriptions ? (
        <SubscriptionsHint text={copy.subscriptionsHint} />
      ) : null}

      {!tagsOpen && hasSubscriptions && hasBubbles ? (
        <SubscriptionsBar
          items={subscriptionBubbles}
          onOpen={(handle) => {
            const bubble = subscriptionBubbles.find((item) => item.handle === handle);

            if (bubble) {
              setSeenSubscriptionPosts((prev) => {
                const next = {
                  ...prev,
                  [handle]: Math.max(prev[handle] ?? 0, bubble.latestPostId),
                };
                writeSeenSubscriptionsToStorage(next);
                return next;
              });
            }

            openSource(handle);
          }}
        />
      ) : null}

      {!tagsOpen ? (
        <SmartFeedBar
          copy={copy}
          mediaMode={feedSettings.mediaMode}
          onChangeMediaMode={(next) =>
            setFeedSettings((prev) => ({
              ...prev,
              mediaMode: next,
            }))
          }
          locale={locale}
          availableCountries={availableCountryOptions}
          selectedCountries={feedSettings.countries}
          onToggleCountry={(country) =>
            setFeedSettings((prev) => {
              const currentCountry = String(locale).toLowerCase();

              if (country === currentCountry) {
                return prev;
              }

              const exists = prev.countries.includes(country);

              return {
                ...prev,
                countries: exists
                  ? prev.countries.filter((item) => item !== country)
                  : [...prev.countries, country],
              };
            })
          }
        />        
      ) : null}

      {!tagsOpen && hasSubscriptions && !hasBubbles ? (
        <SubscriptionsHint text={copy.subscriptionsHint} />
      ) : null}

      {actionError ? (
        <div className="mx-auto mb-3 w-full max-w-[570px] px-4">
          <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        </div>
      ) : null}

      {!isFeedLoading && visiblePosts.length === 0 ? (
        <div className="mx-auto mt-2 w-full max-w-[570px] px-4">
          <div className="rounded-[28px] border border-soft bg-surface px-6 py-8 text-center shadow-soft">
            <img
              src="/no_searsh.png"
              alt={copy.emptyTitle}
              className="mx-auto mb-4 h-28 w-28 object-contain"
              draggable={false}
            />

            <div className="text-[28px] font-semibold text-primary">
              {copy.emptyTitle}
            </div>

            <div className="mx-auto mt-3 max-w-[260px] text-base leading-7 text-secondary">
              {copy.emptyText}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                clearTags();
                setFeedSettings((prev) => ({
                  ...prev,
                  mediaMode: "all",
                }));
              }}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-strong px-6 py-3 text-sm font-medium text-strong-foreground bg-strong-hover"
            >
              {copy.clearAll}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[570px]">
        {visiblePosts.map((post) => {
          const ownerTelegramId = post.addedBy?.telegramId ?? null;

          const isOwner =
            !!currentTelegramUserId &&
            !!ownerTelegramId &&
            currentTelegramUserId === ownerTelegramId;

          const isAdmin =
            !!currentTelegramUserId && ADMIN_TELEGRAM_IDS.has(currentTelegramUserId);

          return (
            <FeedCard
              key={post.id}
              post={post}
              locale={locale}
              isOwner={isOwner}
              isAdmin={isAdmin}
              menuOpen={menuPostId === post.id}
              onToggleMenu={() =>
                setMenuPostId((prev) => (prev === post.id ? null : post.id))
              }
              onDelete={() => {
                void onDeletePost(post.id);
              }}
              onHide={() => onHidePost(post.id)}
              onOpen={() => handleOpenPost(post)}
              onOpenCreator={() => openSource(post.source.handle)}
              mediaIndex={feedMediaIndexes[post.id] || 0}
              onChangeMediaIndex={(next: number) =>
                setFeedCardMediaIndex(post.id, next)
              }
              liked={likedPostIds.includes(post.id)}
              onToggleLike={() => onToggleLike(post.id)}
              onShare={() => {
                void handleShare(post);
              }}
            />
          );
        })}
      </div>

      <FeedViewer
        locale={locale}
        activePost={activePost}
        viewerDirection={viewerDirection}
        expandedCaption={expandedCaption}
        setExpandedCaption={setExpandedCaption}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        copySuccessId={copySuccessId}
        menuPostId={menuPostId}
        setMenuPostId={setMenuPostId}
        actionError={actionError}
        videoProgress={videoProgress}
        viewerMediaIndex={viewerMediaIndex}
        setViewerMediaIndex={setViewerMediaIndex}
        likedPostIds={likedPostIds}
        savedPostIds={savedPostIds}
        onToggleLike={() => {}}
        onToggleSave={onToggleSave}
        onHidePost={onHidePost}
        onDeletePost={onDeletePost}
        currentTelegramUserId={currentTelegramUserId}
        openSource={openSource}
        closeViewer={closeViewer}
        nextViewer={nextViewer}
        prevViewer={prevViewer}
        handleShare={handleShare}
        setActionError={setActionError}
      />

      <FeedTextReaderModal
        post={textReaderPost}
        locale={locale}
        liked={false}
        saved={!!textReaderPost && savedPostIds.includes(textReaderPost.id)}
        onClose={() => setTextReaderPost(null)}
        onToggleLike={() => {}}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}