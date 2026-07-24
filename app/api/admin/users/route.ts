import { NextRequest, NextResponse } from "next/server"
import { z }                         from "zod"
import bcrypt                        from "bcryptjs"
import { adminGuard }                from "@/lib/middleware/adminGuard"
import { createAuditLog }            from "@/lib/services/auth.service"
import { getUsers, randomDigits, randomAlphaNum } from "@/lib/services/user.service"
import { connectDB }                 from "@/lib/db/connection"
import User                          from "@/lib/models/User"
import Account                       from "@/lib/models/Account"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"

// ── GET /api/admin/users ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams

  const params = {
    page:        Math.max(1, Number(sp.get("page")  ?? 1)),
    limit:       Math.min(100, Math.max(1, Number(sp.get("limit") ?? 20))),
    search:      sp.get("search")   ?? undefined,
    role:        sp.get("role")     ?? undefined,
    kycStatus:   sp.get("kycStatus") ?? undefined,
    sortBy:      sp.get("sortBy")   ?? "createdAt",
    sortOrder:   (sp.get("sortOrder") ?? "desc") as "asc" | "desc",
    isActive:    sp.has("isActive")    ? sp.get("isActive")    === "true" : undefined,
    isSuspended: sp.has("isSuspended") ? sp.get("isSuspended") === "true" : undefined,
  }

  try {
    const result = await getUsers(params)
    return NextResponse.json(result)
  } catch (err) {
    console.error("[admin/users GET]", err)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

// ── POST /api/admin/users ─────────────────────────────────────────────────────

const CreateUserSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName:  z.string().min(1).max(50),
  email:     z.string().email(),
  password:  z.string().min(8),
  role:      z.enum(["user", "admin"]).default("user"),
  phone:     z.string().optional(),
  currency:  z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = CreateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 422 })
  }

  const { firstName, lastName, email, password, role, phone, currency } = parsed.data

  try {
    await connectDB()

    const existing = await User.findOne({ email: email.toLowerCase() }).lean()
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    // Get platform default currency if not provided
    const settings = await AppSettings.findById(APP_SETTINGS_ID).lean()
    const userCurrency = (currency || settings?.defaultCurrency || "USD").toUpperCase()

    const passwordHash  = await bcrypt.hash(password, 12)
    const referralCode  = `NP${randomAlphaNum(6)}`

    const newUser = await User.create({
      firstName,
      lastName,
      email:        email.toLowerCase(),
      passwordHash,
      phone,
      role,
      referralCode,
      isActive:     true,
      emailVerified: true,
      kycStatus:    "unverified",
      kycTier:      1,
      preferredCurrency: userCurrency,
    })

    // Fiat account
    await Account.create({
      userId:        newUser._id,
      walletType:    "fiat",
      accountNumber: `ACC${randomDigits(8)}`,
      routingNumber: randomDigits(9),
      swiftCode:     `NVPY${randomAlphaNum(4)}`,
      iban:          `US${randomDigits(18)}`,
      currency:      userCurrency,
      accountType:   "checking",
    })

    // Bitcoin account
    await Account.create({
      userId:     newUser._id,
      walletType: "bitcoin",
      accountNumber: `BTC${randomDigits(8)}`,
      btcAddress: `1${randomAlphaNum(33)}`,
    })

    await createAuditLog(admin.id, admin.email, "user.create", "User", String(newUser._id), {
      email, role,
    }, req)

    return NextResponse.json(
      { id: String(newUser._id), firstName, lastName, email: newUser.email },
      { status: 201 }
    )
  } catch (err) {
    console.error("[admin/users POST]", err)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
