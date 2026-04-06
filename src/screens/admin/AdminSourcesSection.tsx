import { useMemo, useState } from "react";
import type { ContentTag } from "../../types/app";
import type { CountryCode } from "./admin.countries";
import type { TrustedSource } from "./admin.types";
import { AdminSectionCard } from "./AdminSectionCard";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";

type AdminSourcesSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  sources: TrustedSource[];
  onSourcesReload?: () => Promise<void> | void;
};

export function AdminSourcesSection({
  telegramUserId,
  countryCode,
  sources,
  onSourcesReload,
}: AdminSourcesSectionProps) {
  const [query, setQuery] = useState("");

  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [defaultTag, setDefaultTag] = useState<ContentTag>("other");
  const [status] = useState<TrustedSource["status"]>("active");
  const [note, setNote] = useState("");

  const [bulkText, setBulkText] = useState("");

  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleSave = async () => {
    if (!telegramUserId) return;

    if (!handle.trim()) {
      window.alert("Укажи @handle канала");
      return;
    }

    if (!title.trim()) {
      window.alert("Укажи название канала");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/admin-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          countryCode,
          handle: handle.trim(),
          title: title.trim(),
          defaultTag,
          status,
          note: note.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "save source failed");
      }

      setHandle("");
      setTitle("");
      setDefaultTag("other");
      setNote("");

      if (onSourcesReload) {
        await onSourcesReload();
      }
    } catch (error: any) {
      window.alert(error?.message || "Не удалось сохранить источник");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!telegramUserId) return;

    const handles = bulkText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^@/, ""));

    if (handles.length === 0) {
      window.alert("Вставь хотя бы один handle");
      return;
    }

    try {
      setBulkSaving(true);

      for (const bulkHandle of handles) {
        const res = await fetch("/api/admin-posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "sources",
            telegramUserId,
            countryCode,
            handle: bulkHandle,
            title: bulkHandle,
            defaultTag,
            status,
            note: null,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || `save source failed: ${bulkHandle}`);
        }
      }

      setBulkText("");

      if (onSourcesReload) {
        await onSourcesReload();
      }
    } catch (error: any) {
      window.alert(error?.message || "Не удалось загрузить пачку источников");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleDelete = async (source: TrustedSource) => {
    if (!telegramUserId) return;
    if (!window.confirm(`Удалить источник @${source.handle}?`)) return;

    try {
      setDeletingId(source.id);

      const res = await fetch("/api/admin-posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          id: source.id,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "delete source failed");
      }

      if (onSourcesReload) {
        await onSourcesReload();
      }
    } catch (error: any) {
      window.alert(error?.message || "Не удалось удалить источник");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminSectionCard
      title="Источники"
      subtitle="Доверенные публичные каналы этой страны. Отсюда позже пойдёт автопарсинг."
    >
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="@channel_handle"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название канала"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <select
          value={defaultTag}
          onChange={(event) => setDefaultTag(event.target.value as ContentTag)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
        >
          {ADMIN_TAG_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <div className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white/70">
          статус: {status === "active" ? "активен" : "пауза"}
        </div>

        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Заметка / комментарий"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35 md:col-span-2"
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
        >
          {saving ? "сохраняю..." : "добавить источник"}
        </button>

        <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
          страна: {countryCode.toUpperCase()}
        </div>

        <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/70">
          всего: {filteredSources.length}
        </div>
      </div>

      <div className="mt-4">
        <textarea
          value={bulkText}
          onChange={(event) => setBulkText(event.target.value)}
          placeholder="@bbc
@cnn
@reuters"
          className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            void handleBulkImport();
          }}
          disabled={bulkSaving}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
        >
          {bulkSaving ? "загружаю..." : "загрузить пачку"}
        </button>
      </div>

      <div className="mt-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск по названию, handle, заметке..."
          className="w-full rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />
      </div>

      {filteredSources.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-sm text-white/35">
          Пока нет каналов для этой страны.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
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
                  <div>Последний post id: {source.lastSeenPostId ?? "—"}</div>
                  <div>Импортировано постов: {source.importedPostsCount}</div>
                  <div>Последняя проверка: {source.lastCheckedAt || "—"}</div>
                  <div>Последний импорт: {source.lastImportedAt || "—"}</div>
                </div>

                {source.note ? (
                  <div className="mt-3 text-sm text-white/60">{source.note}</div>
                ) : null}

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleDelete(source);
                    }}
                    disabled={deletingId === source.id}
                    className="rounded-xl bg-red-500 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    {deletingId === source.id ? "Удаляю..." : "Удалить"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminSectionCard>
  );
}