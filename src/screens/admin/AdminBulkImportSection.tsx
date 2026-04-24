import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import {
  getParentTag,
  getRelatedChildTags,
  isChildTag,
  isParentTag,
  normalizeTagValues,
  resolveTagLabel,
} from "../../lib/tag-utils";
import { SITE_TAG_GROUPS } from "../../lib/tags";
import type { ContentTag } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";
import type { CountryCode } from "./admin.countries";

type AdminBulkImportSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  onImported: () => Promise<void>;
};

type ParentGroupState = {
  parentTag: ContentTag;
  childTags: ContentTag[];
};

type BulkSourceRow = {
  id: string;
  handle: string;
  title: string;
  note: string;
  active: boolean;
  tags: ContentTag[];
};

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function getParentTags(tags: ContentTag[]): ContentTag[] {
  const directParents = tags.filter(isParentTag) as ContentTag[];
  const parentsFromChildren = tags
    .map((value) => getParentTag(value)?.value)
    .filter(Boolean) as ContentTag[];

  return Array.from(new Set([...directParents, ...parentsFromChildren]));
}

function getChildTagsForParent(tags: ContentTag[], parentTag: ContentTag): ContentTag[] {
  return tags.filter((value): value is ContentTag => {
    if (!isChildTag(value)) return false;
    const parent = getParentTag(value);
    return parent?.value === parentTag;
  });
}

function getParentGroups(tags: ContentTag[]): ParentGroupState[] {
  return getParentTags(tags).map((parentTag) => ({
    parentTag,
    childTags: getChildTagsForParent(tags, parentTag),
  }));
}

function buildTagPayload(groups: ParentGroupState[]) {
  const values = groups.flatMap((group) => [group.parentTag, ...group.childTags]);
  return normalizeTagValues(values) as ContentTag[];
}

function createRow(): BulkSourceRow {
  return {
    id: Math.random().toString(36).slice(2),
    handle: "",
    title: "",
    note: "",
    active: true,
    tags: ["other"],
  };
}

export function AdminBulkImportSection({
  telegramUserId,
  countryCode,
  onImported,
}: AdminBulkImportSectionProps) {
  const [rows, setRows] = useState<BulkSourceRow[]>([createRow(), createRow()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [openTagRows, setOpenTagRows] = useState<Record<string, boolean>>({});

  const validRows = useMemo(() => rows.filter((row) => normalizeHandle(row.handle)), [rows]);

  const updateRow = <K extends keyof BulkSourceRow>(
    rowId: string,
    key: K,
    value: BulkSourceRow[K]
  ) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  };

  const toggleParentTag = (rowId: string, parentTag: ContentTag) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const groups = getParentGroups(row.tags);
        const exists = groups.some((group) => group.parentTag === parentTag);

        if (exists) {
          const next = buildTagPayload(groups.filter((group) => group.parentTag !== parentTag));
          return { ...row, tags: next.length > 0 ? next : (["other"] as ContentTag[]) };
        }

        return { ...row, tags: buildTagPayload([...groups, { parentTag, childTags: [] }]) };
      })
    );
  };

  const toggleChildTag = (rowId: string, childTag: ContentTag) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;

        const parentValue = getParentTag(childTag)?.value as ContentTag | undefined;
        if (!parentValue) return row;

        const groups = getParentGroups(row.tags);
        const groupIndex = groups.findIndex((group) => group.parentTag === parentValue);

        if (groupIndex === -1) {
          return {
            ...row,
            tags: buildTagPayload([
              ...groups,
              {
                parentTag: parentValue,
                childTags: [childTag],
              },
            ]),
          };
        }

        const nextGroups = [...groups];
        const group = nextGroups[groupIndex];
        const hasChild = group.childTags.includes(childTag);

        nextGroups[groupIndex] = {
          ...group,
          childTags: hasChild
            ? group.childTags.filter((value) => value !== childTag)
            : [...group.childTags, childTag],
        };

        return { ...row, tags: buildTagPayload(nextGroups) };
      })
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createRow()]);
  };

  const toggleRowTagsOpen = (rowId: string) => {
    setOpenTagRows((prev) => ({ ...prev, [rowId]: !prev[rowId] }));
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createRow()];
    });
  };

  const submit = async () => {
    if (!telegramUserId) return;

    const payload = validRows.map((row) => {
      const normalizedTags = buildTagPayload(getParentGroups(row.tags));
      const parentTags = getParentTags(normalizedTags);

      return {
        handle: normalizeHandle(row.handle),
        title: row.title.trim(),
        note: row.note.trim(),
        status: row.active ? "active" : "paused",
        countryCode,
        tags: normalizedTags,
        defaultTag: parentTags[0] || "other",
      };
    });

    if (!payload.length) {
      setMessage("Добавь хотя бы один валидный канал");
      return;
    }

    if (payload.some((row) => !row.tags.length)) {
      setMessage("В каждой строке выбери хотя бы одну родительскую категорию");
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
      setRows([createRow(), createRow()]);
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить пачку каналов");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminSectionCard
      title="Пакетное добавление каналов"
      subtitle="Добавляй сколько нужно строк, указывай новые категории сразу и загружай одной кнопкой."
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
          {rows.map((row, index) => {
            const selectedParentGroups = getParentGroups(row.tags);

            return (
              <div key={row.id} className="rounded-[28px] border border-white/10 bg-[#101119] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-white">Канал #{index + 1}</div>

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

                <div className="mt-4 rounded-[22px] border border-white/10 bg-[#151722] px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleRowTagsOpen(row.id)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">Категории канала</div>
                      <div className="mt-1 text-xs text-white/45">
                        {selectedParentGroups.length > 0
                          ? `Выбрано: ${selectedParentGroups.length}`
                          : "Теги свёрнуты. Разверни только если нужно изменить категории."}
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-white/70 transition ${openTagRows[row.id] ? "rotate-180" : ""}`}
                    />
                  </button>

                  {openTagRows[row.id] ? (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {SITE_TAG_GROUPS.map((group) => {
                          const isActive = selectedParentGroups.some((item) => item.parentTag === group.value);
                          const childCount =
                            selectedParentGroups.find((item) => item.parentTag === group.value)?.childTags.length || 0;

                          return (
                            <button
                              key={group.value}
                              type="button"
                              onClick={() => toggleParentTag(row.id, group.value as ContentTag)}
                              className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                                isActive
                                  ? "border-white bg-white text-black"
                                  : "border-white/10 bg-white/5 text-white/85 hover:bg-white/10"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-medium">
                                  {resolveTagLabel(group.value, "ru") || group.value}
                                </span>
                                {childCount > 0 ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] ${
                                      isActive ? "bg-black/10 text-black/70" : "bg-white/10 text-white/65"
                                    }`}
                                  >
                                    +{childCount}
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {selectedParentGroups.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {selectedParentGroups.map((group) => {
                            const childOptions = getRelatedChildTags(group.parentTag)
                              .filter((tag) => !tag.value.endsWith("_all"))
                              .map((tag) => tag.value as ContentTag);

                            if (childOptions.length === 0) return null;

                            return (
                              <div key={group.parentTag} className="rounded-[18px] border border-white/10 bg-[#10121a] p-3">
                                <div className="mb-2 text-xs font-semibold text-white/70">
                                  Подтеги · {resolveTagLabel(group.parentTag, "ru")}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {childOptions.map((childTag) => {
                                    const isActive = group.childTags.includes(childTag);

                                    return (
                                      <button
                                        key={childTag}
                                        type="button"
                                        onClick={() => toggleChildTag(row.id, childTag)}
                                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                                          isActive
                                            ? "border-[#7dd3fc] bg-[#7dd3fc]/15 text-[#d9f3ff]"
                                            : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                        }`}
                                      >
                                        {resolveTagLabel(childTag, "ru") || childTag}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedParentGroups.length > 0 ? (
                      selectedParentGroups.flatMap((group) => [
                        <div
                          key={`parent-${row.id}-${group.parentTag}`}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white"
                        >
                          {resolveTagLabel(group.parentTag, "ru")}
                        </div>,
                        ...group.childTags.map((tag) => (
                          <div
                            key={`${row.id}-${tag}`}
                            className="rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-3 py-1.5 text-xs text-[#d9f3ff]"
                          >
                            {resolveTagLabel(tag, "ru")}
                          </div>
                        )),
                      ])
                    ) : (
                      <div className="rounded-full border border-dashed border-white/10 px-3 py-1.5 text-xs text-white/40">
                        Категории ещё не выбраны
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
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
