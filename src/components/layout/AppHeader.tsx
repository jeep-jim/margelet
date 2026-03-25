import { Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale, TabId } from "../../types/app";

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

  const isCreatorActive = current === "creator";
  const isAddActive = current === "add";

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-md">
      <div className="mx-auto grid h-16 w-full max-w-[720px] grid-cols-3 items-center px-4">
        <div className="flex items-center justify-start">
          <button
            onClick={() => setCurrent("add")}
            className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
              isAddActive
                ? "bg-neutral-950 text-white"
                : "text-neutral-700 hover:bg-neutral-200"
            }`}
            aria-label="Добавить"
            title="Добавить"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={() => setCurrent("feed")}
            className="text-center"
            aria-label="Margelet"
            title="Margelet"
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