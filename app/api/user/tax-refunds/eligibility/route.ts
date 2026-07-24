import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import TaxRefund from "@/lib/models/TaxRefund"
import Account from "@/lib/models/Account"
import User from "@/lib/models/User"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"

// ── GET — check user eligibility for tax refund filing ───────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const [settings, user, accounts, existingRefunds] = await Promise.all([
      AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean() as Promise<Record<string, unknown> | null>,
      User.findById(session.user.id).select("kycStatus kycTier isSuspended isActive firstName lastName address").lean() as Promise<Record<string, unknown> | null>,
      Account.find({ userId: session.user.id, walletType: "fiat" }).select("_id accountNumber accountType currency").lean(),
      TaxRefund.find({ userId: session.user.id, status: { $nin: ["rejected"] } }).select("taxYear status").lean(),
    ])

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const taxEnabled = settings?.taxRefundEnabled !== false
    const maxAmount = (settings?.taxRefundMaxAmount as number) || 50000
    const eligibleYears = (settings?.taxRefundEligibleYears as number[]) || [2023, 2024, 2025]
    const requiredKycTier = (settings?.taxRefundRequiredKycTier as number) || 2
    const processingDays = (settings?.taxRefundProcessingDays as number) || 21

    const reasons: string[] = []
    let eligible = true

    // Feature disabled
    if (!taxEnabled) {
      eligible = false
      reasons.push("Tax refund filing is currently disabled")
    }

    // KYC
    if (user.kycStatus !== "verified") {
      eligible = false
      reasons.push("Your identity must be verified (KYC) before filing a tax refund")
    }
    if ((user.kycTier as number) < requiredKycTier) {
      eligible = false
      reasons.push(`KYC Tier ${requiredKycTier} is required for tax refund filing`)
    }

    // Account status
    if (!user.isActive || user.isSuspended) {
      eligible = false
      reasons.push("Your account is currently suspended")
    }

    // Must have a fiat account
    if (accounts.length === 0) {
      eligible = false
      reasons.push("You need a fiat (checking/savings) account to receive your refund")
    }

    // Determine which years are still available
    const filedYears = existingRefunds.map((r) => (r as Record<string, unknown>).taxYear as number)
    const availableYears = eligibleYears.filter((y) => !filedYears.includes(y))

    if (availableYears.length === 0 && eligible) {
      eligible = false
      reasons.push("You have already filed refund claims for all eligible tax years")
    }

    return NextResponse.json({
      eligible,
      reasons,
      eligibleYears,
      availableYears,
      filedYears,
      maxAmount,
      processingDays,
      requiredKycTier,
      accounts: accounts.map((a) => ({
        _id:           String(a._id),
        accountNumber: a.accountNumber,
        accountType:   a.accountType || "checking",
        currency:      a.currency,
      })),
      userInfo: {
        firstName:  user.firstName as string,
        lastName:   user.lastName as string,
        hasAddress: !!(user.address as Record<string, unknown>)?.street,
      },
    })
  } catch (err) {
    console.error("[GET /api/user/tax-refunds/eligibility]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
