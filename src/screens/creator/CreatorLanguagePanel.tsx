import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "../../types/app";
import { getAutotranslit, setAutotranslit } from "../../lib/autotranslit";
import { CreatorLocaleDropdown } from "./CreatorLocaleDropdown";
import type { ScreenCopy } from "./creator.types";

export function CreatorLanguagePanel({
  copy,
  locale,
  onChangeLocale,
  onOpenManifest,
  canShowInstallButton,
  onInstallApp,
  installHintText,
}: {
  copy: ScreenCopy;
  locale: Locale;
  onChangeLocale: (locale: Locale) => void;
  onOpenManifest: () => void;
  canShowInstallButton: boolean;
  onInstallApp: () => void;
  installHintText: string;
}) {
  const [autotranslit, setAutotranslitState] = useState(() => getAutotranslit());

  useEffect(() => {
    const sync = () => setAutotranslitState(getAutotranslit());

    window.addEventListener("margelet-autotranslit-change", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("margelet-autotranslit-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const handleToggleAutotranslit = () => {
    const next = !autotranslit;
    setAutotranslit(next);
    setAutotranslitState(next);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {copy.languageTitle}
        </div>

        <CreatorLocaleDropdown
          label=""
          value={locale}
          onChange={onChangeLocale}
        />

        <button
          type="button"
          onClick={handleToggleAutotranslit}
          className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-[20px] border border-soft bg-surface px-4 py-3 text-left"
        >
          <div className="min-w-0">
            <div className="text-sm font-semibold text-primary">
              🌐 Autotranslit
            </div>
            <div className="mt-1 text-xs leading-5 text-secondary">
              Browser translation for foreign Telegram posts
            </div>
          </div>

          <span
            className={`relative inline-flex h-7 w-11 shrink-0 rounded-full border transition ${
              autotranslit
                ? "border-[#2f6df6] bg-[#2f6df6]"
                : "border-soft bg-surface-soft dark:border-[#31455e] dark:bg-[#1b2a3b]"
            }`}
          >
            <span
              className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all ${
                autotranslit
                  ? "left-[20px] bg-white"
                  : "left-[2px] bg-[#9aa4b2] dark:bg-[#6f89a8]"
              }`}
            />
          </span>          
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenManifest}
        className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[20px] border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.28)] transition hover:opacity-95"
      >
        {copy.manifestButton}
      </button>

      {canShowInstallButton ? (
        <button
          type="button"
          onClick={onInstallApp}
          className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-[20px] border border-soft bg-surface px-6 py-4 text-lg font-semibold text-primary transition hover:bg-surface-soft"
        >
          <Download className="h-5 w-5" />
          {copy.installButton}
        </button>
      ) : null}

      {installHintText ? (
        <div className="rounded-[20px] border border-soft bg-surface px-4 py-4 text-sm leading-6 text-secondary">
          {installHintText}
        </div>
      ) : null}
    </div>
  );
}