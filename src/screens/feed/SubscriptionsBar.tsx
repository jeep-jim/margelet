import { Bell } from "lucide-react";

type Sub = {
  handle: string;
  title: string;
  avatar: string | null;
  hasNew: boolean;
};

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
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-black">
            <Bell className="h-5 w-5" />
          </div>

          <div className="text-sm text-neutral-600">
            Здесь будут новые посты каналов,<br />
            на которые ты подписался
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-3">
      <div className="flex gap-3 overflow-x-auto pb-1">
        {subs.map((sub) => (
          <button
            key={sub.handle}
            onClick={() => onOpen(sub.handle)}
            className="flex flex-col items-center gap-1"
          >
            <div
              className={`h-14 w-14 overflow-hidden rounded-full p-[2px] ${
                sub.hasNew
                  ? "bg-gradient-to-tr from-pink-500 via-orange-400 to-yellow-400"
                  : "bg-neutral-300"
              }`}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-white">
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
              </div>
            </div>

            <div className="max-w-[60px] truncate text-[11px]">
              {sub.title}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}