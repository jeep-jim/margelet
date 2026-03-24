import { Plus, User } from "lucide-react";
import type { Locale, TabId } from "../../types/app";

type Props = {
  current: TabId;
  setCurrent: (tab: TabId) => void;
  locale: Locale;
};

export function AppHeader({ current, setCurrent }: Props) {
  const tabs = [
    // ❌ убрали Play (лента и так по логотипу)
    { id: "add" as const, label: "Добавить", icon: Plus },
    { id: "creator" as const, label: "Кабинет", icon: User },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[720px] items-center justify-between px-4">
        
        {/* LOGO (оставляем твой стиль, просто без кружка) */}
        <button
          onClick={() => setCurrent("feed")}
          className="text-left"
          aria-label="Margelet"
          title="Margelet"
        >
          <div className="text-2xl font-extrabold tracking-[-0.03em] text-neutral-950">
            margeleT
          </div>
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