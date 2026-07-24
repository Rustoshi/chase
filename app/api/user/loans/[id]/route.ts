import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import LoanApplication from "@/lib/models/LoanApplication"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"

// ── GET — single loan detail for authenticated user ──────────────────────────

type Ctx = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    await connectDB()

    const loan = await LoanApplication.findOne({
      _id: id,
      userId: session.user.id,
    }).lean()

    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    const l = loan as Record<string, unknown>

    // Fetch repayment transactions
    const repayments = await Transaction.find({
      userId: session.user.id,
      type: "loan_repayment",
      "metadata.loanId": String(l._id),
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    // Fetch disbursement transaction
    const disbursement = await Transaction.findOne({
      userId: session.user.id,
      type: "loan_disbursement",
      "metadata.loanId": String(l._id),
    }).lean()

    // Fetch fiat account balance
    const account = await Account.findOne({
      userId: session.user.id,
      walletType: "fiat",
    }).select("balance currency").lean()

    return NextResponse.json({
      loan: {
        _id:                String(l._id),
        loanType:           l.loanType || "personal",
        amount:             l.amount,
        purpose:            l.purpose,
        termMonths:         l.termMonths,
        interestRate:       l.interestRate ?? null,
        status:             l.status,
        totalPaid:          l.totalPaid || 0,
        outstandingBalance: l.outstandingBalance ?? l.amount,
        monthlyPayment:     l.monthlyPayment || 0,
        nextPaymentDate:    (l.nextPaymentDate as Date)?.toISOString() || null,
        gracePeriodDays:    l.gracePeriodDays ?? 5,
        lateFeePercent:     l.lateFeePercent ?? 2,
        adminNote:          l.adminNote || null,
        appliedAt:          (l.appliedAt as Date)?.toISOString(),
        approvedAt:         (l.approvedAt as Date)?.toISOString() || null,
        closedAt:           (l.closedAt as Date)?.toISOString() || null,
        employmentStatus:   l.employmentStatus || null,
        monthlyIncome:      l.monthlyIncome || null,
      },
      repayments: repayments.map((t) => {
        const tx = t as Record<string, unknown>
        return {
          _id:       String(tx._id),
          amount:    (tx.amount as number) / 100,
          reference: tx.reference,
          createdAt: (tx.createdAt as Date)?.toISOString(),
        }
      }),
      disbursement: disbursement
        ? {
            amount:    (disbursement.amount as number) / 100,
            reference: disbursement.reference,
            createdAt: (disbursement.createdAt as Date)?.toISOString(),
          }
        : null,
      accountBalance: account ? (account.balance as number) / 100 : 0,
    })
  } catch (err) {
    console.error("[GET /api/user/loans/[id]]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
