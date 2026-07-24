"use client"

import { useRouter } from "next/navigation"
import { UserHeader } from "@/components/user/UserHeader"
import { AccountDetailCard } from "@/components/user/accounts/AccountDetailCard"
import { useCountUp } from "@/hooks/useCountUp"
import { useCurrency } from "@/components/shared/PlatformSettingsProvider"
import type { AccountDetail } from "@/lib/services/dashboard-user.service"

interface Props {
  accounts:       AccountDetail[]
  btcRate:        number
  adminBtcWallet: string | null
}

export function AccountsClient({ accounts, btcRate, adminBtcWallet }: Props) {
  const router = useRouter()
  const { symbol: currencySymbol, formatAmount } = useCurrency()

  // Fiat balances are stored in minor units (cents) — convert to major units.
  const fiatTotal = accounts
    .filter((a) => a.walletType === "fiat")
    .reduce((sum, a) => sum + a.balance / 100, 0)
  // BTC balances are stored in satoshis — convert to BTC.
  const btcTotal = accounts
    .filter((a) => a.walletType === "bitcoin")
    .reduce((sum, a) => sum + a.btcBalance / 1e8, 0)
  const portfolioValue = fiatTotal + btcTotal * btcRate
  const animatedPortfolio = useCountUp(portfolioValue, 1000)

  const fiatCount = accounts.filter((a) => a.walletType === "fiat").length
  const btcCount = accounts.filter((a) => a.walletType === "bitcoin").length
  const subtitleParts: string[] = []
  if (fiatCount > 0) subtitleParts.push(`${fiatCount} fiat account${fiatCount > 1 ? "s" : ""}`)
  if (btcCount > 0) subtitleParts.push(`${btcCount} Bitcoin wallet${btcCount > 1 ? "s" : ""}`)

  return (
    <div>
      <UserHeader title="My accounts" />

      <div className="space-y-5 p-4 lg:p-6">
        {/* Portfolio summary */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total portfolio value
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900">
            {currencySymbol}{animatedPortfolio.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {subtitleParts.join(" + ")}
          </p>
          {btcRate > 0 && (
            <p className="mt-0.5 text-[11px] text-slate-300">
              Rates updated moments ago
            </p>
          )}
        </div>

        {/* Account cards */}
        {accounts.map((account) => (
          <AccountDetailCard
            key={account._id}
            account={account}
            btcRate={btcRate}
            adminBtcWallet={adminBtcWallet}
          />
        ))}
      </div>
    </div>
  )
}
