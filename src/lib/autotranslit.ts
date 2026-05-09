const STORAGE_KEY = "margelet_autotranslit";

export function getAutotranslit(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAutotranslit(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event("margelet-autotranslit-change"));
  } catch {
    // ignore
  }
}

export function toggleAutotranslit(): boolean {
  const next = !getAutotranslit();
  setAutotranslit(next);
  return next;
}