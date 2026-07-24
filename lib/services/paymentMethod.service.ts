import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import PaymentMethod     from "@/lib/models/PaymentMethod"
import { createAuditLog } from "@/lib/services/auth.service"
import type { IPaymentMethod, PaymentMethodType, DepositTarget, IPaymentInfo } from "@/lib/models/PaymentMethod"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CreatePaymentMethodData {
  name:          string
  slug?:         string
  type:          PaymentMethodType
  isEnabled:     boolean
  instructions?: string
  depositTarget: DepositTarget
  icon?:         string
  logoUrl?:      string
  logoPublicId?: string
  minAmount:     number
  maxAmount:     number
  feePercent:    number
  feeFixed:      number
  sortOrder?:    number
  paymentInfo?:  IPaymentInfo
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

function lean(doc: IPaymentMethod): Record<string, unknown> {
  return doc.toObject() as unknown as Record<string, unknown>
}

// ── getAllPaymentMethods ───────────────────────────────────────────────────────

export async function getAllPaymentMethods(): Promise<Record<string, unknown>[]> {
  await connectDB()
  const methods = await PaymentMethod.find({}).sort({ sortOrder: 1, name: 1 }).lean()
  return methods as unknown as Record<string, unknown>[]
}

// ── getPaymentMethodById ──────────────────────────────────────────────────────

export async function getPaymentMethodById(id: string): Promise<Record<string, unknown> | null> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null
  const m = await PaymentMethod.findById(id).lean()
  return m as unknown as Record<string, unknown> | null
}

// ── createPaymentMethod ───────────────────────────────────────────────────────

export async function createPaymentMethod(
  data:       CreatePaymentMethodData,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const slug = data.slug ? data.slug.toLowerCase().trim() : toSlug(data.name)

  const existing = await PaymentMethod.findOne({ slug }).lean()
  if (existing) throw new Error(`Slug "${slug}" is already in use`)

  let sortOrder = data.sortOrder
  if (sortOrder == null) {
    const last = await PaymentMethod.findOne({}).sort({ sortOrder: -1 }).lean()
    sortOrder  = last ? (last.sortOrder ?? 0) + 1 : 0
  }

  const method = await PaymentMethod.create({
    name:          data.name,
    slug,
    type:          data.type,
    isEnabled:     data.isEnabled,
    instructions:  data.instructions,
    depositTarget: data.depositTarget,
    icon:          data.icon,
    logoUrl:       data.logoUrl || undefined,
    logoPublicId:  data.logoPublicId || undefined,
    minAmount:     data.minAmount,
    maxAmount:     data.maxAmount || undefined,
    feePercent:    data.feePercent,
    feeFixed:      data.feeFixed,
    sortOrder,
    paymentInfo:   data.paymentInfo || undefined,
  })

  await createAuditLog(adminId, adminEmail, "payment_method.create", "PaymentMethod", String(method._id), {
    name: data.name, slug, type: data.type,
  }, req)

  return lean(method)
}

// ── updatePaymentMethod ───────────────────────────────────────────────────────

export async function updatePaymentMethod(
  id:         string,
  data:       Partial<CreatePaymentMethodData>,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid ID")

  const before = await PaymentMethod.findById(id).lean()
  if (!before) throw new Error("Payment method not found")

  const updates: Record<string, unknown> = {}
  if (data.name          != null) updates.name          = data.name
  if (data.type          != null) updates.type          = data.type
  if (data.isEnabled     != null) updates.isEnabled     = data.isEnabled
  if (data.instructions  != null) updates.instructions  = data.instructions
  if (data.depositTarget != null) updates.depositTarget = data.depositTarget
  if (data.icon          != null) updates.icon          = data.icon
  if (data.logoUrl       != null) updates.logoUrl       = data.logoUrl || undefined
  if (data.logoPublicId  != null) updates.logoPublicId  = data.logoPublicId || undefined
  if (data.minAmount     != null) updates.minAmount     = data.minAmount
  if (data.maxAmount     != null) updates.maxAmount     = data.maxAmount
  if (data.feePercent    != null) updates.feePercent    = data.feePercent
  if (data.feeFixed      != null) updates.feeFixed      = data.feeFixed
  if (data.sortOrder     != null) updates.sortOrder     = data.sortOrder
  if (data.paymentInfo   != null) updates.paymentInfo   = data.paymentInfo

  const updated = await PaymentMethod.findByIdAndUpdate(id, updates, { new: true })
  if (!updated) throw new Error("Update failed")

  await createAuditLog(adminId, adminEmail, "payment_method.update", "PaymentMethod", id, {
    before: before as unknown as Record<string, unknown>,
    after:  updates,
  }, req)

  return lean(updated)
}

// ── deletePaymentMethod ───────────────────────────────────────────────────────

export async function deletePaymentMethod(
  id:         string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<void> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid ID")

  const method = await PaymentMethod.findById(id).lean()
  if (!method) throw new Error("Payment method not found")
  if (method.isEnabled) throw new Error("Disable the payment method before deleting it")

  await PaymentMethod.findByIdAndDelete(id)

  await createAuditLog(adminId, adminEmail, "payment_method.delete", "PaymentMethod", id, {
    name: method.name, slug: method.slug,
  }, req)
}

// ── togglePaymentMethod ───────────────────────────────────────────────────────

export async function togglePaymentMethod(
  id:         string,
  isEnabled:  boolean,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("Invalid ID")

  const updated = await PaymentMethod.findByIdAndUpdate(
    id, { isEnabled }, { new: true }
  )
  if (!updated) throw new Error("Payment method not found")

  const action = isEnabled ? "payment_method.enable" : "payment_method.disable"
  await createAuditLog(adminId, adminEmail, action, "PaymentMethod", id, { isEnabled }, req)

  return lean(updated)
}

// ── reorderPaymentMethods ─────────────────────────────────────────────────────

export async function reorderPaymentMethods(
  orderedIds: string[],
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>[]> {
  await connectDB()

  await Promise.all(
    orderedIds.map((id, index) =>
      PaymentMethod.findByIdAndUpdate(id, { sortOrder: index })
    )
  )

  await createAuditLog(adminId, adminEmail, "payment_method.reorder", "PaymentMethod", undefined, {
    order: orderedIds,
  }, req)

  return getAllPaymentMethods()
}
