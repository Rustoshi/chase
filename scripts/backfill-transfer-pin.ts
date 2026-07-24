/**
 * Backfill transferPin for existing users who don't have one.
 * Run with: npx tsx scripts/backfill-transfer-pin.ts
 */
import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const MONGODB_URI = process.env.MONGODB_URI!
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1) }

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log("Connected to MongoDB")

  const User = mongoose.connection.collection("users")
  const users = await User.find({ $or: [{ transferPin: { $exists: false } }, { transferPin: null }, { transferPin: "" }] }).toArray()
  console.log(`Found ${users.length} users without transferPin`)

  for (const u of users) {
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    await User.updateOne({ _id: u._id }, { $set: { transferPin: pin } })
    console.log(`  + Set PIN for ${u.email}: ${pin}`)
  }

  console.log("\nDone!")
  await mongoose.disconnect()
  process.exit(0)
}

main().catch((err) => { console.error(err); process.exit(1) })
