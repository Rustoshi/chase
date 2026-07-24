import { connectDB }   from "@/lib/db/connection"
import User            from "@/lib/models/User"
import Account         from "@/lib/models/Account"
import Transaction     from "@/lib/models/Transaction"
import DepositRequest  from "@/lib/models/DepositRequest"

// ── Shared types ────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalUsers:          number
  newUsersThisWeek:    number
  userDeltaPercent:    number | null
  totalAccounts:       number
  fiatBalanceUSD:      number   // cents → dollars already divided
  btcBalanceBTC:       number   // satoshis → BTC already divided
  pendingDeposits:     number
  pendingKyc:          number
  pendingTransactions: number
  volume30dUSD:        number   // sum of completed transactions last 30d
}

export interface RecentTransaction {
  _id:         string
  reference:   string
  type:        string
  amount:      number
  currency:    string
  status:      string
  description: string
  createdAt:   string
  userName:    string
  accountNumber: string
}

export interface RecentUser {
  _id:       string
  firstName: string
  lastName:  string
  email:     string
  kycStatus: string
  isActive:  boolean
  createdAt: string
}

export interface PendingActions {
  pendingDeposits:     number
  pendingKyc:          number
  pendingTransactions: number
  suspendedUsers:      number
}

export interface VolumeChartPoint {
  date:   string   // "YYYY-MM-DD"
  volume: number   // USD, already divided
}

export interface GrowthChartPoint {
  date:  string
  users: number
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function startOfDayUtc(daysAgo: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - daysAgo)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ── Service functions ────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectDB()

  const weekAgo     = startOfDayUtc(7)
  const twoWeeksAgo = startOfDayUtc(14)
  const thirtyAgo   = startOfDayUtc(30)

  const [
    totalUsers,
    newThisWeek,
    newLastWeek,
    totalAccounts,
    fiatAgg,
    btcAgg,
    pendingDeposits,
    pendingKyc,
    pendingTransactions,
    volumeAgg,
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: "admin" } }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: { $ne: "admin" }, createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    Account.countDocuments(),
    Account.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$balance" } } },
    ]),
    Account.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: "$btcBalance" } } },
    ]),
    DepositRequest.countDocuments({ status: "pending" }),
    User.countDocuments({ role: { $ne: "admin" }, kycStatus: "pending" }),
    Transaction.countDocuments({ status: "pending" }),
    Transaction.aggregate<{ total: number }>([
      {
        $match: {
          status:    "completed",
          createdAt: { $gte: thirtyAgo },
          type:      { $in: ["deposit", "transfer_in", "admin_deposit"] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
  ])

  const fiatCents = (fiatAgg[0]?.total ?? 0)
  const btcSats   = (btcAgg[0]?.total ?? 0)
  const vol30     = (volumeAgg[0]?.total ?? 0)

  let userDeltaPercent: number | null = null
  if (newLastWeek > 0) {
    userDeltaPercent = ((newThisWeek - newLastWeek) / newLastWeek) * 100
  } else if (newThisWeek > 0) {
    userDeltaPercent = 100
  }

  return {
    totalUsers,
    newUsersThisWeek:    newThisWeek,
    userDeltaPercent,
    totalAccounts,
    fiatBalanceUSD:      fiatCents / 100,
    btcBalanceBTC:       btcSats  / 1e8,
    pendingDeposits,
    pendingKyc,
    pendingTransactions,
    volume30dUSD:        vol30 / 100,
  }
}

export async function getRecentTransactions(limit = 10): Promise<RecentTransaction[]> {
  await connectDB()

  const rows = await Transaction.aggregate([
    { $sort: { createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from:         "users",
        localField:   "userId",
        foreignField: "_id",
        as:           "user",
      },
    },
    {
      $lookup: {
        from:         "accounts",
        localField:   "accountId",
        foreignField: "_id",
        as:           "account",
      },
    },
    { $unwind: { path: "$user",    preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$account", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        reference:     1,
        type:          1,
        amount:        1,
        currency:      1,
        status:        1,
        description:   1,
        createdAt:     1,
        userName:      { $concat: ["$user.firstName", " ", "$user.lastName"] },
        accountNumber: "$account.accountNumber",
      },
    },
  ])

  return rows.map((r) => ({
    _id:           String(r._id),
    reference:     r.reference ?? "",
    type:          r.type,
    amount:        r.amount / 100,
    currency:      r.currency,
    status:        r.status,
    description:   r.description ?? "",
    createdAt:     new Date(r.createdAt).toISOString(),
    userName:      r.userName ?? "Unknown",
    accountNumber: r.accountNumber ?? "",
  }))
}

export async function getRecentUsers(limit = 10): Promise<RecentUser[]> {
  await connectDB()

  const users = await User.find({ role: { $ne: "admin" } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return users.map((u) => ({
    _id:       String(u._id),
    firstName: u.firstName,
    lastName:  u.lastName,
    email:     u.email,
    kycStatus: u.kycStatus,
    isActive:  u.isActive,
    createdAt: new Date(u.createdAt).toISOString(),
  }))
}

export async function getPendingActions(): Promise<PendingActions> {
  await connectDB()

  const [pendingDeposits, pendingKyc, pendingTransactions, suspendedUsers] =
    await Promise.all([
      DepositRequest.countDocuments({ status: "pending" }),
      User.countDocuments({ role: { $ne: "admin" }, kycStatus: "pending" }),
      Transaction.countDocuments({ status: "pending" }),
      User.countDocuments({ role: { $ne: "admin" }, isSuspended: true }),
    ])

  return { pendingDeposits, pendingKyc, pendingTransactions, suspendedUsers }
}

export async function getVolumeChartData(days = 30): Promise<VolumeChartPoint[]> {
  await connectDB()

  const since = startOfDayUtc(days - 1)

  const rows = await Transaction.aggregate<{ _id: string; volume: number }>([
    {
      $match: {
        status:    "completed",
        createdAt: { $gte: since },
        type:      { $in: ["deposit", "transfer_in", "admin_deposit"] },
      },
    },
    {
      $group: {
        _id:    { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        volume: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ])

  // Fill in missing days with 0
  const map = new Map(rows.map((r) => [r._id, r.volume]))
  const result: VolumeChartPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d   = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, volume: (map.get(key) ?? 0) / 100 })
  }
  return result
}

export async function getUserGrowthData(days = 30): Promise<GrowthChartPoint[]> {
  await connectDB()

  const since = startOfDayUtc(days - 1)

  const rows = await User.aggregate<{ _id: string; users: number }>([
    { $match: { role: { $ne: "admin" }, createdAt: { $gte: since } } },
    {
      $group: {
        _id:   { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        users: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const map = new Map(rows.map((r) => [r._id, r.users]))
  const result: GrowthChartPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d   = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, users: map.get(key) ?? 0 })
  }
  return result
}
