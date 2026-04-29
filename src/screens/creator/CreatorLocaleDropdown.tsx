import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "../../types/app";
import { buildAlphabeticalLocales, getLocaleOption } from "./creator.utils";

export function CreatorLocaleDropdown({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = useMemo(() => buildAlphabeticalLocales(), []);
  const selected = getLocaleOption(value);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div>
      {label ? (
        <div className="text-secondary mb-2 text-xs font-medium uppercase tracking-[0.08em]">
          {label}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-surface text-primary bg-surface-hover flex min-h-[52px] w-full items-center justify-between rounded-full border border-soft px-4 py-3 text-left transition"
      >
        <span className="text-primary truncate pr-4 text-sm font-medium">
          {selected?.nativeLabel ?? value}
        </span>

        <ChevronDown className="text-secondary h-4 w-4 shrink-0" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] bg-page/95 backdrop-blur-xl">
          <div className="mx-auto flex h-full w-full max-w-[720px] flex-col px-4 pb-5 pt-[max(18px,env(safe-area-inset-top))] sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-primary text-lg font-semibold">🌎</div>
                <div className="text-secondary mt-1 truncate text-sm">
                  {selected?.nativeLabel ?? value}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-soft bg-surface text-primary transition hover:bg-surface-soft"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="theme-scrollbar min-h-0 flex-1 overflow-y-auto rounded-[28px] border border-soft bg-surface p-2 shadow-soft">
              {options.map((item) => {
                const isActive = item.code === value;

                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      onChange(item.code as Locale);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left text-base transition ${
                      isActive
                        ? "bg-strong text-strong-foreground"
                        : "text-secondary hover:bg-surface-soft"
                    }`}
                  >
                    <span className="truncate pr-4">{item.nativeLabel}</span>
                    {isActive ? <Check className="h-5 w-5 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
