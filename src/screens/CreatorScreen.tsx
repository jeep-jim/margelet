import {
  Heart,
  Info,
  Bookmark,
  ArrowRightLeft,
  Send,
  Play,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
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
            Сохраняй посты, ставь лайки и управляй своим потоком внутри
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

function ProfileBlock({
  user,
  verified,
  onLogout,
}: {
  user: TgUser;
  verified: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white text-neutral-950 shadow-sm">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-200">
              {user.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-lg font-semibold">
                  {user.first_name}
                </div>
                {verified ? (
                  <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="truncate text-sm text-neutral-500">
                {user.username ? `@${user.username}` : "Telegram user"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Подключено к Telegram
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </button>
          </div>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-neutral-100 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-neutral-200 bg-neutral-50">
            <Send className="h-10 w-10 -rotate-12 text-neutral-700" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white">
            <ArrowRightLeft className="h-6 w-6 text-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CabinetTile({
  video,
  onOpen,
}: {
  video: Video;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          video.bg || "from-neutral-300 to-neutral-200"
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
        {video.mediaType === "video" ? (
          <Play className="h-7 w-7 text-neutral-800" />
        ) : (
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-800">
            Image
          </div>
        )}
      </div>
    </button>
  );
}

export function CreatorScreen({ videos, openPost }: Props) {
  const [tab, setTab] = useState<CabinetTab>("saved");
  const [user, setUser] = useState<TgUser | null>(null);

  useEffect(() => {
    const storedUser = readTelegramUserFromStorage();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const isAuthorized = !!user;

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const savedVideos = videos.slice(0, 5);
  const likedVideos = videos.slice(1, 6);

  const profileVerified = isAuthorized
    ? videos.some(
        (video) =>
          !!video.channelVerified &&
          user?.username &&
          video.handle.toLowerCase() === `@${user.username.toLowerCase()}`
      )
    : false;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-5">
          {isAuthorized && user ? (
            <ProfileBlock
              user={user}
              verified={profileVerified}
              onLogout={handleLogout}
            />
          ) : (
            <AuthBlock />
          )}
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
            Авторизуйтесь, чтобы сохранять посты, которые вам понравились,
            и иметь доступ к другим возможностям margeleT.
          </div>
        ) : (
          <>
            {tab === "saved" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {savedVideos.map((video) => (
                  <CabinetTile
                    key={video.id}
                    video={video}
                    onOpen={() => openPost(video)}
                  />
                ))}
              </div>
            )}

            {tab === "liked" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {likedVideos.map((video) => (
                  <CabinetTile
                    key={video.id}
                    video={video}
                    onOpen={() => openPost(video)}
                  />
                ))}
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-7 text-neutral-700">
                  MargeleT — это общая визуальная лента Telegram-постов.
                  Контент создаётся как ценность, но часто тонет в каналах как
                  мусор. MargeleT возвращает его в поле зрения.
                </div>

                <div className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-7 text-neutral-700">
                  Мы не делаем вторую соцсеть внутри соцсети. Комментарии,
                  источник и переходы живут в Telegram, а MargeleT даёт общую
                  ленту discovery.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}