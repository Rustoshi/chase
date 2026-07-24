"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Copy, Check, ChevronDown, ChevronUp, Snowflake, Sun,
  QrCode, Share2, ArrowDownToLine, ArrowUpFromLine,
  Hash, Calendar, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BANK_NAME } from "@/lib/brand"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import { WalletCard } from "@/components/user/shared/WalletCard"
import { TransactionRow } from "@/components/user/shared/TransactionRow"
import { Button } from "@/components/ui/button"
import type { AccountDetail } from "@/lib/services/dashboard-user.service"

interface Props {
  account:        AccountDetail
  btcRate:        number
  adminBtcWallet: string | null
}

// ── Copy hook ─────────────────────────────────────────────────────────────────

function useCopy() {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch { /* */ }
  }, [])

  return { copiedField, copy }
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function AccountDetailCard({ account, btcRate, adminBtcWallet }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [freezeLoading, setFreezeLoading] = useState(false)
  const [isFrozen, setIsFrozen] = useState(account.isFrozen)
  const [confirmAction, setConfirmAction] = useState<"freeze" | "unfreeze" | null>(null)
  const { copiedField, copy } = useCopy()
  const { symbol: currencySymbol } = useCurrency()

  const isBtc = account.walletType === "bitcoin"
  const since = new Date(account.createdAt).toLocaleDateString("en-US", {
    month: "short", year: "numeric",
  })

  // Balances/totals are stored in minor units — fiat in cents, BTC in satoshis.
  const btcMajor = account.btcBalance / 1e8
  const totalDepositedMajor = isBtc ? account.totalDeposited / 1e8 : account.totalDeposited / 100
  const totalWithdrawnMajor = isBtc ? account.totalWithdrawn / 1e8 : account.totalWithdrawn / 100
  const avgTx = account.transactionCount > 0
    ? (totalDepositedMajor + totalWithdrawnMajor) / account.transactionCount
    : 0

  // ── Freeze/unfreeze ──────────────────────────────────────────────────────

  const handleFreezeToggle = async () => {
    setFreezeLoading(true)
    try {
      const action = isFrozen ? "unfreeze" : "freeze"
      const res = await fetch(`/api/user/accounts/${account._id}/${action}`, {
        method: "POST",
      })
      if (res.ok) {
        setIsFrozen(!isFrozen)
      }
    } catch { /* */ }
    setFreezeLoading(false)
    setConfirmAction(null)
  }

  // ── Share ────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const text = isBtc && adminBtcWallet
      ? `My Bitcoin address: ${adminBtcWallet}`
      : `${BANK_NAME} Account: ${account.accountNumber}`

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch { /* cancelled */ }
    }
    await copy(isBtc && adminBtcWallet ? adminBtcWallet : account.accountNumber, "share")
  }

  return (
    <div className="rounded-3xl overflow-hidden transition-shadow" style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)" }}>
      {/* Wallet card */}
      <div className="p-4 pb-3">
        <WalletCard
          account={{
            ...account,
            _id: account._id,
            // Balances are stored in minor units — WalletCard expects major units
            balance: account.balance / 100,
            btcBalance: btcMajor,
            isFrozen,
          }}
          btcUsdRate={btcRate}
        />
      </div>

      {/* Info tiles (always visible) */}
      <div className="grid grid-cols-2 gap-2 px-4">
        <InfoTile
          label="Account number"
          value={`•••• ${account.accountNumber.slice(-4)}`}
          onCopy={() => copy(account.accountNumber, "acctNum")}
          copied={copiedField === "acctNum"}
        />
        {(isBtc ? adminBtcWallet : true) && (
          <InfoTile
            label={isBtc ? "BTC address" : "Routing number"}
            value={
              isBtc
                ? adminBtcWallet
                  ? `${adminBtcWallet.slice(0, 6)}...${adminBtcWallet.slice(-4)}`
                  : "—"
                : account.routingNumber || "—"
            }
            onCopy={() =>
              copy(isBtc && adminBtcWallet ? adminBtcWallet : account.routingNumber, "secondary")
            }
            copied={copiedField === "secondary"}
          />
        )}
        <InfoTile
          label="Account type"
          value={isBtc ? "Bitcoin wallet" : "Fiat checking"}
          badge
        />
        <InfoTile
          label="Opened"
          value={`Since ${since}`}
          icon={<Calendar className="h-3 w-3 text-[#98A2B3]" />}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 px-4 mt-4">
        <button
          onClick={() => router.push(`/app/transactions?accountId=${account._id}`)}
          className="flex-1 flex items-center justify-center h-10 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
          style={{ border: "1px solid #D0D5DD", color: "#667085" }}
        >
          View transactions
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 h-10 rounded-xl px-4 text-[13px] font-medium transition-all active:scale-[0.98]"
          style={{ color: "#1A2CCE" }}
        >
          {expanded ? (
            <>Hide details <ChevronUp className="ml-0.5 h-3.5 w-3.5" /></>
          ) : (
            <>Show details <ChevronDown className="ml-0.5 h-3.5 w-3.5" /></>
          )}
        </button>
      </div>

      {/* ── Expanded section ── */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="mt-4 pt-4 px-4 pb-5 space-y-5" style={{ borderTop: "1px solid #EAECF0" }}>
          {/* Full account details */}
          {!isBtc ? (
            <div className="space-y-2">
              <p className="text-[12px] font-medium uppercase tracking-[0.1em]" style={{ color: "#98A2B3" }}>Account details</p>
              <CopyField label="Account number" value={account.accountNumber} fieldKey="fullAcct" copiedField={copiedField} onCopy={copy} />
              {account.routingNumber && (
                <CopyField label="Routing number" value={account.routingNumber} fieldKey="routing" copiedField={copiedField} onCopy={copy} />
              )}
              {account.swiftCode && (
                <CopyField label="SWIFT code" value={account.swiftCode} fieldKey="swift" copiedField={copiedField} onCopy={copy} />
              )}
              {account.iban && (
                <CopyField label="IBAN" value={account.iban} fieldKey="iban" copiedField={copiedField} onCopy={copy} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[12px] font-medium uppercase tracking-[0.1em]" style={{ color: "#98A2B3" }}>Bitcoin wallet</p>
              {adminBtcWallet && (
                <CopyField label="BTC address" value={adminBtcWallet} fieldKey="btcAddr" copiedField={copiedField} onCopy={copy} />
              )}

              {adminBtcWallet && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQR(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
                    style={{ border: "1px solid #D0D5DD", color: "#667085" }}
                  >
                    <QrCode className="h-3.5 w-3.5" /> Show QR
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
                    style={{ border: "1px solid #D0D5DD", color: "#667085" }}
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share address
                  </button>
                </div>
              )}

              <div className="rounded-2xl p-4 space-y-1" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
                <p className="text-[12px]" style={{ color: "#98A2B3" }}>BTC Balance</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: "#101828" }}>
                  {btcMajor.toFixed(8)} BTC
                </p>
                <p className="text-[13px] tabular-nums" style={{ color: "#667085" }}>
                  ≈ ${(btcMajor * btcRate).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </p>
                {btcRate > 0 && (
                  <p className="text-[10px] mt-1" style={{ color: "#98A2B3" }}>
                    1 BTC = ${btcRate.toLocaleString()} · Updated moments ago
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Account stats */}
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.1em] mb-2" style={{ color: "#98A2B3" }}>Statistics</p>
            <div className="grid grid-cols-2 gap-2">
              <StatTile
                label="Total deposited"
                value={`${currencySymbol}${totalDepositedMajor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<ArrowDownToLine className="h-3.5 w-3.5" style={{ color: "#12B76A" }} />}
                color="#12B76A"
              />
              <StatTile
                label="Total withdrawn"
                value={`${currencySymbol}${totalWithdrawnMajor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={<ArrowUpFromLine className="h-3.5 w-3.5" style={{ color: "#F04438" }} />}
                color="#F04438"
              />
              <StatTile
                label="Transactions"
                value={account.transactionCount.toLocaleString()}
                icon={<Hash className="h-3.5 w-3.5" style={{ color: "#98A2B3" }} />}
              />
              <StatTile
                label="Avg. transaction"
                value={`${currencySymbol}${avgTx.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            </div>
          </div>

          {/* Recent transactions */}
          {account.recentTransactions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-medium uppercase tracking-[0.1em]" style={{ color: "#98A2B3" }}>Recent transactions</p>
                <button
                  onClick={() => router.push(`/app/transactions?accountId=${account._id}`)}
                  className="text-[13px] font-medium hover:underline"
                  style={{ color: "#1A2CCE" }}
                >
                  View all
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
                {account.recentTransactions.map((tx, i) => (
                  <div key={tx._id}>
                    <TransactionRow transaction={tx} index={i} />
                    {i < account.recentTransactions.length - 1 && (
                      <div className="ml-[72px] mr-5 h-px" style={{ background: "#EAECF0" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account actions */}
          <div className="pt-1">
            {confirmAction ? (
              <div className="rounded-2xl p-4 space-y-3" style={{ background: "#F9FAFB", border: "1px solid #EAECF0", borderLeft: confirmAction === "freeze" ? "4px solid #F79009" : "4px solid #12B76A" }}>
                <p className="text-[14px] font-medium" style={{ color: "#101828" }}>
                  {confirmAction === "freeze"
                    ? "Freeze this account? You won't be able to make transactions until you unfreeze it."
                    : "Unfreeze this account to restore full access?"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="flex-1 h-10 rounded-xl text-[13px] font-medium transition-colors"
                    style={{ border: "1px solid #D0D5DD", color: "#667085" }}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition-colors active:scale-[0.98]"
                    style={{ background: confirmAction === "freeze" ? "#F79009" : "#12B76A" }}
                    disabled={freezeLoading}
                    onClick={handleFreezeToggle}
                  >
                    {freezeLoading ? "Processing..." : confirmAction === "freeze" ? "Freeze" : "Unfreeze"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAction(isFrozen ? "unfreeze" : "freeze")}
                className="w-full h-11 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
                style={{
                  background: isFrozen ? "rgba(18,183,106,0.12)" : "rgba(247,144,9,0.12)",
                  color: isFrozen ? "#12B76A" : "#F79009",
                }}
              >
                {isFrozen ? (
                  <span className="inline-flex items-center gap-1.5"><Sun className="h-4 w-4" /> Unfreeze account</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Snowflake className="h-4 w-4" /> Freeze account</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── QR Code Modal ── */}
      {showQR && isBtc && adminBtcWallet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setShowQR(false)}>
          <div
            className="mx-4 w-full max-w-sm rounded-3xl p-6 text-center"
            style={{ background: "#FFFFFF", border: "1px solid #EAECF0", boxShadow: "0 24px 64px rgba(16,24,40,0.18)", animation: "staggerUp 200ms ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <p className="text-[16px] font-semibold" style={{ color: "#101828" }}>Bitcoin Address</p>
              <button onClick={() => setShowQR(false)} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors" style={{ background: "#F9FAFB" }}>
                <X className="h-4 w-4" style={{ color: "#667085" }} />
              </button>
            </div>

            <div className="mx-auto mb-5 flex h-48 w-48 items-center justify-center rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid #EAECF0" }}>
              <QrCodeSVG address={adminBtcWallet || ""} />
            </div>

            <p className="text-[13px] font-mono break-all leading-relaxed mb-5" style={{ color: "#667085" }}>
              {adminBtcWallet}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => copy(adminBtcWallet || "", "qrCopy")}
                className="flex-1 h-11 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]"
                style={{ border: "1px solid #D0D5DD", color: "#667085" }}
              >
                {copiedField === "qrCopy" ? (
                  <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#12B76A]" /> Copied!</span>
                ) : (
                  <span className="inline-flex items-center gap-1.5"><Copy className="h-4 w-4" /> Copy</span>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 h-11 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-[0.98]"
                style={{ background: "#1A2CCE" }}
              >
                <span className="inline-flex items-center gap-1.5"><Share2 className="h-4 w-4" /> Share</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoTile({
  label, value, onCopy, copied, badge, icon,
}: {
  label: string; value: string; onCopy?: () => void; copied?: boolean; badge?: boolean; icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "#98A2B3" }}>{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        {icon}
        {badge ? (
          <span className="inline-block rounded-lg px-2 py-0.5 text-[12px] font-medium" style={{ background: "#EEF0FE", color: "#1A2CCE" }}>
            {value}
          </span>
        ) : (
          <span className="text-[13px] font-medium truncate" style={{ color: "#101828" }}>{value}</span>
        )}
        {onCopy && (
          <button onClick={onCopy} className="ml-auto flex-shrink-0 transition-colors" style={{ color: "#98A2B3" }}>
            {copied ? <Check className="h-3.5 w-3.5" style={{ color: "#12B76A" }} /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function CopyField({
  label, value, fieldKey, copiedField, onCopy,
}: {
  label: string; value: string; fieldKey: string; copiedField: string | null
  onCopy: (text: string, field: string) => void
}) {
  const isCopied = copiedField === fieldKey
  return (
    <div className="flex items-center justify-between rounded-xl px-3.5 py-3" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ color: "#98A2B3" }}>{label}</p>
        <p className="text-[13px] font-mono truncate mt-0.5" style={{ color: "#101828" }}>{value}</p>
      </div>
      <button
        onClick={() => onCopy(value, fieldKey)}
        className="ml-3 flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg transition-all"
        style={{ color: "#98A2B3" }}
      >
        {isCopied ? <Check className="h-4 w-4" style={{ color: "#12B76A" }} /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

function StatTile({
  label, value, icon, color,
}: {
  label: string; value: string; icon?: React.ReactNode; color?: string
}) {
  return (
    <div className="rounded-2xl px-3.5 py-3" style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-[10px] font-medium uppercase tracking-[0.12em]" style={{ color: "#98A2B3" }}>{label}</p>
      </div>
      <p className="mt-1 text-[15px] font-semibold tabular-nums" style={{ color: color || "#101828" }}>
        {value}
      </p>
    </div>
  )
}

// ── Simple deterministic QR-like SVG ──────────────────────────────────────────

function QrCodeSVG({ address }: { address: string }) {
  const SIZE = 21
  const cells: boolean[][] = []

  for (let y = 0; y < SIZE; y++) {
    cells[y] = []
    for (let x = 0; x < SIZE; x++) {
      const charIdx = (y * SIZE + x) % address.length
      const charCode = address.charCodeAt(charIdx)
      cells[y][x] = charCode % 2 === 0
    }
  }

  const addFinder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isBorder = y === 0 || y === 6 || x === 0 || x === 6
        const isInner = y >= 2 && y <= 4 && x >= 2 && x <= 4
        cells[oy + y][ox + x] = isBorder || isInner
      }
    }
  }

  addFinder(0, 0)
  addFinder(SIZE - 7, 0)
  addFinder(0, SIZE - 7)

  const cellSize = 160 / SIZE

  return (
    <svg viewBox="0 0 160 160" className="h-full w-full">
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              rx={1}
              fill="#0A1628"
            />
          ) : null
        )
      )}
    </svg>
  )
}
