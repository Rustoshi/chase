import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import LoanApplication from "@/lib/models/LoanApplication"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import User from "@/lib/models/User"
import { sendAdminAlertEmail } from "@/lib/email"

// ── GET — list user's loans ──────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const loans = await LoanApplication.find({ userId: session.user.id })
      .sort({ appliedAt: -1 })
      .lean()

    const serialized = loans.map((l: Record<string, unknown>) => ({
      _id:               String(l._id),
      loanType:          l.loanType || "personal",
      amount:            l.amount,
      purpose:           l.purpose,
      termMonths:        l.termMonths || l.term,
      interestRate:      l.interestRate || null,
      status:            l.status,
      totalPaid:         l.totalPaid || 0,
      outstandingBalance: l.outstandingBalance || l.amount,
      monthlyPayment:    l.monthlyPayment || 0,
      nextPaymentDate:   (l.nextPaymentDate as Date)?.toISOString() || null,
      adminNote:         l.adminNote || null,
      appliedAt:         (l.appliedAt as Date)?.toISOString(),
      approvedAt:        (l.approvedAt as Date)?.toISOString() || null,
    }))

    return NextResponse.json({ loans: serialized })
  } catch (err) {
    console.error("[GET /api/user/loans]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST — submit new loan application ───────────────────────────────────────

const VALID_LOAN_TYPES     = ["personal", "auto", "home", "education", "business"]
const VALID_EMPLOYMENT     = ["employed", "self_employed", "retired", "student", "other"]

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { amount, purpose, termMonths, loanType, employmentStatus, employer, monthlyIncome } = body

    // ── Basic validation ───────────────────────────────────────────────────

    if (!loanType || !VALID_LOAN_TYPES.includes(loanType))
      return NextResponse.json({ error: "Invalid loan type" }, { status: 400 })
    if (!amount || typeof amount !== "number" || amount <= 0)
      return NextResponse.json({ error: "Invalid loan amount" }, { status: 400 })
    if (!termMonths || typeof termMonths !== "number" || termMonths < 1)
      return NextResponse.json({ error: "Invalid loan term" }, { status: 400 })
    if (!purpose || purpose.length < 3)
      return NextResponse.json({ error: "Please provide a loan purpose" }, { status: 400 })
    if (employmentStatus && !VALID_EMPLOYMENT.includes(employmentStatus))
      return NextResponse.json({ error: "Invalid employment status" }, { status: 400 })

    await connectDB()

    // ── Load settings & user ───────────────────────────────────────────────

    const [settings, user] = await Promise.all([
      AppSettings.findById(APP_SETTINGS_ID).lean(),
      User.findById(session.user.id).select("kycStatus createdAt").lean(),
    ])

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const s = settings as Record<string, unknown> | null
    const maxActive       = (s?.loanMaxActivePerUser as number)      ?? 1
    const maxLifetime     = (s?.loanMaxLifetimeBorrowed as number)   ?? 500000
    const cooldownDays    = (s?.loanRejectionCooldownDays as number) ?? 30
    const maxDTI          = (s?.loanMaxDebtToIncomeRatio as number)  ?? 0.4

    // ── Eligibility checks ─────────────────────────────────────────────────

    // KYC
    const u = user as Record<string, unknown>
    if (u.kycStatus !== "verified")
      return NextResponse.json({ error: "KYC verification required before applying for a loan" }, { status: 403 })

    // Product tier validation
    const products = (s?.loanProducts as Array<Record<string, unknown>>) || []
    const product = products.find((p) => p.type === loanType)
    if (product) {
      if (amount < (product.minAmount as number))
        return NextResponse.json({ error: `Minimum amount for ${loanType} loan is $${(product.minAmount as number).toLocaleString()}` }, { status: 400 })
      if (amount > (product.maxAmount as number))
        return NextResponse.json({ error: `Maximum amount for ${loanType} loan is $${(product.maxAmount as number).toLocaleString()}` }, { status: 400 })
      if (termMonths < (product.minTerm as number) || termMonths > (product.maxTerm as number))
        return NextResponse.json({ error: `Term must be between ${product.minTerm} and ${product.maxTerm} months for ${loanType} loans` }, { status: 400 })
    }

    // Pending application check
    const pendingCount = await LoanApplication.countDocuments({
      userId: session.user.id,
      status: "pending",
    })
    if (pendingCount > 0)
      return NextResponse.json({ error: "You already have a pending loan application" }, { status: 409 })

    // Active loans limit
    const activeCount = await LoanApplication.countDocuments({
      userId: session.user.id,
      status: "active",
    })
    if (activeCount >= maxActive)
      return NextResponse.json({ error: `You can only have ${maxActive} active loan${maxActive > 1 ? "s" : ""} at a time` }, { status: 409 })

    // Lifetime borrowing cap
    const lifetimeAgg = await LoanApplication.aggregate([
      { $match: { userId: user._id, status: { $in: ["active", "closed", "approved"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ])
    const lifetimeTotal = (lifetimeAgg[0]?.total ?? 0) + amount
    if (lifetimeTotal > maxLifetime)
      return NextResponse.json({ error: `Lifetime borrowing limit of $${maxLifetime.toLocaleString()} would be exceeded` }, { status: 400 })

    // Rejection cooldown
    const lastRejection = await LoanApplication.findOne({
      userId: session.user.id,
      status: "rejected",
    }).sort({ rejectedAt: -1, appliedAt: -1 }).lean()
    if (lastRejection) {
      const rejDate = (lastRejection as Record<string, unknown>).rejectedAt || (lastRejection as Record<string, unknown>).appliedAt
      const daysSince = (Date.now() - new Date(rejDate as string).getTime()) / 86_400_000
      if (daysSince < cooldownDays)
        return NextResponse.json({ error: `Please wait ${Math.ceil(cooldownDays - daysSince)} more day(s) before re-applying` }, { status: 429 })
    }

    // Debt-to-income ratio (if income provided)
    if (monthlyIncome && monthlyIncome > 0) {
      const existingPayments = await LoanApplication.aggregate([
        { $match: { userId: user._id, status: "active" } },
        { $group: { _id: null, total: { $sum: "$monthlyPayment" } } },
      ])
      const currentDebt = existingPayments[0]?.total ?? 0
      // Estimate new monthly payment (rough — admin sets final rate)
      const estimatedRate = product ? ((product.minRate as number) + (product.maxRate as number)) / 2 / 100 / 12 : 0.01
      const estPayment = estimatedRate > 0
        ? amount * estimatedRate / (1 - Math.pow(1 + estimatedRate, -termMonths))
        : amount / termMonths
      const dti = (currentDebt + estPayment) / monthlyIncome
      if (dti > maxDTI)
        return NextResponse.json({ error: "The requested amount exceeds the allowed debt-to-income ratio" }, { status: 400 })
    }

    // ── Create application ─────────────────────────────────────────────────

    const loan = await LoanApplication.create({
      userId: session.user.id,
      loanType,
      amount,
      purpose,
      termMonths,
      employmentStatus: employmentStatus || undefined,
      employer:         employer || undefined,
      monthlyIncome:    monthlyIncome || undefined,
      status: "pending",
      appliedAt: new Date(),
    })

    sendAdminAlertEmail("New loan application", [
      { label: "Client", value: `${user.firstName} ${user.lastName}` },
      { label: "Email",  value: user.email },
      { label: "Type",   value: String(loanType) },
      { label: "Amount", value: `${Number(amount).toLocaleString()}` },
      { label: "Term",   value: `${termMonths} months` },
      { label: "Date",   value: new Date().toLocaleString() },
    ], "A client submitted a loan application awaiting review.").catch(() => {})

    return NextResponse.json({
      loan: {
        _id:       String(loan._id),
        loanType:  loan.loanType,
        amount:    loan.amount,
        purpose:   loan.purpose,
        termMonths: loan.termMonths,
        status:    loan.status,
        appliedAt: loan.appliedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/loans]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
