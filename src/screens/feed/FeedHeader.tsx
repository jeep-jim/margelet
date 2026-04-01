import { Search, X } from "lucide-react";
import type { ContentTag } from "../../types/app";
import { TAG_OPTIONS } from "./feed.constants";
import type { FeedHeaderProps } from "./feed.types";

const CONTENT_TAG_OPTIONS: Array<{ value: ContentTag; label: string }> =
  TAG_OPTIONS.filter(
    (tag): tag is { value: ContentTag; label: string } => tag.value !== "all"
  );

export function FeedHeader({
  selectedTags,
  toggleTag,
  clearTags,
  searchQuery,
  setSearchQuery,
  tagsOpen,
  setTagsOpen,
}: FeedHeaderProps) {
  const selectedCount = selectedTags.length;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-3">
      <div className="hidden md:block">
        <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-neutral-950">
                Фильтр ленты
              </div>
              <div className="mt-1 text-sm leading-6 text-neutral-500">
                Выбери интересные темы. Если ничего не выбрано — показываем всё.
              </div>
            </div>

            <button
              type="button"
              onClick={clearTags}
              className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
            >
              Очистить всё
            </button>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Поиск по каналу, тексту, ссылке..."
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
        </div>
      </div>

      <div className="md:hidden">
        {tagsOpen ? (
          <div className="rounded-[24px] border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-neutral-950">
                  Темы и поиск
                </div>
                <div className="mt-1 text-sm leading-6 text-neutral-500">
                  {selectedCount > 0
                    ? `Выбрано тем: ${selectedCount}`
                    : "Выбери темы, чтобы персонализировать ленту."}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTagsOpen(false)}
                className="rounded-full bg-neutral-100 p-2 text-neutral-700"
                aria-label="Закрыть фильтры"
                title="Закрыть фильтры"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск по ленте..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-950 outline-none placeholder:text-neutral-400"
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
                Очистить всё
              </button>

              <div className="text-xs text-neutral-400">
                {selectedCount > 0 ? `Тем выбрано: ${selectedCount}` : "Все темы"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-[20px] border border-neutral-200 bg-white px-4 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-950">
                Темы и поиск
              </div>
              <div className="truncate text-xs text-neutral-500">
                {selectedCount > 0
                  ? `Выбрано тем: ${selectedCount}`
                  : "Нажми на кнопку слева в шапке"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setTagsOpen(true)}
              className="rounded-full bg-neutral-950 px-4 py-2 text-sm text-white"
            >
              Открыть
            </button>
          </div>
        )}
      </div>
    </div>
  );
}