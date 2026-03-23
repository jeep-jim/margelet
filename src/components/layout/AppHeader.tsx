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
    <div className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between p-4">
      <div className="rounded-full border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black font-bold">
            M
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">{t.appName}</div>
            <div className="text-[11px] text-white/65">{t.appTagline}</div>
          </div>
        </div>
      </div>

      <div className="rounded-full border border-white/15 bg-black/40 p-1 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = current === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrent(tab.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                  active ? "bg-white text-black" : "text-white/75 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}