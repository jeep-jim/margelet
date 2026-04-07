import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContentTag } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";
import type { FeedHeaderProps } from "./feed.types";
import { getTagLabel } from "./feed.utils";

const CONTENT_TAG_OPTIONS: Array<{ value: ContentTag; label?: string }> =
  TAG_OPTIONS.filter(
    (tag): tag is { value: ContentTag; label?: string } => tag.value !== "all"
  );

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
      clearAll: "Clear",
      allTopics: "All topics",
    },
    ru: {
      title: "Темы и поиск",
      subtitle: "Выбери темы, чтобы персонализировать ленту.",
      selectedTopics: "Тем выбрано",
      searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
      clearAll: "Очистить",
      allTopics: "Все темы",
    },
    de: {
      title: "Themen & Suche",
      subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
      selectedTopics: "Themen ausgewählt",
      searchPlaceholder: "Nach Kanal, Text, Link suchen...",
      clearAll: "Löschen",
      allTopics: "Alle Themen",
    },
    es: {
      title: "Temas y búsqueda",
      subtitle: "Elige temas para personalizar tu feed.",
      selectedTopics: "Temas seleccionados",
      searchPlaceholder: "Buscar por canal, texto, enlace...",
      clearAll: "Limpiar",
      allTopics: "Todos los temas",
    },
    tr: {
      title: "Konular ve arama",
      subtitle: "Akışını kişiselleştirmek için konuları seç.",
      selectedTopics: "Seçilen konular",
      searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
      clearAll: "Temizle",
      allTopics: "Tüm konular",
    },
    fr: {
      title: "Thèmes et recherche",
      subtitle: "Choisis des thèmes pour personnaliser ton flux.",
      selectedTopics: "Thèmes sélectionnés",
      searchPlaceholder: "Rechercher par canal, texte, lien...",
      clearAll: "Effacer",
      allTopics: "Tous les thèmes",
    },
    it: {
      title: "Temi e ricerca",
      subtitle: "Scegli i temi per personalizzare il feed.",
      selectedTopics: "Temi selezionati",
      searchPlaceholder: "Cerca per canale, testo, link...",
      clearAll: "Pulisci",
      allTopics: "Tutti i temi",
    },
    "pt-br": {
      title: "Tópicos e busca",
      subtitle: "Escolha tópicos para personalizar seu feed.",
      selectedTopics: "Tópicos selecionados",
      searchPlaceholder: "Buscar por canal, texto, link...",
      clearAll: "Limpar",
      allTopics: "Todos os tópicos",
    },
    id: {
      title: "Topik & pencarian",
      subtitle: "Pilih topik untuk mempersonalisasi feed.",
      selectedTopics: "Topik dipilih",
      searchPlaceholder: "Cari berdasarkan channel, teks, link...",
      clearAll: "Bersihkan",
      allTopics: "Semua topik",
    },
    pl: {
      title: "Tematy i wyszukiwanie",
      subtitle: "Wybierz tematy, aby spersonalizować feed.",
      selectedTopics: "Wybrane tematy",
      searchPlaceholder: "Szukaj po kanale, tekście, linku...",
      clearAll: "Wyczyść",
      allTopics: "Wszystkie tematy",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

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
                onClick={() => {
                  clearTags();
                  setDraftQuery("");
                  setSearchQuery("");
                }}
                className="w-full rounded-2xl bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-300"
              >
                {copy.clearAll}
              </button>

              <div className="hidden whitespace-nowrap text-xs text-neutral-400 sm:block">
                {selectedCount > 0
                  ? `${copy.selectedTopics}: ${selectedCount}`
                  : copy.allTopics}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}