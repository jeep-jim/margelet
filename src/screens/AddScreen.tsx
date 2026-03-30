import {
  ArrowRightLeft,
  Link as LinkIcon,
  Plus,
  CheckCircle2,
  AlertCircle,
  Globe,
  ChevronDown,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContentTag, Locale } from "../types/app";
import { Input } from "../components/ui/Input";
import { normalizeTelegramUrl } from "../lib/telegram";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";

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

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

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
            Авторизуйтесь, чтобы публиковать Telegram-посты в общей ленте MargeleT.
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
                <span>Ссылка на пост</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Добавление в ленту</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Дальше ingest сделает всё сам</span>
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
  const parsedPost = useMemo(() => parseTelegramPostUrl(url), [url]);

  const validationMessage = useMemo(() => {
    if (!url.trim()) return "";
    if (parsedPost) return "";
    return "Нужна публичная ссылка вида t.me/channel/123. Приватные и кривые ссылки пока не принимаем.";
  }, [parsedPost, url]);

  const clearMessages = () => {
    if (submitError) setSubmitError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async () => {
    const cleanUrl = url.trim();

    setSubmitError("");
    setSuccessMessage("");

    if (!cleanUrl) {
      setSubmitError("Вставь ссылку на Telegram-пост.");
      return;
    }

    if (!parsedPost) {
      setSubmitError("Сейчас можно добавить только публичный Telegram-пост вида t.me/channel/123.");
      return;
    }

    if (!selectedTag) {
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

      await onAdd({
        url: normalized,
        tag: selectedTag,
      });

      setSuccessMessage("Пост добавлен в ленту.");
      setUrl("");
      setSelectedTag(null);
      setTagsOpen(false);
    } catch (error) {
      console.error(error);
      setSubmitError("Не удалось сохранить пост в общую ленту.");
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

        <div className="mt-6 rounded-[32px] border border-neutral-200 bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
          <div className="mb-4 text-[18px] font-semibold">Ссылка на Telegram-пост</div>

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
          ) : null}

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setTagsOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-left"
            >
              <span className={selectedTag ? "text-neutral-950" : "text-neutral-400"}>
                {selectedTag ? getTagLabel(selectedTag) : "Выбери тег"}
              </span>
              <ChevronDown className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`} />
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
            disabled={isSubmitting}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition disabled:opacity-60"
          >
            {isSubmitting ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{isSubmitting ? "Публикуем..." : "Опубликовать"}</span>
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <RuleItem icon={LinkIcon} text="Добавляй только публичные посты из Telegram." />
          <RuleItem icon={Globe} text="Контент попадает в ленту временно и живёт ограниченное время." />
          <RuleItem icon={CheckCircle2} text="Тип поста и медиа теперь определяются на ingest-этапе." />
        </div>
      </div>
    </div>
  );
}