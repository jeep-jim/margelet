import { useMemo, useRef, useState } from "react";
// Если у тебя уже есть useI18n — подключай и заменяй строки на t(...)
 // import { useI18n } from "@/i18n";

type Props = {
  // Можно прокинуть onBack из роутера или просто использовать navigate(-1)
  onBack?: () => void;

  // На будущее: вызывай реальный endpoint подтверждения кода
  onConfirm?: (code: string) => Promise<void> | void;
};

function normalizeCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export default function LinkDevice({ onBack, onConfirm }: Props) {
  // const { t } = useI18n();

  const [mode, setMode] = useState<"code" | "qr">("code");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isComplete = code.length >= 6; // можно 6–8
  const prettyCode = useMemo(() => code.padEnd(8, "•"), [code]);

  // сегментированный ввод через один input (идеально по UX и проще по коду)
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit() {
    if (!isComplete || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirm?.(code);
      // Тут потом: success → navigate в ControlCenter/Devices
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-10 flex justify-center">
      <div className="w-full max-w-[560px] space-y-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition"
            type="button"
          >
            <span className="text-lg leading-none">←</span>
            Назад
          </button>

          <div className="text-sm opacity-70">RU</div>
        </div>

        {/* Title: строго 2 строки */}
        <h1 className="text-[clamp(30px,6vw,46px)] leading-[1.06] font-semibold tracking-[-0.02em]">
          Подключить
          <br />
          устройство
        </h1>

        {/* Subtitle */}
        <div className="text-sm opacity-70 max-w-[44ch]">
          Введи код с основного устройства или восстанови доступ через QR.
        </div>

        {/* Segmented tabs */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode("code")}
            className={[
              "h-12 rounded-2xl border transition",
              mode === "code"
                ? "bg-primary/20 border-white/10"
                : "bg-transparent border-white/10 opacity-80 hover:opacity-100",
            ].join(" ")}
          >
            Код
          </button>

          <button
            type="button"
            onClick={() => setMode("qr")}
            className={[
              "h-12 rounded-2xl border transition",
              mode === "qr"
                ? "bg-primary/20 border-white/10"
                : "bg-transparent border-white/10 opacity-80 hover:opacity-100",
            ].join(" ")}
          >
            QR
          </button>
        </div>

        {/* Card */}
        <div className="rounded-[28px] bg-surface p-6 border border-white/10">
          {mode === "code" ? (
            <div className="space-y-5">
              <div className="text-sm opacity-80">Введи код</div>

              {/* Fake segmented view */}
              <button
                type="button"
                onClick={() => inputRef.current?.focus()}
                className="w-full rounded-2xl bg-black/20 border border-white/10 px-4 py-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 font-mono text-[18px] tracking-[0.18em]">
                    {prettyCode.split("").map((ch, i) => (
                      <span
                        key={i}
                        className={[
                          "inline-flex w-[18px] justify-center",
                          i === code.length ? "opacity-100" : "opacity-80",
                        ].join(" ")}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs opacity-50">6–8</div>
                </div>
              </button>

              {/* Real input (hidden but accessible) */}
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(normalizeCode(e.target.value))}
                inputMode="text"
                autoComplete="one-time-code"
                className="sr-only"
                aria-label="Device linking code"
              />

              <div className="text-xs opacity-60">
                Код создаётся на основном устройстве. Он действует ограниченное время.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm opacity-80">Восстановить через QR</div>

              <div className="rounded-2xl bg-black/20 border border-white/10 p-6 h-[190px] flex items-center justify-center">
                <div className="text-sm opacity-60 text-center">
                  Здесь будет сканер QR
                </div>
              </div>

              <div className="text-xs opacity-60">
                На будущее: просим доступ к камере, сканируем QR, подтверждаем устройство.
              </div>
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={mode === "qr" ? true : !isComplete || isSubmitting}
          className={[
            "w-full h-14 rounded-2xl font-medium transition",
            "hover:brightness-110 hover:shadow-lg",
            "disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-none",
            "bg-primary",
          ].join(" ")}
        >
          {isSubmitting ? "Подключаем..." : "Продолжить"}
        </button>

        {/* Secondary hint */}
        <div className="text-xs opacity-55">
          Нет основного устройства? Тогда нажми «Создать доступ» на предыдущем экране.
        </div>
      </div>
    </div>
  );
}