import { useMemo } from "react";
import { AdminSectionCard } from "./AdminSectionCard";

type AnalyticsResponse = {
  views: number;
  countries: Record<string, string>;
  devices: Record<string, string>;
  today: number;
  last7: number;
  last30: number;
  days: Record<string, string>;
};

type AdminAnalyticsSectionProps = {
  analytics: AnalyticsResponse | null;
};

export function AdminAnalyticsSection({
  analytics,
}: AdminAnalyticsSectionProps) {
  const sortedCountries = useMemo(() => {
    return Object.entries(analytics?.countries || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  const sortedDevices = useMemo(() => {
    return Object.entries(analytics?.devices || {}).sort(
      (a, b) => Number(b[1]) - Number(a[1])
    );
  }, [analytics]);

  if (!analytics) return null;

  return (
    <AdminSectionCard title="Аналитика">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Сегодня</div>
          <div className="mt-1 text-2xl font-semibold">
            {analytics.today || 0}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">7 дней</div>
          <div className="mt-1 text-2xl font-semibold">
            {analytics.last7 || 0}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">30 дней</div>
          <div className="mt-1 text-2xl font-semibold">
            {analytics.last30 || 0}
          </div>
        </div>

        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Всего</div>
          <div className="mt-1 text-2xl font-semibold">
            {analytics.views || 0}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-black/20 p-3">
          <div className="text-sm text-white/50">Страны</div>
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
          <div className="text-sm text-white/50">Устройства</div>
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
      </div>

      <div className="mt-3 text-xs leading-6 text-white/35">
        Это реальные, но приблизительные данные MVP. Твои просмотры не
        считаются, если ты заходишь под своим Telegram ID администратора.
      </div>
    </AdminSectionCard>
  );
}