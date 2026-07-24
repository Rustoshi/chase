import type { Metadata }     from "next"
import { auth }               from "@/lib/auth"
import { redirect }           from "next/navigation"
import { getAuditLogs }       from "@/lib/services/auditLog.service"
import { getAuditLogStats }   from "@/lib/services/auditLog.service"
import { AuditLogClient }     from "@/components/admin/audit-log/AuditLogClient"

export const metadata: Metadata = { title: "Audit Log" }
export const dynamic = "force-dynamic"

export default async function AuditLogPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const [logsResult, stats] = await Promise.all([
    getAuditLogs({ page: 1, limit: 50 }).catch(() => ({ logs: [], total: 0, pages: 1 })),
    getAuditLogStats().catch(() => ({
      totalActions:    0,
      uniqueAdmins:    0,
      actionBreakdown: [],
      dailyActivity:   [],
      topAdmins:       [],
    })),
  ])

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <AuditLogClient
        initialLogs={logsResult.logs}
        initialTotal={logsResult.total}
        initialStats={stats}
      />
    </div>
  )
}
