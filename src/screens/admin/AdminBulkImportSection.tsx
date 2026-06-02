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
import type { CountryCode } from "../../../api/lib/contracts";

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

function extractTelegramHandle(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const fromAt = raw.match(/@([A-Za-z0-9_]{4,})/);
  if (fromAt?.[1]) return normalizeHandle(fromAt[1]);

  const fromUrl = raw.match(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{4,})(?:[/?#\s]|$)/i);
  if (fromUrl?.[1]) return normalizeHandle(fromUrl[1]);

  if (/^[A-Za-z0-9_]{4,}$/.test(raw)) return normalizeHandle(raw);
  return "";
}

function normalizeTextKey(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim();
}

function buildTagAliasMap() {
  const aliases = new Map<string, ContentTag>();

  const addAlias = (label: string, value: string) => {
    const key = normalizeTextKey(label);
    if (key) aliases.set(key, value as ContentTag);
  };

  for (const group of SITE_TAG_GROUPS) {
    addAlias(group.value, group.value);
    addAlias(group.labels.ru, group.value);
    addAlias(group.labels.us, group.value);

    for (const child of group.children) {
      addAlias(child.value, child.value);
      addAlias(child.labels.ru, child.value);
      addAlias(child.labels.us, child.value);
    }
  }

  const manualAliases: Array<[string, ContentTag]> = [
    ["новости", "news"],
    ["сми", "news"],
    ["медиа", "news"],
    ["политика", "politics"],
    ["власть", "politics_government"],
    ["выборы", "politics_elections"],
    ["война", "war"],
    ["экономика", "economy"],
    ["рынки", "economy_markets"],
    ["бизнес", "business"],
    ["финансы", "finance"],
    ["крипта", "crypto"],
    ["технологии", "technology"],
    ["technology", "technology"],
    ["tech", "technology"],
    ["it", "technology"],
    ["тех", "technology"],
    ["интернет", "internet"],
    ["софт", "technology_software"],
    ["software", "technology_software"],
    ["apk", "technology_software"],
    ["гаджеты", "gadgets"],
    ["электроника", "electronics"],
    ["wylsacom", "gadgets"],
    ["ai", "ai"],
    ["ии", "ai"],
    ["наука", "science"],
    ["образование", "education"],
    ["мотивация", "education_self"],
    ["саморазвитие", "education_self"],
    ["курсы", "education_courses"],
    ["культура", "culture"],
    ["кино", "cinema"],
    ["фильмы", "cinema"],
    ["сериалы", "series"],
    ["netflix", "series"],
    ["подкасты", "people_interviews"],
    ["интервью", "people_interviews"],
    ["игры", "gaming"],
    ["юмор", "humor"],
    ["мемы", "memes"],
    ["спорт", "sports"],
    ["фитнес", "fitness"],
    ["здоровье", "health"],
    ["путешествия", "travel"],
    ["еда", "food"],
    ["психология", "psychology"],
    ["мода", "fashion"],
    ["красота", "beauty"],
    ["природа", "nature"],
    ["животные", "animals"],
    ["люди", "people"],
    ["блоги", "people_blogs"],
    ["маркетинг", "marketing"],
    ["стартапы", "startups"],
    ["работа", "jobs"],
    ["вакансии", "jobs_vacancies"],
    ["недвижимость", "real_estate"],
    ["транспорт", "auto"],
    ["авто", "transport_auto"],
    ["автомобили", "transport_auto"],
    ["машины", "transport_auto"],
    ["cars", "transport_auto"],
    ["car", "transport_auto"],
    ["auto", "transport_auto"],
    ["transport", "auto"],
    ["телеграм", "telegram"],
    ["telegram", "telegram"],
    ["ton", "telegram_ton"],
    ["боты", "telegram_bots"],
    ["каналы", "telegram_channels"],
    ["разное", "other"],
    ["другое", "other"],
    ["прочее", "other"],
    ["misc", "other"],
    ["other_misc", "other"],
  ];

  for (const [label, value] of manualAliases) addAlias(label, value);
  return aliases;
}

const TAG_ALIAS_MAP = buildTagAliasMap();

function parseTagsFromText(value: string): ContentTag[] {
  const raw = value
    .replace(/^[-–—•\s]*/, "")
    .replace(/^(теги|tags|категории|categories)\s*[:：-]?\s*/i, "");

  const chunks = raw
    .split(/[|/,;·•]+/)
    .map((part) => normalizeTextKey(part))
    .filter(Boolean);

  const tags: ContentTag[] = [];

  for (const chunk of chunks) {
    const exact = TAG_ALIAS_MAP.get(chunk);
    if (exact) {
      tags.push(exact);
      continue;
    }

    for (const [alias, value] of TAG_ALIAS_MAP.entries()) {
      if (alias.length < 3) continue;
      if (chunk === alias || chunk.includes(alias) || alias.includes(chunk)) {
        tags.push(value);
        break;
      }
    }
  }

  return normalizeTagValues(tags) as ContentTag[];
}


function inferTagsForSource(handle: string, title: string): ContentTag[] {
  const text = normalizeTextKey(`${handle} ${title}`);
  const pairs: Array<[RegExp, ContentTag[]]> = [
    [/\b(auto|avto|car|cars|truck|pickup|toyota|honda|bmw|geely|tesla|авто|машин|пикап|грузовик|электромоб)/i, ["transport_auto"]],
    [/\b(netflix|kino|film|movie|serial|series|кино|фильм|сериал|эфория)/i, ["series"]],
    [/\b(recipe|recipes|food|cook|kitchen|кухн|рецепт|еда|мамины рецепты)/i, ["recipes"]],
    [/\b(crypto|bitcoin|btc|ton|binance|trading|крипт|биткоин|трейдинг)/i, ["crypto"]],
    [/\b(bank|finance|money|бизнес|финанс|банк|сбер|миллион)/i, ["finance"]],
    [/\b(news|live|новост|сми|112|breaking)/i, ["news_all"]],
    [/\b(polit|war|воен|войн|полит|адекват|подоляка|монтян)/i, ["politics_opinion"]],
    [/\b(tproger|program|dev|code|software|apk|tech|технолог|програм|бэкдор|софт)/i, ["technology"]],
    [/\b(wylsa|gadget|iphone|apple|android|электрон|гаджет)/i, ["gadgets"]],
    [/\b(marketing|marketplace|smm|маркетинг|маркетплейс|ozon|wildberries)/i, ["marketing"]],
    [/\b(travel|avia|авиа|путеше|тур|отел|победа|aviasales)/i, ["travel"]],
    [/\b(nature|animal|живот|природ|птиц|мир и животные)/i, ["nature"]],
    [/\b(sport|football|спорт|футбол|матч)/i, ["sports"]],
    [/\b(game|gaming|steam|игр)/i, ["gaming"]],
    [/\b(psychology|психолог|отношен)/i, ["psychology"]],
    [/\b(education|course|study|образован|курс|саморазвит|мотивац)/i, ["education"]],
  ];

  for (const [pattern, tags] of pairs) {
    if (pattern.test(text)) return normalizeTagValues(tags) as ContentTag[];
  }

  return ["other"];
}

function parseBulkSourceInput(value: string): BulkSourceRow[] {
  const rows: BulkSourceRow[] = [];
  const seen = new Set<string>();

  for (const rawLine of value.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) continue;

    const parts = line
      .split("|")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length < 2) continue;

    const link = parts[0];
    const title = parts[1];

    const handle = extractTelegramHandle(link);

    if (!handle) continue;
    if (seen.has(handle)) continue;

    seen.add(handle);

    const tagParts = parts.filter((part) =>
      /^(теги|tags|категории|categories)\s*[:：-]?/i.test(part)
    );

    const parsedTags = tagParts.flatMap((part) => parseTagsFromText(part));
    let tags: ContentTag[] = parsedTags.length > 0
      ? (normalizeTagValues(parsedTags) as ContentTag[])
      : inferTagsForSource(handle, title);

    rows.push({
      ...createRow(),
      handle,
      title: title.trim(),
      tags,
    });
  }

  return rows;
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
  const [bulkLinksText, setBulkLinksText] = useState("");

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

  const appendBulkLinks = () => {
    const parsedRows = parseBulkSourceInput(bulkLinksText);

    if (!parsedRows.length) {
      setMessage("Не нашёл валидные Telegram-ссылки. Вставь строки вида https://t.me/channel или @channel.");
      return;
    }

    setRows((prev) => {
      const existingHandles = new Set(prev.map((row) => normalizeHandle(row.handle)).filter(Boolean));
      const nextRows = parsedRows.filter((row) => !existingHandles.has(normalizeHandle(row.handle)));
      const cleanedPrev = prev.filter(
        (row) => normalizeHandle(row.handle) || row.title.trim() || row.note.trim()
      );
      const mergedRows = [...cleanedPrev, ...nextRows];

      return mergedRows.length ? mergedRows : [createRow()];
    });

    setMessage(`Добавлено строк из текста: ${parsedRows.length}`);
    setBulkLinksText("");
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
        countryCode: countryCode.toLowerCase() as CountryCode,
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
      title="➕ Добавить"
      subtitle=""
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

        <div className="rounded-[24px] border border-white/10 bg-[#0d1220] p-3 sm:p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
            Много ссылок сразу
          </div>
          <textarea
            value={bulkLinksText}
            onChange={(event) => setBulkLinksText(event.target.value)}
            placeholder={"https://t.me/channel_one\n@channel_two\nНазвание | @channel_three | https://t.me/channel_three"}
            rows={5}
            className="w-full resize-y rounded-2xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={appendBulkLinks}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/85 transition hover:bg-white/10"
            >
              разобрать ссылки в строки
            </button>
            <div className="text-xs text-white/45">
              Каждая ссылка станет отдельной строкой. Дальше можно проставить названия и категории.
            </div>
          </div>
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
