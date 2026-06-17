import { ArrowLeft, Bell, Moon, Search, Sun, User, X } from "lucide-react";
import type { SpaceTelegramUser } from "../types";
import { SpaceLogo } from "./SpaceLogo";

type Props = {
  isLight: boolean;
  telegramUser: SpaceTelegramUser | null;
  hasOverlayState: boolean;
  onBack: () => void;
  onSearch: () => void;
  onToggleTheme: () => void;
  onStory: () => void;
  onNotifications: () => void;
  onProfile: () => void;
};

export function SpaceHeader({
  isLight,
  telegramUser,
  hasOverlayState,
  onBack,
  onSearch,
  onToggleTheme,
  onStory,
  onNotifications,
  onProfile,
}: Props) {
  return (
    <header
      className={`absolute left-0 right-0 top-0 z-40 h-[calc(4rem+env(safe-area-inset-top))] border-b pt-[env(safe-area-inset-top)] ${
        isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/90" : "border-white/10 bg-[#132233]/86"
      }`}
    >
      <div className="mx-auto grid h-16 max-w-[980px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:translate-y-[-5px]">
        <div className="flex items-center justify-start gap-1.5 -translate-x-[8px]">
          <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10">
            {hasOverlayState ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>

          <button type="button" onClick={onSearch} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10" aria-label="Search">
            <Search className="h-6 w-6" />
          </button>

          <button type="button" onClick={onNotifications} className="relative -ml-[3px] grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-[10px] top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
          </button>
        </div>

        <div className="flex justify-center overflow-visible -translate-x-[8px] -translate-y-[4px] scale-[0.72] sm:-translate-y-[4px] sm:scale-[0.66]">
          <SpaceLogo isLight={isLight} onClick={onStory} />
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button type="button" onClick={onToggleTheme} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10">
            {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>

          <button type="button" onClick={onProfile} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10" aria-label="Telegram profile">
            {telegramUser?.photo_url ? (
              <img src={telegramUser.photo_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/15" referrerPolicy="no-referrer" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
