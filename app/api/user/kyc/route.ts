import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import KycDocument from "@/lib/models/KycDocument"
import User from "@/lib/models/User"

const VALID_DOC_TYPES = ["passport", "drivers_license", "national_id", "selfie", "address_proof", "utility_bill", "ssn_proof"]

// ── GET — list user's KYC documents ──────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const userObjectId = new mongoose.Types.ObjectId(session.user.id)
    
    // Fetch user and documents in parallel
    const [user, documents] = await Promise.all([
      User.findById(userObjectId).select("kycStatus kycTier").lean(),
      KycDocument.find({ userId: userObjectId }).sort({ submittedAt: -1 }).lean()
    ])

    const serialized = documents.map((d: Record<string, unknown>) => ({
      _id:         String(d._id),
      docType:     d.docType,
      status:      d.status,
      docUrl:      d.docUrl || null,
      docPublicId: d.docPublicId || null,
      reviewNote:  d.reviewNote || null,
      submittedAt: (d.submittedAt as Date)?.toISOString(),
      reviewedAt:  (d.reviewedAt as Date)?.toISOString() || null,
      dateOfBirth: d.dateOfBirth ? (d.dateOfBirth as Date).toISOString() : null,
      address:     d.address || null,
    }))

    // Return actual status from database, not from session
    return NextResponse.json({
      documents: serialized,
      kycStatus: (user as Record<string, unknown>)?.kycStatus || "unverified",
      kycTier:   (user as Record<string, unknown>)?.kycTier || 1,
    })
  } catch (err) {
    console.error("[GET /api/user/kyc]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST — submit a KYC document ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { docType, docUrl, docPublicId, dateOfBirth, ssn, address } = body

    // Validate
    if (!docType || !docUrl)
      return NextResponse.json({ error: "Document type and file are required" }, { status: 400 })

    if (!VALID_DOC_TYPES.includes(docType))
      return NextResponse.json({ error: "Invalid document type" }, { status: 400 })

    if (typeof docUrl !== "string" || !docUrl.startsWith("http"))
      return NextResponse.json({ error: "Invalid document URL" }, { status: 400 })

    // Validate address and DOB if provided (required for ID documents)
    const isIdDocument = ["passport", "drivers_license", "national_id"].includes(docType)
    if (isIdDocument) {
      if (!dateOfBirth) {
        return NextResponse.json({ error: "Date of birth is required for ID documents" }, { status: 400 })
      }
      if (!address || !address.street || !address.city || !address.country) {
        return NextResponse.json({ error: "Complete address (street, city, country) is required for ID documents" }, { status: 400 })
      }
    }

    await connectDB()

    // Ensure userId is ObjectId for queries
    const userObjectId = new mongoose.Types.ObjectId(session.user.id)

    // Prevent duplicate pending submission for the same doc type
    const existingPending = await KycDocument.findOne({
      userId: userObjectId,
      docType,
      status: "pending",
    }).lean()

    if (existingPending)
      return NextResponse.json(
        { error: `You already have a pending ${docType.replace(/_/g, " ")} submission. Please wait for it to be reviewed.` },
        { status: 400 }
      )

    // Create the document with personal info
    const docData: Record<string, unknown> = {
      userId: userObjectId,
      docType,
      docUrl,
      docPublicId: docPublicId || undefined,
      status: "pending",
    }

    // Add personal info if provided
    if (dateOfBirth) {
      docData.dateOfBirth = new Date(dateOfBirth)
    }
    if (typeof ssn === "string" && ssn.trim()) {
      docData.ssn = ssn.trim()
    }
    if (address && typeof address === "object") {
      docData.address = {
        street: address.street || undefined,
        city: address.city || undefined,
        state: address.state || undefined,
        zip: address.zip || undefined,
        country: address.country || undefined,
      }
    }

    const doc = await KycDocument.create(docData)

    // Update user kycStatus to pending if currently unverified or rejected
    const user = await User.findById(session.user.id)
    if (user && (user.kycStatus === "unverified" || user.kycStatus === "rejected")) {
      user.kycStatus = "pending"
      await user.save()
    }
    // Admin is notified once per submission via /api/user/kyc/notify-admin (see client)

    return NextResponse.json({
      document: {
        _id:         String(doc._id),
        docType:     doc.docType,
        status:      doc.status,
        docUrl:      doc.docUrl || null,
        docPublicId: doc.docPublicId || null,
        submittedAt: doc.submittedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/kyc]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
