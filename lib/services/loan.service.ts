import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import LoanApplication   from "@/lib/models/LoanApplication"
import Account           from "@/lib/models/Account"
import Transaction       from "@/lib/models/Transaction"
import User              from "@/lib/models/User"
import { createAuditLog } from "@/lib/services/auth.service"
import { notifyUser }    from "@/lib/services/deposit.service"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoanListItem {
  id:               string
  userId:           string
  userName:         string
  userEmail:        string
  userKycStatus:    string
  userIsSuspended:  boolean
  loanType:         string
  amount:           number
  purpose:          string
  termMonths:       number
  status:           string
  interestRate?:    number
  monthlyPayment?:  number
  outstandingBalance?: number
  totalPaid:        number
  nextPaymentDate?: string
  adminNote?:       string
  employmentStatus?: string
  monthlyIncome?:   number
  appliedAt:        string
  approvedAt?:      string
  rejectedAt?:      string
  closedAt?:        string
  isOverdue:        boolean
  daysOverdue:      number
  paidPercent:      number
}

export interface LoanDetail extends LoanListItem {
  userFirstName: string
  userLastName:  string
  userPhone?:    string
  primaryAccount?: {
    id:            string
    balance:       number
    currency:      string
    accountNumber: string
  }
  repaymentTransactions: Array<{
    id:        string
    amount:    number
    createdAt: string
    reference: string
  }>
}

export interface LoanStats {
  pendingCount:     number
  approvedCount:    number
  rejectedCount:    number
  activeCount:      number
  closedCount:      number
  defaultedCount:   number
  totalDisbursed:   number
  totalOutstanding: number
}

export interface GetLoanParams {
  page?:       number
  limit?:      number
  status?:     string
  userId?:     string
  dateFrom?:   string
  dateTo?:     string
  amountMin?:  number
  amountMax?:  number
  sortBy?:     string
  sortOrder?:  "asc" | "desc"
}

export interface LoanApprovalData {
  interestRate:   number
  approvedAmount: number
  termMonths:     number
  adminNote?:     string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return Math.round((principal / termMonths) * 100) / 100
  const r = annualRate / 100 / 12
  const mp = principal * r / (1 - Math.pow(1 + r, -termMonths))
  return Math.round(mp * 100) / 100
}

async function generateRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref    = `TXN-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique reference")
}

function isOverdueCalc(nextPaymentDate?: Date, status?: string): { isOverdue: boolean; daysOverdue: number } {
  if (status !== "active" || !nextPaymentDate) return { isOverdue: false, daysOverdue: 0 }
  const diff = Date.now() - nextPaymentDate.getTime()
  if (diff <= 0) return { isOverdue: false, daysOverdue: 0 }
  return { isOverdue: true, daysOverdue: Math.floor(diff / 86_400_000) }
}

function buildLoanMatch(params: GetLoanParams): Record<string, unknown> {
  const match: Record<string, unknown> = {}
  if (params.status)   match.status = params.status
  if (params.userId && mongoose.Types.ObjectId.isValid(params.userId))
    match.userId = new mongoose.Types.ObjectId(params.userId)
  if (params.dateFrom || params.dateTo) {
    const range: Record<string, Date> = {}
    if (params.dateFrom) range.$gte = new Date(params.dateFrom)
    if (params.dateTo)   range.$lte = new Date(params.dateTo)
    match.appliedAt = range
  }
  if (params.amountMin != null || params.amountMax != null) {
    const range: Record<string, number> = {}
    if (params.amountMin != null) range.$gte = params.amountMin
    if (params.amountMax != null) range.$lte = params.amountMax
    match.amount = range
  }
  return match
}

function serializeLoan(
  doc: Record<string, unknown>,
  user: Record<string, unknown>,
): LoanListItem {
  const nextPayment = doc.nextPaymentDate as Date | undefined
  const { isOverdue, daysOverdue } = isOverdueCalc(nextPayment, doc.status as string)
  const amount    = (doc.amount as number) ?? 0
  const totalPaid = (doc.totalPaid as number) ?? 0
  return {
    id:               String(doc._id),
    userId:           String(doc.userId),
    userName:         `${user.firstName} ${user.lastName}`,
    userEmail:        user.email as string,
    userKycStatus:    user.kycStatus as string,
    userIsSuspended:  user.isSuspended as boolean,
    loanType:         (doc.loanType as string) || "personal",
    amount,
    purpose:          doc.purpose as string,
    termMonths:       doc.termMonths as number,
    status:           doc.status as string,
    interestRate:     doc.interestRate as number | undefined,
    monthlyPayment:   doc.monthlyPayment as number | undefined,
    outstandingBalance: doc.outstandingBalance as number | undefined,
    totalPaid,
    nextPaymentDate:  nextPayment?.toISOString(),
    adminNote:        doc.adminNote as string | undefined,
    employmentStatus: doc.employmentStatus as string | undefined,
    monthlyIncome:    doc.monthlyIncome as number | undefined,
    appliedAt:        (doc.appliedAt as Date).toISOString(),
    approvedAt:       (doc.approvedAt as Date | undefined)?.toISOString(),
    rejectedAt:       (doc.rejectedAt as Date | undefined)?.toISOString(),
    closedAt:         (doc.closedAt  as Date | undefined)?.toISOString(),
    isOverdue,
    daysOverdue,
    paidPercent:      amount > 0 ? Math.min(100, (totalPaid / amount) * 100) : 0,
  }
}

// ── getLoanApplications ────────────────────────────────────────────────────────

export async function getLoanApplications(
  params: GetLoanParams
): Promise<{ loans: LoanListItem[]; total: number; pages: number; stats: LoanStats }> {
  await connectDB()

  const page  = Math.max(1,   params.page  ?? 1)
  const limit = Math.min(100, params.limit ?? 20)
  const skip  = (page - 1) * limit
  const match = buildLoanMatch(params)

  const sortField = params.sortBy === "amount" ? "amount" : params.sortBy === "termMonths" ? "termMonths" : "appliedAt"
  const sortDir   = params.sortOrder === "asc" ? 1 : -1

  const [docs, total, aggStats] = await Promise.all([
    LoanApplication.find(match)
      .populate({ path: "userId", model: User, select: "firstName lastName email kycStatus isSuspended phone" })
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),

    LoanApplication.countDocuments(match),

    LoanApplication.aggregate([
      { $match: match },
      { $group: {
        _id:             null,
        pendingCount:    { $sum: { $cond: [{ $eq: ["$status", "pending"]   }, 1, 0] } },
        approvedCount:   { $sum: { $cond: [{ $eq: ["$status", "approved"]  }, 1, 0] } },
        rejectedCount:   { $sum: { $cond: [{ $eq: ["$status", "rejected"]  }, 1, 0] } },
        activeCount:     { $sum: { $cond: [{ $eq: ["$status", "active"]    }, 1, 0] } },
        closedCount:     { $sum: { $cond: [{ $eq: ["$status", "closed"]    }, 1, 0] } },
        defaultedCount:  { $sum: { $cond: [{ $eq: ["$status", "defaulted"] }, 1, 0] } },
        totalDisbursed:  { $sum: { $cond: [{ $in: ["$status", ["active", "closed", "defaulted"]] }, "$amount", 0] } },
        totalOutstanding:{ $sum: { $ifNull: ["$outstandingBalance", 0] } },
      }},
    ]),
  ])

  const s = aggStats[0] ?? {}
  const stats: LoanStats = {
    pendingCount:     s.pendingCount    ?? 0,
    approvedCount:    s.approvedCount   ?? 0,
    rejectedCount:    s.rejectedCount   ?? 0,
    activeCount:      s.activeCount     ?? 0,
    closedCount:      s.closedCount     ?? 0,
    defaultedCount:   s.defaultedCount  ?? 0,
    totalDisbursed:   s.totalDisbursed  ?? 0,
    totalOutstanding: s.totalOutstanding ?? 0,
  }

  const loans = docs.map((doc) => {
    const rawDoc  = doc as unknown as Record<string, unknown>
    const rawUser = (rawDoc.userId ?? {}) as Record<string, unknown>
    return serializeLoan(rawDoc, rawUser)
  })

  return { loans, total, pages: Math.ceil(total / limit), stats }
}

// ── getLoanById ───────────────────────────────────────────────────────────────

export async function getLoanById(id: string): Promise<LoanDetail | null> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const doc = await LoanApplication.findById(id)
    .populate({ path: "userId", model: User, select: "firstName lastName email phone kycStatus isSuspended" })
    .lean()
  if (!doc) return null

  const rawDoc  = doc  as unknown as Record<string, unknown>
  const rawUser = (rawDoc.userId ?? {}) as Record<string, unknown>
  const base    = serializeLoan(rawDoc, rawUser)

  // After populate, userId is the user object - get _id from it
  const userIdStr = rawUser._id ? String(rawUser._id) : String(rawDoc.userId)

  const account = await Account.findOne({
    userId:     new mongoose.Types.ObjectId(userIdStr),
    walletType: "fiat",
  }).lean()

  const repayments = await Transaction.find({
    userId: new mongoose.Types.ObjectId(userIdStr),
    type:   "loan_repayment",
    "metadata.loanId": String(rawDoc._id),
  }).sort({ createdAt: -1 }).limit(50).lean()

  const detail: LoanDetail = {
    ...base,
    userFirstName: rawUser.firstName as string,
    userLastName:  rawUser.lastName  as string,
    userPhone:     rawUser.phone     as string | undefined,
    primaryAccount: account ? {
      id:            String(account._id),
      balance:       account.balance / 100,
      currency:      account.currency,
      accountNumber: account.accountNumber,
    } : undefined,
    repaymentTransactions: repayments.map((t) => ({
      id:        String(t._id),
      amount:    t.amount,
      createdAt: (t.createdAt as unknown as Date).toISOString(),
      reference: t.reference,
    })),
  }

  return detail
}

// ── approveLoan ───────────────────────────────────────────────────────────────

export async function approveLoan(
  loanId:       string,
  data:         LoanApprovalData,
  adminId:      string,
  adminEmail:   string,
  req?:         Request
): Promise<{ loan: Record<string, unknown>; transaction: Record<string, unknown> }> {
  await connectDB()

  const { interestRate, approvedAmount, termMonths, adminNote } = data

  if (interestRate < 0 || interestRate > 100) throw new Error("Interest rate must be 0–100")
  if (approvedAmount <= 0)                    throw new Error("Approved amount must be greater than 0")
  if (termMonths < 1 || termMonths > 360)     throw new Error("Term must be 1–360 months")

  const loan = await LoanApplication.findById(loanId)
  if (!loan)                       throw new Error("Loan application not found")
  if (loan.status !== "pending")   throw new Error("Loan is not in pending status")

  const account = await Account.findOne({
    userId:     loan.userId,
    walletType: "fiat",
  })
  if (!account) throw new Error("User has no primary fiat account")

  // Check KYC and suspension
  const User = (await import("@/lib/models/User")).default
  const user = await User.findById(loan.userId).lean()
  if (!user) throw new Error("User not found")
  if (user.isSuspended) throw new Error("Cannot approve loan for a suspended user")
  if (user.kycStatus !== "verified") throw new Error("User KYC must be verified before approving a loan")

  const monthlyPayment  = computeMonthlyPayment(approvedAmount, interestRate, termMonths)
  const nextPaymentDate = new Date(Date.now() + 30 * 86_400_000)

  const session = await mongoose.startSession()
  let updatedLoan:        Record<string, unknown>
  let createdTransaction: Record<string, unknown>

  try {
    session.startTransaction()

    // 1. Update loan
    const updated = await LoanApplication.findByIdAndUpdate(
      loanId,
      {
        status:             "active",
        interestRate,
        amount:             approvedAmount,
        termMonths,
        monthlyPayment,
        outstandingBalance: approvedAmount,
        totalPaid:          0,
        nextPaymentDate,
        reviewedBy:         new mongoose.Types.ObjectId(adminId),
        approvedAt:         new Date(),
        ...(adminNote ? { adminNote } : {}),
      },
      { new: true, session }
    )
    if (!updated) throw new Error("Failed to update loan")
    updatedLoan = updated.toObject() as unknown as Record<string, unknown>

    // 2. Credit account
    await Account.findByIdAndUpdate(
      account._id,
      { $inc: { balance: Math.round(approvedAmount * 100) } },
      { session }
    )

    // 3. Create disbursement transaction
    const reference = await generateRef()
    const [tx] = await Transaction.create([{
      accountId:   account._id,
      userId:      loan.userId,
      type:        "loan_disbursement",
      amount:      Math.round(approvedAmount * 100),
      currency:    account.currency,
      status:      "completed",
      description: `Loan disbursement — ${termMonths} month term at ${interestRate}% APR`,
      reference,
      processedAt: new Date(),
      metadata:    { loanId, interestRate, termMonths, monthlyPayment },
    }], { session })
    createdTransaction = tx.toObject() as unknown as Record<string, unknown>

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    await session.endSession()
  }

  await createAuditLog(adminId, adminEmail, "loan.approve", "LoanApplication", loanId, {
    approvedAmount, interestRate, termMonths, monthlyPayment,
  }, req)

  await notifyUser(
    String(loan.userId),
    "loan",
    "Loan approved",
    `Your loan of $${approvedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} has been approved and credited to your account.`,
    { loanId }
  )

  return { loan: updatedLoan, transaction: createdTransaction }
}

// ── rejectLoan ────────────────────────────────────────────────────────────────

export async function rejectLoan(
  loanId:     string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const loan = await LoanApplication.findById(loanId)
  if (!loan)                     throw new Error("Loan application not found")
  if (loan.status !== "pending") throw new Error("Loan is not in pending status")

  const updated = await LoanApplication.findByIdAndUpdate(
    loanId,
    {
      status:     "rejected",
      adminNote:  reason,
      reviewedBy: new mongoose.Types.ObjectId(adminId),
      rejectedAt: new Date(),
    },
    { new: true }
  )

  await createAuditLog(adminId, adminEmail, "loan.reject", "LoanApplication", loanId, { reason }, req)
  await notifyUser(
    String(loan.userId), "loan", "Loan application declined",
    `Your loan application has been declined. Reason: ${reason}`, { loanId }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── closeLoan ─────────────────────────────────────────────────────────────────

export async function closeLoan(
  loanId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const loan = await LoanApplication.findById(loanId)
  if (!loan)                    throw new Error("Loan application not found")
  if (loan.status !== "active") throw new Error("Loan is not active")

  const updated = await LoanApplication.findByIdAndUpdate(
    loanId, { status: "closed", closedAt: new Date() }, { new: true }
  )

  await createAuditLog(adminId, adminEmail, "loan.close", "LoanApplication", loanId, {}, req)
  await notifyUser(String(loan.userId), "loan", "Loan closed", "Your loan has been marked as closed.", { loanId })

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── markLoanDefaulted ─────────────────────────────────────────────────────────

export async function markLoanDefaulted(
  loanId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const loan = await LoanApplication.findById(loanId)
  if (!loan)                    throw new Error("Loan application not found")
  if (loan.status !== "active") throw new Error("Loan is not active")

  const updated = await LoanApplication.findByIdAndUpdate(
    loanId, { status: "defaulted" }, { new: true }
  )

  await createAuditLog(adminId, adminEmail, "loan.default", "LoanApplication", loanId, {}, req)
  await notifyUser(
    String(loan.userId), "loan", "Loan defaulted",
    "Your loan has been marked as defaulted. Please contact support.", { loanId }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── recordLoanPayment ─────────────────────────────────────────────────────────

export async function recordLoanPayment(
  loanId:        string,
  paymentAmount: number,
  adminId:       string,
  adminEmail:    string,
  req?:          Request
): Promise<{ loan: Record<string, unknown>; transaction: Record<string, unknown> }> {
  await connectDB()

  const loan = await LoanApplication.findById(loanId)
  if (!loan)                    throw new Error("Loan application not found")
  if (loan.status !== "active") throw new Error("Loan is not active")

  const outstanding = loan.outstandingBalance ?? loan.amount
  if (paymentAmount <= 0)              throw new Error("Payment amount must be positive")
  if (paymentAmount > outstanding)     throw new Error("Payment exceeds outstanding balance")

  const account = await Account.findOne({ userId: loan.userId, walletType: "fiat" })
  if (!account) throw new Error("User has no fiat account")
  if (account.balance < Math.round(paymentAmount * 100))
    throw new Error("Insufficient account balance for this payment")

  const newOutstanding = Math.max(0, outstanding - paymentAmount)
  const willClose      = newOutstanding <= 0
  const nextPayment    = new Date(Date.now() + 30 * 86_400_000)

  const session = await mongoose.startSession()
  let updatedLoan:        Record<string, unknown>
  let createdTransaction: Record<string, unknown>

  try {
    session.startTransaction()

    // 1. Debit account
    await Account.findByIdAndUpdate(
      account._id,
      { $inc: { balance: -Math.round(paymentAmount * 100) } },
      { session }
    )

    // 2. Insert repayment transaction
    const reference = await generateRef()
    const [tx] = await Transaction.create([{
      accountId:   account._id,
      userId:      loan.userId,
      type:        "loan_repayment",
      amount:      Math.round(paymentAmount * 100),
      currency:    account.currency,
      status:      "completed",
      description: `Loan repayment — $${paymentAmount.toFixed(2)}`,
      reference,
      processedAt: new Date(),
      metadata:    { loanId, balanceAdjusted: true },
    }], { session })
    createdTransaction = tx.toObject() as unknown as Record<string, unknown>

    // 3. Update loan
    const loanUpdate: Record<string, unknown> = {
      outstandingBalance: newOutstanding,
      $inc: { totalPaid: paymentAmount },
      nextPaymentDate: nextPayment,
    }
    if (willClose) {
      loanUpdate.status    = "closed"
      loanUpdate.closedAt  = new Date()
    }
    const updated = await LoanApplication.findByIdAndUpdate(loanId, loanUpdate, { new: true, session })
    updatedLoan = updated!.toObject() as unknown as Record<string, unknown>

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    await session.endSession()
  }

  await createAuditLog(adminId, adminEmail, "loan.payment_recorded", "LoanApplication", loanId, { paymentAmount }, req)
  await notifyUser(
    String(loan.userId), "loan", "Loan payment recorded",
    `A payment of $${paymentAmount.toFixed(2)} has been recorded on your loan.`, { loanId }
  )

  return { loan: updatedLoan, transaction: createdTransaction }
}
