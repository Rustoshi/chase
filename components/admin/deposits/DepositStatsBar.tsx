"use client"

import { Clock, CheckCircle, XCircle, DollarSign, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DepositStats } from "@/lib/services/deposit.service"

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

interface MiniStatProps {
  label:   string
  value:   string
  icon:    React.ReactNode
  variant?: "neutral" | "green" | "amber" | "red"
}

function MiniStat({ label, value, icon, variant = "neutral" }: MiniStatProps) {
  const colorMap = {
    neutral: "text-slate-900",
    green:   "text-emerald-600",
    amber:   "text-amber-600",
    red:     "text-red-600",
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className={cn("text-lg font-bold leading-tight", colorMap[variant])}>{value}</p>
      </div>
    </div>
  )
}

interface Props {
  stats: DepositStats
}

function avgTimeVariant(mins: number): "green" | "amber" | "red" {
  if (mins < 60)  return "green"
  if (mins < 240) return "amber"
  return "red"
}

export function DepositStatsBar({ stats }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <MiniStat
          label="Pending"
          value={String(stats.pendingCount)}
          icon={<Clock className="h-4 w-4" />}
          variant={stats.pendingCount > 0 ? "amber" : "green"}
        />
        <MiniStat
          label="Pending value"
          value={fmtUSD(stats.pendingValue)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MiniStat
          label="Confirmed today"
          value={String(stats.confirmedToday)}
          icon={<CheckCircle className="h-4 w-4" />}
          variant="green"
        />
        <MiniStat
          label="Value today"
          value={fmtUSD(stats.confirmedValueToday)}
          icon={<DollarSign className="h-4 w-4" />}
          variant="green"
        />
        <MiniStat
          label="Avg confirm time"
          value={`${stats.averageConfirmTime.toFixed(0)} min`}
          icon={<Timer className="h-4 w-4" />}
          variant={avgTimeVariant(stats.averageConfirmTime)}
        />
      </div>

      {/* Alert banner */}
      {stats.pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          <Clock className="h-4 w-4 flex-shrink-0" />
          You have <strong>{stats.pendingCount}</strong> deposit request{stats.pendingCount !== 1 ? "s" : ""}{" "}
          awaiting review totalling <strong>{fmtUSD(stats.pendingValue)}</strong>.
        </div>
      )}

      {/* By method breakdown (only if pending) */}
      {stats.byPaymentMethod.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {stats.byPaymentMethod.map((m) => (
            <span key={m.methodName} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">
              <span className="font-medium">{m.methodName}</span>
              <span className="text-slate-400">·</span>
              <span className="font-semibold text-amber-700">{m.count}</span>
              <span className="text-slate-400">·</span>
              <span>{fmtUSD(m.value)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
