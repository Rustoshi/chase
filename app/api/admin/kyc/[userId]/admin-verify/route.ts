import { NextRequest, NextResponse } from "next/server"
import { z }                         from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { adminUploadAndVerifyKyc }  from "@/lib/services/kyc.service"

const schema = z.object({
  idDocType:            z.enum(["passport", "drivers_license", "national_id"]),
  idDocUrl:             z.string().url(),
  idDocPublicId:        z.string().optional(),
  selfieUrl:            z.string().url().optional(),
  selfiePublicId:       z.string().optional(),
  addressProofUrl:      z.string().url().optional(),
  addressProofPublicId: z.string().optional(),
  dateOfBirth:          z.string().optional(),
  ssn:                  z.string().max(20).optional(),
  address: z.object({
    street:  z.string().optional(),
    city:    z.string().optional(),
    state:   z.string().optional(),
    zip:     z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  tier: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const result = await adminUploadAndVerifyKyc(userId, parsed.data, user.id, user.email, req)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
