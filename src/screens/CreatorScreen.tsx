import { useEffect, useState } from "react";
import { getTheme, type Theme } from "../lib/theme";
import { CreatorAuthBlock } from "./creator/CreatorAuthBlock";
import { CreatorLanguagePanel } from "./creator/CreatorLanguagePanel";
import { CreatorManifestModal } from "./creator/CreatorManifestModal";
import { CreatorProfileBlock } from "./creator/CreatorProfileBlock";
import {
  LANGUAGE_STORAGE_KEY,
  TG_STORAGE_KEY,
} from "./creator/creator.constants";
import { getCreatorCopy } from "./creator/creator.copy";
import type {
  CreatorScreenProps,
  TgUser,
} from "./creator/creator.types";
import {
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
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "dark" : getTheme()
  );
  const [manifestOpen, setManifestOpen] = useState(false);

  const { canShowInstallButton, handleInstallApp, installHintText } =
    useCreatorPwa(locale);

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
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

  const copy = getCreatorCopy(locale);

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: typeof locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  return (
    <>
      <div
        className="bg-app text-primary min-h-screen px-4 pb-10"
        style={{ paddingTop: 'calc(var(--app-header-offset) + 16px)' }}
      >        
        <div className="mx-auto max-w-[570px] space-y-6">
          {!user ? (
            <CreatorAuthBlock copy={copy} />
          ) : (
            <CreatorProfileBlock
              user={user}
              copy={copy}
              onLogout={handleLogout}
            />
          )}
          <CreatorLanguagePanel
            copy={copy}
            locale={locale}
            onChangeLocale={handleChangeLocale}
            onOpenManifest={() => setManifestOpen(true)}
            canShowInstallButton={canShowInstallButton}
            onInstallApp={handleInstallApp}
            installHintText={installHintText}
          />
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
