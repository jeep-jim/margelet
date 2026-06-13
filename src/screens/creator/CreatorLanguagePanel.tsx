import { Download } from "lucide-react";
import type { Locale } from "../../types/app";
import { CreatorLocaleDropdown } from "./CreatorLocaleDropdown";
import type { ScreenCopy } from "./creator.types";

export function CreatorLanguagePanel({
  copy,
  locale,
  onChangeLocale,
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
    <div className="notranslate margelet-ui space-y-3" translate="no">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
          {copy.languageTitle}
        </div>

        <CreatorLocaleDropdown
          label=""
          value={locale}
          onChange={onChangeLocale}
        />
      </div>

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
