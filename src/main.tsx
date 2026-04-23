import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerPwaServiceWorker } from "./lib/pwa";
import { initTheme } from "./lib/theme";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = "G-6LXS66GXHN";

function initAnalytics() {
  if (typeof window === "undefined") return;
  if (!GA_ID) return;
  if (document.getElementById("ga4-script")) return;

  const script = document.createElement("script");
  script.id = "ga4-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];

  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_ID, {
    send_page_view: true,
  });
}

initTheme();
registerPwaServiceWorker();
initAnalytics();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);