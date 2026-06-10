import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { AddScreen } from "./screens/AddScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { CreatorScreen } from "./screens/CreatorScreen";
import { SourceScreen } from "./screens/SourceScreen";
import { AdminScreen } from "./screens/AdminScreen";
import type { ContentTag, IngestedPost, Locale, TabId } from "./types/app";
import { SplashLoader } from "./components/shared/SplashLoader";
// 🔥 Импортируем единую систему country-кодов
import type { CountryCode } from "../api/lib/contracts";
import { normalizeCountryCode, SEO_LOCALE_META } from "../api/lib/contracts";

const TG_STORAGE_KEY = "margelet_tg_user";
const TG_RELOAD_KEY = "margelet_tg_auth_reloaded";
const SAVES_STORAGE_KEY = "margelet_saves";
const LIKES_STORAGE_KEY = "margelet_likes";
const HIDDEN_POSTS_STORAGE_KEY = "margelet_hidden_posts";
const OPEN_ATTENTION_TOPIC_EVENT = "margelet:open-attention-topic";

const ADMIN_HIDDEN_PATH = "/jim/admin";
const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

const SITE_ORIGIN = "https://www.margelet.space";
const DEFAULT_LOCALE: Locale = "ru";

// 🔥 Генерируем список стран из единого SEO_LOCALE_META
const COUNTRY_CODES = new Set<CountryCode>(Object.keys(SEO_LOCALE_META) as CountryCode[]);

function ensureCanonicalLink(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function getCanonicalHref(pathname: string) {
  const clean = normalizePathname(pathname);

  if (isAdminHiddenPath(clean) || clean.startsWith("/jim/") || clean.startsWith("/admin")) {
    return `${SITE_ORIGIN}/`;
  }

  return `${SITE_ORIGIN}${clean === "/" ? "" : clean}`;
}

// 🔥 FEED_LOADING_COPY теперь использует CountryCode из SEO_LOCALE_META
type FeedLoadingCopy = Partial<Record<CountryCode, string>>;

const FEED_LOADING_COPY: FeedLoadingCopy = {
  ru: "Загрузка ленты...",
  ua: "Завантаження стрічки...",
  us: "Loading feed...",
  in: "Loading feed...",
  ir: "در حال بارگذاری فید...",
  tr: "Akış yükleniyor...",
  br: "Carregando feed...",
  kz: "Лента жүктелуде...",
  uz: "Lenta yuklanmoqda...",
  ae: "جاري تحميل الخلاصة...",
  eg: "جاري تحميل الخلاصة...",
  pk: "Loading feed...",
  id: "Memuat feed...",
  mx: "Cargando feed...",
  sa: "جاري تحميل الخلاصة...",
  es: "Cargando feed...",
  it: "Caricamento del feed...",
  fr: "Chargement du flux...",
  de: "Feed wird geladen...",
  ar: "Cargando feed...",
  co: "Cargando feed...",
  za: "Loading feed...",
  ng: "Loading feed...",
  cn: "正在加载内容流...",
  my: "Memuat feed...",
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

function parseSourcePath(pathname: string) {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/").filter(Boolean);

  if (parts.length !== 1) {
    return null;
  }

  const [handle] = parts;

  if (!handle || handle === "jim") {
    return null;
  }

  // 🔥 Теперь проверяем country коды через normalizeCountryCode
  if (COUNTRY_CODES.has(normalizeCountryCode(handle))) {
    return null;
  }

  return handle;
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

async function loadServerFeed(_locale: Locale): Promise<IngestedPost[]> {
  const readPosts = (payload: any): IngestedPost[] => {
    if (Array.isArray(payload?.posts)) return payload.posts;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  try {
    const indexRes = await fetch(`/feeds/index.json`);

    if (indexRes.ok) {
      const index = await indexRes.json();
      const countries = Object.values(index?.countries || {}) as Array<{
        path?: string;
        mode?: "single" | "chunked";
        chunks?: Array<{ path?: string }> | number;
      }>;

      const countryPosts = await Promise.all(
        countries.map(async (country: any) => {
          if (!country?.path) return [];

          const countryRes = await fetch(country.path);
          if (!countryRes.ok) return [];

          const countryData = await countryRes.json();

          const directPosts = readPosts(countryData);
          if (directPosts.length > 0) return directPosts;

          if (Array.isArray(countryData?.chunks)) {
            const chunkPosts = await Promise.all(
              countryData.chunks.map(async (chunk: any) => {
                if (!chunk?.path) return [];

                const chunkRes = await fetch(chunk.path);
                if (!chunkRes.ok) return [];

                const chunkData = await chunkRes.json();
                return readPosts(chunkData);
              })
            );

            return chunkPosts.flat();
          }

          return [];
        })
      );

      const posts = countryPosts.flat();

      if (posts.length > 0) {
        return posts.sort(
          (a, b) =>
            Date.parse(String(b.createdAt || "")) -
            Date.parse(String(a.createdAt || ""))
        );
      }
    }
  } catch {
    //
  }

  try {
    const res = await fetch(`/api/feed`);

    const contentType = res.headers.get("content-type") || "";

    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      return readPosts(data);
    }
  } catch {
    //
  }

  const fallbackRes = await fetch(`/feed.json`);

  if (!fallbackRes.ok) {
    throw new Error("feed request failed");
  }

  const fallbackData = await fallbackRes.json();
  return readPosts(fallbackData);
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => DEFAULT_LOCALE);  
  const [current, setCurrent] = useState<TabId>("feed");
  const [serverPosts, setServerPosts] = useState<IngestedPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [showFeedLoadingHint] = useState(false);
  const [currentTelegramUser, setCurrentTelegramUser] = useState<TgUser | null>(null);
  const [selectedSourceHandle, setSelectedSourceHandle] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [locationPath, setLocationPath] = useState<string>(() =>
    typeof window === "undefined" ? "/" : normalizePathname(window.location.pathname)
  );

  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);

  const userRole = useMemo<UserRole>(() => {
    if (!currentTelegramUser) return "guest";
    return accessInfo?.role || fallbackAccess(currentTelegramUser)?.role || "user";
  }, [accessInfo, currentTelegramUser]);

  const sharedPath = useMemo(() => parseSharedPath(locationPath), [locationPath]);
  const sourcePathHandle = useMemo(() => parseSourcePath(locationPath), [locationPath]);

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

  const syncPathState = useCallback(() => {
    setLocationPath(normalizePathname(window.location.pathname));
  }, []);

  const replacePath = useCallback((nextPath: string) => {
    const normalized = normalizePathname(nextPath);
    if (normalizePathname(window.location.pathname) !== normalized) {
      window.history.replaceState({}, document.title, normalized);
    }
    setLocationPath(normalized);
  }, []);

  const goHome = useCallback(() => {
    setSelectedSourceHandle(null);
    setCurrent("feed");
    replacePath("/");
  }, [replacePath]);

  const openSource = useCallback(
    (handle: string) => {
      setSelectedSourceHandle(handle);
      setCurrent("source");
      replacePath(`/${handle}`);
    },
    [replacePath]
  );

  useEffect(() => {
    function handleOpenAttentionTopic() {
      setSelectedSourceHandle(null);
      setCurrent("feed");
      replacePath("/");
    }

    window.addEventListener(OPEN_ATTENTION_TOPIC_EVENT, handleOpenAttentionTopic);

    return () => {
      window.removeEventListener(OPEN_ATTENTION_TOPIC_EVENT, handleOpenAttentionTopic);
    };
  }, [replacePath]);

  const handleHeaderTabChange = useCallback(
    (tab: TabId) => {
      if (tab === "feed") {
        goHome();
        return;
      }

      if (tab === "add") {
        setSelectedSourceHandle(null);
        setCurrent("add");
        replacePath("/");
        return;
      }

      if (tab === "creator") {
        setSelectedSourceHandle(null);
        setCurrent("creator");
        replacePath("/");
        return;
      }

      if (tab === "admin") {
        setSelectedSourceHandle(null);
        setCurrent("admin");
        replacePath(ADMIN_HIDDEN_PATH);
        return;
      }

      setCurrent(tab);
    },
    [goHome, replacePath]
  );

  useEffect(() => {
    setLocale(DEFAULT_LOCALE);

    setCurrentTelegramUser(readTelegramUserFromStorage());

    if (isAdminHiddenPath(window.location.pathname)) {
      setCurrent("admin");
      return;
    }

    const currentShared = parseSharedPath(window.location.pathname);
    if (currentShared) {
      setSelectedSourceHandle(currentShared.handle);
      setCurrent("source");
      return;
    }

    const currentSource = parseSourcePath(window.location.pathname);
    if (currentSource) {
      setSelectedSourceHandle(currentSource);
      setCurrent("source");
      return;
    }

    const countryPath = normalizePathname(window.location.pathname)
      .split("/")
      .filter(Boolean)[0];

    if (countryPath && COUNTRY_CODES.has(normalizeCountryCode(countryPath))) {
      setLocale(normalizeCountryCode(countryPath) as Locale);
      setCurrent("feed");
      return;
    }

    setCurrent("feed");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      syncPathState();

      const pathname = normalizePathname(window.location.pathname);

      if (isAdminHiddenPath(pathname)) {
        setCurrent("admin");
        return;
      }

      const currentShared = parseSharedPath(pathname);
      if (currentShared) {
        setSelectedSourceHandle(currentShared.handle);
        setCurrent("source");
        return;
      }

      const currentSource = parseSourcePath(pathname);
      if (currentSource) {
        setSelectedSourceHandle(currentSource);
        setCurrent("source");
        return;
      }

      const countryPath = pathname
        .split("/")
        .filter(Boolean)[0];

      if (countryPath && COUNTRY_CODES.has(normalizeCountryCode(countryPath))) {
        setLocale(normalizeCountryCode(countryPath) as Locale);
        setSelectedSourceHandle(null);
        setCurrent("feed");
        return;
      }

      setSelectedSourceHandle(null);
      setCurrent("feed");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncPathState]);

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
    const storedSaves = localStorage.getItem(SAVES_STORAGE_KEY);
    const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
    const storedHidden = localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);


    if (storedSaves) {
      try {
        setSavedPostIds(JSON.parse(storedSaves));
      } catch {
        localStorage.removeItem(SAVES_STORAGE_KEY);
      }
    }

    if (storedLikes) {
      try {
        setLikedPostIds(JSON.parse(storedLikes));
      } catch {
        localStorage.removeItem(LIKES_STORAGE_KEY);
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
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

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
    syncPathState();

    const alreadyReloaded = sessionStorage.getItem(TG_RELOAD_KEY) === "1";

    if (!alreadyReloaded) {
      sessionStorage.setItem(TG_RELOAD_KEY, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(TG_RELOAD_KEY);
    }
  }, [syncPathState]);

  useEffect(() => {
    if (!currentTelegramUser) {
      setAccessInfo(null);
      return;
    }

    setAccessInfo(fallbackAccess(currentTelegramUser));
  }, [currentTelegramUser]);  

  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    setServerPosts([]);

    try {
      const nextPosts = await loadServerFeed(locale);
      setServerPosts(nextPosts);
    } catch (error) {
      console.error("Failed to load feed", error);
      setServerPosts([]);
    } finally {
      setIsFeedLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const isPrivateScreen = current === "admin";
    const robotsContent = isPrivateScreen
      ? "noindex,nofollow,noarchive,nosnippet"
      : "index,follow,max-snippet:-1,max-image-preview:large";

    ensureRobotsMeta("robots", robotsContent);
    ensureRobotsMeta("googlebot", robotsContent);
    ensureCanonicalLink(getCanonicalHref(locationPath));
  }, [current, locationPath]);


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
    setSavedPostIds((prev) => prev.filter((postId) => postId !== id));
    setLikedPostIds((prev) => prev.filter((postId) => postId !== id));
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
        locale,
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
    goHome();
  };

  return (
    <div className="bg-app text-primary min-h-screen">
      {current !== "admin" ? (
        <AppHeader
          current={current}
          setCurrent={handleHeaderTabChange}
          locale={locale}
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
            goHome();
          }}
        />
      ) : null}

      {current === "source" ? (
        <SourceScreen
          locale={locale}
          posts={posts}
          sourceHandle={selectedSourceHandle || sourcePathHandle}
          onBack={goHome}
          onOpenPost={(post) => {
            const postId = getPostIdFromUrl(post.postUrl);
            setSelectedSourceHandle(post.source.handle);
            setCurrent("source");
            replacePath(`/${post.source.handle}/${postId}`);
          }}
          likedPostIds={likedPostIds}
          onToggleLike={handleToggleLike}
          onHidePost={handleHidePost}
          onDeletePost={handleDeletePost}
          currentTelegramUserId={currentTelegramUser?.id || null}
          openSource={openSource}
        />
      ) : null}

      {current === "admin" ? (
        <AdminScreen
          locale={locale}
          telegramUserId={currentTelegramUser?.id || null}
          onClose={goHome}
          onDeletePost={handleDeletePost}
        />
      ) : null}

      {isFeedLoading && showFeedLoadingHint && current === "feed" ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          {FEED_LOADING_COPY[normalizeCountryCode(locale)] ?? FEED_LOADING_COPY.us}
        </div>
      ) : null}
      {isFeedLoading && current === "feed" ? <SplashLoader /> : null}
    </div>
  );
}