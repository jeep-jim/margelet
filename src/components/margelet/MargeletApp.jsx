"use client";

import React, { useState } from "react";
import Sidebar from "./layout/Sidebar";
import LandingPage from "./pages/LandingPage";
import AgentsPage from "./pages/AgentsPage";
import PricePage from "./pages/PricePage";

const COPY = {
  en: {
    agents: "Agents",
    billing: "Stars",
    language: "Language",
    landing: {
      heroTitle: "Free up your time",
      heroLines: [
        "Agents will do everything for you!",
        "Short videos up to 60 seconds",
        "for all your social platforms.",
      ],
      cta: "Create video",
      bottomTitle: "Choose an agent format → Set preferences → Download video",
      bottomText:
        "Publish videos and collect traffic, margelet works — you relax and keep growing!",
    },
  },
  ru: {
    agents: "Агенты",
    billing: "Старс",
    language: "Язык",
    landing: {
      heroTitle: "Освободи своё время",
      heroLines: [
        "Агенты сделают всё за тебя!",
        "Короткие видео до 60 секунд",
        "для всех твоих соцсетей.",
      ],
      cta: "Создать видео",
      bottomTitle: "Выбери формат агента → Задай настройки → Скачай видео",
      bottomText:
        "Публикуй видео и собирай трафик, margelet работает - ты отдыхаешь и растёшь!",
    },
  },
};

const currentAuthor = {
  name: "margelet",
  username: "@margelet",
  image: "",
};

export default function MargeletApp({ initialPage = "landing" }) {
  const [lang, setLang] = useState("ru");
  const copy = COPY[lang];

  return (
    <div className="min-h-screen bg-[#dfe6fb] text-slate-900">
      <Sidebar
        currentPage={initialPage}
        lang={lang}
        setLang={setLang}
        copy={copy}
        currentAuthor={currentAuthor}
      />

      <div className="pb-16">
        {initialPage === "billing" ? (
          <PricePage copy={copy} />
        ) : initialPage === "agents" ? (
          <AgentsPage />
        ) : (
          <LandingPage copy={copy.landing} />
        )}
      </div>
    </div>
  );
}