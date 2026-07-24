import type { Metadata }        from "next"
import { auth }                  from "@/lib/auth"
import { redirect }              from "next/navigation"
import { getLoanApplications }   from "@/lib/services/loan.service"
import { LoansClient }           from "@/components/admin/loans/LoansClient"

export const metadata: Metadata = { title: "Loan Applications" }
export const dynamic = "force-dynamic"

export default async function LoansPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const initialData = await getLoanApplications({
    page: 1, limit: 20, status: "pending", sortOrder: "desc",
  }).catch(() => ({
    loans: [], total: 0, pages: 0,
    stats: {
      pendingCount: 0, approvedCount: 0, rejectedCount: 0,
      activeCount: 0, closedCount: 0, defaultedCount: 0,
      totalDisbursed: 0, totalOutstanding: 0,
    },
  }))

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-screen-2xl mx-auto pb-24 sm:pb-12">
      <LoansClient initialData={initialData} />
    </div>
  )
}
