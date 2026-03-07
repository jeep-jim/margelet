import React, { useState } from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  Search,
  Sparkles,
} from "lucide-react";
import { runAgent } from "@/lib/margelet/runAgent";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function StatusPill({ active, copy }) {
  return active ? (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      <Play size={12} /> {copy.inWork}
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      <Pause size={12} /> {copy.paused}
    </div>
  );
}

export default function Agents({
  copy,
  agentSearch,
  setAgentSearch,
  agentFilter,
  setAgentFilter,
  filteredAgents,
  setShowWizard,
  setSelectedWorkspaceId,
  toggleAgent,
  setEditingAgentId,
}) {
  const [runningAgentId, setRunningAgentId] = useState(null);
  const [agentOutputs, setAgentOutputs] = useState({});

  const handleRunAgent = async (agent) => {
    try {
      setRunningAgentId(agent.id);

      const result = await runAgent({
        name: agent.name,
        topic: agent.topic,
        lengthSec: agent.length || 30,
        videosPerDay: agent.videos || 3,
        autopost: !!agent.autopost,
        platforms: agent.platform
          ? agent.platform.split("+").map((item) => item.trim().toLowerCase())
          : ["telegram"],
      });

      setAgentOutputs((prev) => ({
        ...prev,
        [agent.id]: result,
      }));
    } finally {
      setRunningAgentId(null);
    }
  };

  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{copy.agents}</div>
            <div className="text-sm text-slate-500">
              {copy.launchPauseConfigure}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/70">
              <Search size={15} className="text-slate-400" />
              <input
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder={
                  copy.language === "Язык" ? "Поиск агентов" : "Search agents"
                }
                className="w-40 bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
              {[
                { key: "all", label: copy.all },
                { key: "active", label: copy.active },
                { key: "manual", label: copy.manual },
                { key: "auto", label: copy.auto },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAgentFilter(item.key)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    agentFilter === item.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-4 py-3 font-semibold text-white"
            >
              <Plus size={16} /> {copy.createAgent}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredAgents.map((agent) => {
          const output = agentOutputs[agent.id];
          const isRunning = runningAgentId === agent.id;

          return (
            <Card key={agent.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-slate-900">
                    {agent.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {agent.topic}
                  </div>
                </div>

                <StatusPill active={agent.active} copy={copy} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <div className="text-2xl font-black text-slate-900">
                    {agent.videos}
                  </div>
                  <div className="text-xs text-slate-500">
                    {copy.videosPerDay}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <div className="text-2xl font-black text-slate-900">24k</div>
                  <div className="text-xs text-slate-500">
                    {copy.views.toLowerCase()}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-center">
                  <div className="text-sm font-bold text-slate-900">
                    {agent.mode}
                  </div>
                  <div className="text-xs text-slate-500">
                    {copy.agentMode}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                  {agent.platform}
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
                  {agent.length}s
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                  {agent.voice}
                </span>
              </div>

              {output && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Sparkles size={14} className="text-violet-600" />
                    Latest generated output
                  </div>
                  <div className="mt-3 text-sm font-semibold text-slate-800">
                    {output.script?.title}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {output.script?.hook}
                  </div>
                  <div className="mt-3 space-y-2">
                    {output.scenes?.map((scene) => (
                      <div
                        key={scene.id}
                        className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/70"
                      >
                        {scene.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 grid grid-cols-[1fr_auto_auto_auto] gap-2">
                <button
                  onClick={() => setSelectedWorkspaceId(agent.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                >
                  <ChevronRight size={14} /> {copy.openWorkspace}
                </button>

                <button
                  onClick={() => handleRunAgent(agent)}
                  disabled={isRunning}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                    isRunning ? "bg-slate-400" : "bg-indigo-600"
                  }`}
                >
                  {isRunning ? "Running..." : "Run"}
                </button>

                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold text-white ${
                    agent.active ? "bg-amber-500" : "bg-emerald-600"
                  }`}
                >
                  {agent.active ? copy.pauseAgent : copy.startAgent}
                </button>

                <button
                  onClick={() => setEditingAgentId(agent.id)}
                  className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
                >
                  {copy.configure}
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                {agent.health === "healthy" ? (
                  <CheckCircle2 size={12} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={12} className="text-amber-500" />
                )}
                {agent.health === "healthy" ? copy.healthy : copy.needsAuth}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}