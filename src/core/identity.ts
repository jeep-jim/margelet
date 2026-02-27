export function normalizeHandleInput(raw: string): string {
  const s = (raw || "").trim();
  if (!s) return "";
  return s.startsWith("@") ? s : "@" + s;
}

export function handleToPeerId(handle: string): string {
  // peerId = handle без @
  return (handle || "").trim().replace(/^@/, "").toLowerCase();
}

export function getMyHandle(): string {
  const k = "margelet_handle_v1";
  const v = (localStorage.getItem(k) || "").trim();
  if (v) return v.startsWith("@") ? v : "@" + v;
  return "";
}

export function setMyHandle(handleWithAt: string) {
  const k = "margelet_handle_v1";
  localStorage.setItem(k, handleWithAt);
}