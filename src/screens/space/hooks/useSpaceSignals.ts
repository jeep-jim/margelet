import { useEffect, useMemo, useState } from "react";
import { inferPlanetId, makeId, pickDemoSignals, readSignals, writeSignals } from "../lib/space-engine";
import type { SpaceSignal, SpaceSignalKind, SpaceTelegramUser } from "../types";

function getUserName(user: SpaceTelegramUser | null) {
  return user?.first_name || user?.username || "You";
}

function getUserAvatar(user: SpaceTelegramUser | null) {
  return user?.photo_url || null;
}

export function useSpaceSignals() {
  const [signals, setSignals] = useState<SpaceSignal[]>(() => readSignals());
  const demoSignals = useMemo(() => pickDemoSignals(), []);
  const visibleSignals = useMemo(() => [...demoSignals, ...signals], [demoSignals, signals]);

  useEffect(() => {
    writeSignals(signals);
  }, [signals]);

  const createSignal = (input: { text: string; kind: SpaceSignalKind; user: SpaceTelegramUser | null }) => {
    const clean = input.text.trim().slice(0, 140);
    if (!clean || !input.user) return null;

    const next: SpaceSignal = {
      id: makeId("signal"),
      kind: input.kind,
      text: clean,
      x: 45 + Math.random() * 10,
      y: 45 + Math.random() * 10,
      createdAt: Date.now(),
      authorName: getUserName(input.user),
      authorAvatar: getUserAvatar(input.user),
      replies: [],
      planetId: inferPlanetId(clean),
    };

    setSignals((prev) => [next, ...prev]);
    return next;
  };

  const addReply = (input: { signal: SpaceSignal; text: string; user: SpaceTelegramUser | null }) => {
    const clean = input.text.trim().slice(0, 160);
    if (!clean || !input.user || input.signal.id.startsWith("demo-")) return false;

    setSignals((prev) =>
      prev.map((signal) =>
        signal.id === input.signal.id
          ? {
              ...signal,
              replies: [
                {
                  id: makeId("reply"),
                  text: clean,
                  createdAt: Date.now(),
                  authorName: getUserName(input.user),
                  authorAvatar: getUserAvatar(input.user),
                },
                ...signal.replies,
              ].slice(0, 12),
            }
          : signal
      )
    );

    return true;
  };

  const removeSignal = (id: string) => setSignals((prev) => prev.filter((signal) => signal.id !== id));

  return { visibleSignals, createSignal, addReply, removeSignal };
}
