import { NextRequest, NextResponse } from "next/server"
import { z }                    from "zod"
import { adminGuard }           from "@/lib/middleware/adminGuard"
import { createAdminTransaction } from "@/lib/services/user.service"

type Ctx = { params: Promise<{ id: string }> }

const Schema = z.object({
  accountId:       z.string().min(1),
  amount:          z.number().int("Amount must be a whole number (cents or satoshis)").refine((n) => n !== 0, "Amount cannot be zero"),
  senderName:      z.string().min(1, "Sender name is required").max(200),
  senderBank:      z.string().max(200).optional().default(""),
  receiverName:    z.string().min(1, "Receiver name is required").max(200),
  receiverBank:    z.string().max(200).optional().default(""),
  transferScope:   z.string().min(1, "Transfer scope is required"),
  description:     z.string().max(500).optional().default(""),
  transactionDate: z.string().min(1, "Transaction date is required"),
  sendEmail:       z.boolean().default(false),
})

export async function POST(req: NextRequest, { params }: Ctx) {
  const { user: admin, error } = await adminGuard()
  if (error) return error

  const { id: userId } = await params

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 422 })
  }

  try {
    const tx = await createAdminTransaction({
      userId,
      accountId:       parsed.data.accountId,
      amount:          parsed.data.amount,
      senderName:      parsed.data.senderName,
      senderBank:      parsed.data.senderBank ?? "",
      receiverName:    parsed.data.receiverName,
      receiverBank:    parsed.data.receiverBank ?? "",
      transferScope:   parsed.data.transferScope,
      description:     parsed.data.description ?? "",
      transactionDate: new Date(parsed.data.transactionDate),
      sendEmail:       parsed.data.sendEmail,
      adminId:         admin.id,
      adminEmail:      admin.email,
      req,
    })
    return NextResponse.json(tx)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Transaction failed"
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
