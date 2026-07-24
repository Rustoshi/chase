import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { adminGuard } from "@/lib/middleware/adminGuard"
import { connectDB } from "@/lib/db/connection"
import GrantApplication from "@/lib/models/GrantApplication"
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

const GRANT_TYPE_LABELS: Record<string, string> = {
  personal: "Personal", business: "Business", education: "Education",
  housing: "Housing", medical: "Medical", emergency: "Emergency",
}

const fmt = (n: number) => `$${n.toLocaleString()}`

// ── GET — list all grant applications (admin) ────────────────────────────────

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

    const [grants, total] = await Promise.all([
      GrantApplication.find(match)
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GrantApplication.countDocuments(match),
    ])

    // Batch fetch user names
    const userIds = [...new Set(grants.map((g) => String((g as Record<string, unknown>).userId)))]
    const users = await User.find({ _id: { $in: userIds } })
      .select("firstName lastName email")
      .lean()
    const userMap = new Map(users.map((u) => [String(u._id), u]))

    // Batch fetch deposit accounts
    const accountIds = [...new Set(grants.map((g) => String((g as Record<string, unknown>).depositAccountId)).filter(Boolean))]
    const accounts = await Account.find({ _id: { $in: accountIds } })
      .select("accountNumber walletType currency")
      .lean()
    const accountMap = new Map(accounts.map((a) => [String(a._id), a]))

    const serialized = grants.map((g) => {
      const d = g as Record<string, unknown>
      const u = userMap.get(String(d.userId)) as Record<string, unknown> | undefined
      const acc = accountMap.get(String(d.depositAccountId)) as Record<string, unknown> | undefined
      return {
        _id:             String(d._id),
        userId:          String(d.userId),
        userName:        u ? `${u.firstName} ${u.lastName}` : "Unknown",
        userEmail:       u?.email || "",
        grantType:       d.grantType,
        grantTypeLabel:  GRANT_TYPE_LABELS[d.grantType as string] || d.grantType,
        amount:          d.amount,
        approvedAmount:  d.approvedAmount || null,
        purpose:         d.purpose,
        supportingInfo:  d.supportingInfo || null,
        documents:       d.documents || [],
        status:          d.status,
        referenceNumber: d.referenceNumber,
        adminNote:       d.adminNote || null,
        rejectedReason:  d.rejectedReason || null,
        appliedAt:       (d.appliedAt as Date)?.toISOString(),
        reviewedAt:      (d.reviewedAt as Date)?.toISOString() || null,
        disbursedAt:     (d.disbursedAt as Date)?.toISOString() || null,
        depositAccount:  acc ? {
          _id:           String(acc._id),
          accountNumber: acc.accountNumber,
          walletType:    acc.walletType,
          currency:      acc.currency,
        } : null,
      }
    })

    // Stats
    const stats = await GrantApplication.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$amount" } } },
    ])
    const statMap: Record<string, { count: number; total: number }> = {}
    for (const s of stats) statMap[s._id] = { count: s.count, total: s.total }

    return NextResponse.json({
      grants: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending:     statMap.pending?.count || 0,
        underReview: statMap.under_review?.count || 0,
        approved:    statMap.approved?.count || 0,
        disbursed:   statMap.disbursed?.count || 0,
        rejected:    statMap.rejected?.count || 0,
        totalAmount: Object.values(statMap).reduce((s, v) => s + v.total, 0),
      },
    })
  } catch (err) {
    console.error("[GET /api/admin/grants]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── PUT — admin action: review / approve / reject / disburse ─────────────────

export async function PUT(req: NextRequest) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  try {
    const body = await req.json()
    const { grantId, action, reason, note, approvedAmount } = body

    if (!grantId || !action) return NextResponse.json({ error: "grantId and action required" }, { status: 400 })
    if (!["review", "approve", "reject", "disburse"].includes(action))
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    await connectDB()

    const grant = await GrantApplication.findById(grantId)
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 })

    const now = new Date()

    // ── REVIEW ────────────────────────────────────────────────────────
    if (action === "review") {
      if (grant.status !== "pending")
        return NextResponse.json({ error: "Can only review pending grants" }, { status: 400 })

      await GrantApplication.findByIdAndUpdate(grantId, {
        status:     "under_review",
        reviewedBy: admin!.id,
        reviewedAt: now,
        adminNote:  note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "grant.review", "GrantApplication", grantId, {}, undefined)
    }

    // ── APPROVE ───────────────────────────────────────────────────────
    if (action === "approve") {
      if (grant.status !== "under_review" && grant.status !== "pending")
        return NextResponse.json({ error: "Can only approve pending or under-review grants" }, { status: 400 })

      const finalAmount = (typeof approvedAmount === "number" && approvedAmount > 0) ? approvedAmount : grant.amount

      await GrantApplication.findByIdAndUpdate(grantId, {
        status:         "approved",
        approvedAmount: finalAmount,
        reviewedBy:     admin!.id,
        reviewedAt:     now,
        adminNote:      note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "grant.approve", "GrantApplication", grantId, { approvedAmount: finalAmount }, undefined)
      await notifyUser(
        String(grant.userId), "grant", "Grant approved",
        `Your ${GRANT_TYPE_LABELS[grant.grantType] || grant.grantType} grant application for ${fmt(finalAmount)} has been approved.`,
        { grantId }
      )
    }

    // ── REJECT ────────────────────────────────────────────────────────
    if (action === "reject") {
      if (grant.status === "disbursed")
        return NextResponse.json({ error: "Cannot reject a disbursed grant" }, { status: 400 })
      if (!reason) return NextResponse.json({ error: "Rejection reason required" }, { status: 400 })

      await GrantApplication.findByIdAndUpdate(grantId, {
        status:         "rejected",
        reviewedBy:     admin!.id,
        reviewedAt:     now,
        rejectedReason: reason,
        adminNote:      note || undefined,
      })
      await createAuditLog(admin!.id, admin!.email, "grant.reject", "GrantApplication", grantId, { reason }, undefined)
      await notifyUser(
        String(grant.userId), "grant", "Grant rejected",
        `Your ${GRANT_TYPE_LABELS[grant.grantType] || grant.grantType} grant application has been rejected. Reason: ${reason}`,
        { grantId }
      )
    }

    // ── DISBURSE ──────────────────────────────────────────────────────
    if (action === "disburse") {
      if (grant.status !== "approved")
        return NextResponse.json({ error: "Can only disburse approved grants" }, { status: 400 })

      const disbursementAmount = grant.approvedAmount || grant.amount

      // Find the deposit account (can be fiat or bitcoin)
      const account = await Account.findOne({
        _id: grant.depositAccountId,
        userId: grant.userId,
      })
      if (!account)
        return NextResponse.json({ error: "User deposit account not found" }, { status: 400 })

      const isBitcoin = account.walletType === "bitcoin"
      // For bitcoin, amount is in satoshis (1 BTC = 1e8 satoshis), for fiat it's in cents
      const amountSmallest = isBitcoin 
        ? Math.round(disbursementAmount * 1e8) 
        : Math.round(disbursementAmount * 100)
      const balanceField = isBitcoin ? "btcBalance" : "balance"
      const currency = isBitcoin ? "BTC" : account.currency

      const session = await mongoose.startSession()
      try {
        session.startTransaction()

        // Credit account
        await Account.findByIdAndUpdate(
          account._id,
          { $inc: { [balanceField]: amountSmallest } },
          { session }
        )

        // Create transaction
        const reference = await generateTxRef()
        await Transaction.create(
          [
            {
              accountId:   account._id,
              userId:      grant.userId,
              type:        "grant_disbursement",
              amount:      amountSmallest,
              currency,
              status:      "completed",
              description: `Grant disbursement — ${GRANT_TYPE_LABELS[grant.grantType] || grant.grantType} (${grant.referenceNumber})`,
              reference,
              processedAt: now,
              metadata:    { grantId: String(grant._id), grantType: grant.grantType },
            },
          ],
          { session }
        )

        // Update grant status
        await GrantApplication.findByIdAndUpdate(
          grantId,
          {
            status:      "disbursed",
            disbursedAt: now,
            reviewedBy:  admin!.id,
            adminNote:   note || undefined,
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

      const amountDisplay = isBitcoin ? `${disbursementAmount} BTC` : fmt(disbursementAmount)
      await createAuditLog(admin!.id, admin!.email, "grant.disburse", "GrantApplication", grantId, { amount: disbursementAmount, currency }, undefined)
      await notifyUser(
        String(grant.userId), "grant", "Grant funds disbursed",
        `Your ${GRANT_TYPE_LABELS[grant.grantType] || grant.grantType} grant of ${amountDisplay} has been deposited to your account.`,
        { grantId }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[PUT /api/admin/grants]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
