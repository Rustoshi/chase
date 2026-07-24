import type { Metadata }  from "next"
import { auth }            from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { getCardById }     from "@/lib/services/card.service"
import { AdminCardDetailClient } from "@/components/admin/cards/AdminCardDetailClient"

export const metadata: Metadata = { title: "Manage Card" }
export const dynamic = "force-dynamic"

export default async function AdminCardDetailPage({ params }: { params: Promise<{ cardId: string }> }) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const { cardId } = await params
  const card = await getCardById(cardId)
  if (!card) notFound()

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 max-w-3xl mx-auto">
      <AdminCardDetailClient card={card} />
    </div>
  )
}
