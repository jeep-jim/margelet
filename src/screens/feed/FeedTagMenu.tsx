import { Check } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type AnchorRect = {
  top: number;
  left: number;
  width: number;
};

export function FeedTagMenu({
  tags,
  anchorRect,
  onRequestClose,
  title = "Tags",
}: {
  tags: string[];
  anchorRect: AnchorRect | null;
  onRequestClose: () => void;
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onRequestClose();
      }
    }

    function handleScrollClose() {
      onRequestClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollClose, { passive: true });
    window.addEventListener("wheel", handleScrollClose, { passive: true });
    window.addEventListener("touchmove", handleScrollClose, { passive: true });
    window.addEventListener("resize", handleScrollClose);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollClose);
      window.removeEventListener("wheel", handleScrollClose);
      window.removeEventListener("touchmove", handleScrollClose);
      window.removeEventListener("resize", handleScrollClose);
    };
  }, [onRequestClose]);

  const position = useMemo(() => {
    const menuWidth = 264;
    const safeLeft = Math.max(
      12,
      Math.min(anchorRect?.left ?? 12, window.innerWidth - menuWidth - 12)
    );

    return {
      top: Math.max(12, (anchorRect?.top ?? 72) + 8),
      left: safeLeft,
      width: menuWidth,
    };
  }, [anchorRect]);

  if (!mounted || tags.length === 0) {
    return null;
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[99998]" onClick={onRequestClose} />

      <div
        className="fixed z-[99999] rounded-[22px] border border-soft bg-surface p-2 shadow-soft"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
      >
        <div className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-secondary">
          {title}
        </div>

        <div className="space-y-1">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-primary"
            >
              <Check className="h-4 w-4 text-secondary" />
              <span>{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}