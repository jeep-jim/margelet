import { Search, X } from "lucide-react";
import type { SpaceCopy } from "../i18n";

type Props = {
  isLight: boolean;
  copy: SpaceCopy;
  value: string;
  setValue: (value: string) => void;
  onApply: () => void;
  onClose: () => void;
};

export function SpaceSearch({ isLight, copy, value, setValue, onApply, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/30 p-3 pt-[calc(5.5rem+env(safe-area-inset-top))]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
        className="w-full max-w-[560px]"
      >
        <div className={`flex h-[52px] items-center gap-2 rounded-[28px] border-2 px-4 shadow-2xl transition ${isLight ? "border-[#31516e] bg-[#eef4fb] text-[#07111d] focus-within:border-pink-500" : "border-[#31516e] bg-[#132334] text-white focus-within:border-pink-500"}`}>
          <Search className="h-5 w-5 opacity-70" />
          <input
            type="search"
            enterKeyHint="search"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-current/45"
          />
          {value.trim() ? (
            <button type="button" onClick={() => setValue("")} className="grid h-9 w-9 place-items-center rounded-full bg-black/5" aria-label={copy.clearSearch}>
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button type="submit" className={`rounded-full px-4 py-2 text-sm font-black ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>
            {copy.find}
          </button>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-black/5" aria-label={copy.closeSearch}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`mx-4 mt-3 rounded-2xl px-4 py-2 text-xs font-bold shadow-xl ${isLight ? "bg-white/80 text-[#40566e]" : "bg-[#101d2c]/90 text-white/65"}`}>
          {copy.searchHint}
        </div>
      </form>
    </div>
  );
}
