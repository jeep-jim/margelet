"use client";

import React, { useMemo, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import {
  getAdminMetrics,
  getAdminUsersRows,
  getAdminAgentsRows,
  getMarketplaceRows,
  getAdminPaymentsRows,
  getAdminVideosRows,
  getAdminChannelsRows,
  getAdminLogsRows,
} from "@/lib/margelet/selectors";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({ title, value, hint }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

function DataList({ title, rows }) {
  return (
    <Card>
      <div className="mb-4 text-lg font-semibold text-slate-900">{title}</div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${title}-${index}-${row.id || row.title}`}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <div className="font-semibold text-slate-900">{row.title}</div>
              <div className="text-xs text-slate-500">{row.meta}</div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {row.badge}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function AdminApp() {
  const [tab, setTab] = useState("dashboard");

  const metrics = useMemo(() => getAdminMetrics(), []);
  const userRows = useMemo(() => getAdminUsersRows(), []);
  const agentRows = useMemo(() => getAdminAgentsRows(), []);
  const marketplaceRows = useMemo(() => getMarketplaceRows(), []);
  const paymentRows = useMemo(() => getAdminPaymentsRows(), []);
  const videoRows = useMemo(() => getAdminVideosRows(), []);
  const channelRows = useMemo(() => getAdminChannelsRows(), []);
  const logRows = useMemo(() => getAdminLogsRows(), []);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#d9d6ff_0%,#dde8ff_50%,#d8f0ff_100%)] text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-[280px_1fr] gap-4 p-4">
        <Card className="sticky top-4 h-fit">
          <AdminSidebar tab={tab} setTab={setTab} />
        </Card>

        <div className="space-y-4">
          {tab === "dashboard" && (
            <>
              <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(51,65,85,0.92))] text-white">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-3xl">
                    <h1 className="text-3xl font-black tracking-tight">
                      Admin Dashboard
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-white/80">
                      Private control layer for Margelet. Manage users, agents,
                      marketplace, payments, channels, videos and logs from one
                      hidden panel.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                    <div className="text-xs text-white/70">role</div>
                    <div className="mt-2 text-2xl font-black">admin</div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-4 gap-4">
                <MetricCard
                  title="Users"
                  value={metrics.users.toLocaleString()}
                  hint="all accounts"
                />
                <MetricCard
                  title="Agents"
                  value={metrics.agents.toLocaleString()}
                  hint="published + private"
                />
                <MetricCard
                  title="Videos"
                  value={metrics.videos.toLocaleString()}
                  hint="tracked items"
                />
                <MetricCard
                  title="Revenue"
                  value={`⭐ ${metrics.revenueStars.toLocaleString()}`}
                  hint="gross stars"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <DataList title="Recent users" rows={userRows.slice(0, 4)} />
                <DataList title="System alerts" rows={logRows.slice(0, 4)} />
              </div>
            </>
          )}

          {tab === "users" && <DataList title="Users" rows={userRows} />}

          {tab === "agents" && <DataList title="Agents" rows={agentRows} />}

          {tab === "marketplace" && (
            <DataList
              title="Marketplace"
              rows={marketplaceRows.map((row) => ({
                id: row.id,
                title: row.title,
                meta: `${row.ownerHandle} • ${row.installs.toLocaleString()} installs • ★ ${row.rating} • ⭐ ${row.priceStars}`,
                badge: row.type,
              }))}
            />
          )}

          {tab === "payments" && (
            <DataList title="Payments" rows={paymentRows} />
          )}

          {tab === "videos" && <DataList title="Videos" rows={videoRows} />}

          {tab === "channels" && (
            <DataList title="Channels" rows={channelRows} />
          )}

          {tab === "logs" && <DataList title="System Logs" rows={logRows} />}
        </div>
      </div>
    </div>
  );
}