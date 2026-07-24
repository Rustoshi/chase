import mongoose, { Document, Model, Schema } from "mongoose"

export type GrantType = "personal" | "business" | "education" | "housing" | "medical" | "emergency"

export type GrantStatus = "pending" | "under_review" | "approved" | "rejected" | "disbursed"

export interface IGrantDocument {
  name: string
  docUrl: string
  docPublicId?: string
}

export interface IGrantApplication extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  grantType: GrantType
  amount: number
  approvedAmount?: number
  purpose: string
  supportingInfo?: string
  documents: IGrantDocument[]
  status: GrantStatus
  depositAccountId: mongoose.Types.ObjectId
  referenceNumber: string
  adminNote?: string
  rejectedReason?: string
  reviewedBy?: mongoose.Types.ObjectId
  appliedAt: Date
  reviewedAt?: Date
  disbursedAt?: Date
}

const GrantDocumentSchema = new Schema<IGrantDocument>(
  {
    name:        { type: String, required: true },
    docUrl:      { type: String, required: true },
    docPublicId: { type: String },
  },
  { _id: false }
)

const GrantApplicationSchema = new Schema<IGrantApplication>(
  {
    userId:           { type: Schema.Types.ObjectId, ref: "User", required: true },
    grantType:        {
      type: String,
      enum: ["personal", "business", "education", "housing", "medical", "emergency"],
      required: true,
    },
    amount:           { type: Number, required: true, min: 0 },
    approvedAmount:   { type: Number, min: 0 },
    purpose:          { type: String, required: true, trim: true },
    supportingInfo:   { type: String, trim: true },
    documents:        { type: [GrantDocumentSchema], default: [] },
    status:           {
      type: String,
      enum: ["pending", "under_review", "approved", "rejected", "disbursed"],
      default: "pending",
    },
    depositAccountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    referenceNumber:  { type: String, required: true, unique: true },
    adminNote:        { type: String },
    rejectedReason:   { type: String },
    reviewedBy:       { type: Schema.Types.ObjectId, ref: "User" },
    appliedAt:        { type: Date, default: () => new Date() },
    reviewedAt:       { type: Date },
    disbursedAt:      { type: Date },
  },
  { timestamps: false }
)

GrantApplicationSchema.index({ userId: 1 })
GrantApplicationSchema.index({ status: 1 })
GrantApplicationSchema.index({ userId: 1, status: 1 })
GrantApplicationSchema.index({ referenceNumber: 1 }, { unique: true })

const GrantApplication: Model<IGrantApplication> =
  (mongoose.models.GrantApplication as Model<IGrantApplication>) ??
  mongoose.model<IGrantApplication>("GrantApplication", GrantApplicationSchema)

export default GrantApplication
