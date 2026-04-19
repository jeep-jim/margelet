import { Download, Globe } from "lucide-react";
import type { Locale } from "../../types/app";
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
  return (
    <div className="space-y-3">
      <div className="bg-surface rounded-[28px] border border-soft p-6">
        <div className="text-primary mb-4 flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4" />
          {copy.languageTitle}
        </div>

        <CreatorLocaleDropdown
          label={copy.languageDropdownLabel}
          value={locale}
          onChange={onChangeLocale}
        />
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
