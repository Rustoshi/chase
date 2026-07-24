import { NextRequest, NextResponse } from "next/server"
import { z }          from "zod"
import mongoose       from "mongoose"
import { auth }       from "@/lib/auth"
import { connectDB }  from "@/lib/db/connection"
import DepositRequest from "@/lib/models/DepositRequest"
import Transaction    from "@/lib/models/Transaction"
import Account        from "@/lib/models/Account"
import PaymentMethod  from "@/lib/models/PaymentMethod"
import { assertTransactionsAllowed } from "@/lib/services/alert.service"
import { sendAdminAlertEmail } from "@/lib/email"

async function generateRef(): Promise<string> {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  for (let i = 0; i < 10; i++) {
    const suffix = Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("")
    const ref = `DEP-${suffix}`
    const exists = await Transaction.findOne({ reference: ref }).lean()
    if (!exists) return ref
  }
  throw new Error("Failed to generate unique reference")
}

const createSchema = z.object({
  paymentMethodId: z.string().min(1),
  amount:          z.number().positive(),
  proofUrl:        z.string().url().nullish().or(z.literal("")),
  proofPublicId:   z.string().nullish().or(z.literal("")),
  txReference:     z.string().nullish().or(z.literal("")),
  notes:           z.string().max(500).nullish().or(z.literal("")),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    let body: unknown
    try { body = await req.json() }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })
    }

    const { paymentMethodId, amount, proofUrl, proofPublicId, txReference, notes } = parsed.data

    await connectDB()

    // An admin alert may freeze money movement on this account.
    try {
      await assertTransactionsAllowed(session.user.id)
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Transactions are unavailable" },
        { status: 403 }
      )
    }

    // Validate payment method
    if (!mongoose.Types.ObjectId.isValid(paymentMethodId)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }
    const pm = await PaymentMethod.findById(paymentMethodId).lean()
    if (!pm || !pm.isEnabled) {
      return NextResponse.json({ error: "Payment method not available" }, { status: 400 })
    }

    // Min / max validation
    if (pm.minAmount && amount < pm.minAmount) {
      return NextResponse.json({ error: `Minimum deposit is $${pm.minAmount}` }, { status: 400 })
    }
    if (pm.maxAmount && amount > pm.maxAmount) {
      return NextResponse.json({ error: `Maximum deposit is $${pm.maxAmount}` }, { status: 400 })
    }

    // Deposits are always denominated in the client's fiat currency — the
    // payment method (Bitcoin, gift card, etc.) is only the rail used to pay,
    // so the amount is the fiat value and it credits the fiat account.
    const account = await Account.findOne({ userId: session.user.id, walletType: "fiat" }).lean()
    if (!account) {
      return NextResponse.json({ error: "No matching account found" }, { status: 400 })
    }

    // Store amount in cents (fiat)
    const amountSmallest = Math.round(amount * 100)
    const currency = account.currency || "USD"

    // Generate unique transaction reference
    const reference = await generateRef()

    const depositReq = await DepositRequest.create({
      userId:            new mongoose.Types.ObjectId(session.user.id),
      accountId:         account._id,
      paymentMethodId:   new mongoose.Types.ObjectId(paymentMethodId),
      requestedAmount:   amountSmallest,
      requestedCurrency: currency,
      proofUrl:          proofUrl || undefined,
      proofPublicId:     proofPublicId || undefined,
      txReference:       txReference || reference,
      notes:             notes || undefined,
      status:            "pending",
    })

    // Create a visible pending transaction so it appears in activity
    await Transaction.create({
      accountId:   account._id,
      userId:      new mongoose.Types.ObjectId(session.user.id),
      type:        "deposit",
      amount:      amountSmallest,
      currency,
      status:      "pending",
      description: `Deposit via ${pm.name}`,
      reference,
      isGenerated: false,
      metadata: {
        depositRequestId: String(depositReq._id),
        paymentMethod:    pm.name,
        paymentMethodType: pm.type,
      },
    })

    // Notify admin of the deposit request (fire-and-forget)
    sendAdminAlertEmail("New deposit request", [
      { label: "Client",  value: `${session.user.firstName ?? ""} ${session.user.lastName ?? ""}`.trim() || (session.user.email || "—") },
      { label: "Email",   value: session.user.email || "—" },
      { label: "Amount",  value: `${amount.toLocaleString()} ${currency}` },
      { label: "Method",  value: pm.name },
      { label: "Reference", value: reference },
      { label: "Date",    value: new Date().toLocaleString() },
    ], "A client submitted a deposit request awaiting review.").catch(() => {})

    return NextResponse.json({
      id:     String(depositReq._id),
      status: "pending",
      amount,
      currency,
      reference,
      message: "Deposit request submitted successfully. It will be reviewed shortly.",
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/deposit]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: list user's own deposit requests
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const requests = await DepositRequest.find({ userId: session.user.id })
      .populate("paymentMethodId", "name type icon")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const serialized = requests.map((r: Record<string, unknown>) => {
      const pm = r.paymentMethodId as Record<string, unknown> | null
      return {
        _id:               String(r._id),
        status:            r.status,
        requestedAmount:   Number(r.requestedAmount) / 100,
        requestedCurrency: r.requestedCurrency,
        proofUrl:          r.proofUrl || null,
        createdAt:         (r.createdAt as Date)?.toISOString(),
        reviewedAt:        (r.reviewedAt as Date)?.toISOString() || null,
        adminNote:         r.adminNote || null,
        paymentMethod: pm ? {
          name: pm.name,
          type: pm.type,
          icon: pm.icon || null,
        } : null,
      }
    })

    return NextResponse.json({ requests: serialized })
  } catch (err) {
    console.error("[GET /api/user/deposit]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
