"use client"

import { useState, useEffect } from "react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from "recharts"
import { RefreshCw, Expand } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"

interface ChartPoint {
  period:          string
  completedVolume: number
  completedCount:  number
  failedCount:     number
  pendingCount:    number
}

const fmtVolume = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `$${(v / 1_000).toFixed(0)}K`
    : `$${v.toFixed(0)}`

interface Props {
  refreshSignal?: number
}

function ChartContent({ data, height = 120 }: { data: ChartPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="txGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#12B76A" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#12B76A" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="txRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#F04438" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#F04438" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 10, fill: "#98A2B3" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={fmtVolume}
          tick={{ fontSize: 10, fill: "#98A2B3" }}
          tickLine={false}
          axisLine={false}
          width={44}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "completedVolume") return [fmtVolume(value), "Volume"]
            return [value, name === "failedCount" ? "Failed" : "Pending"]
          }}
          labelStyle={{ fontWeight: 600, fontSize: 12 }}
          contentStyle={{ borderRadius: 8, border: "1px solid #EAECF0", fontSize: 12 }}
        />
        <Area
          type="monotone"
          dataKey="completedVolume"
          stroke="#12B76A"
          strokeWidth={2}
          fill="url(#txGreen)"
          name="completedVolume"
        />
        <Area
          type="monotone"
          dataKey="failedCount"
          stroke="#F04438"
          strokeWidth={1.5}
          fill="url(#txRed)"
          name="failedCount"
          yAxisId={0}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function ExpandedChart({ data, days, setDays, groupBy, setGroupBy, loading }: {
  data: ChartPoint[]
  days: number
  setDays: (d: number) => void
  groupBy: string
  setGroupBy: (g: string) => void
  loading: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))} className="w-28">
          <SelectItem value="14">14 days</SelectItem>
          <SelectItem value="30">30 days</SelectItem>
          <SelectItem value="90">90 days</SelectItem>
          <SelectItem value="365">365 days</SelectItem>
        </Select>
        <Select value={groupBy} onValueChange={setGroupBy} className="w-28">
          <SelectItem value="day">By day</SelectItem>
          <SelectItem value="week">By week</SelectItem>
          <SelectItem value="month">By month</SelectItem>
        </Select>
        {loading && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f9fafb" vertical={false} />
          <XAxis dataKey="period" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={fmtVolume} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
          <Tooltip formatter={(v: number, n: string) => [
            n === "completedVolume" ? fmtVolume(v) : v,
            n === "completedVolume" ? "Volume" : n === "failedCount" ? "Failed" : "Pending"
          ]} contentStyle={{ borderRadius: 8, border: "1px solid #EAECF0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="completedVolume" fill="#12B76A" name="Completed Volume" radius={[2, 2, 0, 0]} />
          <Bar dataKey="failedCount"     fill="#F04438" name="Failed" radius={[2, 2, 0, 0]} />
          <Bar dataKey="pendingCount"    fill="#F59E0B" name="Pending" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TransactionVolumeChart({ refreshSignal }: Props) {
  const [data,     setData]     = useState<ChartPoint[]>([])
  const [loading,  setLoading]  = useState(true)
  const [days,     setDays]     = useState(14)
  const [groupBy,  setGroupBy]  = useState("day")
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`/api/admin/dashboard/charts?type=transactions&groupBy=${groupBy}&days=${days}`)
      .then((r) => r.json())
      .then((d: ChartPoint[]) => { if (mounted) { setData(d); setLoading(false) } })
      .catch(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [days, groupBy, refreshSignal])

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Transaction Volume</p>
            <p className="text-xs text-slate-400">Last {days} days — green=completed, red=failed</p>
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-300" />}
            <button
              onClick={() => setExpanded(true)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50"
              title="Expand chart"
            >
              <Expand className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {loading && data.length === 0 ? (
          <div className="flex h-28 items-center justify-center text-slate-300 text-sm">
            Loading…
          </div>
        ) : data.length === 0 ? (
          <div className="flex h-28 items-center justify-center text-slate-300 text-sm">
            No data
          </div>
        ) : (
          <ChartContent data={data} height={120} />
        )}
      </div>

      <Dialog open={expanded} onOpenChange={(o) => !o && setExpanded(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Volume</DialogTitle>
          </DialogHeader>
          <ExpandedChart
            data={data}
            days={days}
            setDays={(d) => { setDays(d); setExpanded(true) }}
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            loading={loading}
          />
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setExpanded(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
