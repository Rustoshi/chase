/**
 * First-run seed script — creates the first admin user.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Reads credentials from .env.local:
 *   ADMIN_EMAIL       — Admin email address
 *   ADMIN_PASSWORD    — Admin password (min 8 characters)
 *   ADMIN_FIRST_NAME  — First name (default "Admin")
 *   ADMIN_LAST_NAME   — Last name (default "User")
 *
 * Requires .env.local with MONGODB_URI set.
 * Running the script a second time with the same email updates the role to admin.
 */

import mongoose from "mongoose"
import bcrypt   from "bcryptjs"
import * as dotenv from "dotenv"
import path     from "path"

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })

// ── Read from environment ───────────────────────────────────────────────────────
const email     = process.env.ADMIN_EMAIL
const password  = process.env.ADMIN_PASSWORD
const firstName = process.env.ADMIN_FIRST_NAME ?? "Admin"
const lastName  = process.env.ADMIN_LAST_NAME  ?? "User"

if (!email || !password) {
  console.error("❌  Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env.local")
  console.error("   Add the following to your .env.local file:")
  console.error("   ADMIN_EMAIL=admin@example.com")
  console.error("   ADMIN_PASSWORD=YourSecurePassword")
  process.exit(1)
}
if (password.length < 8) {
  console.error("❌  ADMIN_PASSWORD must be at least 8 characters")
  process.exit(1)
}

// ── Env check ──────────────────────────────────────────────────────────────────
const { MONGODB_URI } = process.env
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env.local")
  process.exit(1)
}

// ── Inline User schema — matches /lib/models/User.ts ──────────────────────────
// Inlined so the script has no dependency on the Next.js module graph.
const UserSchema = new mongoose.Schema(
  {
    firstName:        { type: String, required: true, trim: true },
    lastName:         { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:     { type: String, required: true },
    role:             { type: String, enum: ["user", "admin"], default: "user" },
    kycStatus:        { type: String, enum: ["unverified","pending","verified","rejected"], default: "unverified" },
    kycTier:          { type: Number, enum: [1, 2, 3], default: 1 },
    isActive:         { type: Boolean, default: true },
    isSuspended:      { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    emailVerified:    { type: Boolean, default: true },
    referralCode:     { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
)

async function main() {
  await mongoose.connect(MONGODB_URI as string)
  console.log("✅  Connected to MongoDB")

  const UserModel =
    (mongoose.models["User"] as mongoose.Model<unknown>) ??
    mongoose.model("User", UserSchema)

  const existing = await UserModel.findOne({ email: email!.toLowerCase() })

  if (existing) {
    await UserModel.findOneAndUpdate(
      { email: email!.toLowerCase() },
      { $set: { role: "admin", isActive: true, isSuspended: false } }
    )
    console.log(`ℹ️   User "${email}" already exists — role updated to admin.`)
  } else {
    const passwordHash = await bcrypt.hash(password as string, 12)
    const referralCode = `NP${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    await UserModel.create({
      firstName,
      lastName,
      email:        email!.toLowerCase(),
      passwordHash,
      role:         "admin",
      isActive:     true,
      emailVerified: true,
      referralCode,
    })
    console.log(`✅  Admin account created: ${firstName} ${lastName} <${email}>`)
  }

  await mongoose.disconnect()
  console.log("✅  Done. You can now log in at /admin/login")
}

main().catch((err) => {
  console.error("❌  Seed failed:", err)
  process.exit(1)
})
