"use client";

import React, { useEffect } from "react";
import { LogOut, Plus, X } from "lucide-react";

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
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        aria-label="Close modal overlay"
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
      />

      <div className="relative z-[121] flex min-h-dvh items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-xl overflow-hidden rounded-[24px] border border-slate-200 bg-white text-slate-900 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">
                Telegram Account
              </div>
              <h2 className="mt-1 text-lg font-semibold sm:text-2xl">Аккаунт</h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 sm:h-10 sm:w-10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[calc(100dvh-40px)] overflow-y-auto px-4 py-4 sm:max-h-[85dvh] sm:px-6 sm:py-6">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:rounded-[24px] sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                {tgUser?.photo_url ? (
                  <img
                    src={tgUser.photo_url}
                    alt={displayName}
                    className="h-16 w-16 rounded-full object-cover sm:h-20 sm:w-20"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600 sm:h-20 sm:w-20 sm:text-2xl">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="truncate text-lg font-semibold sm:text-2xl">
                    {displayName}
                  </div>

                  <div className="mt-1 truncate text-sm text-slate-500 sm:text-base">
                    {username}
                  </div>

                  <div className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-emerald-700 sm:mt-3 sm:px-3 sm:text-xs">
                    Авторизован через Telegram
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Username
                  </div>
                  <div className="mt-2 break-all text-sm font-medium sm:text-base">
                    {username}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    Telegram ID
                  </div>
                  <div className="mt-2 break-all text-sm font-medium sm:text-base">
                    {telegramId}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 p-4 sm:mt-5 sm:rounded-[24px] sm:p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400 sm:text-[11px]">
                Управление
              </div>
              <h3 className="mt-1 text-base font-semibold sm:text-xl">Действия</h3>

              <div className="mt-3 grid gap-3 sm:mt-4 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={onAddAccount}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:min-h-[52px]"
                >
                  <Plus size={18} />
                  Добавить аккаунт
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 sm:min-h-[52px]"
                >
                  <LogOut size={18} />
                  Выйти
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}