import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getAllPaymentMethods, createPaymentMethod } from "@/lib/services/paymentMethod.service"

const paymentInfoSchema = z.object({
  bankName:               z.string().max(200).optional(),
  accountName:            z.string().max(200).optional(),
  accountNumber:          z.string().max(100).optional(),
  routingNumber:          z.string().max(50).optional(),
  swiftCode:              z.string().max(20).optional(),
  iban:                   z.string().max(50).optional(),
  bankAddress:            z.string().max(500).optional(),
  email:                  z.string().email().optional().or(z.literal("")),
  username:               z.string().max(100).optional(),
  phoneNumber:            z.string().max(30).optional(),
  walletAddress:          z.string().max(200).optional(),
  network:                z.string().max(50).optional(),
  acceptedBrands:         z.array(z.string()).optional(),
  redemptionInstructions: z.string().max(1000).optional(),
}).optional()

const createSchema = z.object({
  name:          z.string().min(1).max(100),
  slug:          z.string().regex(/^[a-z0-9-]+$/).optional(),
  type:          z.enum(["bank_transfer", "paypal", "bitcoin", "venmo", "cash_app", "zelle", "wire", "crypto_other", "giftcard"]),
  isEnabled:     z.boolean().default(false),
  instructions:  z.string().max(2000).optional(),
  depositTarget: z.enum(["fiat", "bitcoin"]).default("fiat"),
  icon:          z.string().optional(),
  logoUrl:       z.string().url().optional().or(z.literal("")),
  logoPublicId:  z.string().optional(),
  minAmount:     z.number().min(0).default(0),
  maxAmount:     z.number().min(0).default(0),
  feePercent:    z.number().min(0).default(0),
  feeFixed:      z.number().min(0).default(0),
  sortOrder:     z.number().int().min(0).optional(),
  paymentInfo:   paymentInfoSchema,
})

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const methods = await getAllPaymentMethods()
    return NextResponse.json(methods)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const method = await createPaymentMethod(parsed.data, user.id, user.email, req)
    return NextResponse.json(method, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
