import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import AuditLog          from "@/lib/models/AuditLog"
import { createAuditLog } from "@/lib/services/auth.service"
import { isValidCurrencyCode } from "@/lib/utils/currencies"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TransferCodeUpdate {
  enabled: boolean
  code: string
  message: string
  label: string
}

export interface TransferCodesUpdate {
  imfCode?: TransferCodeUpdate
  swiftCode?: TransferCodeUpdate
  imfClearanceCode?: TransferCodeUpdate
  taxCode?: TransferCodeUpdate
}

export interface AppSettingsUpdate {
  swapFeePercent?:           number
  swapMinAmount?:            number
  swapMaxAmount?:            number
  localTransferFee?:         number
  internationalTransferFee?: number
  internationalTransferFeeType?: "flat" | "percentage"
  internationalTransferFeePercent?: number
  maxDailyTransferAmount?:   number
  defaultCurrency?:          string
  supportedCurrencies?:      string[]
  btcPriceSource?:           string
  fallbackBtcRate?:          number
  maintenanceMode?:          boolean
  maintenanceMessage?:       string
  allowRegistration?:        boolean
  kycRequiredForTransfer?:   boolean
  cardApplicationFee?:       number
  cardPhysicalFee?:          number
  cardMaxPerUser?:           number
  cardRequiredKycTier?:      number
  supportPhone?:             string
  supportTextPhone?:         string
  supportEmail?:             string
  supportAddress?:           string
  supportOffices?:           { city: string; type: string; addressLine1: string; addressLine2: string; phone: string }[]
  supportDepartments?:       { name: string; description: string; email: string }[]
  careersEmail?:             string
  complianceEmail?:          string
  privacyEmail?:             string
  legalEmail?:               string
  transferCodes?:            TransferCodesUpdate
}

// ── getAppSettings ────────────────────────────────────────────────────────────

export async function getAppSettings(): Promise<Record<string, unknown>> {
  await connectDB()

  const settings = await AppSettings.findByIdAndUpdate(
    new mongoose.Types.ObjectId(APP_SETTINGS_ID),
    { $setOnInsert: { _id: new mongoose.Types.ObjectId(APP_SETTINGS_ID) } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()

  return settings as unknown as Record<string, unknown>
}

// ── updateAppSettings ─────────────────────────────────────────────────────────

export async function updateAppSettings(
  data:       AppSettingsUpdate,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  // Validate each provided field
  if (data.swapFeePercent != null) {
    if (data.swapFeePercent < 0 || data.swapFeePercent > 10)
      throw new Error("swapFeePercent must be 0–10")
  }
  if (data.swapMinAmount != null && (data.swapMinAmount < 0 || data.swapMinAmount > 1000))
    throw new Error("swapMinAmount must be 0–1000")
  if (data.swapMaxAmount != null && (data.swapMaxAmount < 100 || data.swapMaxAmount > 1_000_000))
    throw new Error("swapMaxAmount must be 100–1,000,000")
  if (data.swapMinAmount != null && data.swapMaxAmount != null && data.swapMaxAmount <= data.swapMinAmount)
    throw new Error("swapMaxAmount must be greater than swapMinAmount")
  if (data.localTransferFee != null && (data.localTransferFee < 0 || data.localTransferFee > 100))
    throw new Error("localTransferFee must be 0–100")
  if (data.internationalTransferFee != null && (data.internationalTransferFee < 0 || data.internationalTransferFee > 500))
    throw new Error("internationalTransferFee must be 0–500")
  if (data.internationalTransferFeeType != null && !["flat", "percentage"].includes(data.internationalTransferFeeType))
    throw new Error("internationalTransferFeeType must be 'flat' or 'percentage'")
  if (data.internationalTransferFeePercent != null && (data.internationalTransferFeePercent < 0 || data.internationalTransferFeePercent > 100))
    throw new Error("internationalTransferFeePercent must be 0–100")
  if (data.maxDailyTransferAmount != null && data.maxDailyTransferAmount < 0)
    throw new Error("maxDailyTransferAmount must be ≥ 0")
  if (data.supportedCurrencies != null) {
    if (data.supportedCurrencies.length === 0) throw new Error("At least one currency required")
    if (data.supportedCurrencies.length > 50)  throw new Error("Maximum 50 currencies")
    for (const code of data.supportedCurrencies) {
      if (!isValidCurrencyCode(code)) throw new Error(`Invalid currency code: ${code}`)
    }
  }
  if (data.defaultCurrency != null) {
    if (!isValidCurrencyCode(data.defaultCurrency)) throw new Error(`Invalid currency: ${data.defaultCurrency}`)
    if (data.supportedCurrencies && !data.supportedCurrencies.includes(data.defaultCurrency.toUpperCase()))
      throw new Error("defaultCurrency must be in supportedCurrencies")
  }
  if (data.fallbackBtcRate != null && (data.fallbackBtcRate < 0 || data.fallbackBtcRate > 1_000_000))
      throw new Error("fallbackBtcRate must be 0–1,000,000")
  if (data.maintenanceMessage != null && data.maintenanceMessage.length > 500)
    throw new Error("maintenanceMessage max 500 chars")
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (data.supportEmail != null && data.supportEmail.trim() !== "" && !emailRe.test(data.supportEmail.trim()))
    throw new Error("supportEmail must be a valid email address")
  for (const key of ["careersEmail", "complianceEmail", "privacyEmail", "legalEmail"] as const) {
    const v = data[key]
    if (v != null && v.trim() !== "" && !emailRe.test(v.trim()))
      throw new Error(`${key} must be a valid email address`)
  }

  const before = await getAppSettings()

  // Build $set from provided fields only
  const $set: Record<string, unknown> = {
    updatedAt: new Date(),
    updatedBy: new mongoose.Types.ObjectId(adminId),
  }
  const fieldsToUpdate: (keyof AppSettingsUpdate)[] = [
    "swapFeePercent", "swapMinAmount", "swapMaxAmount",
    "localTransferFee", "internationalTransferFee", "internationalTransferFeeType", "internationalTransferFeePercent", "maxDailyTransferAmount",
    "defaultCurrency", "supportedCurrencies", "btcPriceSource", "fallbackBtcRate",
    "maintenanceMode", "maintenanceMessage", "allowRegistration", "kycRequiredForTransfer",
    "cardApplicationFee", "cardPhysicalFee", "cardMaxPerUser", "cardRequiredKycTier",
    "supportPhone", "supportTextPhone", "supportEmail", "supportAddress",
    "supportOffices", "supportDepartments",
    "careersEmail", "complianceEmail", "privacyEmail", "legalEmail",
  ]
  for (const field of fieldsToUpdate) {
    if (data[field] !== undefined) {
      $set[field] = field === "defaultCurrency"
        ? (data[field] as string).toUpperCase()
        : data[field]
    }
  }

  // Handle transferCodes separately (nested object)
  if (data.transferCodes) {
    for (const [key, value] of Object.entries(data.transferCodes)) {
      if (value !== undefined) {
        $set[`transferCodes.${key}`] = value
      }
    }
  }

  const updated = await AppSettings.findByIdAndUpdate(
    new mongoose.Types.ObjectId(APP_SETTINGS_ID),
    { $set },
    { new: true, upsert: true }
  ).lean()

  // Compute diff for audit (only changed fields)
  const after: Record<string, unknown> = {}
  for (const key of Object.keys($set)) {
    if (key === "updatedAt" || key === "updatedBy") continue
    after[key] = $set[key]
  }

  await createAuditLog(adminId, adminEmail, "settings.update", "AppSettings", APP_SETTINGS_ID, {
    before: extractChangedFields(before, after),
    after,
  }, req)

  return updated as unknown as Record<string, unknown>
}

function extractChangedFields(
  before: Record<string, unknown>,
  after:  Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(after)) {
    result[key] = before[key]
  }
  return result
}

// ── getSettingsHistory ────────────────────────────────────────────────────────

export async function getSettingsHistory(
  limit: number
): Promise<Record<string, unknown>[]> {
  await connectDB()

  const entries = await AuditLog.find({ action: "settings.update" })
    .sort({ createdAt: -1 })
    .limit(Math.min(50, limit))
    .lean()

  return entries as unknown as Record<string, unknown>[]
}
