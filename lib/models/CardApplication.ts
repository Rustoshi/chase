import mongoose, { Document, Model, Schema } from "mongoose"

export type CardNetwork = "visa" | "mastercard" | "amex"

export type CardType = "debit" | "credit"

export type CardStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "frozen"
  | "blocked"
  | "cancelled"

// Physical-card fulfilment tracking (virtual cards leave this unset)
export type CardDeliveryStatus = "processing" | "shipped" | "delivered"

export interface ICardBillingAddress {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

export interface ICardApplication extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  cardNetwork: CardNetwork
  cardType: CardType
  creditLimit?: number
  spendingLimit?: number
  preferredLimit?: number
  dailySpendLimit?: number
  balance: number
  status: CardStatus
  cardNumber?: string
  cvv?: string
  expiryMonth?: number
  expiryYear?: number
  cardholderName?: string
  cardPin?: string
  billingAddress?: ICardBillingAddress
  isVirtual: boolean
  applicationFee: number
  referenceNumber?: string
  adminNote?: string
  reviewedBy?: mongoose.Types.ObjectId
  appliedAt: Date
  approvedAt?: Date
  cancelledAt?: Date
  // Physical-card fulfilment (delivery address reuses billingAddress)
  deliveryStatus?: CardDeliveryStatus
  shippedAt?: Date
  deliveredAt?: Date
}

const BillingAddressSchema = new Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zip:     { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
)

const CardApplicationSchema = new Schema<ICardApplication>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: "User", required: true },
    cardNetwork:     {
      type: String,
      enum: ["visa", "mastercard", "amex"],
      required: true,
    },
    cardType:        {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    creditLimit:     { type: Number, min: 0 },
    spendingLimit:   { type: Number, min: 0 },
    preferredLimit:  { type: Number, min: 0 },
    dailySpendLimit: { type: Number, min: 0 },
    balance:         { type: Number, default: 0, min: 0 },
    status:          {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "frozen", "blocked", "cancelled"],
      default: "pending",
    },
    cardNumber:      { type: String },
    cvv:             { type: String },
    expiryMonth:     { type: Number, min: 1, max: 12 },
    expiryYear:      { type: Number },
    cardholderName:  { type: String, trim: true },
    cardPin:         { type: String },
    billingAddress:  { type: BillingAddressSchema },
    isVirtual:       { type: Boolean, default: true },
    applicationFee:  { type: Number, default: 0, min: 0 },
    referenceNumber: { type: String, unique: true, sparse: true },
    adminNote:       { type: String },
    reviewedBy:      { type: Schema.Types.ObjectId, ref: "User" },
    appliedAt:       { type: Date, default: () => new Date() },
    approvedAt:      { type: Date },
    cancelledAt:     { type: Date },
    deliveryStatus:  { type: String, enum: ["processing", "shipped", "delivered"] },
    shippedAt:       { type: Date },
    deliveredAt:     { type: Date },
  },
  { timestamps: false }
)

CardApplicationSchema.index({ userId: 1 })
CardApplicationSchema.index({ status: 1 })

const CardApplication: Model<ICardApplication> =
  (mongoose.models.CardApplication as Model<ICardApplication>) ??
  mongoose.model<ICardApplication>("CardApplication", CardApplicationSchema)

export default CardApplication
