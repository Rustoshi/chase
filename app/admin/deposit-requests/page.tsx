import type { Metadata }          from "next"
import { auth }                   from "@/lib/auth"
import { redirect }               from "next/navigation"
import { getDepositRequests, getDepositStats } from "@/lib/services/deposit.service"
import { connectDB }              from "@/lib/db/connection"
import PaymentMethod              from "@/lib/models/PaymentMethod"
import { DepositRequestsClient }  from "@/components/admin/deposits/DepositRequestsClient"

export const metadata: Metadata = { title: "Deposit Requests" }
export const revalidate = 0

async function getMethods(): Promise<{ id: string; name: string }[]> {
  await connectDB()
  const docs = await PaymentMethod.find({ isEnabled: true }, "name").lean()
  return docs.map((m) => ({ id: String(m._id), name: String(m.name) }))
}

export default async function DepositRequestsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const [initialData, initialStats, methods] = await Promise.all([
    getDepositRequests({ page: 1, limit: 20, status: "pending" }).catch(() => ({
      requests: [], total: 0, pages: 0,
    })),
    getDepositStats().catch(() => ({
      pendingCount: 0, pendingValue: 0,
      confirmedToday: 0, confirmedValueToday: 0,
      rejectedToday: 0, averageConfirmTime: 0,
      byPaymentMethod: [],
    })),
    getMethods().catch(() => []),
  ])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <DepositRequestsClient
        initialData={initialData}
        initialStats={initialStats}
        methods={methods}
      />
    </div>
  )
}
