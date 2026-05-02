import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, Gift, PauseCircle, TimerReset } from "lucide-react";
import { formatDaysLeft } from "../creator/creator.monetization";
import type { CreatorChannelPlacement } from "../creator/creator.types";

const CREATOR_CHANNELS_STORAGE_KEY = "margelet_creator_channels_v1";

type MonetizationFilter = "all" | "paid" | "barter" | "claim" | "pending" | "active" | "expired" | "paused" | "canceled";

function readPlacements() {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];
  } catch {
    return [];
  }
}

function statusLabel(status: CreatorChannelPlacement["status"]) {
  if (status === "pending") return "ожидает";
  if (status === "active") return "активен";
  if (status === "paused") return "пауза";
  if (status === "expired") return "истёк";
  if (status === "canceled") return "удалён";
  return "черновик";
}

function planLabel(plan: CreatorChannelPlacement["plan"]) {
  if (plan === "paid") return "оплата";
  if (plan === "barter") return "бартер";
  return "подтверждение";
}

export function AdminMonetizationSection() {
  const [items, setItems] = useState<CreatorChannelPlacement[]>(() => readPlacements());
  const [filter, setFilter] = useState<MonetizationFilter>("all");
  const [open, setOpen] = useState(true);

  const loadRemotePlacements = async () => {
    try {
      const response = await fetch("/api/telegram-webhook?includeCanceled=1");
      const data = await response.json();

      if (data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch {
      setItems(readPlacements());
    }
  };

  useEffect(() => {
    loadRemotePlacements();
  }, []);

  const updatePlacementStatus = async (placementId: string, status: CreatorChannelPlacement["status"]) => {
    try {
      const response = await fetch("/api/telegram-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "site",
          action: "update_placement_status",
          placementId,
          status,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        alert("Не получилось обновить заявку");
        return;
      }

      await loadRemotePlacements();
    } catch {
      alert("Не получилось обновить заявку");
    }
  };

  const extendPlacement = async (placementId: string) => {
    try {
      const response = await fetch("/api/telegram-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "site",
          action: "extend_placement",
          placementId,
          days: 30,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        alert("Не получилось продлить заявку");
        return;
      }

      await loadRemotePlacements();
    } catch {
      alert("Не получилось продлить заявку");
    }
  };

  const stats = useMemo(() => {
    const paid = items.filter((item) => item.plan === "paid");
    const barter = items.filter((item) => item.plan === "barter");
    const claim = items.filter((item) => item.plan === "claim");
    const active = items.filter((item) => item.status === "active");
    const pending = items.filter((item) => item.status === "pending");
    const expired = items.filter((item) => item.status === "expired" || item.status === "paused");
    const canceled = items.filter((item) => item.status === "canceled");

    return { paid, barter, claim, active, pending, expired, canceled };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filter === "all") return item.status !== "canceled";
        if (filter === "paid" || filter === "barter" || filter === "claim") return item.plan === filter;
        return item.status === filter;
      })
      .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
  }, [items, filter]);

  const filters: Array<{ value: MonetizationFilter; label: string }> = [
    { value: "all", label: "все" },
    { value: "paid", label: "оплата" },
    { value: "barter", label: "бартер" },
    { value: "claim", label: "подтверждение" },
    { value: "pending", label: "ожидают" },
    { value: "active", label: "активные" },
    { value: "expired", label: "истекли" },
    { value: "paused", label: "пауза" },
    { value: "canceled", label: "удалённые" },
  ];

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <div className="text-lg font-semibold text-white">🔥💰💸 Заявки</div>
          
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {items.length} заявок
        </div>
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 lg:grid-cols-5">
            <div className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 lg:min-h-[74px] lg:flex-col lg:items-start lg:gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <CreditCard className="h-4 w-4 shrink-0 text-emerald-300" />
                <div className="truncate text-xs text-white/45">платных</div>
              </div>
              <div className="shrink-0 text-lg font-semibold text-white">{stats.paid.length}</div>
            </div>

            <div className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 lg:min-h-[74px] lg:flex-col lg:items-start lg:gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Gift className="h-4 w-4 shrink-0 text-sky-300" />
                <div className="truncate text-xs text-white/45">бартер</div>
              </div>
              <div className="shrink-0 text-lg font-semibold text-white">{stats.barter.length}</div>
            </div>

            <div className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 lg:min-h-[74px] lg:flex-col lg:items-start lg:gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <TimerReset className="h-4 w-4 shrink-0 text-blue-300" />
                <div className="truncate text-xs text-white/45">ожидают</div>
              </div>
              <div className="shrink-0 text-lg font-semibold text-white">{stats.pending.length}</div>
            </div>

            <div className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 lg:min-h-[74px] lg:flex-col lg:items-start lg:gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-4 w-4 shrink-0 rounded-full bg-emerald-400" />
                <div className="truncate text-xs text-white/45">активные</div>
              </div>
              <div className="shrink-0 text-lg font-semibold text-white">{stats.active.length}</div>
            </div>

            <div className="flex items-center justify-between rounded-[18px] bg-black/20 px-4 py-3 lg:min-h-[74px] lg:flex-col lg:items-start lg:gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <PauseCircle className="h-4 w-4 shrink-0 text-amber-300" />
                <div className="truncate text-xs text-white/45">истекли / пауза</div>
              </div>
              <div className="shrink-0 text-lg font-semibold text-white">{stats.expired.length}</div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  filter === item.value
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
             onClick={loadRemotePlacements}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10"
            >
              обновить
            </button>
          </div>

          <div className="space-y-2">
            {filteredItems.length ? (
              filteredItems.map((item) => {
                const cleanHandle = item.channelHandle.replace(/^@+/, "");
                const title = item.channelTitle?.trim() || cleanHandle;
                const avatarUrl = item.channelAvatarUrl || `https://t.me/i/userpic/320/${cleanHandle}.jpg`;

                return (
                  <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={avatarUrl}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full border border-white/10 bg-white/10 object-cover"
                          onError={(event) => {
                            (event.currentTarget as HTMLImageElement).src =
                              "https://www.gravatar.com/avatar/?d=mp&s=200";
                          }}
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <div className="truncate text-sm font-semibold text-white">{title}</div>
                            {item.verified ? <BadgeCheck className="h-4 w-4 shrink-0 text-blue-300" /> : null}
                          </div>
                          <div className="mt-1 truncate text-xs text-white/45">
                            @{cleanHandle} · владелец TG: {item.ownerTelegramId} · {item.country.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{planLabel(item.plan)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{statusLabel(item.status)}</span>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{formatDaysLeft(item.endsAt)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-white/45">
                        {item.pricingLabel} · {item.donateUrl ? "donate-ссылка есть" : "donate-ссылки нет"}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {item.status === "active" ? (
                          <button
                            type="button"
                            onClick={() => updatePlacementStatus(item.id, "paused")}
                            className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-400/15"
                          >
                            пауза
                          </button>
                        ) : null}

                        {item.status === "paused" || item.status === "pending" || item.status === "expired" ? (
                          <button
                            type="button"
                            onClick={() => updatePlacementStatus(item.id, "active")}
                            className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-400/15"
                          >
                            Пуск
                          </button>
                        ) : null}

                        {item.status === "active" || item.status === "paused" || item.status === "expired" ? (
                          <button
                            type="button"
                            onClick={() => extendPlacement(item.id)}
                            className="rounded-full border border-sky-400/25 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-400/15"
                          >
                            30д
                          </button>
                        ) : null}

                        {item.status !== "canceled" ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Удалить заявку? Если канал был создан этой заявкой, он уйдёт из ленты. Если канал существовал раньше, он останется и будет поставлен на паузу.")) {
                                updatePlacementStatus(item.id, "canceled");
                              }
                            }}
                            className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/15"
                          >
                            удалить
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] bg-black/20 px-4 py-4 text-sm text-white/45">
                Пока нет заявок в этом браузере. После webhook здесь будут реальные данные из хранилища.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
