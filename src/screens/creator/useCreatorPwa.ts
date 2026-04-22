import { useEffect, useMemo, useState } from "react";
import type { Locale } from "../../types/app";
import type { BeforeInstallPromptEvent } from "./creator.types";
import { isIosDevice, isStandaloneMode } from "./creator.utils";

const ANDROID_INSTALL_HINT: Record<Locale, string> = {
  en: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  ru: "На Android: открой меню браузера и нажми «Установить приложение» или «Добавить на главный экран».",
  uk: "На Android: відкрий меню браузера та натисни «Встановити застосунок» або «Додати на головний екран».",
  in: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  fa: "در Android منوی مرورگر را باز کنید و روی Install app یا Add to Home screen بزنید.",
  de: "Unter Android: Öffne das Browsermenü und tippe auf App installieren oder Zum Startbildschirm hinzufügen.",
  es: "En Android: abre el menú del navegador y pulsa Instalar aplicación o Añadir a la pantalla de inicio.",
  tr: "Android'de tarayıcı menüsünü açıp Uygulamayı yükle veya Ana ekrana ekle seçeneğine dokun.",
  fr: "Sur Android, ouvre le menu du navigateur puis touche Installer l'application ou Ajouter à l'écran d'accueil.",
  it: "Su Android apri il menu del browser e tocca Installa app oppure Aggiungi alla schermata Home.",
  "pt-br": "No Android, abra o menu do navegador e toque em Instalar app ou Adicionar à tela inicial.",
  kk: "Android-та браузер мәзірін ашып, «Қолданбаны орнату» немесе «Басты экранға қосу» түймесін бас.",
  uz: "Android’da brauzer menyusini ochib, Install app yoki Add to Home screen tugmasini bosing.",
  ae: "على Android افتح قائمة المتصفح واضغط Install app أو Add to Home screen.",
  eg: "على Android افتح قائمة المتصفح واضغط Install app أو Add to Home screen.",
  pk: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  id: "Di Android, buka menu browser lalu ketuk Instal aplikasi atau Tambahkan ke layar utama.",
  mx: "En Android, abre el menú del navegador y pulsa Instalar aplicación o Añadir a la pantalla de inicio.",
  sa: "على Android افتح قائمة المتصفح واضغط Install app أو Add to Home screen.",
  ar: "En Android, abre el menú del navegador y pulsa Instalar aplicación o Añadir a la pantalla de inicio.",
  co: "En Android, abre el menú del navegador y pulsa Instalar aplicación o Añadir a la pantalla de inicio.",
  za: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  ng: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  zh: "在 Android 上：打开浏览器菜单，然后点击 Install app 或 Add to Home screen。",
  ms: "Pada Android, buka menu pelayar dan tekan Install app atau Add to Home screen.",
};

function isAndroidDevice() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

export function useCreatorPwa(locale: Locale) {
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() =>
    typeof window === "undefined" ? false : isStandaloneMode()
  );
  const [isInstallReady, setIsInstallReady] = useState(false);
  const [installHintText, setInstallHintText] = useState("");

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
      setInstallHintText("");
    };

    const onAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setIsInstallReady(false);
      setInstallHintText("");
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
  const isAndroid = useMemo(() => isAndroidDevice(), []);
  const canShowInstallButton = !isStandalone && (isInstallReady || isIos || isAndroid);

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
          setInstallHintText("");
          return;
        }

        setDeferredInstallPrompt(null);
        setIsInstallReady(false);
      } catch {
        setDeferredInstallPrompt(null);
        setIsInstallReady(false);
      }
    }

    if (isIos) {
      setInstallHintText(locale === "ru" ? "На iPhone: Поделиться → На экран «Домой»" : "On iPhone: Share → Add to Home Screen");
      return;
    }

    if (isAndroid) {
      setInstallHintText(ANDROID_INSTALL_HINT[locale]);
    }
  };

  return {
    canShowInstallButton,
    handleInstallApp,
    installHintText,
    isInstallReady,
    isStandalone,
  };
}
