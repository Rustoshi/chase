import { NextRequest, NextResponse } from "next/server"
import { z }                        from "zod"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { getAppSettings, updateAppSettings } from "@/lib/services/settings.service"

const transferCodeSchema = z.object({
  enabled: z.boolean(),
  code:    z.string().max(100),
  message: z.string().max(500),
  label:   z.string().max(100),
})

const updateSchema = z.object({
  swapFeePercent:           z.number().min(0).max(10).optional(),
  swapMinAmount:            z.number().min(0).max(1000).optional(),
  swapMaxAmount:            z.number().min(100).max(1_000_000).optional(),
  localTransferFee:         z.number().min(0).max(100).optional(),
  internationalTransferFee: z.number().min(0).max(500).optional(),
  internationalTransferFeeType: z.enum(["flat", "percentage"]).optional(),
  internationalTransferFeePercent: z.number().min(0).max(100).optional(),
  maxDailyTransferAmount:   z.number().min(0).optional(),
  defaultCurrency:          z.string().min(2).max(10).optional(),
  supportedCurrencies:      z.array(z.string()).min(1).max(50).optional(),
  btcPriceSource:           z.string().optional(),
  maintenanceMode:          z.boolean().optional(),
  maintenanceMessage:       z.string().max(500).optional(),
  allowRegistration:        z.boolean().optional(),
  kycRequiredForTransfer:   z.boolean().optional(),
  cardApplicationFee:       z.number().min(0).max(10000).optional(),
  cardPhysicalFee:          z.number().min(0).max(10000).optional(),
  cardMaxPerUser:           z.number().int().min(1).max(20).optional(),
  cardRequiredKycTier:      z.number().int().min(1).max(3).optional(),
  supportPhone:             z.string().max(40).optional(),
  supportTextPhone:         z.string().max(40).optional(),
  supportEmail:             z.string().max(120).optional(),
  supportAddress:           z.string().max(200).optional(),
  supportOffices:           z.array(z.object({
    city:         z.string().max(80),
    type:         z.string().max(80),
    addressLine1: z.string().max(160),
    addressLine2: z.string().max(160),
    phone:        z.string().max(40),
  })).max(20).optional(),
  supportDepartments:       z.array(z.object({
    name:        z.string().max(80),
    description: z.string().max(200),
    email:       z.string().max(120),
  })).max(20).optional(),
  careersEmail:             z.string().max(120).optional(),
  complianceEmail:          z.string().max(120).optional(),
  privacyEmail:             z.string().max(120).optional(),
  legalEmail:               z.string().max(120).optional(),
  transferCodes: z.object({
    imfCode:          transferCodeSchema,
    swiftCode:        transferCodeSchema,
    imfClearanceCode: transferCodeSchema,
    taxCode:          transferCodeSchema,
  }).optional(),
})

export async function GET() {
  const { error } = await adminGuard()
  if (error) return error

  try {
    const settings = await getAppSettings()
    return NextResponse.json(settings)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await adminGuard()
  if (error) return error

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Validation error", issues: parsed.error.flatten() }, { status: 422 })

  try {
    const settings = await updateAppSettings(parsed.data, user.id, user.email, req)
    return NextResponse.json(settings)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 })
  }
}
