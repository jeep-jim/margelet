import { useEffect, useMemo, useState } from "react";
import { CreditCard, Gift, PauseCircle, TimerReset } from "lucide-react";
import { formatDaysLeft } from "../creator/creator.monetization";
import type { CreatorChannelPlacement } from "../creator/creator.types";

const CREATOR_CHANNELS_STORAGE_KEY = "margelet_creator_channels_v1";

type MonetizationFilter = "all" | "paid" | "barter" | "pending" | "active" | "expired" | "paused";

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
  return "черновик";
}

function planLabel(plan: CreatorChannelPlacement["plan"]) {
  return plan === "paid" ? "оплата" : "бартер";
}

export function AdminMonetizationSection() {
  const [items, setItems] = useState<CreatorChannelPlacement[]>(() => readPlacements());
  const [filter, setFilter] = useState<MonetizationFilter>("all");
  const [open, setOpen] = useState(true);

  const loadRemotePlacements = async () => {
    try {
      const response = await fetch("/api/telegram-webhook");
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

  const stats = useMemo(() => {
    const paid = items.filter((item) => item.plan === "paid");
    const barter = items.filter((item) => item.plan === "barter");
    const active = items.filter((item) => item.status === "active");
    const pending = items.filter((item) => item.status === "pending");
    const expired = items.filter((item) => item.status === "expired" || item.status === "paused");

    return { paid, barter, active, pending, expired };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (filter === "all") return true;
        if (filter === "paid" || filter === "barter") return item.plan === filter;
        return item.status === filter;
      })
      .sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
  }, [items, filter]);

  const filters: Array<{ value: MonetizationFilter; label: string }> = [
    { value: "all", label: "все" },
    { value: "paid", label: "оплата" },
    { value: "barter", label: "бартер" },
    { value: "pending", label: "ожидают" },
    { value: "active", label: "активные" },
    { value: "expired", label: "истекли" },
    { value: "paused", label: "пауза" },
  ];

  return (
    <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <div>
          <div className="text-lg font-semibold text-white">Монетизация и размещения</div>
          <div className="mt-1 text-sm text-white/45">
            Черновой центр заявок: оплата, бартер, статусы и сроки.
          </div>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
          {items.length} заявок
        </div>
      </button>

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-[22px] bg-black/20 p-4">
              <CreditCard className="h-4 w-4 text-emerald-300" />
              <div className="mt-3 text-2xl font-semibold">{stats.paid.length}</div>
              <div className="text-xs text-white/45">платных</div>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <Gift className="h-4 w-4 text-sky-300" />
              <div className="mt-3 text-2xl font-semibold">{stats.barter.length}</div>
              <div className="text-xs text-white/45">бартер</div>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <TimerReset className="h-4 w-4 text-blue-300" />
              <div className="mt-3 text-2xl font-semibold">{stats.pending.length}</div>
              <div className="text-xs text-white/45">ожидают</div>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <div className="h-4 w-4 rounded-full bg-emerald-400" />
              <div className="mt-3 text-2xl font-semibold">{stats.active.length}</div>
              <div className="text-xs text-white/45">активные</div>
            </div>
            <div className="rounded-[22px] bg-black/20 p-4">
              <PauseCircle className="h-4 w-4 text-amber-300" />
              <div className="mt-3 text-2xl font-semibold">{stats.expired.length}</div>
              <div className="text-xs text-white/45">истекли / пауза</div>
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
              filteredItems.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">@{item.channelHandle}</div>
                      <div className="mt-1 text-xs text-white/45">
                        владелец TG: {item.ownerTelegramId} · {item.country.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{planLabel(item.plan)}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{statusLabel(item.status)}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-white/70">{formatDaysLeft(item.endsAt)}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/45">
                    {item.pricingLabel} · {item.donateUrl ? "donate-ссылка есть" : "donate-ссылки нет"}
                  </div>
                </div>
              ))
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
