/**
 * Currency formatting utilities that use the platform's configured currency.
 */

// Currency symbol map for common currencies
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  NGN: "₦",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
  BRL: "R$",
  MXN: "MX$",
  KRW: "₩",
  TRY: "₺",
  RUB: "₽",
  PLN: "zł",
  THB: "฿",
  AED: "د.إ",
  SAR: "﷼",
  PHP: "₱",
  IDR: "Rp",
  MYR: "RM",
  VND: "₫",
  EGP: "E£",
  PKR: "₨",
  BDT: "৳",
  UAH: "₴",
  ILS: "₪",
  COP: "COL$",
  CLP: "CLP$",
  PEN: "S/",
  ARS: "AR$",
  SRD: "$",
  MUR: "₨",
  SCR: "₨",
}

/**
 * Get the symbol for a currency code
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode
}

/**
 * Format a number as currency using the specified currency code
 * @param amount - The amount to format (in major units, e.g., dollars not cents)
 * @param currencyCode - The ISO currency code (e.g., "USD", "EUR")
 * @param options - Additional formatting options
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
  options: {
    showSymbol?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options

  try {
    const formatted = new Intl.NumberFormat("en-US", {
      style: showSymbol ? "currency" : "decimal",
      currency: currencyCode,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount)

    return formatted
  } catch {
    // Fallback for unsupported currencies
    const symbol = showSymbol ? getCurrencySymbol(currencyCode) : ""
    const formattedNumber = amount.toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    })
    return showSymbol ? `${symbol}${formattedNumber}` : formattedNumber
  }
}

/**
 * Format cents/smallest unit to currency display
 * @param amountInCents - Amount in smallest unit (cents for USD, etc.)
 * @param currencyCode - The ISO currency code
 */
export function formatCentsAsCurrency(
  amountInCents: number,
  currencyCode: string = "USD"
): string {
  // Most currencies use 100 subunits, but some don't
  const noDecimalCurrencies = ["JPY", "KRW", "VND", "IDR"]
  const divisor = noDecimalCurrencies.includes(currencyCode.toUpperCase()) ? 1 : 100
  return formatCurrency(amountInCents / divisor, currencyCode)
}
