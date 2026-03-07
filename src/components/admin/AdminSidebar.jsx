"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Bot,
  Store,
  CreditCard,
  Clapperboard,
  Radio,
  ScrollText,
} from "lucide-react";

const items = [
  { key: "dashboard", label: "Admin Dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", icon: Users },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "marketplace", label: "Marketplace", icon: Store },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "videos", label: "Videos", icon: Clapperboard },
  { key: "channels", label: "Channels", icon: Radio },
  { key: "logs", label: "System Logs", icon: ScrollText },
];

export default function AdminSidebar({ tab, setTab }) {
  return (
    <div className="space-y-2">
      <div className="mb-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <img src="/icon.png" alt="margelet" className="h-7 w-7 rounded-md" />
          <span className="text-2xl font-black tracking-tight text-slate-900">
            admin
          </span>
        </div>
        <div className="mt-1 text-sm text-slate-500">
          private control panel
        </div>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        const active = tab === item.key;

        return (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
              active
                ? "bg-slate-900 text-white shadow-lg"
                : "bg-white/70 text-slate-700 hover:bg-white"
            }`}
          >
            <Icon size={16} />
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}