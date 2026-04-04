import { useMemo, useState } from "react";
import type { CountryCode } from "./admin.countries";
import type { TrustedSource } from "./admin.types";
import { AdminSectionCard } from "./AdminSectionCard";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";

type AdminSourcesSectionProps = {
  countryCode: CountryCode;
  sources: TrustedSource[];
};

export function AdminSourcesSection({
  countryCode,
  sources,
}: AdminSourcesSectionProps) {
  const [query, setQuery] = useState("");

  const filteredSources = useMemo(() => {
    const q = query.trim().toLowerCase();

    return sources.filter((source) => {
      if (source.countryCode !== countryCode) return false;
      if (!q) return true;

      return [
        source.title,
        source.handle,
        source.note || "",
        source.defaultTag,
        source.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sources, query, countryCode]);

  return (
    <AdminSectionCard
      title="Источники"
      subtitle="Доверенные публичные каналы этой страны. Это заготовка под автопарсинг."
      right={
        <button
          type="button"
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70"
          disabled
        >
          скоро добавим
        </button>
      }
    >
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию, handle, заметке..."
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <div className="rounded-xl border border-dashed border-white/10 bg-[#1a1b24] px-4 py-3 text-sm text-white/35">
          страна: {countryCode.toUpperCase()}
        </div>

        <div className="rounded-xl border border-dashed border-white/10 bg-[#1a1b24] px-4 py-3 text-sm text-white/35">
          всего: {filteredSources.length}
        </div>
      </div>

      {filteredSources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/35">
          Пока нет каналов для этой страны. Здесь позже появится список trusted public channels.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSources.map((source) => {
            const tagLabel =
              ADMIN_TAG_OPTIONS.find((item) => item.value === source.defaultTag)?.label ||
              source.defaultTag;

            return (
              <div
                key={source.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold text-white">
                      {source.title}
                    </div>
                    <div className="truncate text-sm text-white/50">
                      @{source.handle}
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs ${
                      source.status === "active"
                        ? "bg-green-500/15 text-green-300"
                        : "bg-yellow-500/15 text-yellow-300"
                    }`}
                  >
                    {source.status === "active" ? "активен" : "пауза"}
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-white/70 md:grid-cols-2">
                  <div>Страна: {source.countryCode.toUpperCase()}</div>
                  <div>Тег по умолчанию: {tagLabel}</div>
                  <div>
                    Последний post id: {source.lastSeenPostId ?? "—"}
                  </div>
                  <div>
                    Импортировано постов: {source.importedPostsCount}
                  </div>
                  <div>
                    Последняя проверка: {source.lastCheckedAt || "—"}
                  </div>
                  <div>
                    Последний импорт: {source.lastImportedAt || "—"}
                  </div>
                </div>

                {source.note ? (
                  <div className="mt-3 text-sm text-white/60">{source.note}</div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </AdminSectionCard>
  );
}