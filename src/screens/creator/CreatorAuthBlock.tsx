import { getTelegramAuthUrl } from "./creator.utils";
import type { ScreenCopy } from "./creator.types";

export function CreatorAuthBlock({ copy }: { copy: ScreenCopy }) {
  return (
    <div className="bg-surface text-primary shadow-soft overflow-hidden rounded-[32px] border border-soft">
      <div className="px-5 py-5">
        <div className="text-[26px] font-semibold leading-tight">
          {copy.authTitle}
        </div>

        <div className="text-secondary mt-2 max-w-[32rem] text-sm leading-6">
          {copy.authText}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="bg-strong text-strong-foreground bg-strong-hover inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition"
            type="button"
          >
            {copy.authButton}
          </button>
        </div>
      </div>
    </div>
  );
}
