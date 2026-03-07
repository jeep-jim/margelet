"use client";

import React from "react";
import {
  Bot,
  BarChart3,
  CreditCard,
  Globe,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";

function Avatar({ name, image, size = "md" }) {
  const sizeMap = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return image ? (
    <img
      src={image}
      alt={name}
      className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white/80`}
    />
  ) : (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#60a5fa)] font-bold text-white ring-2 ring-white/80`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export default function Sidebar({
  tab,
  setTab,
  lang,
  setLang,
  copy,
  currentAuthor,
  onOpenAuthor,
}) {
  const item = (name, icon, key, accent) => (
    <button
      onClick={() => setTab(key)}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
        tab === key
          ? `${accent} text-white shadow-lg`
          : "bg-white/70 text-slate-700 hover:bg-white"
      }`}
    >
      {icon}
      <span className="font-medium">{name}</span>
    </button>
  );

  return (
    <div className="space-y-2">
      <button
        onClick={onOpenAuthor}
        className="mb-3 flex w-full items-center gap-3 rounded-2xl bg-white/70 p-3 text-left transition hover:bg-white"
      >
        <Avatar
          name={currentAuthor.name}
          image={currentAuthor.image}
          size="md"
        />
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">
            {currentAuthor.name}
          </div>
          <div className="truncate text-xs text-slate-500">
            {currentAuthor.handle}
          </div>
        </div>
      </button>

      {item(
        copy.dashboard,
        <LayoutDashboard size={16} />,
        "dashboard",
        "bg-violet-600"
      )}
      {item(copy.agents, <Bot size={16} />, "agents", "bg-fuchsia-600")}
      {item(
        copy.marketplace,
        <Sparkles size={16} />,
        "marketplace",
        "bg-indigo-600"
      )}
      {item(
        copy.analytics,
        <BarChart3 size={16} />,
        "analytics",
        "bg-emerald-600"
      )}
      {item(
        copy.billing,
        <CreditCard size={16} />,
        "billing",
        "bg-amber-500"
      )}
      {item(
        copy.settings,
        <Settings size={16} />,
        "settings",
        "bg-slate-700"
      )}

      <div className="mt-4 border-t border-slate-200/80 pt-4">
        <button
          onClick={() => setLang(lang === "en" ? "ru" : "en")}
          className="flex w-full items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-left text-slate-700 transition hover:bg-white"
        >
          <div className="flex items-center gap-3">
            <Globe size={16} />
            <span className="font-medium">{copy.language}</span>
          </div>
          <span className="text-sm font-semibold uppercase">{lang}</span>
        </button>
      </div>
    </div>
  );
}