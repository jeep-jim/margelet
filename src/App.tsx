import { useEffect, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { PostModal } from "./components/modals/PostModal";
import { initialVideos } from "./data/videos";
import { getInitialLocale, messages } from "./lib/i18n";
import { AddScreen } from "./screens/AddScreen";
import { CreatorScreen } from "./screens/CreatorScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { IntroScreen } from "./screens/IntroScreen";
import { SourceScreen } from "./screens/SourceScreen";
import type { Locale, TabId, Video } from "./types/app";

export default function App() {
  const [locale, setLocale] = useState<Locale>("ru");
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  const [current, setCurrent] = useState<TabId>("feed");
  const [previousTab, setPreviousTab] = useState<TabId>("feed");
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [selectedPost, setSelectedPost] = useState<Video | null>(null);
  const [selectedSourceChannel, setSelectedSourceChannel] = useState<string | null>(null);

  useEffect(() => {
    const initial = getInitialLocale();
    setLocale(initial);

    const introSeen = localStorage.getItem("margelet-intro-seen");
    setHasSeenIntro(introSeen === "1");
  }, []);

  useEffect(() => {
    localStorage.setItem("margelet-locale", locale);
  }, [locale]);

  const handleFinishIntro = () => {
    localStorage.setItem("margelet-intro-seen", "1");
    setHasSeenIntro(true);
    setCurrent("feed");
  };

  const handleLike = (id: number) => {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, likes: v.likes + 1 } : v)));
  };

  const handleAdd = ({
    url,
    title,
    channel,
  }: {
    url: string;
    title: string;
    channel: string;
  }) => {
    const t = messages[locale];

    const palettes = [
      "from-fuchsia-500 via-purple-600 to-indigo-700",
      "from-amber-400 via-orange-500 to-rose-600",
      "from-sky-400 via-cyan-500 to-teal-600",
    ];

    setVideos((prev) => [
      {
        id: Date.now(),
        title: {
          ru: title || t.newVideoFallback,
          en: title || messages.en.newVideoFallback,
        },
        caption: {
          ru: t.newVideoCaption,
          en: messages.en.newVideoCaption,
        },
        channel: channel || t.newChannel,
        avatar: (channel || "NC")
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0] ?? "")
          .join("")
          .toUpperCase(),
        handle: `@${(channel || "newchannel").replace(/\s+/g, "").toLowerCase()}`,
        views: "0",
        likes: 0,
        comments: 0,
        duration: "0:24",
        lang: t.newLang,
        postUrl: url,
        bg: palettes[Math.floor(Math.random() * palettes.length)],
      },
      ...prev,
    ]);
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
              onLike={handleLike}
              openSource={openSource}
            />
          )}

          {current === "add" && <AddScreen locale={locale} onAdd={handleAdd} />}

          {current === "creator" && (
            <CreatorScreen locale={locale} videos={videos} openPost={setSelectedPost} />
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

      <PostModal video={selectedPost} locale={locale} onClose={() => setSelectedPost(null)} />
    </div>
  );
}