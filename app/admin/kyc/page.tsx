import type { Metadata }  from "next"
import { auth }            from "@/lib/auth"
import { redirect }        from "next/navigation"
import { getKycQueue }     from "@/lib/services/kyc.service"
import { KycQueueClient }  from "@/components/admin/kyc/KycQueueClient"

export const metadata: Metadata = { title: "KYC Review" }
export const dynamic = "force-dynamic"

export default async function KycPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const result = await getKycQueue({ page: 1, limit: 20 }).catch(() => ({
    documents: [],
    total:     0,
    pages:     1,
    stats: {
      pendingCount:         0,
      pendingUsersCount:    0,
      approvedToday:        0,
      rejectedToday:        0,
      avgReviewTimeMinutes: 0,
      byDocType:            [],
    },
  }))

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <KycQueueClient
        initialData={result as Parameters<typeof KycQueueClient>[0]["initialData"]}
        initialStats={result.stats}
      />
    </div>
  )
}
