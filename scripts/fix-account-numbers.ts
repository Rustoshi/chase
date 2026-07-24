/**
 * Replace any account numbers containing letters with pure 10-digit numbers.
 * Run with: npx tsx scripts/fix-account-numbers.ts
 */
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1) }

function randomAccountNumber(): string {
  return String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
}

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB")

  const accounts = mongoose.connection.collection("accounts")
  const all = await accounts.find({}).toArray()
  const usedNumbers = new Set(all.map((a) => a.accountNumber))

  let updated = 0
  for (const acct of all) {
    // If account number contains any non-digit character, replace it
    if (/\D/.test(acct.accountNumber)) {
      let newNum: string
      do { newNum = randomAccountNumber() } while (usedNumbers.has(newNum))

      usedNumbers.add(newNum)
      await accounts.updateOne({ _id: acct._id }, { $set: { accountNumber: newNum } })
      console.log(`  ${acct.accountNumber} -> ${newNum}  (${acct.walletType})`)
      updated++
    }
  }

  console.log(`\nUpdated ${updated} account(s). Done!`)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
