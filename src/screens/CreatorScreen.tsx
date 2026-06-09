import { useEffect, useState } from "react";
import { getTheme, type Theme } from "../lib/theme";
import { CreatorAboutPanel } from "./creator/CreatorAboutPanel";
import { CreatorAuthBlock } from "./creator/CreatorAuthBlock";
import { CreatorLanguageChip } from "./creator/CreatorLanguageChip";
import { CreatorLanguagePanel } from "./creator/CreatorLanguagePanel";
import { CreatorManifestModal } from "./creator/CreatorManifestModal";
import { CreatorProfileBlock } from "./creator/CreatorProfileBlock";
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
    typeof window === "undefined" ? "dark" : getTheme()
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
          <div className="flex items-center justify-end gap-2">
            <CreatorLanguageChip
              active={tab === "language"}
              onClick={() => setTab("language")}
              label={LOCALE_SHORT[locale]}
              title={copy.languageTabTitle}
            />
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
