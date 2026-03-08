"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  BarChart3,
  CreditCard,
  Globe,
  LayoutDashboard,
  Menu,
  Settings,
  User,
  X,
  LogOut,
} from "lucide-react";
import AccountModal from "../modules/AccountModal";

const TG_USER_LS_KEY = "margelet_tg_user_v1";

function Avatar({ name, image, size = "md" }) {
  const sizeMap = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return image ? (
    <img
      src={image}
      alt={name}
      className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white/80`}
    />
  ) : (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#60a5fa)] font-bold text-white ring-2 ring-white/80`}
    >
      {(name || "U").slice(0, 1).toUpperCase()}
    </div>
  );
}

function TelegramAuthModal({ open, onClose, onAuth }) {
  const widgetRef = useRef(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!open) return;
    if (!widgetRef.current) return;

    widgetRef.current.innerHTML = "";

    if (!botUsername) return;

    const callbackName = "margeletTelegramAuthCallback";

    window[callbackName] = (user) => {
      if (!user) return;

      const normalizedUser = {
        id: user.id,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        photo_url: user.photo_url || "",
        auth_date: user.auth_date || "",
        hash: user.hash || "",
      };

      localStorage.setItem(TG_USER_LS_KEY, JSON.stringify(normalizedUser));
      onAuth?.(normalizedUser);
      onClose?.();
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", `${callbackName}(user)`);

    widgetRef.current.appendChild(script);

    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = "";
      }
      try {
        delete window[callbackName];
      } catch {}
    };
  }, [open, botUsername, onAuth, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[360px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
        <div className="relative overflow-hidden px-6 pb-6 pt-6 text-white">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#8b5cf6_0%,#7c6cff_35%,#60a5fa_100%)]" />

          <div className="absolute inset-0 grid grid-cols-8 grid-rows-5 opacity-20">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={`${
                  i % 3 === 0 ? "bg-white/20" : "bg-transparent"
                } border border-white/10`}
              />
            ))}
          </div>

          <div className="relative">
            <button
              onClick={onClose}
              className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15 text-white transition hover:bg-white/25"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-4 pr-12">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/18 text-[24px] backdrop-blur">
                👾
              </div>

              <div className="min-w-0 pt-1">
                <div className="text-[36px] font-black leading-none tracking-[-0.03em]">
                  Вход
                </div>
              </div>
            </div>

            <div className="mt-4 whitespace-nowrap text-[14px] font-semibold leading-none text-white/95">
              только через аккаунт Telegram
            </div>

            <div className="mt-7 whitespace-nowrap text-[24px] font-black leading-none tracking-[-0.01em]">
              margeleT → Telegram
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {!botUsername ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Не задан bot username в переменных окружения.
            </div>
          ) : (
            <div
              ref={widgetRef}
              className="flex min-h-[64px] items-center justify-center"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({
  tab,
  setTab,
  lang,
  setLang,
  copy,
  currentAuthor,
  onOpenAuthor,
  onTelegramAuth,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [tgUser, setTgUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TG_USER_LS_KEY);
      if (!raw) return;
      setTgUser(JSON.parse(raw));
    } catch {
      setTgUser(null);
    }
  }, []);

  const navItems = useMemo(
    () => [
      {
        key: "dashboard",
        label: copy.dashboard,
        icon: LayoutDashboard,
        activeClass: "bg-violet-600 text-white shadow-lg",
      },
      {
        key: "agents",
        label: copy.agents,
        icon: Bot,
        activeClass: "bg-fuchsia-600 text-white shadow-lg",
      },
      {
        key: "analytics",
        label: copy.analytics,
        icon: BarChart3,
        activeClass: "bg-emerald-600 text-white shadow-lg",
      },
      {
        key: "billing",
        label: copy.billing,
        icon: CreditCard,
        activeClass: "bg-amber-500 text-white shadow-lg",
      },
      {
        key: "settings",
        label: copy.settings,
        icon: Settings,
        activeClass: "bg-slate-700 text-white shadow-lg",
      },
    ],
    [copy]
  );

  const currentItem = navItems.find((item) => item.key === tab) || navItems[0];

  const handleChangeTab = (nextTab) => {
    setTab(nextTab);
    setMobileOpen(false);
  };

  const handleOpenAuth = () => {
    if (tgUser) {
      setAccountOpen(true);
      return;
    }

    setAuthOpen(true);
  };

  const handleAuthSuccess = (user) => {
    setTgUser(user);
    onTelegramAuth?.(user);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(TG_USER_LS_KEY);
    } catch {}

    setTgUser(null);
    setAccountOpen(false);
  };

  const handleClearSession = () => {
    try {
      localStorage.removeItem(TG_USER_LS_KEY);
    } catch {}

    setTgUser(null);
    setAccountOpen(false);
  };

  const visibleUser = tgUser || currentAuthor;

  const authLabel = tgUser
    ? tgUser?.username
      ? `@${tgUser.username}`
      : tgUser?.first_name || "Аккаунт"
    : "Войти";

  const NavButton = ({ item }) => {
    const Icon = item.icon;
    const isActive = tab === item.key;

    return (
      <button
        onClick={() => handleChangeTab(item.key)}
        className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition ${
          isActive
            ? item.activeClass
            : "bg-white/70 text-slate-700 hover:bg-white"
        }`}
        title={item.label}
      >
        <Icon size={16} />
        <span className="whitespace-nowrap">{item.label}</span>
      </button>
    );
  };

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-white/40 bg-[linear-gradient(135deg,rgba(217,214,255,0.88)_0%,rgba(221,232,255,0.88)_50%,rgba(216,240,255,0.88)_100%)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-3 sm:px-4 lg:px-6">
          <button
            onClick={() => setTab("dashboard")}
            className="flex min-w-0 items-center gap-3 rounded-2xl text-left"
          >
            <img
              src="/icon.png"
              alt="margelet"
              className="h-9 w-9 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <div className="truncate text-xl font-black tracking-tight text-slate-900">
                margelet
              </div>
              <div className="truncate text-xs font-medium text-slate-500">
                AI studio
              </div>
            </div>
          </button>

          <div className="hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavButton key={item.key} item={item} />
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <button
              onClick={handleOpenAuth}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white/70 px-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              title={authLabel}
            >
              {tgUser?.photo_url ? (
                <Avatar
                  name={tgUser?.first_name || tgUser?.username || "User"}
                  image={tgUser.photo_url}
                  size="sm"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#60a5fa)] text-white">
                  <User size={15} />
                </div>
              )}
              <span className="hidden lg:inline">{authLabel}</span>
            </button>

            <button
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-white/70 px-3 text-sm font-medium text-slate-700 transition hover:bg-white"
              title={copy.language}
            >
              <Globe size={16} />
              <span className="font-semibold uppercase">{lang}</span>
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-800 transition hover:bg-white lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
        </div>

        <div className="mx-auto hidden w-full max-w-7xl items-center gap-2 overflow-x-auto px-3 pb-3 sm:px-4 md:flex lg:hidden lg:px-6">
          {navItems.map((item) => (
            <NavButton key={item.key} item={item} />
          ))}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm lg:hidden">
          <div className="absolute right-0 top-0 flex h-full w-full max-w-[340px] flex-col border-l border-white/60 bg-white/95 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-500">
                  margelet
                </div>
                <div className="truncate text-lg font-black text-slate-900">
                  {currentItem.label}
                </div>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-slate-100 p-2 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={() => {
                  if (tgUser) {
                    setAccountOpen(true);
                  } else {
                    setAuthOpen(true);
                  }
                  setMobileOpen(false);
                }}
                className="mb-4 flex w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left transition hover:bg-slate-100"
              >
                {tgUser?.photo_url ? (
                  <Avatar
                    name={tgUser?.first_name || tgUser?.username || "User"}
                    image={tgUser.photo_url}
                    size="md"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#60a5fa)] text-white">
                    <User size={16} />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">
                    {authLabel}
                  </div>
                  <div className="truncate text-xs text-slate-500">
                    Аккаунт
                  </div>
                </div>
              </button>

              <div className="grid gap-2">
                {navItems.map((item) => (
                  <NavButton key={item.key} item={item} />
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <button
                  onClick={() => setLang(lang === "en" ? "ru" : "en")}
                  className="flex w-full items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-left text-slate-700 transition hover:bg-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <Globe size={16} />
                    <span className="font-medium">{copy.language}</span>
                  </div>
                  <span className="text-sm font-semibold uppercase">{lang}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <TelegramAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuth={handleAuthSuccess}
      />

      <AccountModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        tgUser={visibleUser}
        onLogout={handleLogout}
        onClearSession={handleClearSession}
      />
    </>
  );
}