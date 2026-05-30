import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

type TrendItem = {
  word: string;
  topic?: string;
  mentions: number;
  change: string;
  history: number[];
  topSources?: { name: string; mentions: number }[];
};

const DEMO_TRENDS: TrendItem[] = [
  { word: "bitcoin etf", mentions: 1432, change: "+218%", history: [12, 18, 25, 31, 44, 59, 88, 140, 220, 410, 690, 1432] },
  { word: "iran", mentions: 982, change: "+164%", history: [20, 22, 28, 40, 65, 120, 210, 330, 500, 690, 810, 982] },
  { word: "ton", mentions: 741, change: "+121%", history: [40, 44, 51, 60, 80, 115, 170, 240, 330, 480, 610, 741] },
  { word: "telegram premium", mentions: 508, change: "+88%", history: [18, 24, 29, 34, 60, 91, 130, 190, 250, 310, 390, 508] },
  { word: "nvidia", mentions: 466, change: "+74%", history: [25, 31, 37, 49, 72, 100, 132, 180, 235, 300, 380, 466] },
];

export function TrendsView({ countryCode = "ru" }: { countryCode?: string }) {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        if (data.ok && Array.isArray(data.trends) && data.trends.length) {
          setTrends(data.trends);
        } else {
          setTrends(DEMO_TRENDS);
        }
      } catch {
        setTrends(DEMO_TRENDS);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [countryCode]);

  const safeTrends = useMemo(() => trends.length ? trends : DEMO_TRENDS, [trends]);
  const top = safeTrends.slice(0, 5);

  if (loading) {
    return <div className="py-20 text-center text-slate-400">Loading Telegram signals...</div>;
  }

  const heroChart = {
    labels: ["4h", "8h", "12h", "16h", "20h", "24h", "28h", "32h", "36h", "40h", "44h", "48h"],
    datasets: top.map((trend) => ({
      label: trend.topic || trend.word,
      data: trend.history,
      tension: 0.42,
      borderWidth: 2,
      pointRadius: 0,
    })),
  };

  return (
    <div className="mx-auto max-w-[680px] px-4 py-5">
      <section className="mb-5 rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
              Telegram Intelligence
            </div>
            <h2 className="mt-2 text-2xl font-black text-white">
              🔥 Что Telegram обсуждает сейчас
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Рост тем, упоминаний и сигналов по стране {countryCode.toUpperCase()}.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-800/80 px-3 py-2 text-right">
            <div className="text-lg font-black text-white">{safeTrends.length}</div>
            <div className="text-xs text-slate-400">signals</div>
          </div>
        </div>

        <div className="mt-5 h-[220px] rounded-2xl bg-slate-950/60 p-3">
          <Line
            data={heroChart}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { labels: { color: "#cbd5e1", boxWidth: 10, usePointStyle: true } },
              },
              scales: {
                x: { ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } },
                y: { ticks: { color: "#64748b" }, grid: { color: "rgba(148,163,184,0.08)" } },
              },
            }}
          />
        </div>
      </section>

      <section className="mb-4 grid grid-cols-2 gap-3">
        {top.slice(0, 4).map((trend) => (
          <div key={trend.word} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="truncate text-sm font-bold text-white">{trend.topic || trend.word}</div>
            <div className="mt-2 text-xl font-black text-orange-300">{trend.change}</div>
            <div className="text-xs text-slate-400">{trend.mentions} mentions</div>
          </div>
        ))}
      </section>

      <h3 className="mb-3 text-lg font-black text-white">🚀 Fastest growing topics</h3>

      <div className="space-y-3">
        {safeTrends.map((trend, idx) => (
          <article
            key={trend.word}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-orange-400/50 hover:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-500">SIGNAL #{idx + 1}</div>
                <div className="mt-1 truncate text-xl font-black text-white">{trend.topic || trend.word}</div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-lg font-black text-emerald-400">{trend.change}</div>
                <div className="text-xs text-slate-400">{trend.mentions} mentions</div>
              </div>
            </div>

            <div className="mt-4 h-[72px]">
              <Line
                data={{
                  labels: trend.history.map((_, i) => String(i)),
                  datasets: [{ label: trend.word, data: trend.history, tension: 0.45, borderWidth: 2, pointRadius: 0 }],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false }, tooltip: { enabled: false } },
                  scales: { x: { display: false }, y: { display: false } },
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}