import React from "react";
import { Users } from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function Settings({ copy }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <Card>
        <div className="mb-4 text-xl font-semibold">
          {copy.workspaceSettings}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{copy.telegramStarsBilling}</span>
            <span className="font-semibold text-emerald-600">
              {copy.enabled}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{copy.apiKeys}</span>
            <span className="font-semibold text-amber-600">
              2 {copy.missing}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
            <span>{copy.connectedNetworks}</span>
            <span className="font-semibold text-sky-600">
              4 {copy.channelsCount}
            </span>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <div className="font-semibold text-slate-900">
              Telegram creator identity
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {copy.telegramIdentityHint}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 text-xl font-semibold">
          {copy.automationSafety}
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <div className="rounded-2xl bg-emerald-50 px-4 py-3">
            {copy.postingLimits}
          </div>

          <div className="rounded-2xl bg-amber-50 px-4 py-3">
            {copy.reviewRequired}
          </div>

          <div className="rounded-2xl bg-violet-50 px-4 py-3">
            {copy.fallbackEnabled}
          </div>
        </div>

        <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
          <Users size={15} /> {copy.manageTeam}
        </button>
      </Card>
    </div>
  );
}