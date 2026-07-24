import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import LoanApplication from "@/lib/models/LoanApplication"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import User from "@/lib/models/User"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const [settings, user] = await Promise.all([
      AppSettings.findById(APP_SETTINGS_ID).lean(),
      User.findById(session.user.id).select("kycStatus createdAt").lean(),
    ])

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const s = settings as Record<string, unknown> | null
    const u = user as Record<string, unknown>
    const reasons: string[] = []

    const maxActive    = (s?.loanMaxActivePerUser as number)      ?? 1
    const maxLifetime  = (s?.loanMaxLifetimeBorrowed as number)   ?? 500000
    const cooldownDays = (s?.loanRejectionCooldownDays as number) ?? 30
    const minAgeDays   = 0 // Account age requirement disabled

    // KYC
    if (u.kycStatus !== "verified") reasons.push("KYC verification required")

    // Account age
    const accountAge = (Date.now() - new Date(u.createdAt as string).getTime()) / 86_400_000
    if (accountAge < minAgeDays) reasons.push(`Account must be at least ${minAgeDays} days old`)

    // Pending
    const pendingCount = await LoanApplication.countDocuments({
      userId: session.user.id,
      status: "pending",
    })
    if (pendingCount > 0) reasons.push("You already have a pending application")

    // Active loans
    const activeCount = await LoanApplication.countDocuments({
      userId: session.user.id,
      status: "active",
    })
    if (activeCount >= maxActive) reasons.push(`Maximum ${maxActive} active loan${maxActive > 1 ? "s" : ""} allowed`)

    // Defaulted
    const defaultedCount = await LoanApplication.countDocuments({
      userId: session.user.id,
      status: "defaulted",
    })
    if (defaultedCount > 0) reasons.push("Cannot apply with a defaulted loan on record")

    // Lifetime cap
    const lifetimeAgg = await LoanApplication.aggregate([
      { $match: { userId: user._id, status: { $in: ["active", "closed", "approved"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const lifetimeBorrowed = lifetimeAgg[0]?.total ?? 0
    const remainingLifetime = Math.max(0, maxLifetime - lifetimeBorrowed)
    if (remainingLifetime <= 0) reasons.push("Lifetime borrowing limit reached")

    // Rejection cooldown
    const lastRejection = await LoanApplication.findOne({
      userId: session.user.id,
      status: "rejected",
    }).sort({ rejectedAt: -1, appliedAt: -1 }).lean()

    let cooldownRemaining = 0
    if (lastRejection) {
      const rejDate = (lastRejection as Record<string, unknown>).rejectedAt || (lastRejection as Record<string, unknown>).appliedAt
      const daysSince = (Date.now() - new Date(rejDate as string).getTime()) / 86_400_000
      if (daysSince < cooldownDays) {
        cooldownRemaining = Math.ceil(cooldownDays - daysSince)
        reasons.push(`Please wait ${cooldownRemaining} more day(s) before re-applying`)
      }
    }

    // Products
    const products = ((s?.loanProducts as Array<Record<string, unknown>>) || []).map((p) => ({
      type:      p.type as string,
      label:     p.label as string,
      minRate:   p.minRate as number,
      maxRate:   p.maxRate as number,
      minTerm:   p.minTerm as number,
      maxTerm:   p.maxTerm as number,
      minAmount: p.minAmount as number,
      maxAmount: Math.min(p.maxAmount as number, remainingLifetime),
    }))

    return NextResponse.json({
      eligible:           reasons.length === 0,
      reasons,
      products,
      limits: {
        maxActiveLoans:     maxActive,
        activeLoans:        activeCount,
        lifetimeLimit:      maxLifetime,
        lifetimeBorrowed:   lifetimeBorrowed,
        remainingLifetime,
        cooldownDays,
        cooldownRemaining,
        minAccountAgeDays:  minAgeDays,
        accountAgeDays:     Math.floor(accountAge),
      },
    })
  } catch (err) {
    console.error("[GET /api/user/loans/eligibility]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
