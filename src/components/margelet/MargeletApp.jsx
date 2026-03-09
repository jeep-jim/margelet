"use client";

import React, { useState } from "react";
import Sidebar from "./layout/Sidebar";
import AgentWorkspace from "./pages/AgentWorkspace";
import Billing from "./pages/Billing";

const COPY = {
  en: {
    agents: "Agents",
    billing: "Stars",
    language: "Language",
  },
  ru: {
    agents: "Агенты",
    billing: "Старс",
    language: "Язык",
  },
};

const currentAuthor = {
  name: "margelet",
  username: "@margelet",
  image: "",
};

export default function MargeletApp() {
  const [tab, setTab] = useState("agents");
  const [lang, setLang] = useState("ru");

  const copy = COPY[lang];

  return (
    <div className="min-h-screen bg-[#dfe6fb] text-slate-900">
      <Sidebar
        tab={tab}
        setTab={setTab}
        lang={lang}
        setLang={setLang}
        copy={copy}
        currentAuthor={currentAuthor}
        onOpenAuthor={() => {}}
      />

      <div className="mx-auto w-full max-w-7xl px-3 pb-16 pt-3 sm:px-4 sm:pt-4 lg:px-6">
        {tab === "billing" ? <Billing copy={copy} /> : <AgentWorkspace />}
      </div>
    </div>
  );
}