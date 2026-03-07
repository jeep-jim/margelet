import React from "react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function StatCard({ emoji, value, label, hint }) {
  return (
    <Card className="p-4 text-center">
      <div className="mb-2 text-2xl">{emoji}</div>
      <div className="text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

export default function Analytics({ copy, agents }) {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          emoji="🎬"
          value="120"
          label={copy.videos}
          hint={copy.generatedThisWeek}
        />
        <StatCard
          emoji="👀"
          value="320k"
          label={copy.views}
          hint={copy.crossPlatformTotal}
        />
        <StatCard
          emoji="📈"
          value="+18%"
          label="Growth"
          hint="last 7 days"
        />
        <StatCard
          emoji="🤖"
          value={agents.length}
          label={copy.agentsCount}
          hint="active agents"
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">Agent performance</div>
            <div className="text-sm text-slate-500">
              Which agents generate the most reach
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <div className="font-semibold text-slate-900">{agent.name}</div>
                <div className="text-xs text-slate-500">{agent.platform}</div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-bold">{12 + i * 4}</div>
                  <div className="text-xs text-slate-500">videos</div>
                </div>

                <div className="text-center">
                  <div className="font-bold">{24 + i * 11}k</div>
                  <div className="text-xs text-slate-500">views</div>
                </div>

                <div className="text-center">
                  <div className="font-bold">{(4.2 + i * 0.3).toFixed(1)}%</div>
                  <div className="text-xs text-slate-500">CTR</div>
                </div>

                <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  +{8 + i * 3}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="text-lg font-semibold">Top viral videos</div>
          <div className="mt-4 space-y-3">
            {[
              ["Morning motivation", "82k views"],
              ["3 business rules", "64k views"],
              ["Breaking AI news", "58k views"],
            ].map(([title, views]) => (
              <div
                key={title}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="font-medium text-slate-900">{title}</div>
                <div className="text-xs font-semibold text-slate-500">
                  {views}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="text-lg font-semibold">Platform performance</div>
          <div className="mt-4 space-y-3">
            {[
              ["TikTok", "+22%"],
              ["YouTube Shorts", "+17%"],
              ["Instagram Reels", "+9%"],
              ["Telegram", "+6%"],
            ].map(([name, growth]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div className="font-medium text-slate-900">{name}</div>
                <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  {growth}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">{copy.variantLearning}</div>
            <div className="text-sm text-slate-500">
              {copy.variantLearningDesc}
            </div>
          </div>

          <div className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            learning loop
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Best hook</div>
            <div className="mt-3 text-sm font-semibold text-slate-900">
              “Most people fail before breakfast”
            </div>
            <div className="mt-2 text-xs text-emerald-600">
              +31% retention
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Best caption style</div>
            <div className="mt-3 text-sm font-semibold text-slate-900">
              Bold hook + highlighted keywords
            </div>
            <div className="mt-2 text-xs text-emerald-600">
              +18% watch rate
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs text-slate-500">Best visual pack</div>
            <div className="mt-3 text-sm font-semibold text-slate-900">
              Dark cinematic stock + fast cuts
            </div>
            <div className="mt-2 text-xs text-emerald-600">
              Best CTR this week
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}