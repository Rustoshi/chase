import mongoose, { Document, Model, Schema } from "mongoose"

export type LoanStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "active"
  | "closed"
  | "defaulted"

export type LoanType = "personal" | "auto" | "home" | "education" | "business"

export type EmploymentStatus = "employed" | "self_employed" | "retired" | "student" | "other"

export interface ILoanApplication extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  loanType: LoanType
  amount: number
  purpose: string
  termMonths: number
  status: LoanStatus
  employmentStatus?: EmploymentStatus
  employer?: string
  monthlyIncome?: number
  interestRate?: number
  monthlyPayment?: number
  outstandingBalance?: number
  totalPaid: number
  nextPaymentDate?: Date
  gracePeriodDays: number
  lateFeePercent: number
  adminNote?: string
  reviewedBy?: mongoose.Types.ObjectId
  appliedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  closedAt?: Date
}

const LoanApplicationSchema = new Schema<ILoanApplication>(
  {
    userId:             { type: Schema.Types.ObjectId, ref: "User", required: true },
    loanType:           { type: String, enum: ["personal", "auto", "home", "education", "business"], default: "personal" },
    amount:             { type: Number, required: true, min: 0 },
    purpose:            { type: String, required: true, trim: true },
    termMonths:         { type: Number, required: true, min: 1 },
    status:             {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "closed", "defaulted"],
      default: "pending",
    },
    employmentStatus:   { type: String, enum: ["employed", "self_employed", "retired", "student", "other"] },
    employer:           { type: String, trim: true },
    monthlyIncome:      { type: Number, min: 0 },
    interestRate:       { type: Number, min: 0 },
    monthlyPayment:     { type: Number, min: 0 },
    outstandingBalance: { type: Number, min: 0 },
    totalPaid:          { type: Number, default: 0, min: 0 },
    nextPaymentDate:    { type: Date },
    gracePeriodDays:    { type: Number, default: 5, min: 0 },
    lateFeePercent:     { type: Number, default: 2, min: 0 },
    adminNote:          { type: String },
    reviewedBy:         { type: Schema.Types.ObjectId, ref: "User" },
    appliedAt:          { type: Date, default: () => new Date() },
    approvedAt:         { type: Date },
    rejectedAt:         { type: Date },
    closedAt:           { type: Date },
  },
  { timestamps: false }
)

LoanApplicationSchema.index({ userId: 1 })
LoanApplicationSchema.index({ status: 1 })
LoanApplicationSchema.index({ userId: 1, status: 1 })

const LoanApplication: Model<ILoanApplication> =
  (mongoose.models.LoanApplication as Model<ILoanApplication>) ??
  mongoose.model<ILoanApplication>("LoanApplication", LoanApplicationSchema)

export default LoanApplication
