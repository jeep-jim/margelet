import { Search, X } from "lucide-react";
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
      erase: "Erase",
    },
    ru: {
      title: "Темы и поиск",
      subtitle: "Выбери темы, чтобы персонализировать ленту.",
      selectedTopics: "Тем выбрано",
      searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
      show: "Показать",
      allTopics: "Все темы",
      found: "найдено",
      erase: "Стереть",
    },
    de: {
      title: "Themen & Suche",
      subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
      selectedTopics: "Themen ausgewählt",
      searchPlaceholder: "Nach Kanal, Text, Link suchen...",
      show: "Anzeigen",
      allTopics: "Alle Themen",
      found: "gefunden",
      erase: "Löschen",
    },
    es: {
      title: "Temas y búsqueda",
      subtitle: "Elige temas para personalizar tu feed.",
      selectedTopics: "Temas seleccionados",
      searchPlaceholder: "Buscar por canal, texto, enlace...",
      show: "Mostrar",
      allTopics: "Todos los temas",
      found: "encontrados",
      erase: "Borrar",
    },
    tr: {
      title: "Konular ve arama",
      subtitle: "Akışını kişiselleştirmek için konuları seç.",
      selectedTopics: "Seçilen konular",
      searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
      show: "Göster",
      allTopics: "Tüm konular",
      found: "bulundu",
      erase: "Temizle",
    },
    fr: {
      title: "Thèmes et recherche",
      subtitle: "Choisis des thèmes pour personnaliser ton flux.",
      selectedTopics: "Thèmes sélectionnés",
      searchPlaceholder: "Rechercher par canal, texte, lien...",
      show: "Afficher",
      allTopics: "Tous les thèmes",
      found: "trouvés",
      erase: "Effacer",
    },
    it: {
      title: "Temi e ricerca",
      subtitle: "Scegli i temi per personalizzare il feed.",
      selectedTopics: "Temi selezionati",
      searchPlaceholder: "Cerca per canale, testo, link...",
      show: "Mostra",
      allTopics: "Tutti i temi",
      found: "trovati",
      erase: "Cancella",
    },
    "pt-br": {
      title: "Tópicos e busca",
      subtitle: "Escolha tópicos para personalizar seu feed.",
      selectedTopics: "Tópicos selecionados",
      searchPlaceholder: "Buscar por canal, texto, link...",
      show: "Mostrar",
      allTopics: "Todos os tópicos",
      found: "encontrados",
      erase: "Apagar",
    },
    id: {
      title: "Topik & pencarian",
      subtitle: "Pilih topik untuk mempersonalisasi feed.",
      selectedTopics: "Topik dipilih",
      searchPlaceholder: "Cari berdasarkan channel, teks, link...",
      show: "Tampilkan",
      allTopics: "Semua topik",
      found: "ditemukan",
      erase: "Hapus",
    },
    pl: {
      title: "Tematy i wyszukiwanie",
      subtitle: "Wybierz tematy, aby spersonalizować feed.",
      selectedTopics: "Wybrane tematy",
      searchPlaceholder: "Szukaj po kanale, tekście, linku...",
      show: "Pokaż",
      allTopics: "Wszystkie tematy",
      found: "znaleziono",
      erase: "Wyczyść",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;
  const hasPendingChanges = selectedCount > 0 || draftQuery.trim().length > 0;
  const hasSearchDraft = draftQuery.trim().length > 0;
  const canErase = selectedCount > 0 || hasSearchDraft || searchQuery.trim().length > 0;

  if (!tagsOpen) {
    return null;
  }

  const applySearchAndClose = () => {
    setSearchQuery(draftQuery.trim());
    setTagsOpen(false);
  };

  const eraseAll = () => {
    clearTags();
    setDraftQuery("");
    setSearchQuery("");
  };

  const eraseDraftOnly = () => {
    setDraftQuery("");
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[80] isolate"
      style={{ top: "var(--app-header-offset)" }}
    >
      <div className="mx-auto h-full w-full max-w-[570px] overflow-hidden bg-app md:border-x md:border-soft">
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-soft bg-app px-4 pb-4 pt-4">
            <div className="text-base font-semibold leading-none text-primary">
              {copy.title}
            </div>

            <div className="mt-2 truncate text-sm leading-6 text-secondary">
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
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
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
                className="w-full rounded-2xl border border-soft bg-surface py-3 pl-11 pr-12 text-sm text-primary outline-none placeholder:text-secondary focus:border-[color:var(--border-strong)]"
              />

              {hasSearchDraft ? (
                <button
                  type="button"
                  onClick={eraseDraftOnly}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
                  aria-label={copy.erase}
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
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      active
                        ? "border-transparent bg-[color:var(--text-primary)] text-[color:var(--bg-app)]"
                        : "border-soft bg-surface text-secondary hover:bg-surface-soft hover:text-primary"
                    }`}
                  >
                    {getTagLabel(tag.value, locale)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shrink-0 border-t border-soft bg-app px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex items-center gap-3">
              {canErase ? (
                <button
                  type="button"
                  onClick={eraseAll}
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-soft bg-surface-soft text-secondary transition hover:bg-surface hover:text-primary"
                  aria-label={copy.erase}
                  title={copy.erase}
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={applySearchAndClose}
                className={`min-w-0 flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  hasPendingChanges
                    ? "bg-[color:var(--text-primary)] text-[color:var(--bg-app)] hover:opacity-90"
                    : "border border-soft bg-surface-soft text-primary hover:bg-surface"
                }`}
              >
                {copy.show}
              </button>
            </div>

            <div className="mt-2 text-center text-xs text-secondary sm:text-left">
              {resultsCount} {copy.found}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
