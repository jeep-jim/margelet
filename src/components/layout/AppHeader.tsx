import { Play, Plus, Sparkles, User } from "lucide-react";
import { messages } from "../../lib/i18n";
import type { Locale, TabId } from "../../types/app";

type Props = {
  current: TabId;
  setCurrent: (tab: TabId) => void;
  locale: Locale;
};

export function AppHeader({ current, setCurrent, locale }: Props) {
  const t = messages[locale];

  const tabs = [
    { id: "intro" as const, label: t.navIntro, icon: Sparkles },
    { id: "feed" as const, label: t.navFeed, icon: Play },
    { id: "add" as const, label: t.navAdd, icon: Plus },
    { id: "creator" as const, label: t.navCreator, icon: User },
  ];

  return (
    <div className="absolute inset-x-0 top-0 z-40 mx-auto w-full max-w-[520px] px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCurrent("feed")}
          className="flex h-12 items-center gap-2 rounded-full border border-white/10 bg-black/28 px-3 text-white/95 backdrop-blur-xl"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
            M
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold">Margelet</div>
          </div>
        </button>

        <div className="flex h-12 items-center gap-1 rounded-full border border-white/10 bg-black/28 p-1 text-white backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = current === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrent(tab.id)}
                className={`flex h-10 items-center justify-center gap-2 rounded-full px-3 transition ${
                  active
                    ? "bg-white text-black"
                    : "text-white/75 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden text-sm sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}