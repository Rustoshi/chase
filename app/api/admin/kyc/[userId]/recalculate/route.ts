import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { adminGuard } from "@/lib/middleware/adminGuard"
import { connectDB } from "@/lib/db/connection"
import KycDocument from "@/lib/models/KycDocument"
import User from "@/lib/models/User"

const TIER2_ID_TYPES = ["passport", "drivers_license", "national_id"]

export async function POST(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const { userId } = await params
    await connectDB()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find all approved documents for this user (handle both string and ObjectId)
    const userIdStr = userId
    const userIdObj = new mongoose.Types.ObjectId(userId)
    const allDocs = await KycDocument.find({
      $or: [{ userId: userIdObj }, { userId: userIdStr }],
      status: "approved"
    })

    const approved = allDocs.map((d) => d.docType as string)
    const hasId = TIER2_ID_TYPES.some((t) => approved.includes(t))
    const hasSelfie = approved.includes("selfie")
    const hasAddress = approved.includes("address_proof")

    console.log("[KYC Recalculate] User:", userId, "Approved docs:", approved, "hasId:", hasId, "hasSelfie:", hasSelfie)

    let updated = false
    const oldStatus = user.kycStatus
    const oldTier = user.kycTier

    if (hasId && hasSelfie) {
      user.kycStatus = "verified"
      user.kycTier = hasAddress ? 3 : 2
      updated = true
    } else if (allDocs.length > 0) {
      // Has some approved docs but not complete
      user.kycStatus = "pending"
      user.kycTier = 1
      updated = true
    }

    if (updated) {
      await user.save()
    }

    return NextResponse.json({
      success: true,
      oldStatus,
      oldTier,
      newStatus: user.kycStatus,
      newTier: user.kycTier,
      approvedDocs: approved,
      updated
    })
  } catch (err) {
    console.error("[KYC Recalculate] Error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
