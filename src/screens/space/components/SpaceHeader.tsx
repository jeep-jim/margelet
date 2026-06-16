import { ArrowLeft, Bell, Moon, Plus, Search, Sun, User, X } from "lucide-react";
import type { SpaceTelegramUser } from "../types";
import { SpaceLogo } from "./SpaceLogo";

type Props = {
  isLight: boolean;
  telegramUser: SpaceTelegramUser | null;
  hasOverlayState: boolean;
  onBack: () => void;
  onSearch: () => void;
  onCreate: () => void;
  onToggleTheme: () => void;
  onStory: () => void;
};

export function SpaceHeader({ isLight, telegramUser, hasOverlayState, onBack, onSearch, onCreate, onToggleTheme, onStory }: Props) {
  return (
    <header className={`absolute left-0 right-0 top-0 z-40 h-[calc(4rem+env(safe-area-inset-top))] border-b pt-[env(safe-area-inset-top)] ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/90" : "border-white/10 bg-[#132233]/86"}`}>
      <div className="mx-auto grid h-16 max-w-[980px] grid-cols-[1fr_auto_1fr] items-center px-4">
        <div className="flex items-center justify-start gap-2">
          <button type="button" onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10">
            {hasOverlayState ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
          </button>
          <button type="button" onClick={onSearch} className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-white/10" aria-label="Search">
            <Search className="h-6 w-6" />
          </button>
          <button type="button" className="relative hidden h-11 w-11 place-items-center rounded-full transition hover:bg-white/10 sm:grid" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" />
          </button>
        </div>

        <div className="flex justify-center">
          <SpaceLogo isLight={isLight} onClick={onStory} />
        </div>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <button type="button" onClick={onCreate} className={`hidden h-10 w-10 place-items-center rounded-full shadow-xl transition active:scale-95 sm:grid ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`} aria-label="Release thought">
            <Plus className="h-5 w-5" />
          </button>
          <button type="button" onClick={onToggleTheme} className="grid h-10 w-10 place-items-center rounded-full transition hover:bg-white/10">
            {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
          {telegramUser?.photo_url ? (
            <img src={telegramUser.photo_url} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/15" referrerPolicy="no-referrer" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full"><User className="h-5 w-5" /></div>
          )}
        </div>
      </div>
    </header>
  );
}
