"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { GrowthChartPoint } from "@/lib/services/dashboard.service"

const fmtLabel = (dateStr: string) => {
  const [, m, d] = dateStr.split("-")
  return `${m}/${d}`
}

interface Props {
  days?:          number
  refreshSignal?: number
}

export function UserGrowthChart({ days = 30, refreshSignal = 0 }: Props) {
  const [data,    setData]    = useState<GrowthChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/admin/dashboard/charts?type=growth&days=${days}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d: GrowthChartPoint[]) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [days, refreshSignal])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900">User Growth</h3>
      <p className="mt-0.5 text-xs text-slate-400">New registrations — last {days} days</p>

      <div className="mt-5 h-52">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#00C896]" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            Failed to load chart data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtLabel}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                formatter={(v: number) => [v, "New users"]}
                labelFormatter={(l: string) => l}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="users"
                fill="#00C896"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
