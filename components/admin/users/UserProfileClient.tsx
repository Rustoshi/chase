"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter }          from "next/navigation"
import Link                   from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import {
  Mail, Phone, Calendar, Copy, Check, ArrowLeft,
  ExternalLink, AlertTriangle, ShieldCheck, ShieldAlert,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge }              from "@/components/ui/badge"
import { Button }             from "@/components/ui/button"
import { StatCard }           from "@/components/admin/StatCard"
import { StatusBadge }        from "@/components/admin/StatusBadge"
import { DataTable }          from "@/components/admin/DataTable"
import { UserAvatar }         from "./UserAvatar"
import { EditUserModal }      from "./modals/EditUserModal"
import { TransactionModal }   from "./modals/TransactionModal"
import { ResetPasswordModal } from "./modals/ResetPasswordModal"
import { SuspendModal }       from "./modals/SuspendModal"
import { UserAlertModal }     from "./modals/UserAlertModal"
import { AdminVerifyModal }   from "@/components/admin/kyc/modals/AdminVerifyModal"
import { cn }                 from "@/lib/utils"
import { formatCurrency, getCurrencySymbol } from "@/lib/utils/currency"
import type { UserDetail, TransactionData, KycDocData } from "@/lib/services/user.service"

interface Props {
  user: UserDetail
}

interface AuditEntry {
  id: string; action: string; adminEmail: string; adminName: string
  targetType?: string; payload?: Record<string, unknown>
  createdAt: string; ipAddress?: string
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="ml-1 text-slate-400 hover:text-slate-600"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// ── KYC Document card ─────────────────────────────────────────────────────────
function KycCard({ doc, userId }: { doc: KycDocData; userId: string }) {
  const [loading,  setLoading]  = useState(false)

  const review = async (action: "approve" | "reject", note?: string) => {
    setLoading(true)
    await fetch(`/api/admin/kyc/${doc.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected", reviewNote: note }),
    })
    setLoading(false)
    // parent will refresh via router.refresh() — caller should call onSuccess
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={doc.docType.replace(/_/g, " ")} />
            <StatusBadge status={doc.status} />
          </div>
          <p className="text-xs text-slate-400">
            Submitted {format(new Date(doc.submittedAt), "MMM d, yyyy")}
            {doc.reviewedAt && ` · Reviewed ${format(new Date(doc.reviewedAt), "MMM d, yyyy")}`}
          </p>
          {doc.reviewNote && (
            <p className="text-sm text-slate-600 mt-1">{doc.reviewNote}</p>
          )}
        </div>
        {doc.docUrl && (
          <a
            href={doc.docUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#1A2CCE]/30 px-3 py-2 text-xs font-medium text-[#1A2CCE] hover:bg-[#1A2CCE]/5 sm:w-auto sm:shrink-0"
          >
            View document <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {doc.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => review("approve")} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Approve
          </Button>
          <Button size="sm" variant="outline" onClick={() => review("reject", "Rejected by admin")} disabled={loading}
            className="border-red-200 text-red-600 hover:bg-red-50">
            Reject
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Audit trail tab ───────────────────────────────────────────────────────────
function AuditTrailTab({ userId }: { userId: string }) {
  const [logs,    setLogs]    = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [page,    setPage]    = useState(1)
  const [total,   setTotal]   = useState(0)

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    setError(false)
    try {
      const res  = await fetch(`/api/admin/audit-log?targetId=${userId}&page=${p}&limit=20`)
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchLogs(1) }, [fetchLogs])

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#1A2CCE]" />
    </div>
  )
  if (error) return (
    <p className="py-10 text-center text-sm text-red-500">Failed to load audit trail.</p>
  )
  if (!logs.length) return (
    <p className="py-10 text-center text-sm text-slate-400">No admin actions recorded for this user.</p>
  )

  return (
    <div className="space-y-3">
      {logs.map((entry) => (
        <div key={entry.id} className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#1A2CCE]/10 text-[#1A2CCE]">
            <AlertTriangle className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                {entry.action}
              </span>
              <span className="text-xs text-slate-500">by {entry.adminName}</span>
              <span className="ml-auto text-xs text-slate-400">
                {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
              </span>
            </div>
            {entry.payload && Object.keys(entry.payload).length > 0 && (
              <details className="mt-1.5">
                <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
                  View payload
                </summary>
                <pre className="mt-1 overflow-x-auto rounded bg-white p-2 text-[11px] text-slate-700 border border-slate-200">
                  {JSON.stringify(entry.payload, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      ))}

      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          {page > 1 && (
            <Button variant="outline" size="sm" onClick={() => { const p = page - 1; setPage(p); fetchLogs(p) }}>
              Previous
            </Button>
          )}
          <span className="flex items-center text-sm text-slate-500">Page {page}</span>
          {logs.length === 20 && (
            <Button variant="outline" size="sm" onClick={() => { const p = page + 1; setPage(p); fetchLogs(p) }}>
              Next
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function UserProfileClient({ user: initialUser }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<UserDetail>(initialUser)

  // All of this user's fiat figures are displayed in *their* preferred currency,
  // matching what the user sees in their own portal.
  const userCurrency = user.preferredCurrency || "USD"
  const fmtFiat = (n: number) => formatCurrency(n, userCurrency)
  const fmtAmount = (amount: number, currency: string) =>
    currency === "BTC" ? `₿${amount.toFixed(8)}` : fmtFiat(amount)

  // Modal state
  const [modal, setModal] = useState<
    "edit" | "credit" | "debit" | "reset" | "suspend" | "verify-kyc" | "alert" | null
  >(null)
  const [balanceAccountId, setBalanceAccountId] = useState<string | undefined>()

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${user.id}`)
    if (res.ok) {
      const updated = await res.json()
      setUser(updated)
    }
    router.refresh()
  }, [user.id, router])

  const openCredit = (accountId?: string) => {
    setBalanceAccountId(accountId)
    setModal("credit")
  }

  const openDebit = (accountId?: string) => {
    setBalanceAccountId(accountId)
    setModal("debit")
  }

  // Derived counts
  const openTickets = user.supportTickets.filter((t) => t.status === "open" || t.status === "in_progress").length

  return (
    <>
      <div className="space-y-6 min-w-0 overflow-hidden">
        {/* ── Back ── */}
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to users
        </Link>

        {/* ── Section 1: Profile header ── */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start gap-4 sm:gap-6">
            <UserAvatar firstName={user.firstName} lastName={user.lastName} size="lg" avatarUrl={user.avatarUrl} />

            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h1>

              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-4 sm:gap-y-1 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{user.email}</span></span>
                {user.phone && (
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 shrink-0" />{user.phone}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:inline">Joined {format(new Date(user.createdAt), "MMM d, yyyy")} ({user.joinedDaysAgo} days ago)</span>
                  <span className="sm:hidden">{format(new Date(user.createdAt), "MMM d, yyyy")}</span>
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={user.role === "admin" ? "warning" : "secondary"}>
                  {user.role === "admin" ? "Admin" : "User"}
                </Badge>
                <StatusBadge status={user.kycStatus} />
                <StatusBadge status={user.isSuspended ? "suspended" : user.isActive ? "active" : "inactive"} />
                {user.emailVerified && <Badge variant="success">Email verified</Badge>}
                {user.twoFactorEnabled && <Badge variant="outline">2FA enabled</Badge>}
                <Badge variant="outline">
                  Currency: {getCurrencySymbol(userCurrency)} {userCurrency}
                </Badge>
              </div>

              {user.referralCode && (
                <p className="mt-2 text-xs text-slate-400">
                  Referral code: <span className="font-mono font-medium">{user.referralCode}</span>
                  <CopyButton value={user.referralCode} />
                </p>
              )}

              {user.isSuspended && user.suspendReason && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{user.suspendReason}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:self-start">
              <Button onClick={() => setModal("edit")} size="sm" className="flex-1 sm:flex-none">Edit</Button>
              {user.kycStatus !== "verified" && (
                <Button
                  onClick={() => setModal("verify-kyc")}
                  size="sm"
                  className="flex-1 sm:flex-none gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <ShieldCheck className="h-3.5 w-3.5" /> Verify KYC
                </Button>
              )}
              <Button variant="outline" onClick={() => openCredit()} size="sm" className="flex-1 sm:flex-none border-emerald-200 text-emerald-700 hover:bg-emerald-50">Credit</Button>
              <Button variant="outline" onClick={() => openDebit()} size="sm" className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50">Debit</Button>
              <Button variant="outline" onClick={() => setModal("reset")} size="sm" className="flex-1 sm:flex-none">Reset PW</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModal("alert")}
                className="flex-1 sm:flex-none gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Alert
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModal("suspend")}
                className={`flex-1 sm:flex-none ${user.isSuspended
                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  : "border-red-200 text-red-700 hover:bg-red-50"
                }`}
              >
                {user.isSuspended ? "Unsuspend" : "Suspend"}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Section 2: Stats row ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          <StatCard label="Total deposited"   value={fmtFiat(user.totalDeposited)} />
          <StatCard label="Total transferred"  value={fmtFiat(user.totalTransferred)} />
          <StatCard label="Active accounts"    value={user.accounts.length} />
          <StatCard label="Open tickets"       value={openTickets} />
        </div>

        {/* ── Section 3: Accounts ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-900">Accounts</h2>
          {user.accounts.length === 0 && (
            <p className="text-sm text-slate-400">No accounts found.</p>
          )}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {user.accounts.map((account) => (
              <div key={account.id} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm sm:text-base">
                        {account.walletType === "bitcoin" ? "Bitcoin Wallet" : `${account.currency} ${account.accountType ?? ""}`}
                      </p>
                      {account.isFrozen && <StatusBadge status="frozen" />}
                    </div>
                    <p className="mt-0.5 font-mono text-xs text-slate-400 truncate">
                      {account.accountNumber}
                      <CopyButton value={account.accountNumber} />
                    </p>
                  </div>

                  <div className="sm:text-right sm:shrink-0">
                    {account.walletType === "bitcoin" ? (
                      <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                        {account.btcBalance.toFixed(8)} <span className="text-xs sm:text-sm font-normal text-slate-500">BTC</span>
                      </p>
                    ) : (
                      <p className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                        {fmtFiat(account.balance)}
                      </p>
                    )}
                  </div>
                </div>

                {account.walletType === "fiat" && (account.routingNumber || account.swiftCode || account.iban) && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                    {account.routingNumber && (
                      <span>Routing: <span className="font-mono">{account.routingNumber}</span></span>
                    )}
                    {account.swiftCode && (
                      <span>SWIFT: <span className="font-mono">{account.swiftCode}</span></span>
                    )}
                    {account.iban && (
                      <span className="col-span-2">IBAN: <span className="font-mono">{account.iban}</span></span>
                    )}
                  </div>
                )}

                {account.walletType === "bitcoin" && account.btcAddress && (
                  <div className="mt-3 text-xs text-slate-500">
                    Address: <span className="font-mono">{account.btcAddress.slice(0, 16)}…</span>
                    <CopyButton value={account.btcAddress} />
                  </div>
                )}

                {account.freezeReason && (
                  <p className="mt-2 text-xs text-red-600">{account.freezeReason}</p>
                )}

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openCredit(account.id)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                    Credit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openDebit(account.id)} className="border-red-200 text-red-700 hover:bg-red-50">
                    Debit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 4: Tabbed details ── */}
        <Tabs defaultValue="transactions" className="min-w-0">
          <TabsList className="flex w-full flex-wrap gap-x-1 gap-y-0">
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
            <TabsTrigger value="deposits" className="text-xs sm:text-sm">Deposits</TabsTrigger>
            <TabsTrigger value="kyc" className="text-xs sm:text-sm">KYC ({user.kycDocuments.length})</TabsTrigger>
            <TabsTrigger value="loans" className="text-xs sm:text-sm">Loans ({user.loanApplications.length})</TabsTrigger>
            <TabsTrigger value="cards" className="text-xs sm:text-sm">Cards ({user.cardApplications.length})</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs sm:text-sm">Audit</TabsTrigger>
          </TabsList>

          {/* Transactions */}
          <TabsContent value="transactions" className="mt-5 overflow-x-auto">
            <DataTable
              columns={[
                { key: "reference", label: "Reference",
                  render: (r: TransactionData) => <span className="font-mono text-xs">{r.reference}</span> },
                { key: "type", label: "Type",
                  render: (r: TransactionData) => <StatusBadge status={r.type.replace(/_/g, " ")} /> },
                { key: "amount", label: "Amount", sortable: true,
                  render: (r: TransactionData) => {
                    const positive = ["deposit","transfer_in","admin_deposit","swap_in","loan_disbursement","refund"].includes(r.type)
                    return (
                      <span className={cn("font-medium", positive ? "text-emerald-600" : "text-red-500")}>
                        {positive ? "+" : "−"}{fmtAmount(r.amount, r.currency)}
                      </span>
                    )
                  } },
                { key: "status", label: "Status",
                  render: (r: TransactionData) => <StatusBadge status={r.status} /> },
                { key: "createdAt", label: "Date",
                  render: (r: TransactionData) => (
                    <span className="text-xs text-slate-400">
                      {format(new Date(r.createdAt), "MMM d, yyyy")}
                    </span>
                  ) },
              ] as unknown as Parameters<typeof DataTable>[0]["columns"]}
              data={user.recentTransactions as unknown as Record<string, unknown>[]}
              emptyMessage="No transactions yet."
            />
            <div className="mt-3 text-right">
              <Link href={`/admin/transactions?userId=${user.id}`} className="text-sm text-[#1A2CCE] hover:underline">
                View all transactions →
              </Link>
            </div>
          </TabsContent>

          {/* Deposit requests */}
          <TabsContent value="deposits" className="mt-5 overflow-x-auto">
            <DataTable
              columns={[
                { key: "createdAt", label: "Date",
                  render: (r) => <span className="text-xs text-slate-400">{format(new Date(String(r.createdAt)), "MMM d, yyyy")}</span> },
                { key: "paymentMethodName", label: "Method",
                  render: (r) => <span className="text-slate-600">{String(r.paymentMethodName ?? "—")}</span> },
                { key: "requestedAmount", label: "Amount", sortable: true,
                  render: (r) => <span className="font-medium">{formatCurrency(Number(r.requestedAmount), String(r.requestedCurrency || userCurrency))}</span> },
                { key: "status", label: "Status",
                  render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: "adminNote", label: "Admin note",
                  render: (r) => <span className="text-xs text-slate-400">{String(r.adminNote ?? "—")}</span> },
              ]}
              data={user.depositRequests as unknown as Record<string, unknown>[]}
              emptyMessage="No deposit requests."
            />
            <div className="mt-3 text-right">
              <Link href={`/admin/deposits?userId=${user.id}`} className="text-sm text-[#1A2CCE] hover:underline">
                View all →
              </Link>
            </div>
          </TabsContent>

          {/* KYC documents */}
          <TabsContent value="kyc" className="mt-5">
            {user.kycDocuments.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No KYC documents submitted.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {user.kycDocuments.map((doc) => (
                  <KycCard key={doc.id} doc={doc} userId={user.id} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Loans */}
          <TabsContent value="loans" className="mt-5 overflow-x-auto">
            <DataTable
              columns={[
                { key: "amount",     label: "Amount",  sortable: true,
                  render: (r) => <span className="font-medium">{fmtFiat(Number(r.amount))}</span> },
                { key: "purpose",    label: "Purpose",
                  render: (r) => <span className="text-slate-600 truncate max-w-[180px] block">{String(r.purpose)}</span> },
                { key: "termMonths", label: "Term",
                  render: (r) => <span className="text-slate-500">{String(r.termMonths)} months</span> },
                { key: "status",     label: "Status",
                  render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: "interestRate", label: "Rate",
                  render: (r) => <span className="text-slate-500">{r.interestRate != null ? `${r.interestRate}%` : "—"}</span> },
                { key: "appliedAt",  label: "Applied",
                  render: (r) => <span className="text-xs text-slate-400">{format(new Date(String(r.appliedAt)), "MMM d, yyyy")}</span> },
              ]}
              data={user.loanApplications as unknown as Record<string, unknown>[]}
              emptyMessage="No loan applications."
            />
          </TabsContent>

          {/* Cards */}
          <TabsContent value="cards" className="mt-5 overflow-x-auto">
            <DataTable
              columns={[
                { key: "cardType",    label: "Card",
                  render: (r) => (
                    <div className="min-w-0">
                      <span className="capitalize font-medium">{String(r.cardNetwork ?? "visa")} {String(r.cardType)}</span>
                      <span className="block text-[11px] text-slate-400">{r.isVirtual ? "Virtual" : "Physical"}</span>
                    </div>
                  ) },
                { key: "creditLimit", label: "Credit limit",
                  render: (r) => <span>{r.creditLimit != null ? fmtFiat(Number(r.creditLimit)) : "—"}</span> },
                { key: "spendingLimit", label: "Spending limit",
                  render: (r) => <span>{r.spendingLimit != null ? fmtFiat(Number(r.spendingLimit)) : "—"}</span> },
                { key: "status",      label: "Status",
                  render: (r) => <StatusBadge status={String(r.status)} /> },
                { key: "cardNumber",  label: "Card number",
                  render: (r) => {
                    const n = String(r.cardNumber ?? "")
                    return <span className="font-mono text-xs">{n ? `•••• •••• •••• ${n.slice(-4)}` : "—"}</span>
                  } },
                { key: "appliedAt",   label: "Applied",
                  render: (r) => <span className="text-xs text-slate-400">{format(new Date(String(r.appliedAt)), "MMM d, yyyy")}</span> },
                { key: "actions",     label: "",
                  render: (r) => (
                    <Button asChild size="sm" variant="outline" className="h-8 px-3 text-xs whitespace-nowrap">
                      <Link href={`/admin/cards/${String(r.id)}`}>Manage card</Link>
                    </Button>
                  ) },
              ]}
              data={user.cardApplications as unknown as Record<string, unknown>[]}
              emptyMessage="No card applications."
            />
          </TabsContent>

          {/* Audit trail */}
          <TabsContent value="audit" className="mt-5 overflow-x-auto">
            <AuditTrailTab userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Modals ── */}
      {modal === "edit" && (
        <EditUserModal
          open
          onClose={() => setModal(null)}
          onSuccess={refresh}
          user={user}
        />
      )}

      {(modal === "credit" || modal === "debit") && (
        <TransactionModal
          open
          onClose={() => setModal(null)}
          onSuccess={refresh}
          user={user}
          preselect={balanceAccountId}
          mode={modal}
        />
      )}

      {modal === "reset" && (
        <ResetPasswordModal
          open
          onClose={() => setModal(null)}
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}

      {modal === "suspend" && (
        <SuspendModal
          open
          onClose={() => setModal(null)}
          onSuccess={refresh}
          userId={user.id}
          isSuspended={user.isSuspended}
          suspendReason={user.suspendReason}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}

      {modal === "alert" && (
        <UserAlertModal
          open
          onClose={() => setModal(null)}
          onSuccess={refresh}
          userId={user.id}
          userName={`${user.firstName} ${user.lastName}`}
        />
      )}

      <AdminVerifyModal
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        open={modal === "verify-kyc"}
        onOpenChange={(v) => setModal(v ? "verify-kyc" : null)}
        onSuccess={refresh}
      />
    </>
  )
}
