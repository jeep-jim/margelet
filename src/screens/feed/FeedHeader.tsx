import { Search } from "lucide-react";
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
    },
    ru: {
      title: "Темы и поиск",
      subtitle: "Выбери темы, чтобы персонализировать ленту.",
      selectedTopics: "Тем выбрано",
      searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
      show: "Показать",
      allTopics: "Все темы",
      found: "найдено",
    },
    de: {
      title: "Themen & Suche",
      subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
      selectedTopics: "Themen ausgewählt",
      searchPlaceholder: "Nach Kanal, Text, Link suchen...",
      show: "Anzeigen",
      allTopics: "Alle Themen",
      found: "gefunden",
    },
    es: {
      title: "Temas y búsqueda",
      subtitle: "Elige temas para personalizar tu feed.",
      selectedTopics: "Temas seleccionados",
      searchPlaceholder: "Buscar por canal, texto, enlace...",
      show: "Mostrar",
      allTopics: "Todos los temas",
      found: "encontrados",
    },
    tr: {
      title: "Konular ve arama",
      subtitle: "Akışını kişiselleştirmek için konuları seç.",
      selectedTopics: "Seçilen konular",
      searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
      show: "Göster",
      allTopics: "Tüm konular",
      found: "bulundu",
    },
    fr: {
      title: "Thèmes et recherche",
      subtitle: "Choisis des thèmes pour personnaliser ton flux.",
      selectedTopics: "Thèmes sélectionnés",
      searchPlaceholder: "Rechercher par canal, texte, lien...",
      show: "Afficher",
      allTopics: "Tous les thèmes",
      found: "trouvés",
    },
    it: {
      title: "Temi e ricerca",
      subtitle: "Scegli i temi per personalizzare il feed.",
      selectedTopics: "Temi selezionati",
      searchPlaceholder: "Cerca per canale, testo, link...",
      show: "Mostra",
      allTopics: "Tutti i temi",
      found: "trovati",
    },
    "pt-br": {
      title: "Tópicos e busca",
      subtitle: "Escolha tópicos para personalizar seu feed.",
      selectedTopics: "Tópicos selecionados",
      searchPlaceholder: "Buscar por canal, texto, link...",
      show: "Mostrar",
      allTopics: "Todos os tópicos",
      found: "encontrados",
    },
    id: {
      title: "Topik & pencarian",
      subtitle: "Pilih topik untuk mempersonalisasi feed.",
      selectedTopics: "Topik dipilih",
      searchPlaceholder: "Cari berdasarkan channel, teks, link...",
      show: "Tampilkan",
      allTopics: "Semua topik",
      found: "ditemukan",
    },
    pl: {
      title: "Tematy i wyszukiwanie",
      subtitle: "Wybierz tematy, aby spersonalizować feed.",
      selectedTopics: "Wybrane tematy",
      searchPlaceholder: "Szukaj po kanale, tekście, linku...",
      show: "Pokaż",
      allTopics: "Wszystkie tematy",
      found: "znaleziono",
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

  return (
    <div className="fixed inset-x-0 top-16 bottom-0 z-30">
      <div className="mx-auto h-full w-full max-w-[570px] bg-white md:border-x md:border-neutral-200">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-neutral-200 bg-white px-4 pb-4 pt-4">
            <div className="text-base font-semibold leading-none text-neutral-950">
              {copy.title}
            </div>

            <div className="mt-2 truncate text-sm leading-6 text-neutral-500">
              {selectedCount > 0
                ? `${copy.selectedTopics}: ${selectedCount}`
                : copy.subtitle}
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
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-neutral-300"
              />
            </form>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
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

          <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-4">
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
    </div>
  );
}