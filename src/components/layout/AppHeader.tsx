import { User } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale, TabId } from "../../types/app";
import {
  FEED_FILTER_STATE_EVENT,
  FEED_FILTER_TOGGLE_EVENT,
} from "../../screens/feed/feed.constants";
import { MargeletMark } from "../shared/MargeletMark";

const TG_STORAGE_KEY = "margelet_tg_user";

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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
    const handleState = (event: Event) => {
      const customEvent = event as CustomEvent<boolean>;
      setFiltersOpen(Boolean(customEvent.detail));
    };

    window.addEventListener(
      FEED_FILTER_STATE_EVENT,
      handleState as EventListener
    );

    return () => {
      window.removeEventListener(
        FEED_FILTER_STATE_EVENT,
        handleState as EventListener
      );
    };
  }, []);

  const isCreatorActive = current === "creator";
  const showBackArrow =
    current === "creator" || current === "add" || current === "source";

  const handleLeftAction = () => {
    if (current === "feed") {
      window.dispatchEvent(new CustomEvent(FEED_FILTER_TOGGLE_EVENT));
      return;
    }

    setCurrent("feed");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-md">
      <div className="mx-auto grid h-16 w-full max-w-[570px] grid-cols-3 items-center px-4">
        <div className="flex items-center justify-start">
          <button
            onClick={handleLeftAction}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-200"
            aria-label={current === "feed" ? "Фильтры" : "Назад"}
            title={current === "feed" ? "Фильтры" : "Назад"}
            type="button"
          >
            <div
              className={`transition ${
                showBackArrow
                  ? "rotate-210"
                  : filtersOpen
                    ? "rotate-210"
                    : "rotate-240"
              }`}
            >
              <MargeletMark className="h-5 w-5" colorClassName="text-neutral-950" />
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => setCurrent("feed")}
            className="text-center"
            aria-label="Margelet"
            title="Margelet"
            type="button"
          >
            <div className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-950">
              margeleT
            </div>
          </button>
        </div>

        <div className="flex items-center justify-end">
          <button
            onClick={() => setCurrent("creator")}
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full transition ${
              isCreatorActive
                ? "bg-neutral-950 text-white"
                : "text-neutral-700 hover:bg-neutral-200"
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
      </div>
    </header>
  );
}