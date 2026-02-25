import React, { useEffect, useMemo, useRef, useState } from "react";

type ProfileProps = {
  onBack?: () => void;
  displayName?: string;
  setDisplayName?: (v: string) => void;
  title?: string;
};

type TabKey = "profile" | "devices" | "files";

const LS_AVATAR = "margelet_avatar_v1"; // локально, пока без сервера

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function Profile({ onBack, displayName, setDisplayName, title }: ProfileProps) {
  const [tab, setTab] = useState<TabKey>("profile");

  // имя: либо из пропсов (если роутер управляет), либо локально
  const [nameLocal, setNameLocal] = useState<string>(displayName ?? "");
  useEffect(() => {
    if (typeof displayName === "string") setNameLocal(displayName);
  }, [displayName]);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(LS_AVATAR) || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [toast, setToast] = useState<string>("");

  const userId = useMemo(() => {
    // пробуем вытащить что-то похожее на id из localStorage, но не ломаемся
    // если у тебя id хранится иначе — не страшно, просто показываем как "user"
    const all = Object.keys(localStorage);
    const guessKey =
      all.find((k) => /user/i.test(k) && /id/i.test(k)) ||
      all.find((k) => /user/i.test(k)) ||
      all.find((k) => /device/i.test(k) && /id/i.test(k)) ||
      "";
    const raw = guessKey ? localStorage.getItem(guessKey) : null;
    if (!raw) return "";
    const v = safeParse<any>(raw, raw);
    if (typeof v === "string") return v;
    if (typeof v?.id === "string") return v.id;
    if (typeof v?.userId === "string") return v.userId;
    return "";
  }, []);

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleSaveName = () => {
    if (setDisplayName) setDisplayName(nameLocal);
    setToast("Имя сохранено ✅");
    setTimeout(() => setToast(""), 1400);
  };

  const inviteLink = useMemo(() => {
    const origin = window.location.origin;
    const handle = "@jim"; // пока мок — у тебя дальше будет реальный ник
    const uid = userId || "user";
    return `${origin}#invite=${encodeURIComponent(handle)}&u=${encodeURIComponent(uid)}`;
  }, [userId]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setToast("Ссылка скопирована ✅");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast("Ссылка скопирована ✅");
    } finally {
      setTimeout(() => setToast(""), 1400);
    }
  };

  const pickPhoto = () => fileRef.current?.click();

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setToast("Нужна картинка 🖼️");
      setTimeout(() => setToast(""), 1400);
      return;
    }
    const b64 = await toBase64(f);
    setAvatar(b64);
    localStorage.setItem(LS_AVATAR, b64);
    setShowPhotoMenu(false);
    setToast("Фото обновлено ✅");
    setTimeout(() => setToast(""), 1400);
  };

  const removePhoto = () => {
    setAvatar("");
    localStorage.removeItem(LS_AVATAR);
    setShowPhotoMenu(false);
    setToast("Фото удалено ✅");
    setTimeout(() => setToast(""), 1400);
  };

  const logout = () => {
    // Самый надёжный “выйти” для текущего MVP: чистим локалку и отправляем на старт
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    // на всякий: полный перезагруз на главную
    window.location.href = "/";
  };

  const TabButton = ({
    k,
    label,
  }: {
    k: TabKey;
    label: string;
  }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => setTab(k)}
        className={cn(
          "relative px-4 py-2 rounded-full text-sm font-semibold transition",
          active
            ? "text-violet-200 bg-white/5"
            : "text-white/60 hover:text-white/80 hover:bg-white/5"
        )}
      >
        {label}
        <span
          className={cn(
            "absolute left-3 right-3 -bottom-1 h-[2px] rounded-full transition",
            active ? "bg-violet-400" : "bg-transparent"
          )}
        />
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#141522] text-white">
      {/* header — как на твоей странице с галочкой: слева “← Назад”, справа RU и “Выйти” */}
      <div className="mx-auto w-full max-w-[980px] px-4 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="group inline-flex items-center gap-2 text-white/80 hover:text-white transition"
          >
            <span className="text-[22px] leading-none text-pink-300 group-hover:text-pink-200">
              ←
            </span>
            <span className="text-sm font-semibold text-pink-200/90 group-hover:text-pink-200">
              Назад
            </span>
          </button>

          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-white/70">RU</div>

            <button
              type="button"
              onClick={logout}
              className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition text-sm font-semibold"
              title="Выйти"
            >
              Выйти
            </button>
          </div>
        </div>

        {/* title */}
        <div className="mt-5">
          <div className="text-3xl font-extrabold tracking-tight">
            {title || "Профиль"}
          </div>
          <div className="mt-1 text-sm text-white/50">
            {`@jim${userId ? ` • id ${String(userId).slice(0, 8)}…` : ""}`}
          </div>
        </div>

        {/* tabs */}
        <div className="mt-5 flex items-center gap-2">
          <TabButton k="profile" label="Профиль" />
          <TabButton k="devices" label="Устройства" />
          <TabButton k="files" label="Файлы" />
        </div>

        {/* content card */}
        <div className="mt-5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.35)] overflow-hidden">
          {/* subtle top gradient */}
          <div className="h-20 bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-cyan-500/10" />

          {tab === "profile" && (
            <div className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                {/* avatar */}
                <div className="relative">
                  <div
                    className={cn(
                      "group relative h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden",
                      "bg-white/5 border border-white/10"
                    )}
                    onClick={() => setShowPhotoMenu(true)}
                    role="button"
                    tabIndex={0}
                    title="Изменить фото"
                  >
                    {avatar ? (
                      <img
                        src={avatar}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center">
                        <div className="text-xl font-extrabold text-white/70">
                          {(nameLocal?.trim()?.[0] || "J").toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* pencil overlay (desktop hover) */}
                    <div className="hidden md:flex absolute inset-0 items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <div className="px-2.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold">
                        ✏️ Фото
                      </div>
                    </div>

                    {/* pencil badge (mobile always) */}
                    <div className="md:hidden absolute -right-2 -bottom-2 h-8 w-8 rounded-full bg-white/10 border border-white/20 grid place-items-center">
                      ✏️
                    </div>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    className="hidden"
                  />
                </div>

                {/* name + save */}
                <div className="flex-1">
                  <div className="text-xs text-white/60 font-semibold">
                    Твоё имя (будет видно в чатах)
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      value={nameLocal}
                      onChange={(e) => setNameLocal(e.target.value)}
                      placeholder="Например: Jim"
                      className={cn(
                        "flex-1 h-11 px-4 rounded-xl",
                        "bg-[#0f1020]/60 border border-white/10",
                        "outline-none focus:border-violet-400/60"
                      )}
                    />

                    <button
                      type="button"
                      onClick={handleSaveName}
                      className={cn(
                        "h-11 px-4 rounded-xl font-semibold",
                        "bg-violet-500/20 border border-violet-300/20",
                        "text-violet-200 hover:bg-violet-500/25 transition"
                      )}
                    >
                      Сохранить
                    </button>
                  </div>

                  {/* chips */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                      @jim
                    </span>
                    {userId && (
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                        user • {String(userId).slice(0, 8)}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/70">
                      коп. @ (позже)
                    </span>
                  </div>
                </div>
              </div>

              {/* invite */}
              <div className="mt-5 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs font-semibold text-white/70">
                  Инвайт (привязка устройства)
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div
                    className={cn(
                      "flex-1 h-11 px-4 rounded-xl flex items-center",
                      "bg-[#0f1020]/60 border border-white/10 text-white/70",
                      "overflow-hidden"
                    )}
                    title={inviteLink}
                  >
                    <span className="truncate">{inviteLink}</span>
                  </div>

                  <button
                    type="button"
                    onClick={copyInvite}
                    className={cn(
                      "h-11 px-4 rounded-xl font-semibold",
                      "bg-pink-500/15 border border-pink-300/20",
                      "text-pink-200 hover:bg-pink-500/20 transition"
                    )}
                  >
                    Копировать
                  </button>
                </div>

                <div className="mt-3 text-xs text-white/45">
                  Профиль — это центр продукта: identity + devices + shares. Дальше сюда добавим
                  звонки/микрофон/реальный QR.
                </div>
              </div>
            </div>
          )}

          {tab === "devices" && (
            <div className="p-6">
              <div className="text-white/70 font-semibold">Устройства</div>
              <div className="mt-2 text-white/45 text-sm">
                Тут будет список устройств, онлайн/оффлайн, и управление привязками. (Скоро)
              </div>
            </div>
          )}

          {tab === "files" && (
            <div className="p-6">
              <div className="text-white/70 font-semibold">Файлы</div>
              <div className="mt-2 text-white/45 text-sm">
                Тут будут твои шеры, загрузки и история. (Скоро)
              </div>
            </div>
          )}
        </div>

        {/* photo menu modal */}
        {showPhotoMenu && (
          <div
            className="fixed inset-0 z-50 bg-black/60 grid place-items-center px-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowPhotoMenu(false);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[#15162a] border border-white/10 overflow-hidden">
              <div className="p-4">
                <div className="text-base font-extrabold">Фото профиля</div>
                <div className="mt-1 text-sm text-white/50">
                  Добавить или удалить фото (как ты хотел — через аватарку ✏️)
                </div>
              </div>

              <div className="px-4 pb-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={pickPhoto}
                  className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 font-semibold transition"
                >
                  Добавить / заменить
                </button>

                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={!avatar}
                  className={cn(
                    "h-11 rounded-xl border font-semibold transition",
                    avatar
                      ? "bg-red-500/10 hover:bg-red-500/15 border-red-300/20 text-red-200"
                      : "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  Удалить
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhotoMenu(false)}
                  className="h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-semibold transition"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        {toast && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
            <div className="px-4 py-2 rounded-full bg-black/70 border border-white/10 text-white/90 text-sm font-semibold">
              {toast}
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}