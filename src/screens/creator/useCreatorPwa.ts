import { useEffect, useMemo, useState } from "react";
import type { Locale } from "../../types/app";
import type { BeforeInstallPromptEvent } from "./creator.types";
import { isIosDevice, isStandaloneMode } from "./creator.utils";

const ANDROID_INSTALL_HINT: Record<Locale, string> = {
  ru: "На Android: открой меню браузера и нажми «Установить приложение» или «Добавить на главный экран».",
  uk: "На Android: відкрий меню браузера та натисни «Встановити застосунок» або «Додати на головний екран».",
  en: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  in: "Android पर: ब्राउज़र मेन्यू खोलें और Install app या Add to Home screen दबाएँ.",
  fa: "در Android: منوی مرورگر را باز کنید و روی «نصب برنامه» یا «افزودن به صفحه اصلی» بزنید.",
  tr: "Android'de: tarayıcı menüsünü açın ve Uygulamayı yükle ya da Ana ekrana ekle seçeneğine dokunun.",
  "pt-br": "No Android: abra o menu do navegador e toque em Instalar app ou Adicionar à tela inicial.",
  kk: "Android-та: браузер мәзірін ашып, «Қолданбаны орнату» немесе «Басты экранға қосу» түймесін басыңыз.",
  uz: "Android’da: brauzer menyusini ochib, Ilovani o‘rnatish yoki Bosh ekranga qo‘shish tugmasini bosing.",
  ae: "على Android: افتح قائمة المتصفح واضغط «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  eg: "على Android: افتح قائمة المتصفح واضغط «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  pk: "Android پر: براؤزر مینو کھولیں اور Install app یا Add to Home screen دبائیں۔",
  id: "Di Android: buka menu browser lalu ketuk Instal aplikasi atau Tambahkan ke layar utama.",
  mx: "En Android: abre el menú del navegador y pulsa Instalar app o Agregar a la pantalla de inicio.",
  sa: "على Android: افتح قائمة المتصفح واضغط «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
  es: "En Android: abre el menú del navegador y pulsa Instalar app o Añadir a la pantalla de inicio.",
  it: "Su Android: apri il menu del browser e tocca Installa app oppure Aggiungi alla schermata Home.",
  fr: "Sur Android : ouvre le menu du navigateur, puis touche Installer l’application ou Ajouter à l’écran d’accueil.",
  de: "Unter Android: Öffne das Browsermenü und tippe auf App installieren oder Zum Startbildschirm hinzufügen.",
  ar: "En Android: abre el menú del navegador y pulsa Instalar app o Agregar a la pantalla de inicio.",
  co: "En Android: abre el menú del navegador y pulsa Instalar app o Agregar a la pantalla de inicio.",
  za: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  ng: "On Android: open the browser menu and tap Install app or Add to Home screen.",
  zh: "在 Android 上：打开浏览器菜单，然后点击“安装应用”或“添加到主屏幕”。",
  ms: "Pada Android: buka menu pelayar dan tekan Pasang aplikasi atau Tambah ke skrin utama.",
};

const IOS_INSTALL_HINT: Record<Locale, string> = {
  ru: "На iPhone: Поделиться → На экран «Домой».",
  uk: "На iPhone: Поділитися → На екран «Додому».",
  en: "On iPhone: Share → Add to Home Screen.",
  in: "iPhone पर: Share → Add to Home Screen.",
  fa: "در iPhone: Share → Add to Home Screen.",
  tr: "iPhone’da: Paylaş → Ana Ekrana Ekle.",
  "pt-br": "No iPhone: Compartilhar → Adicionar à Tela de Início.",
  kk: "iPhone-да: Бөлісу → Басты экранға қосу.",
  uz: "iPhone’da: Ulashish → Bosh ekranga qo‘shish.",
  ae: "على iPhone: مشاركة → إضافة إلى الشاشة الرئيسية.",
  eg: "على iPhone: مشاركة → إضافة إلى الشاشة الرئيسية.",
  pk: "iPhone پر: Share → Add to Home Screen۔",
  id: "Di iPhone: Bagikan → Tambahkan ke Layar Utama.",
  mx: "En iPhone: Compartir → Agregar a pantalla de inicio.",
  sa: "على iPhone: مشاركة → إضافة إلى الشاشة الرئيسية.",
  es: "En iPhone: Compartir → Añadir a pantalla de inicio.",
  it: "Su iPhone: Condividi → Aggiungi alla schermata Home.",
  fr: "Sur iPhone : Partager → Ajouter à l’écran d’accueil.",
  de: "Auf iPhone: Teilen → Zum Home-Bildschirm.",
  ar: "En iPhone: Compartir → Agregar a pantalla de inicio.",
  co: "En iPhone: Compartir → Agregar a pantalla de inicio.",
  za: "On iPhone: Share → Add to Home Screen.",
  ng: "On iPhone: Share → Add to Home Screen.",
  zh: "在 iPhone 上：分享 → 添加到主屏幕。",
  ms: "Pada iPhone: Kongsi → Tambah ke Skrin Utama.",
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
      setInstallHintText(IOS_INSTALL_HINT[locale] || IOS_INSTALL_HINT.en);
      return;
    }

    if (isAndroid) {
      setInstallHintText(ANDROID_INSTALL_HINT[locale] || ANDROID_INSTALL_HINT.en);
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
