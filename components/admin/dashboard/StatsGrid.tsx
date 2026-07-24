"use client"

import { Users, Wallet, Clock, BarChart3, Bitcoin, CreditCard, FileSearch, AlertCircle } from "lucide-react"
import { StatCard } from "@/components/admin/StatCard"
import type { DashboardStats } from "@/lib/services/dashboard.service"

const fmt = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n)

const fmtBtc = (n: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 8 }).format(n) + " BTC"

const fmtNum = (n: number) =>
  new Intl.NumberFormat("en-US").format(n)

const fmtDelta = (pct: number | null): { text: string; positive: boolean } | undefined => {
  if (pct === null) return undefined
  return {
    text:     `${Math.abs(pct).toFixed(1)}% vs last week`,
    positive: pct >= 0,
  }
}

interface Props {
  stats: DashboardStats
}

export function StatsGrid({ stats }: Props) {
  const delta = fmtDelta(stats.userDeltaPercent)

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {/* Row 1 */}
      <StatCard
        label="Total Users"
        value={fmtNum(stats.totalUsers)}
        delta={delta?.text}
        deltaPositive={delta?.positive}
        icon={<Users className="h-5 w-5" />}
      />
      <StatCard
        label="Total Accounts"
        value={fmtNum(stats.totalAccounts)}
        icon={<Wallet className="h-5 w-5" />}
      />
      <StatCard
        label="Platform Fiat Balance"
        value={fmt(stats.fiatBalanceUSD)}
        icon={<CreditCard className="h-5 w-5" />}
      />
      <StatCard
        label="Platform BTC Balance"
        value={fmtBtc(stats.btcBalanceBTC)}
        icon={<Bitcoin className="h-5 w-5" />}
      />

      {/* Row 2 */}
      <StatCard
        label="30-Day Volume"
        value={fmt(stats.volume30dUSD)}
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <StatCard
        label="Pending Deposits"
        value={fmtNum(stats.pendingDeposits)}
        deltaVariant={stats.pendingDeposits > 0 ? "warning" : undefined}
        icon={<Clock className="h-5 w-5" />}
      />
      <StatCard
        label="KYC Reviews Pending"
        value={fmtNum(stats.pendingKyc)}
        deltaVariant={stats.pendingKyc > 0 ? "warning" : undefined}
        icon={<FileSearch className="h-5 w-5" />}
      />
      <StatCard
        label="Pending Transactions"
        value={fmtNum(stats.pendingTransactions)}
        deltaVariant={stats.pendingTransactions > 0 ? "warning" : undefined}
        icon={<AlertCircle className="h-5 w-5" />}
      />
    </div>
  )
}
