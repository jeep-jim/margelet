import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Play,
  Sparkles,
  Send,
  Youtube,
  Instagram,
  Music4,
  MonitorPlay,
  Filter,
  Search,
  CalendarClock,
  Layers3,
  Package,
  FileVideo,
  FileText,
} from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.10)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        {Icon ? <Icon size={13} /> : null}
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, action = null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Icon size={16} />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900">{title}</div>
          {desc ? <div className="mt-1 text-sm text-slate-500">{desc}</div> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function Input({ value, onChange, placeholder = "" }) {
  return (
    <div className="relative">
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function Select({ value, onChange, options = [] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
    >
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function getPlatformMeta(platform) {
  if (platform === "telegram") {
    return {
      label: "Telegram",
      icon: Send,
      iconClassName: "text-sky-500",
    };
  }

  if (platform === "youtube-shorts") {
    return {
      label: "YouTube Shorts",
      icon: Youtube,
      iconClassName: "text-red-500",
    };
  }

  if (platform === "instagram-reels") {
    return {
      label: "Instagram Reels",
      icon: Instagram,
      iconClassName: "text-pink-500",
    };
  }

  if (platform === "tiktok") {
    return {
      label: "TikTok",
      icon: Music4,
      iconClassName: "text-slate-900",
    };
  }

  return {
    label: platform || "Unknown",
    icon: MonitorPlay,
    iconClassName: "text-slate-500",
  };
}

function getStatusMeta(status) {
  if (status === "queued") {
    return {
      label: "В очереди",
      pill: "bg-violet-100 text-violet-700",
      icon: Clock3,
    };
  }

  if (status === "ready") {
    return {
      label: "Готово",
      pill: "bg-emerald-100 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  if (status === "review") {
    return {
      label: "Нужна проверка",
      pill: "bg-amber-100 text-amber-700",
      icon: AlertCircle,
    };
  }

  if (status === "draft") {
    return {
      label: "Черновик",
      pill: "bg-slate-100 text-slate-700",
      icon: FileText,
    };
  }

  if (status === "assets-ready") {
    return {
      label: "Ассеты готовы",
      pill: "bg-sky-100 text-sky-700",
      icon: Package,
    };
  }

  return {
    label: status || "Статус",
    pill: "bg-slate-100 text-slate-700",
    icon: Layers3,
  };
}

function getTypeMeta(assetType) {
  if (assetType === "content-pack") {
    return {
      label: "Контент-пак",
      icon: Package,
    };
  }

  if (assetType === "script-voice") {
    return {
      label: "Сценарий + озвучка",
      icon: FileText,
    };
  }

  if (assetType === "assets") {
    return {
      label: "Ассеты",
      icon: Layers3,
    };
  }

  return {
    label: "Видео",
    icon: FileVideo,
  };
}

function normalizeQueue(input) {
  if (Array.isArray(input)) return input;

  if (Array.isArray(input?.queue)) return input.queue;

  if (Array.isArray(input?.items)) {
    return input.items.map((item) => ({
      topic: item?.topic || "",
      title: item?.script?.title || "",
      agent: item?.agent?.name || item?.agent || "",
      publishPlan: item?.publishPlan || null,
    }));
  }

  return [];
}

function flattenQueueItems(rawQueue) {
  const result = [];

  rawQueue.forEach((entry, entryIndex) => {
    const planPlatforms = entry?.publishPlan?.platforms;

    if (Array.isArray(planPlatforms) && planPlatforms.length) {
      planPlatforms.forEach((platformItem, platformIndex) => {
        result.push({
          id: `${entryIndex}-${platformIndex}`,
          topic: entry?.topic || "",
          title: platformItem?.title || entry?.title || "",
          agent: entry?.agent || "",
          platform: platformItem?.platform || "",
          platformLabel: platformItem?.label || "",
          status: platformItem?.status || entry?.publishPlan?.status || "review",
          assetType: platformItem?.assetType || entry?.publishPlan?.assetType || "video",
          mode: entry?.publishPlan?.mode || "manual",
          frequency: entry?.publishPlan?.frequency || "daily",
          schedule: entry?.publishPlan?.schedule || "",
          captionSeed: platformItem?.captionSeed || "",
          hashtags: Array.isArray(platformItem?.hashtags) ? platformItem.hashtags : [],
          recommendedFormat: platformItem?.recommendedFormat || "9:16",
          contentType: platformItem?.contentType || "post",
        });
      });
    } else {
      result.push({
        id: `${entryIndex}-0`,
        topic: entry?.topic || "",
        title: entry?.title || "",
        agent: entry?.agent || "",
        platform: "",
        platformLabel: "",
        status: entry?.publishPlan?.status || "review",
        assetType: entry?.publishPlan?.assetType || "video",
        mode: entry?.publishPlan?.mode || "manual",
        frequency: entry?.publishPlan?.frequency || "daily",
        schedule: entry?.publishPlan?.schedule || "",
        captionSeed: entry?.publishPlan?.captionSeed || "",
        hashtags: Array.isArray(entry?.publishPlan?.hashtags)
          ? entry.publishPlan.hashtags
          : [],
        recommendedFormat: "9:16",
        contentType: "post",
      });
    }
  });

  return result;
}

function QueueItemCard({ item }) {
  const platformMeta = getPlatformMeta(item.platform);
  const statusMeta = getStatusMeta(item.status);
  const typeMeta = getTypeMeta(item.assetType);

  const PlatformIcon = platformMeta.icon;
  const StatusIcon = statusMeta.icon;
  const TypeIcon = typeMeta.icon;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill className={statusMeta.pill}>
              <StatusIcon size={12} />
              {statusMeta.label}
            </Pill>

            <Pill className="bg-slate-100 text-slate-700">
              <TypeIcon size={12} />
              {typeMeta.label}
            </Pill>

            {item.platform ? (
              <Pill className="bg-sky-50 text-slate-700 ring-1 ring-sky-100">
                <PlatformIcon size={12} className={platformMeta.iconClassName} />
                {platformMeta.label}
              </Pill>
            ) : null}
          </div>

          <div className="mt-3 text-lg font-black text-slate-900">
            {item.title || "Без названия"}
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {item.topic || "Без темы"}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Агент
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">
            {item.agent || "—"}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Режим
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">
            {item.mode === "autopost" ? "Автопостинг" : "Ручной"}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Частота
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">
            {item.frequency || "daily"}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3.5 py-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Формат
          </div>
          <div className="mt-2 text-sm font-bold text-slate-800">
            {item.recommendedFormat || "9:16"}
          </div>
        </div>
      </div>

      {item.captionSeed ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-xs font-bold text-slate-500">Caption seed</div>
          <div className="mt-2 text-sm text-slate-700">{item.captionSeed}</div>
        </div>
      ) : null}

      {item.hashtags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.hashtags.slice(0, 8).map((tag) => (
            <Pill key={tag} className="bg-white text-slate-700 ring-1 ring-slate-200">
              {tag}
            </Pill>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function QueuePage({
  queue,
  onBack,
}) {
  const rawQueue = useMemo(() => normalizeQueue(queue), [queue]);
  const items = useMemo(() => flattenQueueItems(rawQueue), [rawQueue]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [platform, setPlatform] = useState("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const text = `${item.title} ${item.topic} ${item.agent} ${item.platformLabel}`
        .toLowerCase();

      const matchesSearch = !search.trim() || text.includes(search.toLowerCase());
      const matchesStatus = status === "all" || item.status === status;
      const matchesPlatform = platform === "all" || item.platform === platform;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [items, search, status, platform]);

  const stats = useMemo(() => {
    const queued = items.filter((item) => item.status === "queued").length;
    const ready = items.filter((item) => item.status === "ready").length;
    const review = items.filter((item) => item.status === "review").length;
    const drafts = items.filter((item) => item.status === "draft").length;

    return {
      total: items.length,
      queued,
      ready,
      review,
      drafts,
    };
  }, [items]);

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-500">Очередь контента</div>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div className="min-w-0 text-2xl font-black text-slate-900">
                Publish Queue
              </div>

              <Pill className="bg-violet-100 text-violet-700">
                <Sparkles size={12} />
                {stats.total} элементов
              </Pill>
            </div>

            <div className="mt-3 max-w-3xl text-sm text-slate-600">
              Здесь видно, что уже сгенерировано, что ждёт проверки, что стоит в очереди и куда это будет опубликовано.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
              Назад
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Layers3}
            label="Всего"
            value={stats.total}
            hint="Все элементы очереди"
          />
          <MetricCard
            icon={Clock3}
            label="В очереди"
            value={stats.queued}
            hint="Queued"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Готово"
            value={stats.ready}
            hint="Ready to publish"
          />
          <MetricCard
            icon={AlertCircle}
            label="На проверке"
            value={stats.review}
            hint="Need review"
          />
        </div>
      </Card>

      <Card>
        <SectionTitle
          icon={Filter}
          title="Фильтры"
          desc="Быстрый поиск по очереди."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <Input
            value={search}
            onChange={setSearch}
            placeholder="Искать по названию, теме, агенту..."
          />

          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Все статусы" },
              { value: "queued", label: "В очереди" },
              { value: "ready", label: "Готово" },
              { value: "review", label: "На проверке" },
              { value: "draft", label: "Черновики" },
              { value: "assets-ready", label: "Ассеты готовы" },
            ]}
          />

          <Select
            value={platform}
            onChange={setPlatform}
            options={[
              { value: "all", label: "Все платформы" },
              { value: "telegram", label: "Telegram" },
              { value: "youtube-shorts", label: "YouTube Shorts" },
              { value: "instagram-reels", label: "Instagram Reels" },
              { value: "tiktok", label: "TikTok" },
            ]}
          />
        </div>
      </Card>

      <div className="grid gap-4">
        {filtered.length ? (
          filtered.map((item) => <QueueItemCard key={item.id} item={item} />)
        ) : (
          <Card>
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
                <CalendarClock size={18} />
              </div>
              <div className="mt-3 text-sm font-bold text-slate-900">
                Очередь пока пустая
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Сгенерируй контент агентом, и элементы появятся здесь.
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}