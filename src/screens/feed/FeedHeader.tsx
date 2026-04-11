import { Search, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { ContentTag, Locale } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";
import { getTagLabel } from "./feed.utils";

const CONTENT_TAG_OPTIONS: Array<{ value: ContentTag; label?: string }> =
  TAG_OPTIONS.filter(
    (tag): tag is { value: ContentTag; label?: string } => tag.value !== "all"
  );

type FeedHeaderProps = {
  locale: Locale;
  selectedTags: ContentTag[];
  toggleTag: (tag: ContentTag) => void;
  clearTags: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  tagsOpen: boolean;
  setTagsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  resultsCount: number;
};

export function FeedHeader({
  locale,
  selectedTags,
  toggleTag,
  clearTags,
  searchQuery,
  setSearchQuery,
  tagsOpen,
  setTagsOpen,
  resultsCount,
}: FeedHeaderProps) {
  const [draftQuery, setDraftQuery] = useState(searchQuery);

  useEffect(() => {
    if (tagsOpen) {
      setDraftQuery(searchQuery);
    }
  }, [tagsOpen, searchQuery]);

  const selectedCount = selectedTags.length;

  const COPY = {
    en: {
      title: "Topics & search",
      subtitle: "Choose topics to personalize your feed.",
      selectedTopics: "Topics selected",
      searchPlaceholder: "Search by channel, text, link...",
      show: "Show",
      allTopics: "All topics",
      found: "found",
      clearSearch: "Clear search",
      clearTopics: "Clear topics",
    },
    ru: {
      title: "Темы и поиск",
      subtitle: "Выбери темы, чтобы персонализировать ленту.",
      selectedTopics: "Тем выбрано",
      searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
      show: "Показать",
      allTopics: "Все темы",
      found: "найдено",
      clearSearch: "Очистить поиск",
      clearTopics: "Очистить темы",
    },
    de: {
      title: "Themen & Suche",
      subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
      selectedTopics: "Themen ausgewählt",
      searchPlaceholder: "Nach Kanal, Text, Link suchen...",
      show: "Anzeigen",
      allTopics: "Alle Themen",
      found: "gefunden",
      clearSearch: "Suche löschen",
      clearTopics: "Themen löschen",
    },
    es: {
      title: "Temas y búsqueda",
      subtitle: "Elige temas para personalizar tu feed.",
      selectedTopics: "Temas seleccionados",
      searchPlaceholder: "Buscar por canal, texto, enlace...",
      show: "Mostrar",
      allTopics: "Todos los temas",
      found: "encontrados",
      clearSearch: "Borrar búsqueda",
      clearTopics: "Borrar temas",
    },
    tr: {
      title: "Konular ve arama",
      subtitle: "Akışını kişiselleştirmek için konuları seç.",
      selectedTopics: "Seçilen konular",
      searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
      show: "Göster",
      allTopics: "Tüm konular",
      found: "bulundu",
      clearSearch: "Aramayı temizle",
      clearTopics: "Konuları temizle",
    },
    fr: {
      title: "Thèmes et recherche",
      subtitle: "Choisis des thèmes pour personnaliser ton flux.",
      selectedTopics: "Thèmes sélectionnés",
      searchPlaceholder: "Rechercher par canal, texte, lien...",
      show: "Afficher",
      allTopics: "Tous les thèmes",
      found: "trouvés",
      clearSearch: "Effacer la recherche",
      clearTopics: "Effacer les thèmes",
    },
    it: {
      title: "Temi e ricerca",
      subtitle: "Scegli i temi per personalizzare il feed.",
      selectedTopics: "Temi selezionati",
      searchPlaceholder: "Cerca per canale, testo, link...",
      show: "Mostra",
      allTopics: "Tutti i temi",
      found: "trovati",
      clearSearch: "Cancella ricerca",
      clearTopics: "Cancella temi",
    },
    "pt-br": {
      title: "Tópicos e busca",
      subtitle: "Escolha tópicos para personalizar seu feed.",
      selectedTopics: "Tópicos selecionados",
      searchPlaceholder: "Buscar por canal, texto, link...",
      show: "Mostrar",
      allTopics: "Todos os tópicos",
      found: "encontrados",
      clearSearch: "Limpar busca",
      clearTopics: "Limpar tópicos",
    },
    id: {
      title: "Topik & pencarian",
      subtitle: "Pilih topik untuk mempersonalisasi feed.",
      selectedTopics: "Topik dipilih",
      searchPlaceholder: "Cari berdasarkan channel, teks, link...",
      show: "Tampilkan",
      allTopics: "Semua topik",
      found: "ditemukan",
      clearSearch: "Bersihkan pencarian",
      clearTopics: "Bersihkan topik",
    },
    pl: {
      title: "Tematy i wyszukiwanie",
      subtitle: "Wybierz tematy, aby spersonalizować feed.",
      selectedTopics: "Wybrane tematy",
      searchPlaceholder: "Szukaj po kanale, tekście, linku...",
      show: "Pokaż",
      allTopics: "Wszystkie tematy",
      found: "znaleziono",
      clearSearch: "Wyczyść wyszukiwanie",
      clearTopics: "Wyczyść tematy",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;
  const hasPendingChanges =
    selectedCount > 0 || draftQuery.trim().length > 0;

  if (!tagsOpen) {
    return null;
  }

  const applySearchAndClose = () => {
    setSearchQuery(draftQuery.trim());
    setTagsOpen(false);
  };

  const handleClearTopics = () => {
    clearTags();
  };

  const handleClearSearch = () => {
    setDraftQuery("");
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="theme-shell fixed inset-x-0 top-16 bottom-0 z-[80] isolate">
      <div className="mx-auto h-full w-full max-w-[570px] overflow-hidden bg-white md:border-x md:border-neutral-200">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-neutral-200 bg-white px-4 pb-4 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-semibold leading-none text-neutral-950">
                  {copy.title}
                </div>

                <div className="mt-2 truncate text-sm leading-6 text-neutral-500">
                  {selectedCount > 0
                    ? `${copy.selectedTopics}: ${selectedCount}`
                    : copy.subtitle}
                </div>
              </div>

              {selectedCount > 0 ? (
                <button
                  type="button"
                  onClick={handleClearTopics}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-neutral-100"
                  aria-label={copy.clearTopics}
                  title={copy.clearTopics}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <form
              className="relative mt-4"
              onSubmit={(event) => {
                event.preventDefault();
                applySearchAndClose();
              }}
            >
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applySearchAndClose();
                  }
                }}
                enterKeyHint="search"
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-12 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-neutral-300"
              />

              {draftQuery.trim().length > 0 ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
                  aria-label={copy.clearSearch}
                  title={copy.clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </form>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-6">
            <div className="flex flex-wrap gap-2">
              {CONTENT_TAG_OPTIONS.map((tag) => {
                const active = selectedTags.includes(tag.value);

                return (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`rounded-full px-3 py-2 text-sm transition ${
                      active
                        ? "bg-neutral-950 text-white"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    {getTagLabel(tag.value, locale)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={applySearchAndClose}
                className={`w-full rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  hasPendingChanges
                    ? "bg-neutral-950 text-white hover:bg-neutral-800"
                    : "bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
                }`}
              >
                {copy.show}
              </button>

              <div className="hidden whitespace-nowrap text-xs text-neutral-400 sm:block">
                {resultsCount} {copy.found}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}