import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import Transaction       from "@/lib/models/Transaction"
import Account           from "@/lib/models/Account"
import User              from "@/lib/models/User"
import { createAuditLog } from "@/lib/services/auth.service"
import { notifyUser }    from "@/lib/services/deposit.service"
import type { TransactionType, TransactionStatus, IExternalRecipient } from "@/lib/models/Transaction"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransactionListItem {
  id:                string
  reference:         string
  type:              TransactionType
  status:            TransactionStatus
  amount:            number            // human-readable
  currency:          string
  feeAmount?:        number
  description?:      string
  isGenerated:       boolean
  createdAt:         string
  processedAt?:      string
  externalRecipient?: { name?: string; bankName?: string; country?: string }
  user: { id: string; firstName: string; lastName: string; email: string } | null
  account: { id: string; accountNumber: string; currency: string; walletType: string }
  toAccount?: { id: string; accountNumber: string; currency: string }
  metadata?: Record<string, unknown>
}

export interface TransactionDetail extends TransactionListItem {
  account: {
    id: string; accountNumber: string; currency: string; walletType: string
    balance: number; btcBalance: number
  }
  fromAccount?: { id: string; accountNumber: string; currency: string; walletType: string }
  btcRateAtTime?:      number
  exchangeRate?:       number
  convertedAmount?:    number
  convertedCurrency?:  string
  feePercent?:         number
  swapFromWallet?:     string
  swapToWallet?:       string
  transferType?:       string
  externalRecipientFull?: IExternalRecipient
  reversalTransaction?: {
    id: string; reference: string; status: string; type: string; createdAt: string
  }
  originalTransactionId?: string
}

export interface TransactionSummary {
  totalCount:       number
  totalVolume:      number
  completedCount:   number
  completedVolume:  number
  pendingCount:     number
  failedCount:      number
  reversedCount:    number
}

export interface GetTransactionsParams {
  page?:          number
  limit?:         number
  search?:        string
  userId?:        string
  accountId?:     string
  type?:          string
  status?:        string
  dateFrom?:      string
  dateTo?:        string
  amountMin?:     number
  amountMax?:     number
  currency?:      string
  isGenerated?:   boolean
  sortBy?:        string
  sortOrder?:     "asc" | "desc"
}

export interface ManualTransactionData {
  accountId:   string
  type:        "admin_deposit" | "withdrawal" | "fee" | "refund"
  amount:      number
  currency:    string
  description: string
  reference?:  string
}

export interface TransactionChartPoint {
  period:          string
  completedVolume: number
  completedCount:  number
  failedCount:     number
  pendingCount:    number
}

export interface TransactionExportRow {
  reference:             string
  date:                  string
  time:                  string
  type:                  string
  status:                string
  userName:              string
  userEmail:             string
  accountNumber:         string
  currency:              string
  amount:                number
  fee:                   number
  description:           string
  externalRecipientName: string
  externalRecipientBank: string
  isGenerated:           string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function divisorForCurrency(currency: string): number {
  return currency === "BTC" ? 1e8 : 100
}

const REF_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

async function generateRef(
  prefix  = "TXN",
  session?: mongoose.ClientSession
): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () =>
      REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]
    ).join("")
    const ref   = `${prefix}-${suffix}`
    const query = Transaction.findOne({ reference: ref })
    if (session) query.session(session)
    const exists = await query.lean()
    if (!exists) return ref
  }
  throw new Error("Failed to generate unique transaction reference")
}

function mapTransaction(doc: Record<string, unknown>): TransactionListItem {
  const user   = doc.userId    as Record<string, unknown> | null | undefined
  const acct   = doc.accountId as Record<string, unknown>
  const toAcct = doc.toAccountId as Record<string, unknown> | null | undefined
  const cur    = String(doc.currency ?? "USD")
  const div    = divisorForCurrency(cur)
  const ext    = doc.externalRecipient as Record<string, unknown> | null | undefined

  return {
    id:          String(doc._id),
    reference:   String(doc.reference),
    type:        doc.type as TransactionType,
    status:      doc.status as TransactionStatus,
    amount:      Number(doc.amount ?? 0) / div,
    currency:    cur,
    feeAmount:   doc.feeAmount ? Number(doc.feeAmount) / div : undefined,
    description: doc.description ? String(doc.description) : undefined,
    isGenerated: Boolean(doc.isGenerated),
    createdAt:   new Date(doc.createdAt as Date).toISOString(),
    processedAt: doc.processedAt ? new Date(doc.processedAt as Date).toISOString() : undefined,
    externalRecipient: ext ? {
      name:     ext.name     ? String(ext.name)     : undefined,
      bankName: ext.bankName ? String(ext.bankName) : undefined,
      country:  ext.country  ? String(ext.country)  : undefined,
    } : undefined,
    user: user ? {
      id:        String(user._id        ?? ""),
      firstName: String(user.firstName  ?? ""),
      lastName:  String(user.lastName   ?? ""),
      email:     String(user.email      ?? ""),
    } : null,
    account: {
      id:            String(acct?._id          ?? ""),
      accountNumber: String(acct?.accountNumber ?? ""),
      currency:      String(acct?.currency      ?? "USD"),
      walletType:    String(acct?.walletType     ?? "fiat"),
    },
    toAccount: toAcct ? {
      id:            String(toAcct._id           ?? ""),
      accountNumber: String(toAcct.accountNumber ?? ""),
      currency:      String(toAcct.currency      ?? "USD"),
    } : undefined,
    metadata: doc.metadata as Record<string, unknown> | undefined,
  }
}

async function buildMatch(
  params: GetTransactionsParams
): Promise<Record<string, unknown>> {
  await connectDB()

  const {
    search, userId, accountId, type, status,
    dateFrom, dateTo, amountMin, amountMax,
    currency, isGenerated,
  } = params

  const match: Record<string, unknown> = {}

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.userId = new mongoose.Types.ObjectId(userId)
  }

  if (accountId && mongoose.Types.ObjectId.isValid(accountId)) {
    match.accountId = new mongoose.Types.ObjectId(accountId)
  }

  if (type) {
    const types = type.split(",").map((t) => t.trim()).filter(Boolean)
    match.type = types.length === 1 ? types[0] : { $in: types }
  }

  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean)
    match.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
  }

  if (currency) match.currency = currency.toUpperCase()

  if (isGenerated !== undefined) match.isGenerated = isGenerated

  if (dateFrom || dateTo) {
    const df: Record<string, unknown> = {}
    if (dateFrom) df.$gte = new Date(dateFrom)
    if (dateTo)   df.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999))
    match.createdAt = df
  }

  if (amountMin != null || amountMax != null) {
    const af: Record<string, unknown> = {}
    if (amountMin != null) af.$gte = Math.round(amountMin * 100)
    if (amountMax != null) af.$lte = Math.round(amountMax * 100)
    match.amount = af
  }

  if (search?.trim() && !userId) {
    const userDocs = await User.find({
      $or: [
        { firstName: { $regex: search.trim(), $options: "i" } },
        { lastName:  { $regex: search.trim(), $options: "i" } },
        { email:     { $regex: search.trim(), $options: "i" } },
      ],
    }, "_id").lean()
    const uids = userDocs.map((u) => u._id)

    match.$or = [
      { reference:               { $regex: search.trim(), $options: "i" } },
      { description:             { $regex: search.trim(), $options: "i" } },
      { "externalRecipient.name":{ $regex: search.trim(), $options: "i" } },
      ...(uids.length > 0 ? [{ userId: { $in: uids } }] : []),
    ]
  }

  return match
}

// ── getTransactions ───────────────────────────────────────────────────────────

export async function getTransactions(
  params: GetTransactionsParams = {}
): Promise<{ transactions: TransactionListItem[]; total: number; pages: number; summary: TransactionSummary }> {
  await connectDB()

  const {
    page      = 1,
    limit     = 25,
    sortBy    = "createdAt",
    sortOrder = "desc",
  } = params

  const match    = await buildMatch(params)
  const validSort = ["createdAt", "amount", "reference", "status", "type", "processedAt"]
  const sortKey   = validSort.includes(sortBy) ? sortBy : "createdAt"
  const sortDir   = sortOrder === "asc" ? 1 : -1
  const skip      = (Math.max(1, page) - 1) * limit

  const [docs, total, summaryAgg] = await Promise.all([
    Transaction.find(match)
      .populate("userId",      "firstName lastName email")
      .populate("accountId",   "accountNumber currency walletType")
      .populate("toAccountId", "accountNumber currency")
      .sort({ [sortKey]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),

    Transaction.countDocuments(match),

    Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id:            null,
          totalCount:     { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          completedVolume:{ $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
          pendingCount:   { $sum: { $cond: [{ $eq: ["$status", "pending"]   }, 1, 0] } },
          failedCount:    { $sum: { $cond: [{ $eq: ["$status", "failed"]    }, 1, 0] } },
          reversedCount:  { $sum: { $cond: [{ $eq: ["$status", "reversed"]  }, 1, 0] } },
        },
      },
    ]),
  ])

  const agg     = summaryAgg[0]
  const summary: TransactionSummary = {
    totalCount:      agg?.totalCount       ?? 0,
    totalVolume:     (agg?.completedVolume ?? 0) / 100,
    completedCount:  agg?.completedCount   ?? 0,
    completedVolume: (agg?.completedVolume ?? 0) / 100,
    pendingCount:    agg?.pendingCount     ?? 0,
    failedCount:     agg?.failedCount      ?? 0,
    reversedCount:   agg?.reversedCount    ?? 0,
  }

  return {
    transactions: docs.map((d) => mapTransaction(d as unknown as Record<string, unknown>)),
    total,
    pages: Math.ceil(total / limit),
    summary,
  }
}

// ── getTransactionById ────────────────────────────────────────────────────────

export async function getTransactionById(id: string): Promise<TransactionDetail | null> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const doc = await Transaction.findById(id)
    .populate("userId",        "firstName lastName email")
    .populate("accountId",     "accountNumber currency walletType balance btcBalance")
    .populate("toAccountId",   "accountNumber currency walletType")
    .populate("fromAccountId", "accountNumber currency walletType")
    .lean()

  if (!doc) return null

  const raw       = doc as unknown as Record<string, unknown>
  const base      = mapTransaction(raw)
  const acct      = raw.accountId as Record<string, unknown>
  const fromAcct  = raw.fromAccountId as Record<string, unknown> | null | undefined
  const ext       = raw.externalRecipient as IExternalRecipient | null | undefined
  const meta      = raw.metadata as Record<string, unknown> | undefined
  const div       = divisorForCurrency(String(raw.currency ?? "USD"))

  // Find reversal transaction (a tx that reversed THIS transaction)
  const reversalDoc = await Transaction.findOne({
    "metadata.reversedTransactionId": id,
  }).lean()

  // If this IS a reversal, get its originalTransactionId
  const originalTxId = meta?.reversedTransactionId as string | undefined

  return {
    ...base,
    account: {
      id:            String(acct?._id          ?? ""),
      accountNumber: String(acct?.accountNumber ?? ""),
      currency:      String(acct?.currency      ?? "USD"),
      walletType:    String(acct?.walletType     ?? "fiat"),
      balance:       Number(acct?.balance    ?? 0) / 100,
      btcBalance:    Number(acct?.btcBalance ?? 0) / 1e8,
    },
    fromAccount: fromAcct ? {
      id:            String(fromAcct._id           ?? ""),
      accountNumber: String(fromAcct.accountNumber ?? ""),
      currency:      String(fromAcct.currency      ?? "USD"),
      walletType:    String(fromAcct.walletType     ?? "fiat"),
    } : undefined,
    btcRateAtTime:     raw.btcRateAtTime    ? Number(raw.btcRateAtTime)               : undefined,
    exchangeRate:      raw.exchangeRate     ? Number(raw.exchangeRate)                : undefined,
    convertedAmount:   raw.convertedAmount  ? Number(raw.convertedAmount) / div       : undefined,
    convertedCurrency: raw.convertedCurrency ? String(raw.convertedCurrency)          : undefined,
    feePercent:        raw.feePercent       ? Number(raw.feePercent)                  : undefined,
    swapFromWallet:    raw.swapFromWallet   ? String(raw.swapFromWallet)              : undefined,
    swapToWallet:      raw.swapToWallet     ? String(raw.swapToWallet)                : undefined,
    transferType:      raw.transferType     ? String(raw.transferType)                : undefined,
    externalRecipientFull: ext ?? undefined,
    reversalTransaction: reversalDoc ? {
      id:        String((reversalDoc as unknown as Record<string, unknown>)._id),
      reference: String(reversalDoc.reference),
      status:    String(reversalDoc.status),
      type:      String(reversalDoc.type),
      createdAt: new Date(reversalDoc.createdAt).toISOString(),
    } : undefined,
    originalTransactionId: originalTxId,
  }
}

// ── createManualTransaction ───────────────────────────────────────────────────

const NON_REVERSIBLE = new Set(["fee", "loan_repayment"])

export async function createManualTransaction(
  data:       ManualTransactionData,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(data.accountId))
    throw new Error("Invalid account ID")
  if (data.amount <= 0)
    throw new Error("Amount must be positive")

  const account = await Account.findById(data.accountId)
    .populate("userId", "firstName lastName email isActive")
  if (!account) throw new Error("Account not found")

  const user = account.userId as unknown as Record<string, unknown>
  if (!user || !user.isActive) throw new Error("Account owner is inactive or deleted")

  const isBitcoin     = account.walletType === "bitcoin"
  const div           = isBitcoin ? 1e8 : 100
  const amountSmallest = isBitcoin
    ? Math.round(data.amount * 1e8)
    : Math.round(data.amount * 100)
  const balanceField  = isBitcoin ? "btcBalance" : "balance"
  const currentBalance = isBitcoin ? account.btcBalance : account.balance

  const isDebit = data.type === "withdrawal" || data.type === "fee"
  if (isDebit && currentBalance < amountSmallest) {
    throw new Error(
      `Insufficient balance. Available: ${(currentBalance / div).toFixed(isBitcoin ? 8 : 2)} ${data.currency}`
    )
  }

  const session = await mongoose.startSession()
  let createdTx: Record<string, unknown> | null = null

  try {
    session.startTransaction()

    const reference = data.reference || (await generateRef("TXN", session))

    const balanceDelta = isDebit ? -amountSmallest : amountSmallest

    const [tx] = await Transaction.create(
      [{
        accountId:   account._id,
        userId:      account.userId,
        type:        data.type,
        amount:      amountSmallest,
        currency:    data.currency.toUpperCase(),
        status:      "completed",
        description: data.description,
        reference,
        isGenerated: false,
        processedAt: new Date(),
        metadata:    { createdByAdmin: adminId },
      }],
      { session }
    )
    createdTx = tx as unknown as Record<string, unknown>

    await Account.findByIdAndUpdate(
      account._id,
      { $inc: { [balanceField]: balanceDelta } },
      { session }
    )

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  await createAuditLog(adminId, adminEmail, "transaction.create_manual", "Transaction",
    String(createdTx!._id), { accountId: data.accountId, type: data.type, amount: data.amount }, req)

  await notifyUser(
    String(account.userId),
    "transaction",
    isDebit ? "Account debit" : "Account credit",
    `An admin has ${isDebit ? "debited" : "credited"} ${data.amount} ${data.currency} ${isDebit ? "from" : "to"} your account. ${data.description}`,
    { transactionId: String(createdTx!._id) }
  )

  return createdTx!
}

// ── reverseTransaction ────────────────────────────────────────────────────────

export async function reverseTransaction(
  transactionId: string,
  reason:        string,
  adminId:       string,
  adminEmail:    string,
  req?:          Request
): Promise<{ original: Record<string, unknown>; reversal: Record<string, unknown> }> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(transactionId)) throw new Error("Invalid transaction ID")
  if (!reason?.trim() || reason.trim().length < 10) throw new Error("Reason must be at least 10 characters")

  const tx = await Transaction.findById(transactionId)
    .populate("accountId",  "accountNumber walletType currency balance btcBalance userId")
    .populate("toAccountId","accountNumber walletType currency balance btcBalance userId")
  if (!tx) throw new Error("Transaction not found")

  if (tx.status !== "completed")
    throw new Error(`Cannot reverse a ${tx.status} transaction — only completed transactions can be reversed`)

  if (NON_REVERSIBLE.has(tx.type))
    throw new Error(`Transaction type '${tx.type}' cannot be reversed`)

  const existingReversal = await Transaction.findOne({
    "metadata.reversedTransactionId": transactionId,
  }).lean()
  if (existingReversal) throw new Error("This transaction has already been reversed")

  const txAcct  = tx.accountId as unknown as Record<string, unknown>
  const isBTC   = String(txAcct.walletType) === "bitcoin"
  const div     = isBTC ? 1e8 : 100
  const balField= isBTC ? "btcBalance" : "balance"
  const cur     = String(tx.currency)

  const PAIRED_TYPES = new Set(["transfer_out", "transfer_in", "swap_in", "swap_out"])
  const isPaired = PAIRED_TYPES.has(tx.type)

  // Credit types add money → reversal must deduct
  const CREDIT_TYPES = new Set(["deposit", "admin_deposit", "transfer_in", "swap_in", "refund", "loan_disbursement"])
  const isCredit = CREDIT_TYPES.has(tx.type)

  // Validate balance for credit reversals (deducting)
  if (isCredit) {
    const currentBal = isBTC
      ? Number(txAcct.btcBalance ?? 0)
      : Number(txAcct.balance ?? 0)
    if (currentBal < tx.amount) {
      throw new Error(
        `Insufficient balance to reverse. Current balance (${(currentBal / div).toFixed(isBTC ? 8 : 2)} ${cur}) is less than the transaction amount (${(tx.amount / div).toFixed(isBTC ? 8 : 2)} ${cur}).`
      )
    }
  }

  let pairedTx: typeof tx | null = null
  if (isPaired) {
    const pairedType = tx.type === "transfer_out"  ? "transfer_in"
                     : tx.type === "transfer_in"   ? "transfer_out"
                     : tx.type === "swap_out"       ? "swap_in"
                     :                               "swap_out"

    pairedTx = await Transaction.findOne({
      reference: tx.reference,
      type:      pairedType,
    }).populate("accountId", "accountNumber walletType currency balance btcBalance userId")
  }

  const reversalType: TransactionType =
    tx.type === "withdrawal"          ? "refund"
    : tx.type === "transfer_out"      ? "refund"
    : tx.type === "swap_out"          ? "swap_in"
    : tx.type === "swap_in"           ? "swap_out"
    : tx.type === "transfer_in"       ? "withdrawal"
    :                                   "withdrawal"

  const session = await mongoose.startSession()
  let createdReversal: InstanceType<typeof Transaction> | null = null

  try {
    session.startTransaction()

    const revRef = await generateRef("REV", session)

    // Mark original as reversed
    await Transaction.findByIdAndUpdate(
      transactionId,
      { status: "reversed" },
      { session }
    )

    // Mark paired as reversed if exists
    if (pairedTx) {
      await Transaction.findByIdAndUpdate(pairedTx._id, { status: "reversed" }, { session })
    }

    // Create reversal transaction
    const [rev] = await Transaction.create(
      [{
        accountId:   tx.accountId,
        userId:      tx.userId,
        type:        reversalType,
        amount:      tx.amount,
        currency:    cur,
        status:      "completed",
        description: `Reversal: ${reason.trim()}`,
        reference:   revRef,
        isGenerated: false,
        processedAt: new Date(),
        metadata: {
          reversedTransactionId: transactionId,
          reversalReason:        reason.trim(),
          originalType:          tx.type,
          originalReference:     tx.reference,
        },
      }],
      { session }
    )
    createdReversal = rev

    // Adjust balances
    // Original account: if credit → deduct; if debit → credit back
    const primaryDelta = isCredit ? -tx.amount : tx.amount
    await Account.findByIdAndUpdate(
      tx.accountId,
      { $inc: { [balField]: primaryDelta } },
      { session }
    )

    // Paired account (transfer / swap)
    if (pairedTx) {
      const pairedAcct  = pairedTx.accountId as unknown as Record<string, unknown>
      const isPairedBTC = String(pairedAcct.walletType) === "bitcoin"
      const pairedField = isPairedBTC ? "btcBalance" : "balance"
      // Paired is the opposite direction: if original was transfer_out (debit), paired was transfer_in (credit) → must deduct paired
      const pairedIsCredit = CREDIT_TYPES.has(pairedTx.type)
      const pairedDelta    = pairedIsCredit ? -pairedTx.amount : pairedTx.amount
      await Account.findByIdAndUpdate(
        pairedTx.accountId,
        { $inc: { [pairedField]: pairedDelta } },
        { session }
      )
    }

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  await createAuditLog(adminId, adminEmail, "transaction.reverse", "Transaction",
    transactionId, {
      transactionId, reason, reversalId: String(createdReversal!._id),
      originalType: tx.type, amount: tx.amount / div, currency: cur,
    }, req)

  await notifyUser(
    String(tx.userId),
    "transaction",
    "Transaction reversed",
    `Transaction ${tx.reference} has been reversed. Reason: ${reason.trim()}`,
    { transactionId, reversalId: String(createdReversal!._id) }
  )

  if (pairedTx) {
    const pairedAcctUser = (pairedTx.accountId as unknown as Record<string, unknown>)
    if (pairedAcctUser.userId && String(pairedAcctUser.userId) !== String(tx.userId)) {
      await notifyUser(
        String(pairedAcctUser.userId),
        "transaction",
        "Transaction reversed",
        `A linked transaction ${pairedTx.reference} has been reversed.`,
        { transactionId: String(pairedTx._id) }
      )
    }
  }

  const updated = await Transaction.findById(transactionId).lean()
  return {
    original: updated as unknown as Record<string, unknown>,
    reversal: createdReversal as unknown as Record<string, unknown>,
  }
}

// ── updateTransactionStatus ───────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:    ["processing", "completed", "failed"],
  processing: ["completed", "failed"],
}

export async function updateTransactionStatus(
  transactionId: string,
  status:        "completed" | "failed" | "processing",
  adminNote:     string,
  adminId:       string,
  adminEmail:    string,
  req?:          Request
): Promise<Record<string, unknown>> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(transactionId)) throw new Error("Invalid transaction ID")

  const tx = await Transaction.findById(transactionId)
    .populate("accountId", "walletType balance btcBalance")
  if (!tx) throw new Error("Transaction not found")

  const allowed = VALID_TRANSITIONS[tx.status]
  if (!allowed) throw new Error(`Cannot update status of a '${tx.status}' transaction`)
  if (!allowed.includes(status)) {
    throw new Error(`Invalid status transition: ${tx.status} → ${status}. Allowed: ${allowed.join(", ")}`)
  }

  const acct   = tx.accountId as unknown as Record<string, unknown>
  const isBTC  = String(acct.walletType) === "bitcoin"
  const field  = isBTC ? "btcBalance" : "balance"
  const meta   = (tx.metadata ?? {}) as Record<string, unknown>

  const needsBalanceAdjust =
    status === "completed" &&
    (tx.type === "transfer_out" || tx.type === "withdrawal") &&
    !meta.balanceAdjusted

  const session = await mongoose.startSession()
  let updated: Record<string, unknown> | null = null

  try {
    session.startTransaction()

    if (needsBalanceAdjust) {
      const currentBal = isBTC ? Number(acct.btcBalance ?? 0) : Number(acct.balance ?? 0)
      if (currentBal < tx.amount) {
        throw new Error("Insufficient balance for this status transition")
      }
      await Account.findByIdAndUpdate(
        tx.accountId,
        { $inc: { [field]: -tx.amount } },
        { session }
      )
    }

    const updateDoc = await Transaction.findByIdAndUpdate(
      transactionId,
      {
        status,
        processedAt: status === "completed" ? new Date() : undefined,
        $set: {
          "metadata.adminStatusUpdate": { adminId, adminNote, timestamp: new Date().toISOString() },
          ...(needsBalanceAdjust ? { "metadata.balanceAdjusted": true } : {}),
        },
      },
      { new: true, session }
    ).lean()
    updated = updateDoc as unknown as Record<string, unknown>

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  await createAuditLog(adminId, adminEmail, "transaction.status_update", "Transaction",
    transactionId, { transactionId, fromStatus: tx.status, toStatus: status, adminNote }, req)

  await notifyUser(
    String(tx.userId),
    "transaction",
    `Transaction ${status}`,
    `Your transaction ${tx.reference} has been updated to ${status}.${adminNote ? ` Note: ${adminNote}` : ""}`,
    { transactionId }
  )

  return updated!
}

// ── exportTransactions ────────────────────────────────────────────────────────

export async function exportTransactions(
  params: GetTransactionsParams
): Promise<TransactionExportRow[]> {
  await connectDB()

  const match = await buildMatch(params)

  const docs = await Transaction.find(match)
    .populate("userId",    "firstName lastName email")
    .populate("accountId", "accountNumber currency walletType")
    .sort({ createdAt: -1 })
    .limit(10_000)
    .lean()

  return docs.map((d) => {
    const raw  = d as unknown as Record<string, unknown>
    const base = mapTransaction(raw)
    const user = raw.userId as Record<string, unknown> | null | undefined
    const acct = raw.accountId as Record<string, unknown>
    const ext  = raw.externalRecipient as Record<string, unknown> | null | undefined
    const dt   = new Date(d.createdAt)

    return {
      reference:             base.reference,
      date:                  dt.toLocaleDateString("en-US"),
      time:                  dt.toLocaleTimeString("en-US"),
      type:                  base.type,
      status:                base.status,
      userName:              user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() : "System",
      userEmail:             user ? String(user.email ?? "") : "",
      accountNumber:         String(acct?.accountNumber ?? ""),
      currency:              base.currency,
      amount:                base.amount,
      fee:                   base.feeAmount ?? 0,
      description:           base.description ?? "",
      externalRecipientName: ext?.name     ? String(ext.name)     : "",
      externalRecipientBank: ext?.bankName ? String(ext.bankName) : "",
      isGenerated:           base.isGenerated ? "Yes" : "No",
    }
  })
}

// ── getTransactionChartData ───────────────────────────────────────────────────

export async function getTransactionChartData(
  groupBy: "day" | "week" | "month" = "day",
  days:    number                    = 14
): Promise<TransactionChartPoint[]> {
  await connectDB()

  const since = new Date(Date.now() - days * 86_400_000)

  type GroupId = { year: number; month?: number; day?: number; week?: number }

  const groupId: GroupId & Record<string, unknown> = { year: { $year: "$createdAt" } as unknown as number }
  if (groupBy === "day") {
    groupId.month = { $month: "$createdAt" } as unknown as number
    groupId.day   = { $dayOfMonth: "$createdAt" } as unknown as number
  } else if (groupBy === "week") {
    groupId.week  = { $week: "$createdAt" } as unknown as number
  } else {
    groupId.month = { $month: "$createdAt" } as unknown as number
  }

  const raw = await Transaction.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id:             groupId,
        completedVolume: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] } },
        completedCount:  { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        failedCount:     { $sum: { $cond: [{ $eq: ["$status", "failed"]    }, 1, 0] } },
        pendingCount:    { $sum: { $cond: [{ $eq: ["$status", "pending"]   }, 1, 0] } },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 } },
  ])

  // Build label for each group
  const points: TransactionChartPoint[] = raw.map((r) => {
    const g = r._id as GroupId
    let period = ""
    if (groupBy === "day" && g.month && g.day) {
      period = new Date(g.year, g.month - 1, g.day)
        .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (groupBy === "week") {
      period = `W${g.week ?? 0} ${g.year}`
    } else {
      period = new Date(g.year, (g.month ?? 1) - 1, 1)
        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
    }

    return {
      period,
      completedVolume: (r.completedVolume as number) / 100,
      completedCount:  r.completedCount as number,
      failedCount:     r.failedCount    as number,
      pendingCount:    r.pendingCount   as number,
    }
  })

  return points
}
