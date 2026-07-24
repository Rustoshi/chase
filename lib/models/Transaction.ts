import mongoose, { Document, Model, Schema } from "mongoose"

export type TransactionType =
  | "deposit"
  | "withdrawal"
  | "transfer_in"
  | "transfer_out"
  | "admin_deposit"
  | "fx_conversion"
  | "swap_in"
  | "swap_out"
  | "fee"
  | "refund"
  | "loan_disbursement"
  | "loan_repayment"
  | "tax_refund_deposit"
  | "grant_disbursement"
  | "card_payment"

export type TransactionStatus = "pending" | "completed" | "failed" | "reversed" | "processing"
export type TransferType = "internal" | "local_external" | "international"

export interface IPartyDetails {
  name?: string
  accountNumber?: string
  routingNumber?: string
  bankName?: string
  swiftCode?: string
  iban?: string
  country?: string
  bankAddress?: string
  email?: string
}

export interface IExternalRecipient {
  name?: string
  accountNumber?: string
  routingNumber?: string
  bankName?: string
  swiftCode?: string
  iban?: string
  country?: string
  bankAddress?: string
}

export interface ITransactionMetadata {
  [key: string]: unknown
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId
  accountId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description?: string
  reference: string
  toAccountId?: mongoose.Types.ObjectId
  fromAccountId?: mongoose.Types.ObjectId
  sender?: IPartyDetails
  receiver?: IPartyDetails
  externalRecipient?: IExternalRecipient
  transferType?: TransferType
  swapFromWallet?: string
  swapToWallet?: string
  btcRateAtTime?: number
  feeAmount?: number
  feePercent?: number
  exchangeRate?: number
  convertedAmount?: number
  convertedCurrency?: string
  balanceBefore?: number
  balanceAfter?: number
  isGenerated: boolean
  metadata?: ITransactionMetadata
  processedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const PartyDetailsSchema = new Schema<IPartyDetails>(
  {
    name:          String,
    accountNumber: String,
    routingNumber: String,
    bankName:      String,
    swiftCode:     String,
    iban:          String,
    country:       String,
    bankAddress:   String,
    email:         String,
  },
  { _id: false }
)

const ExternalRecipientSchema = new Schema<IExternalRecipient>(
  {
    name:          String,
    accountNumber: String,
    routingNumber: String,
    bankName:      String,
    swiftCode:     String,
    iban:          String,
    country:       String,
    bankAddress:   String,
  },
  { _id: false }
)

const TransactionSchema = new Schema<ITransaction>(
  {
    accountId:        { type: Schema.Types.ObjectId, ref: "Account", required: true },
    userId:           { type: Schema.Types.ObjectId, ref: "User", required: true },
    type:             {
      type: String,
      enum: [
        "deposit", "withdrawal", "transfer_in", "transfer_out",
        "admin_deposit", "fx_conversion", "swap_in", "swap_out",
        "fee", "refund", "loan_disbursement", "loan_repayment",
        "tax_refund_deposit", "grant_disbursement", "card_payment",
      ],
      required: true,
    },
    amount:           { type: Number, required: true },
    currency:         { type: String, required: true, uppercase: true, trim: true },
    status:           {
      type: String,
      enum: ["pending", "completed", "failed", "reversed", "processing"],
      default: "pending",
    },
    description:      { type: String },
    reference:        { type: String, unique: true, required: true },
    toAccountId:      { type: Schema.Types.ObjectId, ref: "Account" },
    fromAccountId:    { type: Schema.Types.ObjectId, ref: "Account" },
    sender:           { type: PartyDetailsSchema },
    receiver:         { type: PartyDetailsSchema },
    externalRecipient:{ type: ExternalRecipientSchema },
    transferType:     { type: String, enum: ["internal", "local_external", "international"] },
    swapFromWallet:   { type: String },
    swapToWallet:     { type: String },
    btcRateAtTime:    { type: Number },
    feeAmount:        { type: Number },
    feePercent:       { type: Number },
    exchangeRate:     { type: Number },
    convertedAmount:  { type: Number },
    convertedCurrency:{ type: String, uppercase: true, trim: true },
    balanceBefore:    { type: Number },
    balanceAfter:     { type: Number },
    isGenerated:      { type: Boolean, default: false },
    metadata:         { type: Schema.Types.Mixed },
    processedAt:      { type: Date },
  },
  { timestamps: true }
)

TransactionSchema.index({ userId: 1 })
TransactionSchema.index({ accountId: 1 })
// reference already carries unique:true in its field definition
TransactionSchema.index({ status: 1 })
TransactionSchema.index({ createdAt: -1 })

const Transaction: Model<ITransaction> =
  (mongoose.models.Transaction as Model<ITransaction>) ??
  mongoose.model<ITransaction>("Transaction", TransactionSchema)

export default Transaction
