import mongoose, { Document, Model, Schema } from "mongoose"

export interface IAccount extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  walletType: "fiat" | "bitcoin"
  accountNumber: string
  // Fiat-only fields
  currency: string
  balance: number
  routingNumber?: string
  swiftCode?: string
  iban?: string
  accountType?: "checking" | "savings"
  // Bitcoin-only fields
  btcAddress?: string
  btcBalance: number
  // State
  isFrozen: boolean
  freezeReason?: string
  createdAt: Date
  updatedAt: Date
}

const AccountSchema = new Schema<IAccount>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: "User", required: true },
    walletType:    { type: String, enum: ["fiat", "bitcoin"], required: true },
    accountNumber: { type: String, unique: true, required: true },
    // Fiat
    currency:      { type: String, default: "USD", uppercase: true, trim: true },
    balance:       { type: Number, default: 0, min: 0 },
    routingNumber: { type: String },
    swiftCode:     { type: String },
    iban:          { type: String },
    accountType:   { type: String, enum: ["checking", "savings"], default: "checking" },
    // Bitcoin
    btcAddress:    { type: String },
    btcBalance:    { type: Number, default: 0, min: 0 },
    // State
    isFrozen:      { type: Boolean, default: false },
    freezeReason:  { type: String },
  },
  { timestamps: true }
)

AccountSchema.index({ userId: 1 })
// accountNumber already carries unique:true in its field definition

const Account: Model<IAccount> =
  (mongoose.models.Account as Model<IAccount>) ??
  mongoose.model<IAccount>("Account", AccountSchema)

export default Account
