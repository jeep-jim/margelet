import React, { useEffect, useMemo, useState } from "react";

/**
 * margeleT — Profile is identity + devices + shares hub
 * IMPORTANT: This file is typed to satisfy Vercel build (tsc -b)
 */

type DeviceStatus = "online" | "offline";

type DevicePlatform =
  | "Windows"
  | "macOS"
  | "Linux"
  | "Android"
  | "iOS"
  | "Unknown";

type Device = {
  id: string;
  name: string;
  platform: DevicePlatform;
  status?: DeviceStatus;
  lastSeen?: number;
  isThis?: boolean;
};

type ShareMode = "online-only" | "always"; // "always" later (UI can show disabled)
type ShareKind = "Фото" | "Видео" | "Аудио" | "Документы" | "Другое";

type Share = {
  id: string;
  title: string; // folder/collection name
  kind: ShareKind;
  mode: ShareMode;
  createdAt: number;
};

type ProfileProps = {
  onBack?: () => void;
  title?: string;
  displayName: string;
  setDisplayName: (v: string) => void;
};

const LS_DEVICES = "margelet_devices";
const LS_SHARES = "margelet_shares";
const LS_USER = "margelet_user"; // if you store user here
const LS_AUTH = "margelet_auth"; // if you store auth/session here
const LS_HANDLE = "margelet_handle"; // optional

function now() {
  return Date.now();
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function shortId(id: string, n = 8) {
  if (!id) return "";
  if (id.length <= n) return id;
  return id.slice(0, n);
}

function detectPlatform(): DevicePlatform {
  const ua = navigator.userAgent || "";
  const p = navigator.platform || "";

  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) return "iOS";
  if (/Android/i.test(ua)) return "Android";

  if (/Mac/i.test(p) || /Macintosh/i.test(ua)) return "macOS";
  if (/Win/i.test(p) || /Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(p) || /X11/i.test(ua)) return "Linux";

  return "Unknown";
}

function formatLastSeen(ts?: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function pill(text: string, className = "") {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs",
        "bg-white/5 text-white/70 ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      {text}
    </span>
  );
}

export default function Profile({
  onBack,
  displayName,
  setDisplayName,
  title = "Профиль",
}: ProfileProps) {
  const [tab, setTab] = useState<"profile" | "devices" | "files">("profile");

  // You can replace this with your real user object / id source.
  const userId = useMemo(() => {
    const userRaw = localStorage.getItem(LS_USER);
    const user = safeJsonParse<{ id?: string; handle?: string }>(userRaw, {});
    return user.id || "local";
  }, []);

  const handle = useMemo(() => {
    const userRaw = localStorage.getItem(LS_USER);
    const user = safeJsonParse<{ handle?: string }>(userRaw, {});
    const fromLS = localStorage.getItem(LS_HANDLE);
    return user.handle || fromLS || "@jim";
  }, []);

  const [devices, setDevices] = useState<Device[]>(() =>
    safeJsonParse<Device[]>(localStorage.getItem(LS_DEVICES), [])
  );

  const [shares, setShares] = useState<Share[]>(() =>
    safeJsonParse<Share[]>(localStorage.getItem(LS_SHARES), [])
  );

  const platform = useMemo(() => detectPlatform(), []);

  // Persist devices
  useEffect(() => {
    try {
      localStorage.setItem(LS_DEVICES, JSON.stringify(devices));
    } catch {}
  }, [devices]);

  // Persist shares
  useEffect(() => {
    try {
      localStorage.setItem(LS_SHARES, JSON.stringify(shares));
    } catch {}
  }, [shares]);

  // Ensure current device exists (typed so status doesn't become string)
  useEffect(() => {
    const thisId = `dev_${shortId(userId, 8)}_${platform.toLowerCase()}`;

    setDevices((prev) => {
      const STATUS_ONLINE: DeviceStatus = "online";

      const exists = prev.some((d) => d.id === thisId);

      const next: Device[] = exists
        ? prev.map((d) =>
            d.id === thisId
              ? {
                  ...d,
                  isThis: true,
                  platform,
                  status: STATUS_ONLINE,
                  lastSeen: now(),
                }
              : { ...d, isThis: false }
          )
        : [
            {
              id: thisId,
              name: `Текущее устройство (${platform})`,
              platform,
              status: STATUS_ONLINE,
              lastSeen: now(),
              isThis: true,
            },
            ...prev.map((d) => ({ ...d, isThis: false })),
          ];

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platform, userId]);

  const deviceThis = useMemo(() => devices.find((d) => d.isThis), [devices]);

  const inviteLink = useMemo(() => {
    const origin = window.location.origin;
    // mock link for now. later you'll sign it.
    return `${origin}#invite=${encodeURIComponent(handle)}&u=${encodeURIComponent(shortId(userId, 8))}`;
  }, [handle, userId]);

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  };

  const logout = () => {
    // Minimal "log out" for current mock auth.
    // Adjust keys if your auth storage differs.
    try {
      localStorage.removeItem(LS_AUTH);
      localStorage.removeItem(LS_USER);
      localStorage.removeItem(LS_HANDLE);
    } catch {}

    // Go to landing/auth page
    window.location.href = "/";
  };

  // Shares form
  const [newShareTitle, setNewShareTitle] = useState("");
  const [newShareKind, setNewShareKind] = useState<ShareKind>("Фото");
  const [newShareMode, setNewShareMode] = useState<ShareMode>("online-only");

  const addShare = () => {
    const t = newShareTitle.trim();
    if (!t) return;

    const item: Share = {
      id: `sh_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      title: t,
      kind: newShareKind,
      mode: newShareMode,
      createdAt: Date.now(),
    };

    setShares((prev) => [item, ...prev]);
    setNewShareTitle("");
  };

  const removeShare = (id: string) => {
    setShares((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-screen w-full bg-[#15151d] text-white">
      {/* top */}
      <div className="sticky top-0 z-20 border-b border-white/5 bg-[#15151d]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex items-center gap-2 rounded-full px-2 py-1 text-sm text-white/70 hover:text-white"
                aria-label="Назад"
              >
                <span className="text-lg leading-none">←</span>
                <span>Назад</span>
              </button>
            ) : (
              <div className="w-[72px]" />
            )}
          </div>

          <div className="text-center">
            <div className="text-sm font-semibold text-white/90">{title}</div>
            <div className="mt-0.5 text-xs text-white/50">
              {handle} • id {shortId(userId, 8)}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={logout}
              className="rounded-full px-3 py-1.5 text-sm text-rose-200 ring-1 ring-rose-400/25 hover:bg-rose-500/10"
              title="Выйти"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* tabs */}
        <div className="mx-auto max-w-[980px] px-4 pb-3">
          <div className="flex items-center gap-2">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
              Профиль
            </TabButton>
            <TabButton active={tab === "devices"} onClick={() => setTab("devices")}>
              Устройства
            </TabButton>
            <TabButton active={tab === "files"} onClick={() => setTab("files")}>
              Файлы
            </TabButton>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[980px] px-4 pb-14 pt-4">
        {/* PROFILE TAB */}
        {tab === "profile" && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/10">
                  <span className="text-lg font-semibold text-white/80">
                    {(displayName || "•").slice(0, 2).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="text-xs text-white/50">Твоё имя (видно в чатах)</div>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Например: Jim"
                      className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/90 outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/20"
                    />
                    <button
                      onClick={() => copyText(displayName || "")}
                      className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                      title="Скопировать имя"
                    >
                      Коп.
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {pill(handle)}
                    {pill(`user • ${shortId(userId, 8)}`)}
                    <button
                      onClick={() => copyText(handle)}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                    >
                      Copy @
                    </button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold text-white/90">Инвайт (привязка устройства)</div>
              <div className="mt-1 text-xs text-white/50">
                Пока мок. Потом добавим подпись + QR-сканер.
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={inviteLink}
                  readOnly
                  className="w-full rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/80 outline-none ring-1 ring-white/10"
                />
                <button
                  onClick={() => copyText(inviteLink)}
                  className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100 ring-1 ring-rose-400/25 hover:bg-rose-500/20"
                >
                  Копировать
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 ring-1 ring-white/10">
                      <span className="text-sm font-semibold text-amber-200">QR</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/90">Привязка через QR</div>
                      <div className="text-xs text-white/50">
                        Сейчас можно тестировать через инвайт-ссылку. Дальше добавим сканер и подпись.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      // mock
                      alert("Пока мок. Скоро сделаем реальный QR.");
                    }}
                    className="rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/85 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    Добавить (мок)
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/45">
                <b>Profile</b> — это центр продукта: identity + devices + shares. Дальше добавим настройки звонков/микросервера и реальную QR-привязку.
              </div>
            </Card>
          </div>
        )}

        {/* DEVICES TAB */}
        {tab === "devices" && (
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/90">Твои устройства</div>
                  <div className="mt-1 text-xs text-white/50">
                    Устройства — твоя идентичность. Здесь будет репликация и статус онлайна.
                  </div>
                </div>

                <button
                  onClick={() => alert("Скоро: привязка устройства через QR/инвайт")}
                  className="rounded-2xl bg-white/5 px-4 py-2.5 text-sm text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                >
                  Добавить устройство
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {devices.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/60 ring-1 ring-white/10">
                    Пока нет устройств.
                  </div>
                ) : (
                  devices.map((d) => (
                    <div
                      key={d.id}
                      className={[
                        "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1",
                        d.isThis ? "bg-white/8 ring-white/15" : "bg-white/5 ring-white/10",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 ring-1 ring-white/10">
                          <span className="text-xs text-white/70">{d.platform}</span>
                        </div>

                        <div>
                          <div className="text-sm font-semibold text-white/90">
                            {d.name} {d.isThis ? <span className="text-emerald-300/90">• это ты</span> : null}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
                            <span>id: {shortId(d.id, 10)}</span>
                            <span>•</span>
                            <span>последний раз: {formatLastSeen(d.lastSeen)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs ring-1",
                            d.status === "online"
                              ? "bg-emerald-500/10 text-emerald-200 ring-emerald-400/20"
                              : "bg-white/5 text-white/60 ring-white/10",
                          ].join(" ")}
                        >
                          {d.status === "online" ? "online" : "offline"}
                        </span>
                        <button
                          onClick={() => copyText(d.id)}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                        >
                          Copy id
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {deviceThis ? (
              <Card>
                <div className="text-sm font-semibold text-white/90">Текущее устройство</div>
                <div className="mt-2 rounded-2xl bg-white/5 p-4 text-sm text-white/70 ring-1 ring-white/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {pill(deviceThis.name)}
                    {pill(deviceThis.platform)}
                    {pill(deviceThis.status === "online" ? "online" : "offline")}
                  </div>
                  <div className="mt-3 text-xs text-white/50">
                    Дальше тут будет: ключи устройства, синхронизация, разрешения на файлы и статус p2p.
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        )}

        {/* FILES TAB */}
        {tab === "files" && (
          <div className="space-y-4">
            <Card>
              <div className="text-sm font-semibold text-white/90">Хранилище / P2P Shares</div>
              <div className="mt-1 text-xs text-white/50">
                Файлы остаются у владельца. Если девайс оффлайн — его файлы оффлайн.
              </div>

              <div className="mt-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-xs font-semibold text-white/70">Добавить шару (папка/набор)</div>
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-12">
                  <input
                    value={newShareTitle}
                    onChange={(e) => setNewShareTitle(e.target.value)}
                    placeholder='Например: "Фото 2026" или "Work docs"'
                    className="md:col-span-6 rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/90 outline-none ring-1 ring-white/10 placeholder:text-white/30 focus:ring-white/20"
                  />

                  <select
                    value={newShareKind}
                    onChange={(e) => setNewShareKind(e.target.value as ShareKind)}
                    className="md:col-span-3 rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  >
                    <option>Фото</option>
                    <option>Видео</option>
                    <option>Аудио</option>
                    <option>Документы</option>
                    <option>Другое</option>
                  </select>

                  <select
                    value={newShareMode}
                    onChange={(e) => setNewShareMode(e.target.value as ShareMode)}
                    className="md:col-span-2 rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-white/20"
                  >
                    <option value="online-only">Только когда online</option>
                    <option value="always" disabled>
                      Всегда доступно (позже)
                    </option>
                  </select>

                  <button
                    onClick={addShare}
                    className="md:col-span-1 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/85 ring-1 ring-white/10 hover:bg-white/10"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 text-xs text-white/45">
                  Сейчас это мок. Дальше подключим реальный выбор папки + P2P слой + поиск в комнате.
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {shares.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 p-4 text-sm text-white/60 ring-1 ring-white/10">
                    Пока нет шар.
                  </div>
                ) : (
                  shares.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white/90">{s.title}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
                          <span>{s.kind}</span>
                          <span>•</span>
                          <span>{s.mode === "online-only" ? "только online" : "всегда"}</span>
                          <span>•</span>
                          <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyText(s.title)}
                          className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                        >
                          Copy
                        </button>
                        <button
                          onClick={() => removeShare(s.id)}
                          className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-100 ring-1 ring-rose-400/20 hover:bg-rose-500/15"
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a24] p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
      {children}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm ring-1 transition",
        active
          ? "bg-[#2a2238] text-[#caa7ff] ring-white/15"
          : "bg-white/5 text-white/70 ring-white/10 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}