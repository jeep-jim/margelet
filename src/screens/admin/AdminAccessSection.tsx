import { useState } from "react";
import { AdminSectionCard } from "./AdminSectionCard";
import { formatDate, getPlanLabel, getRoleLabel } from "./admin.helpers";

type AccessRole = "user" | "channel_owner" | "admin";
type AccessPlan = "free" | "pro_1m" | "pro_3m" | "pro_12m";

type AccessGrant = {
  telegramUserId: string;
  username: string | null;
  role: AccessRole;
  plan: AccessPlan;
  note: string | null;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

type AdminAccessSectionProps = {
  telegramUserId: string | null;
  grants: AccessGrant[];
  grantsLoading: boolean;
  onGrantsReload?: () => Promise<void> | void;
};

export function AdminAccessSection({
  telegramUserId,
  grants,
  grantsLoading,
  onGrantsReload,
}: AdminAccessSectionProps) {
  const [savingGrant, setSavingGrant] = useState(false);

  const [targetTelegramUserId, setTargetTelegramUserId] = useState("");
  const [targetUsername, setTargetUsername] = useState("");
  const [grantRole, setGrantRole] = useState<AccessRole>("channel_owner");
  const [grantPlan, setGrantPlan] = useState<AccessPlan>("free");
  const [durationDays, setDurationDays] = useState("30");
  const [grantNote, setGrantNote] = useState("");

  const handleSaveGrant = async () => {
    if (!telegramUserId) return;
    if (!targetTelegramUserId.trim()) {
      window.alert("Укажи Telegram ID");
      return;
    }

    try {
      setSavingGrant(true);

      const res = await fetch("/api/admin-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          targetTelegramUserId: targetTelegramUserId.trim(),
          username: targetUsername.trim() || null,
          role: grantRole,
          plan: grantPlan,
          durationDays: durationDays.trim() || null,
          note: grantNote.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "save grant failed");
      }

      setTargetTelegramUserId("");
      setTargetUsername("");
      setGrantRole("channel_owner");
      setGrantPlan("free");
      setDurationDays("30");
      setGrantNote("");

      if (onGrantsReload) {
        await onGrantsReload();
      }
    } catch (error: any) {
      window.alert(error?.message || "Не удалось сохранить доступ");
    } finally {
      setSavingGrant(false);
    }
  };

  const handleDeleteGrant = async (targetId: string) => {
    if (!telegramUserId) return;
    if (!window.confirm("Удалить доступ?")) return;

    try {
      const res = await fetch("/api/admin-access", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegramUserId,
          targetTelegramUserId: targetId,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "delete grant failed");
      }

      if (onGrantsReload) {
        await onGrantsReload();
      }
    } catch (error: any) {
      window.alert(error?.message || "Не удалось удалить доступ");
    }
  };

  return (
    <AdminSectionCard title="Управление доступом">
      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={targetTelegramUserId}
          onChange={(event) => setTargetTelegramUserId(event.target.value)}
          placeholder="Telegram ID"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <input
          value={targetUsername}
          onChange={(event) => setTargetUsername(event.target.value)}
          placeholder="@username"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <select
          value={grantRole}
          onChange={(event) => setGrantRole(event.target.value as AccessRole)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
        >
          <option value="user">Пользователь</option>
          <option value="channel_owner">Владелец канала</option>
          <option value="admin">Админ</option>
        </select>

        <select
          value={grantPlan}
          onChange={(event) => setGrantPlan(event.target.value as AccessPlan)}
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none"
        >
          <option value="free">Бесплатно</option>
          <option value="pro_1m">PRO 1 мес</option>
          <option value="pro_3m">PRO 3 мес</option>
          <option value="pro_12m">PRO 12 мес</option>
        </select>

        <input
          value={durationDays}
          onChange={(event) => setDurationDays(event.target.value)}
          placeholder="Срок в днях"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />

        <input
          value={grantNote}
          onChange={(event) => setGrantNote(event.target.value)}
          placeholder="Заметка / бартер / комментарий"
          className="rounded-xl border border-white/10 bg-[#1a1b24] px-4 py-3 text-white outline-none placeholder:text-white/35"
        />
      </div>

      <button
        type="button"
        onClick={() => {
          void handleSaveGrant();
        }}
        disabled={savingGrant}
        className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black disabled:opacity-60"
      >
        {savingGrant ? "сохраняю..." : "сохранить доступ"}
      </button>

      <div className="mt-5">
        <div className="mb-2 text-sm text-white/45">Текущие доступы</div>

        {grantsLoading ? (
          <div className="text-sm text-white/45">загрузка...</div>
        ) : grants.length === 0 ? (
          <div className="text-sm text-white/35">доступов пока нет</div>
        ) : (
          <div className="space-y-3">
            {grants.map((grant) => (
              <div
                key={grant.telegramUserId}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {grant.username ? `@${grant.username}` : grant.telegramUserId}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      ID: {grant.telegramUserId}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void handleDeleteGrant(grant.telegramUserId);
                    }}
                    className="rounded-full bg-red-500 px-3 py-1 text-sm"
                  >
                    удалить
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-white/75 md:grid-cols-2">
                  <div>Роль: {getRoleLabel(grant.role)}</div>
                  <div>Тариф: {getPlanLabel(grant.plan)}</div>
                  <div>Активен: {grant.isActive ? "да" : "нет"}</div>
                  <div>Истекает: {formatDate(grant.expiresAt)}</div>
                </div>

                {grant.note ? (
                  <div className="mt-3 text-sm text-white/70">{grant.note}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminSectionCard>
  );
}