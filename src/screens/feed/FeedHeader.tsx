import { Search, X } from "lucide-react";
import type { Locale } from "../../types/app";
import type { ContentTag } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";
import type { FeedHeaderProps } from "./feed.types";

const CONTENT_TAG_OPTIONS: Array<{ value: ContentTag; label: string }> =
  TAG_OPTIONS.filter(
    (tag): tag is { value: ContentTag; label: string } => tag.value !== "all"
  );

type FeedHeaderCopy = {
  title: string;
  subtitle: string;
  selectedTopics: string;
  closeFilters: string;
  searchPlaceholder: string;
  clearAll: string;
  allTopics: string;
};

const FEED_HEADER_COPY: Record<Locale, FeedHeaderCopy> = {
  en: {
    title: "Topics & search",
    subtitle: "Choose topics to personalize your feed.",
    selectedTopics: "Topics selected",
    closeFilters: "Close filters",
    searchPlaceholder: "Search by channel, text, link...",
    clearAll: "Clear all",
    allTopics: "All topics",
  },
  ru: {
    title: "Темы и поиск",
    subtitle: "Выбери темы, чтобы персонализировать ленту.",
    selectedTopics: "Тем выбрано",
    closeFilters: "Закрыть фильтры",
    searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
    clearAll: "Очистить всё",
    allTopics: "Все темы",
  },
  de: {
    title: "Themen & Suche",
    subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
    selectedTopics: "Themen ausgewählt",
    closeFilters: "Filter schließen",
    searchPlaceholder: "Nach Kanal, Text, Link suchen...",
    clearAll: "Alles löschen",
    allTopics: "Alle Themen",
  },
  es: {
    title: "Temas y búsqueda",
    subtitle: "Elige temas para personalizar tu feed.",
    selectedTopics: "Temas seleccionados",
    closeFilters: "Cerrar filtros",
    searchPlaceholder: "Buscar por canal, texto, enlace...",
    clearAll: "Borrar todo",
    allTopics: "Todos los temas",
  },
  tr: {
    title: "Konular ve arama",
    subtitle: "Akışını kişiselleştirmek için konuları seç.",
    selectedTopics: "Seçilen konular",
    closeFilters: "Filtreleri kapat",
    searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
    clearAll: "Hepsini temizle",
    allTopics: "Tüm konular",
  },
  fr: {
    title: "Thèmes et recherche",
    subtitle: "Choisis des thèmes pour personnaliser ton flux.",
    selectedTopics: "Thèmes sélectionnés",
    closeFilters: "Fermer les filtres",
    searchPlaceholder: "Rechercher par canal, texte, lien...",
    clearAll: "Tout effacer",
    allTopics: "Tous les thèmes",
  },
  it: {
    title: "Temi e ricerca",
    subtitle: "Scegli i temi per personalizzare il feed.",
    selectedTopics: "Temi selezionati",
    closeFilters: "Chiudi filtri",
    searchPlaceholder: "Cerca per canale, testo, link...",
    clearAll: "Cancella tutto",
    allTopics: "Tutti i temi",
  },
  "pt-br": {
    title: "Tópicos e busca",
    subtitle: "Escolha tópicos para personalizar seu feed.",
    selectedTopics: "Tópicos selecionados",
    closeFilters: "Fechar filtros",
    searchPlaceholder: "Buscar por canal, texto, link...",
    clearAll: "Limpar tudo",
    allTopics: "Todos os tópicos",
  },
  id: {
    title: "Topik & pencarian",
    subtitle: "Pilih topik untuk mempersonalisasi feed.",
    selectedTopics: "Topik dipilih",
    closeFilters: "Tutup filter",
    searchPlaceholder: "Cari berdasarkan channel, teks, link...",
    clearAll: "Bersihkan semua",
    allTopics: "Semua topik",
  },
  pl: {
    title: "Tematy i wyszukiwanie",
    subtitle: "Wybierz tematy, aby spersonalizować feed.",
    selectedTopics: "Wybrane tematy",
    closeFilters: "Zamknij filtry",
    searchPlaceholder: "Szukaj po kanale, tekście, linku...",
    clearAll: "Wyczyść wszystko",
    allTopics: "Wszystkie tematy",
  },
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
}: FeedHeaderProps) {
  const selectedCount = selectedTags.length;
  const copy = FEED_HEADER_COPY[locale] ?? FEED_HEADER_COPY.en;

  if (!tagsOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-16 z-30">
      <div className="mx-auto w-full max-w-[570px] px-4 pt-3">
        <div className="max-h-[calc(100vh-88px)] overflow-y-auto rounded-[24px] border border-neutral-200 bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-neutral-950">
                {copy.title}
              </div>
              <div className="mt-1 text-sm leading-6 text-neutral-500">
                {selectedCount > 0
                  ? `${copy.selectedTopics}: ${selectedCount}`
                  : copy.subtitle}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTagsOpen(false)}
              className="rounded-full bg-neutral-100 p-2 text-neutral-700"
              aria-label={copy.closeFilters}
              title={copy.closeFilters}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-950 outline-none placeholder:text-neutral-400 focus:border-neutral-300"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
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
                  {tag.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearTags}
              className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700"
            >
              {copy.clearAll}
            </button>

            <div className="text-xs text-neutral-400">
              {selectedCount > 0
                ? `${copy.selectedTopics}: ${selectedCount}`
                : copy.allTopics}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}