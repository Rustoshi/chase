"use client"

import { useState, useCallback } from "react"
import { DashboardRefresher }    from "./DashboardRefresher"
import { StatsGrid }             from "./StatsGrid"
import { VolumeChart }           from "./VolumeChart"
import { UserGrowthChart }       from "./UserGrowthChart"
import { RecentTransactionsTable } from "./RecentTransactionsTable"
import { RecentUsersTable }      from "./RecentUsersTable"
import { PendingActionsPanel }   from "./PendingActionsPanel"
import { PlatformBalanceCard }   from "./PlatformBalanceCard"
import { QuickActionsCard }      from "./QuickActionsCard"
import { AdminPageHeader }       from "@/components/admin/shared"
import { BANK_NAME }             from "@/lib/brand"
import type {
  DashboardStats,
  RecentTransaction,
  RecentUser,
  PendingActions,
} from "@/lib/services/dashboard.service"

interface Props {
  stats:        DashboardStats
  transactions: RecentTransaction[]
  users:        RecentUser[]
  pending:      PendingActions
}

type Tab = "transactions" | "users"

export function DashboardClient({ stats, transactions, users, pending }: Props) {
  const [refreshSignal, setRefreshSignal] = useState(0)
  const [activeTab,     setActiveTab]     = useState<Tab>("transactions")

  const handleRefresh = useCallback(() => {
    setRefreshSignal((s) => s + 1)
  }, [])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Header row ── */}
      <AdminPageHeader
        title="Dashboard"
        description={`Welcome back to the ${BANK_NAME} admin portal`}
        actions={<DashboardRefresher onRefresh={handleRefresh} />}
      />

      {/* ── Stats ── */}
      <StatsGrid stats={stats} />

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <VolumeChart   days={30} refreshSignal={refreshSignal} />
        <UserGrowthChart days={30} refreshSignal={refreshSignal} />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Transactions / Users tab panel — spans 2 cols */}
        <div className="xl:col-span-2">
          <div className="admin-card" style={{ overflow: "hidden" }}>
            {/* Tab bar */}
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 0, 
                borderBottom: "1px solid var(--admin-border)", 
                padding: "20px 24px 0" 
              }}
            >
              {(["transactions", "users"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    marginRight: 24,
                    paddingBottom: 12,
                    fontSize: 14,
                    fontWeight: 500,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "color 150ms",
                    color: activeTab === tab ? "var(--admin-accent)" : "var(--admin-text-muted)",
                    borderBottom: activeTab === tab ? "2px solid var(--admin-accent)" : "2px solid transparent",
                  }}
                >
                  {tab === "transactions" ? "Recent Transactions" : "Recent Users"}
                </button>
              ))}
            </div>

            <div style={{ padding: 24 }}>
              {activeTab === "transactions" ? (
                <RecentTransactionsTable initialData={transactions} />
              ) : (
                <RecentUsersTable initialData={users} />
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <PendingActionsPanel actions={pending} />
          <PlatformBalanceCard
            fiatUSD={stats.fiatBalanceUSD}
            btcBTC={stats.btcBalanceBTC}
          />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
