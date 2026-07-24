export type MerchantCategory =
  | "food"
  | "transport"
  | "shopping"
  | "subscriptions"
  | "transfers"
  | "deposits"
  | "withdrawals"
  | "bitcoin"
  | "health"
  | "utilities"
  | "entertainment"
  | "loans"
  | "other"

interface CategoryRule {
  patterns: string[]
  category: MerchantCategory
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: "food",
    patterns: [
      "mcdonald", "chipotle", "starbucks", "subway", "uber eats", "doordash",
      "grubhub", "restaurant", "café", "cafe", "pizza", "burger", "dining",
      "food", "kitchen", "grill", "diner", "breakfast", "lunch", "dinner",
      "bakery", "sushi", "taco", "noodle", "thai", "chinese", "indian",
      "panda express", "chick-fil-a", "wendy", "kfc", "popeyes", "domino",
    ],
  },
  {
    category: "transport",
    patterns: [
      "uber", "lyft", "transit", "parking", "gas", "shell", "chevron", "bp",
      "airlines", "delta", "american airlines", "united", "southwest", "jetblue",
      "hertz", "enterprise", "avis", "train", "metro", "toll", "taxi", "bus",
      "amtrak", "greyhound", "fuel", "exxon", "sunoco",
    ],
  },
  {
    category: "shopping",
    patterns: [
      "amazon", "walmart", "target", "nordstrom", "bestbuy", "best buy",
      "apple store", "h&m", "zara", "costco", "ikea", "home depot", "lowe",
      "online purchase", "ebay", "etsy", "wayfair", "macys", "macy's",
      "gap", "nike", "adidas", "sephora", "ulta",
    ],
  },
  {
    category: "subscriptions",
    patterns: [
      "netflix", "spotify", "apple", "google", "hulu", "disney", "youtube",
      "adobe", "microsoft", "dropbox", "github", "slack", "zoom", "notion",
      "openai", "chatgpt", "aws", "heroku", "vercel", "icloud", "hbo",
      "paramount", "peacock", "audible",
    ],
  },
  {
    category: "utilities",
    patterns: [
      "electric", "water bill", "gas company", "comcast", "verizon", "at&t",
      "internet", "phone bill", "utility", "t-mobile", "sprint", "xfinity",
      "spectrum", "cox", "pg&e", "con edison", "rent", "mortgage payment",
    ],
  },
  {
    category: "health",
    patterns: [
      "pharmacy", "cvs", "walgreens", "doctor", "hospital", "medical",
      "dental", "gym", "equinox", "kaiser", "insurance", "optometrist",
      "therapy", "urgent care", "labcorp", "quest diagnostics", "vitamin",
      "planet fitness", "peloton",
    ],
  },
  {
    category: "entertainment",
    patterns: [
      "cinema", "amc", "regal", "theater", "ticketmaster", "steam",
      "playstation", "xbox", "concert", "event", "spotify", "apple music",
      "game", "bowling", "arcade", "museum", "zoo", "theme park",
    ],
  },
  {
    category: "deposits",
    patterns: [
      "deposit", "payroll", "salary", "income", "refund", "cashback",
      "interest earned", "admin_deposit", "direct deposit", "tax refund",
    ],
  },
  {
    category: "transfers",
    patterns: [
      "transfer", "wire", "send", "payment to", "zelle", "venmo", "paypal",
      "cashapp", "remittance", "transfer_in", "transfer_out",
    ],
  },
  {
    category: "bitcoin",
    patterns: [
      "bitcoin", "btc", "crypto", "swap", "coinbase", "binance", "swap_in",
      "swap_out", "blockchain", "lightning",
    ],
  },
  {
    category: "loans",
    patterns: [
      "loan", "disbursement", "repayment", "mortgage", "loan_disbursement",
      "loan_repayment", "installment",
    ],
  },
  {
    category: "withdrawals",
    patterns: ["withdrawal", "atm", "cash out", "wire out"],
  },
]

const CATEGORY_META: Record<
  MerchantCategory,
  { label: string; color: string; bgColor: string }
> = {
  food:          { label: "Food & dining",  color: "text-amber-700",  bgColor: "bg-amber-100" },
  transport:     { label: "Transport",      color: "text-blue-700",   bgColor: "bg-blue-100" },
  shopping:      { label: "Shopping",       color: "text-purple-700", bgColor: "bg-purple-100" },
  subscriptions: { label: "Subscriptions",  color: "text-teal-700",   bgColor: "bg-teal-100" },
  transfers:     { label: "Transfers",      color: "text-slate-700",  bgColor: "bg-slate-100" },
  deposits:      { label: "Deposits",       color: "text-green-700",  bgColor: "bg-green-100" },
  withdrawals:   { label: "Withdrawals",    color: "text-red-700",    bgColor: "bg-red-100" },
  bitcoin:       { label: "Bitcoin",        color: "text-orange-700", bgColor: "bg-orange-100" },
  health:        { label: "Health",         color: "text-pink-700",   bgColor: "bg-pink-100" },
  utilities:     { label: "Utilities",      color: "text-cyan-700",   bgColor: "bg-cyan-100" },
  entertainment: { label: "Entertainment",  color: "text-violet-700", bgColor: "bg-violet-100" },
  loans:         { label: "Loans",          color: "text-indigo-700", bgColor: "bg-indigo-100" },
  other:         { label: "Other",          color: "text-gray-700",   bgColor: "bg-gray-100" },
}

export function getMerchantCategory(description?: string, type?: string): MerchantCategory {
  const text = `${description || ""} ${type || ""}`.toLowerCase()

  // Type-based shortcuts
  if (type?.includes("deposit") || type?.includes("admin_deposit")) return "deposits"
  if (type?.includes("withdrawal"))     return "withdrawals"
  if (type?.includes("transfer"))       return "transfers"
  if (type?.includes("swap"))           return "bitcoin"
  if (type?.includes("loan"))           return "loans"
  if (type?.includes("fee"))            return "other"
  if (type?.includes("refund"))         return "deposits"
  if (type?.includes("fx_conversion"))  return "bitcoin"

  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (text.includes(pattern)) return rule.category
    }
  }

  return "other"
}

export function getCategoryMeta(category: MerchantCategory) {
  return CATEGORY_META[category]
}

export function getAllCategories() {
  return CATEGORY_META
}
