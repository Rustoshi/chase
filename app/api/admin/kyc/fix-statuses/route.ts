import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { adminGuard } from "@/lib/middleware/adminGuard"
import { connectDB } from "@/lib/db/connection"
import KycDocument from "@/lib/models/KycDocument"
import User from "@/lib/models/User"

const TIER2_ID_TYPES = ["passport", "drivers_license", "national_id"]

// One-time fix for users with approved docs but wrong status
export async function POST() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    await connectDB()

    // Find all users with kycStatus not "verified"
    const users = await User.find({ kycStatus: { $ne: "verified" } }).lean()
    
    let fixed = 0
    const results: Array<{ userId: string; email: string; oldStatus: string; newStatus: string }> = []

    for (const user of users) {
      const userId = String(user._id)
      const userIdObj = new mongoose.Types.ObjectId(userId)

      // Find approved docs for this user
      const approvedDocs = await KycDocument.find({
        $or: [{ userId: userIdObj }, { userId: userId }],
        status: "approved"
      }).lean()

      const approved = approvedDocs.map(d => d.docType as string)
      const hasId = TIER2_ID_TYPES.some(t => approved.includes(t))
      const hasSelfie = approved.includes("selfie")
      const hasAddress = approved.includes("address_proof")

      if (hasId && hasSelfie) {
        const oldStatus = user.kycStatus
        await User.findByIdAndUpdate(userId, {
          kycStatus: "verified",
          kycTier: hasAddress ? 3 : 2
        })
        fixed++
        results.push({
          userId,
          email: user.email as string,
          oldStatus: oldStatus as string,
          newStatus: "verified"
        })
      }
    }

    return NextResponse.json({
      success: true,
      checked: users.length,
      fixed,
      results
    })
  } catch (err) {
    console.error("[Fix KYC Statuses] Error:", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}
