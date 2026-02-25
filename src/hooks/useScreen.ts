import { useEffect, useState } from "react";
import { readScreen, writeScreen, type Screen } from "../lib/router";

export function useScreen() {
  const [screen, setScreen] = useState<Screen>(() => readScreen("landing"));

  useEffect(() => {
    writeScreen(screen);
  }, [screen]);

  return [screen, setScreen] as const;
}