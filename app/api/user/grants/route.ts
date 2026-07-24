import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import GrantApplication from "@/lib/models/GrantApplication"
import Account from "@/lib/models/Account"
import crypto from "crypto"

const VALID_GRANT_TYPES = ["personal", "business", "education", "housing", "medical", "emergency"]

const GRANT_TYPE_LABELS: Record<string, string> = {
  personal:  "Personal",
  business:  "Business",
  education: "Education",
  housing:   "Housing",
  medical:   "Medical",
  emergency: "Emergency",
}

function generateRef(): string {
  const year = new Date().getFullYear()
  const id = crypto.randomBytes(4).toString("hex").toUpperCase()
  return `GRT-${year}-${id}`
}

// ── GET — list user's grant applications ─────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const grants = await GrantApplication.find({ userId: session.user.id })
      .sort({ appliedAt: -1 })
      .lean()

    const serialized = grants.map((g: Record<string, unknown>) => ({
      _id:             String(g._id),
      grantType:       g.grantType,
      grantTypeLabel:  GRANT_TYPE_LABELS[g.grantType as string] || g.grantType,
      amount:          g.amount,
      approvedAmount:  g.approvedAmount || null,
      purpose:         g.purpose,
      status:          g.status,
      referenceNumber: g.referenceNumber,
      documents:       g.documents || [],
      adminNote:       g.adminNote || null,
      rejectedReason:  g.rejectedReason || null,
      appliedAt:       (g.appliedAt as Date)?.toISOString(),
      reviewedAt:      (g.reviewedAt as Date)?.toISOString() || null,
      disbursedAt:     (g.disbursedAt as Date)?.toISOString() || null,
    }))

    return NextResponse.json({ grants: serialized })
  } catch (err) {
    console.error("[GET /api/user/grants]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST — submit a grant application ────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { grantType, amount, purpose, supportingInfo, documents, depositAccountId } = body

    // Validate required fields
    if (!grantType || !amount || !purpose || !depositAccountId)
      return NextResponse.json({ error: "Grant type, amount, purpose, and deposit account are required" }, { status: 400 })

    if (!VALID_GRANT_TYPES.includes(grantType))
      return NextResponse.json({ error: "Invalid grant type" }, { status: 400 })

    if (typeof amount !== "number" || amount <= 0)
      return NextResponse.json({ error: "Amount must be greater than zero" }, { status: 400 })

    if (typeof purpose !== "string" || purpose.trim().length < 10)
      return NextResponse.json({ error: "Please provide a detailed purpose (at least 10 characters)" }, { status: 400 })

    await connectDB()

    // Verify deposit account belongs to user (can be fiat or bitcoin)
    const account = await Account.findOne({
      _id: depositAccountId,
      userId: session.user.id,
    }).lean()

    if (!account)
      return NextResponse.json({ error: "Invalid deposit account" }, { status: 400 })

    // Check for existing pending/under_review application
    const existing = await GrantApplication.findOne({
      userId: session.user.id,
      status: { $in: ["pending", "under_review"] },
    }).lean()

    if (existing)
      return NextResponse.json({ error: "You already have an active grant application. Please wait for it to be reviewed." }, { status: 400 })

    // Validate documents if provided
    const validDocs = Array.isArray(documents) ? documents.filter(
      (d: Record<string, unknown>) => d.name && d.docUrl && typeof d.docUrl === "string"
    ).map((d: Record<string, unknown>) => ({
      name: String(d.name),
      docUrl: String(d.docUrl),
      docPublicId: d.docPublicId ? String(d.docPublicId) : undefined,
    })) : []

    const grant = await GrantApplication.create({
      userId: session.user.id,
      grantType,
      amount,
      purpose: purpose.trim(),
      supportingInfo: supportingInfo?.trim() || undefined,
      documents: validDocs,
      depositAccountId,
      referenceNumber: generateRef(),
      status: "pending",
    })

    return NextResponse.json({
      grant: {
        _id:             String(grant._id),
        grantType:       grant.grantType,
        grantTypeLabel:  GRANT_TYPE_LABELS[grant.grantType] || grant.grantType,
        amount:          grant.amount,
        purpose:         grant.purpose,
        status:          grant.status,
        referenceNumber: grant.referenceNumber,
        appliedAt:       grant.appliedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/grants]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
