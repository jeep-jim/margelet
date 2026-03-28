import { useEffect, useRef, useState } from "react";

function ExpandableTextBase({
  text,
  lines,
  fallbackLimit,
  textClassName,
}: {
  text: string;
  lines: 2 | 5 | 10;
  fallbackLimit: number;
  textClassName: string;
}) {
  const [expanded, setExpanded] = useState(false);
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

    const maxHeight = lineHeight * lines + 1;
    setShouldClamp(node.scrollHeight > maxHeight);
  }, [fallbackLimit, lines, text]);

  useEffect(() => {
    setExpanded(false);
  }, [text]);

  if (!text) return null;

  const clampClass =
    lines === 2 ? "line-clamp-2" : lines === 5 ? "line-clamp-5" : "line-clamp-[10]";

  return (
    <div className={textClassName}>
      <div className="relative">
        <div
          ref={measureRef}
          className={expanded ? "" : `${clampClass} pr-14`}
        >
          {text}
        </div>

        {shouldClamp && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="absolute bottom-0 right-0 bg-white pl-2 text-sm font-medium text-neutral-500"
          >
            Ещё
          </button>
        ) : null}
      </div>

      {shouldClamp && expanded ? (
        <div className="mt-1 flex justify-end">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-sm font-medium text-neutral-500"
          >
            Свернуть
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ExpandableFeedText({ text }: { text: string }) {
  return (
    <ExpandableTextBase
      text={text}
      lines={2}
      fallbackLimit={120}
      textClassName="text-[15px] leading-6 text-neutral-900"
    />
  );
}

export function ExpandableTextPostText({ text }: { text: string }) {
  return (
    <ExpandableTextBase
      text={text}
      lines={5}
      fallbackLimit={260}
      textClassName="text-[15px] leading-7 text-neutral-900"
    />
  );
}