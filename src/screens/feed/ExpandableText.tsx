import { useEffect, useRef, useState } from "react";

function ExpandableTextBase({
  text,
  collapsedLines,
  expandedLines,
  fallbackLimit,
  textClassName,
  children,
}: {
  text: string;
  collapsedLines: 2 | 5 | 10;
  expandedLines: 5 | 10;
  fallbackLimit: number;
  textClassName: string;
  children?: (state: {
    expanded: boolean;
    clamped: boolean;
    expand: () => void;
  }) => React.ReactNode;
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

  return (
    <>
      <div className={textClassName}>
        <div
          ref={measureRef}
          className={`${clampClass} whitespace-pre-wrap break-words`}
        >
          {text}
        </div>
      </div>

      {children
        ? children({
            expanded: stage === 1,
            clamped: shouldClamp,
            expand: () => setStage(1),
          })
        : null}
    </>
  );
}

export function ExpandableFeedText({
  text,
  children,
}: {
  text: string;
  children?: (state: {
    expanded: boolean;
    clamped: boolean;
    expand: () => void;
  }) => React.ReactNode;
}) {
  return (
    <ExpandableTextBase
      text={text}
      collapsedLines={2}
      expandedLines={5}
      fallbackLimit={120}
      textClassName="text-[15px] leading-6 text-neutral-900"
    >
      {children}
    </ExpandableTextBase>
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