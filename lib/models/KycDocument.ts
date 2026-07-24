import mongoose, { Document, Model, Schema } from "mongoose"

export type KycDocType =
  | "passport"
  | "drivers_license"
  | "national_id"
  | "selfie"
  | "address_proof"
  | "utility_bill"
  | "ssn_proof"

export type KycDocStatus = "pending" | "approved" | "rejected"

export interface IKycDocument extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  docType: KycDocType
  docUrl?: string
  docPublicId?: string
  status: KycDocStatus
  reviewNote?: string
  reviewedBy?: mongoose.Types.ObjectId
  submittedAt: Date
  reviewedAt?: Date
  // Personal info submitted with KYC
  dateOfBirth?: Date
  ssn?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
}

const KycDocumentSchema = new Schema<IKycDocument>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    docType:     {
      type: String,
      enum: ["passport", "drivers_license", "national_id", "selfie", "address_proof", "utility_bill", "ssn_proof"],
      required: true,
    },
    docUrl:      { type: String },
    docPublicId: { type: String },
    status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewNote:  { type: String },
    reviewedBy:  { type: Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date, default: () => new Date() },
    reviewedAt:  { type: Date },
    // Personal info submitted with KYC
    dateOfBirth: { type: Date },
    ssn:         { type: String },
    address: {
      street:  { type: String },
      city:    { type: String },
      state:   { type: String },
      zip:     { type: String },
      country: { type: String },
    },
  },
  { timestamps: false }
)

KycDocumentSchema.index({ userId: 1 })
KycDocumentSchema.index({ status: 1 })

const KycDocument: Model<IKycDocument> =
  (mongoose.models.KycDocument as Model<IKycDocument>) ??
  mongoose.model<IKycDocument>("KycDocument", KycDocumentSchema)

export default KycDocument
