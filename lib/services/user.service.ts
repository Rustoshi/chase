import mongoose                from "mongoose"
import bcrypt                  from "bcryptjs"
import { connectDB }           from "@/lib/db/connection"
import User                    from "@/lib/models/User"
import Account                 from "@/lib/models/Account"
import Transaction             from "@/lib/models/Transaction"
import DepositRequest          from "@/lib/models/DepositRequest"
import KycDocument             from "@/lib/models/KycDocument"
import LoanApplication         from "@/lib/models/LoanApplication"
import CardApplication         from "@/lib/models/CardApplication"
import SupportTicket           from "@/lib/models/SupportTicket"
import Notification            from "@/lib/models/Notification"
import PaymentMethod           from "@/lib/models/PaymentMethod"
import { createAuditLog }      from "@/lib/services/auth.service"

// ── Shared types ─────────────────────────────────────────────────────────────

export interface UserListItem {
  id:           string
  firstName:    string
  lastName:     string
  email:        string
  phone?:       string
  avatarUrl?:   string
  role:         string
  kycStatus:    string
  isActive:     boolean
  isSuspended:  boolean
  suspendReason?: string
  createdAt:    string
  accountCount: number
}

export interface GetUsersParams {
  page?:       number
  limit?:      number
  search?:     string
  role?:       string
  kycStatus?:  string
  isActive?:   boolean
  isSuspended?: boolean
  sortBy?:     string
  sortOrder?:  "asc" | "desc"
}

export interface AccountData {
  id:            string
  walletType:    "fiat" | "bitcoin"
  accountNumber: string
  currency:      string
  balance:       number
  routingNumber?: string
  swiftCode?:    string
  iban?:         string
  accountType?:  string
  btcAddress?:   string
  btcBalance:    number
  isFrozen:      boolean
  freezeReason?: string
}

export interface TransactionData {
  id:          string
  reference:   string
  type:        string
  amount:      number
  currency:    string
  status:      string
  description: string
  createdAt:   string
}

export interface KycDocData {
  id:          string
  docType:     string
  docUrl?:     string
  status:      string
  reviewNote?: string
  submittedAt: string
  reviewedAt?: string
}

export interface LoanData {
  id:            string
  amount:        number
  purpose:       string
  termMonths:    number
  status:        string
  interestRate?: number
  monthlyPayment?: number
  appliedAt:     string
}

export interface CardData {
  id:            string
  cardNetwork:   string
  cardType:      string
  isVirtual:     boolean
  creditLimit?:  number
  spendingLimit?: number
  status:        string
  cardNumber?:   string
  appliedAt:     string
}

export interface DepositRequestData {
  id:                string
  requestedAmount:   number
  requestedCurrency: string
  status:            string
  adminNote?:        string
  createdAt:         string
  paymentMethodName?: string
}

export interface TicketData {
  id:        string
  subject:   string
  status:    string
  priority:  string
  createdAt: string
}

export interface UserDetail {
  id:              string
  firstName:       string
  lastName:        string
  email:           string
  phone?:          string
  avatarUrl?:      string
  dateOfBirth?:    string
  address?: {
    street?:  string
    city?:    string
    state?:   string
    zip?:     string
    country?: string
  }
  role:            string
  kycStatus:       string
  kycTier:         number
  isActive:        boolean
  isSuspended:     boolean
  suspendReason?:  string
  twoFactorEnabled: boolean
  emailVerified:   boolean
  transferPin?:    string
  preferredCurrency: string
  referralCode:    string
  createdAt:       string
  updatedAt:       string
  // Related data
  accounts:            AccountData[]
  recentTransactions:  TransactionData[]
  kycDocuments:        KycDocData[]
  loanApplications:    LoanData[]
  cardApplications:    CardData[]
  depositRequests:     DepositRequestData[]
  supportTickets:      TicketData[]
  // Computed
  totalDeposited:  number
  totalTransferred: number
  joinedDaysAgo:   number
}

export interface UpdateUserData {
  firstName?:    string
  lastName?:     string
  email?:        string
  phone?:        string
  dateOfBirth?:  string
  address?: {
    street?:  string
    city?:    string
    state?:   string
    zip?:     string
    country?: string
  }
  role?:         string
  kycStatus?:    string
  kycTier?:      number
  isActive?:     boolean
  isSuspended?:  boolean
  suspendReason?: string
  emailVerified?: boolean
  preferredCurrency?: string
  transferPin?:  string
  createdAt?:    string
}

// ── Service functions ─────────────────────────────────────────────────────────

export async function getUsers(
  params: GetUsersParams = {}
): Promise<{ users: UserListItem[]; total: number; pages: number }> {
  await connectDB()

  const {
    page      = 1,
    limit     = 20,
    search,
    role,
    kycStatus,
    isActive,
    isSuspended,
    sortBy    = "createdAt",
    sortOrder = "desc",
  } = params

  const skip = (page - 1) * limit

  const match: Record<string, unknown> = {}

  // Always exclude admin users from the list
  match.role = { $ne: "admin" }

  if (search?.trim()) {
    match.$or = [
      { firstName: { $regex: search.trim(), $options: "i" } },
      { lastName:  { $regex: search.trim(), $options: "i" } },
      { email:     { $regex: search.trim(), $options: "i" } },
      { phone:     { $regex: search.trim(), $options: "i" } },
    ]
  }
  if (role && role !== "admin")     match.role        = role
  if (kycStatus)                    match.kycStatus   = kycStatus
  if (isActive   !== undefined)     match.isActive    = isActive
  if (isSuspended !== undefined)    match.isSuspended = isSuspended

  const sortKey = ["firstName","lastName","email","createdAt","kycStatus","role"].includes(sortBy)
    ? sortBy
    : "createdAt"
  const sortObj: Record<string, 1 | -1> = { [sortKey]: sortOrder === "asc" ? 1 : -1 }

  const [users, total] = await Promise.all([
    User.aggregate([
      { $match: match },
      {
        $lookup: {
          from:         "accounts",
          localField:   "_id",
          foreignField: "userId",
          as:           "_accounts",
        },
      },
      { $addFields: { accountCount: { $size: "$_accounts" } } },
      {
        $project: {
          _accounts:              0,
          passwordHash:           0,
          emailVerificationToken: 0,
          passwordResetToken:     0,
          pushSubscription:       0,
        },
      },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limit },
    ]),
    User.countDocuments(match),
  ])

  return {
    users: users.map((u) => ({
      id:            String(u._id),
      firstName:     u.firstName,
      lastName:      u.lastName,
      email:         u.email,
      phone:         u.phone,
      avatarUrl:     u.avatarUrl || undefined,
      role:          u.role,
      kycStatus:     u.kycStatus,
      isActive:      u.isActive,
      isSuspended:   u.isSuspended,
      suspendReason: u.suspendReason,
      createdAt:     new Date(u.createdAt).toISOString(),
      accountCount:  u.accountCount as number,
    })),
    total,
    pages: Math.ceil(total / limit),
  }
}

export async function getUserById(id: string): Promise<UserDetail | null> {
  await connectDB()

  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const oid = new mongoose.Types.ObjectId(id)

  const user = await User.findById(oid).lean()
  if (!user) return null

  const [
    accounts,
    recentTransactions,
    kycDocuments,
    loanApplications,
    cardApplications,
    depositRequestsRaw,
    supportTickets,
    depositVolAgg,
    transferVolAgg,
  ] = await Promise.all([
    Account.find({ userId: oid }).lean(),
    Transaction.find({ userId: oid }).sort({ createdAt: -1 }).limit(10).lean(),
    KycDocument.find({ userId: oid }).sort({ submittedAt: -1 }).lean(),
    LoanApplication.find({ userId: oid }).sort({ appliedAt: -1 }).lean(),
    CardApplication.find({ userId: oid }).sort({ createdAt: -1 }).lean(),
    DepositRequest.find({ userId: oid })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "paymentMethodId", model: PaymentMethod, select: "name" })
      .lean(),
    SupportTicket.find({ userId: oid }).sort({ createdAt: -1 }).lean(),
    Transaction.aggregate([
      { $match: { userId: oid, status: "completed", type: { $in: ["deposit","admin_deposit"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Transaction.aggregate([
      { $match: { userId: oid, status: "completed", type: "transfer_out" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ])

  const joinedDaysAgo = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000
  )

  return {
    id:               String(user._id),
    firstName:        user.firstName,
    lastName:         user.lastName,
    email:            user.email,
    phone:            user.phone,
    avatarUrl:        (user as { avatarUrl?: string }).avatarUrl || undefined,
    dateOfBirth:      user.dateOfBirth ? new Date(user.dateOfBirth).toISOString() : undefined,
    address:          user.address,
    role:             user.role,
    kycStatus:        user.kycStatus,
    kycTier:          user.kycTier,
    isActive:         user.isActive,
    isSuspended:      user.isSuspended,
    suspendReason:    user.suspendReason,
    twoFactorEnabled: user.twoFactorEnabled,
    emailVerified:    user.emailVerified,
    transferPin:      user.transferPin,
    preferredCurrency: user.preferredCurrency || "USD",
    referralCode:     user.referralCode ?? "",
    createdAt:        new Date(user.createdAt).toISOString(),
    updatedAt:        new Date(user.updatedAt).toISOString(),

    accounts: accounts.map((a) => ({
      id:            String(a._id),
      walletType:    a.walletType,
      accountNumber: a.accountNumber,
      currency:      a.currency,
      balance:       a.balance / 100,
      routingNumber: a.routingNumber,
      swiftCode:     a.swiftCode,
      iban:          a.iban,
      accountType:   a.accountType,
      btcAddress:    a.btcAddress,
      btcBalance:    a.btcBalance / 1e8,
      isFrozen:      a.isFrozen,
      freezeReason:  a.freezeReason,
    })),

    recentTransactions: recentTransactions.map((t) => {
      const divisor = t.currency === "BTC" ? 1e8 : 100
      return {
        id:          String(t._id),
        reference:   t.reference,
        type:        t.type,
        amount:      t.amount / divisor,
        currency:    t.currency,
        status:      t.status,
        description: t.description ?? "",
        createdAt:   new Date(t.createdAt).toISOString(),
      }
    }),

    kycDocuments: kycDocuments.map((k) => ({
      id:          String(k._id),
      docType:     k.docType,
      docUrl:      k.docUrl,
      status:      k.status,
      reviewNote:  k.reviewNote,
      submittedAt: new Date(k.submittedAt).toISOString(),
      reviewedAt:  k.reviewedAt ? new Date(k.reviewedAt).toISOString() : undefined,
    })),

    loanApplications: loanApplications.map((l) => ({
      id:            String(l._id),
      amount:        l.amount / 100,
      purpose:       l.purpose,
      termMonths:    l.termMonths,
      status:        l.status,
      interestRate:  l.interestRate,
      monthlyPayment: l.monthlyPayment ? l.monthlyPayment / 100 : undefined,
      appliedAt:     new Date(l.appliedAt).toISOString(),
    })),

    cardApplications: cardApplications.map((c) => ({
      id:            String(c._id),
      cardNetwork:   (c.cardNetwork as string) || "visa",
      cardType:      c.cardType,
      isVirtual:     (c.isVirtual as boolean) ?? true,
      // Card limits are stored in whole currency units (not minor units) —
      // do NOT divide by 100.
      creditLimit:   c.creditLimit ?? undefined,
      spendingLimit: c.spendingLimit ?? undefined,
      status:        c.status,
      cardNumber:    c.cardNumber,
      appliedAt:     new Date((c as unknown as Record<string, unknown>).appliedAt as Date ?? Date.now()).toISOString(),
    })),

    depositRequests: depositRequestsRaw.map((d) => {
      const pm = d.paymentMethodId as unknown as { name?: string } | null
      return {
        id:                  String(d._id),
        requestedAmount:     d.requestedAmount / 100,
        requestedCurrency:   d.requestedCurrency,
        status:              d.status,
        adminNote:           d.adminNote,
        createdAt:           new Date(d.createdAt).toISOString(),
        paymentMethodName:   pm?.name,
      }
    }),

    supportTickets: supportTickets.map((s) => ({
      id:        String(s._id),
      subject:   s.subject,
      status:    s.status,
      priority:  s.priority,
      createdAt: new Date(s.createdAt).toISOString(),
    })),

    totalDeposited:   (depositVolAgg[0]?.total ?? 0) / 100,
    totalTransferred: (transferVolAgg[0]?.total ?? 0) / 100,
    joinedDaysAgo,
  }
}

export async function updateUser(
  id:         string,
  data:       UpdateUserData,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<UserDetail> {
  await connectDB()

  const user = await User.findById(id)
  if (!user) throw new Error("User not found")

  const ALLOWED = [
    "firstName","lastName","email","phone","dateOfBirth","address",
    "role","kycStatus","kycTier","isActive","isSuspended","suspendReason","emailVerified","transferPin","preferredCurrency",
  ] as const

  const before: Record<string, unknown> = {}
  const after:  Record<string, unknown> = {}
  const prevKycStatus = user.kycStatus

  for (const field of ALLOWED) {
    if (data[field as keyof UpdateUserData] !== undefined) {
      before[field] = (user as unknown as Record<string, unknown>)[field]
      ;(user as unknown as Record<string, unknown>)[field] = data[field as keyof UpdateUserData]
      after[field]  = data[field as keyof UpdateUserData]
    }
  }

  await user.save()

  // The join date (createdAt) is managed by the timestamps plugin, which marks
  // it immutable — so a normal update silently drops it. `overwriteImmutable`
  // (Mongoose 8) forces the write; `timestamps: false` stops updatedAt churn.
  if (data.createdAt !== undefined) {
    const joined = new Date(data.createdAt)
    if (isNaN(joined.getTime())) throw new Error("Invalid join date")
    before.createdAt = user.createdAt
    after.createdAt  = joined
    await User.updateOne(
      { _id: id },
      { $set: { createdAt: joined } },
      { timestamps: false, overwriteImmutable: true }
    )
  }

  await createAuditLog(adminId, adminEmail, "user.update", "User", id, { before, after }, req)

  if (data.kycStatus && data.kycStatus !== prevKycStatus) {
    await createAuditLog(adminId, adminEmail, "user.kyc_override", "User", id, {
      from: prevKycStatus,
      to:   data.kycStatus,
    }, req)
  }

  return getUserById(id) as Promise<UserDetail>
}

export async function suspendUser(
  id:         string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()
  await User.findByIdAndUpdate(id, { isSuspended: true, suspendReason: reason })
  await createAuditLog(adminId, adminEmail, "user.suspend", "User", id, { reason }, req)
}

export async function unsuspendUser(
  id:         string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()
  await User.findByIdAndUpdate(id, { isSuspended: false, suspendReason: "" })
  await createAuditLog(adminId, adminEmail, "user.unsuspend", "User", id, {}, req)
}

export async function deleteUser(
  id:         string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()
  const user = await User.findById(id)
  if (!user) throw new Error("User not found")
  
  const originalEmail = user.email
  
  // Hard delete — remove user and all related data
  await Promise.all([
    User.findByIdAndDelete(id),
    Account.deleteMany({ userId: id }),
    Transaction.deleteMany({ userId: id }),
    Notification.deleteMany({ userId: id }),
  ])
  
  await createAuditLog(adminId, adminEmail, "user.delete", "User", id, {
    originalEmail,
  }, req)
}

export async function resetUserPassword(
  id:         string,
  newPassword: string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()
  const hash = await bcrypt.hash(newPassword, 12)
  await User.findByIdAndUpdate(id, { passwordHash: hash })
  await createAuditLog(adminId, adminEmail, "user.password_reset", "User", id, {}, req)
}

export async function adjustUserBalance(
  accountId:  string,
  amount:     number,
  description: string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<TransactionData> {
  await connectDB()

  const session = await mongoose.startSession()
  let createdTx: InstanceType<typeof Transaction> | null = null

  try {
    session.startTransaction()

    const account = await Account.findById(accountId).session(session)
    if (!account) throw new Error("Account not found")

    const isBitcoin    = account.walletType === "bitcoin"
    const balanceField = isBitcoin ? "btcBalance" : "balance"
    const current      = isBitcoin ? account.btcBalance : account.balance

    if (amount < 0 && current + amount < 0) {
      throw new Error(
        `Insufficient balance. Current: ${current}, adjustment: ${amount}`
      )
    }

    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { [balanceField]: amount } },
      { session }
    )

    const reference = `ADJ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const txType    = amount >= 0 ? "admin_deposit" : "withdrawal"

    const [tx] = await Transaction.create(
      [
        {
          accountId:   account._id,
          userId:      account.userId,
          type:        txType,
          amount:      Math.abs(amount),
          currency:    isBitcoin ? "BTC" : account.currency,
          status:      "completed",
          description,
          reference,
          isGenerated: false,
          processedAt: new Date(),
        },
      ],
      { session }
    )

    createdTx = tx

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  await createAuditLog(
    adminId, adminEmail, "account.balance_adjust", "Account", accountId,
    { amount, description, accountId },
    req
  )

  return {
    id:          String(createdTx!._id),
    reference:   createdTx!.reference,
    type:        createdTx!.type,
    amount:      createdTx!.amount / 100,
    currency:    createdTx!.currency,
    status:      createdTx!.status,
    description: createdTx!.description ?? "",
    createdAt:   new Date(createdTx!.createdAt).toISOString(),
  }
}

// ── Set Account Balance Directly (no transaction created) ─────────────────────

export async function setAccountBalanceDirectly(
  accountId:  string,
  newBalance: number,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<{ success: true; accountId: string; newBalance: number }> {
  await connectDB()

  const account = await Account.findById(accountId)
  if (!account) throw new Error("Account not found")

  const isBitcoin    = account.walletType === "bitcoin"
  const balanceField = isBitcoin ? "btcBalance" : "balance"
  const oldBalance   = isBitcoin ? account.btcBalance : account.balance

  if (newBalance < 0) {
    throw new Error("Balance cannot be negative")
  }

  await Account.findByIdAndUpdate(accountId, { [balanceField]: newBalance })

  await createAuditLog(
    adminId, adminEmail, "account.balance_set_direct", "Account", accountId,
    { oldBalance, newBalance, accountId, walletType: account.walletType },
    req
  )

  return { success: true, accountId, newBalance }
}

// ── Create Admin Transaction (Credit/Debit with full details) ─────────────────

interface CreateAdminTransactionParams {
  userId:          string
  accountId:       string
  amount:          number  // positive = credit, negative = debit (in cents/satoshis)
  senderName:      string
  senderBank:      string
  receiverName:    string
  receiverBank:    string
  transferScope:   string
  description:     string
  transactionDate: Date
  sendEmail:       boolean
  adminId:         string
  adminEmail:      string
  req?:            Request
}

export async function createAdminTransaction(
  params: CreateAdminTransactionParams
): Promise<TransactionData> {
  await connectDB()

  const {
    accountId, amount, senderName, senderBank, receiverName, receiverBank,
    transferScope, description, transactionDate,
    sendEmail, adminId, adminEmail, req
  } = params

  const session = await mongoose.startSession()
  let createdTx: InstanceType<typeof Transaction> | null = null

  try {
    session.startTransaction()

    const account = await Account.findById(accountId)
      .populate("userId", "firstName lastName email")
      .session(session)
    if (!account) throw new Error("Account not found")

    const isBitcoin    = account.walletType === "bitcoin"
    const balanceField = isBitcoin ? "btcBalance" : "balance"
    const current      = isBitcoin ? account.btcBalance : account.balance

    // Check for sufficient funds on debit
    if (amount < 0 && current + amount < 0) {
      throw new Error(
        `Insufficient balance. Current: ${current}, adjustment: ${amount}`
      )
    }

    // Update balance
    await Account.findByIdAndUpdate(
      accountId,
      { $inc: { [balanceField]: amount } },
      { session }
    )

    // Determine transaction type based on transfer scope and direction
    const isCredit = amount >= 0
    let txType: string
    if (transferScope === "crypto") {
      txType = isCredit ? "deposit" : "withdrawal"
    } else if (transferScope === "internal") {
      txType = isCredit ? "transfer_in" : "transfer_out"
    } else {
      txType = isCredit ? "admin_deposit" : "withdrawal"
    }

    // Map transfer scope to transferType
    let transferType: "internal" | "local_external" | "international" | undefined
    if (transferScope === "international_transfer") {
      transferType = "international"
    } else if (transferScope === "local_transfer" || transferScope === "ach_transfer" || transferScope === "check") {
      transferType = "local_external"
    } else if (transferScope === "internal") {
      transferType = "internal"
    }

    const reference = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    // Get user details for receiver info
    const user = account.userId as unknown as { _id: unknown; firstName: string; lastName: string; email: string }
    const newBalance = current + amount
    const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "NovaPay"

    const [tx] = await Transaction.create(
      [
        {
          accountId:    account._id,
          userId:       account.userId,
          type:         txType,
          amount:       Math.abs(amount),
          currency:     isBitcoin ? "BTC" : account.currency,
          status:       "completed",
          description,
          reference,
          transferType,
          balanceBefore: current,
          balanceAfter:  newBalance,
          sender: {
            name: senderName,
            bankName: senderBank || bankName,
            email: !isCredit ? user.email : undefined,
            accountNumber: !isCredit ? account.accountNumber : undefined,
          },
          receiver: {
            name: receiverName,
            bankName: receiverBank || bankName,
            email: isCredit ? user.email : undefined,
            accountNumber: isCredit ? account.accountNumber : undefined,
          },
          isGenerated:  false,
          processedAt:  transactionDate,
          createdAt:    transactionDate,
          metadata: {
            transferScope,
            adminCreated: true,
            adminId,
            adminEmail,
          },
        },
      ],
      { session }
    )

    createdTx = tx

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }

  // Audit log
  await createAuditLog(
    adminId, adminEmail, "account.admin_transaction", "Account", accountId,
    { amount, description, transferScope, transactionDate: transactionDate.toISOString(), accountId },
    req
  )

  // Notify the user. The in-app notification is ALWAYS created (matching every
  // other transaction flow); the email is only sent when the admin opts in.
  {
    const { notifyUser } = await import("@/lib/services/deposit.service")
    const account = await Account.findById(accountId).populate("userId", "firstName lastName email")
    const user = account?.userId as unknown as { _id: unknown; firstName: string; lastName: string; email: string } | null

    if (user) {
      const isBitcoin = account?.walletType === "bitcoin"
      const isCredit = amount >= 0
      const absAmount = Math.abs(amount)
      const formattedAmount = isBitcoin
        ? `${(absAmount / 1e8).toFixed(8)} BTC`
        : new Intl.NumberFormat("en-US", { style: "currency", currency: account?.currency ?? "USD" }).format(absAmount / 100)

      const subject = isCredit ? "Account Credited" : "Account Debited"
      const message = `Your account has been ${isCredit ? "credited" : "debited"} with ${formattedAmount}.${description ? ` ${description}` : ""}`

      // In-app notification (bell) — always
      await notifyUser(
        String(user._id),
        "transaction",
        subject,
        message,
        { reference: createdTx!.reference, transferScope, emailSent: sendEmail }
      )

      // Email notification — only when requested
      if (sendEmail) {
        try {
          const { sendCustomEmail } = await import("@/lib/email")
          const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "NovaPay"
          const accent = isCredit ? "#12B76A" : "#F04438"
          const html = `
            <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#101828">
              <h2 style="font-size:20px;font-weight:600;margin:0 0 8px">${subject}</h2>
              <p style="font-size:14px;color:#667085;margin:0 0 24px">Hello ${user.firstName},</p>
              <div style="border:1px solid #EAECF0;border-radius:12px;padding:20px;background:#F9FAFB">
                <p style="font-size:13px;color:#667085;margin:0 0 4px">Amount ${isCredit ? "credited" : "debited"}</p>
                <p style="font-size:26px;font-weight:700;margin:0;color:${accent}">${isCredit ? "+" : "−"}${formattedAmount}</p>
                ${description ? `<p style="font-size:13px;color:#667085;margin:16px 0 0">${description}</p>` : ""}
                <p style="font-size:12px;color:#98A2B3;margin:16px 0 0">Reference: ${createdTx!.reference}</p>
              </div>
              <p style="font-size:12px;color:#98A2B3;margin:24px 0 0">If you did not expect this, please contact ${bankName} support immediately.</p>
            </div>`
          await sendCustomEmail(user.email, `${subject} — ${bankName}`, html)
        } catch (err) {
          console.error("[createAdminTransaction] email send failed", err)
        }
      }
    }
  }

  const div = createdTx!.currency === "BTC" ? 1e8 : 100

  return {
    id:          String(createdTx!._id),
    reference:   createdTx!.reference,
    type:        createdTx!.type,
    amount:      createdTx!.amount / div,
    currency:    createdTx!.currency,
    status:      createdTx!.status,
    description: createdTx!.description ?? "",
    createdAt:   new Date(createdTx!.createdAt).toISOString(),
  }
}

// ── Random helpers (used by the create-user API route) ────────────────────────

export function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("")
}

export function randomAlphaNum(n: number): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
}
