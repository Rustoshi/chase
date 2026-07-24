import type { Metadata }       from "next"
import { auth }                 from "@/lib/auth"
import { redirect }             from "next/navigation"
import { getCardApplications }  from "@/lib/services/card.service"
import { CardsClient }          from "@/components/admin/cards/CardsClient"

export const metadata: Metadata = { title: "Card Applications" }
export const dynamic = "force-dynamic"

export default async function CardsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const initialData = await getCardApplications({
    page: 1, limit: 20, sortOrder: "desc",
  }).catch(() => ({
    cards: [], total: 0, pages: 0,
    stats: {
      pendingCount: 0, approvedCount: 0, rejectedCount: 0,
      activeCount: 0, frozenCount: 0, blockedCount: 0, cancelledCount: 0,
      totalCreditIssued: 0,
    },
  }))

  return (
    <div className="px-6 py-8 max-w-screen-2xl mx-auto">
      <CardsClient initialData={initialData} />
    </div>
  )
}
