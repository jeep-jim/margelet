import { useMemo } from "react";
import { similarity } from "../lib/space-engine";
import type { SpaceSignal } from "../types";

export function useSpaceSearch(query: string, signals: SpaceSignal[]) {
  return useMemo(() => {
    const q = query.trim();
    if (!q) return new Set<string>();
    return new Set(
      signals
        .filter((signal) => similarity(q, signal.text) > 0 || signal.text.toLowerCase().includes(q.toLowerCase()))
        .map((signal) => signal.id)
    );
  }, [query, signals]);
}
