import { useMemo, useState } from "react";
import type { ContentTag } from "../../types/app";
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

export function AdminSourcesSection({
  telegramUserId,
  countryCode,
  sources,
  onSourcesReload,
}: AdminSourcesSectionProps) {
  const [query, setQuery] = useState("");

  // одиночный
  const [handle, setHandle] = useState("");
  const [title, setTitle] = useState("");

  // массовый
  const [bulkText, setBulkText] = useState("");

  const [defaultTag, setDefaultTag] = useState<ContentTag>("other");
  const [status, setStatus] = useState<TrustedSource["status"]>("active");
  const [note, setNote] = useState("");

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
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [sources, query, countryCode]);

  // --- одиночный ---
  const handleSave = async () => {
    if (!telegramUserId) return;

    if (!handle.trim()) return alert("Укажи @handle");
    if (!title.trim()) return alert("Укажи название");

    try {
      setSaving(true);

      await fetch("/api/admin-posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          countryCode,
          handle: handle.trim(),
          title: title.trim(),
          defaultTag,
          status,
          note: note.trim() || null,
        }),
      });

      setHandle("");
      setTitle("");
      setNote("");

      await onSourcesReload?.();
    } finally {
      setSaving(false);
    }
  };

  // --- 🔥 массовый импорт ---
  const handleBulkImport = async () => {
    if (!telegramUserId) return;

    const handles = bulkText
      .split("\n")
      .map((h) => h.trim().replace("@", ""))
      .filter(Boolean);

    if (handles.length === 0) return;

    try {
      setBulkSaving(true);

      for (const h of handles) {
        await fetch("/api/admin-posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entity: "sources",
            telegramUserId,
            countryCode,
            handle: h,
            title: h,
            defaultTag,
            status,
          }),
        });
      }

      setBulkText("");
      await onSourcesReload?.();
    } finally {
      setBulkSaving(false);
    }
  };

  const handleDelete = async (source: TrustedSource) => {
    if (!telegramUserId) return;
    if (!confirm(`Удалить @${source.handle}?`)) return;

    try {
      setDeletingId(source.id);

      await fetch("/api/admin-posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "sources",
          telegramUserId,
          id: source.id,
        }),
      });

      await onSourcesReload?.();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminSectionCard title="Источники" subtitle="Каналы и массовый импорт">

      {/* --- одиночный --- */}
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          placeholder="@channel_handle"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white"
        />

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название канала"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white"
        />

        <select
          value={defaultTag}
          onChange={(e) => setDefaultTag(e.target.value as ContentTag)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white"
        >
          {ADMIN_TAG_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white"
        >
          <option value="active">активен</option>
          <option value="paused">пауза</option>
        </select>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white md:col-span-2"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-full bg-white px-5 py-2 text-black"
      >
        добавить источник
      </button>

      {/* --- 🔥 массовый --- */}
      <div className="mt-6">
        <textarea
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={`@bbc\n@cnn\n@reuters`}
          className="w-full h-40 rounded-xl bg-[#1a1b24] p-3 text-white"
        />

        <button
          onClick={handleBulkImport}
          disabled={bulkSaving}
          className="mt-3 w-full rounded-xl bg-white py-3 text-black"
        >
          {bulkSaving ? "загружаю..." : "загрузить пачку"}
        </button>
      </div>

      {/* --- список --- */}
      <div className="mt-6 space-y-3">
        {filteredSources.map((source) => (
          <div key={source.id} className="p-3 rounded-xl bg-black/20">
            <div className="font-semibold">{source.title}</div>
            <div className="text-sm text-white/50">@{source.handle}</div>

            <button
              onClick={() => handleDelete(source)}
              className="mt-2 bg-red-500 px-3 py-2 rounded"
            >
              удалить
            </button>
          </div>
        ))}
      </div>
    </AdminSectionCard>
  );
}