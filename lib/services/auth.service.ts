import { connectDB } from "@/lib/db/connection"
import AuditLog from "@/lib/models/AuditLog"

/**
 * Append an immutable audit log entry. Used by every admin action.
 * Never throws — a failed write must not break the originating operation.
 */
export async function createAuditLog(
  adminId:     string,
  adminEmail:  string,
  action:      string,
  targetType?: string,
  targetId?:   string,
  payload?:    Record<string, unknown>,
  req?:        Request | { headers: { get(name: string): string | null } }
): Promise<void> {
  try {
    await connectDB()

    await AuditLog.create({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      payload,
      ipAddress: req ? extractIP(req)        : undefined,
      userAgent: req ? extractUA(req)        : undefined,
    })
  } catch (err) {
    // Intentionally swallowed — audit failure must never surface to the user
    console.error("[AuditLog] write failed:", err)
  }
}

function extractIP(req: { headers: { get(name: string): string | null } }): string | undefined {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip") ?? undefined
}

function extractUA(req: { headers: { get(name: string): string | null } }): string | undefined {
  return req.headers.get("user-agent") ?? undefined
}
