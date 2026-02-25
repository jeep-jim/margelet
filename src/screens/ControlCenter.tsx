// src/screens/ControlCenter.tsx

import { useEffect } from "react";
import { getDeviceLabel, getDeviceId } from "../lib/device";

export default function ControlCenter() {
  const deviceLabel = getDeviceLabel();
  const deviceId = getDeviceId();

  useEffect(() => {
    document.title = "Control — margeleT";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-12 flex justify-center">
      <div className="w-full max-w-[560px] space-y-12">
        
        {/* Title */}
        <h1 className="text-[clamp(28px,6vw,44px)] leading-[1.1] font-semibold">
          Это твой центр
          <br />
          управления
        </h1>

        {/* Device Card */}
        <div className="rounded-[32px] bg-surface p-8 space-y-6 shadow-soft">
          
          <div className="flex items-center gap-3 text-sm opacity-80">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Активно
          </div>

          <div>
            <div className="text-2xl font-semibold">
              {deviceLabel}
            </div>
            <div className="text-sm opacity-70 mt-1">
              device
            </div>
          </div>

          <div className="text-xs font-mono opacity-50 break-all">
            {deviceId}
          </div>
        </div>

        {/* Linked Devices */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">
            Подключённые устройства
          </h2>

          <div className="rounded-2xl border border-white/10 p-6 text-sm opacity-70">
            Пока подключено только это устройство.
            Добавь ещё одно для синхронизации.
          </div>
        </div>

        {/* CTA */}
        <button className="w-full rounded-2xl bg-primary py-4 font-medium transition hover:brightness-110 hover:shadow-lg">
          Подключить устройство
        </button>
      </div>
    </div>
  );
}