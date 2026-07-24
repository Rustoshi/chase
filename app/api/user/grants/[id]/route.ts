import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import GrantApplication from "@/lib/models/GrantApplication"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"

const GRANT_TYPE_LABELS: Record<string, string> = {
  personal: "Personal", business: "Business", education: "Education",
  housing: "Housing", medical: "Medical", emergency: "Emergency",
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await connectDB()

    const grant = await GrantApplication.findOne({ _id: id, userId: session.user.id }).lean()
    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 })

    // Deposit account info
    let depositAccount = null
    if (grant.depositAccountId) {
      const acc = await Account.findById(grant.depositAccountId).lean()
      if (acc) {
        depositAccount = {
          accountNumber: (acc as Record<string, unknown>).accountNumber,
          accountType:   (acc as Record<string, unknown>).walletType,
          currency:      (acc as Record<string, unknown>).currency,
        }
      }
    }

    // Disbursement transaction
    let disbursementTx = null
    if (grant.status === "disbursed") {
      const tx = await Transaction.findOne({
        userId: session.user.id,
        type: "grant_disbursement",
        "metadata.grantId": String(grant._id),
      }).lean()
      if (tx) {
        disbursementTx = {
          amount:    (tx as Record<string, unknown>).amount,
          reference: (tx as Record<string, unknown>).reference,
          createdAt: ((tx as Record<string, unknown>).createdAt as Date)?.toISOString(),
        }
      }
    }

    // Status timeline
    const timeline = [
      { step: "submitted",    label: "Application Submitted", date: (grant.appliedAt as Date)?.toISOString(), completed: true, active: false },
      { step: "under_review", label: "Under Review",          date: null, completed: false, active: false },
      { step: "approved",     label: "Approved",              date: null, completed: false, active: false },
      { step: "disbursed",    label: "Funds Disbursed",       date: (grant.disbursedAt as Date)?.toISOString() || null, completed: false, active: false },
    ]

    const statusOrder = ["pending", "under_review", "approved", "disbursed"]
    const currentIdx = statusOrder.indexOf(grant.status as string)

    if (grant.status === "rejected") {
      timeline.splice(2, 2, {
        step: "rejected", label: "Rejected",
        date: (grant.reviewedAt as Date)?.toISOString() || null,
        completed: false, active: true,
      })
    } else {
      for (let i = 0; i < timeline.length; i++) {
        if (i < currentIdx) { timeline[i].completed = true }
        else if (i === currentIdx) { timeline[i].active = true; if (i > 0) timeline[i].completed = false }
      }
      if (grant.status === "under_review" || grant.status === "approved") {
        timeline[1].date = (grant.reviewedAt as Date)?.toISOString() || null
      }
      if (grant.status === "approved" || grant.status === "disbursed") {
        timeline[1].completed = true
        timeline[2].date = (grant.reviewedAt as Date)?.toISOString() || null
        timeline[2].completed = grant.status === "disbursed"
        timeline[2].active = grant.status === "approved"
      }
      if (grant.status === "disbursed") {
        timeline[3].completed = true
        timeline[3].active = false
      }
    }

    return NextResponse.json({
      grant: {
        _id:             String(grant._id),
        grantType:       grant.grantType,
        grantTypeLabel:  GRANT_TYPE_LABELS[grant.grantType as string] || grant.grantType,
        amount:          grant.amount,
        approvedAmount:  grant.approvedAmount || null,
        purpose:         grant.purpose,
        supportingInfo:  grant.supportingInfo || null,
        documents:       grant.documents || [],
        status:          grant.status,
        referenceNumber: grant.referenceNumber,
        adminNote:       grant.adminNote || null,
        rejectedReason:  grant.rejectedReason || null,
        appliedAt:       (grant.appliedAt as Date)?.toISOString(),
        reviewedAt:      (grant.reviewedAt as Date)?.toISOString() || null,
        disbursedAt:     (grant.disbursedAt as Date)?.toISOString() || null,
      },
      depositAccount,
      disbursementTx,
      timeline,
    })
  } catch (err) {
    console.error("[GET /api/user/grants/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
