import {
  ArrowRightLeft,
  Link as LinkIcon,
  Plus,
  CheckCircle2,
  AlertCircle,
  Globe,
  ChevronDown,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContentTag, Locale } from "../types/app";
import { Input } from "../components/ui/Input";
import { normalizeTelegramUrl } from "../lib/telegram";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
const ROLE_STORAGE_KEY = "margelet_user_role";
const CONNECTED_CHANNEL_STORAGE_KEY = "margelet_connected_channel";
const LAST_SUBMIT_AT_KEY = "margelet_last_submit_at";

const TAG_OPTIONS: { value: ContentTag; label: string }[] = [
  { value: "people", label: "Люди" },
  { value: "animals", label: "Животные" },
  { value: "news", label: "Новости" },
  { value: "business", label: "Бизнес" },
  { value: "creativity", label: "Творчество" },
  { value: "finance", label: "Финансы" },
  { value: "education", label: "Образование" },
  { value: "technology", label: "Технологии" },
  { value: "memes", label: "Мемы" },
  { value: "sports", label: "Спорт" },
  { value: "music", label: "Музыка" },
  { value: "travel", label: "Путешествия" },
  { value: "food", label: "Еда" },
  { value: "other", label: "Другое" },
];

type Props = {
  locale: Locale;
  onAdd: (payload: {
    url: string;
    tag: ContentTag;
  }) => Promise<void>;
};

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

type ParsedTelegramPost = {
  channel: string;
  postId: string;
};

type UserRole = "guest" | "user" | "channel_owner" | "admin";

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
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

function parseTelegramPostUrl(raw: string): ParsedTelegramPost | null {
  const value = raw.trim();
  if (!value) return null;

  try {
    const normalized = normalizeTelegramUrl(value);
    if (!normalized) return null;

    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname !== "t.me" && hostname !== "telegram.me") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return null;

    const [channel, postId] = parts;

    if (!/^[A-Za-z0-9_]{4,}$/.test(channel)) return null;
    if (!/^\d+$/.test(postId)) return null;

    return { channel, postId };
  } catch {
    return null;
  }
}

function getTagLabel(tag: ContentTag) {
  return TAG_OPTIONS.find((item) => item.value === tag)?.label || "Другое";
}

function getStartOfTodayTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function readLastSubmitAt(): number | null {
  const raw = localStorage.getItem(LAST_SUBMIT_AT_KEY);
  if (!raw) return null;

  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function writeLastSubmitAt(timestamp: number) {
  localStorage.setItem(LAST_SUBMIT_AT_KEY, String(timestamp));
}

function hasDailyDemoLimitReached(role: UserRole) {
  if (role !== "user") return false;

  const lastSubmitAt = readLastSubmitAt();
  if (!lastSubmitAt) return false;

  return lastSubmitAt >= getStartOfTodayTimestamp();
}

function resolveUserRole(user: TgUser | null): UserRole {
  if (!user) return "guest";

  const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
  if (storedRole === "admin") return "admin";
  if (storedRole === "channel_owner") return "channel_owner";
  if (storedRole === "user") return "user";

  const connectedChannel = localStorage.getItem(CONNECTED_CHANNEL_STORAGE_KEY);
  if (connectedChannel) return "channel_owner";

  return "user";
}

function getRoleTitle(role: UserRole) {
  switch (role) {
    case "admin":
      return "Админ";
    case "channel_owner":
      return "Владелец канала";
    case "user":
      return "Пробный доступ";
    default:
      return "Гость";
  }
}

function getRoleDescription(role: UserRole) {
  switch (role) {
    case "admin":
      return "Полный доступ. Можно добавлять посты без демо-лимита.";
    case "channel_owner":
      return "Канал подключён. Можно публиковать посты без суточного лимита.";
    case "user":
      return "Сейчас это демо-доступ: можно добавить только 1 пост в день.";
    default:
      return "Авторизуйтесь через Telegram, чтобы добавить пост.";
  }
}

function AuthBlock() {
  return (
    <div className="mt-6 overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
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
            Авторизуйтесь, чтобы добавлять Telegram-посты. Обычный доступ даёт
            демо-лимит, а полный режим откроется после подключения канала.
          </div>

          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
            type="button"
          >
            Авторизоваться
          </button>
        </div>

        <div className="hidden md:block">
          <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <div className="space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Публичная ссылка на пост</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Демо-доступ для обычного пользователя</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Основной поток — через подключённые каналы</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
      <span>{text}</span>
    </div>
  );
}

function AccessCard({
  user,
  role,
  demoLimitReached,
}: {
  user: TgUser | null;
  role: UserRole;
  demoLimitReached: boolean;
}) {
  if (!user) return null;

  const title = getRoleTitle(role);
  const description = getRoleDescription(role);
  const showWarning = role === "user" && demoLimitReached;

  return (
    <div className="mt-6 rounded-[28px] border border-neutral-200 bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-neutral-500">
            {user.first_name || user.username || "Telegram"}
          </div>
          <div className="mt-1 text-[18px] font-semibold text-neutral-950">
            {title}
          </div>
          <div className="mt-2 text-sm leading-6 text-neutral-600">
            {description}
          </div>
        </div>

        <div
          className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            role === "admin"
              ? "bg-violet-100 text-violet-700"
              : role === "channel_owner"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {role === "admin" || role === "channel_owner" ? (
            <ShieldCheck className="h-3.5 w-3.5" />
          ) : (
            <Lock className="h-3.5 w-3.5" />
          )}
          <span>{title}</span>
        </div>
      </div>

      {showWarning ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Лимит на сегодня уже использован. Завтра можно будет добавить ещё
            один пост, либо подключи канал для нормального доступа.
          </span>
        </div>
      ) : null}
    </div>
  );
}

export function AddScreen({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [user, setUser] = useState<TgUser | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState<ContentTag | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setUser(readTelegramUserFromStorage());
    };

    syncUser();

    window.addEventListener("focus", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const isAuthorized = !!user;
  const role = useMemo(() => resolveUserRole(user), [user]);
  const isDemoUser = role === "user";
  const isPrivileged = role === "channel_owner" || role === "admin";
  const demoLimitReached = useMemo(
    () => hasDailyDemoLimitReached(role),
    [role, isSubmitting, successMessage]
  );

  const parsedPost = useMemo(() => parseTelegramPostUrl(url), [url]);

  const validationMessage = useMemo(() => {
    if (!url.trim()) return "";
    if (parsedPost) return "";
    return "Нужна публичная ссылка вида t.me/channel/123. Приватные и кривые ссылки пока не принимаем.";
  }, [parsedPost, url]);

  const tagRequired = isDemoUser;

  const submitHint = useMemo(() => {
    if (!isAuthorized) {
      return "Сначала войди через Telegram.";
    }

    if (role === "admin") {
      return "Админ может публиковать без демо-лимита.";
    }

    if (role === "channel_owner") {
      return "Подключённый канал публикует без демо-лимита. Позже сюда добавим defaultTag от канала.";
    }

    if (demoLimitReached) {
      return "Пробный лимит на сегодня уже использован.";
    }

    return "Обычный пользователь может добавить 1 пост в день.";
  }, [demoLimitReached, isAuthorized, role]);

  const clearMessages = () => {
    if (submitError) setSubmitError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async () => {
    const cleanUrl = url.trim();

    setSubmitError("");
    setSuccessMessage("");

    if (!isAuthorized) {
      setSubmitError("Сначала авторизуйтесь через Telegram.");
      return;
    }

    if (role === "guest") {
      setSubmitError("Сначала авторизуйтесь через Telegram.");
      return;
    }

    if (isDemoUser && demoLimitReached) {
      setSubmitError(
        "На сегодня лимит уже исчерпан. Завтра можно добавить ещё один пост, либо подключи канал для полного доступа."
      );
      return;
    }

    if (!cleanUrl) {
      setSubmitError("Вставь ссылку на Telegram-пост.");
      return;
    }

    if (!parsedPost) {
      setSubmitError(
        "Сейчас можно добавить только публичный Telegram-пост вида t.me/channel/123."
      );
      return;
    }

    if (tagRequired && !selectedTag) {
      setSubmitError("Выберите тег для поста.");
      return;
    }

    try {
      setIsSubmitting(true);

      const normalized = normalizeTelegramUrl(cleanUrl);

      if (!normalized) {
        setSubmitError("Не удалось распознать ссылку на Telegram-пост.");
        return;
      }

      const effectiveTag = selectedTag || "other";

      await onAdd({
        url: normalized,
        tag: effectiveTag,
      });

      if (isDemoUser) {
        writeLastSubmitAt(Date.now());
      }

      setSuccessMessage(
        isPrivileged
          ? "Пост добавлен. Для подключённых каналов позже сюда подключим defaultTag и автологику."
          : "Пост добавлен в ленту."
      );
      setUrl("");
      setSelectedTag(null);
      setTagsOpen(false);
    } catch (error: any) {
      console.error(error);
      setSubmitError(
        String(error?.message || "Не удалось сохранить пост в общую ленту.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="text-[28px] font-semibold tracking-tight">
          Добавить пост
        </div>

        {!isAuthorized ? <AuthBlock /> : null}

        <AccessCard
          user={user}
          role={role}
          demoLimitReached={demoLimitReached}
        />

        <div className="mt-6 rounded-[32px] border border-neutral-200 bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="mb-4 text-[18px] font-semibold">
            Ссылка на Telegram-пост
          </div>

          <Input
            value={url}
            onChange={(event) => {
              clearMessages();
              setUrl(event.target.value);
            }}
            placeholder="https://t.me/channel/123"
          />

          {validationMessage ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationMessage}</span>
            </div>
          ) : url.trim() && parsedPost ? (
            <div className="mt-3 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Ссылка распознана: @{parsedPost.channel} / {parsedPost.postId}
              </span>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
            {submitHint}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left"
            >
              <span
                className={selectedTag ? "text-neutral-950" : "text-neutral-400"}
              >
                {selectedTag
                  ? getTagLabel(selectedTag)
                  : tagRequired
                  ? "Выбери тег"
                  : "Тег можно не выбирать пока"}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {tagsOpen ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {TAG_OPTIONS.map((tag) => {
                  const active = selectedTag === tag.value;

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() => {
                        setSelectedTag(tag.value);
                        setTagsOpen(false);
                        if (submitError) setSubmitError("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-neutral-950 text-white"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {!tagRequired ? (
              <div className="mt-3 text-sm leading-6 text-neutral-500">
                Для подключённых каналов позже подставим defaultTag
                автоматически. Пока без выбора тега отправим как{" "}
                <span className="font-medium text-neutral-700">other</span>.
              </div>
            ) : null}
          </div>

          {submitError ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleSubmit();
            }}
            disabled={isSubmitting || (isDemoUser && demoLimitReached)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isSubmitting
                ? "Публикуем..."
                : isDemoUser && demoLimitReached
                ? "Лимит на сегодня исчерпан"
                : "Опубликовать"}
            </span>
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <RuleItem
            icon={LinkIcon}
            text="Добавляй только публичные посты из Telegram."
          />
          <RuleItem
            icon={Globe}
            text="Контент попадает в ленту временно и живёт ограниченное время."
          />
          <RuleItem
            icon={CheckCircle2}
            text="Сейчас обычный доступ ограничен. Основной поток контента будет идти через подключённые каналы."
          />
        </div>
      </div>
    </div>
  );
}