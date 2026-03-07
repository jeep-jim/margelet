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

function AuthorMini({ author, onOpen }) {
  return (
    <button
      onClick={() => onOpen(author)}
      className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:bg-white"
    >
      <Avatar name={author.name} image={author.image} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">
          {author.name}
        </div>
        <div className="truncate text-xs text-slate-500">
          {author.handle}
        </div>
      </div>
    </button>
  );
}

export default function Marketplace({
  copy,
  lang,
  storeAgents,
  setSelectedAuthor,
  setSelectedStoreAgent,
  creatorStars,
  publishedListings,
  agents,
  setPublishingAgent,
}) {
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{copy.marketplace}</div>
            <div className="text-sm text-slate-500">
              {lang === "ru"
                ? "Устанавливай и покупай агентов, созданных сообществом"
                : "Install or buy agents created by the community"}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["All", "Growth", "News", "Motivation", "Finance", "AI content"].map(
              (tag, i) => (
                <span
                  key={tag}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    i === 0
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {storeAgents.map((tpl, i) => (
          <Card key={tpl.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-3xl">{tpl.icon}</div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {tpl.type}
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                  ★ {tpl.rating}
                </span>
              </div>
            </div>

            <div className="mt-3 text-lg font-semibold text-slate-900">
              {tpl.title}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {tpl.videos} {copy.videosPerDay} • {tpl.length}s • {tpl.installs}{" "}
              {copy.installs.toLowerCase()}
            </div>

            <AuthorMini author={tpl.author} onOpen={setSelectedAuthor} />

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {tpl.topic}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {tpl.style}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                {tpl.autopost ? "Autopost" : "Manual"}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              {lang === "ru" ? "Лучше всего подходит для " : "Best for "}
              {tpl.key === "news"
                ? lang === "ru"
                  ? "быстрых медиа-каналов"
                  : "fast media channels"
                : tpl.key === "business"
                ? lang === "ru"
                  ? "экспертного короткого контента"
                  : "expert short-form content"
                : tpl.key === "motivation"
                ? lang === "ru"
                  ? "ежедневных мотивационных каналов"
                  : "daily inspiration channels"
                : lang === "ru"
                ? "faceless-каналов фактов"
                : "faceless fact channels"}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-700">
                {tpl.price}
              </div>
              <button
                onClick={() => setSelectedStoreAgent(tpl)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold text-white ${
                  i % 2 ? "bg-slate-500" : "bg-indigo-600"
                }`}
              >
                {tpl.type === "Paid" ? "Buy & Install" : "Install"}
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Top earning agents</div>
              <div className="text-sm text-slate-500">
                Creators earn Stars when others install their agents
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">#1 News Agent</div>
              <div className="text-xl font-bold">⭐ 4,200</div>
              <div className="text-xs text-slate-500">creator revenue</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">#2 Motivation Agent</div>
              <div className="text-xl font-bold">⭐ 3,100</div>
              <div className="text-xs text-slate-500">creator revenue</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">#3 Business Agent</div>
              <div className="text-xl font-bold">⭐ 1,900</div>
              <div className="text-xs text-slate-500">creator revenue</div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">Creator dashboard</div>
              <div className="text-sm text-slate-500">
                Your revenue and publishing metrics
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Revenue</div>
              <div className="text-xl font-bold">⭐ {creatorStars}</div>
              <div className="text-xs text-slate-500">last 30 days</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">{copy.installs}</div>
              <div className="text-xl font-bold">24.7k</div>
              <div className="text-xs text-slate-500">
                across {publishedListings} published agents
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Conversion</div>
              <div className="text-xl font-bold">6.4%</div>
              <div className="text-xs text-slate-500">
                store visitors → installs
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {[
              ["News Agent", "⭐ 4,200", "12.4k installs"],
              ["Motivation Agent", "⭐ 3,100", "8.9k installs"],
              ["Business Agent", "⭐ 1,120", "3.4k installs"],
            ].map(([name, revenue, installs]) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <div className="font-semibold text-slate-900">{name}</div>
                  <div className="text-xs text-slate-500">{installs}</div>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {revenue}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Trending this week</div>
            <div className="text-sm text-slate-500">
              Most installed agents right now
            </div>
          </div>

          <button
            onClick={() => setPublishingAgent(agents[0] || null)}
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Publish your agent
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["News Agent", "12.4k installs", "+38%"],
            ["Business Agent", "8.1k installs", "+21%"],
            ["Facts Agent", "6.6k installs", "+17%"],
          ].map(([name, installs, growth]) => (
            <div
              key={name}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
            >
              <div className="font-semibold text-slate-900">{name}</div>
              <div className="mt-1 text-xs text-slate-500">{installs}</div>
              <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {growth}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}