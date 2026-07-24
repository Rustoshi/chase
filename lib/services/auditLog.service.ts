import mongoose, { type PipelineStage } from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import AuditLog          from "@/lib/models/AuditLog"
import User              from "@/lib/models/User"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuditLogItem {
  id:           string
  adminId:      string
  adminName:    string
  adminEmail:   string
  action:       string
  targetType?:  string
  targetId?:    string
  payload?:     Record<string, unknown>
  ipAddress?:   string
  userAgent?:   string
  createdAt:    string
}

export interface AuditLogStats {
  totalActions:     number
  uniqueAdmins:     number
  actionBreakdown:  Array<{ action: string; count: number }>
  dailyActivity:    Array<{ date: string; count: number }>
  topAdmins:        Array<{ adminId: string; adminName: string; actionCount: number }>
}

// ── getAuditLogs ──────────────────────────────────────────────────────────────

export async function getAuditLogs(params: {
  page?:        number
  limit?:       number
  adminId?:     string
  action?:      string
  targetType?:  string
  targetId?:    string
  dateFrom?:    string
  dateTo?:      string
  search?:      string
  sortOrder?:   string
}): Promise<{ logs: AuditLogItem[]; total: number; pages: number }> {
  await connectDB()

  const page  = Math.max(1, params.page  ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 50))

  const match: Record<string, unknown> = {}

  if (params.adminId) {
    try { match.adminId = new mongoose.Types.ObjectId(params.adminId) } catch { /* ignore */ }
  }
  if (params.action) {
    // prefix match: e.g. 'kyc.' matches all kyc.* actions
    if (params.action.endsWith(".")) {
      match.action = { $regex: `^${params.action.replace(".", "\\.")}`, $options: "i" }
    } else {
      match.action = params.action
    }
  }
  if (params.targetType) match.targetType = params.targetType
  if (params.targetId)   {
    try { match.targetId = new mongoose.Types.ObjectId(params.targetId) } catch { /* ignore */ }
  }
  if (params.dateFrom || params.dateTo) {
    const range: Record<string, Date> = {}
    if (params.dateFrom) range.$gte = new Date(params.dateFrom)
    if (params.dateTo)   range.$lte = new Date(params.dateTo)
    match.createdAt = range
  }
  if (params.search) {
    const re = { $regex: params.search, $options: "i" }
    match.$or = [{ action: re }, { adminEmail: re }]
  }

  const sortDir = params.sortOrder === "asc" ? 1 : -1

  const pipeline: PipelineStage[] = [
    { $match: match },
    { $sort: { createdAt: sortDir } },
    { $lookup: {
      from:         "users",
      localField:   "adminId",
      foreignField: "_id",
      as:           "adminArr",
    }},
    { $unwind: { path: "$adminArr", preserveNullAndEmptyArrays: true } },
    { $facet: {
      data: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: {
          adminId:    1,
          adminEmail: 1,
          adminName:  { $ifNull: [{ $concat: ["$adminArr.firstName", " ", "$adminArr.lastName"] }, "$adminEmail"] },
          action:     1,
          targetType: 1,
          targetId:   1,
          payload:    1,
          ipAddress:  1,
          userAgent:  1,
          createdAt:  1,
        }},
      ],
      total: [{ $count: "count" }],
    }},
  ]

  const result = await AuditLog.aggregate(pipeline)
  const rf     = result[0] as { data: Record<string, unknown>[]; total: { count: number }[] }
  const total  = rf.total?.[0]?.count ?? 0

  const logs: AuditLogItem[] = (rf.data ?? []).map((row) => ({
    id:          String(row._id),
    adminId:     String(row.adminId),
    adminName:   String(row.adminName ?? row.adminEmail),
    adminEmail:  String(row.adminEmail),
    action:      String(row.action),
    targetType:  row.targetType  ? String(row.targetType)  : undefined,
    targetId:    row.targetId    ? String(row.targetId)    : undefined,
    payload:     row.payload     as Record<string, unknown> | undefined,
    ipAddress:   row.ipAddress   ? String(row.ipAddress)   : undefined,
    userAgent:   row.userAgent   ? String(row.userAgent)   : undefined,
    createdAt:   row.createdAt   ? new Date(row.createdAt as string).toISOString() : "",
  }))

  return { logs, total, pages: Math.ceil(total / limit) }
}

// ── getAuditLogById ───────────────────────────────────────────────────────────

export async function getAuditLogById(id: string): Promise<Record<string, unknown> | null> {
  await connectDB()
  const doc = await AuditLog.findById(id)
    .populate({ path: "adminId", model: User, select: "firstName lastName email" })
    .lean()
  return doc ? (doc as unknown as Record<string, unknown>) : null
}

// ── getAuditLogStats ──────────────────────────────────────────────────────────

export async function getAuditLogStats(): Promise<AuditLogStats> {
  await connectDB()

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [facetResult, dailyResult, topAdminsResult] = await Promise.all([
    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      { $facet: {
        total:   [{ $count: "count" }],
        admins:  [{ $group: { _id: "$adminId" } }, { $count: "count" }],
        actions: [
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
          { $project: { action: "$_id", count: 1, _id: 0 } },
        ],
      }},
    ]),

    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      { $group: {
        _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, _id: 0 } },
    ]),

    AuditLog.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      { $group: { _id: "$adminId", actionCount: { $sum: 1 }, adminEmail: { $first: "$adminEmail" } } },
      { $sort: { actionCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "adminArr" } },
      { $unwind: { path: "$adminArr", preserveNullAndEmptyArrays: true } },
      { $project: {
        adminId:     "$_id",
        adminName:   { $ifNull: [{ $concat: ["$adminArr.firstName", " ", "$adminArr.lastName"] }, "$adminEmail"] },
        actionCount: 1,
        _id: 0,
      }},
    ]),
  ])

  const ff = facetResult[0] as Record<string, Record<string, number>[]>

  return {
    totalActions:    (ff.total?.[0]?.count  ?? 0),
    uniqueAdmins:    (ff.admins?.[0]?.count ?? 0),
    actionBreakdown: (ff.actions ?? []) as unknown as Array<{ action: string; count: number }>,
    dailyActivity:   (dailyResult ?? []) as Array<{ date: string; count: number }>,
    topAdmins:       (topAdminsResult ?? []) as Array<{ adminId: string; adminName: string; actionCount: number }>,
  }
}

// ── getDistinctActions ────────────────────────────────────────────────────────

export async function getDistinctActions(): Promise<string[]> {
  await connectDB()
  const actions = await AuditLog.distinct("action")
  return (actions as string[]).sort()
}
