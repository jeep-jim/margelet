import { ArrowLeft, Moon, Sun, User } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

import type { IngestedPost, Locale } from "../../types/app";

type SpaceTheme = "dark" | "light";

function getTheme(): SpaceTheme {
  if (typeof document === "undefined") return "dark";

  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

function applyTheme(theme: SpaceTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;

  localStorage.setItem("margelet_theme", theme);
}

function readTelegramUser() {
  try {
    const raw = localStorage.getItem("margelet_tg_user");

    if (!raw) return null;

    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function SpaceOverlay({
  onClose,
}: {
  locale: Locale;

  posts: IngestedPost[];

  onClose: () => void;
}) {
  const [theme, setTheme] = useState<SpaceTheme>(() => getTheme());

  const [telegramUser, setTelegramUser] = useState<any>(
    () => readTelegramUser()
  );

  const isLight = theme === "light";

  useEffect(() => {
    const sync = () => {
      setTheme(getTheme());

      setTelegramUser(readTelegramUser());
    };

    window.addEventListener("focus", sync);

    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);

      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";

    applyTheme(next);

    setTheme(next);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] overflow-hidden ${
        isLight
          ? "bg-[#edf3fa] text-[#08111d]"
          : "bg-[#02060d] text-white"
      }`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? `
            radial-gradient(circle at 50% 0%, rgba(108,170,255,.30), transparent 42%),
            linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)
          `
            : `
            radial-gradient(circle at 50% 0%, rgba(40,120,220,.22), transparent 42%),
            linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)
          `,
        }}
      />

      <header
        className={`absolute top-0 left-0 right-0 z-20 h-16 border-b ${
          isLight
            ? "border-[#d8e3ef] bg-[#f6f9fd]/88"
            : "border-white/10 bg-[#132233]/72"
        }`}
      >
        <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-4">

          <button
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-lg font-semibold">
            Space
          </div>

          <div className="flex items-center gap-2">

            <button
              onClick={toggleTheme}
              className="grid h-10 w-10 place-items-center rounded-full"
            >
              {isLight ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {telegramUser?.photo_url ? (
              <img
                src={telegramUser.photo_url}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full">
                <User className="h-5 w-5" />
              </div>
            )}

          </div>
        </div>
      </header>

      <div className="relative z-10 flex h-full items-center justify-center">

        <div
          className={`select-none text-[90px] font-black tracking-[-0.06em]

          ${isLight
            ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]"
            : "bg-[linear-gradient(90deg,#2ec3ff,#4fa0ff,#ffffff)]"}

          bg-clip-text text-transparent`}
        >
          Space
        </div>

      </div>
    </div>,
    document.body
  );
}