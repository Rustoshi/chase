import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import LoanApplication from "@/lib/models/LoanApplication"
import CardApplication from "@/lib/models/CardApplication"
import GrantApplication from "@/lib/models/GrantApplication"
import TaxRefund from "@/lib/models/TaxRefund"
import mongoose from "mongoose"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const uid = session.user.id
    await connectDB()

    const settings = await AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean()

    // Fetch user-specific data in parallel
    const [loanCounts, cardCounts, grantCounts, taxRefundCounts] = await Promise.all([
      // Loans
      LoanApplication.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Cards
      CardApplication.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Grants
      GrantApplication.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Tax Refunds
      TaxRefund.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ])

    // Helper: convert aggregate result to a status→count map
    const toMap = (agg: { _id: string; count: number }[]): Record<string, number> =>
      Object.fromEntries(agg.map((a) => [a._id, a.count]))

    const loanMap = toMap(loanCounts)
    const cardMap = toMap(cardCounts)
    const grantMap = toMap(grantCounts)
    const taxMap = toMap(taxRefundCounts)

    // Helper: check admin config for service disabled
    const getAdminCfg = (key: string) => {
      const raw = settings?.[key as keyof typeof settings] as Record<string, unknown> | undefined
      if (!raw) return { enabled: true }
      return { enabled: raw.enabled !== false }
    }

    // Derive dynamic status for each service
    const deriveStatus = (
      map: Record<string, number>,
      adminKey: string,
    ) => {
      const adminCfg = getAdminCfg(adminKey)
      if (!adminCfg.enabled) {
        return { enabled: false, status: "disabled", statusLabel: "Unavailable", description: "Service currently unavailable" }
      }

      const pending = (map.pending || 0) + (map.under_review || 0) + (map.reviewing || 0)
      const active = (map.active || 0) + (map.approved || 0) + (map.disbursed || 0)
      const frozen = map.frozen || 0

      if (pending > 0 && active > 0) {
        return { enabled: true, status: "available", statusLabel: `${active} Active · ${pending} Pending`, description: "" }
      }
      if (pending > 0) {
        return { enabled: true, status: "coming_soon", statusLabel: `${pending} Pending`, description: "" }
      }
      if (active > 0) {
        return { enabled: true, status: "available", statusLabel: `${active} Active`, description: "" }
      }
      if (frozen > 0) {
        return { enabled: true, status: "restricted", statusLabel: `${frozen} Frozen`, description: "" }
      }
      return { enabled: true, status: "available", statusLabel: "Available", description: "" }
    }

    return NextResponse.json({
      loans:      deriveStatus(loanMap, "loansService"),
      grants:     deriveStatus(grantMap, "grantsService"),
      taxRefunds: deriveStatus(taxMap, "taxRefundsService"),
      cards:      deriveStatus(cardMap, "cardsService"),
    })
  } catch (err) {
    console.error("[GET /api/user/services]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
