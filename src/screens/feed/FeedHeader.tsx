import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SITE_TAG_GROUPS } from "../../lib/tags";
import { getParentTag, isParentTag, resolveTagLabel } from "../../lib/tag-utils";
import type { ContentTag, Locale } from "../../types/app";

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
  tagStats: Partial<Record<ContentTag, number>>;
};

function buildExpandedParents(selectedTags: ContentTag[]) {
  const expanded = new Set<ContentTag>();

  for (const tag of selectedTags) {
    if (isParentTag(tag)) {
      expanded.add(tag);
      continue;
    }

    const parent = getParentTag(tag);
    if (parent?.value) {
      expanded.add(parent.value as ContentTag);
    }
  }

  return expanded;
}

function buildSelectedSummary(labels: string[]) {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} · ${labels[1]}`;
  return `${labels[0]} · ${labels[1]} +${labels.length - 2}`;
}

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
  tagStats,
}: FeedHeaderProps) {
  const [draftQuery, setDraftQuery] = useState(searchQuery);
  const [expandedParents, setExpandedParents] = useState<Set<ContentTag>>(
    () => buildExpandedParents(selectedTags)
  );

  useEffect(() => {
    if (tagsOpen) {
      setDraftQuery(searchQuery);
      setExpandedParents((prev) => {
        const next = new Set(prev);
        for (const tag of buildExpandedParents(selectedTags)) {
          next.add(tag);
        }
        return next;
      });
    }
  }, [tagsOpen, searchQuery, selectedTags]);

  const COPY = {
    en: {
      title: "Topics & search",
      subtitle: "Choose topics to personalize your feed.",
      searchPlaceholder: "Search by channel, text, link...",
      show: "Show",
      found: "found",
      erase: "Erase",
      selectedTopics: "Selected",
      emptyTagState: "No topics selected",
    },
    ru: {
      title: "Темы и поиск",
      subtitle: "Выбери темы, чтобы персонализировать ленту.",
      searchPlaceholder: "Поиск по каналу, тексту, ссылке...",
      show: "Показать",
      found: "найдено",
      erase: "Стереть",
      selectedTopics: "Выбрано",
      emptyTagState: "Темы не выбраны",
    },
    de: {
      title: "Themen & Suche",
      subtitle: "Wähle Themen, um deinen Feed zu personalisieren.",
      searchPlaceholder: "Nach Kanal, Text, Link suchen...",
      show: "Anzeigen",
      found: "gefunden",
      erase: "Löschen",
      selectedTopics: "Ausgewählt",
      emptyTagState: "Keine Themen gewählt",
    },
    es: {
      title: "Temas y búsqueda",
      subtitle: "Elige temas para personalizar tu feed.",
      searchPlaceholder: "Buscar por canal, texto, enlace...",
      show: "Mostrar",
      found: "encontrados",
      erase: "Borrar",
      selectedTopics: "Seleccionados",
      emptyTagState: "No hay temas seleccionados",
    },
    tr: {
      title: "Konular ve arama",
      subtitle: "Akışını kişiselleştirmek için konuları seç.",
      searchPlaceholder: "Kanal, metin, bağlantı ile ara...",
      show: "Göster",
      found: "bulundu",
      erase: "Temizle",
      selectedTopics: "Seçildi",
      emptyTagState: "Konu seçilmedi",
    },
    fr: {
      title: "Thèmes et recherche",
      subtitle: "Choisis des thèmes pour personnaliser ton flux.",
      searchPlaceholder: "Rechercher par canal, texte, lien...",
      show: "Afficher",
      found: "trouvés",
      erase: "Effacer",
      selectedTopics: "Sélectionnés",
      emptyTagState: "Aucun thème sélectionné",
    },
    it: {
      title: "Temi e ricerca",
      subtitle: "Scegli i temi per personalizzare il feed.",
      searchPlaceholder: "Cerca per canale, testo, link...",
      show: "Mostra",
      found: "trovati",
      erase: "Cancella",
      selectedTopics: "Selezionati",
      emptyTagState: "Nessun tema selezionato",
    },
    "pt-br": {
      title: "Tópicos e busca",
      subtitle: "Escolha tópicos para personalizar seu feed.",
      searchPlaceholder: "Buscar por canal, texto, link...",
      show: "Mostrar",
      found: "encontrados",
      erase: "Apagar",
      selectedTopics: "Selecionados",
      emptyTagState: "Nenhum tópico selecionado",
    },
    id: {
      title: "Topik & pencarian",
      subtitle: "Pilih topik untuk mempersonalisasi feed.",
      searchPlaceholder: "Cari berdasarkan channel, teks, link...",
      show: "Tampilkan",
      found: "ditemukan",
      erase: "Hapus",
      selectedTopics: "Dipilih",
      emptyTagState: "Belum ada topik dipilih",
    },
    pl: {
      title: "Tematy i wyszukiwanie",
      subtitle: "Wybierz tematy, aby spersonalizować feed.",
      searchPlaceholder: "Szukaj po kanale, tekście, linku...",
      show: "Pokaż",
      found: "znaleziono",
      erase: "Wyczyść",
      selectedTopics: "Wybrane",
      emptyTagState: "Nie wybrano tematów",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;
  const selectedCount = selectedTags.length;
  const hasSearchDraft = draftQuery.trim().length > 0;
  const canErase = selectedCount > 0 || hasSearchDraft || searchQuery.trim().length > 0;
  const hasPendingChanges = selectedCount > 0 || hasSearchDraft;

  const selectedLabels = useMemo(
    () => selectedTags.map((tag) => resolveTagLabel(tag, locale)).filter(Boolean),
    [selectedTags, locale]
  );

  const selectedSummary = useMemo(() => {
    if (selectedLabels.length === 0) {
      return copy.emptyTagState;
    }
    return buildSelectedSummary(selectedLabels);
  }, [selectedLabels, copy.emptyTagState]);

  const groups = useMemo(
    () =>
      SITE_TAG_GROUPS.map((group) => ({
        value: group.value as ContentTag,
        label: resolveTagLabel(group.value, locale),
        count: tagStats[group.value as ContentTag] ?? 0,
        selected: selectedTags.includes(group.value as ContentTag),
        expanded: expandedParents.has(group.value as ContentTag),
        children: group.children
          .filter((child) => !child.value.endsWith("_all"))
          .map((child) => ({
            value: child.value as ContentTag,
            label: resolveTagLabel(child.value, locale),
            count: tagStats[child.value as ContentTag] ?? 0,
            selected: selectedTags.includes(child.value as ContentTag),
          })),
      })),
    [locale, tagStats, selectedTags, expandedParents]
  );

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
    setExpandedParents(new Set());
  };

  const eraseDraftOnly = () => {
    setDraftQuery("");
  };

  const toggleParentExpanded = (tag: ContentTag) => {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
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

            <div className="mt-2 text-sm leading-6 text-secondary">
              {copy.subtitle}
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

            <div className="mt-3 text-sm text-secondary">
              {copy.selectedTopics}: <span className="text-primary">{selectedCount}</span>
            </div>

            {selectedCount > 0 ? (
              <div className="mt-2 text-sm text-primary">{selectedSummary}</div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-6">
            <div className="divide-y divide-[color:var(--border-soft)]">
              {groups.map((group) => (
                <div key={group.value} className="py-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleTag(group.value)}
                      className={`min-w-0 flex-1 py-3 text-left text-[15px] transition ${
                        group.selected ? "text-primary" : "text-secondary hover:text-primary"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="min-w-0 truncate">{group.label}</span>
                        <span className="shrink-0 text-sm text-secondary">+{group.count}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleParentExpanded(group.value)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
                      aria-label={group.expanded ? "Collapse" : "Expand"}
                    >
                      <ChevronDown
                        className={`h-5 w-5 transition ${group.expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>

                  {group.expanded ? (
                    <div className="flex flex-wrap gap-2 pb-2 pt-1">
                      {group.children.map((child) => (
                        <button
                          key={child.value}
                          type="button"
                          onClick={() => toggleTag(child.value)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            child.selected
                              ? "border-transparent bg-[color:var(--text-primary)] text-[color:var(--bg-app)]"
                              : "border-soft bg-surface text-secondary hover:bg-surface-soft hover:text-primary"
                          }`}
                        >
                          <span>{child.label}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs ${
                              child.selected
                                ? "bg-black/10 text-[color:var(--bg-app)]/80"
                                : "bg-app text-secondary"
                            }`}
                          >
                            {child.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
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
