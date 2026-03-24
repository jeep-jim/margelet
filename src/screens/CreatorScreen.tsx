import {
  Heart,
  Info,
  Bookmark,
  ArrowRightLeft,
  Send,
  Play,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Video } from "../types/app";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

type Props = {
  locale: "ru" | "en";
  videos: Video[];
  openPost: (video: Video) => void;
};

type CabinetTab = "saved" | "liked" | "about";

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

function readTelegramUserFromUrl(): TgUser | null {
  const hash = window.location.hash || "";
  const prefix = "#tgAuthResult=";

  if (!hash.startsWith(prefix)) return null;

  const encoded = hash.slice(prefix.length);
  if (!encoded) return null;

  try {
    const decoded = decodeURIComponent(encoded);
    const parsed = JSON.parse(decoded);

    if (!parsed?.id) return null;

    return {
      id: String(parsed.id),
      first_name: parsed.first_name || "",
      username: parsed.username || "",
      photo_url: parsed.photo_url || "",
    };
  } catch {
    return null;
  }
}

function readTelegramUserFromStorage(): TgUser | null {
  const raw = localStorage.getItem(TG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TgUser;
  } catch {
    localStorage.removeItem(TG_STORAGE_KEY);
    return null;
  }
}

function LightTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-neutral-950 text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function AuthBlock() {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="text-[26px] font-semibold leading-tight">
            Войти через Telegram
          </div>

          <div className="mt-2 max-w-[28rem] text-sm leading-6 text-white/92">
            Сохраняй видео, ставь лайки и управляй своим потоком внутри
            margeleT.
          </div>

          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
          >
            Авторизоваться
          </button>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/14 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-md">
            <Send className="h-10 w-10 -rotate-12 text-white" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 backdrop-blur-md">
            <ArrowRightLeft className="h-6 w-6 text-white/95" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileBlock({ user }: { user: TgUser }) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/25" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">
                {user.first_name}
              </div>
              <div className="truncate text-sm text-white/90">
                @{user.username}
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-white/90">
            Подключено к Telegram
          </div>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/14 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-md">
            <Send className="h-10 w-10 -rotate-12 text-white" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 backdrop-blur-md">
            <ArrowRightLeft className="h-6 w-6 text-white/95" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CabinetTile({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#d4d4d8_0%,#e5e7eb_100%)]" />
      <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
        <Play className="h-7 w-7 text-neutral-800" />
      </div>
    </button>
  );
}

export function CreatorScreen({ videos, openPost }: Props) {
  const [tab, setTab] = useState<CabinetTab>("saved");
  const [user, setUser] = useState<TgUser | null>(null);

  useEffect(() => {
    const urlUser = readTelegramUserFromUrl();

    if (urlUser) {
      setUser(urlUser);
      localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(urlUser));
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
      return;
    }

    const storedUser = readTelegramUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const isAuthorized = !!user;

  const savedVideos = videos.slice(0, 5);
  const likedVideos = videos.slice(1, 6);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-5">
          {isAuthorized ? <ProfileBlock user={user!} /> : <AuthBlock />}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <LightTab
            active={tab === "saved"}
            onClick={() => setTab("saved")}
            icon={Bookmark}
            label="Избранное"
          />
          <LightTab
            active={tab === "liked"}
            onClick={() => setTab("liked")}
            icon={Heart}
            label="Нравится"
          />
          <LightTab
            active={tab === "about"}
            onClick={() => setTab("about")}
            icon={Info}
            label="О проекте"
          />
        </div>

        {!isAuthorized && tab !== "about" ? (
          <div className="rounded-2xl bg-white px-4 py-4 text-sm leading-6 text-neutral-600">
            Авторизуйтесь, чтобы сохранять видео, которые вам понравились,
            и иметь доступ к другим возможностям margeleT.
          </div>
        ) : (
          <>
            {tab === "saved" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {savedVideos.map((video) => (
                  <CabinetTile key={video.id} onOpen={() => openPost(video)} />
                ))}
              </div>
            )}

            {tab === "liked" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {likedVideos.map((video) => (
                  <CabinetTile key={video.id} onOpen={() => openPost(video)} />
                ))}
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-7 text-neutral-700">
                  MargeleT — это общая лента видео из Telegram.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}