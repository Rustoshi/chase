import mongoose, { Document, Model, Schema } from "mongoose"

export type TaxRefundStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "deposited"
  | "rejected"

export type FilingType = "individual" | "joint" | "business"

export interface ITaxDocument {
  name: string
  docType: string
  taxYear: number
}

export interface ITaxRefund extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  taxYear: number
  filingType: FilingType
  totalReportedIncome: number
  totalTaxWithheld: number
  refundAmount: number
  ssnLast4: string
  employer?: string
  depositAccountId: mongoose.Types.ObjectId
  status: TaxRefundStatus
  referenceNumber: string
  documents: ITaxDocument[]
  filingDate: Date
  estimatedDepositDate?: Date
  actualDepositDate?: Date
  adminNote?: string
  rejectedReason?: string
  reviewedBy?: mongoose.Types.ObjectId
  reviewedAt?: Date
  depositedAt?: Date
}

const TaxDocumentSchema = new Schema<ITaxDocument>(
  {
    name:    { type: String, required: true },
    docType: { type: String, required: true },
    taxYear: { type: Number, required: true },
  },
  { _id: false }
)

const TaxRefundSchema = new Schema<ITaxRefund>(
  {
    userId:               { type: Schema.Types.ObjectId, ref: "User", required: true },
    taxYear:              { type: Number, required: true, min: 2000, max: 2099 },
    filingType:           { type: String, enum: ["individual", "joint", "business"], required: true },
    totalReportedIncome:  { type: Number, required: true, min: 0 },
    totalTaxWithheld:     { type: Number, required: true, min: 0 },
    refundAmount:         { type: Number, required: true, min: 0 },
    ssnLast4:             { type: String, required: true, minlength: 4, maxlength: 4 },
    employer:             { type: String, trim: true },
    depositAccountId:     { type: Schema.Types.ObjectId, ref: "Account", required: true },
    status:               {
      type: String,
      enum: ["pending", "under_review", "approved", "deposited", "rejected"],
      default: "pending",
    },
    referenceNumber:      { type: String, unique: true, required: true },
    documents:            { type: [TaxDocumentSchema], default: [] },
    filingDate:           { type: Date, default: () => new Date() },
    estimatedDepositDate: { type: Date },
    actualDepositDate:    { type: Date },
    adminNote:            { type: String },
    rejectedReason:       { type: String },
    reviewedBy:           { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt:           { type: Date },
    depositedAt:          { type: Date },
  },
  { timestamps: false }
)

TaxRefundSchema.index({ userId: 1 })
TaxRefundSchema.index({ status: 1 })
TaxRefundSchema.index({ userId: 1, taxYear: 1 }, { unique: true })
TaxRefundSchema.index({ referenceNumber: 1 })

const TaxRefund: Model<ITaxRefund> =
  (mongoose.models.TaxRefund as Model<ITaxRefund>) ??
  mongoose.model<ITaxRefund>("TaxRefund", TaxRefundSchema)

export default TaxRefund
