import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connection"
import Account, { type IAccount } from "@/lib/models/Account"
import Transaction, { type ITransaction } from "@/lib/models/Transaction"
import Notification from "@/lib/models/Notification"
import KycDocument from "@/lib/models/KycDocument"
import DepositRequest from "@/lib/models/DepositRequest"
import LoanApplication from "@/lib/models/LoanApplication"
import CardApplication from "@/lib/models/CardApplication"
import Beneficiary from "@/lib/models/Beneficiary"
import { getMerchantCategory, type MerchantCategory } from "@/lib/utils/merchant-categories"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategorySpend {
  category: MerchantCategory
  amount:   number
  percent:  number
}

export interface MonthlyChartPoint {
  month:    string
  income:   number
  expenses: number
  net:      number
}

export interface PendingActions {
  hasPendingKyc:        boolean
  hasRejectedKyc:       boolean
  hasPendingDeposit:    boolean
  hasActiveLoans:       boolean
  unreadNotifications:  number
}

export interface LoanSummary {
  _id:                string
  amount:             number
  outstandingBalance: number
  monthlyPayment:     number
  nextPaymentDate:    string | null
  status:             string
  purpose:            string
  totalPaid:          number
}

export interface CardSummary {
  _id:            string
  cardNetwork:    string
  cardType:       string
  status:         string
  cardNumber:     string | null
  spendingLimit:  number | null
  balance:        number
}

export interface BeneficiarySummary {
  id:             string
  type:           "local" | "international"
  nickname:       string
  recipientName:  string | null
  accountNumber:  string | null
  bankName:       string | null
  lastUsedAt:     string | null
  transferCount:  number
}

export interface UserDashboardData {
  accounts:             SerializedAccount[]
  recentTransactions:   SerializedTransaction[]
  spendingThisMonth:    { total: number; byCategory: CategorySpend[] }
  incomeThisMonth:      number
  pendingActions:       PendingActions
  monthlyChart:         MonthlyChartPoint[]
  loans:                LoanSummary[]
  cards:                CardSummary[]
  beneficiaries:        BeneficiarySummary[]
}

export interface AccountDetail {
  _id:               string
  walletType:        "fiat" | "bitcoin"
  accountNumber:     string
  currency:          string
  balance:           number
  btcAddress:        string
  btcBalance:        number
  routingNumber:     string
  swiftCode:         string
  iban:              string
  isFrozen:          boolean
  freezeReason:      string
  createdAt:         string
  recentTransactions: SerializedTransaction[]
  totalDeposited:    number
  totalWithdrawn:    number
  transactionCount:  number
  accountAgeDays:    number
}

export interface SerializedAccount {
  _id:           string
  walletType:    "fiat" | "bitcoin"
  accountNumber: string
  currency:      string
  balance:       number
  btcAddress:    string
  btcBalance:    number
  routingNumber: string
  swiftCode:     string
  iban:          string
  isFrozen:      boolean
  freezeReason:  string
  createdAt:     string
}

export interface SerializedTransaction {
  _id:          string
  accountId:    string | { _id: string; currency: string; walletType: string; accountNumber?: string }
  userId:       string
  type:         string
  amount:       number
  currency:     string
  status:       string
  description:  string
  reference:    string
  createdAt:    string
}

export interface SpendingAnalytics {
  totalSpent:          number
  totalIncome:         number
  netFlow:             number
  byCategory:          Array<{
    category:          MerchantCategory
    amount:            number
    percent:           number
    transactionCount:  number
    trend:             "up" | "down" | "same"
  }>
  byDay:               Array<{ date: string; spent: number; income: number }>
  topMerchants:        Array<{ name: string; amount: number; count: number }>
  largestTransaction:  SerializedTransaction | null
}

// ── Expense / income type sets ────────────────────────────────────────────────

const EXPENSE_TYPES = ["withdrawal", "transfer_out", "fee", "swap_out", "loan_repayment"]
const INCOME_TYPES  = ["deposit", "admin_deposit", "transfer_in", "swap_in", "loan_disbursement", "refund"]

// ── Helper: serialize mongoose docs to plain objects ──────────────────────────

function serializeAccount(a: IAccount): SerializedAccount {
  return {
    _id:           a._id.toString(),
    walletType:    a.walletType,
    accountNumber: a.accountNumber,
    currency:      a.currency || "USD",
    balance:       a.balance,
    btcAddress:    a.btcAddress || "",
    btcBalance:    a.btcBalance,
    routingNumber: a.routingNumber || "",
    swiftCode:     a.swiftCode || "",
    iban:          a.iban || "",
    isFrozen:      a.isFrozen,
    freezeReason:  a.freezeReason || "",
    createdAt:     a.createdAt.toISOString(),
  }
}

function serializeTransaction(t: ITransaction): SerializedTransaction {
  const accountId = t.populated("accountId")
    ? {
        _id:           (t.accountId as unknown as IAccount)._id.toString(),
        currency:      (t.accountId as unknown as IAccount).currency,
        walletType:    (t.accountId as unknown as IAccount).walletType,
        accountNumber: (t.accountId as unknown as IAccount).accountNumber,
      }
    : t.accountId.toString()

  return {
    _id:         t._id.toString(),
    accountId,
    userId:      t.userId.toString(),
    type:        t.type,
    amount:      t.amount,
    currency:    t.currency,
    status:      t.status,
    description: t.description || "",
    reference:   t.reference,
    createdAt:   t.createdAt.toISOString(),
  }
}

// ── getUserDashboardData ──────────────────────────────────────────────────────

export async function getUserDashboardData(userId: string): Promise<UserDashboardData> {
  await connectDB()

  const uid = new mongoose.Types.ObjectId(userId)
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Get account IDs first
  const accounts = await Account.find({ userId: uid })
  const accountIds = accounts.map((a) => a._id)

  // Run all queries in parallel
  const [
    recentTxDocs,
    expenseAgg,
    incomeAgg,
    kycDocs,
    pendingDeposits,
    activeLoans,
    unreadCount,
    monthlyAgg,
    loanDocs,
    cardDocs,
    beneficiaryDocs,
  ] = await Promise.all([
    // Recent transactions
    Transaction.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("accountId", "currency walletType accountNumber"),

    // Spending this month
    Transaction.find({
      userId: uid,
      type: { $in: EXPENSE_TYPES },
      status: "completed",
      createdAt: { $gte: startOfMonth },
    }),

    // Income this month
    Transaction.aggregate([
      {
        $match: {
          userId: uid,
          type: { $in: INCOME_TYPES },
          status: "completed",
          createdAt: { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // KYC docs
    KycDocument.find({ userId: uid }),

    // Pending deposits
    DepositRequest.exists({ userId: uid, status: "pending" }),

    // Active loans
    LoanApplication.exists({ userId: uid, status: { $in: ["active", "approved"] } }),

    // Unread notifications
    Notification.countDocuments({ userId: uid, isRead: false }),

    // Monthly chart (last 6 months)
    Transaction.aggregate([
      {
        $match: {
          userId: uid,
          status: "completed",
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          income: {
            $sum: {
              $cond: [{ $in: ["$type", INCOME_TYPES] }, "$amount", 0],
            },
          },
          expenses: {
            $sum: {
              $cond: [{ $in: ["$type", EXPENSE_TYPES] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Loans
    LoanApplication.find({ userId: uid, status: { $in: ["active", "approved", "pending"] } }),

    // Cards
    CardApplication.find({ userId: uid, status: { $in: ["active", "pending", "approved", "frozen", "blocked"] } }),

    // Beneficiaries (for Quick Transfer)
    Beneficiary.find({ userId: uid, isActive: true })
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .limit(10)
      .lean(),
  ])

  // Process spending by category
  let spendingTotal = 0
  const categoryTotals: Record<MerchantCategory, number> = {} as Record<MerchantCategory, number>

  for (const tx of expenseAgg) {
    spendingTotal += tx.amount
    const cat = getMerchantCategory(tx.description, tx.type)
    categoryTotals[cat] = (categoryTotals[cat] || 0) + tx.amount
  }

  const byCategory: CategorySpend[] = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category: category as MerchantCategory,
      amount,
      percent: spendingTotal > 0 ? Math.round((amount / spendingTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Process monthly chart
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const monthlyChart: MonthlyChartPoint[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = d.getFullYear()
    const month = d.getMonth() + 1 // 1-indexed

    const match = (monthlyAgg as Array<{ _id: { year: number; month: number }; income: number; expenses: number }>)
      .find((m) => m._id.year === year && m._id.month === month)

    monthlyChart.push({
      month: MONTH_NAMES[month - 1],
      income: match?.income || 0,
      expenses: match?.expenses || 0,
      net: (match?.income || 0) - (match?.expenses || 0),
    })
  }

  // KYC status
  const hasPendingKyc = kycDocs.some((d) => d.status === "pending")
  const hasRejectedKyc = kycDocs.some((d) => d.status === "rejected")

  return {
    accounts: accounts.map(serializeAccount),
    recentTransactions: recentTxDocs.map(serializeTransaction),
    spendingThisMonth: { total: spendingTotal, byCategory },
    incomeThisMonth: incomeAgg[0]?.total || 0,
    pendingActions: {
      hasPendingKyc,
      hasRejectedKyc,
      hasPendingDeposit: !!pendingDeposits,
      hasActiveLoans: !!activeLoans,
      unreadNotifications: unreadCount,
    },
    monthlyChart,
    loans: loanDocs.map((l) => ({
      _id:                l._id.toString(),
      amount:             l.amount,
      outstandingBalance: l.outstandingBalance ?? 0,
      monthlyPayment:     l.monthlyPayment ?? 0,
      nextPaymentDate:    l.nextPaymentDate?.toISOString() ?? null,
      status:             l.status,
      purpose:            l.purpose,
      totalPaid:          l.totalPaid,
    })),
    cards: cardDocs.map((c) => ({
      _id:           c._id.toString(),
      cardNetwork:   (c as unknown as Record<string, unknown>).cardNetwork as string || "visa",
      cardType:      c.cardType,
      status:        c.status,
      cardNumber:    c.cardNumber || null,
      spendingLimit: c.spendingLimit ?? null,
      balance:       c.balance,
    })),
    beneficiaries: beneficiaryDocs.map((b) => ({
      id:            String(b._id),
      type:          b.type as "local" | "international",
      nickname:      b.nickname,
      recipientName: b.recipientName || null,
      accountNumber: b.accountNumber || null,
      bankName:      b.bankName || null,
      lastUsedAt:    b.lastUsedAt?.toISOString() || null,
      transferCount: b.transferCount,
    })),
  }
}

// ── getUserAccounts ───────────────────────────────────────────────────────────

export async function getUserAccounts(userId: string): Promise<AccountDetail[]> {
  await connectDB()

  const uid = new mongoose.Types.ObjectId(userId)
  const accounts = await Account.find({ userId: uid })

  const results: AccountDetail[] = []

  for (const account of accounts) {
    const [recentTx, depositAgg, withdrawAgg, txCount] = await Promise.all([
      Transaction.find({ accountId: account._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("accountId", "currency walletType accountNumber"),

      Transaction.aggregate([
        {
          $match: {
            accountId: account._id,
            type: { $in: INCOME_TYPES },
            status: "completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      Transaction.aggregate([
        {
          $match: {
            accountId: account._id,
            type: { $in: EXPENSE_TYPES },
            status: "completed",
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      Transaction.countDocuments({ accountId: account._id }),
    ])

    const ageDays = Math.floor(
      (Date.now() - new Date(account.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    )

    results.push({
      ...serializeAccount(account),
      recentTransactions: recentTx.map(serializeTransaction),
      totalDeposited:     depositAgg[0]?.total || 0,
      totalWithdrawn:     withdrawAgg[0]?.total || 0,
      transactionCount:   txCount,
      accountAgeDays:     ageDays,
    })
  }

  return results
}

// ── getUserTransactionFeed ────────────────────────────────────────────────────

export async function getUserTransactionFeed(
  userId: string,
  params: {
    page:      number
    limit:     number
    accountId?: string
    type?:     string
    dateFrom?: string
    dateTo?:   string
  }
): Promise<{ transactions: SerializedTransaction[]; total: number; hasMore: boolean }> {
  await connectDB()

  const uid = new mongoose.Types.ObjectId(userId)

  const filter: Record<string, unknown> = { userId: uid }

  if (params.accountId) {
    filter.accountId = new mongoose.Types.ObjectId(params.accountId)
  }
  if (params.type) {
    filter.type = params.type
  }
  if (params.dateFrom || params.dateTo) {
    const dateFilter: Record<string, Date> = {}
    if (params.dateFrom) dateFilter.$gte = new Date(params.dateFrom)
    if (params.dateTo) dateFilter.$lte = new Date(params.dateTo)
    filter.createdAt = dateFilter
  }

  const skip = (params.page - 1) * params.limit

  const [docs, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(params.limit)
      .populate("accountId", "currency walletType accountNumber"),
    Transaction.countDocuments(filter),
  ])

  return {
    transactions: docs.map(serializeTransaction),
    total,
    hasMore: skip + docs.length < total,
  }
}

// ── getSpendingAnalytics ──────────────────────────────────────────────────────

export async function getSpendingAnalytics(
  userId: string,
  period: "7d" | "30d" | "90d"
): Promise<SpendingAnalytics> {
  await connectDB()

  const uid = new mongoose.Types.ObjectId(userId)
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  const prevSince = new Date(since.getTime() - days * 24 * 60 * 60 * 1000)

  const [expenseDocs, incomeDocs, prevExpenseDocs] = await Promise.all([
    Transaction.find({
      userId: uid,
      type: { $in: EXPENSE_TYPES },
      status: "completed",
      createdAt: { $gte: since },
    }).sort({ createdAt: -1 }),

    Transaction.find({
      userId: uid,
      type: { $in: INCOME_TYPES },
      status: "completed",
      createdAt: { $gte: since },
    }),

    // Previous period for trend comparison
    Transaction.find({
      userId: uid,
      type: { $in: EXPENSE_TYPES },
      status: "completed",
      createdAt: { $gte: prevSince, $lt: since },
    }),
  ])

  let totalSpent = 0
  let totalIncome = 0
  const categoryMap: Record<MerchantCategory, { amount: number; count: number }> = {} as never
  const prevCategoryMap: Record<MerchantCategory, number> = {} as never
  const merchantMap: Record<string, { amount: number; count: number }> = {}
  const dayMap: Record<string, { spent: number; income: number }> = {}
  let largestTx: ITransaction | null = null

  // Process expenses
  for (const tx of expenseDocs) {
    totalSpent += tx.amount
    const cat = getMerchantCategory(tx.description, tx.type)

    if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 }
    categoryMap[cat].amount += tx.amount
    categoryMap[cat].count++

    const merchant = tx.description || tx.type.replace(/_/g, " ")
    if (!merchantMap[merchant]) merchantMap[merchant] = { amount: 0, count: 0 }
    merchantMap[merchant].amount += tx.amount
    merchantMap[merchant].count++

    const dateKey = tx.createdAt.toISOString().slice(0, 10)
    if (!dayMap[dateKey]) dayMap[dateKey] = { spent: 0, income: 0 }
    dayMap[dateKey].spent += tx.amount

    if (!largestTx || tx.amount > largestTx.amount) largestTx = tx
  }

  // Process income
  for (const tx of incomeDocs) {
    totalIncome += tx.amount
    const dateKey = tx.createdAt.toISOString().slice(0, 10)
    if (!dayMap[dateKey]) dayMap[dateKey] = { spent: 0, income: 0 }
    dayMap[dateKey].income += tx.amount
  }

  // Previous period categories
  for (const tx of prevExpenseDocs) {
    const cat = getMerchantCategory(tx.description, tx.type)
    prevCategoryMap[cat] = (prevCategoryMap[cat] || 0) + tx.amount
  }

  // Build category array with trends
  const byCategory = Object.entries(categoryMap)
    .map(([cat, data]) => {
      const prev = prevCategoryMap[cat as MerchantCategory] || 0
      let trend: "up" | "down" | "same" = "same"
      if (data.amount > prev * 1.05) trend = "up"
      else if (data.amount < prev * 0.95) trend = "down"

      return {
        category: cat as MerchantCategory,
        amount: data.amount,
        percent: totalSpent > 0 ? Math.round((data.amount / totalSpent) * 1000) / 10 : 0,
        transactionCount: data.count,
        trend,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  // By day
  const byDay = Object.entries(dayMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Top merchants
  const topMerchants = Object.entries(merchantMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  return {
    totalSpent,
    totalIncome,
    netFlow: totalIncome - totalSpent,
    byCategory,
    byDay,
    topMerchants,
    largestTransaction: largestTx ? serializeTransaction(largestTx) : null,
  }
}
