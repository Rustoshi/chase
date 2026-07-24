import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import Transaction       from "@/lib/models/Transaction"
import Account           from "@/lib/models/Account"
import CardApplication   from "@/lib/models/CardApplication"
import CardTransaction   from "@/lib/models/CardTransaction"
import { createAuditLog } from "@/lib/services/auth.service"
import { SeededRandom }  from "@/lib/utils/random"
import { PERSONAS, type PersonaKey, type PersonaDef, type ExpenseCategory } from "@/lib/constants/personas"

// Re-export for backwards compatibility
export { PERSONAS, type PersonaKey, type PersonaDef, type ExpenseCategory }

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerateHistoryParams {
  userId:              string
  accountId:           string
  persona:             PersonaKey
  months:              number
  startingBalance:     number
  includeTransfers:    boolean
  includeBitcoinSwaps: boolean
  seed?:               number
  adminId:             string
  adminEmail:          string
  req?:                Request
}

export interface MonthBreakdown {
  month:    string
  income:   number
  expenses: number
  net:      number
}

export interface GenerateHistoryResult {
  transactionsCreated: number
  finalBalance:        number
  incomeTotal:         number
  expensesTotal:       number
  skippedCount:        number
  monthBreakdown:      MonthBreakdown[]
}

export interface GenerateBtcHistoryParams {
  userId:             string
  btcAccountId:       string
  months:             number
  startingBtcBalance: number
  includeSwaps:       boolean
  seed?:              number
  adminId:            string
  adminEmail:         string
  req?:               Request
}

export interface GenerateBtcHistoryResult {
  transactionsCreated: number
  finalBtcBalance:     number
  skippedCount:        number
}

export interface GenerationPreview {
  estimatedTransactions:     number
  estimatedFinalBalance:     number
  estimatedMonthlyAvgIncome: number
  estimatedMonthlyAvgExpenses: number
  topMerchants:              string[]
  incomeSourceSamples:       string[]
  sampleTransactions: Array<{
    description: string
    amount:      number
    type:        string
    dayOffset:   number
  }>
}

// ── Subscription merchants → always use exact prices ─────────────────────────

const SUBSCRIPTION_MERCHANTS = new Set([
  "Spotify", "Netflix", "Hulu", "Disney+", "Apple One", "YouTube Premium", "Amazon Prime",
  "Adobe Creative", "Adobe Creative Cloud", "Figma", "Dropbox", "GitHub", "Notion",
  "New York Times", "WSJ", "LastPass", "1Password", "Mailchimp", "Canva Pro",
  "Chegg", "Coursera",
])
const SUBSCRIPTION_PRICES = [4.99, 7.99, 8.99, 9.99, 10.99, 12.99, 13.99, 14.99, 15.99, 17.99, 19.99, 24.99, 29.99]

// ── Amount helpers ────────────────────────────────────────────────────────────

function realisticAmount(rng: SeededRandom, min: number, max: number, merchant?: string): number {
  if (merchant && SUBSCRIPTION_MERCHANTS.has(merchant)) {
    const valid = SUBSCRIPTION_PRICES.filter((p) => p >= min && p <= max)
    if (valid.length > 0) return rng.pick(valid)
  }
  const base = rng.float(min, max)
  if (base >= 500 && rng.chance(0.65))  return Math.round(base / 100) * 100
  if (base >= 100 && rng.chance(0.40))  return Math.round(base / 50) * 50
  const intPart = Math.floor(base)
  const cents   = rng.pick([0, 25, 49, 50, 75, 95, 99] as const)
  return Math.round((intPart + cents / 100) * 100) / 100
}

// ── Timestamp helpers ─────────────────────────────────────────────────────────

function weightedHour(rng: SeededRandom): number {
  const r = rng.next()
  if (r < 0.10) return rng.int(8,  9)  // morning coffee
  if (r < 0.25) return rng.int(12, 13) // lunch
  if (r < 0.45) return rng.int(17, 19) // post-work
  if (r < 0.65) return rng.int(19, 21) // evening
  return rng.int(7, 22)                 // random
}

function timestampInPeriod(
  rng:   SeededRandom,
  start: number,
  end:   number
): Date {
  const range   = end - start
  const offset  = Math.floor(rng.next() * range)
  const d       = new Date(start + offset)
  d.setHours(weightedHour(rng), rng.int(0, 59), rng.int(0, 59), rng.int(0, 999))
  return d
}

function incomeTimestamps(
  rng:       SeededRandom,
  frequency: string,
  start:     number,
  end:       number
): number[] {
  const daysMs    = 86_400_000
  const periodMs  = end - start
  const daysTotal = Math.round(periodMs / daysMs)

  const ts = (dayOffset: number, h = 9) => {
    const d = new Date(start + dayOffset * daysMs)
    d.setHours(h + rng.int(-1, 1), rng.int(0, 59))
    return d.getTime()
  }

  switch (frequency) {
    case "biweekly": {
      const results: number[] = []
      for (const day of [1, 15]) {
        const offset = day - 1 + rng.int(-1, 1)
        if (offset >= 0 && offset < daysTotal) results.push(ts(offset, 9))
      }
      return results
    }
    case "monthly": {
      const offset = 2 + rng.int(-1, 1)
      return offset < daysTotal ? [ts(offset, 8)] : []
    }
    case "irregular": {
      const count = rng.int(2, 5)
      return Array.from({ length: count }, () => {
        const d = rng.int(0, daysTotal - 1)
        return ts(d, rng.int(9, 17))
      })
    }
    case "daily": return [] // handled specially in generateHistory
    default: {
      const count = rng.int(1, 4)
      return Array.from({ length: count }, () => ts(rng.int(0, daysTotal - 1), rng.int(9, 17)))
    }
  }
}

// ── Reference generation ──────────────────────────────────────────────────────

const REF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function makeRef(rng: SeededRandom): string {
  return "TXN-" + Array.from({ length: 6 }, () => REF_CHARS[rng.int(0, 35)]).join("")
}

function uniqueRef(rng: SeededRandom, used: Set<string>): string {
  let ref: string
  let tries = 0
  do {
    ref = makeRef(rng)
    tries++
    if (tries > 1000) throw new Error("Could not generate unique reference")
  } while (used.has(ref))
  used.add(ref)
  return ref
}

// ── Transaction doc shape for raw insertMany ──────────────────────────────────

interface RawTxDoc {
  _id:             mongoose.Types.ObjectId
  accountId:       mongoose.Types.ObjectId
  userId:          mongoose.Types.ObjectId
  type:            string
  amount:          number
  currency:        string
  status:          string
  description:     string
  reference:       string
  isGenerated:     boolean
  processedAt:     Date
  createdAt:       Date
  updatedAt:       Date
  btcRateAtTime?:  number
  swapFromWallet?: string
  swapToWallet?:   string
  feeAmount?:      number
}

// ── generateHistory ────────────────────────────────────────────────────────────

export async function generateHistory(params: GenerateHistoryParams): Promise<GenerateHistoryResult> {
  await connectDB()

  const {
    userId, accountId, persona: personaKey, months,
    startingBalance, includeTransfers, includeBitcoinSwaps,
    seed, adminId, adminEmail, req,
  } = params

  if (!mongoose.Types.ObjectId.isValid(accountId)) throw new Error("Invalid account ID")
  if (!mongoose.Types.ObjectId.isValid(userId))    throw new Error("Invalid user ID")

  const account = await Account.findById(accountId).lean()
  if (!account) throw new Error("Account not found")
  if (account.walletType !== "fiat") throw new Error("generateHistory is for fiat accounts only")

  const currency = String(account.currency ?? "USD")

  // Find BTC account if swaps requested
  let btcAccount: typeof account | null = null
  if (includeBitcoinSwaps) {
    const btcAcct = await Account.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      walletType: "bitcoin",
    }).lean()
    btcAccount = btcAcct ?? null
  }

  const rng  = new SeededRandom(seed)
  const p    = PERSONAS[personaKey]
  const now  = Date.now()
  const PERIOD_MS = 30 * 86_400_000

  const periodStart = now - months * PERIOD_MS
  const usedRefs    = new Set<string>()
  const allDocs:    RawTxDoc[] = []

  // Delete existing generated transactions for this account
  await Transaction.deleteMany({
    accountId: new mongoose.Types.ObjectId(accountId),
    isGenerated: true,
  })
  if (btcAccount) {
    await Transaction.deleteMany({
      accountId: new mongoose.Types.ObjectId(String(btcAccount._id)),
      isGenerated: true,
    })
  }

  let btcPrice  = 45_000   // seed BTC price
  const transferLabels = ["Transfer to savings", "Rent payment", "Transfer to family", "Money to friend"]

  for (let m = 0; m < months; m++) {
    const pStart = periodStart + m * PERIOD_MS
    const pEnd   = Math.min(periodStart + (m + 1) * PERIOD_MS, now)
    if (pEnd <= pStart) continue

    const monthLabel = new Date(pStart).toLocaleDateString("en-US", { month: "short", year: "numeric" })

    // ── Income ─────────────────────────────────────────────────────────
    let periodIncome = rng.float(p.monthlyIncome.min, p.monthlyIncome.max)

    if (p.incomeFrequency === "daily") {
      // BUSINESS: many small + a few large
      const dailyCount  = rng.int(16, 22)
      const weeklyCount = rng.int(3, 5)
      const dailyPortion  = periodIncome * 0.60
      const weeklyPortion = periodIncome * 0.40
      for (let i = 0; i < dailyCount; i++) {
        const amt = realisticAmount(rng, dailyPortion / dailyCount * 0.6, dailyPortion / dailyCount * 1.5)
        allDocs.push({
          _id: new mongoose.Types.ObjectId(),
          accountId: new mongoose.Types.ObjectId(accountId),
          userId:    new mongoose.Types.ObjectId(userId),
          type: "deposit", amount: Math.round(amt * 100),
          currency, status: "completed",
          description: rng.pick(p.incomeLabel),
          reference: uniqueRef(rng, usedRefs),
          isGenerated: true,
          processedAt: new Date(timestampInPeriod(rng, pStart, pEnd)),
          createdAt:   new Date(timestampInPeriod(rng, pStart, pEnd)),
          updatedAt:   new Date(),
        })
      }
      for (let i = 0; i < weeklyCount; i++) {
        const amt = realisticAmount(rng, weeklyPortion / weeklyCount * 0.7, weeklyPortion / weeklyCount * 1.4)
        allDocs.push({
          _id: new mongoose.Types.ObjectId(),
          accountId: new mongoose.Types.ObjectId(accountId),
          userId:    new mongoose.Types.ObjectId(userId),
          type: "deposit", amount: Math.round(amt * 100),
          currency, status: "completed",
          description: rng.pick(p.incomeLabel),
          reference: uniqueRef(rng, usedRefs),
          isGenerated: true,
          processedAt: new Date(timestampInPeriod(rng, pStart, pEnd)),
          createdAt:   new Date(timestampInPeriod(rng, pStart, pEnd)),
          updatedAt:   new Date(),
        })
      }
    } else {
      const timestamps = incomeTimestamps(rng, p.incomeFrequency, pStart, pEnd)
      const splitCount = Math.max(1, timestamps.length)
      for (const ts of timestamps) {
        if (ts < pStart || ts > pEnd) continue
        let label = rng.pick(p.incomeLabel)
        if (label === "Contract payment") label = `Contract payment — Project ${rng.int(100, 999)}`
        const amt = realisticAmount(rng, periodIncome / splitCount * 0.8, periodIncome / splitCount * 1.2)
        const d   = new Date(ts)
        allDocs.push({
          _id: new mongoose.Types.ObjectId(),
          accountId: new mongoose.Types.ObjectId(accountId),
          userId:    new mongoose.Types.ObjectId(userId),
          type: "deposit", amount: Math.round(amt * 100),
          currency, status: "completed",
          description: label,
          reference: uniqueRef(rng, usedRefs),
          isGenerated: true,
          processedAt: d,
          createdAt:   d,
          updatedAt:   new Date(),
        })
      }
    }

    // ── Expenses ───────────────────────────────────────────────────────
    const numExpenses = rng.int(p.transactionsPerMonth.min, p.transactionsPerMonth.max)
    for (let i = 0; i < numExpenses; i++) {
      const cat      = rng.weighted(p.expenseCategories.map((c) => ({ weight: c.weight, value: c })))
      const merchant = rng.pick(cat.merchants)
      const amt      = realisticAmount(rng, p.avgTransactionAmount.min, p.avgTransactionAmount.max, merchant)
      const ts       = timestampInPeriod(rng, pStart, pEnd)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(accountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "withdrawal", amount: Math.round(amt * 100),
        currency, status: "completed",
        description: merchant,
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
      })
    }

    // ── Occasional large expense ───────────────────────────────────────
    if (rng.chance(p.occasionalLargeExpense.probability)) {
      const label = rng.pick(p.occasionalLargeExpense.labels)
      const amt   = realisticAmount(rng, p.occasionalLargeExpense.min, p.occasionalLargeExpense.max)
      const ts    = timestampInPeriod(rng, pStart, pEnd)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(accountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "withdrawal", amount: Math.round(amt * 100),
        currency, status: "completed",
        description: label,
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
      })
    }

    // ── Optional P2P transfers ─────────────────────────────────────────
    if (includeTransfers && m > 0 && rng.chance(0.20)) {
      const amt   = realisticAmount(rng, 50, 500)
      const label = rng.pick(transferLabels)
      const ts    = timestampInPeriod(rng, pStart, pEnd)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(accountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "transfer_out", amount: Math.round(amt * 100),
        currency, status: "completed",
        description: label,
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
      })
    }

    // ── Optional Bitcoin swaps ─────────────────────────────────────────
    btcPrice *= (1 + rng.float(-0.08, 0.12))
    btcPrice  = Math.max(15_000, Math.min(90_000, btcPrice))

    if (includeBitcoinSwaps && rng.chance(0.15)) {
      const fiatAmt   = realisticAmount(rng, 50, 500)
      const satoshis  = Math.round((fiatAmt / btcPrice) * 1e8)
      const ts        = timestampInPeriod(rng, pStart, pEnd)
      const swapRef   = uniqueRef(rng, usedRefs)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(accountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "swap_out", amount: Math.round(fiatAmt * 100),
        currency, status: "completed",
        description: `BTC swap — ${(satoshis / 1e8).toFixed(8)} BTC at $${Math.round(btcPrice).toLocaleString()}`,
        reference: swapRef,
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
        btcRateAtTime:  btcPrice,
        swapFromWallet: "fiat",
        swapToWallet:   "bitcoin",
      })
      if (btcAccount) {
        allDocs.push({
          _id: new mongoose.Types.ObjectId(),
          accountId: new mongoose.Types.ObjectId(String(btcAccount._id)),
          userId:    new mongoose.Types.ObjectId(userId),
          type: "swap_in", amount: satoshis,
          currency: "BTC", status: "completed",
          description: `Fiat swap — $${fiatAmt.toFixed(2)} at $${Math.round(btcPrice).toLocaleString()}`,
          reference: `${swapRef}-B`,
          isGenerated: true,
          processedAt: new Date(ts),
          createdAt:   new Date(ts),
          updatedAt:   new Date(),
          btcRateAtTime:  btcPrice,
          swapFromWallet: "fiat",
          swapToWallet:   "bitcoin",
        })
      }
    }

    void monthLabel // used below
  }

  // ── Sort by createdAt, apply running balance, filter overdrafts ───────
  allDocs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  const CREDIT_TYPES = new Set(["deposit", "admin_deposit", "transfer_in", "swap_in", "refund"])
  const FIAT_TYPES   = new Set(["deposit", "admin_deposit", "withdrawal", "transfer_out", "transfer_in", "swap_out", "refund", "fee"])

  let   fiatBalance   = Math.round(startingBalance * 100)
  let   btcBalance    = btcAccount ? Number(btcAccount.btcBalance ?? 0) : 0
  let   incomeTotal   = 0
  let   expensesTotal = 0
  let   skipped       = 0

  const validDocs: RawTxDoc[] = []
  const monthStats: Record<string, { income: number; expenses: number }> = {}

  for (const doc of allDocs) {
    const isBtcDoc = String(doc.accountId) === (btcAccount ? String(btcAccount._id) : "__none__")
    const isCredit = CREDIT_TYPES.has(doc.type)
    const isFiat   = !isBtcDoc

    if (isFiat && FIAT_TYPES.has(doc.type)) {
      const delta = isCredit ? doc.amount : -doc.amount
      if (fiatBalance + delta < 100) { skipped++; continue }
      fiatBalance += delta
      if (isCredit) incomeTotal   += doc.amount
      else          expensesTotal += doc.amount
    } else if (isBtcDoc) {
      const delta = isCredit ? doc.amount : -doc.amount
      if (btcBalance + delta < 0) { skipped++; continue }
      btcBalance += delta
    }

    validDocs.push(doc)

    const mk = doc.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    if (!monthStats[mk]) monthStats[mk] = { income: 0, expenses: 0 }
    if (isFiat) {
      if (isCredit) monthStats[mk].income   += doc.amount
      else          monthStats[mk].expenses += doc.amount
    }
  }

  // ── Bulk insert ───────────────────────────────────────────────────────
  if (validDocs.length > 0) {
    await Transaction.collection.insertMany(validDocs as unknown as Record<string, unknown>[])
  }

  // ── Update account balances ───────────────────────────────────────────
  await Account.findByIdAndUpdate(accountId, { balance: fiatBalance })
  if (btcAccount) {
    await Account.findByIdAndUpdate(String(btcAccount._id), { btcBalance })
  }

  await createAuditLog(adminId, adminEmail, "history.generate", "Account", accountId, {
    userId, persona: personaKey, months,
    transactionCount: validDocs.length,
    startingBalance,
  }, req)

  const monthBreakdown: MonthBreakdown[] = Object.entries(monthStats).map(([month, s]) => ({
    month,
    income:   s.income   / 100,
    expenses: s.expenses / 100,
    net:      (s.income - s.expenses) / 100,
  }))

  return {
    transactionsCreated: validDocs.length,
    finalBalance:        fiatBalance / 100,
    incomeTotal:         incomeTotal  / 100,
    expensesTotal:       expensesTotal / 100,
    skippedCount:        skipped,
    monthBreakdown,
  }
}

// ── generateBitcoinHistory ────────────────────────────────────────────────────

export async function generateBitcoinHistory(
  params: GenerateBtcHistoryParams
): Promise<GenerateBtcHistoryResult> {
  await connectDB()

  const { userId, btcAccountId, months, startingBtcBalance, includeSwaps, adminId, adminEmail, req } = params

  if (!mongoose.Types.ObjectId.isValid(btcAccountId)) throw new Error("Invalid BTC account ID")

  const account = await Account.findById(btcAccountId).lean()
  if (!account) throw new Error("Bitcoin account not found")
  if (account.walletType !== "bitcoin") throw new Error("Not a bitcoin account")

  await Transaction.deleteMany({ accountId: new mongoose.Types.ObjectId(btcAccountId), isGenerated: true })

  const rng      = new SeededRandom(params.seed)
  const now      = Date.now()
  const PERIOD   = 30 * 86_400_000
  const usedRefs = new Set<string>()
  const docs:    RawTxDoc[] = []

  let btcPrice = 45_000

  for (let m = 0; m < months; m++) {
    const pStart = now - months * PERIOD + m * PERIOD
    const pEnd   = Math.min(pStart + PERIOD, now)
    btcPrice *= (1 + rng.float(-0.08, 0.12))
    btcPrice  = Math.max(15_000, Math.min(90_000, btcPrice))

    // BTC received (1–3 per month)
    const deposits = rng.int(1, 3)
    for (let i = 0; i < deposits; i++) {
      const satoshis = rng.int(10_000, 500_000)
      const ts = timestampInPeriod(rng, pStart, pEnd)
      docs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(btcAccountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "deposit", amount: satoshis,
        currency: "BTC", status: "completed",
        description: rng.pick(["Bitcoin received", "Wallet transfer", "Mining reward", "P2P payment"]),
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
        btcRateAtTime: btcPrice,
      })
    }

    // BTC sent (0–2 per month)
    if (rng.chance(0.5)) {
      const satoshis = rng.int(5_000, 200_000)
      const ts = timestampInPeriod(rng, pStart, pEnd)
      docs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(btcAccountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "withdrawal", amount: satoshis,
        currency: "BTC", status: "completed",
        description: rng.pick(["Bitcoin sent", "Wallet transfer out", "Payment", "Cold storage transfer"]),
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
        btcRateAtTime: btcPrice,
      })
    }

    // Swap in (fiat → BTC)
    if (includeSwaps && rng.chance(0.20)) {
      const satoshis = rng.int(50_000, 1_000_000)
      const fiatAmt  = (satoshis / 1e8) * btcPrice
      const ts = timestampInPeriod(rng, pStart, pEnd)
      docs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(btcAccountId),
        userId:    new mongoose.Types.ObjectId(userId),
        type: "swap_in", amount: satoshis,
        currency: "BTC", status: "completed",
        description: `Fiat swap — $${fiatAmt.toFixed(2)} at $${Math.round(btcPrice).toLocaleString()}`,
        reference: uniqueRef(rng, usedRefs),
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt:   new Date(ts),
        updatedAt:   new Date(),
        btcRateAtTime: btcPrice,
        swapFromWallet: "fiat",
        swapToWallet:   "bitcoin",
      })
    }
  }

  // Sort and apply running balance
  docs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  let balance = Math.round(startingBtcBalance * 1e8)
  let skipped = 0
  const valid: RawTxDoc[] = []
  const CREDIT = new Set(["deposit", "swap_in"])

  for (const doc of docs) {
    const isCredit = CREDIT.has(doc.type)
    const delta    = isCredit ? doc.amount : -doc.amount
    if (balance + delta < 0) { skipped++; continue }
    balance += delta
    valid.push(doc)
  }

  if (valid.length > 0) {
    await Transaction.collection.insertMany(valid as unknown as Record<string, unknown>[])
  }
  await Account.findByIdAndUpdate(btcAccountId, { btcBalance: balance })

  await createAuditLog(adminId, adminEmail, "history.generate_btc", "Account", btcAccountId,
    { userId, months, transactionCount: valid.length }, req)

  return { transactionsCreated: valid.length, finalBtcBalance: balance / 1e8, skippedCount: skipped }
}

// ── wipeHistory ───────────────────────────────────────────────────────────────

export async function wipeHistory(
  userId:     string,
  accountId:  string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ deletedCount: number }> {
  await connectDB()

  // Delete ALL transactions for this account (both generated and real)
  const result = await Transaction.deleteMany({
    accountId: new mongoose.Types.ObjectId(accountId),
  })
  await Account.findByIdAndUpdate(accountId, { balance: 0, btcBalance: 0 })

  await createAuditLog(adminId, adminEmail, "history.wipe", "Account", accountId,
    { userId, deletedCount: result.deletedCount }, req)

  return { deletedCount: result.deletedCount }
}

export async function wipeAllHistory(
  userId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ deletedCount: number; cardTxDeleted: number }> {
  await connectDB()

  const userOid = new mongoose.Types.ObjectId(userId)
  const accounts = await Account.find({ userId: userOid }, "_id").lean()
  const accountIds = accounts.map((a) => a._id)

  // Delete ALL transactions for all accounts (both generated and real)
  const result = await Transaction.deleteMany({
    accountId: { $in: accountIds },
  })
  
  // Delete ALL card transactions for this user
  const cardTxResult = await CardTransaction.deleteMany({ userId: userOid })
  
  // Reset account balances
  await Account.updateMany(
    { userId: userOid },
    { $set: { balance: 0, btcBalance: 0 } }
  )
  
  // Reset card balances (balance owed) to 0
  await CardApplication.updateMany(
    { userId: userOid },
    { $set: { balance: 0 } }
  )

  await createAuditLog(adminId, adminEmail, "history.wipe_all", "User", userId,
    { userId, deletedCount: result.deletedCount, cardTxDeleted: cardTxResult.deletedCount }, req)

  return { deletedCount: result.deletedCount, cardTxDeleted: cardTxResult.deletedCount }
}

// ── getGenerationPreview ──────────────────────────────────────────────────────

export function getGenerationPreview(
  params: Omit<GenerateHistoryParams, "userId" | "accountId" | "adminId" | "adminEmail">
): GenerationPreview {
  const { persona: personaKey, months, startingBalance, seed } = params
  const rng = new SeededRandom(seed ?? 42)
  const p   = PERSONAS[personaKey]

  const avgIncome   = (p.monthlyIncome.min   + p.monthlyIncome.max)   / 2
  const avgTx       = (p.transactionsPerMonth.min + p.transactionsPerMonth.max) / 2
  const avgExpenses = avgIncome * (1 - p.savingsRate)

  const incomeEvents = p.incomeFrequency === "daily" ? 20
    : p.incomeFrequency === "biweekly"               ? 2
    : p.incomeFrequency === "monthly"                ? 1
    : 3

  const estimatedTransactions = Math.round(
    (avgTx + incomeEvents + p.occasionalLargeExpense.probability) * months
  )

  const estimatedFinalBalance = Math.max(
    0,
    startingBalance + (avgIncome - avgExpenses) * months
  )

  // Top 5 merchants by category weight
  const merchants: Array<{ m: string; w: number }> = []
  for (const cat of p.expenseCategories) {
    const perMerchant = cat.weight / cat.merchants.length
    for (const m of cat.merchants) merchants.push({ m, w: perMerchant })
  }
  merchants.sort((a, b) => b.w - a.w)
  const topMerchants = merchants.slice(0, 5).map((x) => x.m)

  const incomeSourceSamples = p.incomeLabel.slice(0, 3)

  // Generate 10 sample transactions via simulation
  const sampleTransactions: GenerationPreview["sampleTransactions"] = []
  const PERIOD = 30 * 86_400_000
  let   day    = 0

  for (let i = 0; i < 10; i++) {
    const isIncome = i < 2
    if (isIncome) {
      sampleTransactions.push({
        description: rng.pick(p.incomeLabel),
        amount:      realisticAmount(rng, p.monthlyIncome.min / 2, p.monthlyIncome.max / 2),
        type:        "deposit",
        dayOffset:   rng.int(1, 5) + day,
      })
    } else {
      day += rng.int(1, 3)
      const cat = rng.weighted(p.expenseCategories.map((c) => ({ weight: c.weight, value: c })))
      sampleTransactions.push({
        description: rng.pick(cat.merchants),
        amount:      realisticAmount(rng, p.avgTransactionAmount.min, p.avgTransactionAmount.max),
        type:        "withdrawal",
        dayOffset:   day,
      })
    }
  }

  return {
    estimatedTransactions,
    estimatedFinalBalance,
    estimatedMonthlyAvgIncome:    avgIncome,
    estimatedMonthlyAvgExpenses:  avgExpenses,
    topMerchants,
    incomeSourceSamples,
    sampleTransactions,
  }
}
