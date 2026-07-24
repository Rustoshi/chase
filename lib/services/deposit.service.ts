import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import DepositRequest    from "@/lib/models/DepositRequest"
import Account           from "@/lib/models/Account"
import Transaction       from "@/lib/models/Transaction"
import Notification      from "@/lib/models/Notification"
import User              from "@/lib/models/User"
import PaymentMethod     from "@/lib/models/PaymentMethod"
import { createAuditLog } from "@/lib/services/auth.service"
import { sendDepositStatusEmail } from "@/lib/email"

// ── Types ────────────────────────────────────────────────────────────────────

export interface DepositRequestItem {
  id:                 string
  status:             string
  requestedAmount:    number   // human-readable (cents → $)
  requestedCurrency:  string
  confirmedAmount?:   number   // human-readable
  adminNote?:         string
  txReference?:       string
  notes?:             string
  proofUrl?:          string
  createdAt:          string
  reviewedAt?:        string
  user: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
  }
  account: {
    id:            string
    accountNumber: string
    currency:      string
    walletType:    string
    balance:       number   // human-readable
    btcBalance:    number   // human-readable (satoshis → BTC)
  }
  paymentMethod: {
    id:   string
    name: string
    type: string
    icon?: string
  }
}

export interface DepositRequestDetail extends DepositRequestItem {
  reviewedBy?: {
    id:        string
    firstName: string
    lastName:  string
    email:     string
  }
  creditedTransaction?: {
    id:        string
    reference: string
    amount:    number
    currency:  string
    status:    string
    createdAt: string
  }
}

export interface DepositStats {
  pendingCount:         number
  pendingValue:         number   // fiat only, human-readable
  confirmedToday:       number
  confirmedValueToday:  number
  rejectedToday:        number
  averageConfirmTime:   number   // minutes
  byPaymentMethod:      Array<{ methodName: string; count: number; value: number }>
}

export interface GetDepositRequestsParams {
  page?:            number
  limit?:           number
  status?:          string
  userId?:          string
  paymentMethodId?: string
  dateFrom?:        string
  dateTo?:          string
  sortBy?:          string
  sortOrder?:       "asc" | "desc"
  search?:          string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function divisor(walletType: string) {
  return walletType === "bitcoin" ? 1e8 : 100
}

async function generateRef(session: mongoose.ClientSession): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref    = `TXN-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).session(session).lean()
    if (!exists) return ref
  }
  throw new Error("Failed to generate unique transaction reference")
}

function mapItem(r: Record<string, unknown>): DepositRequestItem {
  const user          = r.userId          as Record<string, unknown>
  const account       = r.accountId       as Record<string, unknown>
  const paymentMethod = r.paymentMethodId as Record<string, unknown>
  const div           = divisor(String(account?.walletType ?? "fiat"))

  return {
    id:                String(r._id),
    status:            String(r.status),
    requestedAmount:   Number(r.requestedAmount) / div,
    requestedCurrency: String(r.requestedCurrency),
    confirmedAmount:   r.confirmedAmount != null ? Number(r.confirmedAmount) / div : undefined,
    adminNote:         r.adminNote  ? String(r.adminNote)  : undefined,
    txReference:       r.txReference ? String(r.txReference) : undefined,
    notes:             r.notes       ? String(r.notes)       : undefined,
    proofUrl:          r.proofUrl    ? String(r.proofUrl)    : undefined,
    createdAt:         new Date(r.createdAt as Date).toISOString(),
    reviewedAt:        r.reviewedAt ? new Date(r.reviewedAt as Date).toISOString() : undefined,
    user: {
      id:        String((user?._id) ?? ""),
      firstName: String(user?.firstName ?? ""),
      lastName:  String(user?.lastName  ?? ""),
      email:     String(user?.email     ?? ""),
    },
    account: {
      id:            String(account?._id ?? ""),
      accountNumber: String(account?.accountNumber ?? ""),
      currency:      String(account?.currency      ?? "USD"),
      walletType:    String(account?.walletType     ?? "fiat"),
      balance:       Number(account?.balance    ?? 0) / 100,
      btcBalance:    Number(account?.btcBalance ?? 0) / 1e8,
    },
    paymentMethod: {
      id:   String(paymentMethod?._id  ?? ""),
      name: String(paymentMethod?.name ?? "Unknown"),
      type: String(paymentMethod?.type ?? ""),
      icon: paymentMethod?.icon ? String(paymentMethod.icon) : undefined,
    },
  }
}

// ── notifyUser ────────────────────────────────────────────────────────────────

export async function notifyUser(
  userId:    string,
  type:      string,
  subject:   string,
  body:      string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await Notification.create({
      userId:   new mongoose.Types.ObjectId(userId),
      type,
      channel:  "in_app",
      subject,
      body,
      metadata,
    })
  } catch (err) {
    console.error("[notifyUser]", err)
  }
}

// ── getDepositRequests ────────────────────────────────────────────────────────

export async function getDepositRequests(
  params: GetDepositRequestsParams = {}
): Promise<{ requests: DepositRequestItem[]; total: number; pages: number }> {
  await connectDB()

  const {
    page      = 1,
    limit     = 20,
    status,
    userId,
    paymentMethodId,
    dateFrom,
    dateTo,
    sortBy    = "createdAt",
    sortOrder = "desc",
    search,
  } = params

  const match: Record<string, unknown> = {}

  if (status)          match.status          = status
  if (paymentMethodId && mongoose.Types.ObjectId.isValid(paymentMethodId))
                       match.paymentMethodId = new mongoose.Types.ObjectId(paymentMethodId)

  // Date range
  if (dateFrom || dateTo) {
    const dateFilter: Record<string, unknown> = {}
    if (dateFrom) dateFilter.$gte = new Date(dateFrom)
    if (dateTo)   dateFilter.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999))
    match.createdAt = dateFilter
  }

  // userId filter (direct or from search)
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    match.userId = new mongoose.Types.ObjectId(userId)
  } else if (search?.trim()) {
    // Search by user name/email or txReference
    const users = await User.find({
      $or: [
        { firstName:  { $regex: search.trim(), $options: "i" } },
        { lastName:   { $regex: search.trim(), $options: "i" } },
        { email:      { $regex: search.trim(), $options: "i" } },
      ],
    }, "_id").lean()

    const uids = users.map((u) => u._id)
    match.$or = [
      { userId:      { $in: uids } },
      { txReference: { $regex: search.trim(), $options: "i" } },
    ]
  }

  const validSortKeys = ["createdAt", "requestedAmount", "status", "reviewedAt"]
  const sortKey  = validSortKeys.includes(sortBy) ? sortBy : "createdAt"
  const sortDir  = sortOrder === "asc" ? 1 : -1
  const skip     = (page - 1) * limit

  const [docs, total] = await Promise.all([
    DepositRequest.find(match)
      .populate("userId",          "firstName lastName email")
      .populate("accountId",       "accountNumber currency walletType balance btcBalance")
      .populate("paymentMethodId", "name type icon")
      .sort({ [sortKey]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),
    DepositRequest.countDocuments(match),
  ])

  return {
    requests: docs.map((r) => mapItem(r as unknown as Record<string, unknown>)),
    total,
    pages: Math.ceil(total / limit),
  }
}

// ── getDepositRequestById ─────────────────────────────────────────────────────

export async function getDepositRequestById(id: string): Promise<DepositRequestDetail | null> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const doc = await DepositRequest.findById(id)
    .populate("userId",               "firstName lastName email")
    .populate("accountId",            "accountNumber currency walletType balance btcBalance")
    // Pass the model explicitly so it resolves even when this ref's model
    // hasn't been registered in the current serverless module graph.
    .populate({ path: "paymentMethodId", model: PaymentMethod, select: "name type icon" })
    .populate("reviewedBy",           "firstName lastName email")
    .populate("creditedTransactionId","reference amount currency status createdAt")
    .lean()

  if (!doc) return null

  const base    = mapItem(doc as unknown as Record<string, unknown>)
  const rawDoc  = doc as Record<string, unknown>
  const rev     = rawDoc.reviewedBy   as Record<string, unknown> | null | undefined
  const tx      = rawDoc.creditedTransactionId as Record<string, unknown> | null | undefined

  return {
    ...base,
    reviewedBy: rev ? {
      id:        String(rev._id),
      firstName: String(rev.firstName ?? ""),
      lastName:  String(rev.lastName  ?? ""),
      email:     String(rev.email     ?? ""),
    } : undefined,
    creditedTransaction: tx ? {
      id:        String(tx._id),
      reference: String(tx.reference),
      amount:    Number(tx.amount) / 100,
      currency:  String(tx.currency),
      status:    String(tx.status),
      createdAt: new Date(tx.createdAt as Date).toISOString(),
    } : undefined,
  }
}

// ── confirmDepositRequest ─────────────────────────────────────────────────────

export async function confirmDepositRequest(
  requestId:       string,
  confirmedAmount: number,  // human-readable (USD or BTC)
  adminNote:       string,
  adminId:         string,
  adminEmail:      string,
  req?:            Request
): Promise<{ request: DepositRequestItem; transaction: Record<string, unknown> }> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(requestId)) throw new Error("Invalid request ID")
  if (confirmedAmount <= 0) throw new Error("Confirmed amount must be positive")

  // Fetch request with populated account + payment method
  const depositReq = await DepositRequest.findById(requestId)
    .populate("accountId",       "accountNumber currency walletType balance btcBalance userId")
    .populate("paymentMethodId", "name")
    .populate("userId",          "firstName lastName email")
  if (!depositReq) throw new Error("Deposit request not found")
  if (depositReq.status !== "pending") throw new Error("Request is not pending")

  const account       = depositReq.accountId as unknown as Record<string, unknown>
  const paymentMethod = depositReq.paymentMethodId as unknown as Record<string, unknown>
  const accountId     = account._id // Get the actual ObjectId from populated object
  const isBitcoin     = String(account.walletType) === "bitcoin"

  // Convert to smallest unit
  const amountSmallest = isBitcoin
    ? Math.round(confirmedAmount * 1e8)
    : Math.round(confirmedAmount * 100)

  const balanceField  = isBitcoin ? "btcBalance" : "balance"
  const currency      = isBitcoin ? "BTC" : String(account.currency ?? "USD")
  const pmName        = String(paymentMethod?.name ?? "")
  const description   = `Deposit via ${pmName}${adminNote ? ` — ${adminNote}` : ""}`

  const session = await mongoose.startSession()
  let updatedTx: InstanceType<typeof Transaction> | null = null

  try {
    session.startTransaction()

    // 1. Find existing pending transaction for this deposit request
    const existingTx = await Transaction.findOne({
      "metadata.depositRequestId": requestId,
      status: "pending",
    }).session(session)

    if (existingTx) {
      // 2a. Update existing pending transaction to completed
      existingTx.amount = amountSmallest
      existingTx.status = "completed"
      existingTx.description = description
      existingTx.processedAt = new Date()
      existingTx.metadata = {
        ...existingTx.metadata,
        depositRequestId: requestId,
        paymentMethod: pmName,
        proofUrl: depositReq.proofUrl,
      }
      await existingTx.save({ session })
      updatedTx = existingTx
    } else {
      // 2b. Create new transaction if no pending one exists (fallback)
      const reference = await generateRef(session)
      const [tx] = await Transaction.create(
        [{
          accountId:   accountId,
          userId:      depositReq.userId,
          type:        "deposit",
          amount:      amountSmallest,
          currency,
          status:      "completed",
          description,
          reference,
          isGenerated: false,
          processedAt: new Date(),
          metadata: {
            depositRequestId: requestId,
            paymentMethod:    pmName,
            proofUrl:         depositReq.proofUrl,
          },
        }],
        { session }
      )
      updatedTx = tx
    }

    // 3. Credit account
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { [balanceField]: amountSmallest } },
      { session }
    )

    // 4. Update deposit request
    await DepositRequest.findByIdAndUpdate(
      requestId,
      {
        status:                 "confirmed",
        confirmedAmount:        amountSmallest,
        adminNote:              adminNote || "",
        reviewedBy:             new mongoose.Types.ObjectId(adminId),
        reviewedAt:             new Date(),
        creditedTransactionId:  updatedTx._id,
      },
      { session }
    )

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  // Audit + notification (outside transaction)
  await createAuditLog(adminId, adminEmail, "deposit.confirm", "DepositRequest", requestId, {
    requestId, amount: confirmedAmount, currency, accountId: String(accountId),
    userId: String(depositReq.userId),
  }, req)

  const confirmMsg = `Your deposit of ${confirmedAmount} ${currency} has been confirmed and credited to your account.`

  await notifyUser(
    String(depositReq.userId),
    "deposit_request",
    "Deposit confirmed",
    confirmMsg,
    { depositRequestId: requestId, transactionRef: updatedTx!.reference }
  )

  // Email the client (fire-and-forget; delivered in the background)
  const confirmUser = depositReq.userId as unknown as { firstName?: string; email?: string } | null
  if (confirmUser?.email) {
    sendDepositStatusEmail(
      confirmUser.email,
      confirmUser.firstName || "there",
      "Deposit confirmed",
      confirmMsg,
      updatedTx!.reference,
      "positive"
    ).catch(() => {})
  }

  const updated = await getDepositRequestById(requestId)

  return {
    request:     updated as DepositRequestItem,
    transaction: {
      id:        String(updatedTx!._id),
      reference: updatedTx!.reference,
      amount:    confirmedAmount,
      currency,
      status:    "completed",
      createdAt: new Date(updatedTx!.createdAt).toISOString(),
    },
  }
}

// ── rejectDepositRequest ──────────────────────────────────────────────────────

export async function rejectDepositRequest(
  requestId:  string,
  adminNote:  string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<DepositRequestItem> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(requestId)) throw new Error("Invalid request ID")
  if (!adminNote?.trim()) throw new Error("Rejection reason is required")

  const depositReq = await DepositRequest.findById(requestId)
    .populate("userId", "firstName lastName email")
  if (!depositReq) throw new Error("Deposit request not found")
  if (depositReq.status !== "pending") throw new Error("Request is not pending")

  // Update the pending transaction to failed status
  await Transaction.findOneAndUpdate(
    { "metadata.depositRequestId": requestId, status: "pending" },
    { 
      status: "failed",
      description: `Deposit rejected: ${adminNote.trim()}`,
      processedAt: new Date(),
    }
  )

  await DepositRequest.findByIdAndUpdate(requestId, {
    status:     "rejected",
    adminNote:  adminNote.trim(),
    reviewedBy: new mongoose.Types.ObjectId(adminId),
    reviewedAt: new Date(),
  })

  await createAuditLog(adminId, adminEmail, "deposit.reject", "DepositRequest", requestId, {
    requestId, adminNote, userId: String(depositReq.userId),
  }, req)

  const rejectMsg = `Your deposit request has been rejected. Reason: ${adminNote.trim()}`

  await notifyUser(
    String(depositReq.userId),
    "deposit_request",
    "Deposit request rejected",
    rejectMsg,
    { depositRequestId: requestId }
  )

  // Email the client (fire-and-forget; delivered in the background)
  const rejectUser = depositReq.userId as unknown as { firstName?: string; email?: string } | null
  if (rejectUser?.email) {
    sendDepositStatusEmail(
      rejectUser.email,
      rejectUser.firstName || "there",
      "Deposit request rejected",
      rejectMsg,
      undefined,
      "warning"
    ).catch(() => {})
  }

  return (await getDepositRequestById(requestId)) as DepositRequestItem
}

// ── getDepositStats ───────────────────────────────────────────────────────────

export async function getDepositStats(): Promise<DepositStats> {
  await connectDB()

  const todayStart  = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

  const [
    pendingAgg,
    confirmedTodayAgg,
    rejectedTodayCount,
    avgTimeAgg,
    byMethodAgg,
  ] = await Promise.all([
    // Pending count + value (fiat only for value)
    DepositRequest.aggregate([
      { $match: { status: "pending" } },
      {
        $lookup: {
          from:         "accounts",
          localField:   "accountId",
          foreignField: "_id",
          as:           "_acct",
        },
      },
      { $unwind: { path: "$_acct", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id:   null,
          count: { $sum: 1 },
          value: {
            $sum: {
              $cond: [
                { $ne: ["$_acct.walletType", "bitcoin"] },
                "$requestedAmount",
                0,
              ],
            },
          },
        },
      },
    ]),

    // Confirmed today count + value
    DepositRequest.aggregate([
      { $match: { status: "confirmed", reviewedAt: { $gte: todayStart } } },
      {
        $group: {
          _id:   null,
          count: { $sum: 1 },
          value: { $sum: "$confirmedAmount" },
        },
      },
    ]),

    DepositRequest.countDocuments({ status: "rejected", reviewedAt: { $gte: todayStart } }),

    // Average confirm time (minutes)
    DepositRequest.aggregate([
      { $match: { status: "confirmed", reviewedAt: { $gte: sevenDaysAgo } } },
      {
        $project: {
          mins: {
            $divide: [{ $subtract: ["$reviewedAt", "$createdAt"] }, 60000],
          },
        },
      },
      { $group: { _id: null, avg: { $avg: "$mins" } } },
    ]),

    // By payment method (pending only)
    DepositRequest.aggregate([
      { $match: { status: "pending" } },
      {
        $group: {
          _id:   "$paymentMethodId",
          count: { $sum: 1 },
          value: { $sum: "$requestedAmount" },
        },
      },
      {
        $lookup: {
          from:         "paymentmethods",
          localField:   "_id",
          foreignField: "_id",
          as:           "_method",
        },
      },
      { $unwind: { path: "$_method", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          methodName: { $ifNull: ["$_method.name", "Unknown"] },
          count:      1,
          value:      1,
        },
      },
      { $sort: { count: -1 } },
    ]),
  ])

  return {
    pendingCount:        pendingAgg[0]?.count             ?? 0,
    pendingValue:        (pendingAgg[0]?.value            ?? 0) / 100,
    confirmedToday:      confirmedTodayAgg[0]?.count      ?? 0,
    confirmedValueToday: (confirmedTodayAgg[0]?.value     ?? 0) / 100,
    rejectedToday:       rejectedTodayCount,
    averageConfirmTime:  avgTimeAgg[0]?.avg               ?? 0,
    byPaymentMethod:     byMethodAgg.map((r) => ({
      methodName: String(r.methodName),
      count:      r.count as number,
      value:      (r.value as number) / 100,
    })),
  }
}
