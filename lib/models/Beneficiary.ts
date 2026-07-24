import mongoose, { Schema, Document, Model } from "mongoose"

export type BeneficiaryType = "local" | "international"

export interface IBeneficiary extends Document {
  userId:          mongoose.Types.ObjectId
  type:            BeneficiaryType
  nickname:        string
  // Local transfer fields
  accountNumber?:  string
  recipientName?:  string
  bankName?:       string
  // International wire transfer fields
  iban?:           string
  swiftCode?:      string
  routingNumber?:  string
  bankAddress?:    string
  country?:        string
  currency?:       string
  // Metadata
  lastUsedAt?:     Date
  transferCount:   number
  isActive:        boolean
  createdAt:       Date
  updatedAt:       Date
}

const BeneficiarySchema = new Schema<IBeneficiary>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    type: {
      type:     String,
      enum:     ["local", "international"],
      required: true,
    },
    nickname: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 100,
    },
    // Local transfer fields
    accountNumber: {
      type: String,
      trim: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    // International wire transfer fields
    iban: {
      type: String,
      trim: true,
    },
    swiftCode: {
      type: String,
      trim: true,
    },
    routingNumber: {
      type: String,
      trim: true,
    },
    bankAddress: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    currency: {
      type:    String,
      trim:    true,
      default: "USD",
    },
    // Metadata
    lastUsedAt: {
      type: Date,
    },
    transferCount: {
      type:    Number,
      default: 0,
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound index for efficient queries
BeneficiarySchema.index({ userId: 1, type: 1, isActive: 1 })
BeneficiarySchema.index({ userId: 1, nickname: 1 }, { unique: true })

const Beneficiary: Model<IBeneficiary> =
  mongoose.models.Beneficiary || mongoose.model<IBeneficiary>("Beneficiary", BeneficiarySchema)

export default Beneficiary
