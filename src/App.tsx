import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { getInitialLocale } from "./lib/i18n";
import { AddScreen } from "./screens/AddScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { CreatorScreen } from "./screens/CreatorScreen";
import { SourceScreen } from "./screens/SourceScreen";
import { AdminScreen } from "./screens/AdminScreen";
import type { ContentTag, IngestedPost, Locale, TabId } from "./types/app";

const TG_STORAGE_KEY = "margelet_tg_user";
const TG_RELOAD_KEY = "margelet_tg_auth_reloaded";
const LIKES_STORAGE_KEY = "margelet_likes";
const SAVES_STORAGE_KEY = "margelet_saves";
const HIDDEN_POSTS_STORAGE_KEY = "margelet_hidden_posts";

const ADMIN_HIDDEN_PATH = "/jim/admin";
const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

const FEED_LOADING_COPY: Record<Locale, string> = {
  en: "Loading feed...",
  ru: "Загрузка ленты...",
  de: "Feed wird geladen...",
  es: "Cargando feed...",
  tr: "Akış yükleniyor...",
  fr: "Chargement du flux...",
  it: "Caricamento del feed...",
  "pt-br": "Carregando feed...",
  id: "Memuat feed...",
  pl: "Ładowanie feedu...",
};

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

type UserRole = "guest" | "user" | "channel_owner" | "admin";

type AccessInfo = {
  telegramUserId: string;
  username: string | null;
  role: "user" | "channel_owner" | "admin";
  note: string | null;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function parseTelegramUserFromHash(): TgUser | null {
  const hash = window.location.hash || "";
  const match = hash.match(/tgAuthResult=([^&]+)/);

  if (!match?.[1]) return null;

  try {
    const encoded = match[1];
    const jsonString = decodeBase64Url(encoded);
    const parsed = JSON.parse(jsonString);

    if (!parsed?.id) return null;

    return {
      id: String(parsed.id),
      first_name: parsed.first_name || "",
      username: parsed.username || "",
      photo_url: parsed.photo_url || "",
    };
  } catch (error) {
    console.error("Failed to parse tgAuthResult from hash", error);
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

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const clean = pathname.trim();
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

function isAdminHiddenPath(pathname: string) {
  return normalizePathname(pathname) === ADMIN_HIDDEN_PATH;
}

function ensureRobotsMeta(name: string, content: string) {
  let element = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function parseSharedPath(pathname: string) {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/").filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  const [handle, postId] = parts;

  if (!handle || !postId) {
    return null;
  }

  return { handle, postId };
}

function getPostIdFromUrl(postUrl: string) {
  return postUrl.split("/").filter(Boolean).pop() || "";
}

function fallbackAccess(user: TgUser | null): AccessInfo | null {
  if (!user) return null;

  return {
    telegramUserId: user.id,
    username: user.username || null,
    role: ADMIN_TELEGRAM_IDS.has(user.id) ? "admin" : "user",
    note: null,
    grantedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

export default function App() {
const [locale, setLocale] = useState<Locale>("en");
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [current, setCurrent] = useState<TabId>("feed");
  const [serverPosts, setServerPosts] = useState<IngestedPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [showFeedLoadingHint ] = useState(false);
  const [currentTelegramUser, setCurrentTelegramUser] = useState<TgUser | null>(null);
  const [selectedSourceHandle, setSelectedSourceHandle] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);

  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);

  const userRole = useMemo<UserRole>(() => {
    if (!currentTelegramUser) return "guest";
    return accessInfo?.role || fallbackAccess(currentTelegramUser)?.role || "user";
  }, [accessInfo, currentTelegramUser]);

  const sharedPath = useMemo(() => {
    if (typeof window === "undefined") return null;
    return parseSharedPath(window.location.pathname);
  }, []);

  const posts = useMemo(() => {
    const visible =
      hiddenPostIds.length === 0
        ? serverPosts
        : serverPosts.filter((post) => !hiddenPostIds.includes(post.id));

    if (!sharedPath) {
      return visible;
    }

    const matchIndex = visible.findIndex((post) => {
      return (
        post.source.handle === sharedPath.handle &&
        getPostIdFromUrl(post.postUrl) === sharedPath.postId
      );
    });

    if (matchIndex <= 0) {
      return visible;
    }

    const target = visible[matchIndex];
    return [target, ...visible.filter((post) => post.id !== target.id)];
  }, [serverPosts, hiddenPostIds, sharedPath]);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocale(initial);

    const introSeen = localStorage.getItem("margelet-intro-seen");
    setHasSeenIntro(introSeen === "1");
    setCurrentTelegramUser(readTelegramUserFromStorage());

    if (isAdminHiddenPath(window.location.pathname)) {
      setCurrent("admin");
      return;
    }

    if (sharedPath) {
      setCurrent("feed");
    }
  }, [sharedPath]);

  useEffect(() => {
    const syncUser = () => {
      setCurrentTelegramUser(readTelegramUserFromStorage());
    };

    window.addEventListener("focus", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
    const storedSaves = localStorage.getItem(SAVES_STORAGE_KEY);
    const storedHidden = localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);

    if (storedLikes) {
      try {
        setLikedPostIds(JSON.parse(storedLikes));
      } catch {
        localStorage.removeItem(LIKES_STORAGE_KEY);
      }
    }

    if (storedSaves) {
      try {
        setSavedPostIds(JSON.parse(storedSaves));
      } catch {
        localStorage.removeItem(SAVES_STORAGE_KEY);
      }
    }

    if (storedHidden) {
      try {
        setHiddenPostIds(JSON.parse(storedHidden));
      } catch {
        localStorage.removeItem(HIDDEN_POSTS_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

  useEffect(() => {
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(hiddenPostIds));
  }, [hiddenPostIds]);

  useEffect(() => {
    const tgUser = parseTelegramUserFromHash();

    if (!tgUser) {
      sessionStorage.removeItem(TG_RELOAD_KEY);
      return;
    }

    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(tgUser));
    setCurrentTelegramUser(tgUser);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search
    );

    const alreadyReloaded = sessionStorage.getItem(TG_RELOAD_KEY) === "1";

    if (!alreadyReloaded) {
      sessionStorage.setItem(TG_RELOAD_KEY, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(TG_RELOAD_KEY);
    }
  }, []);

  useEffect(() => {
    const telegramUserId = currentTelegramUser?.id;

    if (!telegramUserId) {
      setAccessInfo(null);
      return;
    }

    let cancelled = false;

    async function loadAccess() {
      try {
        const res = await fetch("/api/access", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            telegramUserId,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!cancelled) {
          setAccessInfo(data?.access || fallbackAccess(currentTelegramUser));
        }
      } catch {
        if (!cancelled) {
          setAccessInfo(fallbackAccess(currentTelegramUser));
        }
      }
    }

    void loadAccess();

    return () => {
      cancelled = true;
    };
  }, [currentTelegramUser]);

  const loadFeed = async () => {
    setIsFeedLoading(true);

    try {
      const res = await fetch("/api/feed", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("feed request failed");
      }

      const data = await res.json();
      setServerPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (error) {
      console.error("Failed to load feed", error);
      setServerPosts([]);
    } finally {
      setIsFeedLoading(false);
    }
  };

  useEffect(() => {
    void loadFeed();
  }, []);

  useEffect(() => {
    let intervalId: number | null = null;

    const runHeartbeat = () => {
      if (document.visibilityState !== "visible") return;

      fetch("/api/feed?limit=1", {
        method: "GET",
        cache: "no-store",
      }).catch(() => {});
    };

    const startHeartbeat = () => {
      if (intervalId !== null) return;

      intervalId = window.setInterval(() => {
        runHeartbeat();
      }, 60000);
    };

    const stopHeartbeat = () => {
      if (intervalId === null) return;

      window.clearInterval(intervalId);
      intervalId = null;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        runHeartbeat();
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    };

    handleVisibilityChange();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopHeartbeat();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const isAdminRoute =
      current === "admin" || isAdminHiddenPath(window.location.pathname);

    if (isAdminRoute) {
      ensureRobotsMeta("robots", "noindex, nofollow, noarchive, nosnippet");
      ensureRobotsMeta("googlebot", "noindex, nofollow, noarchive, nosnippet");
      document.title = "margeleT";
      return;
    }

    ensureRobotsMeta("robots", "index, follow");
    ensureRobotsMeta("googlebot", "index, follow");
    document.title = "margeleT";
  }, [current]);

  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-id": currentTelegramUser?.id || "",
      },
      body: JSON.stringify({
        telegramUserId: currentTelegramUser?.id || null,
      }),
    }).catch(() => {});
  }, [currentTelegramUser]);

  const handleFinishIntro = () => {
    localStorage.setItem("margelet-intro-seen", "1");
    setHasSeenIntro(true);
    setCurrent("feed");
  };

  const handleToggleLike = (id: number) => {
    setLikedPostIds((prev) =>
      prev.includes(id) ? prev.filter((postId) => postId !== id) : [...prev, id]
    );
  };

  const handleToggleSave = (id: number) => {
    setSavedPostIds((prev) =>
      prev.includes(id) ? prev.filter((postId) => postId !== id) : [...prev, id]
    );
  };

  const handleHidePost = (id: number) => {
    setHiddenPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDeletePost = async (id: number) => {
    if (!currentTelegramUser?.id) {
      throw new Error("NO_TELEGRAM_USER");
    }

    const res = await fetch("/api/admin-posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity: "posts",
        id,
        telegramUserId: currentTelegramUser.id,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "delete failed");
    }

    setServerPosts((prev) => prev.filter((post) => post.id !== id));
    setHiddenPostIds((prev) => prev.filter((postId) => postId !== id));
    setLikedPostIds((prev) => prev.filter((postId) => postId !== id));
    setSavedPostIds((prev) => prev.filter((postId) => postId !== id));
  };

  const handleAdd = async ({
    url,
    tag,
  }: {
    url: string;
    tag: ContentTag;
  }) => {
    const res = await fetch("/api/submit-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        tag,
        role: userRole === "guest" ? "user" : userRole,
        addedByTelegramId: currentTelegramUser?.id || null,
        addedByUsername: currentTelegramUser?.username || null,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "submit failed");
    }

    await loadFeed();
    setCurrent("feed");
  };

  const openSource = (handle: string) => {
    setSelectedSourceHandle(handle);
    setCurrent("source");
    window.history.replaceState({}, document.title, `/${handle}`);
  };

  const shouldShowIntro = !hasSeenIntro && current !== "admin" && !sharedPath;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {(!shouldShowIntro && current !== "intro" && current !== "admin") ? (
        <AppHeader current={current} setCurrent={setCurrent} locale={locale} />
      ) : null}      

      {shouldShowIntro ? (
        <IntroScreen
          locale={locale}
          onChangeLocale={setLocale}
          onFinish={handleFinishIntro}
        />
      ) : (
        <>
          {current === "intro" ? (
            <IntroScreen
              locale={locale}
              onChangeLocale={setLocale}
              onFinish={handleFinishIntro}
            />
          ) : null}

          {current === "feed" ? (
            <FeedScreen
              locale={locale}
              posts={posts}
              isFeedLoading={isFeedLoading}
              likedPostIds={likedPostIds}
              savedPostIds={savedPostIds}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              onHidePost={handleHidePost}
              onDeletePost={handleDeletePost}
              currentTelegramUserId={currentTelegramUser?.id || null}
              openSource={openSource}
            />
          ) : null}

          {current === "add" ? (
            <AddScreen
              locale={locale}
              currentTelegramUser={currentTelegramUser}
              userRole={userRole}
              onAdd={handleAdd}
            />
          ) : null}

          {current === "creator" ? (
            <CreatorScreen
              locale={locale}
              setLocale={setLocale}
              posts={posts}
              openPost={() => {
                setCurrent("feed");
              }}
            />
          ) : null}          

          {current === "source" ? (
            <SourceScreen
              locale={locale}
              posts={posts}
              sourceHandle={selectedSourceHandle}
              onBack={() => {
                setCurrent("feed");
                window.history.replaceState({}, document.title, "/");
              }}
              onOpenPost={() => {
                setCurrent("feed");
              }}
            />
          ) : null}

          {current === "admin" ? (
            <AdminScreen
              locale={locale}
              telegramUserId={currentTelegramUser?.id || null}
              onClose={() => setCurrent("feed")}
              onDeletePost={handleDeletePost}
            />
          ) : null}
        </>
      )}

      {isFeedLoading && showFeedLoadingHint && current === "feed" && !shouldShowIntro ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          {FEED_LOADING_COPY[locale] ?? FEED_LOADING_COPY.en}
        </div>
      ) : null}      
    </div>
  );
}