import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import KycDocument       from "@/lib/models/KycDocument"
import User              from "@/lib/models/User"
import Account           from "@/lib/models/Account"
import { createAuditLog } from "@/lib/services/auth.service"
import { notifyUser }    from "@/lib/services/deposit.service"
import { sendKycApprovedEmail, sendKycRejectedEmail } from "@/lib/email"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KycQueueItem {
  userId:        string
  userName:      string
  userEmail:     string
  userKycStatus: string
  userKycTier:   number
  userCreatedAt: string
  documents:     Record<string, unknown>[]
  pendingCount:  number
  lastSubmitted: string
  isComplete:    boolean
}

export interface GetKycQueueParams {
  page?:      number
  limit?:     number
  status?:    string   // User KYC status: pending, verified, rejected, unverified
  docStatus?: string   // Document status: pending, approved, rejected
  docType?:   string
  dateFrom?:  string
  dateTo?:    string
  sortBy?:    string
  sortOrder?: string
}

export interface KycStats {
  pendingCount:          number
  pendingUsersCount:     number
  approvedToday:         number
  rejectedToday:         number
  avgReviewTimeMinutes:  number
  byDocType:             Array<{ docType: string; pendingCount: number }>
}

export interface KycQueueResult {
  documents: KycQueueItem[]
  total:     number
  pages:     number
  stats:     KycStats
}

export interface KycUserDetail {
  user:             Record<string, unknown>
  documents:        Record<string, unknown>[]
  accounts:         Record<string, unknown>[]
  requiredDocTypes: string[]
  completionStatus: {
    tier2Complete:    boolean
    tier3Complete:    boolean
    missingDocTypes:  string[]
  }
}

// Required doc types per tier
const TIER2_ID_TYPES  = ["passport", "drivers_license", "national_id"]
const TIER2_TYPES     = [...TIER2_ID_TYPES, "selfie"]
const TIER3_TYPES     = [...TIER2_TYPES, "address_proof"]

// ── Helpers ───────────────────────────────────────────────────────────────────

// Status priority for sorting: pending first
function statusPriority(s: string): number {
  if (s === "pending") return 0
  if (s === "rejected") return 1
  return 2
}

function requiredDocsForTier(tier: number): string[] {
  if (tier >= 3) return TIER3_TYPES
  if (tier >= 2) return TIER2_TYPES
  return []
}

// ── getKycQueue ───────────────────────────────────────────────────────────────

export async function getKycQueue(params: {
  page?: number
  limit?: number
  status?: string
  docType?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: string
}): Promise<KycQueueResult> {
  await connectDB()

  const page  = Math.max(1, params.page  ?? 1)
  const limit = Math.min(100, Math.max(1, params.limit ?? 20))

  // Build document-level match (for docType filter only, not status)
  const docMatch: Record<string, unknown> = {}
  if (params.docType) docMatch.docType = params.docType
  if (params.dateFrom || params.dateTo) {
    const range: Record<string, Date> = {}
    if (params.dateFrom) range.$gte = new Date(params.dateFrom)
    if (params.dateTo)   range.$lte = new Date(params.dateTo)
    docMatch.submittedAt = range
  }

  // Stats (run in parallel with main query)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [statsResult, mainDocs] = await Promise.all([
    // Stats aggregation
    KycDocument.aggregate([
      { $facet: {
        pending:      [{ $match: { status: "pending" } }, { $count: "count" }],
        pendingUsers: [{ $match: { status: "pending" } }, { $group: { _id: "$userId" } }, { $count: "count" }],
        approvedToday:[{ $match: { status: "approved", reviewedAt: { $gte: today } } }, { $count: "count" }],
        rejectedToday:[{ $match: { status: "rejected", reviewedAt: { $gte: today } } }, { $count: "count" }],
        avgReview:    [
          { $match: { status: { $in: ["approved", "rejected"] }, reviewedAt: { $gte: sevenDaysAgo }, submittedAt: { $exists: true } } },
          { $project: { diffMs: { $subtract: ["$reviewedAt", "$submittedAt"] } } },
          { $group: { _id: null, avg: { $avg: "$diffMs" } } },
        ],
        byDocType: [
          { $match: { status: "pending" } },
          { $group: { _id: "$docType", pendingCount: { $sum: 1 } } },
          { $project: { docType: "$_id", pendingCount: 1, _id: 0 } },
        ],
      }},
    ]),

    // Main: group by userId, then paginate
    KycDocument.aggregate([
      { $match: docMatch },
      { $sort: { submittedAt: -1 } },
      { $group: {
        _id:           "$userId",
        documents:     { $push: "$$ROOT" },
        pendingCount:  { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        lastSubmitted: { $max: "$submittedAt" },
      }},
      // Convert grouped userId to ObjectId for user lookup (handles both string and ObjectId)
      { $addFields: {
        userIdForLookup: { $cond: {
          if: { $eq: [{ $type: "$_id" }, "string"] },
          then: { $toObjectId: "$_id" },
          else: "$_id"
        }}
      }},
      { $lookup: {
        from:         "users",
        localField:   "userIdForLookup",
        foreignField: "_id",
        as:           "userArr",
      }},
      { $unwind: "$userArr" },
      { $project: {
        userId:        "$_id",
        userName:      { $concat: ["$userArr.firstName", " ", "$userArr.lastName"] },
        userEmail:     "$userArr.email",
        userKycStatus: "$userArr.kycStatus",
        userKycTier:   "$userArr.kycTier",
        userCreatedAt: "$userArr.createdAt",
        documents:     1,
        pendingCount:  1,
        lastSubmitted: 1,
      }},
      // Filter by user KYC status if specified
      ...(params.status ? [{ $match: { userKycStatus: params.status } }] : []),
      { $facet: {
        data:  [
          { $sort: params.sortBy === "documents" ? { pendingCount: -1 } : params.sortOrder === "asc" ? { lastSubmitted: 1 } : { lastSubmitted: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
        total: [{ $count: "count" }],
      }},
    ]),
  ])

  const sf     = statsResult[0] as Record<string, unknown[]>
  const stats: KycStats = {
    pendingCount:         ((sf.pending?.[0] as Record<string, number>)?.count         ?? 0),
    pendingUsersCount:    ((sf.pendingUsers?.[0] as Record<string, number>)?.count    ?? 0),
    approvedToday:        ((sf.approvedToday?.[0] as Record<string, number>)?.count   ?? 0),
    rejectedToday:        ((sf.rejectedToday?.[0] as Record<string, number>)?.count   ?? 0),
    avgReviewTimeMinutes: ((sf.avgReview?.[0] as Record<string, number>)?.avg ?? 0) / 60000,
    byDocType:            (sf.byDocType ?? []) as Array<{ docType: string; pendingCount: number }>,
  }

  const mf    = mainDocs[0] as { data: Record<string, unknown>[]; total: { count: number }[] }
  const total = mf.total?.[0]?.count ?? 0

  const items: KycQueueItem[] = (mf.data ?? []).map((row) => {
    const docs        = (row.documents as Record<string, unknown>[])
    // Ensure userId is a plain string (handle ObjectId objects)
    const rawUserId   = row.userId
    const userId      = typeof rawUserId === 'object' && rawUserId !== null && '_bsontype' in (rawUserId as object)
      ? String(rawUserId)
      : String(rawUserId)
    const tier        = Number(row.userKycTier ?? 1)
    const required    = requiredDocsForTier(tier)
    // isComplete: all required types have at least one approved doc
    const approvedTypes = docs.filter((d) => d.status === "approved").map((d) => String(d.docType))
    const isComplete  = required.length > 0 && (
      // needs at least one ID type
      TIER2_ID_TYPES.some((t) => approvedTypes.includes(t)) &&
      approvedTypes.includes("selfie") &&
      (tier < 3 || approvedTypes.includes("address_proof"))
    )
    return {
      userId,
      userName:      String(row.userName),
      userEmail:     String(row.userEmail),
      userKycStatus: String(row.userKycStatus),
      userKycTier:   tier,
      userCreatedAt: row.userCreatedAt ? new Date(row.userCreatedAt as string).toISOString() : "",
      // Serialize to plain fields only — omit ObjectIds, __v, and sensitive data
      // (e.g. ssn) so the payload is safe to cross the RSC → client boundary.
      documents:     docs.map((d) => ({
        _id:         String(d._id),
        id:          String(d._id),
        docType:     String(d.docType),
        status:      String(d.status),
        submittedAt: d.submittedAt ? new Date(d.submittedAt as string).toISOString() : "",
      })),
      pendingCount:  Number(row.pendingCount),
      lastSubmitted: row.lastSubmitted ? new Date(row.lastSubmitted as string).toISOString() : "",
      isComplete,
    }
  })

  return { documents: items, total, pages: Math.ceil(total / limit), stats }
}

// ── getKycDocumentsByUser ─────────────────────────────────────────────────────

export async function getKycDocumentsByUser(userId: string): Promise<KycUserDetail> {
  await connectDB()
  const uid = new mongoose.Types.ObjectId(userId)

  console.log("[KYC Service] Looking up documents for userId:", userId, "ObjectId:", uid.toString())

  // Query documents - try multiple formats to handle legacy data
  const [user, accountsResult] = await Promise.all([
    User.findById(uid).lean(),
    Account.find({ userId: uid }).lean(),
  ])

  // Query documents separately with flexible matching
  let documents = await KycDocument.find({ userId: uid }).sort({ submittedAt: -1 }).lean()
  
  // If no documents found with ObjectId, try string match
  if (documents.length === 0) {
    documents = await KycDocument.find({ userId: userId }).sort({ submittedAt: -1 }).lean()
  }
  
  const accounts = accountsResult

  console.log("[KYC Service] Found user:", !!user, "documents:", documents.length)

  // Debug: check what userIds exist in documents
  if (documents.length === 0) {
    const allDocs = await KycDocument.find({}).limit(5).lean()
    console.log("[KYC Service] Sample documents userIds:", allDocs.map(d => ({ id: String(d._id), userId: d.userId, type: typeof d.userId })))
  }

  if (!user) throw new Error("User not found")

  const tier     = (user as { kycTier?: number }).kycTier ?? 1
  const required = requiredDocsForTier(tier)

  const approvedTypes = documents
    .filter((d) => d.status === "approved")
    .map((d) => d.docType as string)

  const tier2Complete = TIER2_ID_TYPES.some((t) => approvedTypes.includes(t)) && approvedTypes.includes("selfie")
  const tier3Complete = tier2Complete && approvedTypes.includes("address_proof")

  const missingDocTypes = required.filter((t) => {
    if (TIER2_ID_TYPES.includes(t)) return !TIER2_ID_TYPES.some((id) => approvedTypes.includes(id))
    return !approvedTypes.includes(t)
  })

  // Serialize documents with proper _id as string and include personal info
  const serializedDocs = documents.map((d) => ({
    ...d,
    _id: String(d._id),
    id: String(d._id),
    userId: String(d.userId),
    dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString() : undefined,
    address: d.address ? {
      street:  d.address.street  || undefined,
      city:    d.address.city    || undefined,
      state:   d.address.state   || undefined,
      zip:     d.address.zip     || undefined,
      country: d.address.country || undefined,
    } : undefined,
  }))

  return {
    user:             user as unknown as Record<string, unknown>,
    documents:        serializedDocs as unknown as Record<string, unknown>[],
    accounts:         accounts.map((a) => a as unknown as Record<string, unknown>),
    requiredDocTypes: required,
    completionStatus: { tier2Complete, tier3Complete, missingDocTypes },
  }
}

// ── approveKycDocument ────────────────────────────────────────────────────────

export async function approveKycDocument(
  documentId: string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ document: Record<string, unknown>; userKycStatusUpdated: boolean; userProfileUpdated: boolean }> {
  await connectDB()

  const doc = await KycDocument.findById(documentId)
  if (!doc) throw new Error("Document not found")
  if (doc.status !== "pending") throw new Error("Document is not pending")

  doc.status     = "approved"
  doc.reviewedBy = new mongoose.Types.ObjectId(adminId)
  doc.reviewedAt = new Date()
  await doc.save()

  const user = await User.findById(doc.userId)
  if (!user) throw new Error("User not found")

  let userKycStatusUpdated = false
  let userProfileUpdated = false

  // If this is an ID document with address/DOB, update user profile
  const isIdDocument = TIER2_ID_TYPES.includes(doc.docType as string)
  if (isIdDocument) {
    const updates: Record<string, unknown> = {}
    
    // Update date of birth if provided in KYC document
    if (doc.dateOfBirth && !user.dateOfBirth) {
      updates.dateOfBirth = doc.dateOfBirth
    }

    // Save SSN (US customers) if provided and not already on the profile
    if (doc.ssn && !user.ssn) {
      updates.ssn = doc.ssn
    }
    
    // Update address if provided in KYC document
    if (doc.address && (doc.address.street || doc.address.city || doc.address.country)) {
      // Only update if user doesn't have complete address
      const userHasAddress = user.address?.street && user.address?.city && user.address?.country
      if (!userHasAddress) {
        updates.address = {
          street:  doc.address.street  || user.address?.street  || "",
          city:    doc.address.city    || user.address?.city    || "",
          state:   doc.address.state   || user.address?.state   || "",
          zip:     doc.address.zip     || user.address?.zip     || "",
          country: doc.address.country || user.address?.country || "",
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(doc.userId, updates)
      userProfileUpdated = true
      console.log("[KYC Approve] Updated user profile with KYC data:", Object.keys(updates))
    }
  }

  // Check all approved docs for this user (handle both string and ObjectId userId)
  const userIdStr = String(doc.userId)
  const userIdObj = new mongoose.Types.ObjectId(userIdStr)
  const allDocs   = await KycDocument.find({ 
    $or: [{ userId: userIdObj }, { userId: userIdStr }], 
    status: "approved" 
  })
  const approved   = allDocs.map((d) => d.docType as string)
  const hasId      = TIER2_ID_TYPES.some((t) => approved.includes(t))
  const hasSelfie  = approved.includes("selfie")
  const hasAddress = approved.includes("address_proof")

  console.log("[KYC Approve] User:", userIdStr, "Approved docs:", approved, "hasId:", hasId, "hasSelfie:", hasSelfie, "hasAddress:", hasAddress)

  if (hasId && hasSelfie) {
    if (user.kycStatus !== "verified") {
      user.kycStatus = "verified"
      userKycStatusUpdated = true
    }
    user.kycTier = hasAddress ? 3 : 2
    await user.save()
    console.log("[KYC Approve] User status updated to verified, tier:", user.kycTier)
  }

  await createAuditLog(adminId, adminEmail, "kyc.document_approve", "KycDocument", documentId, { 
    docType: doc.docType, 
    userId: String(doc.userId),
    profileUpdated: userProfileUpdated,
  }, req)

  if (userKycStatusUpdated) {
    await createAuditLog(adminId, adminEmail, "kyc.user_verified", "User", String(doc.userId), { kycTier: user.kycTier }, req)
  }

  const docType = doc.docType as string
  await notifyUser(String(doc.userId), "kyc", "Document approved", `Your ${docType.replace("_", " ")} has been approved.`)

  if (userKycStatusUpdated) {
    await notifyUser(String(doc.userId), "kyc", "Identity verified", "Your identity has been verified. You now have full access to all platform features.")
    if (user.email) {
      // Fire-and-forget approval email (never blocks the approval flow)
      sendKycApprovedEmail(user.email, user.firstName || "there", user.kycTier).catch(() => {})
    }
  }

  return { document: doc.toObject() as unknown as Record<string, unknown>, userKycStatusUpdated, userProfileUpdated }
}

// ── rejectKycDocument ─────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  passport:        "Passport",
  drivers_license: "Driver's License",
  national_id:     "National ID",
  selfie:          "Selfie",
  address_proof:   "Proof of Address",
  utility_bill:    "Utility Bill",
  ssn_proof:       "SSN Proof",
}

function docTypeLabel(t: string): string {
  return DOC_TYPE_LABELS[t] ?? t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function rejectKycDocument(
  documentId: string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request,
  options?:   { sendEmail?: boolean }
): Promise<Record<string, unknown>> {
  await connectDB()

  if (!reason?.trim()) throw new Error("Rejection reason is required")

  const doc = await KycDocument.findById(documentId)
  if (!doc) throw new Error("Document not found")
  if (doc.status !== "pending") throw new Error("Document is not pending")

  doc.status     = "rejected"
  doc.reviewNote = reason.trim()
  doc.reviewedBy = new mongoose.Types.ObjectId(adminId)
  doc.reviewedAt = new Date()
  await doc.save()

  const rejectedUser = await User.findByIdAndUpdate(doc.userId, { kycStatus: "rejected" })
    .select("email firstName")
    .lean() as { email?: string; firstName?: string } | null

  await createAuditLog(adminId, adminEmail, "kyc.document_reject", "KycDocument", documentId, { docType: doc.docType, reason, userId: String(doc.userId) }, req)

  const docType = doc.docType as string
  await notifyUser(
    String(doc.userId),
    "kyc",
    "Document rejected",
    `Your ${docTypeLabel(docType)} was not accepted. Reason: ${reason.trim()}. Please resubmit.`
  )

  // Email the client (suppressed for bulk rejects — the caller sends one summary)
  if (options?.sendEmail !== false && rejectedUser?.email) {
    sendKycRejectedEmail(rejectedUser.email, rejectedUser.firstName || "there", reason.trim(), docTypeLabel(docType)).catch(() => {})
  }

  return doc.toObject() as unknown as Record<string, unknown>
}

// ── bulkApproveKycDocuments ───────────────────────────────────────────────────

export async function bulkApproveKycDocuments(
  documentIds: string[],
  adminId:     string,
  adminEmail:  string,
  req?:        Request
): Promise<{ approved: number; errors: number }> {
  let approved = 0
  let errors   = 0
  for (const id of documentIds) {
    try {
      await approveKycDocument(id, adminId, adminEmail, req)
      approved++
    } catch {
      errors++
    }
  }
  return { approved, errors }
}

// ── bulkRejectKycDocuments ────────────────────────────────────────────────────

export async function bulkRejectKycDocuments(
  documentIds: string[],
  reason:      string,
  adminId:     string,
  adminEmail:  string,
  req?:        Request
): Promise<{ rejected: number; errors: number }> {
  if (!reason?.trim()) throw new Error("Rejection reason is required")
  let rejected = 0
  let errors   = 0
  const affectedUserIds = new Set<string>()
  for (const id of documentIds) {
    try {
      const doc = await rejectKycDocument(id, reason, adminId, adminEmail, req, { sendEmail: false })
      rejected++
      if (doc?.userId) affectedUserIds.add(String(doc.userId))
    } catch {
      errors++
    }
  }

  // Send one summary rejection email per affected user (instead of one per doc)
  for (const uid of affectedUserIds) {
    const u = await User.findById(uid).select("email firstName").lean() as { email?: string; firstName?: string } | null
    if (u?.email) {
      sendKycRejectedEmail(u.email, u.firstName || "there", reason.trim()).catch(() => {})
    }
  }

  return { rejected, errors }
}

// ── requestAdditionalDocuments ────────────────────────────────────────────────

export async function requestAdditionalDocuments(
  userId:     string,
  docTypes:   string[],
  message:    string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()

  await User.findByIdAndUpdate(userId, { kycStatus: "pending" })

  await createAuditLog(adminId, adminEmail, "kyc.additional_requested", "User", userId, { docTypes, message }, req)

  await notifyUser(
    userId,
    "kyc",
    "Additional documents required",
    `${message}\n\nRequired documents: ${docTypes.join(", ")}`
  )
}

// ── overrideKycStatus ─────────────────────────────────────────────────────────

export async function overrideKycStatus(
  userId:     string,
  kycStatus:  string,
  kycTier:    number,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) throw new Error("User not found")

  const before = { kycStatus: user.kycStatus, kycTier: user.kycTier }

  user.kycStatus = kycStatus as "unverified" | "pending" | "verified" | "rejected"
  user.kycTier   = kycTier as 1 | 2 | 3
  await user.save()

  await createAuditLog(adminId, adminEmail, "kyc.status_override", "User", userId, { before, after: { kycStatus, kycTier }, reason }, req)

  const bodyMap: Record<string, string> = {
    verified:   "Your identity has been manually verified by our compliance team.",
    rejected:   `Your KYC verification was declined. Reason: ${reason}`,
    pending:    "Your account is under manual review.",
    unverified: "Your KYC status has been reset.",
  }
  await notifyUser(userId, "kyc", "KYC status updated", bodyMap[kycStatus] ?? "Your KYC status has been updated.")

  // Email the client when they're manually verified
  if (kycStatus === "verified" && before.kycStatus !== "verified" && user.email) {
    sendKycApprovedEmail(user.email, user.firstName || "there", user.kycTier).catch(() => {})
  }
  // Email the client when their verification is manually declined
  if (kycStatus === "rejected" && before.kycStatus !== "rejected" && user.email) {
    sendKycRejectedEmail(user.email, user.firstName || "there", reason?.trim() || "Your verification could not be approved.").catch(() => {})
  }

  return user.toObject() as unknown as Record<string, unknown>
}

// ── adminUploadAndVerifyKyc ───────────────────────────────────────────────────
// Lets an admin complete a client's KYC on their behalf: uploads (already
// hosted) documents as pre-approved records, fills the user's profile, and marks
// the account verified — all in one action.

export interface AdminVerifyKycInput {
  idDocType:            "passport" | "drivers_license" | "national_id"
  idDocUrl:             string
  idDocPublicId?:       string
  selfieUrl?:           string
  selfiePublicId?:      string
  addressProofUrl?:     string
  addressProofPublicId?: string
  dateOfBirth?:         string
  ssn?:                 string
  address?: { street?: string; city?: string; state?: string; zip?: string; country?: string }
  tier?:                number
}

export async function adminUploadAndVerifyKyc(
  userId:     string,
  input:      AdminVerifyKycInput,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ success: true; kycTier: number }> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) throw new Error("User not found")
  if (!input.idDocUrl) throw new Error("A photo ID document is required")
  if (!TIER2_ID_TYPES.includes(input.idDocType)) throw new Error("Invalid ID document type")

  const now       = new Date()
  const adminObjId = new mongoose.Types.ObjectId(adminId)
  const dob       = input.dateOfBirth ? new Date(input.dateOfBirth) : undefined
  if (dob && isNaN(dob.getTime())) throw new Error("Invalid date of birth")
  const address   = input.address && Object.values(input.address).some((v) => v && String(v).trim())
    ? input.address
    : undefined

  const base = {
    userId: user._id, status: "approved" as const, reviewedBy: adminObjId,
    submittedAt: now, reviewedAt: now, reviewNote: "Uploaded & verified by admin",
  }

  const ssn = input.ssn && input.ssn.trim() ? input.ssn.trim() : undefined

  const docsToCreate: Record<string, unknown>[] = [
    { ...base, docType: input.idDocType, docUrl: input.idDocUrl, docPublicId: input.idDocPublicId, dateOfBirth: dob, ssn, address },
  ]
  if (input.selfieUrl) {
    docsToCreate.push({ ...base, docType: "selfie", docUrl: input.selfieUrl, docPublicId: input.selfiePublicId })
  }
  if (input.addressProofUrl) {
    docsToCreate.push({ ...base, docType: "address_proof", docUrl: input.addressProofUrl, docPublicId: input.addressProofPublicId })
  }

  await KycDocument.insertMany(docsToCreate)

  // Fill in the user's profile from the supplied info.
  const profileUpdates: Record<string, unknown> = {}
  if (dob) profileUpdates.dateOfBirth = dob
  if (ssn) profileUpdates.ssn = ssn
  if (address) {
    profileUpdates.address = {
      street:  address.street  || user.address?.street  || "",
      city:    address.city    || user.address?.city    || "",
      state:   address.state   || user.address?.state   || "",
      zip:     address.zip     || user.address?.zip     || "",
      country: address.country || user.address?.country || "",
    }
  }

  const tier = Math.min(3, Math.max(1, input.tier ?? (input.addressProofUrl ? 3 : 2)))
  profileUpdates.kycStatus = "verified"
  profileUpdates.kycTier   = tier
  await User.findByIdAndUpdate(userId, profileUpdates)

  await createAuditLog(adminId, adminEmail, "kyc.admin_verify", "User", userId, {
    docTypes: docsToCreate.map((d) => d.docType),
    tier,
    profileUpdated: Object.keys(profileUpdates).filter((k) => k !== "kycStatus" && k !== "kycTier"),
  }, req)

  await notifyUser(
    userId, "kyc", "Identity verified",
    "Your identity has been verified by our compliance team. You now have full access to all platform features."
  )
  if (user.email) {
    sendKycApprovedEmail(user.email, user.firstName || "there", tier).catch(() => {})
  }

  return { success: true, kycTier: tier }
}
