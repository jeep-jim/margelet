import { Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getTheme, toggleTheme, type Theme } from "../lib/theme";
import { CreatorAboutPanel } from "./creator/CreatorAboutPanel";
import { CreatorAuthBlock } from "./creator/CreatorAuthBlock";
import { CreatorChannelPanel } from "./creator/CreatorChannelPanel";
import { CreatorLanguageChip } from "./creator/CreatorLanguageChip";
import { CreatorLanguagePanel } from "./creator/CreatorLanguagePanel";
import { CreatorManifestModal } from "./creator/CreatorManifestModal";
import { CreatorProfileBlock } from "./creator/CreatorProfileBlock";
import { CreatorTopIconButton } from "./creator/CreatorTopIconButton";
import {
  INTRO_LANGUAGE_STORAGE_KEY,
  INTRO_SEEN_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
  LOCALE_SHORT,
  TG_STORAGE_KEY,
} from "./creator/creator.constants";
import { getCreatorCopy } from "./creator/creator.copy";
import type {
  CabinetTab,
  CreatorScreenProps,
  TgUser,
} from "./creator/creator.types";
import {
  readIntroLocaleFromStorage,
  readTelegramUserFromStorage,
} from "./creator/creator.utils";
import { useCreatorPwa } from "./creator/useCreatorPwa";

export function CreatorScreen({
  locale,
  setLocale,
  posts: _posts,
  openPost: _openPost,
}: CreatorScreenProps) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [tab, setTab] = useState<CabinetTab>("language");
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : getTheme()
  );
  const [introLocale, setIntroLocale] = useState(() =>
    typeof window === "undefined" ? locale : readIntroLocaleFromStorage(locale)
  );
  const [manifestOpen, setManifestOpen] = useState(false);

  const { canShowInstallButton, handleInstallApp, installHintText } =
    useCreatorPwa(locale);

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setIntroLocale(readIntroLocaleFromStorage(locale));
      setTheme(getTheme());
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(INTRO_LANGUAGE_STORAGE_KEY, introLocale);
  }, [introLocale]);

  const copy = getCreatorCopy(locale);

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: typeof locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  const handleReplayIntro = () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, introLocale);
    localStorage.setItem(INTRO_LANGUAGE_STORAGE_KEY, introLocale);
    setLocale(introLocale);
    localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
    window.location.reload();
  };


  return (
    <>
      <div
        className="bg-app text-primary min-h-screen px-4 pb-10"
        style={{ paddingTop: 'calc(var(--app-header-offset) + 16px)' }}
      >        
        <div className="mx-auto max-w-[570px] space-y-6">
          {!user ? (
            <CreatorAuthBlock copy={copy} onReplayIntro={handleReplayIntro} />
          ) : (
            <CreatorProfileBlock
              user={user}
              copy={copy}
              onLogout={handleLogout}
            />
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setTab("channel")}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition ${
                  tab === "channel"
                    ? "bg-strong text-strong-foreground"
                    : "border border-soft bg-surface text-primary"
                }`}
              >
                <Plus className="h-4 w-4" />
                {copy.channelTabTitle}
              </button>
            </div>            

            <div className="flex shrink-0 items-center gap-2">
              <CreatorTopIconButton
                active={theme === "dark"}
                onClick={handleToggleTheme}
                icon={theme === "dark" ? Sun : Moon}
                title="Theme"
              />

              <CreatorLanguageChip
                active={tab === "language"}
                onClick={() => setTab("language")}
                label={LOCALE_SHORT[locale]}
                title={copy.languageTabTitle}
              />
            </div>
          </div>

          {tab === "language" ? (
            <CreatorLanguagePanel
              copy={copy}
              locale={locale}
              onChangeLocale={handleChangeLocale}
              onOpenManifest={() => setManifestOpen(true)}
              canShowInstallButton={canShowInstallButton}
              onInstallApp={handleInstallApp}
              installHintText={installHintText}
            />
          ) : null}

          {tab === "channel" ? (
            <CreatorChannelPanel copy={copy} locale={locale} user={user} />
          ) : null}

          {tab === "about" ? <CreatorAboutPanel copy={copy} /> : null}
        </div>
      </div>

      <CreatorManifestModal
        copy={copy}
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        theme={theme}
      />
    </>
  );
}
