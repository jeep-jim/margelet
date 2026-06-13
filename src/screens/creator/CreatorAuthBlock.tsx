import { Plus } from "lucide-react";
import { getTelegramAuthUrl } from "./creator.utils";
import type { ScreenCopy } from "./creator.types";

export function CreatorAuthBlock({
  copy,
  onOpenManifest,
}: {
  copy: ScreenCopy;
  onOpenManifest: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-soft bg-surface text-primary shadow-soft">
      <div className="px-5 py-5">
        <div className="text-[26px] font-semibold leading-tight">
          {copy.authTitle}
        </div>

        <div className="mt-2 max-w-[32rem] text-sm leading-6 text-secondary">
          {copy.authText}
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="inline-flex min-h-[44px] items-center rounded-full bg-strong px-5 py-2.5 text-sm font-medium text-strong-foreground transition hover:opacity-95"
            type="button"
          >
            {copy.authButton}
          </button>

          <button
            onClick={onOpenManifest}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-soft bg-surface-soft text-primary transition hover:bg-surface-hover"
            type="button"
            aria-label={copy.manifestButton}
            title={copy.manifestButton}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
