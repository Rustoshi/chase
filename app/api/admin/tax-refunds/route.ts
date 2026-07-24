import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { adminGuard } from "@/lib/middleware/adminGuard"
import { connectDB } from "@/lib/db/connection"
import TaxRefund from "@/lib/models/TaxRefund"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"
import { createAuditLog } from "@/lib/services/auth.service"
import { notifyUser } from "@/lib/services/deposit.service"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateTxRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `TXN-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique reference")
}

// ── GET — list all tax refunds (admin) ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  try {
    await connectDB()

    const sp = req.nextUrl.searchParams
    const page   = Math.max(1, Number(sp.get("page") ?? 1))
    const limit  = Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20)))
    const status = sp.get("status") || undefined
    const userId = sp.get("userId") || undefined

    const match: Record<string, unknown> = {}
    if (status) match.status = status
    if (userId && mongoose.Types.ObjectId.isValid(userId))
      match.userId = new mongoose.Types.ObjectId(userId)

    const [refunds, total] = await Promise.all([
      TaxRefund.find(match)
        .sort({ filingDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      TaxRefund.countDocuments(match),
    ])

    // Batch fetch user names
    const userIds = [...new Set(refunds.map((r) => String((r as Record<string, unknown>).userId)))]
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName email")
      .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    const serialized = refunds.map((r) => {
      const d = r as Record<string, unknown>
      const u = userMap.get(String(d.userId)) as Record<string, unknown> | undefined
      return {
        _id:                  String(d._id),
        userId:               String(d.userId),
        userName:             u ? `${u.firstName} ${u.lastName}` : "Unknown",
        userEmail:            u?.email || "",
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

    // Stats
    const stats = await TaxRefund.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$refundAmount" } } },
    ])
    const statMap: Record<string, { count: number; total: number }> = {}
    for (const s of stats) statMap[s._id] = { count: s.count, total: s.total }

    return NextResponse.json({
      refunds: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending:     statMap.pending?.count || 0,
        underReview: statMap.under_review?.count || 0,
        approved:    statMap.approved?.count || 0,
        deposited:   statMap.deposited?.count || 0,
        rejected:    statMap.rejected?.count || 0,
        totalAmount: Object.values(statMap).reduce((s, v) => s + v.total, 0),
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/tax-refunds]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PUT — admin action: review / approve / reject / deposit ──────────────────

export async function PUT(req: NextRequest) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  try {
    const body = await req.json()
    const { refundId, action, reason, note } = body

    if (!refundId || !action) return NextResponse.json({ error: "refundId and action required" }, { status: 400 })
    if (!["review", "approve", "reject", "deposit"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    await connectDB()

    const refund = await TaxRefund.findById(refundId)
    if (!refund) return NextResponse.json({ error: "Refund not found" }, { status: 404 })

    const now = new Date()

    // ── REVIEW ────────────────────────────────────────────────────────
    if (action === "review") {
      if (refund.status !== "pending")
        return NextResponse.json({ error: "Can only review pending refunds" }, { status: 400 })

      await TaxRefund.findByIdAndUpdate(refundId, {
        status:     "under_review",
        reviewedBy: admin!.id,
        reviewedAt: now,
        adminNote:  note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "tax_refund.review", "TaxRefund", refundId, {}, undefined)
    }

    // ── APPROVE ───────────────────────────────────────────────────────
    if (action === "approve") {
      if (refund.status !== "under_review" && refund.status !== "pending")
        return NextResponse.json({ error: "Can only approve pending or under-review refunds" }, { status: 400 })

      await TaxRefund.findByIdAndUpdate(refundId, {
        status:     "approved",
        reviewedBy: admin!.id,
        reviewedAt: now,
        adminNote:  note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "tax_refund.approve", "TaxRefund", refundId, {}, undefined)
      await notifyUser(
        String(refund.userId), "tax", "Tax refund approved",
        `Your tax refund of $${refund.refundAmount.toLocaleString()} for ${refund.taxYear} has been approved.`,
        { refundId }
      )
    }

    // ── REJECT ────────────────────────────────────────────────────────
    if (action === "reject") {
      if (refund.status === "deposited")
        return NextResponse.json({ error: "Cannot reject a deposited refund" }, { status: 400 })
      if (!reason) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 })

      await TaxRefund.findByIdAndUpdate(refundId, {
        status:         "rejected",
        reviewedBy:     admin!.id,
        reviewedAt:     now,
        rejectedReason: reason,
        adminNote:      note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "tax_refund.reject", "TaxRefund", refundId, { reason }, undefined)
      await notifyUser(
        String(refund.userId), "tax", "Tax refund rejected",
        `Your tax refund claim for ${refund.taxYear} has been rejected. Reason: ${reason}`,
        { refundId }
      )
    }

    // ── DEPOSIT ───────────────────────────────────────────────────────
    if (action === "deposit") {
      if (refund.status !== "approved")
        return NextResponse.json({ error: "Can only deposit approved refunds" }, { status: 400 })

      const account = await Account.findOne({
        _id: refund.depositAccountId,
        userId: refund.userId,
        walletType: "fiat",
      })
      if (!account)
        return NextResponse.json({ error: "User deposit account not found" }, { status: 400 })

      const session = await mongoose.startSession()
      try {
        session.startTransaction()

        // Credit account
        await Account.findByIdAndUpdate(
          account._id,
          { $inc: { balance: Math.round(refund.refundAmount * 100) } },
          { session }
        )

        // Create transaction
        const reference = await generateTxRef()
        await Transaction.create(
          [
            {
              accountId:   account._id,
              userId:      refund.userId,
              type:        "tax_refund_deposit",
              amount:      Math.round(refund.refundAmount * 100),
              currency:    account.currency,
              status:      "completed",
              description: `Tax refund deposit — Tax Year ${refund.taxYear}`,
              reference,
              processedAt: now,
              metadata:    { taxRefundId: String(refund._id), taxYear: refund.taxYear },
            },
          ],
          { session }
        )

        // Update refund status
        await TaxRefund.findByIdAndUpdate(
          refundId,
          {
            status:            "deposited",
            depositedAt:       now,
            actualDepositDate: now,
            reviewedBy:        admin!.id,
            adminNote:         note || undefined,
          },
          { session }
        )

        await session.commitTransaction()
      } catch (err) {
        await session.abortTransaction()
        throw err
      } finally {
        await session.endSession()
      }

      await createAuditLog(admin!.id, admin!.email, "tax_refund.deposit", "TaxRefund", refundId, { amount: refund.refundAmount }, undefined)
      await notifyUser(
        String(refund.userId), "tax", "Tax refund deposited",
        `Your tax refund of $${refund.refundAmount.toLocaleString()} for ${refund.taxYear} has been deposited to your account.`,
        { refundId }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PUT /api/admin/tax-refunds]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
