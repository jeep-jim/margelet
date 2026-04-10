import { useMemo } from "react";
import { AdminSectionCard } from "./AdminSectionCard";
import type { AnalyticsResponse } from "./admin.analytics.types";

type AdminAnalyticsSectionProps = {
  analytics: AnalyticsResponse | null;
};

function MetricCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: number;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={`rounded-xl p-3 ${
        tone === "accent" ? "bg-white/10" : "bg-black/20"
      }`}
    >
      <div className="text-sm text-white/50">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value || 0}</div>
    </div>
  );
}

export function AdminAnalyticsSection({
  analytics,
}: AdminAnalyticsSectionProps) {
  const sortedCountries = useMemo(() => {
    return Object.entries(analytics?.countries || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const sortedCountriesUnique = useMemo(() => {
    return Object.entries(analytics?.countriesUnique || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const sortedDevices = useMemo(() => {
    return Object.entries(analytics?.devices || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const sortedDevicesUnique = useMemo(() => {
    return Object.entries(analytics?.devicesUnique || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  if (!analytics) return null;

  return (
    <AdminSectionCard title="Аналитика">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="Уники сегодня" value={analytics.todayUniqueUsers} tone="accent" />
        <MetricCard title="Уники 7 дней" value={analytics.last7UniqueUsers} tone="accent" />
        <MetricCard title="Уники 30 дней" value={analytics.last30UniqueUsers} tone="accent" />
        <MetricCard title="Все уникальные" value={analytics.uniqueUsers} tone="accent" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="Просмотры сегодня" value={analytics.todayViews} />
        <MetricCard title="Просмотры 7 дней" value={analytics.last7Views} />
        <MetricCard title="Просмотры 30 дней" value={analytics.last30Views} />
        <MetricCard title="Все просмотры" value={analytics.views} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="Открытия сегодня" value={analytics.todayOpens} />
        <MetricCard title="Открытия 7 дней" value={analytics.last7Opens} />
        <MetricCard title="Открытия 30 дней" value={analytics.last30Opens} />
        <MetricCard title="Всего открытий" value={analytics.opens} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard title="Переходы TG сегодня" value={analytics.todayTgClicks} />
        <MetricCard title="Переходы TG 7 дней" value={analytics.last7TgClicks} />
        <MetricCard title="Переходы TG 30 дней" value={analytics.last30TgClicks} />
        <MetricCard title="Все переходы TG" value={analytics.tgClicks} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-2">
        <MetricCard title="Лайки" value={analytics.likes} />
        <MetricCard title="Подписки" value={analytics.subscriptions} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Страны — события</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortedCountries.length > 0 ? (
              sortedCountries.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm"
                >
                  {k}: {String(v)}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Страны — реальные уникальные</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortedCountriesUnique.length > 0 ? (
              sortedCountriesUnique.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm"
                >
                  {k}: {String(v)}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Устройства — события</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortedDevices.length > 0 ? (
              sortedDevices.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm"
                >
                  {k}: {String(v)}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Устройства — реальные уникальные</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sortedDevicesUnique.length > 0 ? (
              sortedDevicesUnique.map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-full bg-white/10 px-3 py-1 text-sm"
                >
                  {k}: {String(v)}
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Топ посты</div>
          <div className="mt-3 space-y-3">
            {(analytics.topPosts || []).length > 0 ? (
              analytics.topPosts.map((post, index) => (
                <div
                  key={post.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/35">#{index + 1}</div>
                      <div className="truncate text-sm font-semibold text-white">
                        {post.sourceTitle}
                      </div>
                      <div className="truncate text-xs text-white/45">
                        @{post.sourceHandle}
                      </div>
                    </div>

                    <div className="rounded-full bg-white/10 px-2 py-1 text-xs">
                      {post.score.toFixed(1)}
                    </div>
                  </div>

                  {post.textPreview ? (
                    <div className="mt-2 text-sm text-white/70">{post.textPreview}</div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      views: {post.views}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      opens: {post.opens}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      tg: {post.tgClicks}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      likes: {post.likes}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      bells: {post.subscriptions}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Топ источники</div>
          <div className="mt-3 space-y-3">
            {(analytics.topSources || []).length > 0 ? (
              analytics.topSources.map((source, index) => (
                <div
                  key={source.handle}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/35">#{index + 1}</div>
                      <div className="truncate text-sm font-semibold text-white">
                        {source.title}
                      </div>
                      <div className="truncate text-xs text-white/45">
                        @{source.handle}
                        {source.countryCode ? ` · ${source.countryCode}` : ""}
                      </div>
                    </div>

                    <div className="rounded-full bg-white/10 px-2 py-1 text-xs">
                      {source.score.toFixed(1)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      views: {source.views}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      opens: {source.opens}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      tg: {source.tgClicks}
                    </div>
                    <div className="rounded-full bg-white/10 px-2 py-1">
                      bells: {source.subscriptions}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/35">пока пусто</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs leading-6 text-white/35">
        Здесь уже не просто “заходы на сайт”. Если пользователь авторизован,
        он считается как один и тот же человек по Telegram ID, даже если меняет VPN.
        Администратор полностью исключён из статистики.
      </div>
    </AdminSectionCard>
  );
}