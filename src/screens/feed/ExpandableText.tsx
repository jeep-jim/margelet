import { useEffect, useRef, useState } from "react";

function ExpandableTextBase({
  text,
  collapsedLines,
  expandedLines,
  fallbackLimit,
  textClassName,
  onOpen,
}: {
  text: string;
  collapsedLines: 2 | 5 | 10;
  expandedLines: 5 | 10;
  fallbackLimit: number;
  textClassName: string;
  onOpen?: () => void;
}) {
  const [stage, setStage] = useState<0 | 1>(0);
  const [shouldClamp, setShouldClamp] = useState(false);
  const measureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = measureRef.current;
    if (!node) return;

    const styles = window.getComputedStyle(node);
    const lineHeight = parseFloat(styles.lineHeight || "0");

    if (!lineHeight) {
      setShouldClamp(text.length > fallbackLimit);
      return;
    }

    const maxHeight = lineHeight * collapsedLines + 1;
    setShouldClamp(node.scrollHeight > maxHeight);
  }, [collapsedLines, fallbackLimit, text]);

  useEffect(() => {
    setStage(0);
  }, [text]);

  if (!text) return null;

  const clampClass =
    stage === 0
      ? collapsedLines === 2
        ? "line-clamp-2"
        : collapsedLines === 5
          ? "line-clamp-5"
          : "line-clamp-[10]"
      : expandedLines === 5
        ? "line-clamp-5"
        : "line-clamp-[10]";

  const actionLabel = stage === 0 ? "Ещё" : "Читать";

  const handleAction = () => {
    if (stage === 0) {
      setStage(1);
      return;
    }

    onOpen?.();
  };

  return (
    <div className={textClassName}>
      <div ref={measureRef} className={`${clampClass} whitespace-pre-wrap break-words`}>
        {text}
      </div>

      {shouldClamp && onOpen ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={handleAction}
            className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ExpandableFeedText({
  text,
  onOpen,
}: {
  text: string;
  onOpen?: () => void;
}) {
  return (
    <ExpandableTextBase
      text={text}
      collapsedLines={2}
      expandedLines={5}
      fallbackLimit={120}
      textClassName="text-[15px] leading-6 text-neutral-900"
      onOpen={onOpen}
    />
  );
}

export function ExpandableTextPostText({ text }: { text: string }) {
  return (
    <ExpandableTextBase
      text={text}
      collapsedLines={5}
      expandedLines={10}
      fallbackLimit={260}
      textClassName="text-[15px] leading-7 text-neutral-900"
    />
  );
}