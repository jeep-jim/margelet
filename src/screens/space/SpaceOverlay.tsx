import { createPortal } from "react-dom";
import { Compass, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { IngestedPost, Locale } from "../../types/app";
import { getSpaceCopy } from "./i18n";
import { applyTheme, getTelegramAuthUrl, getUserName, inferPlanetId, readTelegramUser, readTheme } from "./lib/space-engine";
import { useSpaceCamera } from "./hooks/useSpaceCamera";
import { useSpaceSearch } from "./hooks/useSpaceSearch";
import { useSpaceSignals } from "./hooks/useSpaceSignals";
import type { SpacePlanetId, SpaceSignalKind, SpaceTelegramUser, SpaceTheme } from "./types";
import { SpaceBackground } from "./components/SpaceBackground";
import { SpaceCreateModal } from "./components/SpaceCreateModal";
import { SpaceHeader } from "./components/SpaceHeader";
import { SpacePlanetPicker } from "./components/SpacePlanetPicker";
import { SpaceSearch } from "./components/SpaceSearch";
import { SpaceSignalCard } from "./components/SpaceSignalCard";
import { SpaceStory } from "./components/SpaceStory";
import { SpaceStyle } from "./components/SpaceStyle";
import { SpaceWorld } from "./components/SpaceWorld";
import { SpaceZoomControls } from "./components/SpaceZoomControls";

export function SpaceOverlay({
  locale,
  posts: _posts,
  onClose,
}: {
  locale: Locale;
  posts: IngestedPost[];
  onClose: () => void;
}) {
  const [theme, setTheme] = useState<SpaceTheme>(() => readTheme());
  const [telegramUser, setTelegramUser] = useState<SpaceTelegramUser | null>(() => readTelegramUser());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [magnetId, setMagnetId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kind, setKind] = useState<SpaceSignalKind>("ask");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activePlanet, setActivePlanet] = useState<SpacePlanetId>("all");
  const [toast, setToast] = useState<string | null>(null);

  const copy = useMemo(() => getSpaceCopy(locale), [locale]);
  const isLight = theme === "light";
  const camera = useSpaceCamera();
  const { visibleSignals, createSignal, addReply, removeSignal } = useSpaceSignals();
  const selected = visibleSignals.find((item) => item.id === selectedId) || null;
  const magnet = visibleSignals.find((item) => item.id === magnetId) || null;
  const searchMatchedIds = useSpaceSearch(searchQuery, visibleSignals);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const preventGesture = (event: Event) => event.preventDefault();
    document.addEventListener("gesturestart", preventGesture, { passive: false } as AddEventListenerOptions);
    document.addEventListener("gesturechange", preventGesture, { passive: false } as AddEventListenerOptions);

    const sync = () => {
      setTheme(readTheme());
      setTelegramUser(readTelegramUser());
    };

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  };
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };

  const handleProfile = () => {
    if (telegramUser) {
      showToast(`Telegram: ${getUserName(telegramUser)}`);
      return;
    }
    window.location.href = getTelegramAuthUrl();
  };

  const handleNotifications = () => {
    showToast("У вас пока нет событий.");
  };


  const resetSpace = () => {
    setSelectedId(null);
    setMagnetId(null);
    setSearchQuery("");
    camera.resetViewport();
  };

  const resetMagnetOnly = () => {
    setMagnetId(null);
  };

  const handleCreateSignal = () => {
    const next = createSignal({ text, kind, user: telegramUser });
    if (!next) return;
    setText("");
    setComposerOpen(false);
    setSelectedId(null);
    setMagnetId(next.id);
    setActivePlanet(next.planetId || inferPlanetId(next.text));
    setTimeout(() => camera.focusTo(next, 1.18), 80);
  };

  const handleReply = () => {
    if (!selected) return;
    const ok = addReply({ signal: selected, text: replyText, user: telegramUser });
    if (ok) setReplyText("");
  };

  const handleDelete = () => {
    if (!selected) return;
    removeSignal(selected.id);
    if (magnetId === selected.id) setMagnetId(null);
    setSelectedId(null);
  };

  const applySearch = () => {
    const firstMatch = visibleSignals.find((signal) => searchMatchedIds.has(signal.id));
    setSearchOpen(false);
    if (!firstMatch) return;
    setSelectedId(null);
    setMagnetId(null);
    setActivePlanet(firstMatch.planetId || inferPlanetId(firstMatch.text));
    setTimeout(() => camera.focusTo(firstMatch, 1.25), 40);
  };

  const handleMySignals = () => {
    if (!telegramUser) {
      setComposerOpen(true);
      return;
    }

    const myName = getUserName(telegramUser);
    const ownSignal = visibleSignals.find((signal) => !signal.id.startsWith("demo-") && signal.authorName === myName);
    if (!ownSignal) {
      setComposerOpen(true);
      return;
    }

    setSelectedId(ownSignal.id);
    setMagnetId(null);
    setActivePlanet(ownSignal.planetId || inferPlanetId(ownSignal.text));
    setTimeout(() => camera.focusTo(ownSignal, 1.14), 60);
  };

  const hasOverlayState = Boolean(selectedId || magnetId || composerOpen || searchOpen || introOpen || searchQuery.trim());

  return createPortal(
    <div className={`space-root fixed inset-0 z-[1000] overflow-hidden ${isLight ? "bg-[#edf3fa] text-[#08111d]" : "bg-[#02060d] text-white"}`}>
      <SpaceStyle />
      <SpaceBackground theme={theme} viewport={camera.viewport} planetId={activePlanet} />
      {magnet ? <div className={`pointer-events-none absolute inset-0 z-[9] transition-opacity duration-500 ${isLight ? "bg-slate-900/20" : "bg-black/24"}`} /> : null}

      <SpaceHeader
        isLight={isLight}
        telegramUser={telegramUser}
        hasOverlayState={hasOverlayState}
        onBack={() => {
          if (introOpen) {
            setIntroOpen(false);
            return;
          }
          if (composerOpen) {
            setComposerOpen(false);
            return;
          }
          if (searchOpen) {
            setSearchOpen(false);
            return;
          }
          if (selectedId || magnetId || searchQuery.trim()) {
            resetSpace();
            return;
          }
          onClose();
        }}
        onSearch={() => setSearchOpen(true)}
        onToggleTheme={toggleTheme}
        onStory={() => setIntroOpen(true)}
        onNotifications={handleNotifications}
        onProfile={handleProfile}
      />

      <div
        ref={camera.stageRef}
        className="space-stage absolute left-0 right-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-10 overflow-hidden"
        onWheel={camera.onWheel}
        onPointerDown={camera.onPointerDown}
        onPointerMove={camera.onPointerMove}
        onPointerUp={camera.onPointerUp}
        onPointerCancel={camera.onPointerUp}
      >
        <SpaceWorld
          theme={theme}
          copy={copy}
          viewport={camera.viewport}
          activePlanet={activePlanet}
          signals={visibleSignals}
          selectedId={selectedId}
          magnet={magnet}
          searchQuery={searchQuery}
          searchMatchedIds={searchMatchedIds}
          focusTo={camera.focusTo}
          setSelectedId={setSelectedId}
          resetMagnet={resetMagnetOnly}
        />

        <SpaceZoomControls
          theme={theme}
          zoomIn={() => camera.zoomTo(camera.viewport.scale + 0.18)}
          zoomOut={() => camera.zoomTo(camera.viewport.scale - 0.18)}
        />

        <SpacePlanetPicker theme={theme} activePlanet={activePlanet} setActivePlanet={setActivePlanet} />

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className={`absolute bottom-4 left-4 z-40 grid h-14 w-14 place-items-center rounded-full text-3xl font-black shadow-2xl backdrop-blur-xl transition active:scale-95 ${isLight ? "bg-white/76 text-[#07111d] hover:bg-white" : "bg-white/12 text-white hover:bg-white hover:text-[#07111d]"}`}
          aria-label={copy.releaseThought}
          title={copy.releaseThought}
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={handleMySignals}
          className={`absolute right-4 top-4 z-40 grid h-12 w-12 place-items-center rounded-full border shadow-2xl backdrop-blur-xl active:scale-95 ${isLight ? "border-[#d8e3ef] bg-white/78 text-[#07111d]" : "border-white/10 bg-[#101d2c]/78 text-white"}`}
          aria-label="My signals"
          title="My signals"
        >
          <Compass className="h-5 w-5" />
        </button>

        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceWhisper 28s linear infinite" }}>
          🌌 {copy.noticed}
        </div>

        {!telegramUser ? (
          <div className={`absolute bottom-24 left-1/2 z-30 w-[320px] -translate-x-1/2 rounded-[26px] px-4 py-3 text-center text-sm font-bold shadow-2xl ${isLight ? "bg-white/86 text-[#40566e]" : "bg-[#101d2c]/90 text-white/72"}`}>
            {copy.authHint}
          </div>
        ) : null}
      </div>

      {toast ? (
        <div className={`pointer-events-none absolute left-1/2 top-[calc(5rem+env(safe-area-inset-top))] z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-black shadow-2xl backdrop-blur-xl ${isLight ? "bg-white/90 text-[#07111d]" : "bg-[#101d2c]/92 text-white"}`}>
          {toast}
        </div>
      ) : null}

      {selected ? (
        <SpaceSignalCard
          theme={theme}
          copy={copy}
          selected={selected}
          telegramUser={telegramUser}
          replyText={replyText}
          setReplyText={setReplyText}
          onClose={resetSpace}
          onPullSimilar={() => {
            setMagnetId(selected.id);
            setSelectedId(null);
          }}
          onReply={handleReply}
          onDelete={handleDelete}
        />
      ) : null}

      {searchOpen ? (
        <SpaceSearch
          isLight={isLight}
          copy={copy}
          value={searchQuery}
          setValue={setSearchQuery}
          activePlanet={activePlanet}
          setActivePlanet={setActivePlanet}
          onApply={applySearch}
          onClose={() => setSearchOpen(false)}
        />
      ) : null}

      {introOpen ? <SpaceStory copy={copy} onClose={() => setIntroOpen(false)} /> : null}

      {composerOpen ? (
        <SpaceCreateModal
          theme={theme}
          copy={copy}
          kind={kind}
          setKind={setKind}
          text={text}
          setText={setText}
          onCreate={handleCreateSignal}
          onClose={() => setComposerOpen(false)}
        />
      ) : null}
    </div>,
    document.body
  );
}
