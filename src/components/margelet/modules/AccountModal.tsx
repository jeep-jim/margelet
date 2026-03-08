"use client";

import React, { useEffect } from "react";
import { LogOut, X, CreditCard, Star, Wallet, Plus } from "lucide-react";

type TgUser = {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

type AccountModalProps = {
  open: boolean;
  onClose: () => void;
  tgUser: TgUser | null;
  onLogout: () => void;
  onAddAccount: () => void;
};

function formatName(user: TgUser | null) {
  if (!user) return "Telegram User";
  const full = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (user.username) return `@${user.username}`;
  return "Telegram User";
}

export default function AccountModal({
  open,
  onClose,
  tgUser,
  onLogout,
  onAddAccount,
}: AccountModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const displayName = formatName(tgUser);
  const username = tgUser?.username ? `@${tgUser.username}` : "—";
  const telegramId = tgUser?.id ? String(tgUser.id) : "—";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <div className="relative z-[121] w-full max-w-xl overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Telegram Account
            </div>
            <h2 className="mt-1 text-xl font-semibold sm:text-2xl">Аккаунт</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-center gap-4">
              {tgUser?.photo_url ? (
                <img
                  src={tgUser.photo_url}
                  alt={displayName}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate text-xl font-semibold sm:text-2xl">
                  {displayName}
                </div>
                <div className="mt-1 truncate text-sm text-slate-500 sm:text-base">
                  {username}
                </div>
                <div className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Авторизован через Telegram
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Username
                </div>
                <div className="mt-2 break-all text-base font-medium">
                  {username}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Telegram ID
                </div>
                <div className="mt-2 break-all text-base font-medium">
                  {telegramId}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Subscription
            </div>
            <h3 className="mt-1 text-lg font-semibold sm:text-xl">Подписка</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <CreditCard size={16} />
                  <span className="text-sm">Тариф</span>
                </div>
                <div className="mt-3 text-base font-medium">Скоро</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Wallet size={16} />
                  <span className="text-sm">Баланс</span>
                </div>
                <div className="mt-3 text-base font-medium">—</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Star size={16} />
                  <span className="text-sm">Telegram Stars</span>
                </div>
                <div className="mt-3 text-base font-medium">—</div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Управление
            </div>
            <h3 className="mt-1 text-lg font-semibold sm:text-xl">Действия</h3>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onAddAccount}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <Plus size={18} />
                Добавить аккаунт
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <LogOut size={18} />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}