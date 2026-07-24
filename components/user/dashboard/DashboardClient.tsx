"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import {
  Plus, Send, RefreshCw, Eye, EyeOff, Bell, Settings, ArrowRightLeft,
  ChevronRight, CreditCard, ClipboardList, Landmark, FileText, Menu,
} from "lucide-react"
import type { UserDashboardData, SerializedTransaction } from "@/lib/services/dashboard-user.service"
import { useSidebar } from "@/components/user/UserAppShell"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"

/* Per dashboard-design.md — Grey style: white cards on grey, blue accent,
   colourful currency badges, bold Inter numbers, coloured money. */

const FONT = "var(--dash-font)"
const cardStyle: React.CSSProperties = { backgroundColor: "var(--dash-surface)", borderRadius: 16, boxShadow: "var(--dash-shadow)" }
const numStyle = { fontVariantNumeric: "tabular-nums" as const }

const CREDIT_TYPES = ["deposit", "admin_deposit", "transfer_in", "refund", "loan_disbursement", "swap_in", "tax_refund_deposit", "grant_disbursement"]

// Currency → flag emoji (fiat). Bitcoin handled separately.
const FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", NGN: "🇳🇬", CAD: "🇨🇦", AUD: "🇦🇺", JPY: "🇯🇵",
  CNY: "🇨🇳", INR: "🇮🇳", ZAR: "🇿🇦", GHS: "🇬🇭", KES: "🇰🇪", CHF: "🇨🇭", SEK: "🇸🇪",
  NOK: "🇳🇴", DKK: "🇩🇰", NZD: "🇳🇿", SGD: "🇸🇬", HKD: "🇭🇰", AED: "🇦🇪", BRL: "🇧🇷",
  MXN: "🇲🇽", TRY: "🇹🇷", RUB: "🇷🇺", PLN: "🇵🇱", THB: "🇹🇭", KRW: "🇰🇷", SAR: "🇸🇦",
}

const QUICK_ACTIONS = [
  { icon: Send,           title: "Send Money", desc: "Send to 80+ countries instantly",     href: "/app/transfer",    color: "#12B76A", bg: "#ECFDF3" },
  { icon: CreditCard,     title: "Cards",      desc: "Virtual & physical cards",            href: "/app/cards",       color: "#475467", bg: "#F2F4F7" },
  { icon: ArrowRightLeft, title: "Convert",    desc: "Swap between your currencies",        href: "/app/swap",        color: "#1A2CCE", bg: "#EEF0FE" },
  { icon: ClipboardList,  title: "Statements", desc: "Download account statements",         href: "/app/statements",  color: "#2775CA", bg: "#EFF8FF" },
  { icon: Landmark,       title: "Loans",      desc: "Apply for personal & business loans", href: "/app/loans",       color: "#7A5AF8", bg: "#F4F3FF" },
  { icon: FileText,       title: "Tax Refund", desc: "File and track tax refunds",          href: "/app/tax-refunds", color: "#F79009", bg: "#FFFAEB" },
]

interface Props {
  data:           UserDashboardData
  btcRate:        number
  session:        Session
  adminBtcWallet: string | null
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, "0")
  const mon = d.toLocaleString("en-US", { month: "short" })
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  return `${day} ${mon} ${d.getFullYear()}, ${h}:${m}`
}

function humanType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function CurrencyBadge({ code, bitcoin }: { code: string; bitcoin?: boolean }) {
  if (bitcoin) {
    return <span className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "#F7931A", color: "#fff", fontSize: 18, fontWeight: 700 }}>₿</span>
  }
  const flag = FLAG[code]
  return (
    <span className="flex items-center justify-center flex-shrink-0" style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "var(--dash-surface-2)", border: "1px solid var(--dash-border)", fontSize: 20 }}>
      {flag || <span style={{ fontSize: 13, fontWeight: 700, color: "var(--dash-text-2)" }}>{code.slice(0, 3)}</span>}
    </span>
  )
}

export function DashboardClient({ data, btcRate: initialBtcRate, session }: Props) {
  const router = useRouter()
  const { open: openSidebar } = useSidebar()
  const { currency, formatAmount } = useCurrency()

  const fiatAccount = data.accounts.find((a) => a.walletType === "fiat")
  const btcAccount  = data.accounts.find((a) => a.walletType === "bitcoin")

  const [btcRate, setBtcRate] = useState(initialBtcRate)
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [unreadCount, setUnreadCount] = useState(data.pendingActions.unreadNotifications)

  // Profile photo — fetched once, updated live when changed on the profile page.
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  useEffect(() => {
    let active = true
    fetch("/api/user/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d && "avatarUrl" in d) setAvatarUrl(d.avatarUrl) })
      .catch(() => { /* keep initials */ })
    const onUpdate = (e: Event) => setAvatarUrl((e as CustomEvent<string | null>).detail ?? null)
    window.addEventListener("avatar-updated", onUpdate as EventListener)
    return () => { active = false; window.removeEventListener("avatar-updated", onUpdate as EventListener) }
  }, [])

  useEffect(() => {
    let mounted = true
    // Fetch the BTC price in the user's currency (same source/field as the rest
    // of the app, e.g. the Send flow) so BTC valuations are consistent everywhere.
    const refresh = async () => {
      try {
        const res = await fetch(`/api/wallet/btc-rate?currency=${encodeURIComponent(currency)}`)
        if (res.ok && mounted) {
          const d = await res.json()
          if (typeof d.usd === "number" && d.usd > 0) setBtcRate(d.usd)
        }
      } catch { /* keep last known rate */ }
    }
    refresh() // run immediately, not just on the interval
    const iv = setInterval(refresh, 60_000)
    return () => { mounted = false; clearInterval(iv) }
  }, [currency])

  useEffect(() => {
    const poll = setInterval(async () => {
      try { const res = await fetch("/api/user/notifications?limit=1"); if (res.ok) { const json = await res.json(); setUnreadCount(json.unreadCount) } } catch { /* */ }
    }, 60_000)
    return () => clearInterval(poll)
  }, [])

  const navigate = useCallback((href: string) => router.push(href), [router])

  const fiatMajor  = fiatAccount ? fiatAccount.balance / 100 : 0
  const btcMajor   = btcAccount ? btcAccount.btcBalance / 1e8 : 0
  const totalMajor = fiatMajor + btcMajor * btcRate
  const hide = "••••••"
  const notifBadge = unreadCount === 0 ? null : unreadCount > 9 ? "9+" : String(unreadCount)

  const balanceCards = [
    ...(fiatAccount ? [{ key: "fiat", code: fiatAccount.currency, bitcoin: false, name: fiatAccount.currency, sub: "Cash balance", amount: formatAmount(fiatMajor), frozen: fiatAccount.isFrozen }] : []),
    ...(btcAccount ? [{ key: "btc", code: "BTC", bitcoin: true, name: "Bitcoin", sub: `≈ ${formatAmount(btcMajor * btcRate)}`, amount: `${btcMajor.toFixed(8)} BTC`, frozen: btcAccount.isFrozen }] : []),
  ]

  const balanceActions = [
    { icon: Plus,      label: "Add money", href: "/app/deposit" },
    { icon: Send,      label: "Send",      href: "/app/transfer" },
    { icon: RefreshCw, label: "Convert",   href: "/app/swap" },
  ]

  const ghostBtn: React.CSSProperties = { border: "1px solid var(--dash-border)", borderRadius: 10, backgroundColor: "var(--dash-surface)" }

  return (
    <div style={{ fontFamily: FONT, color: "var(--dash-text)", minHeight: "100%" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7">

        {/* ── Header ── */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={openSidebar} className="lg:hidden flex items-center justify-center w-9 h-9 flex-shrink-0" style={ghostBtn} aria-label="Open menu">
              <Menu className="w-5 h-5" style={{ color: "var(--dash-text)" }} strokeWidth={2} />
            </button>
            <div>
              <h1 className="text-[22px] sm:text-[26px] leading-tight" style={{ fontWeight: 700, color: "var(--dash-text)" }}>
                Hello {session.user.firstName}, <span aria-hidden>👋</span>
              </h1>
              <p className="text-[13px] mt-0.5 hidden sm:block" style={{ color: "var(--dash-text-2)" }}>
                Send, save and receive funds in various currencies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => navigate("/app/converter")} className="hidden md:flex items-center gap-2 text-[14px]" style={{ color: "var(--dash-primary)", fontWeight: 600 }}>
              <ArrowRightLeft className="w-4 h-4" strokeWidth={2} /> See our rates
            </button>
            <button onClick={() => navigate("/app/notifications")} className="relative flex items-center justify-center w-9 h-9" style={ghostBtn} aria-label="Notifications">
              <Bell className="w-[18px] h-[18px]" style={{ color: "var(--dash-text-2)" }} strokeWidth={1.8} />
              {notifBadge && <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px]" style={{ backgroundColor: "var(--dash-danger)", color: "#fff", borderRadius: 8, fontWeight: 600 }}>{notifBadge}</span>}
            </button>
            <button onClick={() => navigate("/app/profile")} className="hidden sm:flex items-center justify-center w-9 h-9" style={ghostBtn} aria-label="Settings">
              <Settings className="w-[18px] h-[18px]" style={{ color: "var(--dash-text-2)" }} strokeWidth={1.8} />
            </button>
            <button onClick={() => navigate("/app/profile")} className="flex items-center justify-center w-9 h-9 overflow-hidden text-[12px]" style={{ borderRadius: "50%", backgroundColor: "var(--dash-primary-bg)", color: "var(--dash-primary)", fontWeight: 600 }} aria-label="Profile">
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
                : <>{session.user.firstName?.[0]}{session.user.lastName?.[0]}</>}
            </button>
          </div>
        </header>

        {/* ── Total balance ── */}
        <section style={cardStyle} className="p-6 lg:p-7 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[14px]" style={{ color: "var(--dash-text-2)", fontWeight: 500 }}>Total balance</span>
                <button onClick={() => setBalanceHidden((v) => !v)} aria-label="Toggle balance visibility" style={{ color: "var(--dash-primary)" }}>
                  {balanceHidden ? <Eye className="w-4 h-4" strokeWidth={2} /> : <EyeOff className="w-4 h-4" strokeWidth={2} />}
                </button>
              </div>
              <p className="mt-2 text-[36px] sm:text-[44px] leading-none" style={{ fontWeight: 700, color: "var(--dash-text)", ...numStyle }}>
                {balanceHidden ? hide : formatAmount(totalMajor)}
              </p>
            </div>

            <div className="flex items-center gap-6 sm:gap-8">
              {balanceActions.map((a) => {
                const Icon = a.icon
                return (
                  <button key={a.label} onClick={() => navigate(a.href)} className="flex flex-col items-center gap-2 group">
                    <span className="flex items-center justify-center w-12 h-12 transition-colors" style={{ borderRadius: "50%", border: "1px solid var(--dash-border-2)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dash-primary-bg)"; e.currentTarget.style.borderColor = "var(--dash-primary)"; (e.currentTarget.firstChild as HTMLElement).style.color = "var(--dash-primary)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.borderColor = "var(--dash-border-2)"; (e.currentTarget.firstChild as HTMLElement).style.color = "var(--dash-text)" }}>
                      <Icon className="w-5 h-5" strokeWidth={2} style={{ color: "var(--dash-text)" }} />
                    </span>
                    <span className="text-[12px]" style={{ color: "var(--dash-text)", fontWeight: 500 }}>{a.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── My Balances ── */}
        <section className="mb-6">
          <h2 className="text-[16px] mb-3" style={{ fontWeight: 600, color: "var(--dash-text)" }}>My Balances</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
            {balanceCards.map((c) => (
              <div key={c.key} style={cardStyle} className="min-w-[220px] p-5 flex-shrink-0">
                <CurrencyBadge code={c.code} bitcoin={c.bitcoin} />
                <p className="mt-4 text-[13px]" style={{ color: "var(--dash-text-2)", fontWeight: 500 }}>{c.name}</p>
                <p className="mt-1 text-[24px]" style={{ fontWeight: 700, color: "var(--dash-text)", ...numStyle }}>
                  {balanceHidden ? hide : c.amount}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: c.frozen ? "var(--dash-danger)" : "var(--dash-text-3)" }}>{c.frozen ? "Frozen" : c.sub}</p>
              </div>
            ))}
            <button onClick={() => navigate("/app/accounts")} className="min-w-[56px] flex-shrink-0 flex items-center justify-center" style={cardStyle} aria-label="All accounts">
              <ChevronRight className="w-5 h-5" strokeWidth={2} style={{ color: "var(--dash-text-2)" }} />
            </button>
          </div>
        </section>

        {/* ── Quick Actions ── */}
        <section className="mb-6">
          <h2 className="text-[16px] mb-3" style={{ fontWeight: 600, color: "var(--dash-text)" }}>Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <button key={a.title} onClick={() => navigate(a.href)} style={cardStyle} className="p-5 text-left transition-transform active:scale-[0.99]">
                  <span className="flex items-center justify-center w-11 h-11 mb-3" style={{ borderRadius: 12, backgroundColor: a.bg }}>
                    <Icon className="w-[22px] h-[22px]" strokeWidth={2} style={{ color: a.color }} />
                  </span>
                  <p className="text-[15px]" style={{ fontWeight: 600, color: "var(--dash-text)" }}>{a.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--dash-text-2)" }}>{a.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── Recent transactions ── */}
        <section style={cardStyle} className="overflow-hidden">
          <div className="flex items-center justify-between px-5 lg:px-6 py-4">
            <h2 className="text-[16px]" style={{ fontWeight: 600, color: "var(--dash-text)" }}>Recent transactions</h2>
            <button onClick={() => navigate("/app/transactions")} className="text-[14px]" style={{ color: "var(--dash-primary)", fontWeight: 600 }}>See all</button>
          </div>

          {data.recentTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center" style={{ borderTop: "1px solid var(--dash-border)" }}>
              <p className="text-[14px]" style={{ color: "var(--dash-text-2)" }}>No transactions yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "var(--dash-surface-2)", borderTop: "1px solid var(--dash-border)", borderBottom: "1px solid var(--dash-border)" }}>
                      {["Date", "Amount", "Type", "Description", "Status"].map((h, i) => (
                        <th key={h} className="px-6 py-3 text-[11px] uppercase" style={{ color: "var(--dash-text-3)", letterSpacing: "0.05em", fontWeight: 600, textAlign: i === 1 ? "right" : "left", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTransactions.map((t) => <TxRow key={t._id} t={t} formatAmount={formatAmount} />)}
                  </tbody>
                </table>
              </div>

              {/* Mobile list */}
              <div className="sm:hidden">
                {data.recentTransactions.map((t) => {
                  const isCredit = CREDIT_TYPES.includes(t.type)
                  const isBtc = t.currency === "BTC"
                  const amt = isBtc ? `${(t.amount / 1e8).toFixed(8)} BTC` : formatAmount(t.amount / 100)
                  return (
                    <button key={t._id} onClick={() => navigate(`/app/transactions/${t._id}`)} className="w-full flex items-center justify-between px-5 py-4 text-left" style={{ borderTop: "1px solid var(--dash-border)" }}>
                      <div className="min-w-0">
                        <p className="text-[14px] truncate" style={{ color: "var(--dash-text)", fontWeight: 500 }}>{t.description || humanType(t.type)}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: "var(--dash-text-3)" }}>{fmtDate(t.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-[14px]" style={{ fontWeight: 600, color: isCredit ? "var(--dash-success)" : "var(--dash-text)", ...numStyle }}>{isCredit ? "+ " : "− "}{amt}</p>
                        <StatusText status={t.status} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function TxRow({ t, formatAmount }: { t: SerializedTransaction; formatAmount: (n: number) => string }) {
  const router = useRouter()
  const isCredit = CREDIT_TYPES.includes(t.type)
  const isBtc = t.currency === "BTC"
  const amt = isBtc ? `${(t.amount / 1e8).toFixed(8)} BTC` : formatAmount(t.amount / 100)
  return (
    <tr
      onClick={() => router.push(`/app/transactions/${t._id}`)}
      className="cursor-pointer"
      style={{ borderBottom: "1px solid var(--dash-border)" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dash-surface-2)" }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
    >
      <td className="px-6 py-4 text-[13px] whitespace-nowrap" style={{ color: "var(--dash-text-2)", ...numStyle }}>{fmtDate(t.createdAt)}</td>
      <td className="px-6 py-4 text-[14px] text-right whitespace-nowrap" style={{ fontWeight: 600, color: isCredit ? "var(--dash-success)" : "var(--dash-text)", ...numStyle }}>{isCredit ? "+ " : "− "}{amt}</td>
      <td className="px-6 py-4 text-[13px] whitespace-nowrap" style={{ color: "var(--dash-text)" }}>{humanType(t.type)}</td>
      <td className="px-6 py-4 text-[13px] max-w-[220px] truncate" style={{ color: "var(--dash-text-2)" }}>{t.description || "—"}</td>
      <td className="px-6 py-4"><StatusText status={t.status} /></td>
    </tr>
  )
}

function StatusText({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "var(--dash-success)", pending: "var(--dash-warning)", processing: "var(--dash-warning)",
    failed: "var(--dash-danger)", reversed: "var(--dash-danger)",
  }
  const color = map[status] || "var(--dash-text-2)"
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color, whiteSpace: "nowrap", fontWeight: 500 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, display: "inline-block" }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
