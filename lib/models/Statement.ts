import mongoose, { Document, Model, Schema } from "mongoose"

export type StatementStatus = "pending" | "generating" | "ready" | "failed" | "expired"
export type StatementFormat = "pdf" | "csv"

export interface IStatement extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  accountId: mongoose.Types.ObjectId
  referenceNumber: string
  startDate: Date
  endDate: Date
  format: StatementFormat
  status: StatementStatus
  fileUrl?: string
  filePublicId?: string
  openingBalance: number
  closingBalance: number
  totalCredits: number
  totalDebits: number
  transactionCount: number
  requestedAt: Date
  generatedAt?: Date
  expiresAt?: Date
  downloadCount: number
  emailSent: boolean
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

const StatementSchema = new Schema<IStatement>(
  {
    userId:          { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountId:       { type: Schema.Types.ObjectId, ref: "Account", required: true },
    referenceNumber: { type: String, unique: true, required: true },
    startDate:       { type: Date, required: true },
    endDate:         { type: Date, required: true },
    format:          { type: String, enum: ["pdf", "csv"], default: "pdf" },
    status:          {
      type: String,
      enum: ["pending", "generating", "ready", "failed", "expired"],
      default: "pending",
    },
    fileUrl:         { type: String },
    filePublicId:    { type: String },
    openingBalance:  { type: Number, default: 0 },
    closingBalance:  { type: Number, default: 0 },
    totalCredits:    { type: Number, default: 0 },
    totalDebits:     { type: Number, default: 0 },
    transactionCount:{ type: Number, default: 0 },
    requestedAt:     { type: Date, default: Date.now },
    generatedAt:     { type: Date },
    expiresAt:       { type: Date },
    downloadCount:   { type: Number, default: 0 },
    emailSent:       { type: Boolean, default: false },
    errorMessage:    { type: String },
  },
  { timestamps: true }
)

StatementSchema.index({ userId: 1 })
StatementSchema.index({ accountId: 1 })
StatementSchema.index({ status: 1 })
StatementSchema.index({ requestedAt: -1 })

const Statement: Model<IStatement> =
  (mongoose.models.Statement as Model<IStatement>) ??
  mongoose.model<IStatement>("Statement", StatementSchema)

export default Statement
