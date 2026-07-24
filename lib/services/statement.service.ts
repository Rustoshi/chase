import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connection"
import Statement, { IStatement, StatementFormat } from "@/lib/models/Statement"
import Transaction, { ITransaction } from "@/lib/models/Transaction"
import Account, { IAccount } from "@/lib/models/Account"
import User, { IUser } from "@/lib/models/User"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RequestStatementParams {
  userId: string
  accountId: string
  startDate: Date
  endDate: Date
  format?: StatementFormat
  sendEmail?: boolean
}

export interface StatementSummary {
  _id: string
  referenceNumber: string
  accountNumber: string
  accountType: string
  currency: string
  startDate: string
  endDate: string
  format: StatementFormat
  status: string
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
  transactionCount: number
  requestedAt: string
  generatedAt?: string
  expiresAt?: string
  downloadCount: number
}

export interface StatementTransaction {
  date: string
  description: string
  reference: string
  type: string
  debit: number | null
  credit: number | null
  balance: number
}

export interface StatementData {
  statement: IStatement
  account: IAccount
  user: IUser
  transactions: StatementTransaction[]
}

// ── Reference generation ──────────────────────────────────────────────────────

function generateStatementRef(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const random = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
  return `STM-${random}`
}

// ── Credit types ──────────────────────────────────────────────────────────────

const CREDIT_TYPES = new Set([
  "deposit", "admin_deposit", "transfer_in", "swap_in", "refund",
  "loan_disbursement", "tax_refund_deposit", "grant_disbursement",
])

// ── Request Statement ─────────────────────────────────────────────────────────

export async function requestStatement(params: RequestStatementParams): Promise<IStatement> {
  await connectDB()

  const { userId, accountId, startDate, endDate, format = "pdf", sendEmail = false } = params

  // Validate account ownership
  const account = await Account.findOne({
    _id: new mongoose.Types.ObjectId(accountId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean()

  if (!account) {
    throw new Error("Account not found or access denied")
  }

  // Validate date range
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  // Normalize dates to start of day for comparison
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())
  const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (startDay > endDay) {
    throw new Error("Start date must be before end date")
  }

  if (endDay > todayDay) {
    throw new Error("End date cannot be in the future")
  }

  // Max 1 year range
  const oneYear = 365 * 24 * 60 * 60 * 1000
  if (end.getTime() - start.getTime() > oneYear) {
    throw new Error("Statement period cannot exceed 1 year")
  }

  // Generate unique reference
  let referenceNumber: string
  let attempts = 0
  do {
    referenceNumber = generateStatementRef()
    const existing = await Statement.findOne({ referenceNumber }).lean()
    if (!existing) break
    attempts++
  } while (attempts < 10)

  if (attempts >= 10) {
    throw new Error("Failed to generate unique reference")
  }

  // Calculate statement data
  const statementData = await calculateStatementData(userId, accountId, start, end)

  // Create statement record
  const statement = await Statement.create({
    userId: new mongoose.Types.ObjectId(userId),
    accountId: new mongoose.Types.ObjectId(accountId),
    referenceNumber,
    startDate: start,
    endDate: end,
    format,
    status: "ready", // For now, generate immediately
    openingBalance: statementData.openingBalance,
    closingBalance: statementData.closingBalance,
    totalCredits: statementData.totalCredits,
    totalDebits: statementData.totalDebits,
    transactionCount: statementData.transactionCount,
    requestedAt: new Date(),
    generatedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    emailSent: sendEmail,
  })

  return statement
}

// ── Calculate Statement Data ──────────────────────────────────────────────────

async function calculateStatementData(
  userId: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
  transactionCount: number
}> {
  // Get all transactions before start date to calculate opening balance
  const priorTransactions = await Transaction.find({
    accountId: new mongoose.Types.ObjectId(accountId),
    userId: new mongoose.Types.ObjectId(userId),
    status: "completed",
    createdAt: { $lt: startDate },
  }).lean()

  let openingBalance = 0
  for (const tx of priorTransactions) {
    const isCredit = CREDIT_TYPES.has(tx.type)
    openingBalance += isCredit ? tx.amount : -tx.amount
  }

  // Get transactions in the statement period
  const periodTransactions = await Transaction.find({
    accountId: new mongoose.Types.ObjectId(accountId),
    userId: new mongoose.Types.ObjectId(userId),
    status: "completed",
    createdAt: { $gte: startDate, $lte: endDate },
  }).lean()

  let totalCredits = 0
  let totalDebits = 0

  for (const tx of periodTransactions) {
    const isCredit = CREDIT_TYPES.has(tx.type)
    if (isCredit) {
      totalCredits += tx.amount
    } else {
      totalDebits += tx.amount
    }
  }

  const closingBalance = openingBalance + totalCredits - totalDebits

  return {
    openingBalance,
    closingBalance,
    totalCredits,
    totalDebits,
    transactionCount: periodTransactions.length,
  }
}

// ── Get User Statements ───────────────────────────────────────────────────────

export async function getUserStatements(
  userId: string,
  options: { page?: number; limit?: number; accountId?: string } = {}
): Promise<{ statements: StatementSummary[]; total: number; page: number; totalPages: number }> {
  await connectDB()

  const { page = 1, limit = 10, accountId } = options

  const query: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(userId),
  }

  if (accountId) {
    query.accountId = new mongoose.Types.ObjectId(accountId)
  }

  const [statements, total] = await Promise.all([
    Statement.find(query)
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Statement.countDocuments(query),
  ])

  // Get account details for each statement
  const accountIds = [...new Set(statements.map((s) => String(s.accountId)))]
  const accounts = await Account.find({
    _id: { $in: accountIds.map((id) => new mongoose.Types.ObjectId(id)) },
  }).lean()

  const accountMap = new Map(accounts.map((a) => [String(a._id), a]))

  const summaries: StatementSummary[] = statements.map((s) => {
    const account = accountMap.get(String(s.accountId))
    return {
      _id: String(s._id),
      referenceNumber: s.referenceNumber,
      accountNumber: account?.accountNumber || "Unknown",
      accountType: account?.walletType || "fiat",
      currency: account?.currency || "USD",
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
      format: s.format,
      status: s.status,
      openingBalance: s.openingBalance,
      closingBalance: s.closingBalance,
      totalCredits: s.totalCredits,
      totalDebits: s.totalDebits,
      transactionCount: s.transactionCount,
      requestedAt: s.requestedAt.toISOString(),
      generatedAt: s.generatedAt?.toISOString(),
      expiresAt: s.expiresAt?.toISOString(),
      downloadCount: s.downloadCount,
    }
  })

  return {
    statements: summaries,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ── Get Statement by ID ───────────────────────────────────────────────────────

export async function getStatementById(
  userId: string,
  statementId: string
): Promise<StatementSummary | null> {
  await connectDB()

  const statement = await Statement.findOne({
    _id: new mongoose.Types.ObjectId(statementId),
    userId: new mongoose.Types.ObjectId(userId),
  }).lean()

  if (!statement) return null

  const account = await Account.findById(statement.accountId).lean()

  return {
    _id: String(statement._id),
    referenceNumber: statement.referenceNumber,
    accountNumber: account?.accountNumber || "Unknown",
    accountType: account?.walletType || "fiat",
    currency: account?.currency || "USD",
    startDate: statement.startDate.toISOString(),
    endDate: statement.endDate.toISOString(),
    format: statement.format,
    status: statement.status,
    openingBalance: statement.openingBalance,
    closingBalance: statement.closingBalance,
    totalCredits: statement.totalCredits,
    totalDebits: statement.totalDebits,
    transactionCount: statement.transactionCount,
    requestedAt: statement.requestedAt.toISOString(),
    generatedAt: statement.generatedAt?.toISOString(),
    expiresAt: statement.expiresAt?.toISOString(),
    downloadCount: statement.downloadCount,
  }
}

// ── Get Statement Data for PDF Generation ─────────────────────────────────────

export async function getStatementData(
  userId: string,
  statementId: string
): Promise<StatementData | null> {
  await connectDB()

  const statement = await Statement.findOne({
    _id: new mongoose.Types.ObjectId(statementId),
    userId: new mongoose.Types.ObjectId(userId),
  })

  if (!statement) return null

  const [account, user] = await Promise.all([
    Account.findById(statement.accountId).lean(),
    User.findById(userId).lean(),
  ])

  if (!account || !user) return null

  // Get transactions for the period
  const rawTransactions = await Transaction.find({
    accountId: statement.accountId,
    userId: new mongoose.Types.ObjectId(userId),
    status: "completed",
    createdAt: { $gte: statement.startDate, $lte: statement.endDate },
  })
    .sort({ createdAt: 1 })
    .lean()

  // Calculate running balance
  let runningBalance = statement.openingBalance
  const transactions: StatementTransaction[] = rawTransactions.map((tx) => {
    const isCredit = CREDIT_TYPES.has(tx.type)
    const amount = tx.amount

    if (isCredit) {
      runningBalance += amount
    } else {
      runningBalance -= amount
    }

    return {
      date: tx.createdAt.toISOString(),
      description: tx.description || tx.type.replace(/_/g, " "),
      reference: tx.reference,
      type: tx.type,
      debit: isCredit ? null : amount,
      credit: isCredit ? amount : null,
      balance: runningBalance,
    }
  })

  // Increment download count
  await Statement.findByIdAndUpdate(statementId, { $inc: { downloadCount: 1 } })

  return {
    statement,
    account: account as IAccount,
    user: user as IUser,
    transactions,
  }
}

// ── Get User Accounts for Statement Request ───────────────────────────────────

export async function getUserAccountsForStatement(userId: string): Promise<Array<{
  _id: string
  accountNumber: string
  walletType: string
  currency: string
  balance: number
}>> {
  await connectDB()

  const accounts = await Account.find({
    userId: new mongoose.Types.ObjectId(userId),
    walletType: "fiat", // Only fiat accounts for now
  }).lean()

  return accounts.map((a) => ({
    _id: String(a._id),
    accountNumber: a.accountNumber,
    walletType: a.walletType,
    currency: a.currency,
    balance: a.balance,
  }))
}
