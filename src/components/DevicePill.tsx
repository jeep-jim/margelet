import React from "react";

export function DevicePill({
  label,
  mutedColor,
  accentColor,
  border,
  bg,
}: {
  label: string;
  mutedColor: string;
  accentColor: string;
  border: string;
  bg: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        background: bg,
        borderRadius: 20,
        padding: "12px 20px",
        textAlign: "center",
      }}
    >
      <span style={{ color: mutedColor }}>device</span>
      <span style={{ margin: "0 10px", color: accentColor }}>•</span>
      <strong style={{ color: accentColor }}>{label}</strong>
    </div>
  );
}