// ── Persona Types & Definitions ─────────────────────────────────────────────
// This file is safe to import in client components (no DB imports)

export type PersonaKey = "student" | "freelancer" | "professional" | "business" | "retiree"

export interface ExpenseCategory {
  label:     string
  merchants: string[]
  weight:    number
}

export interface PersonaDef {
  monthlyIncome:          { min: number; max: number }
  incomeLabel:            string[]
  incomeFrequency:        "daily" | "biweekly" | "monthly" | "random" | "irregular"
  expenseCategories:      ExpenseCategory[]
  avgTransactionAmount:   { min: number; max: number }
  transactionsPerMonth:   { min: number; max: number }
  savingsRate:            number
  occasionalLargeExpense: { probability: number; min: number; max: number; labels: string[] }
  bestFor:                string
  icon:                   string
}

export const PERSONAS: Record<PersonaKey, PersonaDef> = {
  student: {
    monthlyIncome:   { min: 800,   max: 1800 },
    incomeLabel:     ["Tuition refund", "Part-time work", "Scholarship deposit", "Parent transfer"],
    incomeFrequency: "random",
    expenseCategories: [
      { label: "Food & dining",   merchants: ["McDonald's", "Chipotle", "Starbucks", "Subway", "Domino's", "Campus Café", "Dining Hall"],              weight: 0.30 },
      { label: "Transport",       merchants: ["Uber", "Lyft", "Metro Transit", "Campus Parking"],                                                       weight: 0.15 },
      { label: "Subscriptions",   merchants: ["Spotify", "Netflix", "Adobe Creative", "Amazon Prime", "YouTube Premium"],                               weight: 0.10 },
      { label: "Shopping",        merchants: ["Amazon", "Target", "Walmart", "H&M", "SHEIN"],                                                           weight: 0.20 },
      { label: "Education",       merchants: ["Chegg", "Coursera", "Campus Bookstore", "Apple App Store"],                                              weight: 0.10 },
      { label: "Entertainment",   merchants: ["Steam", "Regal Cinemas", "AMC Theaters", "Ticketmaster"],                                                weight: 0.15 },
    ],
    avgTransactionAmount:   { min: 4,  max: 65 },
    transactionsPerMonth:   { min: 18, max: 35 },
    savingsRate:            0.05,
    occasionalLargeExpense: { probability: 0.3, min: 100,  max: 400,    labels: ["Textbooks", "Electronics", "Travel"] },
    bestFor: "Students with part-time jobs and variable income",
    icon: "GraduationCap",
  },
  freelancer: {
    monthlyIncome:   { min: 2500, max: 8000 },
    incomeLabel:     ["Client payment", "Project milestone", "Consulting fee", "Contract payment"],
    incomeFrequency: "irregular",
    expenseCategories: [
      { label: "Software & tools", merchants: ["Adobe Creative Cloud", "Figma", "GitHub", "Slack", "Zoom", "Notion", "AWS", "Vercel"],                  weight: 0.15 },
      { label: "Food & dining",    merchants: ["DoorDash", "Grubhub", "Sweetgreen", "Blue Bottle Coffee", "The Coffee Bean", "Chipotle"],               weight: 0.20 },
      { label: "Office & supplies",merchants: ["WeWork", "Staples", "Best Buy", "Apple Store", "IKEA"],                                                 weight: 0.15 },
      { label: "Transport",        merchants: ["Uber", "Lyft", "Delta Airlines", "American Airlines", "Airbnb"],                                        weight: 0.15 },
      { label: "Marketing",        merchants: ["Google Ads", "Facebook Ads", "Canva Pro", "Mailchimp"],                                                 weight: 0.10 },
      { label: "Subscriptions",    merchants: ["Spotify", "Netflix", "Dropbox", "LastPass", "1Password"],                                               weight: 0.10 },
      { label: "Shopping",         merchants: ["Amazon", "Apple Store", "Costco", "Target"],                                                            weight: 0.15 },
    ],
    avgTransactionAmount:   { min: 15,  max: 200 },
    transactionsPerMonth:   { min: 25,  max: 50  },
    savingsRate:            0.15,
    occasionalLargeExpense: { probability: 0.5, min: 300,  max: 2000,   labels: ["Equipment purchase", "Software license", "Conference ticket", "Course"] },
    bestFor: "Freelancers, consultants, and gig workers",
    icon: "Laptop",
  },
  professional: {
    monthlyIncome:   { min: 5000,  max: 15000 },
    incomeLabel:     ["Direct deposit - payroll", "Salary deposit", "Payroll - biweekly", "ACH payroll"],
    incomeFrequency: "biweekly",
    expenseCategories: [
      { label: "Housing",        merchants: ["Rent payment", "Mortgage payment", "HOA fees", "Property management"],                                    weight: 0.30 },
      { label: "Food & dining",  merchants: ["Whole Foods", "Trader Joe's", "Instacart", "OpenTable", "Uber Eats", "Local Restaurant"],                  weight: 0.15 },
      { label: "Transport",      merchants: ["Shell Gas", "Chevron", "Tesla Supercharger", "Uber", "Delta Airlines", "Hertz"],                           weight: 0.10 },
      { label: "Utilities",      merchants: ["ConEd electricity", "National Grid gas", "Comcast internet", "Verizon wireless"],                          weight: 0.10 },
      { label: "Health",         merchants: ["Equinox", "CVS Pharmacy", "Walgreens", "Kaiser Permanente"],                                              weight: 0.10 },
      { label: "Subscriptions",  merchants: ["Netflix", "Hulu", "Disney+", "Apple One", "New York Times", "WSJ"],                                       weight: 0.08 },
      { label: "Shopping",       merchants: ["Amazon", "Nordstrom", "Banana Republic", "Best Buy", "Costco"],                                           weight: 0.12 },
      { label: "Investment",     merchants: ["Robinhood transfer", "Fidelity transfer", "Vanguard transfer"],                                            weight: 0.05 },
    ],
    avgTransactionAmount:   { min: 20,  max: 350 },
    transactionsPerMonth:   { min: 30,  max: 60  },
    savingsRate:            0.20,
    occasionalLargeExpense: { probability: 0.4, min: 500,  max: 5000,   labels: ["Vacation", "Home repair", "Car payment", "Medical expense"] },
    bestFor: "Full-time employees with stable biweekly income",
    icon: "Briefcase",
  },
  business: {
    monthlyIncome:   { min: 10000, max: 80000 },
    incomeLabel:     ["Customer payment", "Invoice settlement", "Sales revenue", "B2B transfer", "POS settlement", "Wire receipt"],
    incomeFrequency: "daily",
    expenseCategories: [
      { label: "Payroll",          merchants: ["ADP payroll", "Gusto payroll", "Payroll disbursement"],                                                 weight: 0.35 },
      { label: "Suppliers",        merchants: ["Alibaba", "Amazon Business", "Grainger", "Uline", "Sysco", "Local Supplier Co."],                       weight: 0.25 },
      { label: "Services",         merchants: ["Google Workspace", "Salesforce", "QuickBooks", "Shopify", "Stripe fees", "Twilio"],                     weight: 0.10 },
      { label: "Utilities & rent", merchants: ["Commercial rent", "Office utilities", "Business internet", "Phone bill"],                               weight: 0.10 },
      { label: "Marketing",        merchants: ["Google Ads", "Meta Ads", "HubSpot", "Mailchimp", "PR agency"],                                          weight: 0.10 },
      { label: "Logistics",        merchants: ["FedEx", "UPS", "USPS", "DHL", "Freight carrier"],                                                       weight: 0.10 },
    ],
    avgTransactionAmount:   { min: 50,   max: 2000 },
    transactionsPerMonth:   { min: 60,   max: 150  },
    savingsRate:            0.10,
    occasionalLargeExpense: { probability: 0.7, min: 2000, max: 20000,  labels: ["Equipment lease", "Bulk inventory", "Capital expense", "Tax payment"] },
    bestFor: "Small businesses, retailers, and service companies",
    icon: "Building2",
  },
  retiree: {
    monthlyIncome:   { min: 1500, max: 4000 },
    incomeLabel:     ["Social Security deposit", "Pension payment", "Retirement distribution", "IRA withdrawal", "Annuity payment"],
    incomeFrequency: "monthly",
    expenseCategories: [
      { label: "Healthcare",       merchants: ["CVS Pharmacy", "Walgreens", "Medicare supplement", "Doctor copay", "Lab services"],                     weight: 0.20 },
      { label: "Groceries",        merchants: ["Publix", "Kroger", "Whole Foods", "ALDI", "Sam's Club"],                                                 weight: 0.20 },
      { label: "Utilities",        merchants: ["Electric company", "Gas company", "Water bill", "AT&T phone", "Xfinity cable"],                          weight: 0.15 },
      { label: "Dining",           merchants: ["Denny's", "Cracker Barrel", "Olive Garden", "Local Diner", "IHOP"],                                     weight: 0.10 },
      { label: "Transport",        merchants: ["Gas station", "Auto insurance", "Car maintenance", "Uber"],                                              weight: 0.10 },
      { label: "Hobbies",          merchants: ["Golf course", "Book club", "Craft store", "Garden center", "Amazon"],                                   weight: 0.10 },
      { label: "Charitable",       merchants: ["Red Cross", "Local church", "Community foundation", "Charity donation"],                                 weight: 0.08 },
      { label: "Travel",           merchants: ["AARP travel", "Cruise line", "Hotel", "Delta Airlines"],                                                weight: 0.07 },
    ],
    avgTransactionAmount:   { min: 10,  max: 120 },
    transactionsPerMonth:   { min: 15,  max: 30  },
    savingsRate:            0.05,
    occasionalLargeExpense: { probability: 0.2, min: 200,  max: 3000,   labels: ["Medical procedure", "Home repair", "Travel", "Gift"] },
    bestFor: "Retirees living on fixed income and savings",
    icon: "Sunset",
  },
}
