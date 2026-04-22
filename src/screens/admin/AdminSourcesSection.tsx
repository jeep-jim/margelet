import { useMemo, useState } from "react";
import type { ContentTag } from "../../types/app";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";
import { AdminSectionCard } from "./AdminSectionCard";
import type { CountryCode } from "./admin.countries";
import type { TrustedSource } from "./admin.types";

type AdminSourcesSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  sources: TrustedSource[];
  onSourcesReload: () => Promise<void>;
};

type SourceStatus = "active" | "paused";

const EMPTY_TAGS: ContentTag[] = [];

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("ru-RU");
  } catch {
    return value;
  }
}

function getSourceTags(source: TrustedSource): ContentTag[] {
  if (Array.isArray(source.tags) && source.tags.length > 0) return source.tags;
  if (source.defaultTag) return [source.defaultTag];
  return EMPTY_TAGS;
}

export function AdminSourcesSection({
  telegramUserId,
  countryCode,
  sources,
  onSourcesReload,
}: AdminSourcesSectionProps) {
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SourceStatus>("active");
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const filteredSources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sources
      .filter((source) => source.countryCode === countryCode)
      .filter((source) => {
        if (!query) return true;

        const haystack = [
          source.title || "",
          source.handle || "",
          source.note || "",
          ...(source.tags || []),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => {
        const aTime = a.lastCheckedAt ? new Date(a.lastCheckedAt).getTime() : 0;
        const bTime = b.lastCheckedAt ? new Date(b.lastCheckedAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [sources, countryCode, search]);

  const activeCount = filteredSources.filter((source) => source.status === "active").length;

  const resetForm = () => {
    setEditingId(null);
    setHandle("");
    setTitle("");
    setNote("");
    setStatus("active");
    setSelectedTags([]);
  };

  const toggleTag = (tag: ContentTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const startEdit = (source: TrustedSource) => {
    setEditingId(source.id);
    setHandle(source.handle || "");
    setTitle(source.title || "");
    setNote(source.note || "");
    setStatus((source.status as SourceStatus) || "active");
    setSelectedTags(getSourceTags(source));
    setMessage(null);
  };

  const saveSource = async () => {
    if (!telegramUserId) return;

    const normalizedHandle = normalizeHandle(handle);

    if (!normalizedHandle) {
      setMessage("Укажи handle канала");
      return;
    }

    try {
      setIsSaving(true);
      setMessage(null);

      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "sources",
          action: editingId ? "update" : "create",
          source: {
            id: editingId,
            handle: normalizedHandle,
            title: title.trim(),
            note: note.trim(),
            status,
            countryCode,
            tags: selectedTags,
            defaultTag: selectedTags[0] || "other",
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось сохранить канал");
      }

      await onSourcesReload();
      setMessage(editingId ? "Канал обновлён" : "Канал добавлен");
      resetForm();
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить канал");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSource = async (source: TrustedSource) => {
    if (!telegramUserId) return;
    if (!window.confirm(`Удалить канал @${source.handle}?`)) return;

    try {
      setMessage(null);

      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "sources",
          action: "delete",
          sourceId: source.id,
          countryCode: source.countryCode,
          handle: source.handle,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось удалить канал");
      }

      await onSourcesReload();

      if (editingId === source.id) {
        resetForm();
      }

      setMessage("Канал удалён");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить канал");
    }
  };

  return (
    <AdminSectionCard
      title="Каналы"
      subtitle="Компактная сетка по выбранной стране. Здесь же редактирование, теги и статусы."
      collapsible
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {filteredSources.length} всего · {activeCount} активных
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#11121a] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-white">
                {editingId ? "Редактировать канал" : "Добавить канал"}
              </div>
              <div className="text-sm text-white/45">Страна: {countryCode.toUpperCase()}</div>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
              >
                отменить
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="@channel_handle"
              className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
            />
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название канала"
              className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Короткая заметка / комментарий"
              className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as SourceStatus)}
              className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
            >
              <option value="active">активен</option>
              <option value="paused">пауза</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="mb-3 text-sm font-medium text-white">Теги канала</div>

            <div className="flex flex-wrap gap-2">
              {ADMIN_TAG_OPTIONS.map((tagOption) => {
                const isActive = selectedTags.includes(tagOption.value);

                return (
                  <button
                    key={tagOption.value}
                    type="button"
                    onClick={() => toggleTag(tagOption.value)}
                    className={`rounded-full border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {tagOption.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void saveSource();
              }}
              disabled={isSaving}
              className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition disabled:opacity-60"
            >
              {isSaving ? "сохраняю..." : editingId ? "сохранить" : "добавить канал"}
            </button>

            {message ? <div className="text-sm text-white/65">{message}</div> : null}
          </div>
        </div>

        <div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию, handle, тегам, заметке..."
            className="w-full rounded-2xl border border-white/10 bg-[#11121a] px-4 py-3 text-white outline-none placeholder:text-white/25"
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          {filteredSources.map((source) => {
            const tags = getSourceTags(source);

            return (
              <div
                key={source.id}
                className="rounded-[28px] border border-white/10 bg-[#101119] p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                    {source.avatarUrl ? (
                      <img
                        src={source.avatarUrl}
                        alt={source.title || source.handle}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-white/50">
                        {(source.title || source.handle || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-xl font-semibold text-white">
                            {source.title || source.handle}
                          </div>
                          {source.verified ? (
                            <span className="text-base leading-none text-sky-400">✔</span>
                          ) : null}
                        </div>

                        <div className="truncate text-sm text-white/45">@{source.handle}</div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs ${
                          source.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/10 text-white/65"
                        }`}
                      >
                        {source.status === "active" ? "active" : "пауза"}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/28">
                          Проверка
                        </div>
                        <div className="mt-1 text-white/72">
                          {formatDate(source.lastCheckedAt)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-white/28">
                          Импортировано
                        </div>
                        <div className="mt-1 text-white/72">
                          {source.importedPostsCount || 0}
                        </div>
                      </div>
                    </div>

                    {tags.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag) => {
                          const option = ADMIN_TAG_OPTIONS.find((item) => item.value === tag);

                          return (
                            <div
                              key={tag}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80"
                            >
                              {option?.label || tag}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(source)}
                        className="rounded-full bg-white px-4 py-2 text-sm text-black transition"
                      >
                        редактировать
                      </button>

                      <a
                        href={`https://t.me/${source.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/85 transition hover:bg-white/15"
                      >
                        открыть
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          void deleteSource(source);
                        }}
                        className="rounded-full bg-red-500 px-4 py-2 text-sm text-white transition hover:bg-red-400"
                      >
                        удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.025] px-4 py-8 text-center text-sm text-white/45">
            По этой стране пока нет каналов
          </div>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}