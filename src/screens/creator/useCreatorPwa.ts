import { useEffect, useMemo, useState } from "react";
import type { BeforeInstallPromptEvent } from "./creator.types";
import { isIosDevice, isStandaloneMode } from "./creator.utils";

export function useCreatorPwa() {
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() =>
    typeof window === "undefined" ? false : isStandaloneMode()
  );
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [showIosInstallHint, setShowIosInstallHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncStandalone = () => {
      setIsStandalone(isStandaloneMode());
    };

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const installEvent = event as BeforeInstallPromptEvent;
      setDeferredInstallPrompt(installEvent);
      setIsInstallReady(true);
      setShowIosInstallHint(false);
    };

    const onAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstallReady(false);
      setShowIosInstallHint(false);
      syncStandalone();
    };

    syncStandalone();

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", onAppInstalled);

    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => syncStandalone();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onDisplayModeChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onDisplayModeChange);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", onAppInstalled);

      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onDisplayModeChange);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(onDisplayModeChange);
      }
    };
  }, []);

  const isIos = useMemo(() => isIosDevice(), []);
  const canShowInstallButton = !isStandalone && (isInstallReady || isIos);

  const handleInstallApp = async () => {
    if (isStandaloneMode()) {
      setIsStandalone(true);
      return;
    }

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();

      try {
        const choice = await deferredInstallPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setDeferredInstallPrompt(null);
          setIsInstallReady(false);
          setShowIosInstallHint(false);
        }
      } catch {
        //
      }

      return;
    }

    if (isIos) {
      setShowIosInstallHint(true);
    }
  };

  return {
    canShowInstallButton,
    handleInstallApp,
    isIos,
    isInstallReady,
    isStandalone,
    setShowIosInstallHint,
    showIosInstallHint,
  };
}
