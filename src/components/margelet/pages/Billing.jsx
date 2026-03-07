import React from "react";
import { CreditCard } from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default function Billing({ copy }) {
  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{copy.billingTitle}</div>
            <div className="text-sm text-slate-500">{copy.billingDesc}</div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
            <CreditCard size={14} /> {copy.starsBilling}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-violet-200 bg-violet-50/70">
          <div className="text-lg font-semibold">{copy.starter}</div>
          <div className="mt-3 text-4xl font-black">⭐ 250</div>
          <div className="mt-1 text-sm text-slate-500">{copy.perMonth}</div>

          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>🤖 1 agent</li>
            <li>🎬 100 videos / month</li>
            <li>📤 2 connected channels</li>
          </ul>

          <button className="mt-5 w-full rounded-2xl bg-violet-600 py-3 font-semibold text-white">
            {copy.chooseStarter}
          </button>
        </Card>

        <Card className="relative overflow-hidden border-fuchsia-200 bg-fuchsia-50/70">
          <div className="absolute right-4 top-4 rounded-full bg-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
            {copy.popular}
          </div>

          <div className="text-lg font-semibold">{copy.creator}</div>
          <div className="mt-3 text-4xl font-black">⭐ 600</div>
          <div className="mt-1 text-sm text-slate-500">{copy.perMonth}</div>

          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>🤖 5 agents</li>
            <li>🎬 1000 videos / month</li>
            <li>📤 6 connected channels</li>
            <li>📤 {copy.autoMode}</li>
          </ul>

          <button className="mt-5 w-full rounded-2xl bg-fuchsia-600 py-3 font-semibold text-white">
            {copy.chooseCreator}
          </button>
        </Card>

        <Card className="border-sky-200 bg-sky-50/70">
          <div className="text-lg font-semibold">{copy.agency}</div>
          <div className="mt-3 text-4xl font-black">⭐ 1500</div>
          <div className="mt-1 text-sm text-slate-500">{copy.perMonth}</div>

          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            <li>🤖 20 agents</li>
            <li>{copy.unlimitedVideos}</li>
            <li>{copy.unlimitedChannels}</li>
            <li>🎞 Full video pipeline</li>
          </ul>

          <button className="mt-5 w-full rounded-2xl bg-sky-600 py-3 font-semibold text-white">
            {copy.chooseAgency}
          </button>
        </Card>
      </div>
    </>
  );
}