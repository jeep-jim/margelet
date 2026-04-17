import { useMemo, useState } from "react";
import type { ContentTag } from "../../types/app";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";
import { AdminSectionCard } from "./AdminSectionCard";
import type { CountryCode } from "./admin.countries";

type AdminBulkImportSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  onImported: () => Promise<void>;
};

type BulkSourceRow = {
  id: string;
  handle: string;
  title: string;
  note: string;
  active: boolean;
  tags: ContentTag[];
};

function createRow(): BulkSourceRow {
  return {
    id: Math.random().toString(36).slice(2),
    handle: "",
    title: "",
    note: "",
    active: true,
    tags: [],
  };
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

export function AdminBulkImportSection({
  telegramUserId,
  countryCode,
  onImported,
}: AdminBulkImportSectionProps) {
  const [rows, setRows] = useState<BulkSourceRow[]>([createRow(), createRow(), createRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validRows = useMemo(
    () => rows.filter((row) => normalizeHandle(row.handle)),
    [rows]
  );

  const updateRow = <K extends keyof BulkSourceRow>(
    rowId: string,
    key: K,
    value: BulkSourceRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const toggleTag = (rowId: string, tag: ContentTag) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const nextTags = row.tags.includes(tag)
          ? row.tags.filter((item) => item !== tag)
          : [...row.tags, tag];

        return { ...row, tags: nextTags };
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createRow()];
    });
  };

  const submit = async () => {
    if (!telegramUserId) return;

    const payload = validRows.map((row) => ({
      handle: normalizeHandle(row.handle),
      title: row.title.trim(),
      note: row.note.trim(),
      status: row.active ? "active" : "paused",
      countryCode,
      tags: row.tags,
      defaultTag: row.tags[0] || "other",
    }));

    if (!payload.length) {
      setMessage("Добавь хотя бы один валидный канал");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "sources",
          action: "bulk-create",
          sources: payload,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось загрузить пачку каналов");
      }

      await onImported();
      setMessage(`Загружено каналов: ${data?.created || payload.length}`);
      setRows([createRow(), createRow(), createRow()]);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "Не удалось загрузить пачку каналов"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminSectionCard
      title="Пакетное добавление каналов"
      subtitle="Добавляй сколько нужно строк, указывай теги сразу и загружай одной кнопкой."
      collapsible
      defaultCollapsed
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {validRows.length} готово к загрузке
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[28px] border border-white/10 bg-[#11121a] p-4 text-sm text-white/55">
          Текущая страна: <span className="font-medium text-white">{countryCode.toUpperCase()}</span>
        </div>

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="rounded-[28px] border border-white/10 bg-[#101119] p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-white">
                  Канал #{index + 1}
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-400"
                >
                  удалить
                </button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={row.handle}
                  onChange={(event) => updateRow(row.id, "handle", event.target.value)}
                  placeholder="@channel_handle"
                  className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
                />

                <input
                  value={row.title}
                  onChange={(event) => updateRow(row.id, "title", event.target.value)}
                  placeholder="Название канала"
                  className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
                />
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px]">
                <input
                  value={row.note}
                  onChange={(event) => updateRow(row.id, "note", event.target.value)}
                  placeholder="Заметка / комментарий"
                  className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25"
                />

                <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-sm text-white">
                  <span>{row.active ? "активен" : "пауза"}</span>
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(event) => updateRow(row.id, "active", event.target.checked)}
                    className="h-4 w-4 accent-white"
                  />
                </label>
              </div>

              <div className="mt-4">
                <div className="mb-3 text-sm font-medium text-white">Теги</div>

                <div className="flex flex-wrap gap-2">
                  {ADMIN_TAG_OPTIONS.map((tagOption) => {
                    const isActive = row.tags.includes(tagOption.value);

                    return (
                      <button
                        key={tagOption.value}
                        type="button"
                        onClick={() => toggleTag(row.id, tagOption.value)}
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
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addRow}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 transition hover:bg-white/10"
          >
            + добавить ещё
          </button>

          <button
            type="button"
            onClick={() => {
              void submit();
            }}
            disabled={isSubmitting}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition disabled:opacity-60"
          >
            {isSubmitting ? "загружаю..." : "загрузить всё"}
          </button>

          {message ? <div className="text-sm text-white/65">{message}</div> : null}
        </div>
      </div>
    </AdminSectionCard>
  );
}