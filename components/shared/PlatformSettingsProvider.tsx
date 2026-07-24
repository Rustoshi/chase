"use client"

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { formatCurrency, formatCentsAsCurrency, getCurrencySymbol } from "@/lib/utils/currency"

interface PlatformSettings {
  defaultCurrency: string
  supportedCurrencies: string[]
  maintenanceMode: boolean
  maintenanceMessage: string | null
}

interface PlatformSettingsContextValue extends PlatformSettings {
  loading: boolean
  userCurrency: string
  currencySymbol: string
  formatAmount: (amount: number) => string
  formatCents: (amountInCents: number) => string
}

const defaultSettings: PlatformSettings = {
  defaultCurrency: "USD",
  supportedCurrencies: ["USD"],
  maintenanceMode: false,
  maintenanceMessage: null,
}

const PlatformSettingsContext = createContext<PlatformSettingsContextValue>({
  ...defaultSettings,
  loading: true,
  userCurrency: "USD",
  currencySymbol: "$",
  formatAmount: (n) => `$${n.toLocaleString()}`,
  formatCents: (n) => `$${(n / 100).toLocaleString()}`,
})

export function PlatformSettingsProvider({
  children,
  initialCurrency,
}: {
  children: ReactNode
  /**
   * The user's preferred currency, resolved server-side from their user
   * record (via the session). Seeding from this avoids a flash of the
   * default currency and works even if the client fetch below fails.
   */
  initialCurrency?: string
}) {
  const seedCurrency = initialCurrency || "USD"
  const [settings, setSettings] = useState<PlatformSettings>({
    ...defaultSettings,
    defaultCurrency: seedCurrency,
  })
  const [userCurrency, setUserCurrency] = useState(seedCurrency)
  // Already have the authoritative currency from the session — don't block on fetch
  const [loading, setLoading] = useState(!initialCurrency)

  useEffect(() => {
    Promise.all([
      fetch("/api/public/settings")
        .then((res) => res.ok ? res.json() : null)
        .catch(() => null),
      fetch("/api/user/profile")
        .then((res) => res.ok ? res.json() : null)
        .catch(() => null),
    ])
      .then(([platformData, userData]) => {
        // The user's preferred currency is the source of truth; fall back to
        // the server-seeded value (and only then to the platform default).
        const resolvedCurrency =
          userData?.preferredCurrency || initialCurrency || "USD"
        setSettings({
          defaultCurrency: resolvedCurrency,
          supportedCurrencies: platformData?.supportedCurrencies || ["USD"],
          maintenanceMode: platformData?.maintenanceMode || false,
          maintenanceMessage: platformData?.maintenanceMessage || null,
        })
        setUserCurrency(resolvedCurrency)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [initialCurrency])

  const currencySymbol = getCurrencySymbol(userCurrency)

  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, userCurrency),
    [userCurrency]
  )

  const formatCents = useCallback(
    (amountInCents: number) => formatCentsAsCurrency(amountInCents, userCurrency),
    [userCurrency]
  )

  return (
    <PlatformSettingsContext.Provider
      value={{
        ...settings,
        loading,
        userCurrency,
        currencySymbol,
        formatAmount,
        formatCents,
      }}
    >
      {children}
    </PlatformSettingsContext.Provider>
  )
}

/**
 * Hook to access platform settings and currency formatting
 */
export function usePlatformSettings() {
  return useContext(PlatformSettingsContext)
}

/**
 * Hook for just currency formatting (convenience)
 */
export function useCurrency() {
  const { defaultCurrency, currencySymbol, formatAmount, formatCents } = useContext(PlatformSettingsContext)
  return { currency: defaultCurrency, symbol: currencySymbol, formatAmount, formatCents }
}
