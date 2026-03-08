import React from "react";
import {
  Bot,
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Link2,
  Sparkles,
  Plus,
  Wand2,
  Hash,
  FileText,
  Mic,
  Clapperboard,
  Upload,
  FolderKanban,
  Archive,
  CalendarClock,
  Activity,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl sm:p-5 ${className}`}
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

function StatCard({ emoji, value, label, hint }) {
  return (
    <Card className="p-4 text-center">
      <div className="mb-2 text-2xl">{emoji}</div>
      <div className="text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

function PlatformPill({ icon, name, state = "connected", copy }) {
  const tone =
    state === "connected"
      ? "bg-emerald-50 border-emerald-200"
      : "bg-amber-50 border-amber-200";

  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${tone}`}
    >
      <div className="flex min-w-0 items-center gap-3 font-medium text-slate-900">
        <div className="flex h-5 w-5 shrink-0 items-center justify-center">
          {icon}
        </div>
        <span className="truncate">{name}</span>
      </div>
      <div className="shrink-0 text-xs font-semibold text-slate-600">
        {state === "connected" ? copy.connected : copy.pending}
      </div>
    </div>
  );
}

function StepChip({ icon, label, active = false }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
        active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function QueueItem({ title, time, status, platform }) {
  const styles = {
    ready: "bg-sky-50 text-sky-700 border-sky-200",
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    review: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {platform} • {time}
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
        >
          {status}
        </div>
      </div>
    </div>
  );
}

function AssetRow({ icon, title, state, meta }) {
  const map = {
    done: "text-emerald-600 bg-emerald-50 border-emerald-200",
    progress: "text-sky-600 bg-sky-50 border-sky-200",
    waiting: "text-slate-500 bg-slate-50 border-slate-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-slate-900">
          <div className="shrink-0">{icon}</div>
          <div className="min-w-0">
            <div className="font-medium">{title}</div>
            {meta ? (
              <div className="mt-1 text-xs text-slate-500">{meta}</div>
            ) : null}
          </div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${map[state]}`}
        >
          {state}
        </div>
      </div>
    </div>
  );
}

function VariantCard({ title, score, hook, state }) {
  const stateMap = {
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-slate-50 text-slate-600 border-slate-200",
    queued: "bg-sky-50 text-sky-700 border-sky-200",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900">{title}</div>
          <div className="mt-2 text-sm leading-6 text-slate-500">{hook}</div>
        </div>
        <div
          className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${stateMap[state]}`}
        >
          {state}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-500">Score</div>
        <div className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
          <Activity size={12} /> {score}
        </div>
      </div>
    </div>
  );
}

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#229ED9">
    <path d="M9.04 15.54l-.39 5.46c.56 0 .8-.24 1.1-.53l2.63-2.52 5.45 3.99c1 .55 1.7.26 1.96-.92l3.56-16.67.01-.01c.31-1.46-.53-2.03-1.5-1.67L1.74 9.67c-1.43.56-1.41 1.36-.24 1.72l5.1 1.59L18.4 6.1c.55-.33 1.05-.15.64.18" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FF0000">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#E1306C">
    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm5 5a5 5 0 110 10 5 5 0 010-10zm6.5-.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000">
    <path d="M16.5 3c.4 2.1 2 3.7 4.1 4v3.1c-1.5 0-2.9-.4-4.1-1.2v6.2a6 6 0 11-6-6c.3 0 .6 0 .9.1v3.1a3 3 0 10 2.1 2.9V3h3z" />
  </svg>
);

function AgentWorkspace({ copy, agent, onBack, onConfigure }) {
  if (!agent) return null;

  const queue = [
    {
      title: `${agent.name} • morning short`,
      time: "09:00",
      status: agent.autopost ? "ready" : "review",
      platform: agent.platform,
    },
    {
      title: `${agent.name} • daily recap`,
      time: "13:00",
      status: "published",
      platform: agent.platform,
    },
    {
      title: `${agent.name} • evening post`,
      time: "18:00",
      status: "review",
      platform: agent.platform,
    },
  ];

  const variants = [
    {
      title: "Top variant",
      score: 91,
      hook: "This habit quietly destroys your progress",
      state: "ready",
    },
    {
      title: "Alt variant A",
      score: 84,
      hook: "Most people fail before breakfast",
      state: "queued",
    },
    {
      title: "Alt variant B",
      score: 78,
      hook: "One mistake costs you 6 months",
      state: "draft",
    },
  ];

  const history = [
    {
      title: "Hook variation A",
      time: "today",
      status: "published",
      platform: "YouTube Shorts",
    },
    {
      title: "Caption pack #18",
      time: "today",
      status: "ready",
      platform: "Telegram",
    },
    {
      title: "Story voice cut",
      time: "yesterday",
      status: "published",
      platform: "TikTok",
    },
  ];

  return (
    <>
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <button
              onClick={onBack}
              className="mb-3 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
            >
              ← {copy.back}
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Bot size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-black text-slate-900">
                  {agent.name}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {agent.topic} • {agent.videos} {copy.videosPerDay} •{" "}
                  {agent.platform}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusPill active={agent.active} copy={copy} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {agent.mode}
            </span>
            <button
              onClick={onConfigure}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {copy.configure}
            </button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Activity size={18} /> {copy.generatedAssets}
            </div>
            <div className="grid gap-3">
              <AssetRow
                icon={<Wand2 size={16} />}
                title={copy.script}
                state="done"
                meta="3 script angles ready"
              />
              <AssetRow
                icon={<Hash size={16} />}
                title={copy.hashtags}
                state="done"
                meta="2 caption styles + hashtag packs"
              />
              <AssetRow
                icon={<Mic size={16} />}
                title={copy.voiceover}
                state="progress"
                meta="Top voice rendering now"
              />
              <AssetRow
                icon={<FileText size={16} />}
                title={copy.captions}
                state="done"
                meta="Hook captions + highlighted words"
              />
              <AssetRow
                icon={<Clapperboard size={16} />}
                title="Top variant"
                state="progress"
                meta="Score 91 • ready to render"
              />
              <AssetRow
                icon={<Clapperboard size={16} />}
                title="Alt variant A"
                state="done"
                meta="Score 84 • queued for publish"
              />
              <AssetRow
                icon={<Clapperboard size={16} />}
                title="Alt variant B"
                state="waiting"
                meta="Score 78 • draft candidate"
              />
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <FlaskConical size={18} /> Variant Lab
              </div>
              <div className="text-xs font-semibold text-slate-500">
                12 variants generated
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {variants.map((variant) => (
                <VariantCard key={variant.title} {...variant} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                Render top 3
              </button>
              <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                Render top 5
              </button>
              <button className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                Queue approved
              </button>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FolderKanban size={18} /> {copy.queue}
            </div>
            <div className="space-y-3">
              {queue.map((item) => (
                <QueueItem key={`${item.title}-${item.time}`} {...item} />
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <CalendarClock size={18} /> {copy.pipeline}
            </div>
            <div className="space-y-3 text-sm">
              <StepChip icon={<Wand2 size={14} />} label={copy.script} active />
              <StepChip
                icon={<Mic size={14} />}
                label={copy.voiceover}
                active
              />
              <StepChip
                icon={<Clapperboard size={14} />}
                label="Variant scoring"
                active
              />
              <StepChip
                icon={<Upload size={14} />}
                label={agent.autopost ? copy.autoMode : copy.manualMode}
                active
              />
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              {copy.postingWindow}: 09:00 • 13:00 • 18:00
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Archive size={18} /> {copy.historyTitle}
            </div>
            <div className="space-y-3">
              {history.map((item) => (
                <QueueItem key={`${item.title}-${item.time}`} {...item} />
              ))}
            </div>
          </Card>

          <Card>
            <div className="text-lg font-semibold text-slate-900">
              {copy.creatorHub}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {copy.creatorHubDesc}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  {copy.totalAgentInstalls}
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">3</div>
                <div className="mt-1 text-xs text-emerald-600">
                  {copy.growing}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  {copy.viewsGenerated}
                </div>
                <div className="mt-2 text-2xl font-black text-slate-900">
                  48.3M
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {copy.allAgents}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function Dashboard({
  copy,
  showDetails,
  setShowDetails,
  setShowConnectModal,
  setShowWizard,
  totals,
  agents,
  selectedWorkspaceAgent,
  setSelectedWorkspaceId,
  setEditingAgentId,
}) {
  return selectedWorkspaceAgent ? (
    <AgentWorkspace
      copy={copy}
      agent={selectedWorkspaceAgent}
      onBack={() => setSelectedWorkspaceId(null)}
      onConfigure={() => setEditingAgentId(selectedWorkspaceAgent.id)}
    />
  ) : (
    <>
      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(139,92,246,0.92),rgba(59,130,246,0.85))] text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
              {copy.heroDesc}
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Sparkles size={14} />{" "}
                {showDetails ? copy.hideDetails : copy.learnMore}
              </button>

              <button
                onClick={() => setShowConnectModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Link2 size={14} /> {copy.connectNewChannel}
              </button>

              <button
                onClick={() => setShowWizard(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900"
              >
                <Plus size={14} /> {copy.createAgent}
              </button>
            </div>

            <div className="mt-4 text-xs font-medium text-white/80">
              {copy.detailsOpenHint}
            </div>
          </div>

          <div className="w-full rounded-3xl bg-white/15 p-4 backdrop-blur lg:w-[240px]">
            <div className="text-xs text-white/70">{copy.liveStatus}</div>
            <div className="mt-2 text-2xl font-black">
              {totals.activeAgents}/{totals.agents}
            </div>
            <div className="text-sm text-white/80">{copy.agentsCurrently}</div>
          </div>
        </div>
      </Card>

      {showDetails && (
        <Card>
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>🧭</span>
                {copy.details1Title}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {copy.details1Text}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>🤖</span>
                {copy.details2Title}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {copy.details2Text}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>👤</span>
                {copy.details3Title}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {copy.details3Text}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span>📤</span>
                {copy.details4Title}
              </div>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {copy.details4Text}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          emoji="🎬"
          value={totals.videos}
          label={copy.videos}
          hint={copy.generatedThisMonth}
        />
        <StatCard
          emoji="👀"
          value={totals.views}
          label={copy.views}
          hint={copy.totalTrackedReach}
        />
        <StatCard
          emoji="🤖"
          value={totals.agents}
          label={copy.agentsCount}
          hint={copy.configuredInWorkspace}
        />
        <StatCard
          emoji="⚡"
          value={totals.activeAgents}
          label={copy.inWork}
          hint={copy.runningRightNow}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold">{copy.agentActivity}</div>
              <div className="text-sm text-slate-500">
                {copy.statusesAndRuns}
              </div>
            </div>

            <button
              onClick={() => setShowWizard(true)}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
            >
              {copy.createAgent}
            </button>
          </div>

          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold">{agent.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {agent.topic} • {agent.videos} {copy.videosPerDay} •{" "}
                      {agent.platform}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs text-slate-500 sm:text-right">
                      <div>{agent.lastRun}</div>
                      <div className="mt-1 flex items-center gap-1 sm:justify-end">
                        {agent.health === "healthy" ? (
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                        ) : (
                          <AlertCircle size={12} className="text-amber-500" />
                        )}
                        {agent.health === "healthy"
                          ? copy.healthy
                          : copy.needsAuth}
                      </div>
                    </div>
                    <StatusPill active={agent.active} copy={copy} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                    {agent.mode}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                    {agent.length}s
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                    {agent.style}
                  </span>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setSelectedWorkspaceId(agent.id)}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white"
                  >
                    <ChevronRight size={14} /> {copy.openWorkspace}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 text-lg font-semibold">
            {copy.connectedChannels}
          </div>

          <div className="space-y-3">
            <PlatformPill
              icon={<TelegramIcon />}
              name="Telegram"
              state="connected"
              copy={copy}
            />
            <PlatformPill
              icon={<YouTubeIcon />}
              name="YouTube Shorts"
              state="connected"
              copy={copy}
            />
            <PlatformPill
              icon={<InstagramIcon />}
              name="Instagram Reels"
              state="pending"
              copy={copy}
            />
            <PlatformPill
              icon={<TikTokIcon />}
              name="TikTok"
              state="pending"
              copy={copy}
            />
          </div>

          <button
            onClick={() => setShowConnectModal(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <Link2 size={15} /> {copy.connectNewChannel}
          </button>
        </Card>
      </div>
    </>
  );
}