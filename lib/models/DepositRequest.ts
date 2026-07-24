import mongoose, { Document, Model, Schema } from "mongoose"

export type DepositRequestStatus = "pending" | "confirmed" | "rejected"

export interface IDepositRequest extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  accountId: mongoose.Types.ObjectId
  paymentMethodId: mongoose.Types.ObjectId
  requestedAmount: number
  requestedCurrency: string
  proofUrl?: string
  proofPublicId?: string
  txReference?: string
  notes?: string
  status: DepositRequestStatus
  confirmedAmount?: number
  adminNote?: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  creditedTransactionId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const DepositRequestSchema = new Schema<IDepositRequest>(
  {
    userId:               { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountId:            { type: Schema.Types.ObjectId, ref: "Account", required: true },
    paymentMethodId:      { type: Schema.Types.ObjectId, ref: "PaymentMethod", required: true },
    requestedAmount:      { type: Number, required: true, min: 0 },
    requestedCurrency:    { type: String, required: true, uppercase: true, trim: true },
    proofUrl:             { type: String },
    proofPublicId:        { type: String },
    txReference:          { type: String, trim: true },
    notes:                { type: String },
    status:               { type: String, enum: ["pending", "confirmed", "rejected"], default: "pending" },
    confirmedAmount:      { type: Number, min: 0 },
    adminNote:            { type: String },
    reviewedBy:           { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt:           { type: Date },
    creditedTransactionId:{ type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
)

DepositRequestSchema.index({ userId: 1 })
DepositRequestSchema.index({ status: 1 })
DepositRequestSchema.index({ createdAt: -1 })

const DepositRequest: Model<IDepositRequest> =
  (mongoose.models.DepositRequest as Model<IDepositRequest>) ??
  mongoose.model<IDepositRequest>("DepositRequest", DepositRequestSchema)

export default DepositRequest
