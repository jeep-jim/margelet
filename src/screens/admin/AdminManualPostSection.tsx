import { AlertCircle, CheckCircle2, ChevronDown, Plus } from "lucide-react";
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
import { normalizeTelegramUrl } from "../../lib/telegram";
import type { ContentTag } from "../../types/app";
import type { CountryCode } from "./admin.countries";
import { AdminSectionCard } from "./AdminSectionCard";

type AdminManualPostSectionProps = {
  telegramUserId: string | null;
  countryCode: CountryCode;
  onSubmitted: () => Promise<void>;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type ParsedTelegramPost = {
  channel: string;
  postId: string;
};

type ParentGroupState = {
  parentTag: ContentTag;
  childTags: ContentTag[];
};

function parseTelegramPostUrl(raw: string): ParsedTelegramPost | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const normalized = normalizeTelegramUrl(value);
    if (!normalized) return null;

    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname !== "t.me" && hostname !== "telegram.me") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;

    const [channel, postId] = parts;

    if (!/^[A-Za-z0-9_]{4,}$/.test(channel)) return null;
    if (!/^\d+$/.test(postId)) return null;

    return { channel, postId };
  } catch {
    return null;
  }
}

function normalizeSubmitError(message: string) {
  const value = String(message || "").trim();

  if (!value) return "Не удалось добавить пост.";
  if (value === "Missing url") return "Вставь ссылку на Telegram-пост.";
  if (value === "Missing locale") return "Не выбрана страна.";
  if (value === "Invalid Telegram post URL") {
    return "Сейчас можно добавить только публичный Telegram-пост вида t.me/channel/123.";
  }
  if (value === "Failed to ingest Telegram post") {
    return "Telegram не отдал пост. Проверь ссылку и попробуй ещё раз.";
  }
  if (value === "Telegram auth required") {
    return "Для этого действия нужен Telegram admin access.";
  }

  return value;
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

export function AdminManualPostSection({
  telegramUserId,
  countryCode,
  onSubmitted,
}: AdminManualPostSectionProps) {
  const [url, setUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>(["other"]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [, setSubmitMessage] = useState("");
  const [tagsOpen, setTagsOpen] = useState(false);

  const parsedPost = useMemo(() => parseTelegramPostUrl(url), [url]);
  const selectedParentGroups = useMemo(() => getParentGroups(selectedTags), [selectedTags]);

  const validationMessage = useMemo(() => {
    if (!url.trim()) return "";
    if (parsedPost) return "";
    return "Нужна публичная ссылка вида t.me/channel/123. Приватные и кривые ссылки сюда не подходят.";
  }, [parsedPost, url]);

  const toggleParentTag = (parentTag: ContentTag) => {
    setSelectedTags((prev) => {
      const groups = getParentGroups(prev);
      const exists = groups.some((group) => group.parentTag === parentTag);

      if (exists) {
        const next = buildTagPayload(groups.filter((group) => group.parentTag !== parentTag));
        return next.length > 0 ? next : (["other"] as ContentTag[]);
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

  const handleSubmit = async () => {
    const cleanUrl = url.trim();
    setSubmitMessage("");

    if (!telegramUserId) {
      setSubmitState("error");
      setSubmitMessage("Нет admin Telegram access.");
      return;
    }

    if (!cleanUrl) {
      setSubmitState("error");
      setSubmitMessage("Вставь ссылку на Telegram-пост.");
      return;
    }

    if (!parsedPost) {
      setSubmitState("error");
      setSubmitMessage(
        "Сейчас можно добавить только публичный Telegram-пост вида t.me/channel/123."
      );
      return;
    }

    const normalized = normalizeTelegramUrl(cleanUrl);
    if (!normalized) {
      setSubmitState("error");
      setSubmitMessage("Не удалось распознать ссылку на Telegram-пост.");
      return;
    }

    const normalizedTags = buildTagPayload(selectedParentGroups);
    const parentTags = getParentTags(normalizedTags);

    if (parentTags.length === 0) {
      setSubmitState("error");
      setSubmitMessage("Выбери хотя бы одну родительскую категорию.");
      return;
    }

    try {
      setSubmitState("submitting");

      const res = await fetch("/api/submit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          tag: parentTags[0],
          tags: normalizedTags,
          role: "admin",
          locale: countryCode,
          addedByTelegramId: telegramUserId,
          addedByUsername: "admin",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Не удалось добавить пост.");
      }

      await onSubmitted();

      setSubmitState("success");
      setSubmitMessage(
        data?.duplicated
          ? "Этот пост уже был в ленте. Дубликат найден, ничего не сломалось."
          : "Пост добавлен вручную в выбранную страну."
      );
      setUrl("");
      setSelectedTags(["other"]);
    } catch (error: unknown) {
      setSubmitState("error");
      setSubmitMessage(
        normalizeSubmitError(error instanceof Error ? error.message : "Не удалось добавить пост.")
      );
    }
  };

  return (
    <AdminSectionCard
      title="Ручное добавление поста"
      subtitle="Быстрое ручное добавление одного Telegram-поста прямо в выбранную страну."
      badge={
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">
          {countryCode.toUpperCase()}
        </div>
      }
      collapsible
      defaultCollapsed
    >
      <div className="rounded-[22px] border border-white/10 bg-[#0d1220] p-3 sm:p-4">
        <div className="grid gap-4">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              Telegram пост
            </div>
            <input
              value={url}
              onChange={(event) => {
                if (submitState !== "idle") {
                  setSubmitState("idle");
                  setSubmitMessage("");
                }
                setUrl(event.target.value);
              }}
              placeholder="https://t.me/channel/123"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-white/20 focus:bg-white/[0.07]"
            />

            {validationMessage ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{validationMessage}</span>
              </div>
            ) : url.trim() && parsedPost ? (
              <div className="mt-3 flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Ссылка распознана: @{parsedPost.channel} / {parsedPost.postId}
                </span>
              </div>
            ) : null}
          </div>

          <div className="rounded-[22px] border border-white/10 bg-[#151722] px-4 py-3">
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">Категории поста</div>
                <div className="mt-1 text-xs text-white/45">
                  {selectedParentGroups.length > 0
                    ? `Выбрано: ${selectedParentGroups.length}`
                    : "Теги свёрнуты. Разверни только если нужно изменить категории."}
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-white/70 transition ${tagsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {tagsOpen ? (
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <div className="text-sm text-white/60">Добавление идёт в страну <span className="font-medium text-white">{countryCode.toUpperCase()}</span></div>
            <button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={submitState === "submitting"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {submitState === "submitting" ? "добавляю..." : "добавить пост"}
            </button>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  );
}
