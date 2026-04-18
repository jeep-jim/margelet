import { Bell } from "lucide-react";

type Sub = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
  unreadCount?: number;
};

function Ring({
  active,
  count,
  children,
}: {
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  if (!active) {
    return (
      <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-300 p-[2px]">
        <div className="h-full w-full overflow-hidden rounded-full bg-white">
          {children}
        </div>
      </div>
    );
  }

  const segments = Math.max(1, Math.min(count || 1, 12));
  const gap = 6;
  const fill = Math.max(8, Math.floor((360 - segments * gap) / segments));

  const stops: string[] = [];
  let cursor = -90;

  for (let i = 0; i < segments; i += 1) {
    const start = cursor;
    const end = cursor + fill;

    stops.push(
      `#ec4899 ${start}deg ${end}deg`,
      `transparent ${end}deg ${end + gap}deg`
    );

    cursor = end + gap;
  }

  const style = {
    background: `conic-gradient(${stops.join(",")})`,
  };

  return (
    <div
      className="h-14 w-14 overflow-hidden rounded-full p-[2px]"
      style={style}
    >
      <div className="h-full w-full overflow-hidden rounded-full bg-white">
        {children}
      </div>
    </div>
  );
}

export function SubscriptionsBar({
  subs,
  onOpen,
}: {
  subs: Sub[];
  onOpen: (handle: string) => void;
}) {
  if (!subs.length) {
    return (
      <div className="px-4 pt-3">
        <div className="flex items-center gap-3 rounded-3xl border border-soft bg-surface px-4 py-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-soft">
            <Bell className="h-5 w-5 text-secondary" />
          </div>

          <div className="text-sm text-secondary">
            Тут будут новые посты каналов, в которых включено уведомление
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {subs.map((sub) => {
          const count = sub.unreadCount ?? (sub.hasNew ? 1 : 0);

          return (
            <button
              key={sub.handle}
              onClick={() => onOpen(sub.handle)}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <Ring active={sub.hasNew} count={count}>
                {sub.avatar ? (
                  <img
                    src={sub.avatar}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold">
                    {sub.title.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </Ring>

              <div className="max-w-[60px] truncate text-[11px]">
                {sub.title}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}