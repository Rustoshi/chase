import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connection"
import Transaction from "@/lib/models/Transaction"
import Account from "@/lib/models/Account"
import CardApplication from "@/lib/models/CardApplication"
import CardTransaction from "@/lib/models/CardTransaction"
import { createAuditLog } from "@/lib/services/auth.service"
import { SeededRandom } from "@/lib/utils/random"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GenerateHistoryParams {
  userId: string
  accountId: string
  startingBalance: number      // Current balance or default
  endingBalance: number        // Target balance after generation
  minAmount: number            // Min transaction amount
  maxAmount: number            // Max transaction amount
  startDate: string            // Start date (ISO string, e.g., "2024-01-01")
  endDate: string              // End date (ISO string, e.g., "2024-06-01")
  includeSwaps: boolean        // Include fiat <-> BTC swaps
  includeCardTransactions: boolean // Include credit/debit card transactions
  seed?: number
  adminId: string
  adminEmail: string
  req?: Request
}

export interface GenerateBtcHistoryParams {
  userId: string
  btcAccountId: string
  startingBalance: number      // Starting BTC balance (in BTC, not satoshis)
  endingBalance: number        // Target BTC balance
  minAmount: number            // Min BTC amount per tx
  maxAmount: number            // Max BTC amount per tx
  startDate: string            // Start date (ISO string)
  endDate: string              // End date (ISO string)
  includeSwaps: boolean
  seed?: number
  adminId: string
  adminEmail: string
  req?: Request
}

export interface MonthBreakdown {
  month: string
  income: number
  expenses: number
  net: number
}

export interface GenerateHistoryResult {
  transactionsCreated: number
  cardTransactionsCreated: number
  finalBalance: number
  incomeTotal: number
  expensesTotal: number
  monthBreakdown: MonthBreakdown[]
}

export interface GenerateBtcHistoryResult {
  transactionsCreated: number
  finalBtcBalance: number
}

export interface GenerationPreview {
  estimatedTransactions: number
  estimatedCardTransactions: number
  startingBalance: number
  endingBalance: number
  balanceDelta: number
  totalMonths: number
  avgTransactionsPerMonth: number
}

// ── Merchant data ─────────────────────────────────────────────────────────────

const INCOME_LABELS_BASE = [
  "Direct deposit - payroll",
  "Salary deposit",
  "Client payment",
  "Freelance payment",
  "Contract payment",
  "Consulting fee",
  "Sales revenue",
  "Refund",
  "Interest payment",
  "Dividend payment",
  "Bonus payment",
]

const EXPENSE_MERCHANTS = [
  { name: "Amazon", category: "Shopping" },
  { name: "Walmart", category: "Shopping" },
  { name: "Target", category: "Shopping" },
  { name: "Costco", category: "Shopping" },
  { name: "Whole Foods", category: "Groceries" },
  { name: "Trader Joe's", category: "Groceries" },
  { name: "Kroger", category: "Groceries" },
  { name: "Starbucks", category: "Food & Dining" },
  { name: "McDonald's", category: "Food & Dining" },
  { name: "Chipotle", category: "Food & Dining" },
  { name: "DoorDash", category: "Food & Dining" },
  { name: "Uber Eats", category: "Food & Dining" },
  { name: "Netflix", category: "Subscriptions" },
  { name: "Spotify", category: "Subscriptions" },
  { name: "Apple", category: "Technology" },
  { name: "Google", category: "Technology" },
  { name: "Shell Gas", category: "Transportation" },
  { name: "Chevron", category: "Transportation" },
  { name: "Uber", category: "Transportation" },
  { name: "Lyft", category: "Transportation" },
  { name: "Delta Airlines", category: "Travel" },
  { name: "Airbnb", category: "Travel" },
  { name: "CVS Pharmacy", category: "Health" },
  { name: "Walgreens", category: "Health" },
  { name: "Equinox", category: "Health" },
  { name: "Rent payment", category: "Housing" },
  { name: "Electric company", category: "Utilities" },
  { name: "Comcast", category: "Utilities" },
  { name: "Verizon", category: "Utilities" },
]

const CARD_MERCHANTS = [
  { name: "Amazon.com", category: "Online Shopping" },
  { name: "Apple Store", category: "Electronics" },
  { name: "Best Buy", category: "Electronics" },
  { name: "Nordstrom", category: "Fashion" },
  { name: "Sephora", category: "Beauty" },
  { name: "Home Depot", category: "Home Improvement" },
  { name: "Lowe's", category: "Home Improvement" },
  { name: "Marriott Hotels", category: "Travel" },
  { name: "Hilton Hotels", category: "Travel" },
  { name: "United Airlines", category: "Travel" },
  { name: "Expedia", category: "Travel" },
  { name: "Grubhub", category: "Food Delivery" },
  { name: "Instacart", category: "Groceries" },
  { name: "Costco Online", category: "Wholesale" },
  { name: "Etsy", category: "Handmade" },
  { name: "eBay", category: "Marketplace" },
  { name: "Wayfair", category: "Furniture" },
  { name: "Nike", category: "Sports" },
  { name: "Adidas", category: "Sports" },
  { name: "REI", category: "Outdoor" },
]

// ── Popular banks worldwide (100 banks) ──────────────────────────────────────

const POPULAR_BANKS = [
  // USA
  "JPMorgan Chase", "Bank of America", "Wells Fargo", "Citibank", "U.S. Bank",
  "PNC Bank", "Capital One", "TD Bank", "Truist Bank", "Goldman Sachs",
  "Morgan Stanley", "Charles Schwab", "American Express", "Ally Bank", "Discover Bank",
  // UK
  "HSBC", "Barclays", "Lloyds Bank", "NatWest", "Santander UK",
  "Standard Chartered", "Royal Bank of Scotland", "Halifax", "TSB Bank", "Metro Bank",
  // Europe
  "Deutsche Bank", "BNP Paribas", "Credit Agricole", "Societe Generale", "UBS",
  "Credit Suisse", "ING Bank", "Rabobank", "ABN AMRO", "Commerzbank",
  "UniCredit", "Intesa Sanpaolo", "Banco Santander", "BBVA", "CaixaBank",
  "Nordea", "Danske Bank", "DNB", "Swedbank", "SEB",
  // Asia Pacific
  "Industrial and Commercial Bank of China", "China Construction Bank", "Bank of China", "Agricultural Bank of China",
  "Mitsubishi UFJ", "Sumitomo Mitsui", "Mizuho Bank", "Japan Post Bank",
  "DBS Bank", "OCBC Bank", "United Overseas Bank", "Maybank",
  "Commonwealth Bank", "Westpac", "ANZ Bank", "National Australia Bank",
  "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
  // Canada
  "Royal Bank of Canada", "Toronto-Dominion Bank", "Bank of Nova Scotia", "Bank of Montreal", "CIBC",
  // Latin America
  "Itau Unibanco", "Banco Bradesco", "Banco do Brasil", "Banco Santander Brasil",
  "Banorte", "BBVA Mexico", "Banco de Chile", "Banco Galicia",
  // Middle East
  "Emirates NBD", "Qatar National Bank", "National Bank of Kuwait", "Saudi National Bank",
  "First Abu Dhabi Bank", "Mashreq Bank", "Arab Bank", "Bank Muscat",
  // Additional international
  "Revolut", "N26", "Monzo", "Chime", "Nubank",
  "Wise", "Starling Bank", "Bunq", "Klarna Bank", "SoFi",
  "Robinhood", "Interactive Brokers", "Fidelity", "Vanguard", "E*TRADE",
]

// ── Popular names by region (excluding Africa) ──────────────────────────────

const FIRST_NAMES = {
  american: ["James", "Michael", "Robert", "David", "William", "John", "Richard", "Joseph", "Thomas", "Christopher",
             "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica", "Sarah", "Karen"],
  british: ["Oliver", "George", "Harry", "Jack", "Charlie", "Thomas", "Jacob", "Alfie", "Oscar", "James",
            "Olivia", "Amelia", "Isla", "Ava", "Emily", "Sophia", "Grace", "Mia", "Poppy", "Ella"],
  european: ["Luca", "Matteo", "Leon", "Noah", "Felix", "Elias", "Paul", "Maximilian", "Luis", "Henri",
             "Emma", "Sofia", "Anna", "Marie", "Laura", "Julia", "Lea", "Clara", "Mila", "Lena"],
  hispanic: ["Santiago", "Mateo", "Sebastian", "Leonardo", "Diego", "Miguel", "Daniel", "Carlos", "Pablo", "Alejandro",
             "Valentina", "Isabella", "Camila", "Sofia", "Lucia", "Maria", "Martina", "Victoria", "Elena", "Gabriela"],
  asian: ["Wei", "Hiroshi", "Yuki", "Kenji", "Takeshi", "Min-jun", "Ji-hoon", "Arjun", "Raj", "Vikram",
          "Mei", "Yuki", "Sakura", "Aiko", "Hana", "Priya", "Ananya", "Soo-yeon", "Ji-yeon", "Ling"],
  middleEastern: ["Mohammed", "Ahmed", "Ali", "Omar", "Hassan", "Khalid", "Yusuf", "Ibrahim", "Samir", "Tariq",
                  "Fatima", "Aisha", "Layla", "Sara", "Noor", "Mariam", "Zara", "Hana", "Dina", "Rania"],
  australian: ["Jack", "William", "Oliver", "Noah", "Thomas", "James", "Ethan", "Lucas", "Mason", "Liam",
               "Charlotte", "Olivia", "Ava", "Mia", "Amelia", "Isla", "Grace", "Chloe", "Sophie", "Emily"],
}

const LAST_NAMES = {
  american: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
             "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris"],
  british: ["Smith", "Jones", "Williams", "Taylor", "Brown", "Davies", "Evans", "Wilson", "Thomas", "Roberts",
            "Johnson", "Lewis", "Walker", "Robinson", "Wood", "Thompson", "White", "Watson", "Jackson", "Wright"],
  european: ["Mueller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
             "Rossi", "Russo", "Ferrari", "Esposito", "Bianchi", "Dubois", "Martin", "Bernard", "Petit", "Durand"],
  hispanic: ["Garcia", "Rodriguez", "Martinez", "Lopez", "Gonzalez", "Hernandez", "Perez", "Sanchez", "Ramirez", "Torres",
             "Flores", "Rivera", "Gomez", "Diaz", "Reyes", "Morales", "Cruz", "Ortiz", "Gutierrez", "Chavez"],
  asian: ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Tanaka", "Yamamoto", "Suzuki",
          "Kim", "Park", "Lee", "Choi", "Jung", "Patel", "Sharma", "Singh", "Kumar", "Gupta"],
  middleEastern: ["Al-Farsi", "Al-Rashid", "Al-Hassan", "Al-Mahmoud", "Al-Sayed", "Haddad", "Khoury", "Mansour", "Nasser", "Saleh",
                  "Abboud", "Bishara", "Daher", "Eid", "Farah", "Habib", "Jaber", "Kassab", "Maloof", "Nasr"],
  australian: ["Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Johnson", "White", "Martin", "Anderson",
               "Thompson", "Nguyen", "Thomas", "Walker", "Harris", "Lee", "Ryan", "Robinson", "Kelly", "King"],
}

function getRandomFullName(rng: SeededRandom): string {
  const regions = Object.keys(FIRST_NAMES) as (keyof typeof FIRST_NAMES)[]
  const region = rng.pick(regions)
  const firstName = rng.pick(FIRST_NAMES[region])
  const lastName = rng.pick(LAST_NAMES[region])
  return `${firstName} ${lastName}`
}

function getRandomBank(rng: SeededRandom): string {
  return rng.pick(POPULAR_BANKS)
}

function getIncomeDescription(rng: SeededRandom): string {
  // 30% chance of being a transfer from someone
  if (rng.chance(0.3)) {
    const name = getRandomFullName(rng)
    const bank = getRandomBank(rng)
    const templates = [
      `Transfer from ${name}`,
      `Wire transfer from ${name} via ${bank}`,
      `Payment from ${name}`,
      `${name} - ${bank}`,
      `Incoming transfer - ${name}`,
      `ACH transfer from ${name}`,
    ]
    return rng.pick(templates)
  }
  return rng.pick(INCOME_LABELS_BASE)
}

function getExpenseDescription(rng: SeededRandom, merchant: { name: string; category: string }): string {
  // 15% chance of being a transfer to someone
  if (rng.chance(0.15)) {
    const name = getRandomFullName(rng)
    const bank = getRandomBank(rng)
    const templates = [
      `Transfer to ${name}`,
      `Wire transfer to ${name} via ${bank}`,
      `Payment to ${name}`,
      `${name} - ${bank}`,
      `Outgoing transfer - ${name}`,
      `ACH transfer to ${name}`,
    ]
    return rng.pick(templates)
  }
  return merchant.name
}

function getBtcIncomeDescription(rng: SeededRandom): string {
  // 40% chance of being a transfer from someone
  if (rng.chance(0.4)) {
    const name = getRandomFullName(rng)
    const templates = [
      `Bitcoin from ${name}`,
      `BTC transfer from ${name}`,
      `P2P payment from ${name}`,
      `Received from ${name}`,
    ]
    return rng.pick(templates)
  }
  return rng.pick([
    "Bitcoin received",
    "Wallet transfer",
    "Mining reward",
    "Exchange deposit",
    "Lightning payment received",
    "On-chain deposit",
  ])
}

function getBtcExpenseDescription(rng: SeededRandom): string {
  // 40% chance of being a transfer to someone
  if (rng.chance(0.4)) {
    const name = getRandomFullName(rng)
    const templates = [
      `Bitcoin to ${name}`,
      `BTC transfer to ${name}`,
      `P2P payment to ${name}`,
      `Sent to ${name}`,
    ]
    return rng.pick(templates)
  }
  return rng.pick([
    "Bitcoin sent",
    "Wallet transfer out",
    "Cold storage transfer",
    "Exchange withdrawal",
    "Lightning payment",
    "On-chain withdrawal",
  ])
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uniqueRef(rng: SeededRandom, usedRefs: Set<string>): string {
  let ref: string
  do {
    ref = `TXN${rng.alphaNum(12).toUpperCase()}`
  } while (usedRefs.has(ref))
  usedRefs.add(ref)
  return ref
}

function timestampInPeriod(rng: SeededRandom, start: number, end: number): number {
  return Math.floor(rng.float(start, end))
}

function roundAmount(amount: number): number {
  // Round to realistic cents
  const rounded = Math.round(amount * 100) / 100
  return Math.max(0.01, rounded)
}

// ── Main generation function ──────────────────────────────────────────────────

export async function generateHistory(params: GenerateHistoryParams): Promise<GenerateHistoryResult> {
  await connectDB()

  const {
    userId, accountId, startingBalance, endingBalance,
    minAmount, maxAmount, startDate, endDate,
    includeSwaps, includeCardTransactions,
    seed, adminId, adminEmail, req,
  } = params

  if (!mongoose.Types.ObjectId.isValid(accountId)) throw new Error("Invalid account ID")
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID")

  const account = await Account.findById(accountId).lean()
  if (!account) throw new Error("Account not found")
  if (account.walletType !== "fiat") throw new Error("generateHistory is for fiat accounts only")

  const currency = String(account.currency ?? "USD")
  
  // Calculate duration from dates
  const periodStart = new Date(startDate).getTime()
  const periodEnd = new Date(endDate).getTime()
  if (periodEnd <= periodStart) throw new Error("End date must be after start date")
  const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
  const totalMonths = Math.max(1, Math.ceil(totalDays / 30))

  // Find BTC account if swaps requested
  let btcAccount: typeof account | null = null
  if (includeSwaps) {
    btcAccount = await Account.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      walletType: "bitcoin",
    }).lean()
  }

  // Find active cards if card transactions requested
  let activeCards: Array<{ _id: mongoose.Types.ObjectId; cardType: string; cardNumber?: string; creditLimit?: number; spendingLimit?: number }> = []
  if (includeCardTransactions) {
    activeCards = await CardApplication.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: "active",
    }).select("_id cardType cardNumber creditLimit spendingLimit").lean()
  }

  const rng = new SeededRandom(seed)
  const PERIOD_MS = 30 * 86_400_000
  const usedRefs = new Set<string>()

  // Delete existing generated transactions
  await Transaction.deleteMany({
    accountId: new mongoose.Types.ObjectId(accountId),
    isGenerated: true,
  })
  if (btcAccount) {
    await Transaction.deleteMany({
      accountId: new mongoose.Types.ObjectId(String(btcAccount._id)),
      isGenerated: true,
    })
  }
  // Delete generated card transactions
  if (activeCards.length > 0) {
    await CardTransaction.deleteMany({
      cardId: { $in: activeCards.map(c => c._id) },
      reference: { $regex: /^GEN-/ },
    })
  }

  // Calculate required balance delta
  const balanceDelta = endingBalance - startingBalance
  const isNetPositive = balanceDelta >= 0

  // Calculate transaction distribution
  // We need to generate transactions that sum to the delta
  const avgTxPerMonth = rng.int(15, 40)
  const totalTxCount = avgTxPerMonth * totalMonths

  // Split into income and expense transactions
  // If net positive: more income than expenses
  // If net negative: more expenses than income
  let totalIncome = 0
  let totalExpenses = 0

  if (isNetPositive) {
    // Need net income = balanceDelta
    // Generate expenses first, then income = expenses + delta
    totalExpenses = Math.abs(balanceDelta) * rng.float(0.5, 2) + rng.float(1000, 5000) * totalMonths
    totalIncome = totalExpenses + balanceDelta
  } else {
    // Need net expense = |balanceDelta|
    totalIncome = Math.abs(balanceDelta) * rng.float(0.3, 0.8) + rng.float(500, 3000) * totalMonths
    totalExpenses = totalIncome + Math.abs(balanceDelta)
  }

  // Ensure minimums
  totalIncome = Math.max(totalIncome, minAmount * 10)
  totalExpenses = Math.max(totalExpenses, minAmount * 10)

  // Recalculate to ensure exact delta
  if (isNetPositive) {
    totalIncome = totalExpenses + balanceDelta
  } else {
    totalExpenses = totalIncome + Math.abs(balanceDelta)
  }

  // Generate transaction amounts
  const incomeCount = Math.floor(totalTxCount * (isNetPositive ? 0.35 : 0.25))
  const expenseCount = totalTxCount - incomeCount

  interface PartyDetails {
    name?: string
    bankName?: string
    accountNumber?: string
  }

  interface TxDoc {
    _id: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    type: string
    amount: number
    currency: string
    status: string
    description: string
    reference: string
    isGenerated: boolean
    processedAt: Date
    createdAt: Date
    updatedAt: Date
    btcRateAtTime?: number
    swapFromWallet?: string
    swapToWallet?: string
    sender?: PartyDetails
    receiver?: PartyDetails
  }

  const allDocs: TxDoc[] = []
  const cardTxDocs: Array<{
    cardId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    type: string
    amount: number
    currency: string
    status: string
    merchantName: string
    merchantCategory: string
    description: string
    reference: string
    createdAt: Date
    updatedAt: Date
  }> = []

  let btcPrice = 45000

  // Generate income transactions distributed across months
  let remainingIncome = totalIncome
  for (let i = 0; i < incomeCount && remainingIncome > 0; i++) {
    const monthIdx = Math.floor(i / Math.ceil(incomeCount / totalMonths))
    const pStart = periodStart + monthIdx * PERIOD_MS
    const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
    if (pEnd <= pStart) continue

    let amt: number
    if (i === incomeCount - 1) {
      // Last transaction: use remaining to ensure exact total
      amt = remainingIncome
    } else {
      const avgAmt = remainingIncome / (incomeCount - i)
      amt = roundAmount(rng.float(
        Math.max(minAmount, avgAmt * 0.3),
        Math.min(maxAmount, avgAmt * 2)
      ))
    }
    amt = Math.min(amt, remainingIncome)
    remainingIncome -= amt

    const ts = timestampInPeriod(rng, pStart, pEnd)
    const senderName = getRandomFullName(rng)
    const senderBank = getRandomBank(rng)
    
    allDocs.push({
      _id: new mongoose.Types.ObjectId(),
      accountId: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(userId),
      type: "deposit",
      amount: Math.round(amt * 100),
      currency,
      status: "completed",
      description: getIncomeDescription(rng),
      reference: uniqueRef(rng, usedRefs),
      isGenerated: true,
      sender: {
        name: senderName,
        bankName: senderBank,
        accountNumber: `****${rng.int(1000, 9999)}`,
      },
      processedAt: new Date(ts),
      createdAt: new Date(ts),
      updatedAt: new Date(),
    })
  }

  // Generate expense transactions distributed across months
  let remainingExpenses = totalExpenses
  for (let i = 0; i < expenseCount && remainingExpenses > 0; i++) {
    const monthIdx = Math.floor(i / Math.ceil(expenseCount / totalMonths))
    const pStart = periodStart + monthIdx * PERIOD_MS
    const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
    if (pEnd <= pStart) continue

    let amt: number
    if (i === expenseCount - 1) {
      amt = remainingExpenses
    } else {
      const avgAmt = remainingExpenses / (expenseCount - i)
      amt = roundAmount(rng.float(
        Math.max(minAmount, avgAmt * 0.2),
        Math.min(maxAmount, avgAmt * 1.8)
      ))
    }
    amt = Math.min(amt, remainingExpenses)
    remainingExpenses -= amt

    const merchant = rng.pick(EXPENSE_MERCHANTS)
    const ts = timestampInPeriod(rng, pStart, pEnd)
    const receiverName = getRandomFullName(rng)
    const receiverBank = getRandomBank(rng)

    allDocs.push({
      _id: new mongoose.Types.ObjectId(),
      accountId: new mongoose.Types.ObjectId(accountId),
      userId: new mongoose.Types.ObjectId(userId),
      type: "withdrawal",
      amount: Math.round(amt * 100),
      currency,
      status: "completed",
      description: getExpenseDescription(rng, merchant),
      reference: uniqueRef(rng, usedRefs),
      isGenerated: true,
      receiver: {
        name: receiverName,
        bankName: receiverBank,
        accountNumber: `****${rng.int(1000, 9999)}`,
      },
      processedAt: new Date(ts),
      createdAt: new Date(ts),
      updatedAt: new Date(),
    })
  }

  // Generate BTC swaps if enabled
  if (includeSwaps && btcAccount) {
    const swapCount = Math.floor(totalMonths * rng.float(0.5, 1.5))
    for (let i = 0; i < swapCount; i++) {
      const monthIdx = rng.int(0, totalMonths - 1)
      const pStart = periodStart + monthIdx * PERIOD_MS
      const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
      if (pEnd <= pStart) continue

      btcPrice *= (1 + rng.float(-0.08, 0.12))
      btcPrice = Math.max(15000, Math.min(90000, btcPrice))

      const fiatAmt = roundAmount(rng.float(minAmount, Math.min(maxAmount, 500)))
      const satoshis = Math.round((fiatAmt / btcPrice) * 1e8)
      const ts = timestampInPeriod(rng, pStart, pEnd)
      const swapRef = uniqueRef(rng, usedRefs)

      // Fiat side (swap out)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(accountId),
        userId: new mongoose.Types.ObjectId(userId),
        type: "swap_out",
        amount: Math.round(fiatAmt * 100),
        currency,
        status: "completed",
        description: `BTC swap — ${(satoshis / 1e8).toFixed(8)} BTC at $${Math.round(btcPrice).toLocaleString()}`,
        reference: swapRef,
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt: new Date(ts),
        updatedAt: new Date(),
        btcRateAtTime: btcPrice,
        swapFromWallet: "fiat",
        swapToWallet: "bitcoin",
      })

      // BTC side (swap in)
      allDocs.push({
        _id: new mongoose.Types.ObjectId(),
        accountId: new mongoose.Types.ObjectId(String(btcAccount._id)),
        userId: new mongoose.Types.ObjectId(userId),
        type: "swap_in",
        amount: satoshis,
        currency: "BTC",
        status: "completed",
        description: `Fiat swap — $${fiatAmt.toFixed(2)} at $${Math.round(btcPrice).toLocaleString()}`,
        reference: `${swapRef}-B`,
        isGenerated: true,
        processedAt: new Date(ts),
        createdAt: new Date(ts),
        updatedAt: new Date(),
        btcRateAtTime: btcPrice,
        swapFromWallet: "fiat",
        swapToWallet: "bitcoin",
      })
    }
  }

  // Generate card transactions if enabled and user has active cards
  // Track spending per card to update balance owed
  const cardSpending: Map<string, number> = new Map()
  
  if (includeCardTransactions && activeCards.length > 0) {
    const cardTxPerMonth = rng.int(5, 15)
    const totalCardTx = cardTxPerMonth * totalMonths

    for (let i = 0; i < totalCardTx; i++) {
      const card = rng.pick(activeCards)
      const cardIdStr = String(card._id)
      const monthIdx = Math.floor(i / Math.ceil(totalCardTx / totalMonths))
      const pStart = periodStart + monthIdx * PERIOD_MS
      const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
      if (pEnd <= pStart) continue

      // Cap spending at 40% of card's credit limit
      const cardLimit = card.creditLimit ?? card.spendingLimit ?? 10000
      const maxCardSpend = Math.round(cardLimit * 0.4)
      const currentSpend = cardSpending.get(cardIdStr) ?? 0
      
      if (currentSpend >= maxCardSpend) continue // Skip if already at max

      const merchant = rng.pick(CARD_MERCHANTS)
      const remainingBudget = maxCardSpend - currentSpend
      const amt = roundAmount(rng.float(minAmount, Math.min(maxAmount, 300, remainingBudget / 100)))
      const ts = timestampInPeriod(rng, pStart, pEnd)

      const amountCents = Math.round(amt * 100)
      cardSpending.set(cardIdStr, currentSpend + amountCents)

      cardTxDocs.push({
        cardId: card._id,
        userId: new mongoose.Types.ObjectId(userId),
        type: "purchase",
        amount: amountCents,
        currency,
        status: "completed",
        merchantName: merchant.name,
        merchantCategory: merchant.category,
        description: `${merchant.name} - ${merchant.category}`,
        reference: `GEN-${uniqueRef(rng, usedRefs)}`,
        createdAt: new Date(ts),
        updatedAt: new Date(),
      })
    }
  }

  // Sort transactions by date
  allDocs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // Calculate final balance and stats
  const CREDIT_TYPES = new Set(["deposit", "admin_deposit", "transfer_in", "swap_in", "refund"])
  let runningBalance = Math.round(startingBalance * 100)
  let incomeTotal = 0
  let expensesTotal = 0
  const monthStats: Record<string, { income: number; expenses: number }> = {}

  // Filter to only fiat transactions for this account
  const fiatDocs = allDocs.filter(d => String(d.accountId) === accountId)

  for (const doc of fiatDocs) {
    const isCredit = CREDIT_TYPES.has(doc.type)
    if (isCredit) {
      runningBalance += doc.amount
      incomeTotal += doc.amount
    } else {
      runningBalance -= doc.amount
      expensesTotal += doc.amount
    }

    const mk = doc.createdAt.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    if (!monthStats[mk]) monthStats[mk] = { income: 0, expenses: 0 }
    if (isCredit) monthStats[mk].income += doc.amount
    else monthStats[mk].expenses += doc.amount
  }

  // Bulk insert transactions
  if (allDocs.length > 0) {
    await Transaction.collection.insertMany(allDocs as unknown as Record<string, unknown>[])
  }

  // Bulk insert card transactions
  if (cardTxDocs.length > 0) {
    await CardTransaction.collection.insertMany(cardTxDocs as unknown as Record<string, unknown>[])
    
    // Update each card's balance (balance owed) based on spending
    for (const [cardId, spentAmount] of cardSpending.entries()) {
      await CardApplication.findByIdAndUpdate(cardId, { balance: spentAmount })
    }
  }

  // Update account balance to exact ending balance
  await Account.findByIdAndUpdate(accountId, { balance: Math.round(endingBalance * 100) })

  // Update BTC account if swaps were made
  if (btcAccount && includeSwaps) {
    const btcDocs = allDocs.filter(d => String(d.accountId) === String(btcAccount._id))
    let btcBalance = Number(btcAccount.btcBalance ?? 0)
    for (const doc of btcDocs) {
      if (doc.type === "swap_in") btcBalance += doc.amount
      else if (doc.type === "swap_out") btcBalance -= doc.amount
    }
    await Account.findByIdAndUpdate(String(btcAccount._id), { btcBalance })
  }

  await createAuditLog(adminId, adminEmail, "history.generate", "Account", accountId, {
    userId, months: totalMonths,
    startingBalance, endingBalance,
    transactionCount: fiatDocs.length,
    cardTransactionCount: cardTxDocs.length,
  }, req)

  const monthBreakdown: MonthBreakdown[] = Object.entries(monthStats).map(([month, s]) => ({
    month,
    income: s.income / 100,
    expenses: s.expenses / 100,
    net: (s.income - s.expenses) / 100,
  }))

  return {
    transactionsCreated: fiatDocs.length,
    cardTransactionsCreated: cardTxDocs.length,
    finalBalance: endingBalance,
    incomeTotal: incomeTotal / 100,
    expensesTotal: expensesTotal / 100,
    monthBreakdown,
  }
}

// ── Bitcoin history generation ────────────────────────────────────────────────

export async function generateBtcHistory(params: GenerateBtcHistoryParams): Promise<GenerateBtcHistoryResult> {
  await connectDB()

  const {
    userId, btcAccountId, startingBalance, endingBalance,
    minAmount, maxAmount, startDate, endDate,
    includeSwaps, seed, adminId, adminEmail, req,
  } = params

  if (!mongoose.Types.ObjectId.isValid(btcAccountId)) throw new Error("Invalid BTC account ID")

  const account = await Account.findById(btcAccountId).lean()
  if (!account) throw new Error("Bitcoin account not found")
  if (account.walletType !== "bitcoin") throw new Error("Not a bitcoin account")

  // Calculate duration from dates
  const periodStart = new Date(startDate).getTime()
  const periodEnd = new Date(endDate).getTime()
  if (periodEnd <= periodStart) throw new Error("End date must be after start date")
  const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24))
  const totalMonths = Math.max(1, Math.ceil(totalDays / 30))

  await Transaction.deleteMany({
    accountId: new mongoose.Types.ObjectId(btcAccountId),
    isGenerated: true,
  })

  const rng = new SeededRandom(seed)
  const PERIOD_MS = 30 * 86_400_000
  const usedRefs = new Set<string>()

  // Calculate required delta in BTC
  const balanceDelta = endingBalance - startingBalance
  const isNetPositive = balanceDelta >= 0

  // Convert to satoshis for calculations
  const startingSats = Math.round(startingBalance * 1e8)
  const endingSats = Math.round(endingBalance * 1e8)
  const deltaSats = endingSats - startingSats

  const avgTxPerMonth = rng.int(3, 8)
  const totalTxCount = avgTxPerMonth * totalMonths

  let totalDeposits = 0
  let totalWithdrawals = 0

  if (isNetPositive) {
    totalWithdrawals = Math.abs(deltaSats) * rng.float(0.3, 0.8)
    totalDeposits = totalWithdrawals + deltaSats
  } else {
    totalDeposits = Math.abs(deltaSats) * rng.float(0.2, 0.5)
    totalWithdrawals = totalDeposits + Math.abs(deltaSats)
  }

  const minSats = Math.round(minAmount * 1e8)
  const maxSats = Math.round(maxAmount * 1e8)

  totalDeposits = Math.max(totalDeposits, minSats * 5)
  totalWithdrawals = Math.max(totalWithdrawals, minSats * 3)

  // Recalculate to ensure exact delta
  if (isNetPositive) {
    totalDeposits = totalWithdrawals + deltaSats
  } else {
    totalWithdrawals = totalDeposits + Math.abs(deltaSats)
  }

  const depositCount = Math.floor(totalTxCount * (isNetPositive ? 0.6 : 0.4))
  const withdrawalCount = totalTxCount - depositCount

  interface BtcPartyDetails {
    name?: string
    bankName?: string
    accountNumber?: string
  }

  interface BtcTxDoc {
    _id: mongoose.Types.ObjectId
    accountId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    type: string
    amount: number
    currency: string
    status: string
    description: string
    reference: string
    isGenerated: boolean
    processedAt: Date
    createdAt: Date
    updatedAt: Date
    btcRateAtTime: number
    sender?: BtcPartyDetails
    receiver?: BtcPartyDetails
  }

  const docs: BtcTxDoc[] = []
  let btcPrice = 45000

  // Generate deposits
  let remainingDeposits = totalDeposits
  for (let i = 0; i < depositCount && remainingDeposits > 0; i++) {
    const monthIdx = Math.floor(i / Math.ceil(depositCount / totalMonths))
    const pStart = periodStart + monthIdx * PERIOD_MS
    const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
    if (pEnd <= pStart) continue

    btcPrice *= (1 + rng.float(-0.05, 0.08))
    btcPrice = Math.max(15000, Math.min(90000, btcPrice))

    let sats: number
    if (i === depositCount - 1) {
      sats = Math.round(remainingDeposits)
    } else {
      const avgSats = remainingDeposits / (depositCount - i)
      sats = Math.round(rng.float(
        Math.max(minSats, avgSats * 0.3),
        Math.min(maxSats, avgSats * 2)
      ))
    }
    sats = Math.min(sats, Math.round(remainingDeposits))
    remainingDeposits -= sats

    const ts = timestampInPeriod(rng, pStart, pEnd)
    const senderName = getRandomFullName(rng)
    
    docs.push({
      _id: new mongoose.Types.ObjectId(),
      accountId: new mongoose.Types.ObjectId(btcAccountId),
      userId: new mongoose.Types.ObjectId(userId),
      type: "deposit",
      amount: sats,
      currency: "BTC",
      status: "completed",
      description: getBtcIncomeDescription(rng),
      reference: uniqueRef(rng, usedRefs),
      isGenerated: true,
      sender: {
        name: senderName,
        bankName: "Bitcoin Network",
        accountNumber: `bc1q${rng.alphaNum(38).toLowerCase()}`,
      },
      processedAt: new Date(ts),
      createdAt: new Date(ts),
      updatedAt: new Date(),
      btcRateAtTime: btcPrice,
    })
  }

  // Generate withdrawals
  let remainingWithdrawals = totalWithdrawals
  for (let i = 0; i < withdrawalCount && remainingWithdrawals > 0; i++) {
    const monthIdx = Math.floor(i / Math.ceil(withdrawalCount / totalMonths))
    const pStart = periodStart + monthIdx * PERIOD_MS
    const pEnd = Math.min(periodStart + (monthIdx + 1) * PERIOD_MS, periodEnd)
    if (pEnd <= pStart) continue

    btcPrice *= (1 + rng.float(-0.05, 0.08))
    btcPrice = Math.max(15000, Math.min(90000, btcPrice))

    let sats: number
    if (i === withdrawalCount - 1) {
      sats = Math.round(remainingWithdrawals)
    } else {
      const avgSats = remainingWithdrawals / (withdrawalCount - i)
      sats = Math.round(rng.float(
        Math.max(minSats, avgSats * 0.2),
        Math.min(maxSats, avgSats * 1.5)
      ))
    }
    sats = Math.min(sats, Math.round(remainingWithdrawals))
    remainingWithdrawals -= sats

    const ts = timestampInPeriod(rng, pStart, pEnd)
    const receiverName = getRandomFullName(rng)
    
    docs.push({
      _id: new mongoose.Types.ObjectId(),
      accountId: new mongoose.Types.ObjectId(btcAccountId),
      userId: new mongoose.Types.ObjectId(userId),
      type: "withdrawal",
      amount: sats,
      currency: "BTC",
      status: "completed",
      description: getBtcExpenseDescription(rng),
      reference: uniqueRef(rng, usedRefs),
      isGenerated: true,
      receiver: {
        name: receiverName,
        bankName: "Bitcoin Network",
        accountNumber: `bc1q${rng.alphaNum(38).toLowerCase()}`,
      },
      processedAt: new Date(ts),
      createdAt: new Date(ts),
      updatedAt: new Date(),
      btcRateAtTime: btcPrice,
    })
  }

  // Sort by date
  docs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // Bulk insert
  if (docs.length > 0) {
    await Transaction.collection.insertMany(docs as unknown as Record<string, unknown>[])
  }

  // Update account balance to exact ending balance
  await Account.findByIdAndUpdate(btcAccountId, { btcBalance: endingSats })

  await createAuditLog(adminId, adminEmail, "history.generate.btc", "Account", btcAccountId, {
    userId, months: totalMonths,
    startingBalance, endingBalance,
    transactionCount: docs.length,
  }, req)

  return {
    transactionsCreated: docs.length,
    finalBtcBalance: endingBalance,
  }
}

// ── Preview function ──────────────────────────────────────────────────────────

export function previewGeneration(params: {
  startingBalance: number
  endingBalance: number
  minAmount: number
  maxAmount: number
  startDate: string
  endDate: string
  includeCardTransactions: boolean
  hasActiveCards: boolean
}): GenerationPreview {
  const { startingBalance, endingBalance, startDate, endDate, includeCardTransactions, hasActiveCards } = params
  
  // Calculate duration from dates
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
  const totalMonths = Math.max(1, Math.ceil(totalDays / 30))
  const balanceDelta = endingBalance - startingBalance

  const avgTxPerMonth = 25
  const estimatedTransactions = avgTxPerMonth * totalMonths

  let estimatedCardTransactions = 0
  if (includeCardTransactions && hasActiveCards) {
    estimatedCardTransactions = Math.floor(totalMonths * 10)
  }

  return {
    estimatedTransactions,
    estimatedCardTransactions,
    startingBalance,
    endingBalance,
    balanceDelta,
    totalMonths,
    avgTransactionsPerMonth: avgTxPerMonth,
  }
}
