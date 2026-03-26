import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { PostModal } from "./components/modals/PostModal";
import { initialVideos } from "./data/videos";
import { getInitialLocale } from "./lib/i18n";
import { AddScreen } from "./screens/AddScreen";
import { CreatorScreen } from "./screens/CreatorScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { SourceScreen } from "./screens/SourceScreen";
import type { ContentTag, Locale, MediaType, TabId, Video } from "./types/app";

const TG_STORAGE_KEY = "margelet_tg_user";
const TG_RELOAD_KEY = "margelet_tg_auth_reloaded";
const LIKES_STORAGE_KEY = "margelet_likes";
const SAVES_STORAGE_KEY = "margelet_saves";

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
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

export default function App() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [current, setCurrent] = useState<TabId>("feed");
  const [previousTab, setPreviousTab] = useState<TabId>("feed");
  const [serverVideos, setServerVideos] = useState<Video[]>([]);
  const [selectedPost, setSelectedPost] = useState<Video | null>(null);
  const [selectedSourceChannel, setSelectedSourceChannel] = useState<string | null>(null);
  const [isFeedLoading, setIsFeedLoading] = useState(true);

  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);

  const videos = useMemo(() => {
    const serverIds = new Set(serverVideos.map((video) => video.id));
    const fallbackSeed = initialVideos.filter((video) => !serverIds.has(video.id));
    return [...serverVideos, ...fallbackSeed];
  }, [serverVideos]);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocale(initial);

    const introSeen = localStorage.getItem("margelet-intro-seen");
    setHasSeenIntro(introSeen === "1");
  }, []);

  useEffect(() => {
    const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
    const storedSaves = localStorage.getItem(SAVES_STORAGE_KEY);

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
  }, []);

  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

  useEffect(() => {
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    const tgUser = parseTelegramUserFromHash();

    if (!tgUser) {
      sessionStorage.removeItem(TG_RELOAD_KEY);
      return;
    }

    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(tgUser));

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
    let cancelled = false;

    async function loadFeed() {
      try {
        setIsFeedLoading(true);
        const res = await fetch("/api/feed");
        if (!res.ok) throw new Error("feed request failed");

        const data = await res.json();
        if (!cancelled) {
          setServerVideos(Array.isArray(data.posts) ? data.posts : []);
        }
      } catch (error) {
        console.error("Failed to load feed", error);
      } finally {
        if (!cancelled) {
          setIsFeedLoading(false);
        }
      }
    }

    loadFeed();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleFinishIntro = () => {
    localStorage.setItem("margelet-intro-seen", "1");
    setHasSeenIntro(true);
    setCurrent("feed");
  };

  const handleToggleLike = (id: number) => {
    const isLiked = likedPostIds.includes(id);

    setLikedPostIds((prev) =>
      isLiked ? prev.filter((postId) => postId !== id) : [...prev, id]
    );

    setServerVideos((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, likes: Math.max(0, v.likes + (isLiked ? -1 : 1)) }
          : v
      )
    );

    setSelectedPost((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            likes: Math.max(0, prev.likes + (isLiked ? -1 : 1)),
          }
        : prev
    );
  };

  const handleToggleSave = (id: number) => {
    setSavedPostIds((prev) =>
      prev.includes(id)
        ? prev.filter((postId) => postId !== id)
        : [...prev, id]
    );
  };

  const handleAdd = async ({
    url,
    title,
    channel,
    tag,
    previewUrl,
    mediaType,
    videoUrl,
    channelVerified,
  }: {
    url: string;
    title: string;
    channel: string;
    tag: ContentTag;
    previewUrl?: string | null;
    mediaType?: MediaType;
    videoUrl?: string | null;
    channelVerified?: boolean;
  }) => {
    const res = await fetch("/api/submit-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        title,
        channel,
        tag,
        previewUrl: previewUrl || null,
        mediaType,
        videoUrl: videoUrl || null,
        channelVerified: !!channelVerified,
      }),
    });

    if (!res.ok) {
      throw new Error("submit failed");
    }

    const data = await res.json();
    if (!data?.post) {
      throw new Error("submit returned empty post");
    }

    setServerVideos((prev) => {
      const rest = prev.filter((video) => video.id !== data.post.id);
      return [data.post, ...rest];
    });

    setCurrent("feed");
  };

  const openSource = (channel: string) => {
    setPreviousTab(current);
    setSelectedSourceChannel(channel);
    setCurrent("source");
  };

  const goBackFromSource = () => {
    setCurrent(previousTab);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {current !== "source" && (
        <AppHeader current={current} setCurrent={setCurrent} locale={locale} />
      )}

      {!hasSeenIntro ? (
        <IntroScreen
          locale={locale}
          onChangeLocale={setLocale}
          onFinish={handleFinishIntro}
        />
      ) : (
        <>
          {current === "intro" && (
            <IntroScreen
              locale={locale}
              onChangeLocale={setLocale}
              onFinish={handleFinishIntro}
            />
          )}

          {current === "feed" && (
            <FeedScreen
              locale={locale}
              videos={videos}
              likedPostIds={likedPostIds}
              savedPostIds={savedPostIds}
              onToggleLike={handleToggleLike}
              onToggleSave={handleToggleSave}
              openSource={openSource}
            />
          )}

          {current === "add" && (
            <AddScreen
              locale={locale}
              onAdd={handleAdd}
            />
          )}

          {current === "creator" && (
            <CreatorScreen
              locale={locale}
              videos={videos}
              openPost={setSelectedPost}
            />
          )}

          {current === "source" && (
            <SourceScreen
              locale={locale}
              videos={videos}
              sourceChannel={selectedSourceChannel}
              onBack={goBackFromSource}
              onOpenPost={setSelectedPost}
            />
          )}
        </>
      )}

      <PostModal
        video={selectedPost}
        locale={locale}
        likedPostIds={likedPostIds}
        savedPostIds={savedPostIds}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        onClose={() => setSelectedPost(null)}
      />

      {isFeedLoading && current === "feed" ? null : null}
    </div>
  );
}