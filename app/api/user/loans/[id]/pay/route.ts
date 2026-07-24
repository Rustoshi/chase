import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import LoanApplication from "@/lib/models/LoanApplication"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generateRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `LRP-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique reference")
}

// ── POST — user-initiated loan repayment ─────────────────────────────────────

type Ctx = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { amount, pin } = body

    if (!amount || typeof amount !== "number" || amount <= 0)
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
    if (!pin)
      return NextResponse.json({ error: "Transfer PIN is required" }, { status: 400 })

    await connectDB()

    // Verify PIN
    const user = await User.findById(session.user.id).select("transferPin isSuspended").lean() as Record<string, unknown> | null
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
    if (user.isSuspended) return NextResponse.json({ error: "Account suspended" }, { status: 403 })
    if (!user.transferPin) return NextResponse.json({ error: "Transfer PIN not set. Contact support." }, { status: 400 })
    if (String(user.transferPin) !== String(pin)) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })

    // Verify loan ownership & status
    const loan = await LoanApplication.findOne({
      _id: id,
      userId: session.user.id,
    })
    if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    if (loan.status !== "active") return NextResponse.json({ error: "Loan is not active" }, { status: 400 })

    const outstanding = loan.outstandingBalance ?? loan.amount
    if (amount > outstanding)
      return NextResponse.json({ error: `Payment exceeds outstanding balance of $${outstanding.toLocaleString()}` }, { status: 400 })

    // Check fiat balance
    const account = await Account.findOne({ userId: session.user.id, walletType: "fiat" })
    if (!account) return NextResponse.json({ error: "No fiat account found" }, { status: 400 })
    if (account.balance < Math.round(amount * 100))
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })

    // Calculate new state
    const newOutstanding = Math.max(0, outstanding - amount)
    const willClose = newOutstanding <= 0
    const nextPayment = new Date(Date.now() + 30 * 86_400_000)

    // Execute in a transaction
    const mongoSession = await mongoose.startSession()

    try {
      mongoSession.startTransaction()

      // 1. Debit fiat account
      await Account.findByIdAndUpdate(
        account._id,
        { $inc: { balance: -Math.round(amount * 100) } },
        { session: mongoSession }
      )

      // 2. Create repayment transaction
      const reference = await generateRef()
      await Transaction.create(
        [
          {
            accountId: account._id,
            userId: session.user.id,
            type: "loan_repayment",
            amount: Math.round(amount * 100),
            currency: account.currency,
            status: "completed",
            description: `Loan repayment — $${amount.toFixed(2)}`,
            reference,
            processedAt: new Date(),
            metadata: { loanId: String(loan._id), balanceAdjusted: true },
          },
        ],
        { session: mongoSession }
      )

      // 3. Update loan
      const loanUpdate: Record<string, unknown> = {
        outstandingBalance: newOutstanding,
        $inc: { totalPaid: amount },
        nextPaymentDate: nextPayment,
      }
      if (willClose) {
        loanUpdate.status = "closed"
        loanUpdate.closedAt = new Date()
      }
      await LoanApplication.findByIdAndUpdate(loan._id, loanUpdate, {
        session: mongoSession,
      })

      await mongoSession.commitTransaction()
    } catch (err) {
      await mongoSession.abortTransaction()
      throw err
    } finally {
      await mongoSession.endSession()
    }

    return NextResponse.json({
      success: true,
      newOutstanding,
      closed: willClose,
      message: willClose
        ? "Loan fully paid off! Congratulations."
        : `Payment of $${amount.toFixed(2)} recorded successfully.`,
    })
  } catch (err) {
    console.error("[POST /api/user/loans/[id]/pay]", err)
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 })
  }
}
