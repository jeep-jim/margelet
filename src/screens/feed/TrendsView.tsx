import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type TrendItem = {
  word: string;
  mentions: number;
  change: string;
  history: number[];
};

export function TrendsView({ countryCode = 'ru' }: { countryCode?: string }) {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();
        if (data.ok && data.trends) {
          setTrends(data.trends);
        }
      } catch (err) {
        console.error('Failed to fetch trends', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [countryCode]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-gray-400">Loading trends...</div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-gray-400">No trends yet. Check back soon.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[570px] px-4 py-4">
      <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
        <span className="text-orange-500">🔥</span> Telegram Trends — {countryCode.toUpperCase()}
      </h2>

      <div className="space-y-3">
        {trends.slice(0, 20).map((trend, idx) => {
          const chartData = {
            labels: trend.history.map((_, i) => i.toString()),
            datasets: [
              {
                label: trend.word,
                data: trend.history,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
              },
            ],
          };

          const options = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: { display: false },
              tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw} mentions` } },
            },
            scales: {
              x: { display: false },
              y: { display: false },
            },
          };

          return (
            <div
              key={trend.word}
              className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 transition hover:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-600">#{idx + 1}</span>
                  <span className="text-lg font-medium">{trend.word}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">{trend.mentions} mentions</div>
                  <div className={`text-sm ${trend.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                    {trend.change}
                  </div>
                </div>
              </div>
              <div className="h-16 w-full">
                <Line data={chartData} options={options} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}