import { ArrowLeft, Bell, Moon, Search, Sun, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale, TabId } from "../../types/app";
import { getTheme, toggleTheme, type Theme } from "../../lib/theme";

const TG_STORAGE_KEY = "margelet_tg_user";
const FEED_SUBSCRIPTIONS_TOGGLE_EVENT = "margelet:feed-subscriptions-toggle";
const FEED_SUBSCRIPTIONS_BADGE_EVENT = "margelet:feed-subscriptions-badge";
const FEED_SEARCH_TOGGLE_EVENT = "margelet:feed-search-toggle";
const FEED_SEARCH_STATE_EVENT = "margelet:feed-search-state";

type Props = {
  current: TabId;
  setCurrent: (tab: TabId) => void;
  locale: Locale;
};

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

export function AppHeader({ current, setCurrent }: Props) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [subscriptionsOpen, setSubscriptionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasNewSubscriptions, setHasNewSubscriptions] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getTheme());

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

  useEffect(() => {
    const syncTheme = () => setTheme(getTheme());

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    window.addEventListener("focus", syncTheme);
    window.addEventListener("storage", syncTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("focus", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  useEffect(() => {
    const handleBadge = (event: Event) => {
      const detail = (event as CustomEvent<{ hasNew?: boolean }>).detail;
      setHasNewSubscriptions(Boolean(detail?.hasNew));
    };

    const handleSubscriptionsState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (typeof detail?.open === "boolean") {
        setSubscriptionsOpen(detail.open);
      }
    };

    const handleSearchState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setSearchOpen(Boolean(detail?.open));
    };

    window.addEventListener(FEED_SUBSCRIPTIONS_BADGE_EVENT, handleBadge as EventListener);
    window.addEventListener(FEED_SUBSCRIPTIONS_TOGGLE_EVENT, handleSubscriptionsState as EventListener);
    window.addEventListener(FEED_SEARCH_STATE_EVENT, handleSearchState as EventListener);

    return () => {
      window.removeEventListener(FEED_SUBSCRIPTIONS_BADGE_EVENT, handleBadge as EventListener);
      window.removeEventListener(FEED_SUBSCRIPTIONS_TOGGLE_EVENT, handleSubscriptionsState as EventListener);
      window.removeEventListener(FEED_SEARCH_STATE_EVENT, handleSearchState as EventListener);
    };
  }, []);

  const isCreatorActive = current === "creator";
  const showBackArrow =
    current === "creator" || current === "add" || current === "source";

  const handleLeftAction = () => {
    if (current === "feed") {
      window.dispatchEvent(new CustomEvent(FEED_SEARCH_TOGGLE_EVENT));
      return;
    }

    setCurrent("feed");
  };

  const handleToggleSubscriptions = () => {
    if (current !== "feed") return;

    window.dispatchEvent(new CustomEvent(FEED_SUBSCRIPTIONS_TOGGLE_EVENT));
  };

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
    window.dispatchEvent(new Event("storage"));
  };

  const handleTitleAction = () => {
    if (current === "feed") {
      window.location.reload();
      return;
    }

    window.location.assign("/");
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 border-b border-soft bg-surface"
      style={{
        paddingTop: "var(--safe-area-top)",
        height: "var(--app-header-offset)",
      }}
    >
      <div className="mx-auto grid h-16 w-full max-w-[570px] grid-cols-[auto_auto_1fr_auto_auto] items-center gap-2 px-4">
        <button
          onClick={handleLeftAction}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
            current === "feed" && searchOpen
              ? "bg-surface-soft text-primary"
              : "text-secondary hover:bg-surface-soft hover:text-primary"
          }`}
          aria-label={current === "feed" ? (searchOpen ? "Закрыть поиск" : "Поиск") : "Назад"}
          title={current === "feed" ? (searchOpen ? "Закрыть поиск" : "Поиск") : "Назад"}
          type="button"
        >
          {showBackArrow ? (
            <ArrowLeft className="h-5 w-5 text-primary" />
          ) : searchOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>

        <button
          onClick={handleToggleSubscriptions}
          className={`relative flex h-10 w-10 items-center justify-center rounded-full transition ${
            current === "feed"
              ? subscriptionsOpen
                ? "bg-surface-soft text-primary"
                : "text-secondary hover:bg-surface-soft hover:text-primary"
              : "pointer-events-none opacity-0"
          }`}
          aria-label="Подписки"
          title="Подписки"
          type="button"
        >
          <Bell className="h-5 w-5" />
          {hasNewSubscriptions ? (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#38d25a] shadow-[0_0_10px_rgba(56,210,90,.85)]" />
          ) : null}
        </button>

        <div className="flex items-center justify-center">
          <button
            onClick={handleTitleAction}
            className="text-center"
            aria-label="margeleT"
            title="margeleT"
            type="button"
          >
            <div className="text-2xl font-extrabold tracking-[-0.03em] text-primary">
              margeleT
            </div>
          </button>
        </div>

        <button
          onClick={handleToggleTheme}
          className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
          aria-label="Сменить тему"
          title="Сменить тему"
          type="button"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setCurrent("creator")}
          className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition ${
            isCreatorActive
              ? "bg-accent text-accent-foreground"
              : "text-secondary hover:bg-surface-soft"
          }`}
          aria-label="Кабинет"
          title="Кабинет"
          type="button"
        >
          {user?.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.first_name}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}