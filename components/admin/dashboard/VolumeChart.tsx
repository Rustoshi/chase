"use client"

import { useEffect, useState } from "react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import type { VolumeChartPoint } from "@/lib/services/dashboard.service"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style:    "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)

const fmtLabel = (dateStr: string) => {
  const [, m, d] = dateStr.split("-")
  return `${m}/${d}`
}

interface Props {
  days?:            number
  refreshSignal?:   number
}

export function VolumeChart({ days = 30, refreshSignal = 0 }: Props) {
  const [data,    setData]    = useState<VolumeChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/admin/dashboard/charts?type=volume&days=${days}`)
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((d: VolumeChartPoint[]) => { setData(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [days, refreshSignal])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h3 className="text-base font-semibold text-slate-900">Transaction Volume</h3>
      <p className="mt-0.5 text-xs text-slate-400">Completed deposits & transfers — last {days} days</p>

      <div className="mt-5 h-52">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1A2CCE]" />
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-sm text-red-500">
            Failed to load chart data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1A2CCE" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A2CCE" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmtLabel}
                tick={{ fontSize: 11, fill: "#98A2B3" }}
                axisLine={false}
                tickLine={false}
                interval={Math.floor(data.length / 6)}
              />
              <YAxis
                tickFormatter={fmt}
                tick={{ fontSize: 11, fill: "#98A2B3" }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                formatter={(v: number) => [fmt(v), "Volume"]}
                labelFormatter={(l: string) => l}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #EAECF0",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#1A2CCE"
                strokeWidth={2}
                fill="url(#volumeGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#1A2CCE" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
