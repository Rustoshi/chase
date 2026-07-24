import type { Metadata }        from "next"
import { DashboardClient }      from "@/components/admin/dashboard/DashboardClient"
import {
  getDashboardStats,
  getRecentTransactions,
  getRecentUsers,
  getPendingActions,
} from "@/lib/services/dashboard.service"

export const metadata: Metadata = { title: "Dashboard" }

// Revalidate every 60 s — SSR cache, not stale forever
export const revalidate = 60

export default async function DashboardPage() {
  const [stats, transactions, users, pending] = await Promise.all([
    getDashboardStats(),
    getRecentTransactions(10),
    getRecentUsers(10),
    getPendingActions(),
  ]).catch(() => {
    // individual service errors are caught inside each function;
    // this catches unexpected total failure
    return [
      {
        totalUsers: 0, newUsersThisWeek: 0, userDeltaPercent: null,
        totalAccounts: 0, fiatBalanceUSD: 0, btcBalanceBTC: 0,
        pendingDeposits: 0, pendingKyc: 0, pendingTransactions: 0,
        volume30dUSD: 0,
      },
      [],
      [],
      { pendingDeposits: 0, pendingKyc: 0, pendingTransactions: 0, suspendedUsers: 0 },
    ] as const
  })

  return (
    <DashboardClient
      stats={stats as Awaited<ReturnType<typeof getDashboardStats>>}
      transactions={transactions as Awaited<ReturnType<typeof getRecentTransactions>>}
      users={users as Awaited<ReturnType<typeof getRecentUsers>>}
      pending={pending as Awaited<ReturnType<typeof getPendingActions>>}
    />
  )
}
