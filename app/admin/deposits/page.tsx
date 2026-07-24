import { getDepositRequests } from "@/lib/services/deposit.service"
import { getDepositStats }    from "@/lib/services/deposit.service"
import { connectDB }          from "@/lib/db/connection"
import PaymentMethod          from "@/lib/models/PaymentMethod"
import { DepositRequestsClient } from "@/components/admin/deposits/DepositRequestsClient"

export const dynamic = "force-dynamic"

async function getMethods(): Promise<{ id: string; name: string }[]> {
  await connectDB()
  const docs = await PaymentMethod.find({ isEnabled: true }, "name").lean()
  return docs.map((m) => ({ id: String(m._id), name: String(m.name) }))
}

export default async function DepositsPage() {
  const [initialData, initialStats, methods] = await Promise.all([
    getDepositRequests({ status: "pending", limit: 20 }),
    getDepositStats(),
    getMethods(),
  ])

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <DepositRequestsClient
        initialStats={initialStats}
        initialData={initialData}
        methods={methods}
      />
    </div>
  )
}
