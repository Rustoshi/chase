/**
 * Seed default payment methods.
 * Run with: npx tsx scripts/seed-payment-methods.ts
 */

import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1) }

const PaymentMethodSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  slug:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  type:          { type: String, required: true },
  isEnabled:     { type: Boolean, default: true },
  instructions:  { type: String },
  depositTarget: { type: String, default: "fiat" },
  icon:          { type: String },
  minAmount:     { type: Number, default: 0 },
  maxAmount:     { type: Number, default: 0 },
  feePercent:    { type: Number, default: 0 },
  feeFixed:      { type: Number, default: 0 },
  sortOrder:     { type: Number, default: 0 },
}, { timestamps: true })

const PaymentMethod = mongoose.models.PaymentMethod ?? mongoose.model("PaymentMethod", PaymentMethodSchema)

const METHODS = [
  {
    name: "Bank Transfer",
    slug: "bank-transfer",
    type: "bank_transfer",
    isEnabled: true,
    depositTarget: "fiat",
    sortOrder: 0,
    minAmount: 50,
    maxAmount: 100000,
    feePercent: 0,
    feeFixed: 0,
    instructions: [
      "Bank Name: Chase Bank",
      "Account Name: NovaPay Inc.",
      "Account Number: 4820019371",
      "Routing Number: 021000021",
      "SWIFT/BIC: CHASUS33",
      "",
      "Please include your account number as the payment reference.",
    ].join("\n"),
  },
  {
    name: "Credit / Debit Card",
    slug: "credit-card",
    type: "wire",
    isEnabled: true,
    depositTarget: "fiat",
    sortOrder: 1,
    minAmount: 10,
    maxAmount: 10000,
    feePercent: 2.5,
    feeFixed: 0,
    instructions: [
      "Send your card payment to the following details:",
      "",
      "Payment Processor: Stripe",
      "Merchant: NovaPay Inc.",
      "",
      "After completing the card payment, take a screenshot of the confirmation page and upload it as proof.",
    ].join("\n"),
  },
  {
    name: "USDT (Tether)",
    slug: "usdt",
    type: "crypto_other",
    isEnabled: true,
    depositTarget: "fiat",
    sortOrder: 2,
    minAmount: 10,
    maxAmount: 50000,
    feePercent: 0,
    feeFixed: 0,
    instructions: [
      "Network: TRC-20 (Tron)",
      "USDT Address: TN7X2r8ksVwGqFkHftBud91qoTQpan3K5v",
      "",
      "Only send USDT on the TRC-20 network. Sending other tokens or using a different network may result in permanent loss of funds.",
    ].join("\n"),
  },
  {
    name: "PayPal",
    slug: "paypal",
    type: "paypal",
    isEnabled: true,
    depositTarget: "fiat",
    sortOrder: 3,
    minAmount: 10,
    maxAmount: 5000,
    feePercent: 3,
    feeFixed: 0,
    instructions: [
      "PayPal Email: payments@novapay.com",
      "",
      "Send as 'Friends & Family' to avoid extra fees.",
      "Include your NovaPay username in the payment note.",
    ].join("\n"),
  },
  {
    name: "Bitcoin",
    slug: "bitcoin",
    type: "bitcoin",
    isEnabled: true,
    depositTarget: "bitcoin",
    sortOrder: 4,
    minAmount: 0,
    maxAmount: 0,
    feePercent: 0,
    feeFixed: 0,
    instructions: [
      "BTC Address: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "",
      "Send only Bitcoin (BTC) to this address.",
      "Minimum 1 network confirmation required.",
      "Your deposit will be credited after confirmation.",
    ].join("\n"),
  },
]

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB")

  for (const m of METHODS) {
    const exists = await PaymentMethod.findOne({ slug: m.slug })
    if (exists) {
      console.log(`  ✓ "${m.name}" already exists — skipping`)
    } else {
      await PaymentMethod.create(m)
      console.log(`  + Created "${m.name}"`)
    }
  }

  console.log("\nDone! Payment methods seeded.")
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
