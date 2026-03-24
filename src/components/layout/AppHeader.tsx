import { Play, Plus, User } from "lucide-react";
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
    { id: "feed" as const, label: t.navFeed, icon: Play },
    { id: "add" as const, label: t.navAdd, icon: Plus },
    { id: "creator" as const, label: "Кабинет", icon: User },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-neutral-50/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[720px] items-center justify-between px-4">
        <button
          onClick={() => setCurrent("feed")}
          className="text-left text-[24px] font-semibold tracking-tight text-neutral-950"
        >
          Margelet
        </button>

        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = current === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setCurrent(tab.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                  active
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-700 hover:bg-neutral-200"
                }`}
                aria-label={tab.label}
                title={tab.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}