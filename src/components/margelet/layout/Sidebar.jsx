"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Globe, X } from "lucide-react";
import AccountModal from "../modules/AccountModal";

const TG_USER_LS_KEY = "margelet_tg_user_v1";

function SquareTelegramAvatar({ photoUrl, alt = "Telegram user" }) {
  if (photoUrl) {
    return <img src={photoUrl} alt={alt} className="h-10 w-10 object-cover" />;
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center bg-[#8fd3ff] text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M21.9 4.6c.3-1.2-.4-1.7-1.4-1.3L2.4 10.3c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 10.6-6.7c.5-.3 1-.1.6.2L9.5 14.4l-.3 4.7c.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l2.9-14.5z" />
      </svg>
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
      if (widgetRef.current) widgetRef.current.innerHTML = "";
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
  currentPage,
  lang,
  setLang,
  copy,
  currentAuthor,
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

  const handleAuthSuccess = (user) => {
    setTgUser(user);
  };

  const handleLogout = () => {
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

  const isAgentsActive = currentPage === "agents" || currentPage === "landing";
  const isBillingActive = currentPage === "billing";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/40 bg-[#e3e7fb]/90 backdrop-blur">
        <div className="mx-auto flex h-[68px] w-full max-w-[1120px] items-center gap-4 px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/icon.png" alt="margelet" className="h-9 w-9" />
            <div className="text-left leading-none">
              <div className="text-[18px] font-black text-[#1a1a1a]">
                margelet
              </div>
              <div className="mt-1 text-[11px] font-medium text-[#555]">
                agent video maker
              </div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-10 md:flex">
            <Link
              href="/agents"
              className={`text-[15px] font-bold transition ${
                isAgentsActive ? "text-[#bc8cff]" : "text-[#222222] hover:text-[#8f63ff]"
              }`}
            >
              <span className="mr-1">👾</span>
              {copy.agents}
            </Link>

            <Link
              href="/price"
              className={`text-[15px] font-bold transition ${
                isBillingActive ? "text-[#bc8cff]" : "text-[#222222] hover:text-[#8f63ff]"
              }`}
            >
              <span className="mr-1">⭐</span>
              {copy.billing}
            </Link>
          </div>

          <div className="ml-auto hidden items-center gap-6 md:flex">
            <button
              onClick={() => {
                if (tgUser) setAccountOpen(true);
                else setAuthOpen(true);
              }}
              className="flex items-center gap-3 text-[15px] font-bold text-[#1d1d1d]"
            >
              <SquareTelegramAvatar
                photoUrl={tgUser?.photo_url || ""}
                alt={tgUser?.first_name || tgUser?.username || "Telegram user"}
              />
              <span>{authLabel}</span>
            </button>

            <button
              onClick={() => setLang(lang === "en" ? "ru" : "en")}
              className="text-[15px] font-bold uppercase text-[#1d1d1d]"
            >
              {lang}
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="ml-auto inline-flex h-10 w-10 items-center justify-center text-[#1d1d1d] md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[110] bg-black/30 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 flex h-full w-[300px] flex-col bg-[#eef2ff] p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-[18px] font-black text-[#1d1d1d]">
                margelet
              </div>
              <button onClick={() => setMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <Link
                href="/agents"
                onClick={() => setMobileOpen(false)}
                className={`text-[15px] font-bold ${
                  isAgentsActive ? "text-[#bc8cff]" : "text-[#222222]"
                }`}
              >
                👾 {copy.agents}
              </Link>

              <Link
                href="/price"
                onClick={() => setMobileOpen(false)}
                className={`text-[15px] font-bold ${
                  isBillingActive ? "text-[#bc8cff]" : "text-[#222222]"
                }`}
              >
                ⭐ {copy.billing}
              </Link>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-6">
              <button
                onClick={() => {
                  if (tgUser) setAccountOpen(true);
                  else setAuthOpen(true);
                  setMobileOpen(false);
                }}
                className="mb-4 flex items-center gap-3 text-[15px] font-bold text-[#1d1d1d]"
              >
                <SquareTelegramAvatar
                  photoUrl={tgUser?.photo_url || ""}
                  alt={tgUser?.first_name || tgUser?.username || "Telegram user"}
                />
                <span>{authLabel}</span>
              </button>

              <button
                onClick={() => setLang(lang === "en" ? "ru" : "en")}
                className="text-[15px] font-bold uppercase text-[#1d1d1d]"
              >
                {lang}
              </button>
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
        onAddAccount={() => setAuthOpen(true)}
      />
    </>
  );
}