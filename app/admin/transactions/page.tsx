import type { Metadata }    from "next"
import { auth }             from "@/lib/auth"
import { redirect }         from "next/navigation"
import { getTransactions }  from "@/lib/services/transaction.service"
import { TransactionsClient } from "@/components/admin/transactions/TransactionsClient"

export const metadata: Metadata = { title: "Transactions" }
export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const initialData = await getTransactions({
    page: 1, limit: 25, sortBy: "createdAt", sortOrder: "desc",
  }).catch(() => ({ transactions: [], total: 0, pages: 0, summary: {
    totalCount: 0, totalVolume: 0, completedCount: 0, completedVolume: 0,
    pendingCount: 0, failedCount: 0, reversedCount: 0,
  }}))

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-screen-2xl mx-auto">
      <TransactionsClient initialData={initialData} />
    </div>
  )
}
