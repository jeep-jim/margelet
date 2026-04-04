import { useState } from "react";
import type { ContentTag } from "../../types/app";
import { AdminSectionCard } from "./AdminSectionCard";
import { ADMIN_TAG_OPTIONS } from "./admin.tag-options";

type BulkResultItem = {
  url: string;
  status: "ok" | "error";
  error?: string;
};

type AdminBulkImportSectionProps = {
  telegramUserId: string | null;
  onImported?: () => Promise<void> | void;
};

function normalizeBulkError(message: string) {
  const value = String(message || "").trim();

  if (!value) return "ошибка";
  if (value === "Invalid Telegram post URL") return "невалидная ссылка";
  if (value === "Failed to ingest Telegram post") return "не удалось забрать пост";
  if (value === "Daily limit reached") return "дневной лимит";

  return value;
}

export function AdminBulkImportSection({
  telegramUserId,
  onImported,
}: AdminBulkImportSectionProps) {
  const [bulkText, setBulkText] = useState("");
  const [bulkTag, setBulkTag] = useState<ContentTag>("other");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResultItem[]>([]);

  const handleBulkSubmit = async () => {
    if (!telegramUserId) return;

    const urls = bulkText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (urls.length === 0) {
      window.alert("Вставь хотя бы одну ссылку");
      return;
    }

    try {
      setBulkLoading(true);
      setBulkResult([]);

      const results: BulkResultItem[] = [];

      for (const url of urls) {
        try {
          const res = await fetch("/api/submit-post", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              tag: bulkTag,
              role: "admin",
              plan: "free",
              addedByTelegramId: telegramUserId,
              addedByUsername: "admin",
            }),
          });

          const data = await res.json().catch(() => null);

          if (!res.ok) {
            results.push({
              url,
              status: "error",
              error: normalizeBulkError(data?.error || "ошибка"),
            });
          } else {
            results.push({
              url,
              status: "ok",
            });
          }
        } catch (error: any) {
          results.push({
            url,
            status: "error",
            error: normalizeBulkError(error?.message || "ошибка сети"),
          });
        }
      }

      setBulkResult(results);

      if (onImported) {
        await onImported();
      }
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <AdminSectionCard
      title="Массовый импорт постов"
      subtitle="Ручное добавление пачки ссылок. По умолчанию посты живут 24 часа."
    >
      <textarea
        value={bulkText}
        onChange={(event) => setBulkText(event.target.value)}
        placeholder={`https://t.me/channel_one/1
https://t.me/channel_two/2
https://t.me/channel_three/3`}
        className="h-36 w-full rounded-xl border border-white/10 bg-[#1a1b24] p-4 text-sm text-white outline-none placeholder:text-white/35"
      />

      <div className="mt-3 flex flex-col gap-3 md:flex-row">
        <select
          value={bulkTag}
          onChange={(event) => setBulkTag(event.target.value as ContentTag)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
        >
          {ADMIN_TAG_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            void handleBulkSubmit();
          }}
          disabled={bulkLoading}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
        >
          {bulkLoading ? "загружаю..." : "загрузить пачку"}
        </button>
      </div>

      {bulkResult.length > 0 ? (
        <div className="mt-4 space-y-2">
          {bulkResult.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`rounded-xl px-3 py-2 text-sm ${
                item.status === "ok"
                  ? "bg-green-500/15 text-green-300"
                  : "bg-red-500/15 text-red-300"
              }`}
            >
              <div>
                {item.status === "ok" ? "✅" : "❌"} {item.url}
              </div>
              {item.error ? (
                <div className="mt-1 text-xs opacity-80">{item.error}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </AdminSectionCard>
  );
}