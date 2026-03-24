import { useCallback, useEffect, useState } from "react";

const TELEGRAM_BOT_ID = "8298054487";
const STORAGE_KEY = "margelet_tg_user";

export type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

function readUserFromStorage(): TgUser | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TgUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function readUserFromUrl(): TgUser | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return null;

  return {
    id,
    first_name: params.get("first_name") || "",
    username: params.get("username") || "",
    photo_url: params.get("photo_url") || "",
  };
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TgUser | null>(null);

  const syncUser = useCallback(() => {
    const urlUser = readUserFromUrl();

    if (urlUser) {
      setUser(urlUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(urlUser));
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    const storedUser = readUserFromStorage();
    setUser(storedUser);
  }, []);

  useEffect(() => {
    syncUser();

    const handleFocus = () => syncUser();
    const handleStorage = () => syncUser();

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncUser]);

  const login = useCallback(() => {
    window.location.href = getTelegramAuthUrl();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return {
    user,
    isAuthorized: !!user,
    login,
    logout,
    syncUser,
  };
}