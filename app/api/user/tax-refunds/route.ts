import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import TaxRefund from "@/lib/models/TaxRefund"
import Account from "@/lib/models/Account"
import User from "@/lib/models/User"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateRef(taxYear: number): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `TAX-${taxYear}-${suffix}`
    const exists = await TaxRefund.findOne({ referenceNumber: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique reference")
}

function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from)
  let added = 0
  while (added < days) {
    result.setDate(result.getDate() + 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

// ── GET — list user tax refunds ──────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const refunds = await TaxRefund.find({ userId: session.user.id })
      .sort({ filingDate: -1 })
      .limit(50)
      .lean()

    const serialized = refunds.map((r) => {
      const d = r as Record<string, unknown>
      return {
        _id:                  String(d._id),
        taxYear:              d.taxYear,
        filingType:           d.filingType,
        totalReportedIncome:  d.totalReportedIncome || 0,
        totalTaxWithheld:     d.totalTaxWithheld || 0,
        refundAmount:         d.refundAmount,
        ssnLast4:             d.ssnLast4,
        employer:             d.employer || null,
        status:               d.status,
        referenceNumber:      d.referenceNumber,
        documents:            d.documents || [],
        filingDate:           (d.filingDate as Date)?.toISOString(),
        estimatedDepositDate: (d.estimatedDepositDate as Date)?.toISOString() || null,
        actualDepositDate:    (d.actualDepositDate as Date)?.toISOString() || null,
        adminNote:            d.adminNote || null,
        rejectedReason:       d.rejectedReason || null,
      }
    })

    return NextResponse.json({ refunds: serialized })
  } catch (err) {
    console.error("[GET /api/user/tax-refunds]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST — submit new tax refund claim ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { taxYear, filingType, totalReportedIncome, totalTaxWithheld, refundAmount, ssnLast4, employer, depositAccountId } = body

    // Basic validation
    if (!taxYear || !filingType || !ssnLast4 || !depositAccountId)
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })

    if (!["individual", "joint", "business"].includes(filingType))
      return NextResponse.json({ error: "Invalid filing type" }, { status: 400 })

    if (typeof totalReportedIncome !== "number" || totalReportedIncome <= 0)
      return NextResponse.json({ error: "Total reported income is required" }, { status: 400 })

    if (typeof totalTaxWithheld !== "number" || totalTaxWithheld <= 0)
      return NextResponse.json({ error: "Total tax withheld is required" }, { status: 400 })

    if (typeof refundAmount !== "number" || refundAmount <= 0)
      return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 })

    if (totalTaxWithheld > totalReportedIncome)
      return NextResponse.json({ error: "Tax withheld cannot exceed reported income" }, { status: 400 })

    if (typeof ssnLast4 !== "string" || ssnLast4.length !== 4 || !/^\d{4}$/.test(ssnLast4))
      return NextResponse.json({ error: "SSN last 4 must be exactly 4 digits" }, { status: 400 })

    await connectDB()

    // Load settings
    const settings = await AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean() as Record<string, unknown> | null
    const taxEnabled = settings?.taxRefundEnabled !== false
    const maxAmount = (settings?.taxRefundMaxAmount as number) || 50000
    const eligibleYears = (settings?.taxRefundEligibleYears as number[]) || [2023, 2024, 2025]
    const requiredKycTier = (settings?.taxRefundRequiredKycTier as number) || 2
    const processingDays = (settings?.taxRefundProcessingDays as number) || 21

    if (!taxEnabled)
      return NextResponse.json({ error: "Tax refund filing is currently disabled" }, { status: 400 })

    if (refundAmount > maxAmount)
      return NextResponse.json({ error: `Refund amount cannot exceed $${maxAmount.toLocaleString()}` }, { status: 400 })

    if (!eligibleYears.includes(taxYear))
      return NextResponse.json({ error: `Tax year ${taxYear} is not eligible for refund filing` }, { status: 400 })

    // User checks
    const user = await User.findById(session.user.id).select("kycStatus kycTier isSuspended isActive").lean() as Record<string, unknown> | null
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (!user.isActive || user.isSuspended)
      return NextResponse.json({ error: "Your account is suspended" }, { status: 403 })
    if (user.kycStatus !== "verified")
      return NextResponse.json({ error: "KYC verification required to file a tax refund" }, { status: 400 })
    if ((user.kycTier as number) < requiredKycTier)
      return NextResponse.json({ error: `KYC Tier ${requiredKycTier} required for tax refund filing` }, { status: 400 })

    // Verify deposit account belongs to user
    const account = await Account.findOne({
      _id: depositAccountId,
      userId: session.user.id,
      walletType: "fiat",
    }).lean()
    if (!account)
      return NextResponse.json({ error: "Invalid deposit account" }, { status: 400 })

    // Check duplicate filing for same tax year
    const existing = await TaxRefund.findOne({
      userId: session.user.id,
      taxYear,
      status: { $nin: ["rejected"] },
    }).lean()
    if (existing)
      return NextResponse.json({ error: `You already have an active refund claim for tax year ${taxYear}` }, { status: 400 })

    // Generate reference and estimated date
    const referenceNumber = await generateRef(taxYear)
    const estimatedDepositDate = addBusinessDays(new Date(), processingDays)

    // Auto-generate tax documents based on filing
    const documents = [
      { name: `Tax Statement ${taxYear}`, docType: "1099-INT", taxYear },
      { name: `Annual Summary ${taxYear}`, docType: "Summary", taxYear },
    ]

    // Create
    const refund = await TaxRefund.create({
      userId: session.user.id,
      taxYear,
      filingType,
      totalReportedIncome,
      totalTaxWithheld,
      refundAmount,
      ssnLast4,
      employer: employer || undefined,
      depositAccountId,
      referenceNumber,
      documents,
      estimatedDepositDate,
    })

    return NextResponse.json({
      refund: {
        _id:                  String(refund._id),
        taxYear:              refund.taxYear,
        filingType:           refund.filingType,
        totalReportedIncome:  refund.totalReportedIncome,
        totalTaxWithheld:     refund.totalTaxWithheld,
        refundAmount:         refund.refundAmount,
        status:               refund.status,
        referenceNumber:      refund.referenceNumber,
        filingDate:           refund.filingDate.toISOString(),
        estimatedDepositDate: refund.estimatedDepositDate?.toISOString() || null,
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/tax-refunds]", err)
    const msg = err instanceof Error && err.message.includes("duplicate key")
      ? "You already have a refund claim for this tax year"
      : "Internal server error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
