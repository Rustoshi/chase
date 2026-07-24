import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import CardApplication from "@/lib/models/CardApplication"
import Account from "@/lib/models/Account"
import Transaction from "@/lib/models/Transaction"
import User from "@/lib/models/User"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import { sendAdminAlertEmail } from "@/lib/email"

// ── Helpers ──────────────────────────────────────────────────────────────────

function maskCardNumber(full: string | undefined | null, status: string): string | null {
  if (!full) return null
  const digits = full.replace(/\D/g, "")
  if (digits.length < 16) return full
  if (status === "active" || status === "frozen") {
    return `${digits.slice(0, 4)} **** **** ${digits.slice(-4)}`
  }
  return null
}

async function generateTxRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `TXN-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique reference")
}

async function generateCardRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 8 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `CARD-${suffix}`
    const exists = await CardApplication.findOne({ referenceNumber: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Could not generate unique card reference")
}

// ── GET — list user's cards ──────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()

    const [cards, settings, user, fiatAccount] = await Promise.all([
      CardApplication.find({ userId: session.user.id }).sort({ appliedAt: -1 }).lean(),
      AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean(),
      User.findById(session.user.id).select("firstName lastName kycStatus kycTier address").lean(),
      Account.findOne({ userId: session.user.id, walletType: "fiat" }).select("balance currency").lean(),
    ])

    const serialized = cards.map((c: Record<string, unknown>) => ({
      _id:             String(c._id),
      cardNetwork:     (c.cardNetwork as string) || "visa",
      cardType:        c.cardType,
      status:          c.status,
      cardNumber:      maskCardNumber(c.cardNumber as string | undefined, c.status as string),
      cvv:             (c.status === "active" || c.status === "frozen") ? (c.cvv || null) : null,
      creditLimit:     c.creditLimit || 0,
      spendingLimit:   c.spendingLimit || 0,
      preferredLimit:  c.preferredLimit || 0,
      balance:         c.balance || 0,
      expiryMonth:     c.expiryMonth || null,
      expiryYear:      c.expiryYear || null,
      cardholderName:  c.cardholderName || null,
      isVirtual:       c.isVirtual ?? true,
      applicationFee:  c.applicationFee || 0,
      referenceNumber: c.referenceNumber || null,
      adminNote:       c.adminNote || null,
      appliedAt:       (c.appliedAt as Date)?.toISOString() || (c.createdAt as Date)?.toISOString(),
      approvedAt:      (c.approvedAt as Date)?.toISOString() || null,
      deliveryStatus:  (c.deliveryStatus as string) || null,
      deliveryAddress: c.billingAddress || null,
    }))

    const settingsObj = settings as Record<string, unknown> | null
    const fee = (settingsObj?.cardApplicationFee as number) ?? 0
    const physicalFee = (settingsObj?.cardPhysicalFee as number) ?? 0
    const maxPerUser = (settingsObj?.cardMaxPerUser as number) ?? 5
    const requiredKycTier = (settingsObj?.cardRequiredKycTier as number) ?? 1
    const userObj = user as Record<string, unknown> | null
    const addr = (userObj?.address as Record<string, unknown>) || null

    return NextResponse.json({
      cards: serialized,
      cardSettings: {
        applicationFee: fee,
        physicalFee,
        maxPerUser,
        requiredKycTier,
      },
      eligibility: {
        fullName: user ? `${userObj?.firstName} ${userObj?.lastName}` : "",
        kycStatus: userObj?.kycStatus || "unverified",
        kycTier: userObj?.kycTier || 1,
        fiatBalance: fiatAccount ? ((fiatAccount as Record<string, unknown>).balance as number) / 100 : 0,
        currency: fiatAccount ? ((fiatAccount as Record<string, unknown>).currency as string) || "USD" : "USD",
        meetsKyc: userObj?.kycStatus === "verified" && ((userObj?.kycTier as number) || 1) >= requiredKycTier,
        address: addr ? {
          street:  (addr.street as string) || "",
          city:    (addr.city as string) || "",
          state:   (addr.state as string) || "",
          zip:     (addr.zip as string) || "",
          country: (addr.country as string) || "",
        } : null,
      },
    })
  } catch (err) {
    console.error("[GET /api/user/cards]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ── POST — apply for a card ──────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { cardNetwork, cardType, cardholderName, preferredLimit, dailySpendLimit, cardPin, billingAddress } = body
    const isVirtual = body.isVirtual !== false // default to virtual

    if (!["visa", "mastercard", "amex"].includes(cardNetwork))
      return NextResponse.json({ error: "Invalid card network. Choose Visa, Mastercard, or American Express." }, { status: 400 })
    if (!["debit", "credit"].includes(cardType))
      return NextResponse.json({ error: "Invalid card type. Choose Debit or Credit." }, { status: 400 })
    if (!cardholderName || typeof cardholderName !== "string" || cardholderName.trim().length < 2)
      return NextResponse.json({ error: "Cardholder name is required." }, { status: 400 })
    if (cardPin && (typeof cardPin !== "string" || !/^\d{4}$/.test(cardPin)))
      return NextResponse.json({ error: "Card PIN must be exactly 4 digits." }, { status: 400 })
    // Physical cards must have a complete delivery address (stored in billingAddress)
    if (!isVirtual) {
      const a = billingAddress
      if (!a || typeof a !== "object" || !a.street || !a.city || !a.zip || !a.country)
        return NextResponse.json({ error: "A complete delivery address (street, city, zip, country) is required for physical cards." }, { status: 400 })
    } else if (billingAddress && typeof billingAddress === "object") {
      const { street, city, zip, country } = billingAddress
      if (street && (!city || !zip || !country))
        return NextResponse.json({ error: "Billing address is incomplete. Street, city, zip, and country are required." }, { status: 400 })
    }

    await connectDB()

    // Fetch settings
    const settings = await AppSettings.findById(new mongoose.Types.ObjectId(APP_SETTINGS_ID)).lean()
    const maxCards = ((settings as Record<string, unknown>)?.cardMaxPerUser as number) ?? 5
    const requiredTier = ((settings as Record<string, unknown>)?.cardRequiredKycTier as number) ?? 1

    // Enforce KYC — a card can only be issued to a verified client
    const applicant = await User.findById(session.user.id).select("kycStatus kycTier").lean()
    const applicantObj = applicant as Record<string, unknown> | null
    if (applicantObj?.kycStatus !== "verified" || (((applicantObj?.kycTier as number) || 1) < requiredTier))
      return NextResponse.json({ error: "Your identity must be verified before you can apply for a card. Please complete KYC verification first." }, { status: 403 })
    const fee = isVirtual
      ? (((settings as Record<string, unknown>)?.cardApplicationFee as number) ?? 0)
      : (((settings as Record<string, unknown>)?.cardPhysicalFee as number) ?? 0)

    // Enforce max cards (active + pending)
    const activeCount = await CardApplication.countDocuments({
      userId: session.user.id,
      status: { $in: ["pending", "active", "frozen", "blocked"] },
    })
    if (activeCount >= maxCards)
      return NextResponse.json({ error: `You can have a maximum of ${maxCards} cards. Cancel an existing card to apply for a new one.` }, { status: 400 })

    // Deduct application fee if > 0
    if (fee > 0) {
      const fiatAccount = await Account.findOne({ userId: session.user.id, walletType: "fiat" })
      if (!fiatAccount)
        return NextResponse.json({ error: "No fiat account found" }, { status: 400 })

      const feeCents = Math.round(fee * 100)
      if (fiatAccount.balance < feeCents)
        return NextResponse.json({ error: `Insufficient balance. Card application fee is $${fee.toFixed(2)}.` }, { status: 400 })

      const dbSession = await mongoose.startSession()
      try {
        dbSession.startTransaction()

        await Account.findByIdAndUpdate(
          fiatAccount._id,
          { $inc: { balance: -feeCents } },
          { session: dbSession }
        )

        const reference = await generateTxRef()
        await Transaction.create([{
          accountId: fiatAccount._id,
          userId: session.user.id,
          type: "fee",
          amount: feeCents,
          currency: fiatAccount.currency,
          status: "completed",
          description: `Card application fee — ${cardNetwork === "visa" ? "Visa" : "Mastercard"} ${cardType}`,
          reference,
          processedAt: new Date(),
          metadata: { feeType: "card_application" },
        }], { session: dbSession })

        const refNumber = await generateCardRef()
        const card = await CardApplication.create([{
          userId: session.user.id,
          cardNetwork,
          cardType,
          cardholderName: cardholderName.trim().toUpperCase(),
          preferredLimit: preferredLimit ? Math.max(0, Number(preferredLimit)) : undefined,
          dailySpendLimit: dailySpendLimit ? Math.max(0, Number(dailySpendLimit)) : undefined,
          cardPin: cardPin || undefined,
          billingAddress: billingAddress && billingAddress.street ? billingAddress : undefined,
          status: "pending",
          isVirtual,
          ...(isVirtual ? {} : { deliveryStatus: "processing" }),
          applicationFee: fee,
          referenceNumber: refNumber,
          appliedAt: new Date(),
        }], { session: dbSession })

        await dbSession.commitTransaction()

        sendAdminAlertEmail("New card application", [
          { label: "Client",    value: `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() || (session.user.email || "—") },
          { label: "Email",     value: session.user.email || "—" },
          { label: "Card",      value: `${cardNetwork} ${cardType}` },
          { label: "Format",    value: isVirtual ? "Virtual" : "Physical (delivery required)" },
          { label: "Reference", value: refNumber },
          { label: "Date",      value: new Date().toLocaleString() },
        ], "A client applied for a new card.").catch(() => {})

        return NextResponse.json({
          card: {
            _id: String(card[0]._id),
            cardNetwork: card[0].cardNetwork,
            cardType: card[0].cardType,
            status: card[0].status,
            applicationFee: fee,
            referenceNumber: refNumber,
            appliedAt: card[0].appliedAt.toISOString(),
          },
        }, { status: 201 })
      } catch (err) {
        await dbSession.abortTransaction()
        throw err
      } finally {
        await dbSession.endSession()
      }
    }

    // No fee — simple create
    const refNumber = await generateCardRef()
    const card = await CardApplication.create({
      userId: session.user.id,
      cardNetwork,
      cardType,
      cardholderName: cardholderName.trim().toUpperCase(),
      preferredLimit: preferredLimit ? Math.max(0, Number(preferredLimit)) : undefined,
      dailySpendLimit: dailySpendLimit ? Math.max(0, Number(dailySpendLimit)) : undefined,
      cardPin: cardPin || undefined,
      billingAddress: billingAddress && billingAddress.street ? billingAddress : undefined,
      status: "pending",
      isVirtual,
      ...(isVirtual ? {} : { deliveryStatus: "processing" }),
      applicationFee: 0,
      referenceNumber: refNumber,
      appliedAt: new Date(),
    })

    sendAdminAlertEmail("New card application", [
      { label: "Client",    value: `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() || (session.user.email || "—") },
      { label: "Email",     value: session.user.email || "—" },
      { label: "Card",      value: `${cardNetwork} ${cardType}` },
      { label: "Format",    value: isVirtual ? "Virtual" : "Physical (delivery required)" },
      { label: "Reference", value: refNumber },
      { label: "Date",      value: new Date().toLocaleString() },
    ], "A client applied for a new card.").catch(() => {})

    return NextResponse.json({
      card: {
        _id: String(card._id),
        cardNetwork: card.cardNetwork,
        cardType: card.cardType,
        status: card.status,
        applicationFee: 0,
        referenceNumber: refNumber,
        appliedAt: card.appliedAt.toISOString(),
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/cards]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
