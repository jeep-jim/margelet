import { useEffect, useRef, useState, type ReactNode } from "react";

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.|t\.me\/)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href =
      part.startsWith("http")
        ? part
        : part.startsWith("t.me/")
          ? `https://${part}`
          : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[#2563eb] underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {part}
      </a>
    );
  });
}

function RichPreview({
  text,
  expanded,
}: {
  text: string;
  expanded: boolean;
}) {
  const paragraphs = text
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div
      className={`text-[15px] leading-7 text-neutral-900 ${
        expanded ? "" : "line-clamp-5"
      }`}
    >
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");

        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {linkifyText(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function ExpandableFeedText({
  text,
  children,
}: {
  text: string;
  children: (state: {
    expanded: boolean;
    expand: () => void;
  }) => ReactNode;
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
      setShouldClamp(text.length > 220);
      return;
    }

    const maxHeight = lineHeight * 5 + 2;
    setShouldClamp(node.scrollHeight > maxHeight);
  }, [text]);

  return (
    <>
      <div className="relative">
        <div
          ref={measureRef}
          className="pointer-events-none absolute left-0 top-0 w-full opacity-0"
          aria-hidden
        >
          <RichPreview text={text} expanded />
        </div>

        <RichPreview text={text} expanded={expanded || !shouldClamp} />
      </div>

      {children({
        expanded,
        expand: () => setExpanded(true),
      })}
    </>
  );
}