import mongoose          from "mongoose"
import { connectDB }     from "@/lib/db/connection"
import CardApplication   from "@/lib/models/CardApplication"
import User              from "@/lib/models/User"
import { createAuditLog } from "@/lib/services/auth.service"
import { notifyUser }    from "@/lib/services/deposit.service"
import { sendCardStatusEmail } from "@/lib/email"
import type { CardEmailDetails } from "@/lib/email/templates/CardStatusEmail"

interface CardNotifyExtras {
  card?:      CardEmailDetails
  nextSteps?: string[]
  subject?:   string
}

/** Build the card-details block shown in the email from a card document. */
function cardEmailDetails(c: {
  cardNumber?:  string | null
  cardNetwork?: string | null
  cardType?:    string | null
  isVirtual?:   boolean | null
}): CardEmailDetails {
  return {
    last4:     c.cardNumber ? String(c.cardNumber).slice(-4) : undefined,
    network:   c.cardNetwork ?? undefined,
    type:      c.cardType    ?? undefined,
    isVirtual: c.isVirtual   ?? undefined,
  }
}

// Notify a user of a card change in-app AND by email (email is fire-and-forget).
async function notifyCardUser(
  userId:  string,
  title:   string,
  message: string,
  cardId:  string,
  tone?:   "positive" | "warning" | "neutral",
  extras:  CardNotifyExtras = {}
): Promise<void> {
  await notifyUser(userId, "card", title, message, { cardId })
  const u = await User.findById(userId).select("email firstName").lean() as { email?: string; firstName?: string } | null
  if (u?.email) {
    sendCardStatusEmail(
      u.email,
      u.firstName || "there",
      title,
      message,
      tone,
      extras.card,
      extras.nextSteps,
      extras.subject,
    ).catch(() => {})
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CardListItem {
  id:            string
  userId:        string
  userName:      string
  userEmail:     string
  userKycStatus: string
  cardNetwork:   string
  cardType:      string
  creditLimit?:  number
  spendingLimit?: number
  preferredLimit?: number
  dailySpendLimit?: number
  balance:       number
  status:        string
  cardNumber?:   string
  cvv?:          string
  expiryMonth?:  number
  expiryYear?:   number
  cardholderName?: string
  isVirtual:     boolean
  applicationFee: number
  adminNote?:    string
  appliedAt:     string
  approvedAt?:   string
  cancelledAt?:  string
  deliveryStatus?: string
  deliveryAddress?: { street?: string; city?: string; state?: string; zip?: string; country?: string }
}

export interface CardDetail extends CardListItem {
  userFirstName: string
  userLastName:  string
  userPhone?:    string
  cardPin?:      string
  referenceNumber?: string
}

export interface AdminCardUpdate {
  cardNetwork?:     "visa" | "mastercard" | "amex"
  cardType?:        "debit" | "credit"
  isVirtual?:       boolean
  cardholderName?:  string
  cardNumber?:      string
  cvv?:             string
  expiryMonth?:     number
  expiryYear?:      number
  cardPin?:         string
  creditLimit?:     number
  spendingLimit?:   number
  dailySpendLimit?: number
  status?:          string
  deliveryStatus?:  string
  adminNote?:       string
}

export interface CardStats {
  pendingCount:    number
  approvedCount:   number
  rejectedCount:   number
  activeCount:     number
  frozenCount:     number
  blockedCount:    number
  cancelledCount:  number
  totalCreditIssued: number
}

export interface GetCardParams {
  page?:      number
  limit?:     number
  status?:    string
  cardType?:  string
  userId?:    string
  dateFrom?:  string
  dateTo?:    string
  sortBy?:    string
  sortOrder?: "asc" | "desc"
}

export interface CardApprovalData {
  creditLimit:   number
  spendingLimit: number
  adminNote?:    string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function luhnCheckDigit(partial: string): string {
  const digits = partial.split("").map(Number).reverse()
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i]
    if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return String((10 - (sum % 10)) % 10)
}

function randomDigits(n: number): string {
  return Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("")
}

function generateCardNumber(network: "visa" | "mastercard"): { full: string; masked: string; last4: string } {
  let prefix: string
  if (network === "visa") {
    prefix = "4" + randomDigits(5)
  } else {
    const bin = 51 + Math.floor(Math.random() * 5) // 51-55
    prefix = String(bin) + randomDigits(4)
  }
  const partial = prefix + randomDigits(9) // 15 digits
  const full = partial + luhnCheckDigit(partial)
  const last4 = full.slice(-4)
  const masked = full.slice(0, 4) + " **** **** " + last4
  return { full, masked, last4 }
}

function generateCVV(): string {
  return String(100 + Math.floor(Math.random() * 900))
}

function buildCardMatch(params: GetCardParams): Record<string, unknown> {
  const match: Record<string, unknown> = {}
  if (params.status)   match.status   = params.status
  if (params.cardType) match.cardType = params.cardType
  if (params.userId && mongoose.Types.ObjectId.isValid(params.userId))
    match.userId = new mongoose.Types.ObjectId(params.userId)
  if (params.dateFrom || params.dateTo) {
    const range: Record<string, Date> = {}
    if (params.dateFrom) range.$gte = new Date(params.dateFrom)
    if (params.dateTo)   range.$lte = new Date(params.dateTo)
    match.appliedAt = range
  }
  return match
}

function serializeCard(
  doc:  Record<string, unknown>,
  user: Record<string, unknown>
): CardListItem {
  return {
    id:            String(doc._id),
    userId:        String(doc.userId),
    userName:      `${user.firstName} ${user.lastName}`,
    userEmail:     user.email as string,
    userKycStatus: user.kycStatus as string,
    cardNetwork:   (doc.cardNetwork as string) || "visa",
    cardType:      doc.cardType   as string,
    creditLimit:   doc.creditLimit  as number | undefined,
    spendingLimit: doc.spendingLimit as number | undefined,
    preferredLimit: doc.preferredLimit as number | undefined,
    dailySpendLimit: doc.dailySpendLimit as number | undefined,
    balance:       (doc.balance as number) ?? 0,
    status:        doc.status    as string,
    cardNumber:    doc.cardNumber as string | undefined,
    cvv:           doc.cvv as string | undefined,
    expiryMonth:   doc.expiryMonth as number | undefined,
    expiryYear:    doc.expiryYear  as number | undefined,
    cardholderName: doc.cardholderName as string | undefined,
    isVirtual:     (doc.isVirtual as boolean) ?? true,
    applicationFee: (doc.applicationFee as number) ?? 0,
    adminNote:     doc.adminNote  as string | undefined,
    appliedAt:     (doc.appliedAt as Date).toISOString(),
    approvedAt:    (doc.approvedAt  as Date | undefined)?.toISOString(),
    cancelledAt:   (doc.cancelledAt as Date | undefined)?.toISOString(),
    deliveryStatus: (doc.deliveryStatus as string | undefined),
    deliveryAddress: (doc.billingAddress as CardListItem["deliveryAddress"]) || undefined,
  }
}

// ── getCardApplications ───────────────────────────────────────────────────────

export async function getCardApplications(
  params: GetCardParams
): Promise<{ cards: CardListItem[]; total: number; pages: number; stats: CardStats }> {
  await connectDB()

  const page  = Math.max(1,   params.page  ?? 1)
  const limit = Math.min(100, params.limit ?? 20)
  const skip  = (page - 1) * limit
  const match = buildCardMatch(params)

  const sortField = params.sortBy === "cardType" ? "cardType" : "appliedAt"
  const sortDir   = params.sortOrder === "asc" ? 1 : -1

  // Build a separate match for stats that excludes status filter (show global stats)
  const statsMatch = buildCardMatch({ ...params, status: undefined })

  const [docs, total, aggStats] = await Promise.all([
    CardApplication.find(match)
      .populate("userId", "firstName lastName email kycStatus phone")
      .sort({ [sortField]: sortDir })
      .skip(skip)
      .limit(limit)
      .lean(),

    CardApplication.countDocuments(match),

    // Stats should be global (not filtered by status tab)
    CardApplication.aggregate([
      { $match: statsMatch },
      { $group: {
        _id:              null,
        pendingCount:     { $sum: { $cond: [{ $eq: ["$status", "pending"]   }, 1, 0] } },
        approvedCount:    { $sum: { $cond: [{ $eq: ["$status", "approved"]  }, 1, 0] } },
        rejectedCount:    { $sum: { $cond: [{ $eq: ["$status", "rejected"]  }, 1, 0] } },
        activeCount:      { $sum: { $cond: [{ $eq: ["$status", "active"]    }, 1, 0] } },
        frozenCount:      { $sum: { $cond: [{ $eq: ["$status", "frozen"]    }, 1, 0] } },
        blockedCount:     { $sum: { $cond: [{ $eq: ["$status", "blocked"]   }, 1, 0] } },
        cancelledCount:   { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        totalCreditIssued:{ $sum: { $ifNull: ["$creditLimit", 0] } },
      }},
    ]),
  ])

  const s = aggStats[0] ?? {}
  const stats: CardStats = {
    pendingCount:     s.pendingCount    ?? 0,
    approvedCount:    s.approvedCount   ?? 0,
    rejectedCount:    s.rejectedCount   ?? 0,
    activeCount:      s.activeCount     ?? 0,
    frozenCount:      s.frozenCount     ?? 0,
    blockedCount:     s.blockedCount    ?? 0,
    cancelledCount:   s.cancelledCount  ?? 0,
    totalCreditIssued:s.totalCreditIssued ?? 0,
  }

  const cards = docs.map((doc) => {
    const rawDoc  = doc as unknown as Record<string, unknown>
    const rawUser = (rawDoc.userId ?? {}) as Record<string, unknown>
    return serializeCard(rawDoc, rawUser)
  })

  return { cards, total, pages: Math.ceil(total / limit), stats }
}

// ── getCardById ───────────────────────────────────────────────────────────────

export async function getCardById(id: string): Promise<CardDetail | null> {
  await connectDB()
  if (!mongoose.Types.ObjectId.isValid(id)) return null

  const doc = await CardApplication.findById(id)
    .populate("userId", "firstName lastName email phone kycStatus")
    .lean()
  if (!doc) return null

  const rawDoc  = doc as unknown as Record<string, unknown>
  const rawUser = (rawDoc.userId ?? {}) as Record<string, unknown>

  return {
    ...serializeCard(rawDoc, rawUser),
    userFirstName: rawUser.firstName as string,
    userLastName:  rawUser.lastName  as string,
    userPhone:     rawUser.phone     as string | undefined,
    cardPin:       rawDoc.cardPin as string | undefined,
    referenceNumber: rawDoc.referenceNumber as string | undefined,
    dailySpendLimit: rawDoc.dailySpendLimit as number | undefined,
  }
}

// ── approveCard ───────────────────────────────────────────────────────────────

export async function approveCard(
  cardId:     string,
  data:       CardApprovalData,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  if (data.creditLimit <= 0) throw new Error("Credit limit must be greater than 0")

  const card = await CardApplication.findById(cardId).populate("userId", "firstName lastName email kycStatus")
  if (!card)                     throw new Error("Card application not found")
  if (card.status !== "pending") throw new Error("Card application is not pending")

  const user = card.userId as unknown as Record<string, unknown>

  // KYC check for credit cards
  if (card.cardType === "credit" && user.kycStatus !== "verified") {
    throw new Error("User KYC must be verified before approving a credit card")
  }

  const network = card.cardNetwork || "visa"
  const { full, masked, last4 } = generateCardNumber(network as "visa" | "mastercard")
  const cvv = generateCVV()
  const now        = new Date()
  const expiryYear = now.getFullYear() + (Math.random() < 0.5 ? 3 : 4)
  const expiryMonth = Math.floor(Math.random() * 12) + 1

  // Physical cards are issued now but only become usable once delivered — they
  // sit in "approved" with delivery tracking; virtual cards go straight to active.
  const isPhysical = card.isVirtual === false

  const updated = await CardApplication.findByIdAndUpdate(
    cardId,
    {
      status:         isPhysical ? "approved" : "active",
      creditLimit:    data.creditLimit,
      spendingLimit:  data.spendingLimit,
      cardNumber:     full,
      cvv,
      expiryMonth,
      expiryYear,
      cardholderName: `${user.firstName as string} ${user.lastName as string}`.toUpperCase(),
      reviewedBy:     new mongoose.Types.ObjectId(adminId),
      approvedAt:     now,
      ...(isPhysical ? { deliveryStatus: "processing" } : {}),
      ...(data.adminNote ? { adminNote: data.adminNote } : {}),
    },
    { new: true }
  )

  await createAuditLog(adminId, adminEmail, "card.approve", "CardApplication", cardId, {
    cardNetwork: network, cardType: card.cardType, creditLimit: data.creditLimit, last4, physical: isPhysical,
  }, req)

  const approvedDetails = cardEmailDetails({
    cardNumber:  full,
    cardNetwork: network as string,
    cardType:    card.cardType,
    isVirtual:   !isPhysical,
  })

  await notifyCardUser(
    String((user as Record<string, unknown>)._id ?? card.userId),
    "Card application approved",
    isPhysical
      ? `Good news — your card application has been approved. We are now preparing your physical card ending in ${last4} for delivery.`
      : `Good news — your card application has been approved. Your virtual card ending in ${last4} is active and ready to use.`,
    cardId,
    "positive",
    {
      card: approvedDetails,
      nextSteps: isPhysical
        ? [
            "We are preparing your card for dispatch.",
            "We will email you as soon as it ships.",
            "Delivery normally takes 3–5 business days.",
            "Your card activates automatically once it is delivered.",
          ]
        : [
            "Your card number, expiry date and CVV are available in the app.",
            "Set a card PIN and a daily spending limit whenever you like.",
            "You can freeze the card instantly if you ever need to.",
          ],
      subject: isPhysical
        ? `Your card ending ${last4} has been approved and is being prepared`
        : `Your card ending ${last4} is now active`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── rejectCard ────────────────────────────────────────────────────────────────

export async function rejectCard(
  cardId:     string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                     throw new Error("Card application not found")
  if (card.status !== "pending") throw new Error("Card application is not pending")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId,
    {
      status:     "rejected",
      adminNote:  reason,
      reviewedBy: new mongoose.Types.ObjectId(adminId),
      approvedAt: new Date(),
    },
    { new: true }
  )

  await createAuditLog(adminId, adminEmail, "card.reject", "CardApplication", cardId, { reason }, req)
  await notifyCardUser(
    String(card.userId), "Card application declined",
    `Your card application has been declined. Reason: ${reason}`, cardId, "warning"
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── updateCardDelivery ────────────────────────────────────────────────────────
// Advances a physical card's fulfilment: processing → shipped → delivered.
// Marking "delivered" activates the card so the user can start using it.

export async function updateCardDelivery(
  cardId:         string,
  deliveryStatus: "processing" | "shipped" | "delivered",
  adminId:        string,
  adminEmail:     string,
  req?:           Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                     throw new Error("Card not found")
  if (card.isVirtual !== false)  throw new Error("Only physical cards have a delivery status")
  if (!["approved", "active"].includes(card.status))
    throw new Error("The card must be approved before updating its delivery status")

  const now = new Date()
  const updates: Record<string, unknown> = { deliveryStatus }
  if (deliveryStatus === "shipped")   updates.shippedAt = now
  if (deliveryStatus === "delivered") { updates.deliveredAt = now; updates.status = "active" }

  const updated = await CardApplication.findByIdAndUpdate(cardId, updates, { new: true })
  const last4 = card.cardNumber?.slice(-4) ?? "****"

  await createAuditLog(adminId, adminEmail, "card.delivery_update", "CardApplication", cardId, { deliveryStatus }, req)

  const DELIVERY_COPY = {
    processing: {
      title:   "Your card is being prepared",
      message: `We are preparing your physical card ending in ${last4} for dispatch.`,
      subject: `Your card ending ${last4} is being prepared for delivery`,
      steps: [
        "Your card is being personalised and packaged.",
        "We will email you as soon as it ships.",
        "Delivery normally takes 3–5 business days from dispatch.",
      ],
      tone: "neutral" as const,
    },
    shipped: {
      title:   "Your card is on its way",
      message: `Your physical card ending in ${last4} has shipped and is on its way to your delivery address.`,
      subject: `Your card ending ${last4} has shipped`,
      steps: [
        "Delivery normally takes 3–5 business days.",
        "Your card will activate automatically once it is delivered.",
        "No action is needed from you until it arrives.",
      ],
      tone: "neutral" as const,
    },
    delivered: {
      title:   "Your card is delivered and active",
      message: `Your physical card ending in ${last4} has been delivered and is now active and ready to use.`,
      subject: `Your card ending ${last4} has been delivered and is now active`,
      steps: [
        "Set or change your card PIN in the app before your first use.",
        "Review your daily spending limit at any time.",
        "You can freeze the card instantly if it is ever lost or stolen.",
      ],
      tone: "positive" as const,
    },
  }[deliveryStatus]

  await notifyCardUser(
    String(card.userId),
    DELIVERY_COPY.title,
    DELIVERY_COPY.message,
    cardId,
    DELIVERY_COPY.tone,
    {
      card: cardEmailDetails(card),
      nextSteps: DELIVERY_COPY.steps,
      subject: DELIVERY_COPY.subject,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── freezeCard ────────────────────────────────────────────────────────────────

export async function freezeCard(
  cardId:     string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                    throw new Error("Card not found")
  if (card.status !== "active") throw new Error("Card is not active")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId, { status: "frozen", adminNote: reason }, { new: true }
  )

  const last4 = card.cardNumber?.slice(-4) ?? "****"
  await createAuditLog(adminId, adminEmail, "card.freeze", "CardApplication", cardId, { reason }, req)
  await notifyCardUser(
    String(card.userId), "Card frozen",
    `Your card ending in ${last4} has been temporarily frozen. Reason: ${reason}`, cardId, "warning",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "No payments can be made with this card while it is frozen.",
        "Existing scheduled payments may be declined.",
        "Contact us if you believe this was done in error.",
      ],
      subject: `Your card ending ${last4} has been frozen`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── unfreezeCard ──────────────────────────────────────────────────────────────

export async function unfreezeCard(
  cardId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                     throw new Error("Card not found")
  if (card.status !== "frozen")  throw new Error("Card is not frozen")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId, { status: "active" }, { new: true }
  )

  const last4 = card.cardNumber?.slice(-4) ?? "****"
  await createAuditLog(adminId, adminEmail, "card.unfreeze", "CardApplication", cardId, {}, req)
  await notifyCardUser(
    String(card.userId), "Card unfrozen",
    `Your card ending in ${last4} has been unfrozen and is active again.`, cardId, "positive",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "You can use this card for payments again straight away.",
        "Review your daily spending limit in the app if you need to.",
      ],
      subject: `Your card ending ${last4} is active again`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── blockCard ─────────────────────────────────────────────────────────────────
// Admin-enforced hard block (e.g. fraud / compliance). Unlike a freeze — which
// the user can lift themselves — a blocked card can only be restored by an admin.

export async function blockCard(
  cardId:     string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                                        throw new Error("Card not found")
  if (!["active", "frozen"].includes(card.status))  throw new Error("Only active or frozen cards can be blocked")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId, { status: "blocked", adminNote: reason }, { new: true }
  )

  const last4 = card.cardNumber?.slice(-4) ?? "****"
  await createAuditLog(adminId, adminEmail, "card.block", "CardApplication", cardId, { reason }, req)
  await notifyCardUser(
    String(card.userId), "Card blocked",
    `Your card ending in ${last4} has been blocked. Reason: ${reason}`, cardId, "warning",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "This card can no longer be used for payments.",
        "For your protection, only our team can lift this block.",
        "Please contact support so we can review your account with you.",
      ],
      subject: `Your card ending ${last4} has been blocked`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── unblockCard ───────────────────────────────────────────────────────────────

export async function unblockCard(
  cardId:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                     throw new Error("Card not found")
  if (card.status !== "blocked") throw new Error("Card is not blocked")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId, { status: "active" }, { new: true }
  )

  const last4 = card.cardNumber?.slice(-4) ?? "****"
  await createAuditLog(adminId, adminEmail, "card.unblock", "CardApplication", cardId, {}, req)
  await notifyCardUser(
    String(card.userId), "Card unblocked",
    `Your card ending in ${last4} has been unblocked and is active again.`, cardId, "positive",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "You can use this card for payments again straight away.",
        "You can freeze it yourself at any time from the app.",
      ],
      subject: `Your card ending ${last4} is active again`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── cancelCard ────────────────────────────────────────────────────────────────

export async function cancelCard(
  cardId:     string,
  reason:     string,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card) throw new Error("Card not found")
  if (!["active", "frozen", "blocked"].includes(card.status)) throw new Error("Card cannot be cancelled in its current state")

  const updated = await CardApplication.findByIdAndUpdate(
    cardId,
    { status: "cancelled", cancelledAt: new Date(), adminNote: reason },
    { new: true }
  )

  const cancelLast4 = card.cardNumber?.slice(-4) ?? "****"
  await createAuditLog(adminId, adminEmail, "card.cancel", "CardApplication", cardId, { reason }, req)
  await notifyCardUser(
    String(card.userId), "Card cancelled",
    `Your card ending in ${cancelLast4} has been cancelled. Reason: ${reason}`, cardId, "warning",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "This card is permanently cancelled and can no longer be used.",
        "Any recurring payments on this card will stop.",
        "You can apply for a replacement card at any time in the app.",
      ],
      subject: `Your card ending ${cancelLast4} has been cancelled`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── updateCardLimits ──────────────────────────────────────────────────────────

export async function updateCardLimits(
  cardId:       string,
  limits:       { creditLimit?: number; spendingLimit?: number },
  adminId:      string,
  adminEmail:   string,
  req?:         Request
): Promise<Record<string, unknown>> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card)                    throw new Error("Card not found")
  if (card.status !== "active") throw new Error("Card is not active")

  const last4   = card.cardNumber?.slice(-4) ?? "****"
  const updates: Record<string, unknown> = {}
  if (limits.creditLimit  != null) updates.creditLimit  = limits.creditLimit
  if (limits.spendingLimit != null) updates.spendingLimit = limits.spendingLimit

  const updated = await CardApplication.findByIdAndUpdate(cardId, updates, { new: true })

  await createAuditLog(adminId, adminEmail, "card.limits_updated", "CardApplication", cardId, limits as Record<string, unknown>, req)
  await notifyCardUser(
    String(card.userId), "Card limits updated",
    `The spending limits on your card ending in ${last4} have been updated.`, cardId, "neutral",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "You can view your current limits in the app at any time.",
        "Contact us if these limits do not look right to you.",
      ],
      subject: `Spending limits updated on your card ending ${last4}`,
    }
  )

  return (updated!.toObject()) as unknown as Record<string, unknown>
}

// ── adminUpdateCard ───────────────────────────────────────────────────────────
// Full admin edit of a card's attributes (number, CVV, expiry, PIN, limits,
// status, etc.). Values are validated/sanitised before persisting.

const CARD_STATUSES = ["pending", "approved", "rejected", "active", "frozen", "blocked", "cancelled"]
const DELIVERY_STATUSES = ["processing", "shipped", "delivered"]

export async function adminUpdateCard(
  cardId:     string,
  updates:    AdminCardUpdate,
  adminId:    string,
  adminEmail: string,
  req?:       Request
): Promise<CardDetail | null> {
  await connectDB()

  const card = await CardApplication.findById(cardId)
  if (!card) throw new Error("Card not found")

  const set: Record<string, unknown> = {}

  if (updates.cardNetwork) {
    if (!["visa", "mastercard", "amex"].includes(updates.cardNetwork)) throw new Error("Invalid card network")
    set.cardNetwork = updates.cardNetwork
  }
  if (updates.cardType) {
    if (!["debit", "credit"].includes(updates.cardType)) throw new Error("Invalid card type")
    set.cardType = updates.cardType
  }
  if (updates.isVirtual !== undefined) set.isVirtual = !!updates.isVirtual

  if (updates.cardholderName !== undefined) {
    set.cardholderName = updates.cardholderName.trim().toUpperCase() || undefined
  }
  if (updates.cardNumber !== undefined) {
    const digits = updates.cardNumber.replace(/\D/g, "")
    if (digits && (digits.length < 13 || digits.length > 19)) throw new Error("Card number must be 13–19 digits")
    set.cardNumber = digits || undefined
  }
  if (updates.cvv !== undefined) {
    const c = updates.cvv.replace(/\D/g, "")
    if (c && !/^\d{3,4}$/.test(c)) throw new Error("CVV must be 3 or 4 digits")
    set.cvv = c || undefined
  }
  if (updates.expiryMonth !== undefined) {
    if (updates.expiryMonth < 1 || updates.expiryMonth > 12) throw new Error("Expiry month must be 1–12")
    set.expiryMonth = updates.expiryMonth
  }
  if (updates.expiryYear !== undefined) {
    if (updates.expiryYear < 2000 || updates.expiryYear > 2100) throw new Error("Invalid expiry year")
    set.expiryYear = updates.expiryYear
  }
  if (updates.cardPin !== undefined) {
    const p = updates.cardPin.replace(/\D/g, "")
    if (p && !/^\d{4}$/.test(p)) throw new Error("PIN must be exactly 4 digits")
    set.cardPin = p || undefined
  }
  if (updates.creditLimit !== undefined)     set.creditLimit     = Math.max(0, updates.creditLimit)
  if (updates.spendingLimit !== undefined)   set.spendingLimit   = Math.max(0, updates.spendingLimit)
  if (updates.dailySpendLimit !== undefined) set.dailySpendLimit = Math.max(0, updates.dailySpendLimit)

  if (updates.status) {
    if (!CARD_STATUSES.includes(updates.status)) throw new Error("Invalid status")
    set.status = updates.status
  }
  if (updates.deliveryStatus !== undefined) {
    if (updates.deliveryStatus && !DELIVERY_STATUSES.includes(updates.deliveryStatus)) throw new Error("Invalid delivery status")
    set.deliveryStatus = updates.deliveryStatus || undefined
  }
  if (updates.adminNote !== undefined) set.adminNote = updates.adminNote.trim() || undefined

  await CardApplication.findByIdAndUpdate(cardId, { $set: set }, { new: true })

  await createAuditLog(adminId, adminEmail, "card.updated", "CardApplication", cardId, set, req)
  const updatedLast4 = card.cardNumber?.slice(-4) ?? "****"
  await notifyCardUser(
    String(card.userId), "Card details updated",
    `The details on your card ending in ${updatedLast4} have been updated by our team.`, cardId, "neutral",
    {
      card: cardEmailDetails(card),
      nextSteps: [
        "Review the updated details in the app.",
        "Contact us straight away if you did not expect this change.",
      ],
      subject: `Details updated on your card ending ${updatedLast4}`,
    }
  )

  return getCardById(cardId)
}
