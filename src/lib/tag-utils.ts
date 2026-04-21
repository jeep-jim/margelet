import type { SiteLocale } from "./locales";
import {
  ALL_SITE_TAGS,
  findTagByValue,
  findTagGroupByChildValue,
  findTagGroupByValue,
  getTagLabel,
  isChildTagValue,
  isParentTagValue,
  type SiteTag,
} from "./tags";

/**
 * Старый безопасный формат:
 * вернуть объект тега по value
 */
export function resolveTag(value?: string | null): SiteTag | undefined {
  if (!value) return undefined;
  return findTagByValue(value);
}

/**
 * Подпись тега для UI
 */
export function resolveTagLabel(
  value: string | undefined | null,
  locale: SiteLocale
): string {
  const tag = resolveTag(value);

  if (!tag) return "";

  return getTagLabel(tag, locale);
}

/**
 * Проверка существования тега
 */
export function isKnownTag(value?: string | null): boolean {
  if (!value) return false;
  return !!findTagByValue(value);
}

/**
 * Все теги (для legacy UI)
 */
export function getAllTags(): SiteTag[] {
  return ALL_SITE_TAGS;
}

/**
 * Это родитель?
 */
export function isParentTag(value?: string | null): boolean {
  if (!value) return false;
  return isParentTagValue(value);
}

/**
 * Это подтег?
 */
export function isChildTag(value?: string | null): boolean {
  if (!value) return false;
  return isChildTagValue(value);
}

/**
 * Найти родителя:
 * - если value уже родитель => вернуть его
 * - если value подтег => вернуть группу
 */
export function getParentTag(
  value?: string | null
): SiteTag | undefined {
  if (!value) return undefined;

  const direct = findTagGroupByValue(value);
  if (direct) {
    return {
      value: direct.value,
      emoji: direct.emoji,
      labels: direct.labels,
    };
  }

  const parent = findTagGroupByChildValue(value);
  if (!parent) return undefined;

  return {
    value: parent.value,
    emoji: parent.emoji,
    labels: parent.labels,
  };
}

/**
 * Получить child tags выбранного значения
 * если parent => children
 * если child => children его родителя
 */
export function getRelatedChildTags(value?: string | null): SiteTag[] {
  if (!value) return [];

  const group =
    findTagGroupByValue(value) ??
    findTagGroupByChildValue(value);

  return group?.children ?? [];
}

/**
 * Главный тег для карточки:
 * если выбран child => показываем parent
 * если выбран parent => его и показываем
 */
export function getPrimaryDisplayTag(
  values: string[] | undefined,
  locale: SiteLocale
): string {
  if (!values?.length) return "";

  const first = values[0];
  const parent = getParentTag(first);

  if (parent) {
    return getTagLabel(parent, locale);
  }

  return resolveTagLabel(first, locale);
}

/**
 * Дополнительные теги для карточки:
 * child tags без повторения parent
 */
export function getSecondaryDisplayTags(
  values: string[] | undefined,
  locale: SiteLocale
): string[] {
  if (!values?.length) return [];

  const result: string[] = [];
  const used = new Set<string>();

  for (const value of values) {
    const tag = resolveTag(value);
    if (!tag) continue;

    if (isParentTag(value)) continue;

    const label = getTagLabel(tag, locale);

    if (!used.has(label)) {
      used.add(label);
      result.push(label);
    }
  }

  return result;
}

/**
 * Нормализация входящих тегов:
 * убираем пустое
 * убираем дубли
 * убираем мусор
 */
export function normalizeTagValues(
  values?: string[] | null
): string[] {
  if (!values?.length) return [];

  const result: string[] = [];
  const used = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    if (!isKnownTag(value)) continue;
    if (used.has(value)) continue;

    used.add(value);
    result.push(value);
  }

  return result;
}

/**
 * Если пришёл child tag —
 * можно понять родителя для фильтрации
 */
export function matchesTagFilter(
  postTags: string[] | undefined,
  selectedTag: string | undefined
): boolean {
  if (!selectedTag) return true;
  if (!postTags?.length) return false;

  const normalized = normalizeTagValues(postTags);

  if (normalized.includes(selectedTag)) {
    return true;
  }

  // если выбран parent, а пост содержит child
  if (isParentTag(selectedTag)) {
    return normalized.some((tag) => {
      const parent = getParentTag(tag);
      return parent?.value === selectedTag;
    });
  }

  // если выбран child, а пост содержит parent
  const selectedParent = getParentTag(selectedTag);
  if (!selectedParent) return false;

  return normalized.includes(selectedParent.value);
}