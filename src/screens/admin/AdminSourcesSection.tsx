import { ChevronDown, Pencil } from "lucide-react";
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
import type { TrustedSource } from "./admin.types";

type AdminSourcesSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  sources: TrustedSource[];
  onSourcesReload: () => Promise<void>;
};

type SourceStatus = "active" | "paused";

type ParentGroupState = {
  parentTag: ContentTag;
  childTags: ContentTag[];
};

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
  const normalized = normalizeTagValues(
    Array.isArray(source.tags) && source.tags.length > 0
      ? source.tags
      : source.defaultTag
        ? [source.defaultTag]
        : []
  );

  return normalized.length > 0 ? (normalized as ContentTag[]) : EMPTY_TAGS;
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

function getTagSearchText(source: TrustedSource) {
  const tags = getSourceTags(source);

  return tags
    .map((value) => [value, resolveTagLabel(value, "ru")].join(" "))
    .join(" ")
    .toLowerCase();
}

function getInitials(source: TrustedSource) {
  const value = (source.title || source.handle || "?").trim();
  return value.slice(0, 1).toUpperCase();
}

function SourceAvatar({
  source,
  onAvatarClick,
}: {
  source: TrustedSource;
  onAvatarClick?: () => void;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const effectiveAvatar = source.avatarOverride || source.avatarUrl;
  const avatarUrl = effectiveAvatar?.startsWith("data:image/svg+xml")
    ? null
    : effectiveAvatar;
  const showImage = Boolean(avatarUrl) && !imageFailed;

  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white">
      {showImage && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={source.title || source.handle}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{getInitials(source)}</span>
      )}

      {onAvatarClick ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAvatarClick();
          }}
          className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white"
        >
          <Pencil className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
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
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);

  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<SourceStatus>("active");
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [sourceFormOpen, setSourceFormOpen] = useState(false);

  const selectedParentGroups = useMemo(() => getParentGroups(selectedTags), [selectedTags]);

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
          getTagSearchText(source),
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
    setTagsOpen(false);
  };

  const toggleParentTag = (parentTag: ContentTag) => {
    setSelectedTags((prev) => {
      const groups = getParentGroups(prev);
      const exists = groups.some((group) => group.parentTag === parentTag);

      if (exists) {
        return buildTagPayload(groups.filter((group) => group.parentTag !== parentTag));
      }

      return buildTagPayload([...groups, { parentTag, childTags: [] }]);
    });
  };

  const toggleChildTag = (childTag: ContentTag) => {
    setSelectedTags((prev) => {
      const parentValue = getParentTag(childTag)?.value as ContentTag | undefined;
      if (!parentValue) return prev;

      const groups = getParentGroups(prev);
      const groupIndex = groups.findIndex((group) => group.parentTag === parentValue);

      if (groupIndex === -1) {
        return buildTagPayload([
          ...groups,
          {
            parentTag: parentValue,
            childTags: [childTag],
          },
        ]);
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

      return buildTagPayload(nextGroups);
    });
  };

  const startEdit = (source: TrustedSource) => {
    setSourceFormOpen(true);
    setEditingId(source.id);
    setHandle(source.handle || "");
    setTitle(source.title || "");
    setNote(source.note || "");
    setStatus((source.status as SourceStatus) || "active");
    setSelectedTags(getSourceTags(source));
    setTagsOpen(false);
    setMessage(null);

    window.setTimeout(() => {
      document.getElementById("admin-source-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const saveSource = async () => {
    if (!telegramUserId) return;

    const normalizedHandle = normalizeHandle(handle);
    const normalizedTags = buildTagPayload(selectedParentGroups);
    const parentTags = getParentTags(normalizedTags);

    if (!normalizedHandle) {
      setMessage("Укажи handle канала");
      return;
    }

    if (parentTags.length === 0) {
      setMessage("Выбери хотя бы одну родительскую категорию");
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
            tags: normalizedTags,
            defaultTag: parentTags[0],
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


  const saveAvatarOverride = async (source: TrustedSource) => {
    if (!telegramUserId) return;

    const currentValue = source.avatarOverride || "";
    const nextValue = window.prompt(
      `Ссылка на аватарку для @${source.handle}.
Оставь пустым и нажми OK, чтобы очистить ручную аватарку.`,
      currentValue
    );

    if (nextValue === null) return;

    const normalizedAvatarOverride = nextValue.trim();

    try {
      setMessage(null);

      const response = await fetch("/api/admin-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          entity: "sources",
          action: "update",
          source: {
            id: source.id,
            countryCode: source.countryCode,
            handle: source.handle,
            avatarOverride: normalizedAvatarOverride,
            avatarOverrideTouched: true,
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Не удалось сохранить аватарку");
      }

      await onSourcesReload();
      setMessage(normalizedAvatarOverride ? "Аватарка обновлена" : "Ручная аватарка очищена");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Не удалось сохранить аватарку");
    }
  };

  return (
    <AdminSectionCard
      title="🌎 Каналы"
      collapsible
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {filteredSources.length} всего · {activeCount} активных
        </div>
      }
    >
      <div className="space-y-4">
        <div
          id="admin-source-form"
          className="rounded-[24px] border border-white/10 bg-[#11121a] p-3 sm:p-4"
        >
          <button
            type="button"
            onClick={() => setSourceFormOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 text-left"
          >
            <div>
              <div className="text-lg font-semibold text-white">
                {editingId ? "Редактировать канал" : "Добавить канал"}
              </div>
              <div className="text-sm text-white/45">
                Страна: {countryCode.toUpperCase()}
              </div>
            </div>

            <ChevronDown
              className={`h-5 w-5 shrink-0 text-white/70 transition ${
                sourceFormOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {sourceFormOpen ? (
            <>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="mt-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10"
                >
                  отменить
                </button>
              ) : null}

              <div className="mt-3 grid gap-3 md:grid-cols-2">
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

              <div className="mt-4 rounded-[22px] border border-white/10 bg-[#151722] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setTagsOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">Категории канала</div>
                    <div className="mt-1 text-xs text-white/45">
                      {selectedParentGroups.length > 0
                        ? `Выбрано: ${selectedParentGroups.length}`
                        : "Теги свёрнуты."}
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-white/70 transition ${
                      tagsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {tagsOpen ? (
                  <div className="mt-3 border-t border-white/10 pt-3">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {SITE_TAG_GROUPS.map((group) => {
                        const isActive = selectedParentGroups.some(
                          (item) => item.parentTag === group.value
                        );
                        const childCount =
                          selectedParentGroups.find(
                            (item) => item.parentTag === group.value
                          )?.childTags.length || 0;

                        return (
                          <button
                            key={group.value}
                            type="button"
                            onClick={() => toggleParentTag(group.value as ContentTag)}
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
                                    isActive
                                      ? "bg-black/10 text-black/70"
                                      : "bg-white/10 text-white/65"
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
                            <div
                              key={group.parentTag}
                              className="rounded-[18px] border border-white/10 bg-[#10121a] p-3"
                            >
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
                                      onClick={() => toggleChildTag(childTag)}
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
                        key={`parent-${group.parentTag}`}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white"
                      >
                        {resolveTagLabel(group.parentTag, "ru")}
                      </div>,
                      ...group.childTags.map((tag) => (
                        <div
                          key={tag}
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
            </>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-white/10 bg-[#11121a] p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-white">Список каналов</div>
              <div className="text-sm text-white/45">
                Поиск по названию, handle, заметкам и тегам.
              </div>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="поиск по каналам"
              className="w-full rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/25 sm:max-w-[320px]"
            />
          </div>

          <div className="grid gap-2 lg:grid-cols-2">
            {filteredSources.map((source) => {
              const tags = getSourceTags(source);
              const groups = getParentGroups(tags);
              const isExpanded = expandedSourceId === source.id;

              return (
                <div
                  key={source.id}
                  className="w-full overflow-hidden rounded-[18px] border border-white/10 bg-[#151722] px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedSourceId((current) =>
                        current === source.id ? null : source.id
                      )
                    }
                    className="flex w-full min-w-0 items-center justify-between gap-2 text-left"
                  >
                    <SourceAvatar
                      source={source}
                      onAvatarClick={() => {
                        void saveAvatarOverride(source);
                      }}
                    />

                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="truncate text-sm font-semibold text-white">
                        {source.title || "Без названия"}
                      </div>
                      <div className="truncate text-xs text-white/55">@{source.handle}</div>
                    </div>

                    <div
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
                        source.status === "active"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/10 text-white/55"
                      }`}
                    >
                      {source.status === "active" ? "✔" : "Ⅱ"}
                    </div>

                    <div className="ml-1 flex items-center">
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-white/60 transition ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="mt-3 border-t border-white/10 pt-3">
                      <div className="flex max-w-full flex-wrap gap-1.5 overflow-hidden">
                        {groups.flatMap((group) => [
                          <div
                            key={`card-parent-${group.parentTag}`}
                            className="max-w-full truncate rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs text-white"
                          >
                            {resolveTagLabel(group.parentTag, "ru")}
                          </div>,
                          ...group.childTags.map((tag) => (
                            <div
                              key={`card-child-${tag}`}
                              className="max-w-full truncate rounded-full border border-[#7dd3fc]/20 bg-[#7dd3fc]/10 px-2.5 py-1 text-xs text-[#d9f3ff]"
                            >
                              {resolveTagLabel(tag, "ru")}
                            </div>
                          )),
                        ])}

                        {groups.length === 0 ? (
                          <div className="rounded-full border border-dashed border-white/10 px-2.5 py-1 text-xs text-white/35">
                            без тегов
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-white/45">
                        <div>Создан: {formatDate(source.createdAt)}</div>
                        <div>Обновлён: {formatDate(source.updatedAt)}</div>
                        <div>Проверка: {formatDate(source.lastCheckedAt)}</div>
                        <div>Импорт: {formatDate(source.lastImportedAt)}</div>
                        <div>Постов: {source.importedPostsCount || 0}</div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(source)}
                          className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
                        >
                          редактировать
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void deleteSource(source);
                          }}
                          className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 transition hover:bg-red-500/15"
                        >
                          удалить
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {filteredSources.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-[#151722] px-4 py-8 text-center text-sm text-white/45">
              Каналы по выбранной стране не найдены.
            </div>
          ) : null}
        </div>
      </div>
    </AdminSectionCard>
  );
}
