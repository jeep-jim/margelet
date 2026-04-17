import { useEffect, useMemo, useState } from "react";
import type { ContentTag } from "../../types/app";
import { formatDate, getTagLabel } from "./admin.helpers";
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

function getAvatarUrl(source: TrustedSource) {
  if (typeof source.avatarUrl === "string") {
    return source.avatarUrl.trim() || null;
  }

  return null;
}

function pickSourceTags(source: TrustedSource): ContentTag[] {
  const tags = Array.isArray(source.tags) ? source.tags.filter(Boolean) : [];
  if (tags.length > 0) return Array.from(new Set(tags));
  return [source.defaultTag];
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
    />
  );
}

export function AdminSourcesSection({
  telegramUserId,
  countryCode,
  sources,
  onSourcesReload,
}: AdminSourcesSectionProps) {
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>(["other"]);
  const [status, setStatus] = useState<TrustedSource["status"]>("active");
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
        ...(source.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sources, query, countryCode]);

  const activeCount = filteredSources.filter((source) => source.status === "active").length;

  const resetForm = () => {
    setEditingId(null);
    setHandle("");
    setTitle("");
    setSelectedTags(["other"]);
    setStatus("active");
    setNote("");
  };

  useEffect(() => {
    if (!editingId) return;
    const current = filteredSources.find((item) => item.id === editingId);
    if (!current) {
      resetForm();
    }
  }, [editingId, filteredSources]);

  const handleEdit = (source: TrustedSource) => {
    setEditingId(source.id);
    setHandle(source.handle);
    setTitle(source.title);
    setSelectedTags(pickSourceTags(source));
    setStatus(source.status);
    setNote(source.note || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleTag = (tag: ContentTag) => {
    setSelectedTags((prev) => {
      const exists = prev.includes(tag);
      if (exists) {
        const next = prev.filter((item) => item !== tag);
        return next.length ? next : ["other"];
      }
      return [...prev, tag];
    });
  };

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

    const tags = Array.from(new Set(selectedTags.length ? selectedTags : ["other"]));

    try {
      setSaving(true);

      const res = await fetch("/api/admin-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          countryCode,
          id: editingId,
          handle: handle.trim(),
          title: title.trim(),
          defaultTag: tags[0],
          tags,
          status,
          note: note.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "save source failed");
      }

      resetForm();

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
        const tags = Array.from(new Set(selectedTags.length ? selectedTags : ["other"]));
        const res = await fetch("/api/admin-posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "sources",
            telegramUserId,
            countryCode,
            handle: bulkHandle,
            title: bulkHandle,
            defaultTag: tags[0],
            tags,
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

      if (editingId === source.id) {
        resetForm();
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
      title="Каналы"
      subtitle="Одна компактная сетка по выбранной стране. Здесь же редактирование, теги и статусы."
      collapsible
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {filteredSources.length} total · {activeCount} active
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-[#12131a] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <div className="text-sm font-medium text-white">
                {editingId ? "Редактировать канал" : "Добавить канал"}
              </div>
              <div className="text-xs text-white/40">Страна: {countryCode.toUpperCase()}</div>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80"
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
              className="rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Название канала"
              className="rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Короткая заметка / комментарий"
              className="rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as TrustedSource["status"])}
              className="rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
            >
              <option value="active">активен</option>
              <option value="paused">пауза</option>
            </select>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-white">Теги канала</div>
            <div className="flex flex-wrap gap-2">
              {ADMIN_TAG_OPTIONS.map((item) => {
                const active = selectedTags.includes(item.value);
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => toggleTag(item.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      active
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={saving}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
            >
              {saving ? "сохраняю..." : editingId ? "сохранить" : "добавить канал"}
            </button>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="mb-2 text-sm font-medium text-white">Быстрая загрузка handles</div>
            <textarea
              value={bulkText}
              onChange={(event) => setBulkText(event.target.value)}
              placeholder="@bbc\n@cnn\n@reuters"
              className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
            />
            <div className="mt-3">
              <button
                type="button"
                onClick={() => {
                  void handleBulkImport();
                }}
                disabled={bulkSaving}
                className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {bulkSaving ? "загружаю..." : "добавить пачкой"}
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Поиск по названию, handle, тегам, заметке..."
            />
          </div>

          {filteredSources.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-white/35">
              Пока нет каналов для этой страны.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredSources.map((source) => {
                const avatarUrl = getAvatarUrl(source);
                const tags = pickSourceTags(source);
                const isDeleting = deletingId === source.id;

                return (
                  <div
                    key={source.id}
                    className="rounded-3xl border border-white/10 bg-[#12131a] p-3 transition hover:bg-[#161821]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/5 text-sm font-semibold text-white/45">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={source.title}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          source.title.slice(0, 1).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <div className="truncate text-sm font-semibold text-white">
                                {source.title}
                              </div>
                              {source.verified ? <span className="text-[13px]">✔️</span> : null}
                            </div>
                            <div className="truncate text-xs text-white/45">@{source.handle}</div>
                          </div>

                          <div
                            className={`rounded-full px-2.5 py-1 text-[11px] ${
                              source.status === "active"
                                ? "bg-green-500/15 text-green-300"
                                : "bg-white/10 text-white/55"
                            }`}
                          >
                            {source.status === "active" ? "active" : "paused"}
                          </div>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-white/45">
                          <div>
                            <div className="uppercase tracking-[0.16em] text-white/30">Checked</div>
                            <div className="mt-1 text-white/75">{formatDate(source.lastCheckedAt)}</div>
                          </div>
                          <div>
                            <div className="uppercase tracking-[0.16em] text-white/30">Imported</div>
                            <div className="mt-1 text-white/75">{source.importedPostsCount}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <div
                          key={`${source.id}-${tag}`}
                          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-white/80"
                        >
                          {getTagLabel(tag)}
                        </div>
                      ))}
                    </div>

                    {source.note ? (
                      <div className="mt-3 line-clamp-2 text-xs leading-5 text-white/45">{source.note}</div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(source)}
                        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black"
                      >
                        edit
                      </button>
                      <a
                        href={`https://t.me/${source.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white"
                      >
                        open
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(source);
                        }}
                        disabled={isDeleting}
                        className="rounded-full bg-red-500/90 px-3 py-1.5 text-xs text-white disabled:opacity-60"
                      >
                        {isDeleting ? "удаляю..." : "delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminSectionCard>
  );
}
