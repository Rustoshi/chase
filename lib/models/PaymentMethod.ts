import mongoose, { Document, Model, Schema } from "mongoose"

export type PaymentMethodType =
  | "bank_transfer"
  | "paypal"
  | "bitcoin"
  | "venmo"
  | "cash_app"
  | "zelle"
  | "wire"
  | "crypto_other"
  | "giftcard"

export type DepositTarget = "fiat" | "bitcoin"

// Payment info fields based on method type
export interface IPaymentInfo {
  // Bank transfer / Wire
  bankName?: string
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  swiftCode?: string
  iban?: string
  bankAddress?: string
  // PayPal / Venmo / Zelle / Cash App
  email?: string
  username?: string
  phoneNumber?: string
  // Bitcoin / Crypto
  walletAddress?: string
  network?: string
  // Gift card
  acceptedBrands?: string[]
  redemptionInstructions?: string
}

export interface IPaymentMethod extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  type: PaymentMethodType
  isEnabled: boolean
  instructions?: string
  depositTarget: DepositTarget
  icon?: string
  logoUrl?: string
  logoPublicId?: string
  minAmount: number
  maxAmount?: number
  feePercent: number
  feeFixed: number
  sortOrder: number
  paymentInfo?: IPaymentInfo
  createdAt: Date
  updatedAt: Date
}

const PaymentInfoSchema = new Schema({
  bankName:               { type: String },
  accountName:            { type: String },
  accountNumber:          { type: String },
  routingNumber:          { type: String },
  swiftCode:              { type: String },
  iban:                   { type: String },
  bankAddress:            { type: String },
  email:                  { type: String },
  username:               { type: String },
  phoneNumber:            { type: String },
  walletAddress:          { type: String },
  network:                { type: String },
  acceptedBrands:         { type: [String] },
  redemptionInstructions: { type: String },
}, { _id: false })

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name:          { type: String, required: true, trim: true },
    slug:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    type:          {
      type: String,
      enum: ["bank_transfer", "paypal", "bitcoin", "venmo", "cash_app", "zelle", "wire", "crypto_other", "giftcard"],
      required: true,
    },
    isEnabled:     { type: Boolean, default: false },
    instructions:  { type: String },
    depositTarget: { type: String, enum: ["fiat", "bitcoin"], default: "fiat" },
    icon:          { type: String },
    logoUrl:       { type: String },
    logoPublicId:  { type: String },
    minAmount:     { type: Number, default: 0, min: 0 },
    maxAmount:     { type: Number, min: 0 },
    feePercent:    { type: Number, default: 0, min: 0 },
    feeFixed:      { type: Number, default: 0, min: 0 },
    sortOrder:     { type: Number, default: 0 },
    paymentInfo:   { type: PaymentInfoSchema },
  },
  { timestamps: true }
)

// slug already carries unique:true in its field definition
PaymentMethodSchema.index({ isEnabled: 1 })

const PaymentMethod: Model<IPaymentMethod> =
  (mongoose.models.PaymentMethod as Model<IPaymentMethod>) ??
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema)

export default PaymentMethod
