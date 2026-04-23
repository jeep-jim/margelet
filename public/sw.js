export function registerPwaServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => {
          // noop
        });
      });
    });

    caches.keys().then((keys) => {
      keys.forEach((key) => {
        caches.delete(key).catch(() => {
          // noop
        });
      });
    });
  });
}