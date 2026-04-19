import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const rootRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => buildAlphabeticalLocales(), []);
  const selected = getLocaleOption(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="text-secondary mb-2 text-xs font-medium uppercase tracking-[0.08em]">
        {label}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="bg-surface text-primary bg-surface-hover flex min-h-[52px] w-full items-center justify-between rounded-full border border-soft px-4 py-3 text-left transition"
      >
        <span className="text-primary truncate pr-4 text-sm font-medium">
          {selected?.nativeLabel ?? value}
        </span>

        <ChevronDown
          className={`text-secondary h-4 w-4 shrink-0 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="theme-scrollbar bg-surface shadow-soft absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 max-h-80 overflow-y-auto rounded-[24px] border border-soft p-2">
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
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  isActive
                    ? "bg-strong text-strong-foreground"
                    : "text-secondary bg-surface-hover"
                }`}
              >
                <span className="truncate pr-4">{item.nativeLabel}</span>
                {isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
