import { AlertCircle, CheckCircle2, ChevronDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { normalizeTelegramUrl } from "../../lib/telegram";
import type { ContentTag } from "../../types/app";
import type { CountryCode } from "./admin.countries";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";
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

export function AdminManualPostSection({
  telegramUserId,
  countryCode,
  onSubmitted,
}: AdminManualPostSectionProps) {
  const [url, setUrl] = useState("");
  const [selectedTag, setSelectedTag] = useState<ContentTag>("other");
  const [tagsOpen, setTagsOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const parsedPost = useMemo(() => parseTelegramPostUrl(url), [url]);

  const validationMessage = useMemo(() => {
    if (!url.trim()) return "";
    if (parsedPost) return "";
    return "Нужна публичная ссылка вида t.me/channel/123. Приватные и кривые ссылки сюда не подходят.";
  }, [parsedPost, url]);

  const selectedTagLabel =
    ADMIN_TAG_OPTIONS.find((item) => item.value === selectedTag)?.label || "☝️ Другое";

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

    try {
      setSubmitState("submitting");

      const res = await fetch("/api/submit-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: normalized,
          tag: selectedTag,
          tags: [selectedTag],
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
      setTagsOpen(false);
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
      defaultCollapsed={false}
    >
      <div className="rounded-[24px] border border-white/10 bg-[#0d1220] p-4 sm:p-5">
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

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/35">
              Тег
            </div>
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 text-left text-sm text-white transition hover:bg-white/[0.07]"
            >
              <span>{selectedTagLabel}</span>
              <ChevronDown className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`} />
            </button>

            {tagsOpen ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {ADMIN_TAG_OPTIONS.map((tag) => {
                  const active = selectedTag === tag.value;

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag.value);
                        setTagsOpen(false);
                      }}
                      className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-white text-black"
                          : "bg-white/8 text-white/78 hover:bg-white/12"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          {submitMessage ? (
            <div
              className={`flex items-start gap-2 rounded-2xl px-4 py-3 text-sm ${
                submitState === "success"
                  ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  : submitState === "error"
                    ? "border border-red-400/20 bg-red-500/10 text-red-200"
                    : "border border-white/10 bg-white/5 text-white/70"
              }`}
            >
              {submitState === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : submitState === "error" ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <Plus className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{submitMessage}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="text-sm text-white/55">
              Добавление идёт в страну <span className="font-semibold text-white">{countryCode.toUpperCase()}</span>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleSubmit();
              }}
              disabled={submitState === "submitting"}
              className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitState === "submitting" ? "добавляю..." : "добавить пост"}
            </button>
          </div>
        </div>
      </div>
    </AdminSectionCard>
  );
}
